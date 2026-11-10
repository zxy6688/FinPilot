#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run with sudo'; exit 1; }
sha=${1:?release SHA required}
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid SHA'; exit 1; }
release="/opt/finpilot/releases/$sha"
[[ -f "$release/frontend/dist/index.html" && -f "$release/backend/app/main.py" ]] || { echo 'Incomplete release'; exit 1; }
[[ -f /etc/finpilot/production.env ]] || { echo 'Production environment missing'; exit 1; }
previous=$(readlink -f /opt/finpilot/current || true)
if [[ -f /var/lib/finpilot/finpilot.db ]]; then python3 "$release/deploy/production/backup.py"; fi
python3 -m venv "$release/.venv"
"$release/.venv/bin/python" -m pip install --disable-pip-version-check -r "$release/backend/requirements.lock.txt"
chown -R root:root "$release"
chmod -R a+rX "$release"
ln -sfn "$release" /opt/finpilot/current.next
mv -Tf /opt/finpilot/current.next /opt/finpilot/current
systemctl restart finpilot
healthy=false
for attempt in $(seq 1 60); do
    if curl -fsS http://127.0.0.1:8004/api/health >/dev/null; then healthy=true; break; fi
    sleep 2
done
if [[ $healthy != true ]]; then
    if [[ "$previous" == /opt/finpilot/releases/* && -d "$previous" ]]; then
        ln -sfn "$previous" /opt/finpilot/current.previous
        mv -Tf /opt/finpilot/current.previous /opt/finpilot/current
        systemctl restart finpilot
    fi
    echo 'Health failed. Application reverted where possible; database was not rolled back.' >&2
    exit 1
fi
printf '%s\n' "$previous" > /opt/finpilot/previous-release
systemctl reload caddy
echo "Activated $sha"
