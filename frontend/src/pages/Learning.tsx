import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Coins,
  Wallet,
  Layers,
  Network,
  Brain,
} from "lucide-react";
import KnowledgeMap from "../components/KnowledgeMap";
import ReadingBlocks from "../components/ReadingBlocks";
import {
  Heading,
  Section,
  State,
  Empty,
  useLoad,
  Progress,
  SaveButton,
  ArticleCard,
  PostCard,
} from "../components/ui";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type {
  Article,
  TopicDetail,
  LearningPath,
  Lesson,
  AnswerResult,
} from "../types";
export function Discover() {
  const [category, setCategory] = useState(""),
    [difficulty, setDifficulty] = useState(""),
    [content_type, setContentType] = useState("");
  const r = useLoad<Article[]>(
    "/articles?" + new URLSearchParams({ category, difficulty, content_type }),
  );
  return (
    <>
      <Heading
        eyebrow="DISCOVER / 信息导航"
        title="世界很复杂，理解可以简单一点。"
        description="从可靠的官方资料出发，读懂金融事件背后的概念与机制。"
      />
      <div className="notice">
        真实来源包含历史事件和官方投教资料，日期以原始页面为准；原创解释为
        FinPilot 编写。这里不是实时新闻流。
      </div>
      <div className="filters">
        <div className="content-tabs" role="group" aria-label="内容类型筛选">
          {[
            ["", "全部内容"],
            ["REAL_WORLD", "真实资料"],
            ["EXPLAINER", "原创解释"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={content_type === value ? "active" : ""}
              aria-pressed={content_type === value}
              onClick={() => setContentType(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="tabs">
          {[
            "",
            "Macro",
            "Markets",
            "Stocks",
            "Funds & ETF",
            "Bonds",
            "Personal Finance",
            "FinTech",
          ].map((c) => (
            <button
              key={c}
              className={c === category ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {
                (
                  {
                    "": "全部主题",
                    Macro: "宏观经济",
                    Markets: "市场机制",
                    Stocks: "股票",
                    "Funds & ETF": "基金与 ETF",
                    Bonds: "债券",
                    "Personal Finance": "个人金融",
                    FinTech: "金融科技",
                  } as Record<string, string>
                )[c]
              }
            </button>
          ))}
        </div>
        <select
          aria-label="难度筛选"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">全部难度</option>
          <option value="Beginner">入门</option>
          <option value="Intermediate">进阶</option>
        </select>
      </div>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data?.length ? (
          <div className="grid three">
            {r.data.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </State>
    </>
  );
}
export function TopicHub() {
  const { id } = useParams(),
    { user } = useAuth();
  const r = useLoad<TopicDetail>("/topics/" + id);
  useEffect(() => {
    if (user) api("/topics/" + id + "/view", "POST").catch(() => {});
  }, [id, user?.id]);
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && (
        <>
          <Heading
            eyebrow={"TOPIC HUB / " + r.data.english}
            title={r.data.title}
            description={r.data.summary}
          >
            <SaveButton kind="topic" id={r.data.id} />
          </Heading>
          <div className="topic-overview">
            <span className="tag">{r.data.domain}</span>
            <span>
              {
                r.data.lessons.filter((l) => user?.completed_ids.includes(l.id))
                  .length
              }{" "}
              / {r.data.lessons.length} 节相关课程已完成
            </span>
          </div>
          <KnowledgeMap key={r.data.id} topic={r.data} />
          <Section title="先理解这些问题" en="UNDERSTAND">
            <div className="grid three">
              {r.data.articles
                .filter((a) => a.content_type === "EXPLAINER")
                .map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
            </div>
            {!r.data.articles.some((a) => a.content_type === "EXPLAINER") && (
              <p className="muted">从下面的微课程开始理解这个主题。</p>
            )}
          </Section>
          <Section title="系统地学一学">
            <div className="grid two">
              {r.data.lessons.map((l) => (
                <Link
                  className="card link-card"
                  key={l.id}
                  to={`/lessons/${l.id}`}
                >
                  <BookOpen size={22} />
                  <div>
                    <h3>{l.title}</h3>
                    <span className="muted small">
                      约 {l.minutes} 分钟 · {l.question_count} 道自测
                    </span>
                  </div>
                  <ArrowRight />
                </Link>
              ))}
            </div>
          </Section>
          <Section title="看看现实世界" en="REAL WORLD">
            <div className="grid three">
              {r.data.articles
                .filter((a) => a.content_type === "REAL_WORLD")
                .map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
            </div>
            {!r.data.articles.some((a) => a.content_type === "REAL_WORLD") && (
              <Link className="text-link" to="/discover">
                浏览已核验的官方资料 →
              </Link>
            )}
          </Section>
          <Section title="在实验中验证理解">
            <div className="grid two">
              {r.data.labs.length ? (
                r.data.labs.map((l) => (
                  <Link
                    className="card link-card"
                    key={l.id}
                    to={`/lab/${l.id}`}
                  >
                    <div>
                      <h3>{l.title}</h3>
                      <p>{l.question}</p>
                    </div>
                    <ArrowRight />
                  </Link>
                ))
              ) : (
                <Link className="card link-card" to="/lab">
                  选择一个相关实验 <ArrowRight />
                </Link>
              )}
            </div>
          </Section>
          <Link
            className="ai-banner"
            to={"/copilot?q=" + encodeURIComponent("解释" + r.data.title)}
          >
            <Sparkles /> Ask FinPilot · 为什么{r.data.title}值得理解？
            <ArrowRight />
          </Link>
          <Section title="在讨论中继续思考" en="FINTALK">
            {r.data.posts.length ? (
              <div className="card">
                {r.data.posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <Empty text="这个主题还没有讨论，来FinTalk提出第一个问题。" />
            )}
          </Section>
        </>
      )}
    </State>
  );
}
function ArrowUpRightIcon() {
  return <ChevronRight size={16} />;
}
export function Learn() {
  const r = useLoad<LearningPath[]>("/learning-paths");
  return (
    <>
      <Heading
        eyebrow="LEARN / 系统学习"
        title="把零散的知识，连成自己的地图。"
        description="五条路径，从日常的钱，到市场与决策。每次约 6 分钟，把一个概念真正弄懂。"
      />
      <State loading={r.loading} error={r.error} retry={r.reload}>
        <div className="grid two">
          {r.data?.map((p, i) => (
            <Link className="card path-card" key={p.id} to={"/learn/" + p.id}>
              <div className={"path-illustration " + p.color}>
                <span>0{i + 1}</span>
                {(() => {
                  const Icon =
                    (
                      {
                        1: Coins,
                        5: Wallet,
                        2: Layers,
                        3: Network,
                        4: Brain,
                      } as Record<number, typeof BookOpen>
                    )[p.id] || BookOpen;
                  return <Icon size={65} strokeWidth={1.2} />;
                })()}
                <span className="path-caption">{p.english}</span>
              </div>
              <div className="path-body">
                <div className="eyebrow">{p.english}</div>
                <h2>{p.title}</h2>
                <p>{p.summary}</p>
                <div className="row between small">
                  <span>{p.lessons.length} 节课程 · 自测与图解</span>
                  <b>{p.progress}%</b>
                </div>
                <Progress value={p.progress} />
                <div className="text-link">
                  {p.progress ? "继续学习" : "开始这段旅程"}{" "}
                  <ArrowRight size={17} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </State>
    </>
  );
}
export function PathPage() {
  const { id } = useParams();
  const r = useLoad<LearningPath>("/learning-paths/" + id);
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && (
        <>
          <Link className="breadcrumb" to="/learn">
            ← 全部路径
          </Link>
          <Heading
            eyebrow={r.data.english}
            title={r.data.title}
            description={r.data.summary}
          />
          <div className="card path-progress">
            <div className="row between">
              <span>你的学习进度</span>
              <b>{r.data.progress}%</b>
            </div>
            <Progress value={r.data.progress} />
            <p className="muted small">
              推荐按顺序学习，也可以自由复习感兴趣的章节。
            </p>
          </div>
          <div className="lesson-list">
            {r.data.lessons.map((l, i) => (
              <Link
                className={
                  "card lesson-row " +
                  (l.completed
                    ? "completed"
                    : r.data?.lessons.find((x) => !x.completed)?.id === l.id
                      ? "current"
                      : "upcoming")
                }
                key={l.id}
                to={"/lessons/" + l.id}
              >
                <span
                  className={"lesson-number " + (l.completed ? "done" : "")}
                >
                  {l.completed ? (
                    <CheckCircle2 />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <span className="eyebrow">LESSON {i + 1}</span>
                  <h3>{l.title}</h3>
                  <span className="muted small">
                    <Clock size={13} /> 约 {l.minutes} 分钟 · {l.question_count}{" "}
                    道自测 ·{" "}
                    {l.completed
                      ? "已完成"
                      : r.data?.lessons.find((x) => !x.completed)?.id === l.id
                        ? "当前课程"
                        : "可自由学习"}
                  </span>
                  <div className="row wrap topic-tags">
                    {l.topics?.map((t) => (
                      <span className="tag" key={t.id}>
                        {t.title}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </>
      )}
    </State>
  );
}
export function LessonPage() {
  const { id } = useParams(),
    auth = useAuth();
  const r = useLoad<Lesson>("/lessons/" + id);
  const paths = useLoad<LearningPath[]>("/learning-paths");
  const currentPath = paths.data?.find((p) => p.id === r.data?.path_id);
  const [results, setResults] = useState<Record<number, AnswerResult>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<number | null>(null),
    [complete, setComplete] = useState(false);
  useEffect(() => {
    setResults({});
    setComplete(false);
    setError("");
  }, [id]);
  async function submit(qid: number, answer: number) {
    setBusy(qid);
    setError("");
    try {
      const v = await api<AnswerResult>(`/quizzes/${qid}/answer`, "POST", {
        answer,
      });
      setResults((old) => ({ ...old, [qid]: v }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && (
        <div className="reading-layout">
          <aside className="lesson-outline">
            <details open>
              <summary>本路径章节</summary>
              <h3>{currentPath?.title}</h3>
              <ol>
                {currentPath?.lessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      aria-current={l.id === Number(id) ? "page" : undefined}
                      className={l.id === Number(id) ? "active" : ""}
                      to={`/lessons/${l.id}`}
                    >
                      <span>
                        {l.completed
                          ? "✓"
                          : String(l.position).padStart(2, "0")}
                      </span>
                      {l.title.split("：")[0]}
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          </aside>
          <article>
            <Link className="breadcrumb" to={"/learn/" + r.data.path_id}>
              ← 返回学习路径
            </Link>
            <Heading
              eyebrow={
                "LESSON " +
                r.data.position +
                " · 约 " +
                r.data.minutes +
                " 分钟"
              }
              title={r.data.title}
              description="理解一个概念，带走一种看世界的方式。"
            >
              <SaveButton kind="lesson" id={r.data.id} />
            </Heading>
            <div className="card reading-card">
              <ReadingBlocks
                markdown={r.data.markdown}
                next={
                  <Link
                    className="next-lesson-card"
                    to={
                      r.data.next_id ? `/lessons/${r.data.next_id}` : "/profile"
                    }
                  >
                    <span>{r.data.next_id ? "下一课" : "完成这段旅程"}</span>
                    <h3>
                      {currentPath?.lessons.find(
                        (l) => l.id === r.data?.next_id,
                      )?.title || "看看我的学习足迹"}
                    </h3>
                    <ArrowRight />
                  </Link>
                }
                quiz={
                  <Section title="检验你的理解" en="CHECK YOURSELF">
                    {!auth.user && (
                      <div className="notice">
                        <Link to="/login">登录后提交答案并保存学习进度 →</Link>
                      </div>
                    )}
                    {r.data.questions?.map((q) => {
                      const result = results[q.id] || q.record;
                      return (
                        <div className="card quiz-card" key={q.id}>
                          <span className="eyebrow">
                            {q.kind === "boolean" ? "判断题" : "单选题"}
                          </span>
                          <h3>{q.question}</h3>
                          <div className="quiz-options">
                            {q.options.map((option, i) => (
                              <button
                                key={i}
                                disabled={busy === q.id || !auth.user}
                                className={
                                  result
                                    ? i === result.correct_answer
                                      ? "correct"
                                      : i === result.answer
                                        ? "incorrect"
                                        : ""
                                    : ""
                                }
                                onClick={() => submit(q.id, i)}
                              >
                                <span>{String.fromCharCode(65 + i)}</span>
                                {option}
                              </button>
                            ))}
                          </div>
                          {result && (
                            <div
                              className={
                                "feedback " + (result.correct ? "success" : "")
                              }
                              role="status"
                            >
                              <b>{result.correct ? "回答正确" : "再想一想"}</b>
                              <p>{result.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {error && (
                      <p className="error" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="row wrap">
                      <button
                        disabled={
                          !auth.user ||
                          busy !== null ||
                          complete ||
                          r.data.completed
                        }
                        onClick={async () => {
                          setBusy(-1);
                          try {
                            await api("/progress/" + id, "POST");
                            setComplete(true);
                            await auth.refresh();
                            paths.reload();
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        {complete || r.data.completed
                          ? "✓ 本课已完成"
                          : "完成本课，记录成长"}
                      </button>
                      {r.data.next_id ? (
                        <Link
                          className="button secondary"
                          to={"/lessons/" + r.data.next_id}
                        >
                          下一课 <ArrowRight size={16} />
                        </Link>
                      ) : (
                        <Link className="button secondary" to="/profile">
                          查看我的成长
                        </Link>
                      )}
                    </div>
                  </Section>
                }
              />
              <section className="concept-summary">
                <h2>把概念连起来</h2>
                <div className="concept-flow">
                  {r.data.diagram.map((x, i) => (
                    <span key={x}>
                      {i > 0 && <ArrowRight size={17} />}
                      <b>{x}</b>
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </article>
          <aside className="sticky-aside">
            <div className="card">
              <span className="eyebrow">你的学习进度</span>
              <Progress value={currentPath?.progress || 0} />
              <p className="small muted">
                本路径已完成 {currentPath?.progress || 0}%
              </p>
              <h3>相关知识</h3>
              <div className="row wrap topic-tags">
                {r.data.topics?.map((t) => (
                  <Link className="tag" key={t.id} to={`/topics/${t.id}`}>
                    {t.title}
                  </Link>
                ))}
              </div>
              <Link className="sidebar-link" to={"/topics/" + r.data.topic_id}>
                探索相关 Topic <ArrowRight size={16} />
              </Link>
              <Link
                className="sidebar-link"
                to={"/copilot?q=" + encodeURIComponent(r.data.title)}
              >
                <Sparkles size={16} /> 讲给我听
              </Link>
              <Link
                className="sidebar-link"
                to={"/fintalk?topic=" + r.data.topic_id}
              >
                去社区讨论 <ArrowRight size={16} />
              </Link>
              <p className="muted small">
                答错也是进步的一部分。Profile 会帮你找到值得复习的知识。
              </p>
            </div>
          </aside>
        </div>
      )}
    </State>
  );
}
