#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo 'O Azure Run Command deve executar este script como root.' >&2
    exit 77
fi

if [[ $# -ne 2 || ! $1 =~ ^[0-9a-f]{40}$ || ! $2 =~ ^[0-9]+$ ]]; then
    echo 'Uso: deploy-from-github.sh SHA_DE_40_CARACTERES RUN_ID_NUMERICO' >&2
    exit 64
fi

EXPECTED_SHA=$1
RUN_ID=$2
APP_ROOT=/var/www/apps/azon
RELEASE_NAME="gh-${EXPECTED_SHA:0:12}-${RUN_ID}"
STAGING_DIR="$APP_ROOT/staging/$RELEASE_NAME"

if [[ ! -d $APP_ROOT/staging ]]; then
    echo 'A área de staging precisa estar configurada antes do CD.' >&2
    exit 66
fi
if [[ -e $STAGING_DIR || -e $APP_ROOT/releases/$RELEASE_NAME ]]; then
    echo 'A release desta execução já existe; inicie uma nova execução.' >&2
    exit 73
fi

TEMP_DIR=$(mktemp -d /var/tmp/azon-cd.XXXXXX)
cleanup() {
    if [[ -d $TEMP_DIR && $TEMP_DIR == /var/tmp/azon-cd.* ]]; then
        rm -rf -- "$TEMP_DIR"
    fi
}
trap cleanup EXIT

GIT_TERMINAL_PROMPT=0 git clone --quiet --depth 1 --branch main \
    https://github.com/Dnnicolini/instituto-azon-social.git "$TEMP_DIR/repo"
ACTUAL_SHA=$(git -C "$TEMP_DIR/repo" rev-parse HEAD)
if [[ $ACTUAL_SHA != "$EXPECTED_SHA" ]]; then
    echo 'O main mudou desde a aprovação do workflow; inicie uma nova execução.' >&2
    exit 75
fi

install -d -m 0750 -o azonadmin -g azonadmin "$STAGING_DIR"
git -C "$TEMP_DIR/repo" archive --format=tar HEAD | tar -x -C "$STAGING_DIR"
if [[ ! -f $STAGING_DIR/artisan || ! -f $STAGING_DIR/deploy/azure/deploy-release.sh ]]; then
    echo 'A release baixada do Git está incompleta.' >&2
    exit 66
fi
if find "$STAGING_DIR" -type l -print -quit | grep -q .; then
    echo 'A release baixada do Git não pode conter links simbólicos.' >&2
    exit 65
fi
printf '%s\n' "$EXPECTED_SHA" > "$STAGING_DIR/.deploy-revision"

bash "$STAGING_DIR/deploy/azure/deploy-release.sh" "$STAGING_DIR"
if [[ $(cat "$APP_ROOT/current/.deploy-revision") != "$EXPECTED_SHA" ]]; then
    echo 'O commit ativo na VM não corresponde ao commit aprovado.' >&2
    exit 1
fi
printf 'AZON_DEPLOY_OK=%s\n' "$EXPECTED_SHA"
