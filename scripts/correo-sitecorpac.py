#!/usr/bin/env python3
"""
Plantilla única de los correos de alerta de SITECORPAC (HTML + texto).

La usan el vigía, alertas-sitecorpac.sh, /root/monitor.sh y el respaldo diario,
para que todos los avisos se vean igual y se entiendan de un vistazo:
franja y etiqueta de color según la gravedad, título, resumen, secciones,
botón al panel y pie con la hora de Perú.

Se instala COPIANDO este archivo a /root (igual que los otros scripts):
  install -o root -m 700 scripts/correo-sitecorpac.py /root/correo_sitecorpac.py

Uso desde bash (el cuerpo va por la entrada estándar):
  printf '%s' "$CUERPO" | python3 /root/correo_sitecorpac.py \
      --nivel critico --asunto "El sitio no carga" --titulo "El sitio no carga" \
      --resumen "Desde las 10:05 el sitio no responde." --origen "Vigía (cada minuto)"

Uso desde Python:
  from correo_sitecorpac import enviar
  enviar("critico", "Asunto", "Título", "Resumen", cuerpo, origen="Vigía")

Formato del cuerpo (texto simple, una cosa por línea):
  ## Título de sección
  • elemento de lista            (también "- " o "* ")
  Clave :: valor                 fila de tabla (dato)
  $ comando                      comando para copiar (caja gris)
  texto normal                   párrafo; una línea en blanco separa párrafos
  `texto`                        en cualquier línea, se muestra como código

Niveles: critico (rojo), aviso (ámbar), ok (verde), info (azul).
Si msmtp falla, se reintenta en texto plano con "mail", para no perder el aviso.
"""
import argparse
import datetime
import html
import re
import socket
import subprocess
import sys
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

# Datos privados (correo) en un archivo SOLO del servidor, fuera del repo
# público: /etc/sitecorpac/alertas.conf (root, 600), líneas CLAVE="valor".
def _leer_conf(ruta="/etc/sitecorpac/alertas.conf"):
    datos = {}
    try:
        with open(ruta, encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if linea and not linea.startswith("#") and "=" in linea:
                    clave, valor = linea.split("=", 1)
                    datos[clave.strip()] = valor.strip().strip('"').strip("'")
    except OSError:
        pass
    return datos


_CONF = _leer_conf()
DESTINO = _CONF.get("DESTINO", "")
REMITENTE = _CONF.get("REMITENTE", "") or DESTINO
NOMBRE_REMITENTE = "Alertas SITECORPAC"
PANEL = "https://sitecorpac.com/admin/sistema"

# Colores de la marca (src/app/globals.css) y contraste AA sobre su fondo.
NIVELES = {
    "critico": {"etiqueta": "CRÍTICO", "franja": "#b91c1c", "fondo": "#fdecec", "texto": "#991b1b"},
    "aviso": {"etiqueta": "AVISO", "franja": "#d97706", "fondo": "#fef3c7", "texto": "#92400e"},
    "ok": {"etiqueta": "RESUELTO", "franja": "#166534", "fondo": "#dcfce7", "texto": "#166534"},
    "info": {"etiqueta": "RESUMEN", "franja": "#136a80", "fondo": "#e0f2fe", "texto": "#075985"},
}
FUENTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace"


def hora_peru():
    return (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=5)).strftime("%d/%m/%Y %H:%M")


def _en_linea(texto):
    """Escapa HTML y convierte `código` en <code>."""
    partes = re.split(r"`([^`]+)`", texto)
    salida = []
    for i, p in enumerate(partes):
        if i % 2:
            salida.append(f'<code style="font-family:{MONO};font-size:13px;background:#f1f5f9;'
                          f'border-radius:4px;padding:1px 5px;color:#0f172a">{html.escape(p)}</code>')
        else:
            salida.append(html.escape(p))
    return "".join(salida)


def _bloques(cuerpo):
    """Agrupa las líneas del cuerpo en bloques (sección, lista, tabla, comando, párrafo)."""
    bloques = []
    for linea in cuerpo.strip("\n").splitlines():
        linea = linea.rstrip()
        if not linea.strip():
            bloques.append(("vacio", None))
            continue
        if linea.startswith("## "):
            bloques.append(("seccion", linea[3:].strip()))
        elif re.match(r"^\s*[•\-*] ", linea):
            item = re.sub(r"^\s*[•\-*] ", "", linea)
            if bloques and bloques[-1][0] == "lista":
                bloques[-1][1].append(item)
            else:
                bloques.append(("lista", [item]))
        elif " :: " in linea:
            clave, valor = linea.split(" :: ", 1)
            if bloques and bloques[-1][0] == "tabla":
                bloques[-1][1].append((clave.strip(), valor.strip()))
            else:
                bloques.append(("tabla", [(clave.strip(), valor.strip())]))
        elif linea.startswith("$ "):
            if bloques and bloques[-1][0] == "comando":
                bloques[-1][1].append(linea[2:])
            else:
                bloques.append(("comando", [linea[2:]]))
        elif bloques and bloques[-1][0] == "parrafo":
            bloques[-1][1].append(linea)
        else:
            bloques.append(("parrafo", [linea]))
    return [b for b in bloques if b[0] != "vacio"]


def cuerpo_html(cuerpo):
    partes = []
    for tipo, dato in _bloques(cuerpo):
        if tipo == "seccion":
            partes.append(f'<h2 style="margin:24px 0 8px;font-size:13px;line-height:1.4;font-weight:700;'
                          f'letter-spacing:.06em;text-transform:uppercase;color:#475569">{_en_linea(dato)}</h2>')
        elif tipo == "lista":
            filas = "".join(
                f'<tr><td valign="top" style="width:18px;padding:3px 0;color:#136a80;font-size:16px;line-height:1.55">&#8226;</td>'
                f'<td style="padding:3px 0;font-size:15px;line-height:1.55;color:#0f172a">{_en_linea(i)}</td></tr>'
                for i in dato)
            partes.append(f'<table role="presentation" cellpadding="0" cellspacing="0" width="100%" '
                          f'style="margin:4px 0 8px">{filas}</table>')
        elif tipo == "tabla":
            filas = "".join(
                f'<tr><td valign="top" style="padding:9px 12px 9px 0;border-bottom:1px solid #e2e8f0;font-size:14px;'
                f'line-height:1.5;color:#475569;width:42%">{_en_linea(c)}</td>'
                f'<td valign="top" style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-size:15px;line-height:1.5;'
                f'color:#0f172a;font-weight:600;word-break:break-word;overflow-wrap:anywhere">{_en_linea(v)}</td></tr>'
                for c, v in dato)
            partes.append(f'<table role="presentation" cellpadding="0" cellspacing="0" width="100%" '
                          f'style="margin:4px 0 8px;border-top:1px solid #e2e8f0">{filas}</table>')
        elif tipo == "comando":
            lineas = "<br>".join(html.escape(c) for c in dato)
            partes.append(f'<div style="margin:6px 0 10px;padding:12px 14px;background:#0f172a;border-radius:8px;'
                          f'font-family:{MONO};font-size:13px;line-height:1.6;color:#e2e8f0;word-break:break-all">'
                          f'{lineas}</div>')
        else:
            partes.append(f'<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#334155">'
                          f'{"<br>".join(_en_linea(l) for l in dato)}</p>')
    return "\n".join(partes)


def cuerpo_texto(cuerpo):
    lineas = []
    for linea in cuerpo.strip("\n").splitlines():
        if linea.startswith("## "):
            titulo = linea[3:].strip().upper()
            if lineas and lineas[-1].strip():
                lineas.append("")
            lineas += [titulo, "-" * len(titulo)]
        elif " :: " in linea:
            clave, valor = linea.split(" :: ", 1)
            lineas.append(f"{clave.strip()}: {valor.strip()}")
        elif linea.startswith("$ "):
            lineas.append("    " + linea[2:])
        else:
            lineas.append(re.sub(r"^\s*[\-*] ", "• ", linea))
    return "\n".join(lineas).strip().replace("`", "")


def armar(nivel, asunto, titulo, resumen, cuerpo, origen="", boton="Abrir el panel del sistema", enlace=PANEL):
    """Devuelve (asunto_final, texto, html)."""
    n = NIVELES.get(nivel, NIVELES["info"])
    titulo = titulo[:1].upper() + titulo[1:]
    asunto_final = f"[{n['etiqueta']}] SITECORPAC · {asunto[:1].upper()}{asunto[1:]}"
    fecha = hora_peru()
    servidor = socket.gethostname()
    pie_origen = f"Enviado por: {origen} · " if origen else ""

    texto = (f"{n['etiqueta']} — {titulo}\n\n{resumen}\n\n{cuerpo_texto(cuerpo)}\n\n"
             f"{boton}: {enlace}\n\n--\n{pie_origen}Servidor {servidor} · {fecha} (hora de Perú)\n")

    boton_html = ""
    if enlace:
        boton_html = (
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr>'
            f'<td style="border-radius:8px;background:#0b2a4a">'
            f'<a href="{html.escape(enlace)}" style="display:inline-block;padding:13px 22px;font-family:{FUENTE};'
            f'font-size:15px;font-weight:600;line-height:18px;color:#ffffff;text-decoration:none;border-radius:8px">'
            f'{html.escape(boton)} &rarr;</a></td></tr></table>')

    cuerpo_h = cuerpo_html(cuerpo)
    html_doc = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{html.escape(asunto_final)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:{FUENTE};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f1f5f9">{html.escape(resumen)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px">

<tr><td style="padding:0 4px 12px;font-family:{FUENTE}">
<span style="font-size:15px;font-weight:800;letter-spacing:.04em;color:#0b2a4a">SITECORPAC</span>
<span style="font-size:13px;color:#475569">&nbsp;·&nbsp;Alertas del servidor</span>
</td></tr>

<tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-top:6px solid {n['franja']};border-radius:12px;padding:28px 28px 24px;font-family:{FUENTE}">
<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:{n['fondo']};color:{n['texto']};font-size:12px;font-weight:700;letter-spacing:.08em">{n['etiqueta']}</span>
<h1 style="margin:14px 0 8px;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a">{html.escape(titulo)}</h1>
<p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#334155">{_en_linea(resumen)}</p>
{cuerpo_h}
{boton_html}
</td></tr>

<tr><td style="padding:16px 8px 0;font-family:{FUENTE};font-size:12px;line-height:1.6;color:#64748b;text-align:center">
{html.escape(pie_origen)}Servidor {html.escape(servidor)} · {fecha} (hora de Perú)<br>
Correo automático: si algo no se entiende, reenvíalo a quien mantiene el sistema.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""
    return asunto_final, texto, html_doc


def enviar(nivel, asunto, titulo, resumen, cuerpo="", origen="", boton="Abrir el panel del sistema",
           enlace=PANEL, destino=DESTINO):
    """Envía el correo. Devuelve True si salió (por msmtp o, si falla, por mail en texto plano)."""
    asunto_final, texto, html_doc = armar(nivel, asunto, titulo, resumen, cuerpo, origen, boton, enlace)
    msg = EmailMessage()
    msg["Subject"] = asunto_final
    msg["From"] = f"{NOMBRE_REMITENTE} <{REMITENTE}>"
    msg["To"] = destino
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="sitecorpac.com")
    msg.set_content(texto)
    msg.add_alternative(html_doc, subtype="html")
    try:
        r = subprocess.run(["/usr/sbin/sendmail", "-t", "-i"], input=msg.as_bytes(), timeout=60, check=False)
        if r.returncode == 0:
            return True
    except Exception:  # noqa: BLE001
        pass
    try:
        r = subprocess.run(["mail", "-s", asunto_final, destino], input=texto, text=True, timeout=30, check=False)
        return r.returncode == 0
    except Exception:  # noqa: BLE001
        return False


def main():
    p = argparse.ArgumentParser(description="Envía un correo de alerta de SITECORPAC (cuerpo por stdin).")
    p.add_argument("--nivel", choices=sorted(NIVELES), default="info")
    p.add_argument("--asunto", required=True)
    p.add_argument("--titulo")
    p.add_argument("--resumen", default="")
    p.add_argument("--origen", default="")
    p.add_argument("--boton", default="Abrir el panel del sistema")
    p.add_argument("--enlace", default=PANEL)
    p.add_argument("--destino", default=DESTINO)
    p.add_argument("--vista-previa", metavar="ARCHIVO", help="no envía: guarda el HTML en ARCHIVO")
    a = p.parse_args()
    cuerpo = "" if sys.stdin.isatty() else sys.stdin.read()
    if a.vista_previa:
        _, _, html_doc = armar(a.nivel, a.asunto, a.titulo or a.asunto, a.resumen, cuerpo, a.origen, a.boton, a.enlace)
        with open(a.vista_previa, "w", encoding="utf-8") as f:
            f.write(html_doc)
        return 0
    return 0 if enviar(a.nivel, a.asunto, a.titulo or a.asunto, a.resumen, cuerpo, a.origen, a.boton,
                       a.enlace, a.destino) else 1


if __name__ == "__main__":
    sys.exit(main())
