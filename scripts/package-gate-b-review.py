"""Package the actual v3 worktree without dependencies, runtime data or credentials.

Run from the project root. --scan-only checks the same selection before a local commit.
No git commit/push, process stop, database write or server deployment is performed here.
"""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--scan-only", action="store_true")
args = parser.parse_args()


def git(*command, cwd=root):
    return subprocess.check_output(["git", *command], cwd=cwd).decode("utf-8").strip()


def sha(data):
    return hashlib.sha256(data).hexdigest()


assert git("branch", "--show-current") == "v3"
protected = {"v1": "97908aacc74adaf8e8c1eb291d255a2feff1b289", "v2": "a3fa070a55a4d4efd0fa47e8e835e0da6e0581c2"}
for name, head in protected.items():
    assert git("rev-parse", "HEAD", cwd=root.parent/name) == head
    assert not git("status", "--porcelain", cwd=root.parent/name), name+" changed"
baseline = json.loads((root/"docs/redesign/gate-b/baseline.json").read_text(encoding="utf-8"))
for filename, expected in baseline["files"].items():
    assert sha((root/filename).read_bytes()) == expected, filename+" baseline changed"
raw = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root)
names = sorted(set(n.decode("utf-8") for n in raw.split(b"\0") if n))
blocked = {".git", ".venv", "node_modules", "dist", "logs", "tmp", "cache", ".cache", "__pycache__", ".pytest_cache", "test-results", "playwright-report", "coverage", "htmlcov", ".aws", ".codex", ".idea", ".vscode"}
selected = []
for name in names:
    p = PurePosixPath(name)
    if set(p.parts) & blocked or p.parts[0] == "data":
        continue
    if (p.name.startswith(".env") and p.name != ".env.example") or re.search(r"\.(db(?:-wal|-shm)?|sqlite3?|pem|key|pfx|pyc|log|tsbuildinfo|zip)$", p.name, re.I) or p.name in {".jwt-secret", ".coverage"}:
        continue
    file = root/name
    assert not file.is_symlink(), "Symlink needs review: "+name
    if file.is_file():
        selected.append(name)
for name in ["README.md", ".env.example", "frontend/package-lock.json", "backend/app/seed.py", "backend/tests/test_gate_b.py", "docs/redesign/GATE_B_ACCEPTANCE.md", "docs/redesign/GATE_B_VISUAL_REGRESSION.md"]:
    assert name in selected, "Missing required file: "+name
for directory in ["backend/", "frontend/", "content/", "docs/", "scripts/", "deploy/", "docs/screenshots/v1-final/", "docs/screenshots/v2/", "docs/screenshots/v3/"]:
    assert any(name.startswith(directory) for name in selected), directory
patterns = [rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", rb"gh[pousr]_[A-Za-z0-9]{30,}", rb"github_pat_[A-Za-z0-9_]{40,}", rb"sk-[A-Za-z0-9_-]{24,}", rb"AKID[A-Za-z0-9]{28,}"]
secrets = []
for file in [root/"data/.jwt-secret", root/"backend/data/.jwt-secret"]:
    if file.exists():
        secrets.append(file.read_bytes().strip())
for file in [root/".env", root/"backend/.env"]:
    if file.exists():
        for line in file.read_text(encoding="utf-8").splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                value = value.strip().strip("\"'")
                if re.search(r"SECRET|TOKEN|API_KEY|PASSWORD", key, re.I) and len(value) >= 16:
                    secrets.append(value.encode())
hashes, findings = {}, []
for name in selected:
    data = (root/name).read_bytes()
    if any(re.search(pattern, data) for pattern in patterns) or any(secret and secret in data for secret in secrets):
        findings.append(name)
    hashes[name] = sha(data)
assert not findings, "Potential sensitive content in files: "+repr(findings)
print(json.dumps({"scan": "passed", "files": len(selected), "main_v2_unchanged": True, "frozen_assets_and_screenshots_unchanged": True}), flush=True)
if args.scan_only:
    raise SystemExit(0)

for check in ["b1-checks.json", "b2-checks.json", "b3-checks.json", "b4-checks.json", "b5-checks.json", "final-checks.json", "mobile-journey.json", "routing/checks.json"]:
    assert json.loads((root/"docs/redesign/gate-b"/check).read_text(encoding="utf-8"))["status"] == "passed", check
head, status = git("rev-parse", "HEAD"), git("status", "--porcelain")
destination = root.parent/"FinPilot-GateB-review.zip"
assert not destination.exists(), "Review existing ZIP before replacing it"
manifest = {"source": "actual v3 working directory, including any uncommitted selected files", "branch": "v3", "head": head, "status": "GATE B READY FOR HUMAN REVIEW", "files": hashes, "sensitive_scan": "no credential patterns or actual runtime secrets found", "runtime_database_included": False}
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name in selected:
        archive.write(root/name, name)
    archive.writestr("REVIEW_MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
print("Archive written; extracting and verifying every file", flush=True)
extracted = Path(tempfile.mkdtemp(prefix="gate-b-unzip-", dir=root/"tmp"))
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    for name in archive.namelist():
        target = (extracted/name).resolve()
        assert target.is_relative_to(extracted.resolve())
    archive.extractall(extracted)
    for name, expected in hashes.items():
        assert sha((extracted/name).read_bytes()) == expected, name
        assert sha((root/name).read_bytes()) == expected, "Workspace changed: "+name
assert git("rev-parse", "HEAD") == head and git("status", "--porcelain") == status
health = json.load(urllib.request.urlopen("http://127.0.0.1:8004/api/health", timeout=10))
assert health["status"] == "ok"
assert urllib.request.urlopen("http://127.0.0.1:5176/", timeout=10).status == 200
result = {"path": str(destination), "bytes": destination.stat().st_size, "MiB": round(destination.stat().st_size/1024**2, 2), "sha256": sha(destination.read_bytes()), "files": len(hashes)+1, "gate_b_page_screenshots": len(list((root/"docs/redesign/screenshots/gate-b").glob("*.png"))), "routing_screenshots": len(list((root/"docs/redesign/gate-b/routing/screenshots").glob("*.png"))), "comparison_and_contact_sheets": 2, "extraction_and_every_file_hash": "passed", "sensitive_scan": "no findings", "main_v2_unchanged": True, "frozen_baseline_unchanged": True, "git_commit": head, "frontend_http": 200, "backend_status": health["status"], "ai_mode": health["ai_mode"], "status": "GATE B READY FOR HUMAN REVIEW"}
(root.parent/"FinPilot-GateB-review-checks.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
