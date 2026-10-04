"""A conservative misconception state machine: one error is not a diagnosis."""

from ...models import now
from ...models_v3 import MisconceptionState
from .moments import emit


def observe(db, uid, tag, correct=False, compared=False, recalled=False, at=None):
    at = at or now()
    row = db.query(MisconceptionState).filter_by(user_id=uid, tag=tag).first()
    if not correct:
        if not row:
            row = MisconceptionState(user_id=uid, tag=tag, wrong_count=0)
            db.add(row)
        row.wrong_count += 1
        row.status = "observed" if row.wrong_count >= 2 else "suspected"
        row.observed_at, row.addressed_at, row.resolved_at = at, None, None
        if row.status == "observed":
            emit(db, uid, "MISCONCEPTION_FOUND", tag)
    elif row and compared and row.status != "resolved":
        row.status, row.addressed_at = "addressed", at
    elif (
        row
        and recalled
        and row.status == "addressed"
        and row.addressed_at
        and at > row.addressed_at
    ):
        row.status, row.resolved_at = "resolved", at
        emit(db, uid, "MISCONCEPTION_RESOLVED", tag)
    return row
