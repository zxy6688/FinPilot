"""Isolated Windows trial releases. No existing site/process/database is touched."""
import argparse
import ctypes
from ctypes import wintypes
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import sqlite3
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT.parent / "trial-runtime"
PYTHON = ROOT / ".venv/Scripts/python.exe"
FLAGS = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW


def save(path, value):
    temp = path.with_suffix(".new")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def identity(pid, terminate=False, expected=None):
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.GetProcessTimes.argtypes = [wintypes.HANDLE] + [ctypes.POINTER(wintypes.FILETIME)] * 4
    kernel.TerminateProcess.argtypes = [wintypes.HANDLE, wintypes.UINT]
    kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    handle = kernel.OpenProcess(0x1000 | (1 if terminate else 0), False, pid)
    if not handle:
        return None
    try:
        exit_code = wintypes.DWORD()
        if kernel.GetExitCodeProcess(handle, ctypes.byref(exit_code)) and exit_code.value != 259:
            return None
        times = [wintypes.FILETIME() for _ in range(4)]
        if not kernel.GetProcessTimes(handle, *[ctypes.byref(t) for t in times]):
            raise RuntimeError("Cannot verify process creation time")
        created = (times[0].dwHighDateTime << 32) | times[0].dwLowDateTime
        if terminate:
            if created != expected:
                raise RuntimeError("PID reused: refusing to stop unrelated process")
            if not kernel.TerminateProcess(handle, 0):
                if not kernel.GetExitCodeProcess(handle, ctypes.byref(exit_code)) or exit_code.value == 259:
                    raise RuntimeError("Cannot stop verified trial process")
        return created
    finally:
        kernel.CloseHandle(handle)


def launch(args, cwd, env, name):
    with (STATE / "logs" / (name + ".log")).open("ab") as log:
        proc = subprocess.Popen(args, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                stdout=log, stderr=log, creationflags=FLAGS, close_fds=True)
    return {"pid": proc.pid, "created": identity(proc.pid)}


def stop(entry):
    if entry and entry.get("child"):
        stop(entry["child"])
    if entry and identity(entry["pid"]) is not None:
        identity(entry["pid"], terminate=True, expected=entry["created"])
        time.sleep(1)


def backup():
    db = STATE / "data/trial.db"
    if db.exists():
        target = STATE / "backups" / (time.strftime("%Y%m%d-%H%M%S") + ".db")
        with sqlite3.connect(db) as src, sqlite3.connect(target) as dst:
            src.backup(dst)
        return str(target)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["update", "start", "rollback", "stop", "tunnel", "status"])
    args = parser.parse_args()
    for folder in ("releases", "data", "logs", "backups", "bin"):
        (STATE / folder).mkdir(parents=True, exist_ok=True)
    # Restrict private data and invitation to the current Windows identity and SYSTEM.
    account = subprocess.check_output(["whoami"], text=True).strip()
    subprocess.run(["icacls", str(STATE), "/inheritance:r", "/grant:r",
                    account + ":(OI)(CI)F", "SYSTEM:(OI)(CI)F"], check=True, capture_output=True)
    statefile = STATE / "state.json"
    state = json.loads(statefile.read_text()) if statefile.exists() else {}
    private = STATE / "private.json"
    if not private.exists():
        code = secrets.token_urlsafe(20)
        save(private, {"jwt_secret": secrets.token_urlsafe(48), "gate_secret": secrets.token_urlsafe(48),
                       "invite_hash": hashlib.sha256(code.encode()).hexdigest()})
        (STATE / "INVITATION.txt").write_text(
            "FinPilot 队友体验邀请口令（仅私下发给队友）：\n" + code +
            "\n进入后请注册独立账户。不要使用共享 Demo 或输入真实财务资料。\n", encoding="utf-8")
    config = json.loads(private.read_text(encoding="utf-8"))
    if args.action == "status":
        print(json.dumps(state, indent=2))
        return
    if args.action == "stop":
        stop(state.get("tunnel"))
        stop(state.get("server"))
        state.pop("tunnel", None)
        state.pop("server", None)
        save(statefile, state)
        return
    if args.action == "update":
        branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=ROOT, text=True).strip()
        if branch != "v3":
            raise RuntimeError("Only v3 can be released")
        commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        build_env = {**os.environ, "VITE_TRIAL_MODE": "true"}
        subprocess.run(["cmd", "/c", "npm", "run", "build"], cwd=ROOT / "frontend", env=build_env, check=True)
        release = STATE / "releases" / (time.strftime("%Y%m%d-%H%M%S") + "-" + commit[:12])
        release.mkdir()
        for folder in ("backend/app", "content"):
            shutil.copytree(ROOT / folder, release / folder,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".env"))
        shutil.copytree(ROOT / "frontend/dist", release / "frontend/dist")
        for name in ("backend/requirements.txt", "backend/requirements.lock.txt",
                     "frontend/package.json", "frontend/package-lock.json"):
            if (ROOT / name).exists():
                shutil.copy(ROOT / name, release / name)
        shutil.copy(ROOT / "deploy/trial_gateway.py", release / "trial_gateway.py")
        save(release / "release.json", {"commit": commit, "branch": branch,
             "working_tree": subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT, text=True),
             "files": {str(p.relative_to(release)): hashlib.sha256(p.read_bytes()).hexdigest()
                       for p in release.rglob("*") if p.is_file()}})
        state["candidate"] = str(release)
    elif args.action == "rollback":
        if not state.get("previous"):
            raise RuntimeError("No previous release")
        state["candidate"] = state["previous"]
    if args.action in ("update", "start", "rollback"):
        release = Path(state.get("candidate") or state["current"])
        state["last_backup"] = backup()
        old = state.get("current")
        stop(state.get("server"))
        port = state.get("port", 8186)
        with socket.socket() as check:
            check.bind(("127.0.0.1", port))
        env = os.environ.copy()
        env.update(PYTHONPATH=str(release / "backend"), PYTHONUTF8="1",
                   DATABASE_URL="sqlite:///" + (STATE / "data/trial.db").as_posix(),
                   JWT_SECRET=config["jwt_secret"], FINPILOT_ALLOW_SHARED_DEMO="false",
                   LLM_API_KEY="", LLM_MODEL="", FINPILOT_RELEASE=str(release),
                   FINPILOT_TRIAL_STATE=str(STATE), FINPILOT_LOG_DIR=str(STATE / "logs"), CORS_ORIGINS="")
        config["release"] = release.name
        save(private, config)
        state["server"] = launch([str(PYTHON), "-m", "uvicorn", "trial_gateway:app", "--host",
                                  "127.0.0.1", "--port", str(port), "--no-access-log",
                                  "--no-proxy-headers"], release, env, "server")
        state["port"] = port
        save(statefile, state)
        for _ in range(60):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/trial/health", timeout=2) as response:
                    if response.status == 200:
                        actual = int((STATE / "server.pid").read_text())
                        if actual != state["server"]["pid"]:
                            state["server"]["child"] = {"pid": actual, "created": identity(actual)}
                        break
            except Exception:
                time.sleep(1)
        else:
            stop(state.get("server"))
            if old and args.action in ("update", "rollback"):
                state["candidate"] = old
                save(statefile, state)
                subprocess.run([str(PYTHON), str(Path(__file__)), "start"], check=True)
            raise RuntimeError("Trial failed health check; see private logs; old release retained")
        if old and old != str(release):
            state["previous"] = old
        state["current"] = str(release)
        state.pop("candidate", None)
        save(statefile, state)
    if args.action == "tunnel":
        if state.get("tunnel") and identity(state["tunnel"]["pid"]) == state["tunnel"]["created"]:
            print("Tunnel already running; see logs/tunnel.log")
            return
        state["tunnel"] = launch([str(STATE / "bin/cloudflared.exe"), "tunnel", "--url",
                                  f"http://127.0.0.1:{state['port']}", "--protocol", "http2",
                                  "--no-autoupdate"], STATE, os.environ.copy(), "tunnel")
        save(statefile, state)
    print("Trial action completed:", args.action)


if __name__ == "__main__":
    main()
