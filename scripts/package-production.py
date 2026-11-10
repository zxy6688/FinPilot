"""Package committed source plus locally built static files; never runtime data."""
import os,re,tarfile
from pathlib import Path
r=Path(__file__).resolve().parents[1];sha=os.environ['FINPILOT_RELEASE_SHA']
assert re.fullmatch('[a-f0-9]{40}',sha)
folder=r/'tmp/production';dist=r/'frontend/dist'
assert (dist/'index.html').is_file()
with tarfile.open(folder/(sha+'-source.tar')) as source,tarfile.open(folder/(sha+'.tar.gz'),'w:gz') as out:
 for entry in source.getmembers():
  parts=Path(entry.name).parts
  if any(p in ['.git','.venv','node_modules','data','logs','tmp','.env'] for p in parts):continue
  out.addfile(entry,source.extractfile(entry) if entry.isfile() else None)
 out.add(dist,arcname='frontend/dist')
print(folder/(sha+'.tar.gz'))
