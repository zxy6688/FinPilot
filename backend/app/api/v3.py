from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..security import optional_user
from ..services.v3.living import workspace, constellation
from ..services.understanding import Evidence

router = APIRouter(prefix="/api/v3", tags=["Living Knowledge"])


@router.get("/home")
def home(user=Depends(optional_user), db: Session = Depends(get_db)):
    return workspace(db, user)


@router.get("/world")
def world(user=Depends(optional_user), db: Session = Depends(get_db)):
    return constellation(Evidence(db, user))
