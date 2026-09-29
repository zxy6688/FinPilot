from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    JSON,
    Boolean,
    UniqueConstraint,
)
from .db import Base


def now():
    return datetime.now(timezone.utc).isoformat()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    is_seed_persona = Column(Boolean, default=False)
    learner_label = Column(String, default="")
    email = Column(String(254), unique=True, nullable=False)
    name = Column(String(60), nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(String, default=now)


class ContentRevision(Base):
    __tablename__ = "content_revisions"
    version = Column(String, primary_key=True)


class TopicRelation(Base):
    __tablename__ = "topic_relations"
    id = Column(Integer, primary_key=True)
    from_topic_id = Column(Integer, ForeignKey("topics.id"))
    to_topic_id = Column(Integer, ForeignKey("topics.id"))
    relation_label = Column(String)
    __table_args__ = (
        UniqueConstraint("from_topic_id", "to_topic_id", "relation_label"),
    )


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    english = Column(String)
    summary = Column(Text)
    domain = Column(String)
    related_ids = Column(JSON, default=list)


class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    content_type = Column(String, default="EXPLAINER")
    source_kind = Column(String)
    topic_ids = Column(JSON, default=list)
    source = Column(String)
    source_url = Column(String)
    published_at = Column(String)
    category = Column(String)
    difficulty = Column(String)
    summary = Column(Text)
    why_it_matters = Column(Text)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    is_demo = Column(Boolean, default=True)


class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    english = Column(String)
    summary = Column(Text)
    color = Column(String)


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    title = Column(String)
    position = Column(Integer)
    minutes = Column(Integer, default=6)
    markdown = Column(Text)
    topic_ids = Column(JSON, default=list)
    ask_prompts = Column(JSON, default=list)
    diagram = Column(JSON)


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    kind = Column(String, default="single")
    question = Column(Text)
    options = Column(JSON)
    correct_answer = Column(Integer)
    explanation = Column(Text)


class QuizRecord(Base):
    __tablename__ = "quiz_records"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("quiz_questions.id"))
    answer = Column(Integer)
    correct = Column(Boolean)
    created_at = Column(String, default=now)


class UserProgress(Base):
    __tablename__ = "user_progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    created_at = Column(String, default=now)


class Lab(Base):
    __tablename__ = "labs"
    id = Column(Integer, primary_key=True)
    educational_notes = Column(JSON, default=dict)
    slug = Column(String, unique=True)
    title = Column(String)
    english = Column(String)
    question = Column(Text)
    summary = Column(Text)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    lesson_id = Column(Integer, ForeignKey("lessons.id"))


class LabRecord(Base):
    __tablename__ = "lab_records"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lab_id = Column(Integer, ForeignKey("labs.id"))
    inputs = Column(JSON)
    result = Column(JSON)
    created_at = Column(String, default=now)


class Post(Base):
    __tablename__ = "posts"
    seed_key = Column(String, unique=True, nullable=True)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    title = Column(String)
    body = Column(Text)
    category = Column(String)
    is_demo = Column(Boolean, default=False)
    created_at = Column(String, default=now)


class Comment(Base):
    __tablename__ = "comments"
    seed_key = Column(String, unique=True, nullable=True)
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    body = Column(Text)
    created_at = Column(String, default=now)


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "kind", "target_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    kind = Column(String)
    target_id = Column(Integer)
    created_at = Column(String, default=now)


class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)


class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    created_at = Column(String, default=now)


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mode = Column(String)
    title = Column(String)
    created_at = Column(String, default=now)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)
    content = Column(Text)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(String, default=now)


class TopicView(Base):
    __tablename__ = "topic_views"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=True)
    created_at = Column(String, default=now)


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"
    jti = Column(String, primary_key=True)
    expires_at = Column(Integer)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (UniqueConstraint("user_id", "post_id"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    post_id = Column(Integer, ForeignKey("posts.id"))
    reason = Column(Text)
    created_at = Column(String, default=now)
