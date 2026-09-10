#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 ADMIN_CIDR" >&2
    exit 64
fi

ADMIN_CIDR="$1"

if [[ ! "$ADMIN_CIDR" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/32$ ]]; then
    echo "ADMIN_CIDR must be one IPv4 address with a /32 suffix." >&2
    exit 64
fi

export DEBIAN_FRONTEND=noninteractive

if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y --no-install-recommends \
    ca-certificates certbot curl git gnupg2 nginx python3-certbot-nginx rsync \
    sqlite3 software-properties-common ufw fail2ban unattended-upgrades unzip

add-apt-repository -y ppa:ondrej/php
apt-get update
apt-get install -y --no-install-recommends \
    php8.4-cli php8.4-fpm php8.4-bcmath php8.4-curl php8.4-gd php8.4-intl \
    php8.4-mbstring php8.4-opcache php8.4-sqlite3 php8.4-xml php8.4-zip

EXPECTED_COMPOSER_SIGNATURE="$(curl --fail --silent --show-error https://composer.github.io/installer.sig)"
curl --fail --silent --show-error https://getcomposer.org/installer -o /tmp/composer-setup.php
ACTUAL_COMPOSER_SIGNATURE="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
if [[ "$EXPECTED_COMPOSER_SIGNATURE" != "$ACTUAL_COMPOSER_SIGNATURE" ]]; then
    rm -f /tmp/composer-setup.php
    echo 'Composer installer signature verification failed.' >&2
    exit 70
fi
php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
rm -f /tmp/composer-setup.php

install -d -m 0755 /var/www/apps/azon/current

install -m 0644 /dev/null /etc/ssh/sshd_config.d/99-azon-hardening.conf
printf '%s\n' \
    'PasswordAuthentication no' \
    'KbdInteractiveAuthentication no' \
    'PermitRootLogin no' \
    'PubkeyAuthentication yes' \
    'MaxAuthTries 3' \
    'AllowUsers ubuntu' \
    > /etc/ssh/sshd_config.d/99-azon-hardening.conf
sshd -t
systemctl reload ssh

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow from "$ADMIN_CIDR" to any port 22 proto tcp comment 'SSH administrativo'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# Oracle Ubuntu images ship an early SSH accept and reject rule ahead of UFW.
# Remove only those two legacy INPUT rules so the least-privilege UFW policy is
# actually evaluated, while preserving all Oracle instance-service egress rules.
iptables -D INPUT -p tcp -m state --state NEW -m tcp --dport 22 -j ACCEPT 2>/dev/null || true
iptables -D INPUT -j REJECT --reject-with icmp-host-prohibited 2>/dev/null || true

install -d -m 0755 /etc/fail2ban/jail.d
printf '%s\n' \
    '[sshd]' \
    'enabled = true' \
    'banaction = ufw' \
    'maxretry = 5' \
    'findtime = 10m' \
    'bantime = 1h' \
    > /etc/fail2ban/jail.d/sshd.local
systemctl enable --now fail2ban

if [[ -f /etc/php/8.4/fpm/pool.d/www.conf ]]; then
    mv /etc/php/8.4/fpm/pool.d/www.conf /etc/php/8.4/fpm/pool.d/www.conf.disabled
fi

install -m 0644 /dev/null /etc/php/8.4/fpm/pool.d/azon.conf
printf '%s\n' \
    '[azon]' \
    'user = www-data' \
    'group = www-data' \
    'listen = /run/php/php8.4-fpm-azon.sock' \
    'listen.owner = www-data' \
    'listen.group = www-data' \
    'pm = ondemand' \
    'pm.max_children = 3' \
    'pm.process_idle_timeout = 10s' \
    'pm.max_requests = 500' \
    'catch_workers_output = yes' \
    'php_admin_value[memory_limit] = 192M' \
    'php_admin_value[upload_max_filesize] = 10M' \
    'php_admin_value[post_max_size] = 12M' \
    > /etc/php/8.4/fpm/pool.d/azon.conf

install -m 0644 /dev/null /etc/php/8.4/mods-available/99-azon-opcache.ini
printf '%s\n' \
    'opcache.enable=1' \
    'opcache.enable_cli=0' \
    'opcache.memory_consumption=64' \
    'opcache.interned_strings_buffer=8' \
    'opcache.max_accelerated_files=10000' \
    'opcache.validate_timestamps=0' \
    'opcache.save_comments=1' \
    'realpath_cache_size=4096K' \
    'realpath_cache_ttl=600' \
    > /etc/php/8.4/mods-available/99-azon-opcache.ini
phpenmod 99-azon-opcache
php-fpm8.4 -t
systemctl enable --now php8.4-fpm nginx
systemctl restart php8.4-fpm

dpkg-reconfigure -f noninteractive unattended-upgrades
apt-get autoremove -y
apt-get clean

echo 'Bootstrap completed.'
