#!/usr/bin/env bash
# Backup diario de la base de datos de producción, con rotación de 14 días.
# Pensado para correr como cron job del usuario `sitecorpac` en la VM. No
# depende de estado externo: lee las credenciales del .env de la app en cada
# corrida, así que sigue funcionando si la contraseña de la BD cambia.
set -euo pipefail

APP_DIR="/home/sitecorpac/SITECORPAC"
BACKUP_DIR="/home/sitecorpac/backups"
RETENCION_DIAS=14

DATABASE_URL=$(grep -m1 '^DATABASE_URL=' "$APP_DIR/.env" | cut -d '=' -f2- | tr -d '"')

# Formato esperado: mysql://usuario:password@host:puerto/basededatos
SIN_PROTOCOLO="${DATABASE_URL#mysql://}"
USUARIO="${SIN_PROTOCOLO%%:*}"
RESTO="${SIN_PROTOCOLO#*:}"
PASSWORD="${RESTO%%@*}"
RESTO="${RESTO#*@}"
HOST_PUERTO="${RESTO%%/*}"
HOST="${HOST_PUERTO%%:*}"
PUERTO="${HOST_PUERTO#*:}"
BASE="${RESTO#*/}"

mkdir -p "$BACKUP_DIR"
FECHA=$(date +%Y-%m-%d_%H-%M)
ARCHIVO="$BACKUP_DIR/sitecorpac_${FECHA}.sql.gz"

MYSQL_PWD="$PASSWORD" mysqldump -h "$HOST" -P "$PUERTO" -u "$USUARIO" "$BASE" | gzip > "$ARCHIVO"

# Rotación: borra backups más viejos que RETENCION_DIAS.
find "$BACKUP_DIR" -name "sitecorpac_*.sql.gz" -mtime +"$RETENCION_DIAS" -delete

echo "Backup creado: $ARCHIVO"
