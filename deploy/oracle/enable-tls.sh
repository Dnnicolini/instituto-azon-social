#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN=azonsocial.org.br
WWW_DOMAIN=www.azonsocial.org.br
ADMIN_DOMAIN=admin.azonsocial.org.br
EXPECTED_IP=203.0.113.10
CONTACT_EMAIL=instituto.azonsocial@gmail.com

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
