from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..security import optional_user, require_user, bearer, claims_for
from ..models_v3 import ReviewSession, ReviewItem, MisconceptionState, MomentRecord
from ..schemas_v3 import ReadingInput, Selection, ReviewStart, ReviewAnswer
from ..services.v3.living import workspace, constellation
from ..services.understanding import Evidence
from ..services.relevance import brief
from ..services.v3 import reading, review, moments
from ..services.v3.comparisons import COMPARISONS, public_compare
from ..services.v3.misconceptions import observe

router = APIRouter(prefix="/api/v3", tags=["Living Knowledge"])


def write_db(db: Session = Depends(get_db)):
    from ..services.v3.transactions import begin_write

    begin_write(db)
    return db


def owned(db, cls, key, user):
    row = db.get(cls, key)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "记录不存在")
    return row


@router.get("/home")
def home(user=Depends(optional_user), db: Session = Depends(get_db)):
    return workspace(db, user)


@router.get("/world")
def world(
    mode: str = "world", user=Depends(optional_user), db: Session = Depends(get_db)
):
    return constellation(Evidence(db, None if mode == "explore" else user))


@router.get("/articles/{id}")
def article(id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    return reading.article(db, user, id)


@router.get("/reading/{kind}/{id}")
def reading_state(
    kind: str, id: int, user=Depends(require_user), db: Session = Depends(get_db)
):
    if kind not in ("article", "lesson"):
        raise HTTPException(422, "无效阅读类型")
    return reading.state(db, user.id, kind, id)


@router.post("/reading/{kind}/{id}")
def save_reading(
    kind: str,
    id: int,
    data: ReadingInput,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    if kind not in ("article", "lesson"):
        raise HTTPException(422, "无效阅读类型")
    return reading.save(db, user, kind, id, data)


@router.get("/compare")
def comparisons():
    return [public_compare(c) for c in COMPARISONS.values()]


@router.get("/compare/{slug}")
def comparison(slug: str):
    if slug not in COMPARISONS:
        raise HTTPException(404, "比较不存在")
    return public_compare(COMPARISONS[slug])


@router.post("/compare/{slug}/check")
def compare_check(
    slug: str,
    data: Selection,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    if slug not in COMPARISONS:
        raise HTTPException(404, "比较不存在")
    c = COMPARISONS[slug]
    if data.answer >= len(c["options"]):
        raise HTTPException(422, "选项无效")
    correct = data.answer == c["correct"]
    observe(db, user.id, slug, correct=correct, compared=True)
    review.schedule(db, user.id, "c:" + slug, c["topic_id"], correct)
    db.commit()
    return {
        "correct": correct,
        "correct_answer": c["correct"],
        "explanation": c["explanation"],
    }


@router.post("/review/start")
def review_start(
    data: ReviewStart, user=Depends(require_user), db: Session = Depends(write_db)
):
    return review.public_session(review.start(db, user, data.kind))


@router.get("/review/{id}")
def review_get(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    return review.public_session(owned(db, ReviewSession, id, user))


@router.post("/review/{id}/answer")
def review_answer(
    id: int,
    data: ReviewAnswer,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    return review.answer(
        db, user, owned(db, ReviewSession, id, user), data.cursor, data.answer
    )


@router.get("/memory")
def memory(user=Depends(require_user), db: Session = Depends(get_db)):
    return {
        "reviews": [
            brief(r)
            for r in db.query(ReviewItem)
            .filter_by(user_id=user.id)
            .order_by(ReviewItem.due_at)
        ],
        "misconceptions": [
            brief(r) | {"title": COMPARISONS[r.tag]["title"]}
            for r in db.query(MisconceptionState).filter_by(user_id=user.id)
        ],
    }


@router.get("/moments")
def moment_list(user=Depends(require_user), db: Session = Depends(get_db)):
    return [
        brief(r)
        for r in db.query(MomentRecord)
        .filter_by(user_id=user.id)
        .order_by(MomentRecord.id.desc())
    ]


@router.post("/moments/claim")
def moment_claim(
    user=Depends(require_user),
    credentials=Depends(bearer),
    db: Session = Depends(write_db),
):
    row = moments.claim(db, user.id, claims_for(credentials, db)["jti"])
    return brief(row) if row else None


from ..models import Lab
from ..models_v3 import SavedRoute, Reflection
from ..schemas_v3 import RouteStart, RouteAnswer, PredictionInput, ReflectionInput
from ..schemas import LabInput
from ..services.v3 import route_progress, reflections


@router.post("/routes")
def route_create(
    data: RouteStart, user=Depends(require_user), db: Session = Depends(write_db)
):
    return route_progress.public(route_progress.create(db, user, data.target_topic_id))


@router.get("/routes")
def route_list(user=Depends(require_user), db: Session = Depends(get_db)):
    return [
        route_progress.public(r)
        for r in db.query(SavedRoute)
        .filter_by(user_id=user.id)
        .order_by(SavedRoute.last_active_at.desc())
    ]


@router.get("/routes/{id}")
def route_get(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    return route_progress.public(
        route_progress.advance(db, user, owned(db, SavedRoute, id, user))
    )


@router.post("/routes/{id}/answer")
def route_answer(
    id: int,
    data: RouteAnswer,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    return route_progress.answer(
        db, user, owned(db, SavedRoute, id, user), data.index, data.answer
    )


@router.get("/labs/{id}/prediction")
def prediction_get(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    if not db.get(Lab, id):
        raise HTTPException(404, "实验不存在")
    row = (
        db.query(Reflection)
        .filter_by(user_id=user.id, lab_id=id, completed_at=None)
        .order_by(Reflection.id.desc())
        .first()
    )
    return brief(row) if row else None


@router.post("/labs/{id}/prediction")
def prediction_create(
    id: int,
    data: PredictionInput,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    if len(data.reason.strip()) < 4:
        raise HTTPException(422, "请写下一个具体的预测理由")
    return brief(reflections.predict(db, user, id, data.prediction, data.reason))


@router.post("/reflections/{id}/experiment")
def experiment(
    id: int, data: LabInput, user=Depends(require_user), db: Session = Depends(write_db)
):
    return brief(
        reflections.experiment(db, user, owned(db, Reflection, id, user), data)
    )


@router.post("/reflections/{id}/complete")
def reflection_complete(
    id: int,
    data: ReflectionInput,
    user=Depends(require_user),
    db: Session = Depends(write_db),
):
    if len(data.reflection.strip()) < 8:
        raise HTTPException(422, "请写下这次观察带来的具体理解")
    return brief(
        reflections.reflect(db, user, owned(db, Reflection, id, user), data.reflection)
    )


@router.get("/notebook")
def notebook(user=Depends(require_user), db: Session = Depends(get_db)):
    return [
        brief(r) | {"lab_title": db.get(Lab, r.lab_id).title}
        for r in db.query(Reflection)
        .filter(Reflection.user_id == user.id, Reflection.completed_at.is_not(None))
        .order_by(Reflection.id.desc())
    ]
