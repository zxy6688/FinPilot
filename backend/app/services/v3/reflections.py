"""Predictions are saved before simulation; all results use the unchanged Lab engine."""

from fastapi import HTTPException
from ...models import Lab, LabRecord, now
from ...models_v3 import Reflection
from ...schemas import LabInput
from ..labs import simulate
from .moments import emit, sync

BASELINE = LabInput(choice=1)


def predict(db, user, lab_id, prediction, reason):
    lab = db.get(Lab, lab_id)
    if not lab:
        raise HTTPException(404, "实验不存在")
    existing = (
        db.query(Reflection)
        .filter_by(user_id=user.id, lab_id=lab_id, completed_at=None)
        .order_by(Reflection.id.desc())
        .first()
    )
    if existing:
        return existing
    row = Reflection(
        user_id=user.id, lab_id=lab_id, prediction=prediction, reason=reason.strip()
    )
    db.add(row)
    db.flush()
    emit(db, user.id, "FIRST_PREDICTION")
    db.commit()
    return row


def experiment(db, user, row, inputs):
    if row.completed_at:
        raise HTTPException(409, "这次反思已保存，请开始新的预测")
    lab = db.get(Lab, row.lab_id)
    result = simulate(lab.slug, inputs)
    baseline = simulate(lab.slug, BASELINE)
    delta = (
        round(result["value"] - baseline["value"], 2)
        if result["value"] is not None and baseline["value"] is not None
        else 0
    )
    direction = "higher" if delta > 0.01 else "lower" if delta < -0.01 else "same"
    qualitative = lab.slug in ("fomo", "loss", "crash")
    row.inputs = inputs.model_dump()
    row.result = result
    row.comparison = {
        "baseline_inputs": BASELINE.model_dump(),
        "baseline_value": baseline["value"],
        "delta": delta,
        "direction": direction,
        "matched": (
            None
            if qualitative or row.prediction == "uncertain"
            else row.prediction == direction
        ),
        "note": (
            "此行为情景用于比较决策理由，不以曲线终值给行为预测判对错。"
            if qualitative
            else "比较模型最终值与默认参数下的最终值，所有条件均为教学假设。"
        ),
    }
    db.commit()
    return row


def reflect(db, user, row, text):
    if row.completed_at:
        return row
    if row.result is None:
        raise HTTPException(409, "请先完成实验，再保存反思")
    row.reflection = text.strip()
    row.completed_at = now()
    db.add(
        LabRecord(
            user_id=user.id, lab_id=row.lab_id, inputs=row.inputs, result=row.result
        )
    )
    if row.comparison["matched"] is True:
        emit(db, user.id, "PREDICTION_MATCHED", row.id)
    db.flush()
    sync(db, user)
    db.commit()
    return row
