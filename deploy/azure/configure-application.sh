#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
APP_ROOT=/var/www/apps/azon
APP_DIR=$APP_ROOT/current
SHARED_DIR=$APP_ROOT/shared
ENV_DIR=/etc/azon
ENV_FILE=$ENV_DIR/production.env

if [[ ! -f $ENV_FILE ]]; then
    echo "$ENV_FILE ainda não existe." >&2
    echo "Copie production.env.example, preencha os segredos e aplique chmod 0640." >&2
    exit 66
fi

if [[ ! -L $APP_DIR || ! -f $APP_DIR/artisan ]]; then
    echo "Faça o primeiro deploy antes de configurar os serviços: $APP_DIR/artisan ausente." >&2
    exit 66
fi

# Nunca cria nem reescreve o arquivo de segredos existente.
chown root:www-data "$ENV_FILE"
chmod 0640 "$ENV_FILE"
install -d -m 0750 -o root -g www-data "$ENV_DIR"

install -m 0644 "$SCRIPT_DIR/azon.nginx.conf" /etc/nginx/sites-available/azon
ln -sfn /etc/nginx/sites-available/azon /etc/nginx/sites-enabled/azon
if [[ -L /etc/nginx/sites-enabled/default ]]; then
    unlink /etc/nginx/sites-enabled/default
fi
for log_file in /var/log/nginx/azon-access.log /var/log/nginx/azon-error.log; do
    if [[ -L $log_file ]]; then
        echo "Log não pode ser um link simbólico: $log_file" >&2
        exit 65
    fi
    touch -- "$log_file"
    chown root:adm "$log_file"
    chmod 0640 "$log_file"
done
nginx -t
systemctl reload nginx

bash "$SCRIPT_DIR/install-queue-service.sh"

cat > /etc/systemd/system/azon-scheduler.service <<EOF
[Unit]
Description=Azon Laravel scheduler tick
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/php artisan schedule:run --no-interaction
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=$SHARED_DIR/storage $APP_DIR/bootstrap/cache
EOF

cat > /etc/systemd/system/azon-scheduler.timer <<'EOF'
[Unit]
Description=Executa o scheduler do Azon a cada minuto

[Timer]
OnCalendar=*-*-* *:*:00
Persistent=true
AccuracySec=1s

[Install]
WantedBy=timers.target
EOF

cat > /etc/systemd/system/azon-ssr.service <<EOF
[Unit]
Description=Azon Inertia SSR server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/php artisan inertia:start-ssr
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=$SHARED_DIR/storage $APP_DIR/bootstrap/cache
MemoryMax=384M

[Install]
WantedBy=multi-user.target
EOF

install -m 0750 "$SCRIPT_DIR/backup-database.sh" /usr/local/sbin/azon-backup-database
cat > /etc/systemd/system/azon-backup.service <<'EOF'
[Unit]
Description=Backup lógico do PostgreSQL do Azon
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/azon-backup-database
Nice=10
IOSchedulingClass=idle
EOF

cat > /etc/systemd/system/azon-backup.timer <<'EOF'
[Unit]
Description=Backup diário do banco do Azon

[Timer]
OnCalendar=*-*-* 03:20:00
Persistent=true
RandomizedDelaySec=10m

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now \
    azon-queue.service \
    azon-scheduler.timer \
    azon-ssr.service \
    azon-backup.timer

echo 'Nginx, fila, scheduler, SSR e backup configurados.'
