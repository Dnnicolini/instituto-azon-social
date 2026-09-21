#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE=/etc/azon/production.env
BACKUP_DIR=/var/backups/azon/postgresql
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

exec 9>/run/lock/azon-backup.lock
if ! flock --nonblock 9; then
    echo 'Já existe outro backup do Azon em execução.' >&2
    exit 75
fi

if [[ ! -r $ENV_FILE ]]; then
    echo "$ENV_FILE não existe ou não pode ser lido." >&2
    exit 66
fi

AUTOLOAD=/var/www/apps/azon/current/vendor/autoload.php
if [[ ! -r $AUTOLOAD ]]; then
    echo "$AUTOLOAD não existe; a aplicação ainda não foi instalada." >&2
    exit 66
fi

# Use o mesmo parser dotenv do Laravel, sem executar o conteúdo do arquivo como shell.
mapfile -t encoded_values < <(sudo -u www-data php -r '
    require $argv[1];
    $values = Dotenv\Dotenv::createImmutable(dirname($argv[2]), basename($argv[2]))->safeLoad();
    foreach (["DB_HOST", "DB_PORT", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD", "DB_SSLMODE", "DB_SSLROOTCERT"] as $key) {
        echo base64_encode((string) ($values[$key] ?? "")), PHP_EOL;
    }
' "$AUTOLOAD" "$ENV_FILE")

if [[ ${#encoded_values[@]} -ne 7 ]]; then
    echo "Não foi possível ler as variáveis de banco de $ENV_FILE." >&2
    exit 78
fi

DB_HOST=$(printf '%s' "${encoded_values[0]}" | base64 --decode)
DB_PORT=$(printf '%s' "${encoded_values[1]}" | base64 --decode)
DB_DATABASE=$(printf '%s' "${encoded_values[2]}" | base64 --decode)
DB_USERNAME=$(printf '%s' "${encoded_values[3]}" | base64 --decode)
DB_PASSWORD=$(printf '%s' "${encoded_values[4]}" | base64 --decode)
DB_SSLMODE=$(printf '%s' "${encoded_values[5]}" | base64 --decode)
DB_SSLROOTCERT=$(printf '%s' "${encoded_values[6]}" | base64 --decode)

for variable in DB_HOST DB_PORT DB_DATABASE DB_USERNAME; do
    if [[ -z ${!variable:-} ]]; then
        echo "$variable não está configurada em $ENV_FILE." >&2
        exit 78
    fi
done

install -d -m 0700 "$BACKUP_DIR"
TEMP_BACKUP=$(mktemp "$BACKUP_DIR/.azon-XXXXXX.dump")
trap 'rm -f -- "$TEMP_BACKUP"' EXIT

if [[ $DB_HOST == /var/run/postgresql && $DB_USERNAME == www-data ]]; then
    if [[ -n $DB_PASSWORD || $DB_SSLMODE != disable ]]; then
        echo 'O banco local deve usar autenticação peer, sem senha e sem TLS no socket Unix.' >&2
        exit 78
    fi
    sudo -u www-data env PGSSLMODE=disable pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USERNAME" \
        --dbname="$DB_DATABASE" \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-privileges > "$TEMP_BACKUP"
else
    if [[ -z $DB_PASSWORD ]]; then
        echo 'DB_PASSWORD é obrigatória para o banco remoto.' >&2
        exit 78
    fi
    PGPASSWORD=$DB_PASSWORD \
    PGSSLMODE=${DB_SSLMODE:-verify-full} \
    PGSSLROOTCERT=${DB_SSLROOTCERT:-/etc/ssl/certs/ca-certificates.crt} \
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USERNAME" \
        --dbname="$DB_DATABASE" \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-privileges \
        --file="$TEMP_BACKUP"
fi

pg_restore --list "$TEMP_BACKUP" >/dev/null
FINAL_BACKUP=$BACKUP_DIR/azon-$STAMP.dump
mv "$TEMP_BACKUP" "$FINAL_BACKUP"
sha256sum "$FINAL_BACKUP" > "$FINAL_BACKUP.sha256"
find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +7 -delete

echo "Backup PostgreSQL concluído: $FINAL_BACKUP"
