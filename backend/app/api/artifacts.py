"""Versioned, owner-scoped learning artifacts; additive to existing learning data."""
import json
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import now
from ..models_v3 import LearningArtifact
from ..security import require_user
from .v3 import write_db

router = APIRouter(prefix="/api/v3/artifacts", tags=["Notebook"])


class ArtifactInput(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,100}$")
    kind: Literal["receipt", "reading", "concept"]
    title: str = Field(min_length=1, max_length=180)
    url: str = Field(max_length=2000)
    detail: str = Field(max_length=4000)
    payload: dict = Field(default_factory=dict)
    version: str = Field(default="gate-b-v1", max_length=80)

    @field_validator("url")
    @classmethod
    def internal(cls, v):
        if not v.startswith("/") or v.startswith("//") or "\\" in v:
            raise ValueError("只允许站内地址")
        return v

    @field_validator("payload")
    @classmethod
    def bounded(cls, v):
        try:
            encoded = json.dumps(v, ensure_ascii=False, allow_nan=False)
        except ValueError:
            raise ValueError("记录不能包含非有限数值")
        if len(encoded.encode()) > 180000:
            raise ValueError("记录过大")
        return v


def public(row):
    return {**row.snapshot, "title": row.snapshot.get("user_title", row.snapshot["title"]), "id": row.client_key, "at": row.created_at}


@router.get("")
def listing(user=Depends(require_user), db: Session = Depends(get_db)):
    return [public(r) for r in db.query(LearningArtifact).filter_by(user_id=user.id).order_by(LearningArtifact.id.desc()).all()]


@router.get("/{key}")
def get_artifact(key: str, user=Depends(require_user), db: Session = Depends(get_db)):
    row = db.query(LearningArtifact).filter_by(user_id=user.id, client_key=key).first()
    if not row:
        raise HTTPException(404, "记录不存在")
    return public(row)


@router.post("")
def save(data: ArtifactInput, user=Depends(require_user), db: Session = Depends(write_db)):
    row = db.query(LearningArtifact).filter_by(user_id=user.id, client_key=data.id).first()
    snapshot = data.model_dump()
    if row:
        if {k: v for k, v in row.snapshot.items() if k != "user_title"} != snapshot:
            raise HTTPException(409, "此记录已保存；修改后的实验请保存为新记录")
        return public(row)
    row = LearningArtifact(user_id=user.id, client_key=data.id, snapshot=snapshot, created_at=now())
    db.add(row)
    db.commit()
    return public(row)


class ArtifactRename(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=180)

    @field_validator("title")
    @classmethod
    def meaningful(cls, value):
        if not value.strip():
            raise ValueError("名称不能只有空格")
        return value.strip()


@router.patch("/{key}")
def rename(key: str, data: ArtifactRename, user=Depends(require_user), db: Session = Depends(write_db)):
    row = db.query(LearningArtifact).filter_by(user_id=user.id, client_key=key).first()
    if not row:
        raise HTTPException(404, "记录不存在")
    row.snapshot = {**row.snapshot, "user_title": data.title}
    db.commit()
    return public(row)


@router.delete("/{key}")
def delete(key: str, user=Depends(require_user), db: Session = Depends(write_db)):
    row = db.query(LearningArtifact).filter_by(user_id=user.id, client_key=key).first()
    if not row:
        raise HTTPException(404, "记录不存在")
    db.delete(row)
    db.commit()
    return {"deleted": True}
