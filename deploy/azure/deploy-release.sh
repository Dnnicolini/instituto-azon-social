#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

exec 9>/run/lock/azon-deploy.lock
if ! flock --nonblock 9; then
    echo 'Já existe outro deploy do Azon em execução.' >&2
    exit 75
fi

if [[ $# -ne 1 ]]; then
    echo "Uso: $0 /var/www/apps/azon/staging/NOME_DA_RELEASE" >&2
    exit 64
fi

APP_ROOT=/var/www/apps/azon
SHARED_DIR=$APP_ROOT/shared
ENV_FILE=/etc/azon/production.env
SOURCE_DIR=$(readlink -f -- "$1")
STAGING_ROOT=$(readlink -f -- "$APP_ROOT/staging")
RELEASE_NAME=$(basename -- "$SOURCE_DIR")
RELEASE_DIR=$APP_ROOT/releases/$RELEASE_NAME
CURRENT_LINK=$APP_ROOT/current
PREVIOUS_TARGET=
MAINTENANCE_ENABLED=false
DATABASE_PHASE_STARTED=false

if [[ $SOURCE_DIR != "$STAGING_ROOT/"* ]]; then
    echo "A origem deve estar dentro de $STAGING_ROOT." >&2
    exit 64
fi
if [[ ! -f $SOURCE_DIR/artisan || ! -f $SOURCE_DIR/composer.lock || ! -f $SOURCE_DIR/package-lock.json ]]; then
    echo 'Release incompleta: artisan, composer.lock ou package-lock.json ausente.' >&2
    exit 66
fi
if find "$SOURCE_DIR" -type l -print -quit | grep -q .; then
    echo 'A release em staging não pode conter links simbólicos.' >&2
    exit 65
fi
if [[ -e $RELEASE_DIR ]]; then
    echo "$RELEASE_DIR já existe; use um nome de release novo." >&2
    exit 73
fi
if [[ ! -f $ENV_FILE ]]; then
    echo "$ENV_FILE não existe; crie-o a partir do template antes do deploy." >&2
    exit 66
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y --no-install-recommends ffmpeg
    apt-get clean
fi

rollback_on_error() {
    local exit_code=$?
    if [[ $DATABASE_PHASE_STARTED == true ]]; then
        if [[ -L $CURRENT_LINK && -f $CURRENT_LINK/artisan ]]; then
            sudo -u www-data php "$CURRENT_LINK/artisan" down --retry=60 2>/dev/null || true
        fi
        echo 'O deploy falhou depois do início das migrations; a manutenção foi mantida para revisão manual.' >&2
        exit "$exit_code"
    fi
    if [[ -n $PREVIOUS_TARGET && -d $PREVIOUS_TARGET ]]; then
        ln -sfn "$PREVIOUS_TARGET" "$APP_ROOT/current.rollback"
        mv -Tf "$APP_ROOT/current.rollback" "$CURRENT_LINK"
        systemctl restart php8.4-fpm azon-queue.service azon-ssr.service 2>/dev/null || true
    elif [[ -L $CURRENT_LINK && $(readlink -f -- "$CURRENT_LINK") == "$RELEASE_DIR" ]]; then
        unlink "$CURRENT_LINK"
    fi
    if [[ $MAINTENANCE_ENABLED == true && -f $CURRENT_LINK/artisan ]]; then
        sudo -u www-data php "$CURRENT_LINK/artisan" up 2>/dev/null || true
    fi
    echo "Deploy interrompido (código $exit_code). O link da aplicação foi restaurado quando possível." >&2
    exit "$exit_code"
}
trap rollback_on_error ERR

if [[ -L $CURRENT_LINK ]]; then
    PREVIOUS_TARGET=$(readlink -f -- "$CURRENT_LINK")
fi

mv "$SOURCE_DIR" "$RELEASE_DIR"
chown -R azonadmin:www-data "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod 0750 {} +
find "$RELEASE_DIR" -type f -exec chmod 0640 {} +
chmod 0750 "$RELEASE_DIR/artisan"

rm -f -- "$RELEASE_DIR/.env"
ln -s "$ENV_FILE" "$RELEASE_DIR/.env"
rm -rf -- "$RELEASE_DIR/storage"
ln -s "$SHARED_DIR/storage" "$RELEASE_DIR/storage"
install -d -m 0770 -o www-data -g www-data "$RELEASE_DIR/bootstrap/cache"

cd "$RELEASE_DIR"
sudo -u azonadmin composer install \
    --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader
sudo -u azonadmin npm ci
sudo -u azonadmin npm run build:ssr

if [[ -L $RELEASE_DIR/bootstrap/cache ]]; then
    echo 'bootstrap/cache não pode ser um link simbólico após o build.' >&2
    exit 65
fi

chown -R www-data:www-data "$RELEASE_DIR/bootstrap/cache" "$SHARED_DIR/storage"

if [[ -n $PREVIOUS_TARGET ]]; then
    sudo -u www-data php "$PREVIOUS_TARGET/artisan" down --retry=60
    MAINTENANCE_ENABLED=true
    /usr/local/sbin/azon-backup-database
fi

DATABASE_PHASE_STARTED=true
sudo -u www-data php artisan migrate --force --no-interaction
sudo -u www-data php artisan db:seed --force --no-interaction
sudo -u www-data php artisan optimize:clear
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

if grep -Eq '^MEDIA_DISK=r2$' "$ENV_FILE"; then
    [[ ! -L public/storage ]] || unlink public/storage
else
    ln -sfnT "$SHARED_DIR/storage/app/public" public/storage
fi

ln -sfn "$RELEASE_DIR" "$APP_ROOT/current.new"
mv -Tf "$APP_ROOT/current.new" "$CURRENT_LINK"
systemctl restart php8.4-fpm
systemctl is-active --quiet php8.4-fpm
if systemctl cat azon-queue.service >/dev/null 2>&1; then
    bash "$RELEASE_DIR/deploy/azure/install-queue-service.sh"
    systemctl restart azon-queue.service azon-ssr.service
    systemctl is-active --quiet azon-queue.service
    systemctl is-active --quiet azon-ssr.service
fi
sudo -u www-data php artisan up
MAINTENANCE_ENABLED=false
if [[ -L /etc/nginx/sites-enabled/azon ]]; then
    healthy=false
    for _ in {1..10}; do
        if [[ -f /etc/letsencrypt/live/azonsocial.org.br/fullchain.pem ]]; then
            health_status=$(curl --silent --show-error --max-time 5 \
                --output /dev/null --write-out '%{http_code}' \
                --resolve azonsocial.org.br:443:127.0.0.1 \
                https://azonsocial.org.br/up || true)
        else
            health_status=$(curl --silent --show-error --max-time 5 \
                --output /dev/null --write-out '%{http_code}' \
                --header 'Host: azonsocial.org.br' \
                http://127.0.0.1/up || true)
        fi
        if [[ $health_status == 200 ]]; then
            healthy=true
            break
        fi
        sleep 1
    done
    if [[ $healthy != true ]]; then
        echo 'O health check HTTP /up falhou após ativar a release.' >&2
        false
    fi
fi
find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -nr \
    | awk 'NR > 5 { sub(/^[^ ]+ /, ""); print }' \
    | while IFS= read -r old_release; do
        if [[ -n $old_release && $old_release != "$PREVIOUS_TARGET" ]]; then
            rm -rf -- "$old_release"
        fi
    done

trap - ERR
echo "Release ativada: $RELEASE_DIR"
