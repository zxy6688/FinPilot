#!/usr/bin/env bash
set -euo pipefail
# Entire main is parsed before git pull; an update cannot replace executing lines.
main() {
    local mode="${1:-deploy}"
    [[ "$mode" == deploy || "$mode" == --update ]] || { echo 'Usage: bash deploy-server.sh [--update]' >&2; exit 1; }
    [[ $EUID -eq 0 ]] || { echo 'Run in the Baota root terminal.' >&2; exit 1; }
    export PATH="/www/server/nginx/sbin:$PATH"
    export LC_ALL=C
    umask 027
    local cmd
    for cmd in git python3 node npm nginx curl tar systemctl ss runuser useradd flock realpath sha256sum cmp install; do
        command -v "$cmd" >/dev/null || { echo "Missing command: $cmd. Install it through your server administrator, then retry." >&2; exit 1; }
    done
    python3 -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11+ required"'
    node -e 'if (+process.versions.node.split(".")[0] < 20) process.exit(1)' || { echo 'Node.js 20+ required.' >&2; exit 1; }
    [[ "$(uname -m)" == x86_64 ]] || { echo 'Expected x86_64.' >&2; exit 1; }
    local source=/www/finpilot-v1 web=/www/wwwroot/finpilot-v1 config=/www/server/panel/vhost/nginx/finpilot-v1-preview.conf
    local unit=/etc/systemd/system/finpilot-v1.service repo=https://github.com/zxy6688/FinPilot.git
    local stamp backup previous staged before_requirements='' config_changed=0 switched=0 config_installed=0 reload_done=0
    stamp="$(date +%Y%m%d-%H%M%S)-$$"
    backup="/www/backup/finpilot-v1-$stamp"
    previous="/www/wwwroot/finpilot-v1.previous-$stamp"
    staged="/www/wwwroot/finpilot-v1.staging-$stamp"
    for cmd in "$source" "$web" "$config" /www/backup; do
        [[ ! -L "$cmd" && "$(realpath -m "$cmd")" == "$cmd" ]] || { echo "Refusing symlink or unexpected resolved path: $cmd" >&2; exit 1; }
    done
    [[ -d /www/server/panel/vhost/nginx ]] || { echo 'Baota Nginx include directory not found.' >&2; exit 1; }
    if [[ -f "$config" ]] && ! grep -Fxq '# FinPilot V1 isolated preview (managed)' "$config"; then
        echo 'Preview config already exists but is not managed by this script.' >&2; exit 1
    fi
    if ss -H -ltn 'sport = :8088' | grep -q .; then
        [[ -f "$config" ]] || { echo 'Port 8088 is occupied; no existing service will be stopped.' >&2; exit 1; }
    fi
    curl -fsS --max-time 10 http://127.0.0.1:4173/ >/dev/null || { echo 'Old preview is not reachable before deployment; stopping without changes.' >&2; exit 1; }
    [[ ! -e "$staged" && ! -e "$previous" ]] || exit 1
    nginx -t
    exec 9>/run/lock/finpilot-v1-deploy.lock
    flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
    # Back up only this independent preview, never the existing website.
    install -d -m 700 /www/backup "$backup"
    if [[ -d "$web" ]]; then
        tar -czf "$backup/preview-static.tar.gz" -C /www/wwwroot finpilot-v1
        tar -tzf "$backup/preview-static.tar.gz" >/dev/null
    fi
    if [[ -f "$config" ]]; then cp -a "$config" "$backup/nginx.conf"; fi
    if [[ -f "$unit" ]]; then cp -a "$unit" "$backup/finpilot-v1.service"; fi
    # Inspect includes without storing or backing up the old site configuration.
    nginx -T 2>&1 | python3 -c 'import re,sys; s=sys.stdin.read(); assert re.search(r"include\s+[\"\x27]?/www/server/panel/vhost/nginx/\*\.conf[\"\x27]?\s*;",s), "Expected Baota wildcard include not found"'
    # Never reset a dirty checkout or adopt an unrelated repository.
    if [[ -e "$source" ]]; then
        [[ -d "$source/.git" ]] || { echo '/www/finpilot-v1 exists but is not a Git repository.' >&2; exit 1; }
        [[ "$(git -C "$source" remote get-url origin)" == "$repo" ]] || { echo 'Unexpected origin; refusing to pull.' >&2; exit 1; }
        [[ "$(git -C "$source" branch --show-current)" == main ]] || { echo 'Expected main branch.' >&2; exit 1; }
        [[ -z "$(git -C "$source" status --porcelain)" ]] || { echo 'Working tree has changes; preserve and resolve them before updating.' >&2; exit 1; }
        git -C "$source" rev-parse HEAD >"$backup/source-commit.txt"
        [[ ! -f "$source/backend/requirements.lock.txt" ]] || before_requirements="$(sha256sum "$source/backend/requirements.lock.txt" | cut -d' ' -f1)"
        git -C "$source" fetch origin main
        # Do not publish local-only commits, even though pull --ff-only permits them.
        git -C "$source" merge-base --is-ancestor HEAD origin/main || { echo 'Local commits diverge from origin/main; no reset performed.' >&2; exit 1; }
        git -C "$source" pull --ff-only origin main
    else
        [[ "$mode" != --update ]] || { echo 'First run deploy-server.sh.' >&2; exit 1; }
        git clone --branch main --single-branch "$repo" "$source"
    fi
    cd "$source"
    for cmd in data logs tmp .cache .venv .env "$unit"; do
        [[ ! -L "$cmd" ]] || { echo "Refusing symlink at managed path: $cmd" >&2; exit 1; }
    done
    [[ -f backend/requirements.lock.txt && -f deploy/finpilot-v1.service && -f deploy/nginx-finpilot.conf ]] || { echo 'Incomplete release.' >&2; exit 1; }
    # Existing services/ports must belong to this exact deployment, never kill by name.
    if systemctl cat finpilot-v1.service >/dev/null 2>&1; then
        systemctl show finpilot-v1.service -p ExecStart --value | grep -Fq '/www/finpilot-v1/.venv/bin/python' || { echo 'Existing finpilot-v1.service has an unexpected command.' >&2; exit 1; }
    fi
    if ss -H -ltn 'sport = :8001' | grep -q .; then
        systemctl is-active --quiet finpilot-v1.service || { echo 'Port 8001 is held by an unmanaged service; not stopping it.' >&2; exit 1; }
        local backend_pid
        backend_pid="$(systemctl show finpilot-v1.service -p MainPID --value)"
        ss -H -ltnp 'sport = :8001' | grep -Fq "pid=$backend_pid," || { echo 'Port 8001 owner differs from finpilot-v1.service.' >&2; exit 1; }
    fi
    install -d -m 755 data logs tmp .cache
    export TMPDIR="$source/tmp" PIP_CACHE_DIR="$source/.cache/pip" NPM_CONFIG_CACHE="$source/.cache/npm"
    if [[ ! -x .venv/bin/python ]]; then python3 -m venv .venv; before_requirements=''; fi
    if [[ "$mode" != --update || "$before_requirements" != "$(sha256sum backend/requirements.lock.txt | cut -d' ' -f1)" || ! -f .cache/requirements-installed.sha256 ]] || ! cmp -s <(sha256sum backend/requirements.lock.txt) .cache/requirements-installed.sha256; then
        .venv/bin/python -m pip install -r backend/requirements.lock.txt
        sha256sum backend/requirements.lock.txt >.cache/requirements-installed.sha256
    fi
    if [[ ! -f .env ]]; then
        install -m 600 .env.example .env
        # No embedded/generated production secret. Input occurs only on the server.
        [[ -t 0 ]] || { echo 'Created .env. Set a production random JWT_SECRET on the server and rerun.' >&2; exit 1; }
        local jwt
        printf 'Paste a password-manager-generated random JWT secret (48+ letters/digits/_/-; hidden): '
        IFS= read -rs jwt; printf '\n'
        [[ "$jwt" =~ ^[A-Za-z0-9_-]{48,}$ && ${#jwt} -le 256 ]] || { echo 'Invalid secret format. Configure .env on server and rerun.' >&2; exit 1; }
        printf 'DATABASE_URL=sqlite:///data/finpilot.db\nJWT_SECRET=%s\nLLM_API_KEY=\nLLM_MODEL=\nCORS_ORIGINS=http://43.143.241.109:8088,http://127.0.0.1:8088\n' "$jwt" >.env
        unset jwt
    fi
    .venv/bin/python - <<'PY'
from dotenv import dotenv_values
import re
from pathlib import Path
db = Path("data/finpilot.db")
assert not db.is_symlink() and (not db.exists() or db.stat().st_nlink == 1), "Refusing linked database; keep preview data independent"
v = dotenv_values('.env')
s = v.get('JWT_SECRET') or ''
assert re.fullmatch(r'[A-Za-z0-9_-]{48,256}', s) and len(set(s)) >= 16, 'Set a strong production random JWT_SECRET in .env; do not share it.'
assert v.get('DATABASE_URL') in ('sqlite:///data/finpilot.db','sqlite:////www/finpilot-v1/data/finpilot.db'), 'Unexpected database path; preserve it and resolve manually.'
PY
    # Reject inherited shell overrides so seed and systemd use the same .env.
    unset DATABASE_URL JWT_SECRET LLM_API_KEY LLM_MODEL LLM_BASE_URL CORS_ORIGINS
    (cd frontend && npm ci && npm run build)
    [[ -s frontend/dist/index.html && -d frontend/dist/assets ]] || { echo 'Build output is incomplete.' >&2; exit 1; }
    install -d -m 755 "$staged"
    cp -a frontend/dist/. "$staged/"
    chmod -R a+rX "$staged"
    # Previous tree is retained, not deleted. On failure, restore static/config only;
    # never silently roll back a live database or force-reset source.
    recover() {
        local code=$?
        trap - ERR
        set +e
        if [[ $switched -eq 1 ]]; then
            mv "$web" "$staged.failed"
            if [[ -d "$previous" ]]; then mv "$previous" "$web"; fi
        elif [[ -d "$previous" && ! -e "$web" ]]; then
            if [[ -d "$previous" ]]; then mv "$previous" "$web"; fi
        fi
        if [[ $config_installed -eq 1 ]]; then
            if [[ -f "$backup/nginx.conf" ]]; then
                cp -a "$backup/nginx.conf" "$config"
            else
                mv "$config" "$backup/failed-preview.conf"
            fi
            if [[ $reload_done -eq 1 ]] && nginx -t; then nginx -s reload; fi
        fi
        echo "Deployment FAILED (exit $code). Backup: $backup" >&2
        echo 'Static/config recovery attempted. Source, dependencies and database were not rolled back; inspect systemctl status finpilot-v1 and journalctl -u finpilot-v1.' >&2
        exit "$code"
    }
    set -E
    trap recover ERR
    if ! id finpilot-v1 >/dev/null 2>&1; then useradd --system --user-group --home-dir "$source" --no-create-home --shell /sbin/nologin finpilot-v1; fi
    [[ "$(id -u finpilot-v1)" != 0 ]] || { echo 'finpilot must not be root.' >&2; exit 1; }
    getent group finpilot-v1 >/dev/null
    chmod 755 "$source"
    chmod -R a+rX backend content .venv
    chown root:finpilot-v1 .env
    chmod 640 .env
    chown -R finpilot-v1:finpilot-v1 data logs
    chmod 750 data logs
    # A short backend restart window; keep 4173 untouched throughout.
    systemctl stop finpilot-v1.service 2>/dev/null || { [[ ! -f "$unit" ]]; }
    if [[ -f data/finpilot.db ]]; then
        .venv/bin/python - "$backup/database.db" <<'PY'
import sqlite3,sys
with sqlite3.connect('data/finpilot.db') as src, sqlite3.connect(sys.argv[1]) as dst:
    src.backup(dst)
PY
    fi
    runuser -u finpilot-v1 -- env PYTHONPATH="$source/backend" PYTHONDONTWRITEBYTECODE=1 "$source/.venv/bin/python" -m app.seed
    install -m 644 deploy/finpilot-v1.service "$unit"
    systemctl daemon-reload
    systemctl enable finpilot-v1.service
    systemctl restart finpilot-v1.service
    local ready=0 i
    for i in {1..30}; do
        if curl -fsS --max-time 2 http://127.0.0.1:8001/api/health | python3 -c 'import sys,json; assert json.load(sys.stdin)["status"] == "ok"' 2>/dev/null; then ready=1; break; fi
        sleep 1
    done
    [[ $ready -eq 1 ]] || { echo 'Backend health check failed.' >&2; false; }
    if ! cmp -s deploy/nginx-finpilot.conf "$config"; then
        config_changed=1
        config_installed=1
        install -m 644 deploy/nginx-finpilot.conf "$config"
    fi
    install -d -m 755 /www/wwwlogs
    # Warnings about duplicate hosts also fail, avoiding a false healthy old site.
    nginx -t >"$backup/nginx-test.txt" 2>&1 || { cat "$backup/nginx-test.txt" >&2; false; }
    if grep -qi 'conflicting server name' "$backup/nginx-test.txt"; then
        echo 'Nginx has a duplicate server_name; restore config and resolve before retry.' >&2; false
    fi
    if [[ -d "$web" ]]; then mv "$web" "$previous"; fi
    mv "$staged" "$web"
    switched=1
    if [[ $config_changed -eq 1 ]]; then nginx -s reload; reload_done=1; fi
    # Retry once workers finish their graceful configuration reload.
    ready=0
    for i in {1..10}; do
        if curl -fsS --max-time 5 http://127.0.0.1:8088/ >"$backup/frontend-response.html" && cmp -s "$web/index.html" "$backup/frontend-response.html"; then ready=1; break; fi
        sleep 1
    done
    [[ $ready -eq 1 ]] || { echo 'Nginx did not serve this release.' >&2; false; }
    curl -fsS --max-time 10 http://127.0.0.1:8088/api/health | python3 -c 'import json,sys; assert json.load(sys.stdin)["status"] == "ok"'
    curl -fsS --max-time 10 http://127.0.0.1:8088/learn/1 >"$backup/spa-response.html"
    cmp "$web/index.html" "$backup/spa-response.html"
    systemctl is-active --quiet finpilot-v1.service
    curl -fsS --max-time 10 http://127.0.0.1:4173/ >/dev/null || { echo 'Old preview post-check failed; recovering the new preview only.' >&2; false; }
    trap - ERR
    echo 'Old preview status: still reachable on :4173'
    echo 'Frontend status: verified production build and SPA fallback'
    echo "Backend systemd status: $(systemctl is-active finpilot-v1.service)"
    echo 'API health: ok (direct and Nginx proxy)'
    echo 'Nginx status: configuration valid; HTTP verified'
    echo 'Public testing URL: http://43.143.241.109:8088/'
    echo 'External browser acceptance is still required; loopback success does not prove public ingress.'
    echo "Previous website retained at: $previous"
    if ss -H -ltn 'sport = :4173' | grep -q .; then
        echo 'Old service still listening on :4173. It was NOT stopped.'
        ss -H -ltnp 'sport = :4173'
    fi
}
main "$@"
