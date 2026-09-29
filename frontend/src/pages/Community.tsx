import { useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { Plus, Heart, MessageCircle, Sparkles, Flag, Send } from "lucide-react";
import Markdown from "react-markdown";
import {
  Heading,
  State,
  Empty,
  useLoad,
  PostCard,
  SaveButton,
  formatDate,
} from "../components/ui";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import type { Post, Topic } from "../types";
const categoryLabels: Record<string, string> = {
  "Beginner Help": "新手提问",
  "Learning Notes": "学习笔记",
  "Market Understanding": "理解市场",
  "Behavioral Reflection": "决策反思",
  "Course Discussion": "课程讨论",
};
const cats = [
  "Beginner Help",
  "Learning Notes",
  "Market Understanding",
  "Behavioral Reflection",
  "Course Discussion",
];
export function Community() {
  const [params] = useSearchParams(),
    [category, setCategory] = useState(""),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [postTitle, setPostTitle] = useState(""),
    [postBody, setPostBody] = useState("");
  const { user } = useAuth(),
    nav = useNavigate();
  const r = useLoad<Post[]>(
    "/posts?" +
      new URLSearchParams({
        category,
        ...(params.get("topic") ? { topic_id: params.get("topic")! } : {}),
      }),
  );
  const topics = useLoad<Topic[]>("/topics");
  return (
    <>
      <Heading
        eyebrow="FINTALK / 学习社区"
        title="好的判断，在交流中慢慢形成。"
        description="分享学习笔记，提出还没想明白的问题。关注证据与思考过程。"
      >
        <button onClick={() => (user ? setShow(!show) : nav("/login"))}>
          <Plus size={17} /> 发起讨论
        </button>
      </Heading>
      <div className="tabs community-tabs">
        {["", ...cats].map((c) => (
          <button
            className={category === c ? "active" : ""}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c || "全部讨论"}
          </button>
        ))}
      </div>
      {params.get("topic") && (
        <p className="notice">
          示例帖子、回复和点赞来自 8
          位明确标注的虚构学习者，不代表真实用户经历。 正在查看指定主题的讨论。
          <Link to="/fintalk"> 清除主题筛选</Link>
        </p>
      )}
      {show && (
        <form
          className="card post-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              const p = await api<Post>("/posts", "POST", {
                title: f.get("title"),
                body: f.get("body"),
                category: f.get("category"),
                topic_id: Number(f.get("topic_id")),
              });
              nav("/fintalk/" + p.id);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>把你的思考分享出来</h2>
          <label>
            讨论标题
            <input
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              name="title"
              minLength={4}
              maxLength={160}
              required
              placeholder="你想理解什么？"
            />
          </label>
          <div className="grid two">
            <label>
              讨论板块
              <select name="category">
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              相关 Topic
              <select name="topic_id" required>
                {topics.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            正文
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              name="body"
              required
              minLength={10}
              maxLength={10000}
              rows={5}
              placeholder="分享你的理解、依据和仍然不确定的地方…"
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <p className="character-count">
            标题 {postTitle.length} / 160 · 正文 {postBody.length} / 10000
          </p>
          <button
            disabled={
              busy ||
              !topics.data?.length ||
              postTitle.trim().length < 4 ||
              postBody.trim().length < 10
            }
          >
            {busy ? "发布中…" : "发布讨论"}
          </button>
        </form>
      )}
      <div className="community-layout">
        <State loading={r.loading} error={r.error} retry={r.reload}>
          <div className="card discussion-list">
            {r.data?.length ? (
              r.data.map((p) => <PostCard key={p.id} post={p} />)
            ) : (
              <Empty text="还没有相关讨论，来分享你的第一个问题。" />
            )}
          </div>
        </State>
        <aside>
          <div className="card community-note">
            <MessageCircle size={28} />
            <h3>交流，让理解发生</h3>
            <p>说说“为什么”，比只给出结论更有帮助。</p>
            <ul>
              <li>尊重不同的知识起点</li>
              <li>区分事实、假设与观点</li>
              <li>不发布荐股、广告或收益承诺</li>
            </ul>
            <Link className="text-link" to="/learn">
              带着问题去学习 →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
export function PostPage() {
  const { id } = useParams(),
    { user } = useAuth(),
    nav = useNavigate();
  const r = useLoad<Post>("/posts/" + id);
  const [error, setError] = useState(""),
    [summary, setSummary] = useState<{
      content: string;
      provider: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [reporting, setReporting] = useState(false),
    [notice, setNotice] = useState(""),
    [replyText, setReplyText] = useState("");
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && (
        <div className="post-detail">
          <Link className="breadcrumb" to="/fintalk">
            ← 返回 FinTalk
          </Link>
          <div className="card">
            <div className="row between">
              <span className="tag">{r.data.category}</span>
              <SaveButton kind="post" id={r.data.id} />
            </div>
            <h1>{r.data.title}</h1>
            <p className="muted small">
              {r.data.author} · {formatDate(r.data.created_at)}
              {r.data.is_seed_persona
                ? ` · 虚构学习者 · ${r.data.learner_label}`
                : r.data.is_demo
                  ? " · 示例讨论"
                  : ""}
            </p>
            <div className="prose">
              <Markdown skipHtml>{r.data.body}</Markdown>
            </div>
            <div className="row wrap">
              <button
                disabled={busy}
                className={"secondary " + (r.data.liked ? "liked" : "")}
                onClick={async () => {
                  if (!user) {
                    nav("/login");
                    return;
                  }
                  setBusy(true);
                  try {
                    await api("/posts/" + id + "/like", "POST");
                    r.reload();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Heart
                  size={16}
                  fill={r.data.liked ? "currentColor" : "none"}
                />{" "}
                {r.data.likes} 赞
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    setSummary(await api("/posts/" + id + "/summary", "POST"));
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Sparkles size={16} /> {busy ? "处理中…" : "AI 总结讨论"}
              </button>
              <Link className="text-link" to={"/topics/" + r.data.topic_id}>
                相关 Topic →
              </Link>
              <button
                className="quiet"
                onClick={() =>
                  user ? setReporting(!reporting) : nav("/login")
                }
              >
                <Flag size={14} /> 举报
              </button>
            </div>
            {summary && (
              <div className="ai-summary">
                <span className="tag">
                  {summary.provider === "live"
                    ? "AI Summary"
                    : "Demo Summary · 内容摘取"}
                </span>
                <Markdown skipHtml>{summary.content}</Markdown>
              </div>
            )}
            {reporting && (
              <form
                className="report-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  try {
                    const x = await api<{ message: string }>(
                      "/posts/" + id + "/report",
                      "POST",
                      { reason: form.get("reason") },
                    );
                    setNotice(x.message);
                    setReporting(false);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <label>
                  举报原因
                  <input name="reason" required minLength={4} maxLength={500} />
                </label>
                <button>提交举报</button>
              </form>
            )}
            {notice && <p className="notice">{notice}</p>}
          </div>
          <section className="section">
            <h2>一起讨论 · {r.data.comments}</h2>
            {r.data.replies?.map((c) => (
              <div className="card reply" key={c.id}>
                <div className="row">
                  <span className="avatar">{c.author[0]}</span>
                  <b>{c.author}</b>
                  {c.is_seed_persona && (
                    <span className="muted small">
                      虚构学习者 · {c.learner_label}
                    </span>
                  )}
                  <span className="muted small">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <div className="prose">
                  <Markdown skipHtml>{c.body}</Markdown>
                </div>
              </div>
            ))}
            <form
              className="card"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) {
                  nav("/login");
                  return;
                }
                const form = e.currentTarget,
                  f = new FormData(form);
                setBusy(true);
                try {
                  await api("/posts/" + id + "/comments", "POST", {
                    body: f.get("body"),
                  });
                  form.reset();
                  setReplyText("");
                  r.reload();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                你的思考
                <textarea
                  name="body"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={3000}
                  rows={4}
                  placeholder="分享一个例子，或者提出新的问题…"
                />
              </label>
              <p className="character-count">{replyText.length} / 3000</p>
              <button disabled={busy || !replyText.trim()}>
                <Send size={15} /> {user ? "发布回复" : "登录后回复"}
              </button>
            </form>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </State>
  );
}
