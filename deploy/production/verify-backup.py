"""Restore a backup into a fresh temporary directory, never into production."""
import argparse,sqlite3,tempfile,shutil,json
from contextlib import closing
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('backup');args=p.parse_args();source=Path(args.backup).resolve()
if not source.is_file():raise SystemExit('Backup missing')
with tempfile.TemporaryDirectory(prefix='finpilot-restore-check-') as directory:
 restored=Path(directory)/'restored.db';shutil.copy2(source,restored)
 with closing(sqlite3.connect(restored)) as db:
  assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
  tables=[x[0] for x in db.execute("SELECT name FROM sqlite_master WHERE type='table'")]
  assert 'users' in tables
  print(json.dumps({'restored_copy':'ok','integrity':'ok','tables':len(tables),'users':db.execute('SELECT count(*) FROM users').fetchone()[0]}))
