# Oracle Cloud production deployment

This directory contains the non-secret host bootstrap and Nginx virtual host used
for `azonsocial.org.br`. It is intentionally safe to keep in version control.

The production `.env`, SSH private key, generated application key, database and
uploaded files must stay outside Git. The server layout reserves one directory and
one PHP-FPM pool per application so more sites can be added without sharing app
credentials or writable storage.

Run the bootstrap once as root, passing the administrator's current public IPv4
address as a `/32` CIDR. Deploy application files to
`/var/www/apps/azon/current`, enable `azon.nginx.conf`, then issue the TLS
certificate with `enable-tls.sh` only after the DNS A record points to the VM.
The TLS step installs `azon.nginx.tls.conf`, redirects HTTP and `www` to the
canonical HTTPS domain, redirects `admin.azonsocial.org.br` to the protected
`/admin` area, and verifies automatic certificate renewal. Configure the root,
`www` and `admin` DNS records before running it.

The daily backup timer keeps seven days of SQLite and upload snapshots under
`/var/backups/azon`. These local copies protect against accidental application
changes, but an off-machine backup is still required to protect against volume
failure.
