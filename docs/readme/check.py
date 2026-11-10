from pathlib import Path
import re,json,hashlib,subprocess
root=Path(__file__).resolve().parents[2]
files=[root/'README.md',root/'docs/README.en.md',root/'docs/INDEX.md',*list((root/'docs/readme').glob('*.md')),*list((root/'docs/repository').glob('*.md')),root/'docs/deployment/PRODUCTION.md',root/'docs/deployment/PRODUCTION_STATUS.md',root/'docs/release/ASSETS.md',root/'docs/release/VALIDATION.md']
errors=[];checked=0
for file in files:
 text=file.read_text(encoding='utf-8-sig')
 for link in re.findall(r'\]\(([^)]+)\)',text)+re.findall(r'(?:src|srcset|href)="([^"]+)"',text):
  if re.match(r'(?:https?:|mailto:|data:|#)',link):continue
  path=link.split('#')[0].split('?')[0]
  if path and not (file.parent/path).exists():errors.append(f'Missing link {file.relative_to(root)}: {link}')
  checked+=1
 # Private key and realistic token patterns, not configuration variable names.
 for pattern in [r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY',r'gh[pousr]_[A-Za-z0-9]{30,}',r'github_pat_[A-Za-z0-9_]{40,}',r'AKID[A-Za-z0-9]{25,}']:
  if re.search(pattern,text):errors.append(f'Credential pattern: {file.relative_to(root)}')
m=json.loads((root/'docs/readme/CAPTURE_MANIFEST.json').read_text(encoding='utf-8'))
for shot in m['shots']:
 b=(root/'docs/readme/assets'/shot['file']).read_bytes()
 if hashlib.sha256(b).hexdigest()!=shot['assetSha256']:errors.append('Asset hash mismatch '+shot['file'])
for f in (root/'docs/readme/assets').glob('*.svg'):
 s=f.read_text(encoding='utf-8')
 if re.search(r'<(?:script|foreignObject)\b|(?:href|src)="(?:https?:|file:)',s,re.I):errors.append('Non-self-contained SVG '+f.name)
result={'documents':len(files),'relative_links_checked':checked,'real_screenshots':len(m['shots']),'manifest_hashes':'passed' if not errors else 'see errors','errors':errors}
print(json.dumps(result,ensure_ascii=True,indent=2))
raise SystemExit(bool(errors))
