"""Build a source-only local release with a fresh demonstration database."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT.parent / 'v1.zip'
if output.exists():
    raise SystemExit(f'Refusing to overwrite {output}')
staging = ROOT / 'tmp' / ('release-' + uuid.uuid4().hex)
staging.mkdir(parents=True)
database = staging / 'finpilot.db'
env = os.environ.copy()
env.update(PYTHONPATH=str(ROOT / 'backend'), DATABASE_URL='sqlite:///' + database.as_posix(), JWT_SECRET=uuid.uuid4().hex + uuid.uuid4().hex)
subprocess.run([sys.executable, '-m', 'app.seed'], cwd=ROOT, env=env, check=True)
with sqlite3.connect(database) as db:
    assert not db.execute('PRAGMA foreign_key_check').fetchall()
    counts = {t: db.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0] for t in ['users','topics','topic_relations','articles','learning_paths','lessons','quiz_questions','labs','posts','comments','likes','quiz_records','user_progress','chat_sessions','lab_records']}
    assert counts['users'] == 9 and counts['posts'] == 20 and counts['comments'] == 20
    assert all(counts[t] == 0 for t in ['quiz_records','user_progress','chat_sessions','lab_records'])
    db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
files = []
for folder in ['backend/app','backend/tests','frontend/src','frontend/public','content','scripts']:
    for path in (ROOT / folder).rglob('*'):
        if path.is_file() and not any(p in {'__pycache__','.pytest_cache'} for p in path.parts) and path.suffix != '.pyc' and path.name != 'polish-preview.mjs':
            files.append((path, path.relative_to(ROOT).as_posix()))
for pattern in ['backend/requirements*','frontend/tsconfig*.json','frontend/vite.config.ts','frontend/package*.json','frontend/index.html','frontend/.npmrc','*.cmd','README.md','.env.example','.gitignore','docs/*.md','docs/v1-*.json','docs/screenshots/v1-final/*']:
    files.extend((p,p.relative_to(ROOT).as_posix()) for p in ROOT.glob(pattern) if p.is_file() and p.name != 'v1-package-check.json')
files.append((database,'data/finpilot.db'))
manifest = {name:hashlib.sha256(path.read_bytes()).hexdigest() for path,name in sorted(files,key=lambda item:item[1])}
with zipfile.ZipFile(output,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    for path,name in files:
        archive.write(path,'v1/'+name)
    archive.writestr('v1/RELEASE_MANIFEST.json',json.dumps({'files':manifest,'clean_database_counts':counts},ensure_ascii=False,indent=2))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for name,digest in manifest.items():
        assert hashlib.sha256(archive.read('v1/'+name)).hexdigest()==digest
report={'status':'passed','archive':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'file_count':len(manifest)+1,'clean_database_counts':counts,'crc_and_manifest':'passed'}
(ROOT/'docs/v1-package-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
output.with_suffix('.zip.sha256').write_text(report['sha256']+'  '+output.name+'\n',encoding='ascii')
print(json.dumps(report,ensure_ascii=False,indent=2))
