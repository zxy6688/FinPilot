import re
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator


class Login(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("请输入有效邮箱")
        return value


class Register(Login):
    name: str = Field(min_length=1, max_length=60)

    @field_validator("name")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("昵称不能为空")
        return value.strip()


class Answer(BaseModel):
    answer: int = Field(ge=0, le=10)


class NewPost(BaseModel):
    title: str = Field(min_length=4, max_length=160)
    body: str = Field(min_length=10, max_length=10000)
    topic_id: int
    category: Literal[
        "Beginner Help",
        "Learning Notes",
        "Market Understanding",
        "Behavioral Reflection",
        "Course Discussion",
    ]

    @field_validator("title", "body")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("内容不能为空")
        return value.strip()


class NewComment(BaseModel):
    body: str = Field(min_length=1, max_length=3000)

    @field_validator("body")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("评论不能为空")
        return value.strip()


class ChatInput(BaseModel):
    mode: Literal["tutor", "explain", "guide", "coach"] = "tutor"
    message: str = Field(min_length=1, max_length=6000)
    session_id: int | None = None

    @model_validator(mode="after")
    def message_boundary(self):
        self.message = self.message.strip()
        if not self.message:
            raise ValueError("请输入问题或需要解释的文字")
        if self.mode != "explain" and len(self.message) > 2000:
            raise ValueError("当前模式最多输入 2000 个字符；长段文字请使用帮我看懂")
        return self


class LabInput(BaseModel):
    principal: float = Field(default=10000, ge=0, le=10000000)
    monthly: float = Field(default=500, ge=0, le=100000)
    rate: float = Field(default=5, ge=-10, le=20)
    years: int = Field(default=10, ge=1, le=50)
    stocks: int = Field(default=50, ge=0, le=100)
    bonds: int = Field(default=30, ge=0, le=100)
    choice: int = Field(default=0, ge=0, le=2)


class ReportInput(BaseModel):
    reason: str = Field(min_length=4, max_length=500)
