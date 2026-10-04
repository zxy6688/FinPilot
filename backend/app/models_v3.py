"""V3 additive tables. Existing V1/V2 rows and schemas are left intact."""
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, JSON, ForeignKey, UniqueConstraint
from .db import Base
from .models import now


class ReadingState(Base):
    __tablename__ = 'reading_states'
    __table_args__ = (UniqueConstraint('user_id', 'content_type', 'content_id'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content_type = Column(String, nullable=False)
    content_id = Column(Integer, nullable=False)
    progress = Column(Float, default=0)
    last_section = Column(String, default='')
    position = Column(Float, default=0)
    last_read_at = Column(String, default=now)
    completed = Column(Boolean, default=False)


class ReviewItem(Base):
    __tablename__ = 'review_items'
    __table_args__ = (UniqueConstraint('user_id', 'item_key'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    item_key = Column(String, nullable=False)
    topic_id = Column(Integer, ForeignKey('topics.id'), nullable=False)
    due_at = Column(String, nullable=False)
    streak = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    last_correct = Column(Boolean, default=False)
    updated_at = Column(String, default=now)


class MisconceptionState(Base):
    __tablename__ = 'misconception_states'
    __table_args__ = (UniqueConstraint('user_id', 'tag'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    tag = Column(String, nullable=False)
    wrong_count = Column(Integer, default=0)
    status = Column(String, default='suspected')
    observed_at = Column(String, default=now)
    addressed_at = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)


class ReviewSession(Base):
    __tablename__ = 'review_sessions'
    __table_args__ = (UniqueConstraint('user_id', 'session_key'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_key = Column(String, nullable=False)
    kind = Column(String, default='review')
    items = Column(JSON, default=list)
    responses = Column(JSON, default=list)
    cursor = Column(Integer, default=0)
    created_at = Column(String, default=now)
    completed_at = Column(String, nullable=True)


class SavedRoute(Base):
    __tablename__ = 'saved_routes'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    target_topic_id = Column(Integer, ForeignKey('topics.id'), nullable=False)
    route_snapshot = Column(JSON, default=dict)
    current_step = Column(Integer, default=0)
    completed_steps = Column(JSON, default=list)
    status = Column(String, default='active')
    started_at = Column(String, default=now)
    last_active_at = Column(String, default=now)


class Reflection(Base):
    __tablename__ = 'reflections'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    lab_id = Column(Integer, ForeignKey('labs.id'), nullable=False)
    prediction = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    inputs = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    comparison = Column(JSON, nullable=True)
    reflection = Column(Text, default='')
    created_at = Column(String, default=now)
    completed_at = Column(String, nullable=True)


class UserConnection(Base):
    __tablename__ = 'user_connections'
    __table_args__ = (UniqueConstraint('user_id', 'relation_id'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    relation_id = Column(Integer, ForeignKey('topic_relations.id'), nullable=False)
    unlocked_at = Column(String, default=now)


class MomentRecord(Base):
    __tablename__ = 'moment_records'
    __table_args__ = (UniqueConstraint('user_id', 'kind', 'event_key'),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    kind = Column(String, nullable=False)
    event_key = Column(String, default='first')
    title = Column(String, nullable=False)
    detail = Column(Text, default='')
    severity = Column(String, default='micro')
    created_at = Column(String, default=now)
    seen_at = Column(String, nullable=True)
    display_session = Column(String, nullable=True)


class CompanionState(Base):
    __tablename__ = 'companion_states'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    domains_awakened = Column(JSON, default=list)
    companion_form = Column(String, default='seed')
    recent_event = Column(String, nullable=True)
    updated_at = Column(String, default=now)
