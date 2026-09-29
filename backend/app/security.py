import hashlib
import hmac
import os
import secrets
import time
import uuid
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .db import ROOT, get_db
from .models import User, RevokedToken

secret_file = ROOT / "data" / ".jwt-secret"
SECRET = os.getenv("JWT_SECRET")
if not SECRET:
    secret_file.parent.mkdir(parents=True, exist_ok=True)
    if not secret_file.exists():
        secret_file.write_text(secrets.token_urlsafe(48), encoding="utf-8")
    SECRET = secret_file.read_text(encoding="utf-8").strip()
bearer = HTTPBearer(auto_error=False)


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt.encode(), n=16384, r=8, p=1
    ).hex()
    return salt + ":" + digest


def verify_password(password, stored):
    salt, digest = stored.split(":")
    return hmac.compare_digest(
        hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex(),
        digest,
    )


def token_for(user):
    return jwt.encode(
        {"sub": str(user.id), "jti": uuid.uuid4().hex, "exp": int(time.time()) + 86400},
        SECRET,
        algorithm="HS256",
    )


def claims_for(credentials, db):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET,
            algorithms=["HS256"],
            options={"require": ["sub", "jti", "exp"]},
        )
        if db.get(RevokedToken, payload["jti"]):
            raise ValueError()
        return payload
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(401, "登录已过期，请重新登录")


def optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    if not credentials:
        return None
    payload = claims_for(credentials, db)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, "用户不存在")
    return user


def require_user(user=Depends(optional_user)):
    if not user:
        raise HTTPException(401, "请先登录后再保存学习记录")
    return user
