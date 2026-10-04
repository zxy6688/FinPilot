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

router = APIRouter(prefix='/api/v3', tags=['Living Knowledge'])


def owned(db, cls, key, user):
    row = db.get(cls, key)
    if not row or row.user_id != user.id:
        raise HTTPException(404, '记录不存在')
    return row


@router.get('/home')
def home(user=Depends(optional_user), db: Session = Depends(get_db)):
    return workspace(db, user)


@router.get('/world')
def world(user=Depends(optional_user), db: Session = Depends(get_db)):
    return constellation(Evidence(db, user))


@router.get('/articles/{id}')
def article(id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    return reading.article(db, user, id)


@router.get('/reading/{kind}/{id}')
def reading_state(kind: str, id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    if kind not in ('article', 'lesson'):
        raise HTTPException(422, '无效阅读类型')
    return reading.state(db, user.id, kind, id)


@router.post('/reading/{kind}/{id}')
def save_reading(kind: str, id: int, data: ReadingInput, user=Depends(require_user), db: Session = Depends(get_db)):
    if kind not in ('article', 'lesson'):
        raise HTTPException(422, '无效阅读类型')
    return reading.save(db, user, kind, id, data)


@router.get('/compare')
def comparisons():
    return [public_compare(c) for c in COMPARISONS.values()]


@router.get('/compare/{slug}')
def comparison(slug: str):
    if slug not in COMPARISONS:
        raise HTTPException(404, '比较不存在')
    return public_compare(COMPARISONS[slug])


@router.post('/compare/{slug}/check')
def compare_check(slug: str, data: Selection, user=Depends(require_user), db: Session = Depends(get_db)):
    if slug not in COMPARISONS:
        raise HTTPException(404, '比较不存在')
    c = COMPARISONS[slug]
    if data.answer >= len(c['options']):
        raise HTTPException(422, '选项无效')
    correct = data.answer == c['correct']
    observe(db, user.id, slug, correct=correct, compared=True)
    review.schedule(db, user.id, 'c:' + slug, c['topic_id'], correct)
    db.commit()
    return {'correct': correct, 'correct_answer': c['correct'], 'explanation': c['explanation']}


@router.post('/review/start')
def review_start(data: ReviewStart, user=Depends(require_user), db: Session = Depends(get_db)):
    return review.public_session(review.start(db, user, data.kind))


@router.get('/review/{id}')
def review_get(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    return review.public_session(owned(db, ReviewSession, id, user))


@router.post('/review/{id}/answer')
def review_answer(id: int, data: ReviewAnswer, user=Depends(require_user), db: Session = Depends(get_db)):
    return review.answer(db, user, owned(db, ReviewSession, id, user), data.cursor, data.answer)


@router.get('/memory')
def memory(user=Depends(require_user), db: Session = Depends(get_db)):
    return {'reviews': [brief(r) for r in db.query(ReviewItem).filter_by(user_id=user.id).order_by(ReviewItem.due_at)],
            'misconceptions': [brief(r) | {'title': COMPARISONS[r.tag]['title']} for r in db.query(MisconceptionState).filter_by(user_id=user.id)]}


@router.get('/moments')
def moment_list(user=Depends(require_user), db: Session = Depends(get_db)):
    return [brief(r) for r in db.query(MomentRecord).filter_by(user_id=user.id).order_by(MomentRecord.id.desc())]


@router.post('/moments/claim')
def moment_claim(user=Depends(require_user), credentials=Depends(bearer), db: Session = Depends(get_db)):
    row = moments.claim(db, user.id, claims_for(credentials, db)['jti'])
    return brief(row) if row else None
