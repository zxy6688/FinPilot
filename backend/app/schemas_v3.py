from typing import Literal
from pydantic import BaseModel, Field


class ReadingInput(BaseModel):
    progress: float = Field(ge=0, le=1)
    position: float = Field(ge=0, le=1)
    last_section: str = Field('', max_length=120)
    completed: bool = False


class Selection(BaseModel):
    answer: int = Field(ge=0, le=10)


class ReviewStart(BaseModel):
    kind: Literal['review', 'capsule'] = 'review'


class ReviewAnswer(Selection):
    cursor: int = Field(ge=0, le=4)
