"""Opt-in pet preferences and explicitly saved keepsakes, isolated by account."""
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..db import get_db
from ..models import now
from ..models_v3 import PetProfile
from ..security import require_user
from .v3 import write_db

router = APIRouter(prefix="/api/v3/pet", tags=["Fin Pet"])

class PetSave(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)
    snapshot: dict

    @field_validator("snapshot")
    @classmethod
    def bounded(cls, value):
        if set(value) - {"prefs", "room", "outfit", "memories", "scriptHistory"}:
            raise ValueError("包含不支持的宠物数据")
        if len(json.dumps(value, ensure_ascii=False, allow_nan=False).encode()) > 100000:
            raise ValueError("宠物记录过大，请先导出并整理纪念册")
        for key in ['prefs','room','outfit','scriptHistory']:
            if key in value and not isinstance(value[key],dict):raise ValueError('宠物设置格式错误')
        memories=value.get('memories',[])
        if not isinstance(memories,list) or len(memories)>100:raise ValueError('纪念册最多保留 100 条')
        for memory in memories:
            if not isinstance(memory,dict) or not isinstance(memory.get('text'),str) or len(memory['text'])>600:raise ValueError('纪念片段格式错误')
            url=memory.get('url')
            if url and (not isinstance(url,str) or not url.startswith('/') or url.startswith('//') or '\\' in url):raise ValueError('纪念片段只允许站内来源')
        return value

@router.get("")
def read(user=Depends(require_user), db: Session=Depends(get_db)):
    row=db.get(PetProfile,user.id)
    return {"revision":row.revision,"snapshot":row.snapshot} if row else {"revision":0,"snapshot":{}}

@router.post("")
def save(data:PetSave,user=Depends(require_user),db:Session=Depends(write_db)):
    row=db.get(PetProfile,user.id)
    if row and row.revision != data.revision:
        raise HTTPException(409,"另一页面已更新宠物记录，请重新读取后再保存")
    if not row:
        if data.revision != 0:raise HTTPException(409,"宠物记录版本不一致")
        row=PetProfile(user_id=user.id,revision=1,snapshot=data.snapshot,updated_at=now());db.add(row)
        try:db.commit()
        except IntegrityError:
            db.rollback();raise HTTPException(409,'另一页面已创建宠物记录，请重新读取后再保存')
    else:
        changed=db.query(PetProfile).filter_by(user_id=user.id,revision=data.revision).update({'snapshot':data.snapshot,'revision':data.revision+1,'updated_at':now()},synchronize_session=False)
        if changed!=1:
            db.rollback();raise HTTPException(409,'另一页面已更新宠物记录，请重新读取后再保存')
        db.commit()
    return {"revision":data.revision+1,"snapshot":data.snapshot}
