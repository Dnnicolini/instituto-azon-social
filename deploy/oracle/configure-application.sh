#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/var/www/apps/azon/current
SHARED_DIR=/var/www/apps/azon/shared
ENV_DIR=/etc/azon

if [[ ! -f "$APP_DIR/artisan" ]]; then
    echo "Application files are missing from $APP_DIR." >&2
    exit 66
fi

install -d -m 0750 -o root -g www-data "$ENV_DIR"
install -d -m 0770 -o www-data -g www-data "$SHARED_DIR/database"
touch "$SHARED_DIR/database/database.sqlite"
chown www-data:www-data "$SHARED_DIR/database/database.sqlite"
chmod 0660 "$SHARED_DIR/database/database.sqlite"

if [[ -f "$ENV_DIR/production.env" ]]; then
    APP_KEY_VALUE="$(sed -n 's/^APP_KEY=//p' "$ENV_DIR/production.env" | head -n 1)"
fi
if [[ -z "${APP_KEY_VALUE:-}" ]]; then
    APP_KEY_VALUE="base64:$(openssl rand -base64 32 | tr -d '\n')"
fi
install -m 0640 -o root -g www-data /dev/null "$ENV_DIR/production.env"
printf '%s\n' \
    'APP_NAME="Instituto Azon Social"' \
    'APP_ENV=production' \
    "APP_KEY=$APP_KEY_VALUE" \
    'APP_DEBUG=false' \
    'APP_URL=https://azonsocial.org.br' \
    'APP_TIMEZONE=America/Sao_Paulo' \
    'APP_LOCALE=pt_BR' \
    'APP_FALLBACK_LOCALE=pt_BR' \
    'APP_MAINTENANCE_DRIVER=file' \
    'BCRYPT_ROUNDS=12' \
    'LOG_CHANNEL=stack' \
    'LOG_STACK=daily' \
    'LOG_DAILY_DAYS=14' \
    'LOG_LEVEL=warning' \
    'DB_CONNECTION=sqlite' \
    "DB_DATABASE=$SHARED_DIR/database/database.sqlite" \
    'SESSION_DRIVER=database' \
    'SESSION_LIFETIME=120' \
    'SESSION_ENCRYPT=true' \
    'SESSION_PATH=/' \
    'SESSION_DOMAIN=azonsocial.org.br' \
    'SESSION_SECURE_COOKIE=true' \
    'BROADCAST_CONNECTION=log' \
    'FILESYSTEM_DISK=local' \
    'QUEUE_CONNECTION=database' \
    'CACHE_STORE=database' \
    'MAIL_MAILER=log' \
    'MAIL_FROM_ADDRESS="instituto.azonsocial@gmail.com"' \
    'MAIL_FROM_NAME="${APP_NAME}"' \
    'VITE_APP_NAME="${APP_NAME}"' \
    > "$ENV_DIR/production.env"

if [[ ! -e "$APP_DIR/.env" ]]; then
    ln -s "$ENV_DIR/production.env" "$APP_DIR/.env"
fi

chown -R ubuntu:www-data "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 0750 {} +
find "$APP_DIR" -type f -exec chmod 0640 {} +
chmod 0750 "$APP_DIR/artisan"
install -d -m 0770 -o www-data -g www-data \
    "$APP_DIR/storage/app/public" \
    "$APP_DIR/storage/framework/cache/data" \
    "$APP_DIR/storage/framework/sessions" \
    "$APP_DIR/storage/framework/views" \
    "$APP_DIR/storage/logs" \
    "$APP_DIR/bootstrap/cache"
find "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" -type d -exec chmod 0770 {} +
find "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" -type f -exec chmod 0660 {} +
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"

cd "$APP_DIR"
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan db:seed --force
php artisan storage:link --force
sudo -u www-data php artisan optimize:clear
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

install -m 0644 /tmp/azon.nginx.conf /etc/nginx/sites-available/azon
ln -sfn /etc/nginx/sites-available/azon /etc/nginx/sites-enabled/azon
if [[ -L /etc/nginx/sites-enabled/default ]]; then
    unlink /etc/nginx/sites-enabled/default
fi
nginx -t
systemctl reload nginx

install -m 0644 /dev/null /etc/systemd/system/azon-queue.service
printf '%s\n' \
    '[Unit]' \
    'Description=Azon Laravel queue worker' \
    'After=network.target php8.4-fpm.service' \
    '' \
    '[Service]' \
    'Type=simple' \
    'User=www-data' \
    'Group=www-data' \
    "WorkingDirectory=$APP_DIR" \
    'ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --timeout=60 --max-time=3600 --memory=128' \
    'Restart=always' \
    'RestartSec=5' \
    'NoNewPrivileges=true' \
    'PrivateTmp=true' \
    'ProtectHome=true' \
    'ProtectSystem=full' \
    "ReadWritePaths=$APP_DIR/storage $APP_DIR/bootstrap/cache $SHARED_DIR/database" \
    'MemoryMax=192M' \
    '' \
    '[Install]' \
    'WantedBy=multi-user.target' \
    > /etc/systemd/system/azon-queue.service

install -m 0644 /dev/null /etc/systemd/system/azon-scheduler.service
printf '%s\n' \
    '[Unit]' \
    'Description=Azon Laravel scheduler tick' \
    '' \
    '[Service]' \
    'Type=oneshot' \
    'User=www-data' \
    'Group=www-data' \
    "WorkingDirectory=$APP_DIR" \
    'ExecStart=/usr/bin/php artisan schedule:run --no-interaction' \
    'NoNewPrivileges=true' \
    'PrivateTmp=true' \
    'ProtectHome=true' \
    'ProtectSystem=full' \
    "ReadWritePaths=$APP_DIR/storage $APP_DIR/bootstrap/cache $SHARED_DIR/database" \
    > /etc/systemd/system/azon-scheduler.service

install -m 0644 /dev/null /etc/systemd/system/azon-scheduler.timer
printf '%s\n' \
    '[Unit]' \
    'Description=Run the Azon Laravel scheduler every minute' \
    '' \
    '[Timer]' \
    'OnCalendar=*-*-* *:*:00' \
    'Persistent=true' \
    'AccuracySec=1s' \
    '' \
    '[Install]' \
    'WantedBy=timers.target' \
    > /etc/systemd/system/azon-scheduler.timer

systemctl daemon-reload
systemctl enable --now azon-queue.service azon-scheduler.timer

install -m 0750 /tmp/backup-application.sh /usr/local/sbin/azon-backup
install -m 0644 /dev/null /etc/systemd/system/azon-backup.service
printf '%s\n' \
    '[Unit]' \
    'Description=Local backup of the Azon database and uploads' \
    '' \
    '[Service]' \
    'Type=oneshot' \
    'ExecStart=/usr/local/sbin/azon-backup' \
    'Nice=10' \
    'IOSchedulingClass=idle' \
    > /etc/systemd/system/azon-backup.service

install -m 0644 /dev/null /etc/systemd/system/azon-backup.timer
printf '%s\n' \
    '[Unit]' \
    'Description=Daily local backup of the Azon application' \
    '' \
    '[Timer]' \
    'OnCalendar=*-*-* 03:20:00' \
    'Persistent=true' \
    'RandomizedDelaySec=10m' \
    '' \
    '[Install]' \
    'WantedBy=timers.target' \
    > /etc/systemd/system/azon-backup.timer

systemctl daemon-reload
systemctl enable --now azon-backup.timer

echo 'Application configured.'
