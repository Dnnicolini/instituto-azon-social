#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

APP_DIR=/var/www/apps/azon/current
SHARED_DIR=/var/www/apps/azon/shared

cat > /etc/systemd/system/azon-queue.service <<EOF
[Unit]
Description=Azon Laravel queue worker
After=network-online.target php8.4-fpm.service
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --timeout=900 --max-time=3600 --memory=192
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=$SHARED_DIR/storage $APP_DIR/bootstrap/cache
MemoryMax=768M

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
