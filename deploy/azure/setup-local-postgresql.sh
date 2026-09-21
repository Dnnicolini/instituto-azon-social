#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'Execute este script como root.' >&2
    exit 77
fi

if ! command -v pg_lsclusters >/dev/null || ! command -v pg_conftool >/dev/null; then
    echo 'Instale o servidor PostgreSQL antes de configurar o banco local.' >&2
    exit 69
fi

mapfile -t clusters < <(pg_lsclusters --no-header | awk '$2 == "main" { print $1 }')
if [[ ${#clusters[@]} -ne 1 ]]; then
    echo 'Esperado exatamente um cluster PostgreSQL main nesta VM.' >&2
    exit 69
fi

version=${clusters[0]}
systemctl enable --now postgresql

# O banco é acessível apenas pelo socket Unix, sem porta TCP aberta.
pg_conftool "$version" main set listen_addresses ''
pg_ctlcluster "$version" main restart

if ! sudo -u postgres psql --no-psqlrc --tuples-only --no-align \
    --command "SELECT 1 FROM pg_roles WHERE rolname = 'www-data'" \
    | grep -qx 1; then
    sudo -u postgres createuser --no-superuser --no-createdb --no-createrole \
        --login -- "www-data"
fi

database_owner=$(sudo -u postgres psql --no-psqlrc --tuples-only --no-align \
    --command "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'azon'")
if [[ -z $database_owner ]]; then
    sudo -u postgres createdb --owner=www-data --encoding=UTF8 \
        --template=template0 -- azon
elif [[ $database_owner != www-data ]]; then
    echo "O banco azon já existe e pertence a $database_owner; nenhuma alteração foi feita nele." >&2
    exit 73
fi

if ! sudo -u www-data psql --no-psqlrc --host=/var/run/postgresql \
    --username=www-data --dbname=azon --tuples-only --no-align \
    --command 'SELECT 1' | grep -qx 1; then
    echo 'A autenticação local por socket/peer não funcionou.' >&2
    exit 69
fi

if ss -ltn '( sport = :5432 )' | grep -q ':5432'; then
    echo 'O PostgreSQL está escutando na porta TCP 5432; revise o cluster.' >&2
    exit 69
fi

echo 'PostgreSQL local configurado: banco azon, usuário www-data, somente socket Unix.'
