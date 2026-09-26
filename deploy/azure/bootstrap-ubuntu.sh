#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

if [[ $# -ne 1 ]]; then
    echo "Uso: $0 ADMIN_CIDR" >&2
    echo "Exemplo: $0 203.0.113.10/32" >&2
    exit 64
fi

ADMIN_CIDR=$1

if ! python3 - "$ADMIN_CIDR" <<'PY'
import ipaddress
import sys

try:
    network = ipaddress.ip_network(sys.argv[1], strict=False)
except ValueError:
    raise SystemExit(1)

if network.version != 4:
    raise SystemExit(1)
PY
then
    echo 'ADMIN_CIDR deve ser uma rede IPv4 válida (prefira IP/32).' >&2
    exit 64
fi

if ! id azonadmin >/dev/null 2>&1; then
    echo 'O usuário Azure azonadmin não existe nesta VM.' >&2
    exit 67
fi
usermod -aG www-data azonadmin

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
    ca-certificates certbot curl fail2ban ffmpeg git gnupg nginx openssl \
    postgresql postgresql-client python3-certbot-nginx rsync software-properties-common \
    ufw unattended-upgrades unzip util-linux

add-apt-repository -y ppa:ondrej/php

install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error --location \
    https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor --yes --output /etc/apt/keyrings/nodesource.gpg
chmod 0644 /etc/apt/keyrings/nodesource.gpg
printf '%s\n' \
    'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' \
    > /etc/apt/sources.list.d/nodesource.list

apt-get update
apt-get install -y --no-install-recommends \
    nodejs php8.4-cli php8.4-fpm php8.4-bcmath php8.4-curl php8.4-gd \
    php8.4-intl php8.4-mbstring php8.4-opcache php8.4-pgsql php8.4-xml php8.4-zip

if [[ $(node --version) != v22.* ]]; then
    echo "Node.js 22 não foi instalado: $(node --version)." >&2
    exit 70
fi

EXPECTED_COMPOSER_SIGNATURE=$(curl --fail --silent --show-error https://composer.github.io/installer.sig)
COMPOSER_INSTALLER=$(mktemp)
trap 'rm -f -- "$COMPOSER_INSTALLER"' EXIT
curl --fail --silent --show-error https://getcomposer.org/installer -o "$COMPOSER_INSTALLER"
ACTUAL_COMPOSER_SIGNATURE=$(php -r "echo hash_file('sha384', '$COMPOSER_INSTALLER');")
if [[ $EXPECTED_COMPOSER_SIGNATURE != "$ACTUAL_COMPOSER_SIGNATURE" ]]; then
    echo 'A assinatura do instalador do Composer não confere.' >&2
    exit 70
fi
php "$COMPOSER_INSTALLER" --quiet --install-dir=/usr/local/bin --filename=composer
COMPOSER_ALLOW_SUPERUSER=1 composer --version

install -d -m 0755 \
    /var/www/apps/azon/releases \
    /var/www/apps/azon/staging
install -d -m 0770 -o www-data -g www-data \
    /var/www/apps/azon/shared/storage/app/public \
    /var/www/apps/azon/shared/storage/framework/cache/data \
    /var/www/apps/azon/shared/storage/framework/sessions \
    /var/www/apps/azon/shared/storage/framework/views \
    /var/www/apps/azon/shared/storage/logs
chown azonadmin:azonadmin /var/www/apps/azon/staging
chmod 0750 /var/www/apps/azon/staging

install -d -m 0755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-azon-hardening.conf <<'SSH'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers azonadmin
SSH
sshd -t
systemctl reload ssh

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow from "$ADMIN_CIDR" to any port 22 proto tcp comment 'SSH administrativo'
ufw allow 80/tcp comment 'HTTP público'
ufw allow 443/tcp comment 'HTTPS público'
ufw --force enable

install -d -m 0755 /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/sshd.local <<'FAIL2BAN'
[sshd]
enabled = true
banaction = ufw
maxretry = 5
findtime = 10m
bantime = 1h
FAIL2BAN
systemctl enable --now fail2ban

if [[ -f /etc/php/8.4/fpm/pool.d/www.conf ]]; then
    mv /etc/php/8.4/fpm/pool.d/www.conf /etc/php/8.4/fpm/pool.d/www.conf.disabled
fi
cat > /etc/php/8.4/fpm/pool.d/azon.conf <<'PHPFPM'
[azon]
user = www-data
group = www-data
listen = /run/php/php8.4-fpm-azon.sock
listen.owner = www-data
listen.group = www-data
pm = ondemand
pm.max_children = 8
pm.process_idle_timeout = 10s
pm.max_requests = 500
catch_workers_output = yes
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 200M
php_admin_value[post_max_size] = 210M
PHPFPM

cat > /etc/php/8.4/mods-available/99-azon-opcache.ini <<'OPCACHE'
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=128
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.save_comments=1
realpath_cache_size=4096K
realpath_cache_ttl=600
OPCACHE
phpenmod 99-azon-opcache
php-fpm8.4 -t
systemctl enable --now nginx php8.4-fpm
systemctl restart php8.4-fpm

dpkg-reconfigure -f noninteractive unattended-upgrades
apt-get -o DPkg::Lock::Timeout=300 autoremove -y
apt-get clean

echo 'Bootstrap Azure concluído.'
