#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DOMAIN=azonsocial.org.br
WWW_DOMAIN=www.azonsocial.org.br
ADMIN_DOMAIN=admin.azonsocial.org.br
EXPECTED_IP=${1:-${EXPECTED_IP:-}}
CONTACT_EMAIL=${2:-${CONTACT_EMAIL:-instituto.azonsocial@gmail.com}}

if [[ -z $EXPECTED_IP ]]; then
    echo "Uso: $0 EXPECTED_IP [CONTACT_EMAIL]" >&2
    echo 'Também é possível fornecer EXPECTED_IP e CONTACT_EMAIL pelo ambiente.' >&2
    exit 64
fi

if ! python3 - "$EXPECTED_IP" <<'PY'
import ipaddress
import sys

try:
    ipaddress.IPv4Address(sys.argv[1])
except ValueError:
    raise SystemExit(1)
PY
then
    echo 'EXPECTED_IP deve ser um endereço IPv4 válido.' >&2
    exit 64
fi

for host in "$DOMAIN" "$WWW_DOMAIN" "$ADMIN_DOMAIN"; do
    mapfile -t resolved_ips < <(getent ahostsv4 "$host" | awk '{ print $1 }' | sort -u)
    if [[ ${#resolved_ips[@]} -ne 1 || ${resolved_ips[0]:-} != "$EXPECTED_IP" ]]; then
        echo "$host resolve para '${resolved_ips[*]:-nada}', esperado '$EXPECTED_IP'." >&2
        exit 69
    fi
done

certbot --nginx --non-interactive --agree-tos --no-eff-email \
    --email "$CONTACT_EMAIL" --redirect \
    -d "$DOMAIN" -d "$WWW_DOMAIN" -d "$ADMIN_DOMAIN"

install -m 0644 "$SCRIPT_DIR/azon.nginx.tls.conf" /etc/nginx/sites-available/azon
for log_file in /var/log/nginx/azon-access.log /var/log/nginx/azon-error.log \
    /var/log/nginx/azon-admin-access.log /var/log/nginx/azon-admin-error.log; do
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
certbot renew --dry-run --no-random-sleep-on-renew

echo 'TLS ativado e renovação automática validada.'
