#!/usr/bin/env python3
"""
Vigía de SITECORPAC: bitácora de caídas e incidentes del servidor.

Corre como root cada minuto desde el crontab de root:
  * * * * * /usr/bin/python3 /root/vigia_sitecorpac.py >/dev/null 2>&1
Se instala COPIANDO este archivo a /root (igual que alertas-sitecorpac.sh):
  install -o root -m 700 scripts/vigia-sitecorpac.py /root/vigia_sitecorpac.py

Qué hace en cada pasada:
  1. Revisa el sitio (por internet y por dentro), nginx, MySQL, PM2 y el disco.
  2. Si algo falla, abre un incidente y GUARDA LA EVIDENCIA en ese momento
     (logs de la app, de nginx y de MySQL, memoria, disco, procesos,
     mensajes del sistema) en /var/log/sitecorpac-incidentes/<id>/, porque
     los logs rotan y después ya no está lo que pasó.
  3. Escribe la causa probable y cómo se arregla, en palabras simples.
  4. Si la falla sigue en la segunda revisión: avisa por correo e intenta
     el arreglo seguro (levantar un servicio detenido), una vez por incidente.
  5. Cuando todo vuelve a responder, cierra el incidente con su duración
     y avisa por correo que se resolvió.

Archivos:
  /var/log/sitecorpac-incidentes/bitacora.jsonl   un incidente por línea (solo root)
  /var/log/sitecorpac-incidentes/<id>/           evidencia de cada incidente (solo root)
  /var/lib/sitecorpac-alertas/incidentes.json     resumen sin datos sensibles para /admin/sistema

Antes de un despliegue que deja el sitio caído unos minutos:
  touch /var/lib/sitecorpac-alertas/mantenimiento     (se ignora solo pasada 1 hora)
  rm /var/lib/sitecorpac-alertas/mantenimiento        al terminar

Uso manual:
  python3 /root/vigia_sitecorpac.py diagnostico   estado actual + últimos incidentes
  python3 /root/vigia_sitecorpac.py prueba        registra un incidente de prueba (sin correo)
"""
import datetime
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import time

DOMINIO = "sitecorpac.com"
PUERTO_APP = 3000
DESTINO = "jesuscondor837@gmail.com"
LOGS_PM2 = "/home/sitecorpac/.pm2/logs"
DIR_EVIDENCIA = "/var/log/sitecorpac-incidentes"
DIR_PANEL = "/var/lib/sitecorpac-alertas"
ESTADO = os.path.join(DIR_EVIDENCIA, "estado.json")
BITACORA = os.path.join(DIR_EVIDENCIA, "bitacora.jsonl")
PANEL = os.path.join(DIR_PANEL, "incidentes.json")
MANTENIMIENTO = os.path.join(DIR_PANEL, "mantenimiento")
DIAS_EVIDENCIA = 180
REVISIONES_PARA_AVISAR = 2  # 2 minutos seguidos: no avisar por un parpadeo


def sh(cmd, timeout=30):
    """Ejecuta un comando y devuelve (código, salida). Nunca lanza."""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr).strip()
    except Exception as e:  # noqa: BLE001 - el vigía no se cae nunca
        return 1, f"(no se pudo ejecutar: {e})"


def ahora_iso():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def hora_peru(iso=None):
    t = datetime.datetime.now(datetime.timezone.utc) if iso is None else datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (t - datetime.timedelta(hours=5)).strftime("%d/%m/%Y %H:%M")


def leer_json(ruta, defecto):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except Exception:  # noqa: BLE001
        return defecto


def escribir_json(ruta, datos, modo=0o600):
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, modo)
    os.replace(tmp, ruta)


# ---------------------------------------------------------------- revisiones
def codigo_http(url):
    _, out = sh(f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 15 '{url}'", timeout=20)
    return out[-3:] if out else "000"


def revisar():
    """Devuelve dict con lo observado y la lista de síntomas (vacía = todo bien)."""
    obs = {
        "publico": codigo_http(f"https://{DOMINIO}/"),
        "local": codigo_http(f"http://127.0.0.1:{PUERTO_APP}/"),
        "nginx": sh("systemctl is-active nginx")[1],
        "mysql": sh("systemctl is-active mysql")[1],
        "mysqlResponde": sh("mysqladmin --defaults-file=/etc/mysql/debian.cnf ping", timeout=15)[0] == 0,
        "pm2Online": len(re.findall(r'"status":"online"', sh("sudo -u sitecorpac pm2 jlist", timeout=30)[1])),
        "disco": int(re.sub(r"\D", "", sh("df --output=pcent / | tail -1")[1]) or 0),
    }
    sintomas = []
    if obs["publico"] != "200":
        sintomas.append(f"El sitio no carga desde internet (respondió {obs['publico']})")
    if obs["local"] != "200":
        sintomas.append(f"La aplicación no responde por dentro (respondió {obs['local']})")
    if obs["nginx"] != "active":
        sintomas.append("El servidor web (nginx) está detenido")
    if obs["mysql"] != "active" or not obs["mysqlResponde"]:
        sintomas.append("La base de datos (MySQL) no responde")
    if obs["pm2Online"] == 0:
        sintomas.append("La aplicación (PM2) está detenida")
    if obs["disco"] >= 95:
        sintomas.append(f"El disco está al {obs['disco']}%")
    return obs, sintomas


# ---------------------------------------------------------------- evidencia
def capturar(carpeta, obs, sintomas):
    os.makedirs(carpeta, mode=0o700, exist_ok=True)

    def guardar(nombre, texto):
        with open(os.path.join(carpeta, nombre), "w", encoding="utf-8") as f:
            f.write(texto + "\n")

    partes = [
        f"Incidente detectado: {hora_peru()} (hora de Perú)",
        "Síntomas:\n" + "\n".join(f"  - {s}" for s in sintomas),
        "Observado:\n" + json.dumps(obs, ensure_ascii=False, indent=1),
    ]
    for titulo, cmd in [
        ("Cabeceras del sitio", f"curl -sI --max-time 15 https://{DOMINIO}/ | head -8"),
        ("Servicios", "systemctl --no-pager status nginx mysql pm2-sitecorpac 2>&1 | grep -E '●|Active:|Main PID'"),
        ("PM2", "sudo -u sitecorpac pm2 list --no-color"),
        ("Memoria", "free -m"),
        ("Disco", "df -h / /home"),
        ("Carga", "uptime"),
        ("Procesos que más memoria usan", "ps aux --sort=-%mem | head -8"),
        ("Procesos que más CPU usan", "ps aux --sort=-%cpu | head -8"),
        ("Reinicios y apagados recientes", "last -x reboot shutdown | head -5"),
        ("Certificado HTTPS", f"echo | timeout 10 openssl s_client -connect {DOMINIO}:443 -servername {DOMINIO} 2>/dev/null | openssl x509 -noout -enddate"),
    ]:
        partes.append(f"== {titulo}\n{sh(cmd)[1]}")
    guardar("resumen.txt", "\n\n".join(partes))

    guardar("app-errores.log", sh(f"tail -n 200 {LOGS_PM2}/sitecorpac-error-*.log")[1])
    guardar("app-salida.log", sh(f"tail -n 200 {LOGS_PM2}/sitecorpac-out-*.log")[1])
    guardar("nginx-errores.log", sh("tail -n 200 /var/log/nginx/error.log")[1])
    guardar("nginx-accesos.log", sh("tail -n 300 /var/log/nginx/access.log")[1])
    guardar("mysql.log", sh("tail -n 100 /var/log/mysql/error.log; journalctl -u mysql --since '-30 min' --no-pager | tail -50")[1])
    guardar("sistema-avisos.log", sh("journalctl --since '-30 min' -p warning --no-pager | tail -300")[1])
    guardar("memoria-oom.log", sh("journalctl -k --since '-60 min' --no-pager | grep -iE 'out of memory|oom-kill|killed process'")[1])


def diagnosticar(obs, carpeta):
    """Causa probable y cómo se arregla, a partir de lo observado y la evidencia."""
    oom = ""
    try:
        with open(os.path.join(carpeta, "memoria-oom.log"), encoding="utf-8") as f:
            oom = f.read().strip()
    except OSError:
        pass

    if oom:
        return ("El servidor se quedó sin memoria y el sistema cerró un proceso para no colgarse.",
                "Reiniciar la app (pm2 restart sitecorpac). Si se repite, ver en resumen.txt qué proceso consumía más memoria.")
    if obs["mysql"] != "active" or not obs["mysqlResponde"]:
        return ("La base de datos (MySQL) se detuvo o no responde; sin ella el sitio no puede mostrar contenido.",
                "systemctl restart mysql y revisar mysql.log (causas típicas: disco lleno o falta de memoria).")
    if obs["nginx"] != "active":
        return ("El servidor web (nginx), que recibe las visitas, se detuvo.",
                "nginx -t (para ver si la configuración tiene un error) y luego systemctl restart nginx; revisar nginx-errores.log.")
    if obs["pm2Online"] == 0:
        return ("La aplicación de SITECORPAC se detuvo.",
                "sudo -u sitecorpac pm2 restart sitecorpac y revisar app-errores.log para ver por qué se cayó.")
    if obs["disco"] >= 95:
        return (f"El disco está casi lleno ({obs['disco']}%).",
                "Liberar espacio: respaldos antiguos en /home/sitecorpac/backups o logs viejos (journalctl --vacuum-time=30d).")
    if obs["local"] != "200":
        return (f"La aplicación está encendida pero responde con error ({obs['local']}).",
                "Revisar app-errores.log. Si está colgada: sudo -u sitecorpac pm2 reload sitecorpac.")
    if obs["publico"] in ("502", "504"):
        return ("nginx no logra comunicarse a tiempo con la aplicación.",
                "Revisar nginx-errores.log y app-errores.log; normalmente se arregla con pm2 reload sitecorpac.")
    if obs["publico"] == "000":
        return ("El sitio no responde desde internet aunque por dentro todo funciona: probable problema de red, DNS o del proveedor (Hostinger).",
                "Esperar unos minutos y revisar el estado de Hostinger; si sigue, revisar el certificado HTTPS en resumen.txt.")
    return ("No se identificó una causa clara.", "Revisar resumen.txt y los logs guardados en la carpeta del incidente.")


def arreglo_seguro(obs):
    """Solo levanta lo que está DETENIDO. Nunca toca datos ni configuración."""
    if obs["mysql"] != "active":
        return "systemctl restart mysql", sh("systemctl restart mysql", timeout=120)[0] == 0
    if obs["nginx"] != "active":
        ok = sh("nginx -t")[0] == 0 and sh("systemctl restart nginx", timeout=60)[0] == 0
        return "nginx -t && systemctl restart nginx", ok
    if obs["pm2Online"] == 0:
        ok = sh("sudo -u sitecorpac pm2 resurrect && sudo -u sitecorpac pm2 restart sitecorpac", timeout=120)[0] == 0
        return "pm2 resurrect / pm2 restart sitecorpac", ok
    return None, None


# ---------------------------------------------------------------- avisos y registro
def correo(asunto, cuerpo):
    texto = f"{cuerpo}\n\n--\nVigía de SITECORPAC · {hora_peru()} (hora de Perú)\nPanel: https://{DOMINIO}/admin/sistema\n"
    try:
        subprocess.run(["mail", "-s", asunto, DESTINO], input=texto, text=True, timeout=30, check=False)
    except Exception:  # noqa: BLE001
        pass


def bitacora():
    incidentes = []
    try:
        with open(BITACORA, encoding="utf-8") as f:
            for linea in f:
                try:
                    incidentes.append(json.loads(linea))
                except ValueError:
                    pass
    except OSError:
        pass
    return incidentes


def publicar_panel(estado):
    """Resumen para /admin/sistema: sin rutas de logs, IPs ni salidas de comandos."""
    claves = ("id", "inicio", "fin", "duracionSeg", "sintomas", "causa", "solucion", "accionAutomatica", "prueba")
    ultimos = [{k: i.get(k) for k in claves} for i in bitacora()[-30:]][::-1]
    en_curso = None
    if estado.get("abierto"):
        a = estado["abierto"]
        en_curso = {k: a.get(k) for k in claves}
    os.makedirs(DIR_PANEL, exist_ok=True)
    escribir_json(PANEL, {
        "ultimaRevision": ahora_iso(),
        "mantenimiento": estado.get("mantenimiento", False),
        "enCurso": en_curso,
        "incidentes": ultimos,
    }, 0o644)


def limpiar_evidencia_antigua():
    limite = time.time() - DIAS_EVIDENCIA * 86400
    for nombre in os.listdir(DIR_EVIDENCIA):
        ruta = os.path.join(DIR_EVIDENCIA, nombre)
        if os.path.isdir(ruta) and os.path.getmtime(ruta) < limite:
            shutil.rmtree(ruta, ignore_errors=True)


def cerrar(estado, prueba=False):
    a = estado.pop("abierto")
    a["fin"] = ahora_iso()
    inicio = datetime.datetime.fromisoformat(a["inicio"].replace("Z", "+00:00"))
    a["duracionSeg"] = int((datetime.datetime.now(datetime.timezone.utc) - inicio).total_seconds())
    with open(BITACORA, "a", encoding="utf-8") as f:
        f.write(json.dumps(a, ensure_ascii=False) + "\n")
    os.chmod(BITACORA, 0o600)
    if a.get("avisado") and not prueba:
        minutos = max(1, round(a["duracionSeg"] / 60))
        correo("✅ SITECORPAC: el sitio volvió a funcionar",
               f"El incidente {a['id']} se resolvió. Duró unos {minutos} minuto(s) "
               f"({hora_peru(a['inicio'])} → {hora_peru(a['fin'])}).\n\n"
               f"Causa probable: {a['causa']}\n"
               f"Arreglo automático: {a.get('accionAutomatica') or 'ninguno (se recuperó solo)'}\n\n"
               f"Evidencia guardada en el servidor: {a['carpeta']}")
    return a


def pasada():
    os.makedirs(DIR_EVIDENCIA, mode=0o700, exist_ok=True)
    estado = leer_json(ESTADO, {})

    # Mantenimiento declarado (despliegue): no se abren incidentes.
    mant = os.path.exists(MANTENIMIENTO) and time.time() - os.path.getmtime(MANTENIMIENTO) < 3600
    estado["mantenimiento"] = mant
    if mant:
        escribir_json(ESTADO, estado)
        publicar_panel(estado)
        return

    obs, sintomas = revisar()
    abierto = estado.get("abierto")

    if sintomas and not abierto:
        id_inc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")
        carpeta = os.path.join(DIR_EVIDENCIA, id_inc)
        capturar(carpeta, obs, sintomas)
        causa, solucion = diagnosticar(obs, carpeta)
        estado["abierto"] = abierto = {
            "id": id_inc, "inicio": ahora_iso(), "sintomas": sintomas, "causa": causa,
            "solucion": solucion, "carpeta": carpeta, "revisiones": 1, "avisado": False,
            "accionAutomatica": None,
        }
    elif sintomas and abierto:
        abierto["revisiones"] += 1
        abierto["sintomas"] = sorted(set(abierto["sintomas"]) | set(sintomas))
        if abierto["revisiones"] >= REVISIONES_PARA_AVISAR and not abierto["avisado"]:
            accion, ok = arreglo_seguro(obs)
            if accion:
                abierto["accionAutomatica"] = f"{accion} ({'funcionó' if ok else 'falló'})"
            abierto["avisado"] = True
            correo("🚨 SITECORPAC: el sitio tiene un problema",
                   "Desde las " + hora_peru(abierto["inicio"]) + " (hora de Perú):\n"
                   + "\n".join(f"• {s}" for s in sintomas)
                   + f"\n\nCausa probable: {abierto['causa']}\nCómo se arregla: {abierto['solucion']}\n"
                   + f"Arreglo automático: {abierto['accionAutomatica'] or 'ninguno (no hay un servicio detenido que levantar)'}\n\n"
                   + f"Evidencia guardada en el servidor: {abierto['carpeta']}\n"
                   + "Te aviso de nuevo cuando vuelva a funcionar.")
    elif not sintomas and abierto:
        cerrar(estado)

    escribir_json(ESTADO, estado)
    publicar_panel(estado)
    if datetime.datetime.now().minute == 0:
        limpiar_evidencia_antigua()


def diagnostico():
    obs, sintomas = revisar()
    print("Estado actual:", "TODO BIEN" if not sintomas else "CON PROBLEMAS")
    for s in sintomas:
        print("  -", s)
    print(json.dumps(obs, ensure_ascii=False, indent=1))
    estado = leer_json(ESTADO, {})
    if estado.get("abierto"):
        print("\nIncidente EN CURSO:", json.dumps(estado["abierto"], ensure_ascii=False, indent=1))
    print("\nÚltimos incidentes:")
    for i in bitacora()[-10:]:
        print(f"  {i['id']}  {hora_peru(i['inicio'])}  {i.get('duracionSeg', '?')} s  {'(prueba) ' if i.get('prueba') else ''}{i['causa']}")
        print(f"      evidencia: {i['carpeta']}")


def prueba():
    """Registra un incidente de prueba con evidencia real, sin correo ni arreglos."""
    os.makedirs(DIR_EVIDENCIA, mode=0o700, exist_ok=True)
    estado = leer_json(ESTADO, {})
    if estado.get("abierto"):
        sys.exit("Hay un incidente real en curso; no se hace la prueba.")
    obs, _ = revisar()
    id_inc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S") + "-prueba"
    carpeta = os.path.join(DIR_EVIDENCIA, id_inc)
    sintomas = ["Prueba de la bitácora de incidentes (no hubo caída)"]
    capturar(carpeta, obs, sintomas)
    estado["abierto"] = {
        "id": id_inc, "inicio": ahora_iso(), "sintomas": sintomas,
        "causa": "Prueba manual: se verificó que la bitácora guarda la evidencia.",
        "solucion": "Nada que arreglar.", "carpeta": carpeta, "revisiones": 1,
        "avisado": False, "accionAutomatica": None, "prueba": True,
    }
    cerrado = cerrar(estado, prueba=True)
    escribir_json(ESTADO, estado)
    publicar_panel(estado)
    print("Incidente de prueba registrado:", cerrado["id"], "→", carpeta)
    print(sorted(os.listdir(carpeta)))


if __name__ == "__main__":
    modo = sys.argv[1] if len(sys.argv) > 1 else "pasada"
    if modo == "diagnostico":
        diagnostico()
        sys.exit(0)
    os.makedirs(DIR_EVIDENCIA, mode=0o700, exist_ok=True)
    with open(os.path.join(DIR_EVIDENCIA, ".candado"), "w") as candado:
        try:
            fcntl.flock(candado, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            sys.exit(0)  # la pasada anterior sigue corriendo
        prueba() if modo == "prueba" else pasada()
