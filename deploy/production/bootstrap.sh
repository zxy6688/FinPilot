#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo'; exit 1; }
source /etc/os-release
[[ "$ID" == ubuntu ]] || { echo 'Only verified Ubuntu is supported by this bootstrap'; exit 1; }
base=$(cd -- "$(dirname -- "$0")" && pwd)
if systemctl is-active --quiet nginx || systemctl is-active --quiet apache2; then echo 'Existing web server detected; inspect it before changing ports.'; exit 1; fi
if [[ -f /etc/caddy/Caddyfile ]] && ! cmp -s "$base/Caddyfile" /etc/caddy/Caddyfile; then
    echo 'Existing Caddy configuration found; preserve and review before installing.'; exit 1
fi
apt-get update
apt-get install -y python3 python3-venv curl ca-certificates caddy
id finpilot >/dev/null 2>&1 || useradd --system --home /var/lib/finpilot --shell /usr/sbin/nologin finpilot
install -d -m 0755 /opt/finpilot/releases
install -d -o finpilot -g finpilot -m 0700 /var/lib/finpilot /var/log/finpilot
install -d -m 0700 /etc/finpilot /var/backups/finpilot
if [[ ! -f /etc/finpilot/production.env ]]; then
    umask 077
    python3 - <<'PY'
import secrets
from pathlib import Path
p=Path('/etc/finpilot/production.env')
p.write_text('FINPILOT_ENV=production\nDATABASE_URL=sqlite:////var/lib/finpilot/finpilot.db\nJWT_SECRET='+secrets.token_urlsafe(64)+'\nFINPILOT_ALLOW_SHARED_DEMO=false\nFINPILOT_LOG_DIR=/var/log/finpilot\nCORS_ORIGINS=https://finpilot.cn,https://www.finpilot.cn\nLLM_API_KEY=\nLLM_MODEL=\n')
p.chmod(0o600)
PY
fi
install -m 0644 "$base/finpilot.service" /etc/systemd/system/finpilot.service
install -m 0644 "$base/finpilot-backup.service" /etc/systemd/system/finpilot-backup.service
install -m 0644 "$base/finpilot-backup.timer" /etc/systemd/system/finpilot-backup.timer
caddy validate --config "$base/Caddyfile" --adapter caddyfile
install -m 0644 "$base/Caddyfile" /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable finpilot caddy finpilot-backup.timer
systemctl start finpilot-backup.timer
echo 'Bootstrap ready. Firewall and DNS are deliberately unchanged; activate an uploaded release next.'
