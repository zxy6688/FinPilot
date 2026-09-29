from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, object_session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from ..db import get_db
from ..models import (
    Article,
    Badge,
    ChatMessage,
    ChatSession,
    Comment,
    Favorite,
    Lab,
    LabRecord,
    LearningPath,
    Lesson,
    Like,
    Post,
    QuizQuestion,
    QuizRecord,
    Report,
    RevokedToken,
    Topic,
    TopicRelation,
    TopicView,
    User,
    UserBadge,
    UserProgress,
)
from ..schemas import (
    Answer,
    ChatInput,
    LabInput,
    Login,
    NewComment,
    NewPost,
    Register,
    ReportInput,
)
from ..security import (
    require_user,
    optional_user,
    bearer,
    claims_for,
    hash_password,
    verify_password,
    token_for,
)
from ..services.learning import profile, award_badges
from ..services.recommendations import recommend
from ..services.labs import simulate
from ..ai.provider import answer, summarize

router = APIRouter(prefix="/api")


def obj(row, exclude=()):
    data = {
        c.name: getattr(row, c.name)
        for c in row.__table__.columns
        if c.name not in exclude
    }
    if isinstance(row, (Article, Lesson)):
        db = object_session(row)
        data["topics"] = [
            {"id": t.id, "title": t.title}
            for tid in (row.topic_ids or [row.topic_id])
            if (t := db.get(Topic, tid))
        ]
    if isinstance(row, Lesson):
        data["question_count"] = (
            object_session(row).query(QuizQuestion).filter_by(lesson_id=row.id).count()
        )
    return data


def get(db, model, id):
    row = db.get(model, id)
    if not row:
        raise HTTPException(404, "内容不存在")
    return row


def post_data(db, p, user=None):
    return {
        **obj(p),
        "author": get(db, User, p.user_id).name,
        "topic_title": get(db, Topic, p.topic_id).title,
        "learner_label": get(db, User, p.user_id).learner_label,
        "is_seed_persona": bool(get(db, User, p.user_id).is_seed_persona),
        "likes": db.query(Like).filter_by(post_id=p.id).count(),
        "comments": db.query(Comment).filter_by(post_id=p.id).count(),
        "liked": bool(
            user and db.query(Like).filter_by(post_id=p.id, user_id=user.id).first()
        ),
    }


@router.post("/auth/register", status_code=201)
def register(data: Register, db: Session = Depends(get_db)):
    u = User(
        email=data.email, name=data.name, password_hash=hash_password(data.password)
    )
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "该邮箱已注册")
    return {"token": token_for(u), "user": obj(u, ("password_hash",))}


@router.post("/auth/login")
def login(data: Login, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=data.email).first()
    if not u or not verify_password(data.password, u.password_hash):
        raise HTTPException(401, "邮箱或密码不正确")
    return {"token": token_for(u), "user": obj(u, ("password_hash",))}


@router.post("/auth/logout")
def logout(
    user=Depends(require_user),
    credentials=Depends(bearer),
    db: Session = Depends(get_db),
):
    p = claims_for(credentials, db)
    db.add(RevokedToken(jti=p["jti"], expires_at=p["exp"]))
    db.commit()
    return {"ok": True}


@router.get("/users/me")
def me(user=Depends(require_user), db: Session = Depends(get_db)):
    award_badges(db, user)
    return profile(db, user)


@router.get("/topics")
def topics(db: Session = Depends(get_db)):
    return [obj(t) for t in db.query(Topic)]


@router.get("/topics/{id}")
def topic(id: int, db: Session = Depends(get_db)):
    t = get(db, Topic, id)
    return {
        **obj(t),
        "related": [obj(get(db, Topic, i)) for i in t.related_ids],
        "relations": [
            {
                **obj(r),
                "from_title": get(db, Topic, r.from_topic_id).title,
                "to_title": get(db, Topic, r.to_topic_id).title,
            }
            for r in db.query(TopicRelation)
            if id in (r.from_topic_id, r.to_topic_id)
        ],
        "articles": [
            obj(x) for x in db.query(Article) if id in (x.topic_ids or [x.topic_id])
        ],
        "lessons": [
            obj(x) for x in db.query(Lesson) if id in (x.topic_ids or [x.topic_id])
        ],
        "labs": [obj(x) for x in db.query(Lab).filter_by(topic_id=id)],
        "posts": [post_data(db, x) for x in db.query(Post).filter_by(topic_id=id)],
    }


@router.post("/topics/{id}/view")
def view_topic(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    get(db, Topic, id)
    db.add(TopicView(user_id=user.id, topic_id=id))
    db.commit()
    return {"ok": True}


@router.get("/articles")
def articles(
    category: str = "",
    content_type: str = "",
    difficulty: str = "",
    q: str = Query("", max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(Article)
    if content_type:
        query = query.filter_by(content_type=content_type)
    if category:
        query = query.filter_by(category=category)
    if difficulty:
        query = query.filter_by(difficulty=difficulty)
    if q:
        query = query.filter(Article.title.contains(q, autoescape=True))
    return [obj(a) for a in query.order_by(Article.id.desc())]


@router.post("/articles/{id}/view")
def view_article(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    a = get(db, Article, id)
    db.add(TopicView(user_id=user.id, topic_id=a.topic_id, article_id=id))
    db.commit()
    return {"ok": True}


@router.get("/learning-paths")
def paths(user=Depends(optional_user), db: Session = Depends(get_db)):
    done = (
        {p.lesson_id for p in db.query(UserProgress).filter_by(user_id=user.id)}
        if user
        else set()
    )
    result = []
    for p in sorted(
        db.query(LearningPath),
        key=lambda p: (
            [1, 5, 2, 3, 4].index(p.id) if p.id in [1, 5, 2, 3, 4] else p.id + 10
        ),
    ):
        ls = db.query(Lesson).filter_by(path_id=p.id).order_by(Lesson.position).all()
        result.append(
            {
                **obj(p),
                "lessons": [{**obj(l), "completed": l.id in done} for l in ls],
                "progress": (
                    round(100 * sum(l.id in done for l in ls) / len(ls)) if ls else 0
                ),
            }
        )
    return result


@router.get("/learning-paths/{id}")
def path(id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    get(db, LearningPath, id)
    return next(p for p in paths(user, db) if p["id"] == id)


@router.get("/lessons/{id}")
def lesson(id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    l = get(db, Lesson, id)
    n = db.query(Lesson).filter_by(path_id=l.path_id, position=l.position + 1).first()
    qs = db.query(QuizQuestion).filter_by(lesson_id=id).all()
    latest = (
        {
            r.question_id: r
            for r in db.query(QuizRecord)
            .filter_by(user_id=user.id)
            .order_by(QuizRecord.id)
        }
        if user
        else {}
    )
    return {
        **obj(l),
        "questions": [
            {
                **obj(q, ("correct_answer", "explanation")),
                "record": (
                    {
                        "answer": latest[q.id].answer,
                        "correct": latest[q.id].correct,
                        "correct_answer": q.correct_answer,
                        "explanation": q.explanation,
                    }
                    if q.id in latest
                    else None
                ),
            }
            for q in qs
        ],
        "next_id": n.id if n else None,
        "completed": bool(
            user
            and db.query(UserProgress).filter_by(user_id=user.id, lesson_id=id).first()
        ),
    }


@router.post("/quizzes/{id}/answer")
def quiz(
    id: int, data: Answer, user=Depends(require_user), db: Session = Depends(get_db)
):
    q = get(db, QuizQuestion, id)
    if data.answer >= len(q.options):
        raise HTTPException(422, "选项无效")
    correct = data.answer == q.correct_answer
    db.add(
        QuizRecord(user_id=user.id, question_id=id, answer=data.answer, correct=correct)
    )
    db.commit()
    return {
        "correct": correct,
        "answer": data.answer,
        "correct_answer": q.correct_answer,
        "explanation": q.explanation,
    }


@router.post("/progress/{id}")
def complete(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    get(db, Lesson, id)
    qs = db.query(QuizQuestion).filter_by(lesson_id=id).all()
    answered = {r.question_id for r in db.query(QuizRecord).filter_by(user_id=user.id)}
    if not all(q.id in answered for q in qs):
        raise HTTPException(409, "请先完成本课全部自测题")
    if not db.query(UserProgress).filter_by(user_id=user.id, lesson_id=id).first():
        db.add(UserProgress(user_id=user.id, lesson_id=id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    award_badges(db, user)
    return {"ok": True}


@router.get("/labs")
def labs(db: Session = Depends(get_db)):
    return [obj(x) for x in db.query(Lab)]


@router.get("/labs/{id}")
def lab(id: int, db: Session = Depends(get_db)):
    return obj(get(db, Lab, id))


@router.post("/labs/{id}/simulate")
def lab_run(id: int, data: LabInput, db: Session = Depends(get_db)):
    return simulate(get(db, Lab, id).slug, data)


@router.post("/labs/{id}/records")
def save_lab(
    id: int, data: LabInput, user=Depends(require_user), db: Session = Depends(get_db)
):
    result = simulate(get(db, Lab, id).slug, data)
    r = LabRecord(user_id=user.id, lab_id=id, inputs=data.model_dump(), result=result)
    db.add(r)
    db.commit()
    award_badges(db, user)
    return obj(r)


@router.get("/posts")
def posts(
    category: str = "",
    topic_id: int | None = None,
    user=Depends(optional_user),
    db: Session = Depends(get_db),
):
    q = db.query(Post)
    if category:
        q = q.filter_by(category=category)
    if topic_id:
        q = q.filter_by(topic_id=topic_id)
    return [post_data(db, p, user) for p in q.order_by(Post.id.desc()).limit(100)]


@router.post("/posts", status_code=201)
def new_post(data: NewPost, user=Depends(require_user), db: Session = Depends(get_db)):
    get(db, Topic, data.topic_id)
    p = Post(**data.model_dump(), user_id=user.id)
    db.add(p)
    db.commit()
    return post_data(db, p, user)


@router.get("/posts/{id}")
def post(id: int, user=Depends(optional_user), db: Session = Depends(get_db)):
    p = get(db, Post, id)
    return {
        **post_data(db, p, user),
        "replies": [
            {
                **obj(c),
                "author": get(db, User, c.user_id).name,
                "is_seed_persona": bool(get(db, User, c.user_id).is_seed_persona),
                "learner_label": get(db, User, c.user_id).learner_label,
            }
            for c in db.query(Comment).filter_by(post_id=id).order_by(Comment.id)
        ],
    }


@router.post("/posts/{id}/comments", status_code=201)
def comment(
    id: int, data: NewComment, user=Depends(require_user), db: Session = Depends(get_db)
):
    get(db, Post, id)
    c = Comment(post_id=id, user_id=user.id, body=data.body)
    db.add(c)
    db.commit()
    return {**obj(c), "author": user.name}


@router.post("/posts/{id}/like")
def like(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    p = get(db, Post, id)
    old = db.query(Like).filter_by(user_id=user.id, post_id=id).first()
    if old:
        db.delete(old)
    else:
        db.add(Like(user_id=user.id, post_id=id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return post_data(db, p, user)


@router.post("/posts/{id}/report")
def report(
    id: int,
    data: ReportInput,
    user=Depends(require_user),
    db: Session = Depends(get_db),
):
    get(db, Post, id)
    if not db.query(Report).filter_by(user_id=user.id, post_id=id).first():
        db.add(Report(user_id=user.id, post_id=id, reason=data.reason))
        db.commit()
    return {
        "ok": True,
        "message": "已记录举报，V1由项目维护者核查数据库中的reports记录。",
    }


@router.post("/posts/{id}/summary")
async def summary(id: int, db: Session = Depends(get_db)):
    p = get(db, Post, id)
    return await summarize(
        p, db.query(Comment).filter_by(post_id=id).order_by(Comment.id).limit(10).all()
    )


TARGETS = {
    "article": Article,
    "lesson": Lesson,
    "post": Post,
    "topic": Topic,
    "lab": Lab,
}


@router.get("/favorites")
def favorites(user=Depends(require_user), db: Session = Depends(get_db)):
    return [
        {**obj(f), "item": obj(get(db, TARGETS[f.kind], f.target_id))}
        for f in db.query(Favorite)
        .filter_by(user_id=user.id)
        .order_by(Favorite.id.desc())
    ]


@router.post("/favorites/{kind}/{id}")
def favorite(
    kind: str, id: int, user=Depends(require_user), db: Session = Depends(get_db)
):
    if kind not in TARGETS:
        raise HTTPException(422, "不支持的收藏类型")
    get(db, TARGETS[kind], id)
    f = db.query(Favorite).filter_by(user_id=user.id, kind=kind, target_id=id).first()
    saved = not bool(f)
    if f:
        db.delete(f)
    else:
        db.add(Favorite(user_id=user.id, kind=kind, target_id=id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"saved": saved}


@router.get("/badges")
def badges(user=Depends(optional_user), db: Session = Depends(get_db)):
    if user:
        award_badges(db, user)
    earned = (
        {b.badge_id for b in db.query(UserBadge).filter_by(user_id=user.id)}
        if user
        else set()
    )
    return [{**obj(b), "earned": b.id in earned} for b in db.query(Badge)]


@router.get("/recommendations")
def recommendations(user=Depends(optional_user), db: Session = Depends(get_db)):
    return recommend(db, user)


@router.get("/search")
def search(q: str = Query("", max_length=100), db: Session = Depends(get_db)):
    q = q.strip()
    if not q:
        return {}
    result = {}
    topic_ids = [
        t.id
        for t in db.query(Topic).filter(
            or_(
                Topic.title.contains(q, autoescape=True),
                Topic.english.contains(q, autoescape=True),
            )
        )
    ]
    for name, model, fields in [
        ("topics", Topic, [Topic.title, Topic.english, Topic.summary]),
        ("articles", Article, [Article.title, Article.summary]),
        ("lessons", Lesson, [Lesson.title, Lesson.markdown]),
        ("labs", Lab, [Lab.title, Lab.english, Lab.summary]),
        ("posts", Post, [Post.title, Post.body]),
    ]:
        result[name] = [
            obj(x)
            for x in db.query(model)
            .filter(
                or_(
                    *(f.contains(q, autoescape=True) for f in fields),
                    (
                        model.topic_id.in_(topic_ids)
                        if hasattr(model, "topic_id")
                        else False
                    ),
                )
            )
            .limit(30)
        ]
    return result


@router.get("/chat/sessions")
def chats(user=Depends(require_user), db: Session = Depends(get_db)):
    return [
        obj(s)
        for s in db.query(ChatSession)
        .filter_by(user_id=user.id)
        .order_by(ChatSession.id.desc())
        .limit(30)
    ]


@router.get("/chat/sessions/{id}")
def chat_history(id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    s = get(db, ChatSession, id)
    if s.user_id != user.id:
        raise HTTPException(404, "会话不存在")
    return {
        **obj(s),
        "messages": [
            obj(m)
            for m in db.query(ChatMessage)
            .filter_by(session_id=id)
            .order_by(ChatMessage.id)
        ],
    }


@router.post("/chat")
async def chat(
    data: ChatInput, user=Depends(require_user), db: Session = Depends(get_db)
):
    history = []
    if not data.message.strip():
        raise HTTPException(422, "请输入问题")
    if data.session_id:
        s = get(db, ChatSession, data.session_id)
        if s.user_id != user.id:
            raise HTTPException(404, "会话不存在")
        if s.mode != data.mode:
            raise HTTPException(409, "切换模式后请开启新会话")
        history = [
            {"role": m.role, "content": m.content}
            for m in db.query(ChatMessage)
            .filter_by(session_id=s.id)
            .order_by(ChatMessage.id)
        ]
    else:
        s = ChatSession(user_id=user.id, mode=data.mode, title=data.message[:40])
    result = await answer(db, data.mode, data.message, history)
    if not data.session_id:
        db.add(s)
        db.flush()
    db.add(ChatMessage(session_id=s.id, role="user", content=data.message))
    db.add(
        ChatMessage(
            session_id=s.id,
            role="assistant",
            content=result["content"],
            metadata_json={
                "actions": result["actions"],
                "provider": result["provider"],
            },
        )
    )
    db.commit()
    return {**result, "session_id": s.id}
