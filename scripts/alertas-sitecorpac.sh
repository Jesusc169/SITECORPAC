#!/bin/bash
# =====================================================================
# Alertas por correo de SITECORPAC (lo que pasa DENTRO del sitio).
#
# Corre como root cada 10 minutos desde el crontab de root:
#   */10 * * * * /root/alertas_sitecorpac.sh >/dev/null 2>&1
# Se instala COPIANDO este archivo a /root (no se ejecuta desde el repo:
# la carpeta del repo es del usuario sitecorpac y root no debe correr
# código que otro usuario pueda modificar). Los correos usan la plantilla
# HTML /root/correo_sitecorpac.py (scripts/correo-sitecorpac.py).
#
# Avisa de:
#   - errores nuevos del servidor (tabla registro_actividad, nivel error)
#   - muchos intentos fallidos de inicio de sesión (posible ataque)
#   - intentos de entrar con una cuenta desactivada
#   - respaldo de la base de datos con más de 36 horas
#   - copia off-site (paquete cifrado) sin línea OK en 26 horas
#     (se salta en mantenimiento; prueba sin correos: --probar-offsite)
#   - certificado HTTPS con menos de 15 días
#   - resumen diario a las 8:00 a. m. (hora de Perú)
# CPU, RAM, disco, sitio caído y PM2 ya los vigila /root/monitor.sh.
#
# Escribe su estado en /var/lib/sitecorpac-alertas/estado.json para que
# la pantalla /admin/sistema muestre que está funcionando.
# =====================================================================
set -uo pipefail

# Datos privados (correo de destino, rutas de la copia off-site) en un archivo
# SOLO del servidor, fuera del repo público: /etc/sitecorpac/alertas.conf
# (root, 600). Formato bash: DESTINO="..."  LOG_OFFSITE="..."  DIR_OFFSITE="..."
CONF_PRIVADA="/etc/sitecorpac/alertas.conf"
DESTINO=""; LOG_OFFSITE=""; DIR_OFFSITE=""
# shellcheck source=/dev/null
[ -r "$CONF_PRIVADA" ] && . "$CONF_PRIVADA"
if [ -z "$DESTINO" ]; then echo "Falta DESTINO en $CONF_PRIVADA" >&2; exit 1; fi
APP="/home/sitecorpac/SITECORPAC"
RESPALDOS="/home/sitecorpac/backups"
DOMINIO="sitecorpac.com"
DIR="/var/lib/sitecorpac-alertas"
UMBRAL_FALLIDOS=10          # intentos fallidos en 15 min para avisar
HORA_RESUMEN_UTC=13         # 13:00 UTC = 8:00 a. m. en Perú

mkdir -p "$DIR"; chmod 755 "$DIR"
umask 077
AHORA=$(date +%s)

# ---------- conexión a MySQL (credenciales del .env de la app) ----------
URL=$(grep '^DATABASE_URL' "$APP/.env" | cut -d= -f2- | tr -d '"')
DB_USER=$(echo "$URL" | sed -E 's#mysql://([^:]+):.*#\1#')
DB_PASS=$(python3 -c "import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))" "$(echo "$URL" | sed -E 's#mysql://[^:]+:([^@]+)@.*#\1#')")
DB_HOST=$(echo "$URL" | sed -E 's#.*@([^:/]+).*#\1#')
DB_NAME=$(echo "$URL" | sed -E 's#.*/([^?]+).*#\1#')
CNF="$DIR/.my.cnf"
printf '[client]\nuser=%s\npassword="%s"\nhost=%s\ndefault-character-set=utf8mb4\n' "$DB_USER" "$DB_PASS" "$DB_HOST" > "$CNF"
sql() { mysql --defaults-extra-file="$CNF" -N -B "$DB_NAME" -e "$1" 2>/dev/null; }

# ---------- envío con "no repetir antes de X segundos" ----------
CORREOS_ENVIADOS=0
ULTIMO_ASUNTO=""
PLANTILLA="$(dirname "$(readlink -f "$0")")/correo_sitecorpac.py"
# enviar <clave> <segundos_sin_repetir> <nivel> <asunto> <resumen> <cuerpo>
# nivel: critico | aviso | info. El cuerpo usa el formato de la plantilla
# (## sección, • lista, "clave :: valor", "$ comando").
enviar() {
  local clave="$1" espera="$2" nivel="$3" asunto="$4" resumen="$5" cuerpo="$6"
  local marca="$DIR/enviado_$clave"
  if [ "${SIMULAR:-0}" = 1 ]; then   # modo prueba: no envía ni marca nada
    if [ -f "$marca" ] && [ $((AHORA - $(cat "$marca"))) -lt "$espera" ]; then
      echo "SIMULADO: NO enviaría (antispam: ya se avisó hace menos de ${espera} s) [$clave] $asunto"
    else
      echo "SIMULADO: ENVIARÍA [$nivel] SITECORPAC: $asunto"; echo "  resumen: $resumen"
      printf '%s\n' "$cuerpo" | sed 's/^/  | /'
    fi
    return
  fi
  if [ -f "$marca" ] && [ $((AHORA - $(cat "$marca"))) -lt "$espera" ]; then return; fi
  if [ -f "$PLANTILLA" ]; then
    printf '%s' "$cuerpo" | python3 "$PLANTILLA" --nivel "$nivel" --asunto "$asunto" \
      --titulo "$asunto" --resumen "$resumen" --origen "Alertas del sitio (cada 10 min)" --destino "$DESTINO"
  else
    printf '%s\n\n%s\n\n--\nAlerta automática de SITECORPAC · %s\nPanel: https://%s/admin/sistema\n' \
      "$resumen" "$cuerpo" "$(TZ=America/Lima date '+%d/%m/%Y %H:%M')" "$DOMINIO" \
      | mail -s "SITECORPAC: $asunto" "$DESTINO"
  fi && echo "$AHORA" > "$marca"
  CORREOS_ENVIADOS=$((CORREOS_ENVIADOS + 1))
  ULTIMO_ASUNTO="$asunto"
}

# ---------- respaldo off-site (paquete cifrado que se baja a la PC) ----------
# Avisa si el log de /root/respaldo_offsite.sh no tiene una línea OK en las
# últimas HORAS_OFFSITE horas. Respeta el modo mantenimiento (archivo
# $DIR/mantenimiento de menos de 1 hora, igual que el vigía).
# Probar sin mandar correos ni cambiar estado:
#   /root/alertas_sitecorpac.sh --probar-offsite [log_de_prueba] [archivo_mantenimiento]
MANT="$DIR/mantenimiento"
HORAS_OFFSITE=26
revisar_offsite() {
  # Sin LOG_OFFSITE configurado no hay copia off-site que vigilar.
  [ -n "$LOG_OFFSITE" ] || return 0
  if [ -f "$MANT" ] && [ $((AHORA - $(stat -c %Y "$MANT"))) -lt 3600 ]; then
    [ "${SIMULAR:-0}" = 1 ] && echo "offsite: modo mantenimiento activo -> no se revisa"
    return
  fi
  local linea ok_ts="" edad_h="" ult_fallo
  linea=$(grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} OK: ' "$LOG_OFFSITE" 2>/dev/null | tail -1)
  [ -n "$linea" ] && ok_ts=$(date -u -d "${linea:0:19}" +%s 2>/dev/null)
  [ -n "$ok_ts" ] && edad_h=$(( (AHORA - ok_ts) / 3600 ))
  if [ -n "$ok_ts" ] && [ $((AHORA - ok_ts)) -le $((HORAS_OFFSITE * 3600)) ]; then
    [ "${SIMULAR:-0}" = 1 ] && echo "offsite: último OK hace ${edad_h} h (límite ${HORAS_OFFSITE} h) -> sin alerta"
    return
  fi
  ult_fallo=$(grep -E ' FALLO: ' "$LOG_OFFSITE" 2>/dev/null | tail -1)
  enviar "offsite" 86400 critico "la copia de respaldo fuera del servidor no se genera hace más de $HORAS_OFFSITE horas" \
"El paquete cifrado de respaldo (el que se descarga a la PC) no se generó bien en las últimas $HORAS_OFFSITE horas. Si se perdiera el servidor, la copia fuera de él estaría desactualizada." \
"## Último paquete correcto
${linea:-• Ninguno registrado}
Antigüedad :: ${edad_h:-?} horas

## Último fallo registrado
${ult_fallo:-• Ninguno}

## Cómo se revisa
$ tail $LOG_OFFSITE
$ ls -la ${DIR_OFFSITE:-<carpeta de paquetes>}
$ /root/respaldo_offsite.sh"
}
if [ "${1:-}" = "--probar-offsite" ]; then
  SIMULAR=1
  [ -n "${2:-}" ] && LOG_OFFSITE="$2"
  [ -n "${3:-}" ] && MANT="$3"
  echo "MODO PRUEBA (no envía correos ni cambia estado): log=$LOG_OFFSITE mant=$MANT"
  revisar_offsite
  rm -f "$CNF"
  exit 0
fi

FMT="DATE_FORMAT(DATE_SUB(fecha, INTERVAL 5 HOUR), '%d/%m %H:%i')"

# ---------- 1. errores nuevos ----------
ULTIMO_ID=$(cat "$DIR/ultimo_id" 2>/dev/null || echo "")
MAX_ID=$(sql "SELECT COALESCE(MAX(id),0) FROM registro_actividad")
if [ -z "$ULTIMO_ID" ]; then ULTIMO_ID="$MAX_ID"; fi   # primera vez: no avisar del pasado
if [ -n "$MAX_ID" ] && [ "$MAX_ID" -gt "$ULTIMO_ID" ]; then
  ERRORES=$(sql "SELECT CONCAT('• ', $FMT, ' — ', COALESCE(detalle,'')) FROM registro_actividad
                 WHERE id > $ULTIMO_ID AND nivel='error' ORDER BY id LIMIT 20")
  N_ERR=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE id > $ULTIMO_ID AND nivel='error'")
  if [ "${N_ERR:-0}" -gt 0 ]; then
    enviar "errores_$MAX_ID" 0 aviso "$N_ERR error(es) en el sitio" \
"Se registraron $N_ERR error(es) en el servidor desde la última revisión." \
"## Errores (hora de Perú)
$ERRORES

## Qué hacer
Revisa el detalle en Sistema y registros → Registro de actividad, con el filtro Nivel: Error. Si es un error aislado, no hace falta nada."
  fi

  DESACT=$(sql "SELECT CONCAT('• ', $FMT, ' — ', COALESCE(detalle,''), ' — IP ', COALESCE(ip,'?')) FROM registro_actividad
                WHERE id > $ULTIMO_ID AND detalle LIKE 'Intento de entrar con una cuenta desactivada%' ORDER BY id LIMIT 10")
  if [ -n "$DESACT" ]; then
    enviar "desactivada_$MAX_ID" 0 aviso "intento de entrar con una cuenta desactivada" \
"Alguien escribió la contraseña CORRECTA de una cuenta desactivada. El sitio no lo dejó entrar." \
"## Intentos
$DESACT

## Qué hacer
Si esa persona ya no trabaja en el sindicato, considera eliminar la cuenta en Usuarios."
  fi
fi
# Siempre se guarda hasta dónde se revisó (también en la primera pasada,
# para no volver a "empezar de cero" en cada ejecución).
[ -n "$MAX_ID" ] && echo "$MAX_ID" > "$DIR/ultimo_id"

# ---------- 2. posible ataque a las contraseñas ----------
FALLIDOS=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE accion IN ('login_fallido','login_bloqueado')
                AND fecha > UTC_TIMESTAMP() - INTERVAL 15 MINUTE")
if [ "${FALLIDOS:-0}" -ge "$UMBRAL_FALLIDOS" ]; then
  IPS=$(sql "SELECT CONCAT('• ', COALESCE(ip,'?'), ': ', COUNT(*), ' intentos') FROM registro_actividad
             WHERE accion IN ('login_fallido','login_bloqueado') AND fecha > UTC_TIMESTAMP() - INTERVAL 15 MINUTE
             GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 10")
  enviar "ataque" 3600 critico "$FALLIDOS intentos fallidos de inicio de sesión en 15 minutos" \
"Puede ser alguien probando contraseñas. El sitio ya bloquea cada IP 15 minutos después de 5 fallos." \
"## Desde dónde (IP)
$IPS

## Qué hacer
Si alguna IP es de una secretaria que olvidó su contraseña, puedes desbloquearla en Sistema y registros → Seguridad. Si no la reconoces, no hace falta nada: el bloqueo es automático."
fi

# ---------- 3. respaldo atrasado ----------
ULT_RESP=$(ls -t "$RESPALDOS"/sitecorpac_*.sql.gz 2>/dev/null | head -1)
if [ -z "$ULT_RESP" ]; then
  enviar "respaldo" 86400 critico "no hay respaldos de la base de datos" \
"No se encontró ningún respaldo. Si el servidor fallara, no habría copia para recuperar la información." \
"## Dónde se buscó
$ $RESPALDOS

## Cómo se revisa
$ tail /home/sitecorpac/backups/backup.log
$ /root/backup_sitecorpac.sh"
else
  EDAD_H=$(( (AHORA - $(stat -c %Y "$ULT_RESP")) / 3600 ))
  if [ "$EDAD_H" -gt 36 ]; then
    enviar "respaldo" 86400 critico "el último respaldo tiene $EDAD_H horas" \
"El respaldo diario de las 3:00 a. m. no se está generando." \
"## Último respaldo
Archivo :: $(basename "$ULT_RESP")
Antigüedad :: $EDAD_H horas

## Cómo se revisa
$ tail /home/sitecorpac/backups/backup.log
$ /root/backup_sitecorpac.sh"
  fi
fi

# ---------- 3b. copia off-site ----------
revisar_offsite

# ---------- 4. certificado HTTPS ----------
VENCE=$(echo | timeout 10 openssl s_client -connect "$DOMINIO:443" -servername "$DOMINIO" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
DIAS_CERT=""
if [ -n "$VENCE" ]; then
  DIAS_CERT=$(( ($(date -d "$VENCE" +%s) - AHORA) / 86400 ))
  if [ "$DIAS_CERT" -lt 15 ]; then
    enviar "certificado" 86400 aviso "el certificado HTTPS vence en $DIAS_CERT días" \
"El candado de seguridad de $DOMINIO no se renovó solo (normalmente se renueva 30 días antes). Si vence, los navegadores mostrarán el sitio como inseguro." \
"## Certificado
Dominio :: $DOMINIO
Vence :: $VENCE

## Cómo se arregla
$ certbot renew"
  fi
fi

# ---------- 5. resumen diario (8:00 a. m. Perú) ----------
HOY=$(date -u +%Y%m%d)
if [ "$(date -u +%H)" -eq "$HORA_RESUMEN_UTC" ] && [ "$(cat "$DIR/resumen_dia" 2>/dev/null)" != "$HOY" ] && [ ! -f "$DIR/sin_resumen" ]; then
  CAMBIOS=$(sql "SELECT CONCAT('• ', COALESCE(usuario,'(sin usuario)'), ': ', COUNT(*), ' cambio(s)') FROM registro_actividad
                 WHERE fecha > UTC_TIMESTAMP() - INTERVAL 1 DAY AND accion IN ('crear','editar','eliminar','duplicar')
                 GROUP BY usuario ORDER BY COUNT(*) DESC")
  N_ERR24=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE fecha > UTC_TIMESTAMP() - INTERVAL 1 DAY AND nivel='error'")
  N_OK24=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE fecha > UTC_TIMESTAMP() - INTERVAL 1 DAY AND accion='login'")
  N_MAL24=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE fecha > UTC_TIMESTAMP() - INTERVAL 1 DAY AND accion='login_fallido'")
  PAPELERA=$(sql "SELECT CONCAT('• ', titulo, ' (', modulo, ') — se borra el ', DATE_FORMAT(DATE_SUB(expiraEn, INTERVAL 5 HOUR), '%d/%m')) FROM papelera
                  WHERE expiraEn < UTC_TIMESTAMP() + INTERVAL 3 DAY ORDER BY expiraEn")
  DISCO=$(df -h / | awk 'NR==2{print $5" usado ("$4" libres)"}')
  RESP_TXT="ninguno"
  [ -n "$ULT_RESP" ] && RESP_TXT="$(basename "$ULT_RESP") ($(du -h "$ULT_RESP" | cut -f1))"
  enviar "resumen_$HOY" 0 info "resumen del día" \
"Lo que pasó en el panel de SITECORPAC en las últimas 24 horas." \
"## Actividad
Inicios de sesión correctos :: ${N_OK24:-0}
Inicios de sesión fallidos :: ${N_MAL24:-0}
Errores del servidor :: ${N_ERR24:-0}

## Cambios de contenido
${CAMBIOS:-• Ninguno}

## Papelera: se borra en los próximos 3 días
${PAPELERA:-• Nada}

## Servidor
Último respaldo :: $RESP_TXT
Certificado HTTPS :: vence en ${DIAS_CERT:-?} días
Disco :: $DISCO

Para dejar de recibir este resumen, crea el archivo \`$DIR/sin_resumen\` en el servidor."
  echo "$HOY" > "$DIR/resumen_dia"
fi

# ---------- estado para el panel ----------
ULT_ENVIO=$(cat "$DIR/ultimo_envio" 2>/dev/null || echo "")
if [ "$CORREOS_ENVIADOS" -gt 0 ]; then
  ULT_ENVIO="$(date -u +%Y-%m-%dT%H:%M:%SZ)|$ULTIMO_ASUNTO"
  echo "$ULT_ENVIO" > "$DIR/ultimo_envio"
fi
python3 - "$DIR/estado.json" "$DESTINO" "$ULT_ENVIO" "$([ -f "$DIR/sin_resumen" ] && echo no || echo si)" <<'PY'
import json, sys, datetime
ruta, destino, envio, resumen = sys.argv[1:5]
fecha, _, asunto = envio.partition("|")
json.dump({
    "ultimaRevision": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "destinatario": destino,
    "resumenDiario": resumen == "si",
    "ultimoCorreo": {"fecha": fecha, "asunto": asunto} if fecha else None,
}, open(ruta, "w"), ensure_ascii=False)
PY
chmod 644 "$DIR/estado.json"
rm -f "$CNF"
