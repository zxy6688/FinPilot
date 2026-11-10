"""Production-only trial entry: static build + API, no development server."""
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import OrderedDict
from pathlib import Path
from urllib.parse import parse_qs

from fastapi import Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.main import app

ROOT = Path(os.environ["FINPILOT_RELEASE"])
STATE = Path(os.environ["FINPILOT_TRIAL_STATE"])
CONFIG = json.loads((STATE / "private.json").read_text(encoding="utf-8"))
(STATE / "server.pid").write_text(str(os.getpid()), encoding="ascii")
DIST = ROOT / "frontend" / "dist"
COUNTERS = OrderedDict()
LIMIT = 256 * 1024
GATE = """<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FinPilot · 队友体验</title><body style="font:18px system-ui;max-width:560px;margin:12vh auto;padding:24px;background:#f6faf7;color:#244d45">
<h1>FinPilot · 测试版本</h1><p>请输入邀请口令。进入后请注册自己的账户，保存记录相互隔离。</p>
<p>仅用于金融教育体验。AI 为 Demo；请勿输入真实财务资料或复用常用密码。</p>
<form action="/trial/enter" method="post"><label>邀请口令 <input type="password" name="code" required maxlength="150" autocomplete="off"></label>
<button>进入体验</button></form></body></html>"""


def signature(value):
    return hmac.new(CONFIG["gate_secret"].encode(), value.encode(), hashlib.sha256).hexdigest()


def admitted(request):
    # Public trial browsing is explicitly configurable; account ownership still applies.
    if CONFIG.get("invite_required", True) is False:
        return True
    try:
        expires, sig = request.cookies.get("finpilot_trial", "").split(".")
        return int(expires) > time.time() and hmac.compare_digest(sig, signature(expires))
    except (ValueError, TypeError):
        return False


class TrialBoundary(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.url.path
        # cloudflared alone can reach loopback. Never trust public X-Forwarded-For.
        client = request.headers.get("cf-connecting-ip", request.client.host)
        minute = int(time.time() // 60)
        key = (client, minute, "auth" if path in (
            "/trial/enter", "/api/auth/login", "/api/auth/register") else "general")
        COUNTERS[key] = COUNTERS.get(key, 0) + 1
        if len(COUNTERS) > 10000:
            COUNTERS.popitem(last=False)
        if COUNTERS[key] > (12 if key[2] == "auth" else 600):
            return JSONResponse({"detail": "请求过于频繁，请稍后重试"}, 429)
        if request.method not in ("GET", "HEAD", "POST", "PATCH", "DELETE"):
            return JSONResponse({"detail": "Method not allowed"}, 405)
        if request.method not in ("GET", "HEAD"):
            origin = request.headers.get("origin")
            if origin and origin != "https://" + request.headers.get("host", ""):
                return JSONResponse({"detail": "Origin rejected"}, 403)
            size = 0
            chunks = []
            async for chunk in request.stream():
                size += len(chunk)
                if size > LIMIT:
                    return JSONResponse({"detail": "请求内容过大"}, 413)
                chunks.append(chunk)
            request._body = b"".join(chunks)
        if path == "/trial/health":
            response = JSONResponse({"status": "ok", "release": CONFIG.get("release", ""), "mode": "trial"})
        elif path == "/trial/enter" and request.method == "POST":
            form = parse_qs((await request.body()).decode("utf-8", errors="replace"))
            value = form.get("code", [""])[0]
            if not hmac.compare_digest(hashlib.sha256(value.encode()).hexdigest(), CONFIG["invite_hash"]):
                response = HTMLResponse(GATE + "<p>口令无效，请向邀请人确认。</p>", 401)
            else:
                response = RedirectResponse("/", 303)
                expires = str(int(time.time()) + 86400)
                response.set_cookie("finpilot_trial", expires + "." + signature(expires),
                                    secure=True, httponly=True, samesite="strict", max_age=86400)
        elif not admitted(request):
            response = JSONResponse({"detail": "请先通过邀请入口"}, 401) if path.startswith("/api/") else HTMLResponse(GATE, 401)
        elif path in ("/docs", "/redoc", "/openapi.json") or any(p.startswith(".") for p in path.split("/") if p):
            response = JSONResponse({"detail": "Not found"}, 404)
        elif path == "/api/health":
            response = JSONResponse({"status": "ok", "version": "3.0.0", "ai_mode": "demo"})
        else:
            try:
                response = await call_next(request)
            except Exception:
                response = JSONResponse({"detail": "服务暂时不可用，请稍后重试"}, 500)
        response.headers.setdefault("Cache-Control", "no-store")
        response.headers.update({
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "DENY",
            "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        })
        return response


app.add_middleware(TrialBoundary)


@app.get("/trial/feedback", response_class=HTMLResponse)
def feedback():
    return """<html lang="zh-CN"><meta charset="utf-8"><title>反馈</title>
    <h1>FinPilot 测试反馈</h1><p>请把当前页面地址、操作步骤、预期结果、实际结果和截图发给邀请你的队友。
    请勿发送密码或真实财务资料。</p><a href="/">返回首页</a></html>"""


@app.get("/{path:path}")
def static(path: str):
    target = (DIST / path).resolve()
    if not target.is_relative_to(DIST.resolve()):
        return JSONResponse({"detail": "Not found"}, 404)
    if target.is_file() and target.suffix.lower() in (".js", ".css", ".png", ".webp", ".jpg", ".svg", ".woff2", ".ico"):
        return FileResponse(target, headers={"Cache-Control": "private, max-age=3600"})
    if path.startswith(("api/", "assets/")) or "." in path:
        return JSONResponse({"detail": "Not found"}, 404)
    html = (DIST / "index.html").read_text(encoding="utf-8")
    banner = '<div style="position:relative;z-index:10000;text-align:center;background:#244d45;color:white;padding:6px;font:13px system-ui">测试版本 · AI Demo · 请注册独立账户，勿输入真实财务信息 · <a style="color:white" href="/trial/feedback">反馈问题</a></div>'
    return HTMLResponse(html.replace("<body>", "<body>" + banner))
