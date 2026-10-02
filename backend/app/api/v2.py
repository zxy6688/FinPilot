from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..security import optional_user, require_user
from ..services.understanding import Evidence
from ..services.personalization import home
from ..services.learning_routes import build_route, connections
from ..services.relevance import relevant_articles, recommended_lab

router = APIRouter(prefix="/api/v2", tags=["V2 learning workspace"])


@router.get("/home")
def workspace(user=Depends(optional_user), db: Session = Depends(get_db)):
    return home(db, user)


@router.get("/understanding-map")
def understanding(user=Depends(require_user), db: Session = Depends(get_db)):
    e = Evidence(db, user)
    return {**e.map(), "suggested_route": home(db, user, e)["route_target"]}


@router.get("/learning-routes/{target_topic_id}")
def route(
    target_topic_id: int, user=Depends(optional_user), db: Session = Depends(get_db)
):
    try:
        return build_route(Evidence(db, user), target_topic_id)
    except KeyError:
        raise HTTPException(404, "主题不存在")


@router.get("/topics/{topic_id}/connections")
def relation(topic_id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    e = Evidence(db, user)
    if topic_id not in e.topics:
        raise HTTPException(404, "主题不存在")
    return connections(e, topic_id)


@router.get("/discover/relevant")
def discover(user=Depends(optional_user), db: Session = Depends(get_db)):
    return relevant_articles(Evidence(db, user))


@router.get("/labs/recommended")
def lab(user=Depends(optional_user), db: Session = Depends(get_db)):
    return recommended_lab(Evidence(db, user))
