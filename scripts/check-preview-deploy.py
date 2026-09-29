"""Check preview isolation and execute recovery branches in temporary folders."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
bash = os.environ.get('BASH_EXE') or shutil.which('bash')
script = (root / 'deploy/deploy-server.sh').read_text(encoding='utf-8')
for name in ['deploy-server.sh', 'update-server.sh']:
    subprocess.run([bash, '-n', str(root / 'deploy' / name)], check=True)
for forbidden in ['/www/wwwroot/finpilot.cn', '/nginx/finpilot.cn.conf', '/www/finpilot/', 'finpilot.service', ':8000', 'killall', 'pkill']:
    assert forbidden not in script, forbidden
assert script.count('curl -fsS --max-time 10 http://127.0.0.1:4173/') == 2
assert 'finpilot-v1-preview.conf' in script
unit = (root / 'deploy/finpilot-v1.service').read_text()
assert '--host 127.0.0.1 --port 8001' in unit and 'User=finpilot-v1' in unit
nginx = (root / 'deploy/nginx-finpilot.conf').read_text()
assert 'listen 8088;' in nginx and 'listen 80;' not in nginx
assert 'proxy_pass http://127.0.0.1:8001;' in nginx
assert 'try_files $uri $uri/ /index.html;' in nginx
for block in re.findall(r"<<'PY'\n(.*?)\nPY", script, re.S):
    compile(block, '<embedded-python>', 'exec')
# Execute the actual shell recovery function, not a reimplementation.
recovery = script[script.index('    recover() {'):script.index('    set -E')]
checks = []
(root / 'tmp').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='preview-check-', dir=root / 'tmp') as temporary:
    for name, old_web, old_config, switched in [
        ('first-install', False, False, 1),
        ('update', True, True, 1),
        ('between-renames', True, True, 0),
        ('config-before-publish', False, False, 0),
    ]:
        folder = Path(temporary) / name
        folder.mkdir()
        paths = {key: folder / key for key in ['web','previous','staged','backup','config']}
        paths['backup'].mkdir()
        paths['config'].write_text('new-config')
        if old_config:
            (paths['backup'] / 'nginx.conf').write_text('old-config')
        if old_web:
            paths['previous'].mkdir()
            (paths['previous'] / 'index.html').write_text('old-preview')
        if switched:
            paths['web'].mkdir()
            (paths['web'] / 'index.html').write_text('new-preview')
        setup = '\n'.join(f"{key}='{path.as_posix()}'" for key, path in paths.items())
        shell = 'export PATH=/usr/bin:/bin:\n' + setup + f'\nswitched={switched}\nconfig_installed=1\nreload_done=0\n' + recovery + '\nfalse\nrecover\n'
        result = subprocess.run([bash, '-c', shell], capture_output=True, text=True, encoding="utf-8", errors="replace")
        assert result.returncode == 1, result.stderr
        if old_web:
            assert (paths['web'] / 'index.html').read_text() == 'old-preview'
        else:
            assert not paths['web'].exists(), result.stderr
        if old_config:
            assert paths['config'].read_text() == 'old-config'
        else:
            assert not paths['config'].exists()
            assert (paths['backup'] / 'failed-preview.conf').read_text() == 'new-config'
        checks.append(name)
report = {'bash_syntax':'passed','isolation_boundaries':'passed','embedded_python':'passed','actual_shell_recovery_cases':checks,'remote_execution':'not performed'}
(root / 'docs/deployment-check.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
