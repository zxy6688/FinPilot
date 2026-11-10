"""Online SQLite snapshot; verifies integrity without changing production records."""
import argparse,datetime,hashlib,json,sqlite3
from contextlib import closing
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--database',default='/var/lib/finpilot/finpilot.db');p.add_argument('--directory',default='/var/backups/finpilot');args=p.parse_args()
source=Path(args.database).resolve()
if not source.is_file():raise SystemExit('Database does not exist; no empty backup created')
directory=Path(args.directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ');target=directory/('finpilot-'+stamp+'.db')
with closing(sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)) as src,closing(sqlite3.connect(target)) as dst:
 src.backup(dst)
 if dst.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise RuntimeError('Backup integrity failed')
target.chmod(0o600)
meta={'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'integrity':'ok'}
target.with_suffix('.json').write_text(json.dumps(meta,indent=2));target.with_suffix('.json').chmod(0o600)
print(json.dumps(meta))
