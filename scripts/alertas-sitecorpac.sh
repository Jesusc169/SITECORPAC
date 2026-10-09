#!/bin/bash
# =====================================================================
# Alertas por correo de SITECORPAC (lo que pasa DENTRO del sitio).
#
# Corre como root cada 10 minutos desde el crontab de root:
#   */10 * * * * /root/alertas_sitecorpac.sh >/dev/null 2>&1
# Se instala COPIANDO este archivo a /root (no se ejecuta desde el repo:
# la carpeta del repo es del usuario sitecorpac y root no debe correr
# código que otro usuario pueda modificar).
#
# Avisa de:
#   - errores nuevos del servidor (tabla registro_actividad, nivel error)
#   - muchos intentos fallidos de inicio de sesión (posible ataque)
#   - intentos de entrar con una cuenta desactivada
#   - respaldo de la base de datos con más de 36 horas
#   - certificado HTTPS con menos de 15 días
#   - resumen diario a las 8:00 a. m. (hora de Perú)
# CPU, RAM, disco, sitio caído y PM2 ya los vigila /root/monitor.sh.
#
# Escribe su estado en /var/lib/sitecorpac-alertas/estado.json para que
# la pantalla /admin/sistema muestre que está funcionando.
# =====================================================================
set -uo pipefail

DESTINO="jesuscondor837@gmail.com"
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
enviar() { # enviar <clave> <segundos_sin_repetir> <asunto> <cuerpo>
  local clave="$1" espera="$2" asunto="$3" cuerpo="$4"
  local marca="$DIR/enviado_$clave"
  if [ -f "$marca" ] && [ $((AHORA - $(cat "$marca"))) -lt "$espera" ]; then return; fi
  printf '%s\n\n--\nAlerta automática de SITECORPAC · %s\nPanel: https://%s/admin/sistema\n' \
    "$cuerpo" "$(TZ=America/Lima date '+%d/%m/%Y %H:%M')" "$DOMINIO" \
    | mail -s "$asunto" "$DESTINO" && echo "$AHORA" > "$marca"
  CORREOS_ENVIADOS=$((CORREOS_ENVIADOS + 1))
  ULTIMO_ASUNTO="$asunto"
}

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
    enviar "errores_$MAX_ID" 0 "⚠️ SITECORPAC: $N_ERR error(es) en el sitio" \
"Se registraron $N_ERR error(es) en el servidor desde la última revisión (hora de Perú):

$ERRORES

Revisa el detalle en Sistema y registros → Registro de actividad (filtro Nivel: Error)."
  fi

  DESACT=$(sql "SELECT CONCAT('• ', $FMT, ' — ', COALESCE(detalle,''), ' — IP ', COALESCE(ip,'?')) FROM registro_actividad
                WHERE id > $ULTIMO_ID AND detalle LIKE 'Intento de entrar con una cuenta desactivada%' ORDER BY id LIMIT 10")
  if [ -n "$DESACT" ]; then
    enviar "desactivada_$MAX_ID" 0 "🔒 SITECORPAC: intento de entrar con una cuenta desactivada" \
"Alguien escribió la contraseña CORRECTA de una cuenta desactivada:

$DESACT

Si esa persona ya no trabaja en el sindicato, considera eliminar la cuenta."
  fi
  echo "$MAX_ID" > "$DIR/ultimo_id"
fi

# ---------- 2. posible ataque a las contraseñas ----------
FALLIDOS=$(sql "SELECT COUNT(*) FROM registro_actividad WHERE accion IN ('login_fallido','login_bloqueado')
                AND fecha > UTC_TIMESTAMP() - INTERVAL 15 MINUTE")
if [ "${FALLIDOS:-0}" -ge "$UMBRAL_FALLIDOS" ]; then
  IPS=$(sql "SELECT CONCAT('• ', COALESCE(ip,'?'), ': ', COUNT(*), ' intentos') FROM registro_actividad
             WHERE accion IN ('login_fallido','login_bloqueado') AND fecha > UTC_TIMESTAMP() - INTERVAL 15 MINUTE
             GROUP BY ip ORDER BY COUNT(*) DESC LIMIT 10")
  enviar "ataque" 3600 "🚨 SITECORPAC: $FALLIDOS intentos fallidos de inicio de sesión en 15 minutos" \
"Hubo $FALLIDOS intentos fallidos de iniciar sesión en los últimos 15 minutos. Puede ser alguien probando contraseñas.
El sitio ya bloquea cada IP 15 minutos después de 5 fallos.

IPs:
$IPS

Si alguna IP es de una secretaria que olvidó su contraseña, puedes desbloquearla en Sistema y registros → Seguridad."
fi

# ---------- 3. respaldo atrasado ----------
ULT_RESP=$(ls -t "$RESPALDOS"/sitecorpac_*.sql.gz 2>/dev/null | head -1)
if [ -z "$ULT_RESP" ]; then
  enviar "respaldo" 86400 "🚨 SITECORPAC: no hay respaldos de la base de datos" "No se encontró ningún respaldo en $RESPALDOS."
else
  EDAD_H=$(( (AHORA - $(stat -c %Y "$ULT_RESP")) / 3600 ))
  if [ "$EDAD_H" -gt 36 ]; then
    enviar "respaldo" 86400 "🚨 SITECORPAC: el último respaldo tiene $EDAD_H horas" \
"El respaldo diario de las 3:00 a. m. no se está generando. Último archivo: $(basename "$ULT_RESP") (hace $EDAD_H horas)."
  fi
fi

# ---------- 4. certificado HTTPS ----------
VENCE=$(echo | timeout 10 openssl s_client -connect "$DOMINIO:443" -servername "$DOMINIO" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
DIAS_CERT=""
if [ -n "$VENCE" ]; then
  DIAS_CERT=$(( ($(date -d "$VENCE" +%s) - AHORA) / 86400 ))
  if [ "$DIAS_CERT" -lt 15 ]; then
    enviar "certificado" 86400 "⚠️ SITECORPAC: el certificado HTTPS vence en $DIAS_CERT días" \
"El certificado de $DOMINIO vence el $VENCE y no se renovó solo (normalmente se renueva a los 30 días).
Revisa en el servidor: certbot renew"
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
  enviar "resumen_$HOY" 0 "📋 SITECORPAC: resumen del día" \
"Últimas 24 horas en el panel de SITECORPAC:

Cambios de contenido:
${CAMBIOS:-• Ninguno}

Inicios de sesión: ${N_OK24:-0} correctos, ${N_MAL24:-0} fallidos
Errores del servidor: ${N_ERR24:-0}

En la papelera, por vencer en los próximos 3 días:
${PAPELERA:-• Nada}

Servidor:
• Último respaldo: $RESP_TXT
• Certificado HTTPS: vence en ${DIAS_CERT:-?} días
• Disco: $DISCO

(Para no recibir este resumen: crear el archivo $DIR/sin_resumen en el servidor.)"
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
