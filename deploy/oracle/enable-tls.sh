#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="${DOMAIN:-azonsocial.org.br}"
WWW_DOMAIN="${WWW_DOMAIN:-www.azonsocial.org.br}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.azonsocial.org.br}"
: "${EXPECTED_IP:?Set EXPECTED_IP to the server public IPv4 address.}"
: "${CONTACT_EMAIL:?Set CONTACT_EMAIL to the certificate notification address.}"

if [[ ! "$EXPECTED_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo 'EXPECTED_IP must be a valid IPv4 address.' >&2
    exit 64
fi
IFS=. read -r -a IP_OCTETS <<< "$EXPECTED_IP"
for OCTET in "${IP_OCTETS[@]}"; do
    if ((10#$OCTET > 255)); then
        echo 'EXPECTED_IP must be a valid IPv4 address.' >&2
        exit 64
    fi
done
if [[ "$CONTACT_EMAIL" != *@*.* ]]; then
    echo 'CONTACT_EMAIL must be a valid email address.' >&2
    exit 64
fi

for HOST in "$DOMAIN" "$WWW_DOMAIN" "$ADMIN_DOMAIN"; do
    RESOLVED_IP="$(getent ahostsv4 "$HOST" | awk 'NR == 1 { print $1 }')"
    if [[ "$RESOLVED_IP" != "$EXPECTED_IP" ]]; then
        echo "$HOST resolves to ${RESOLVED_IP:-nothing}, expected $EXPECTED_IP." >&2
        exit 69
    fi
done

certbot --nginx --non-interactive --agree-tos --no-eff-email \
    --email "$CONTACT_EMAIL" --redirect \
    -d "$DOMAIN" -d "$WWW_DOMAIN" -d "$ADMIN_DOMAIN"

install -m 0644 /tmp/azon.nginx.tls.conf /etc/nginx/sites-available/azon

nginx -t
systemctl reload nginx
certbot renew --dry-run --no-random-sleep-on-renew

echo 'TLS enabled and renewal verified.'
