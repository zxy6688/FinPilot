import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Compass,
  Brain,
  FileText,
  Send,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import ReadingBlocks from "../components/ReadingBlocks";
import { Heading } from "../components/ui";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { Message, ChatSession, Action } from "../types";
const modes = [
  {
    id: "tutor",
    title: "讲给我听",
    en: "Tutor",
    icon: BookOpen,
    desc: "从一个概念开始",
  },
  {
    id: "explain",
    title: "帮我看懂",
    en: "Explain",
    icon: FileText,
    desc: "拆解一段金融文字",
  },
  {
    id: "guide",
    title: "我应该学什么",
    en: "Guide",
    icon: Compass,
    desc: "找到下一步的方向",
  },
  {
    id: "coach",
    title: "反思一次决策",
    en: "Behavior Coach",
    icon: Brain,
    desc: "理解情绪与判断",
  },
];
export default function Copilot() {
  const [params] = useSearchParams(),
    { user } = useAuth();
  const [mode, setMode] = useState(
      modes.some((m) => m.id === params.get("mode"))
        ? params.get("mode")!
        : "tutor",
    ),
    [text, setText] = useState(params.get("q") || ""),
    [messages, setMessages] = useState<Message[]>([]),
    [session, setSession] = useState<number | null>(null),
    [sessions, setSessions] = useState<ChatSession[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [aiMode, setAiMode] = useState("demo");
  useEffect(() => {
    api<{ ai_mode: string }>("/health")
      .then((x) => setAiMode(x.ai_mode))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (user)
      api<ChatSession[]>("/chat/sessions")
        .then(setSessions)
        .catch((e) => setError(e.message));
    else {
      setSessions([]);
      setMessages([]);
      setSession(null);
    }
  }, [user?.id]);
  async function send() {
    if (!text.trim() || busy) return;
    if (!user) {
      setError("请登录后开始对话，聊天记录将保存在你的账户中。");
      return;
    }
    const prompt = text;
    setBusy(true);
    setError("");
    try {
      const r = await api<{
        content: string;
        provider: string;
        actions: Action[];
        session_id: number;
      }>("/chat", "POST", { message: prompt, mode, session_id: session });
      setMessages((old) => [
        ...old,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content: r.content,
          metadata_json: { actions: r.actions, provider: r.provider },
        },
      ]);
      setSession(r.session_id);
      setText("");
      setSessions(await api("/chat/sessions"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const related =
    [...messages].reverse().find((m) => m.metadata_json?.actions)?.metadata_json
      ?.actions || [];
  const lastProvider = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.metadata_json?.provider;
  return (
    <>
      <Heading
        eyebrow="AI COPILOT / 你的学习搭子"
        title="把“看不懂”，变成“原来如此”。"
        description="提问、理解、练习。每次对话，都通往下一步学习。"
      >
        <span
          className="pill"
          title={
            (lastProvider || aiMode) === "live"
              ? "已连接模型服务，回答仍需结合资料核查。"
              : "当前使用站内课程内容提供演示解释。"
          }
        >
          <span className="dot" />
          {(lastProvider || aiMode) === "live"
            ? "FinPilot AI"
            : "FinPilot Demo AI"}
        </span>
      </Heading>
      <div className="copilot-layout">
        <aside className="card chat-sidebar">
          <div className="mode-grid">
            {modes.map((m) => (
              <button
                disabled={busy}
                key={m.id}
                className={"mode-card " + (mode === m.id ? "active" : "")}
                onClick={() => {
                  setMode(m.id);
                  setSession(null);
                  setMessages([]);
                  setError("");
                }}
              >
                <m.icon size={22} />
                <span>
                  <b>{m.title}</b>
                  <small>
                    {m.en} · {m.desc}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setSession(null);
              setMessages([]);
              setText("");
            }}
          >
            <Plus size={16} /> 新的好问题
          </button>
          <div className="eyebrow">最近的好问题</div>
          {sessions.length ? (
            sessions.map((s) => (
              <button
                disabled={busy}
                className={
                  "session-link " + (session === s.id ? "selected" : "")
                }
                key={s.id}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await api<ChatSession>("/chat/sessions/" + s.id);
                    setMode(r.mode);
                    setSession(r.id);
                    setMessages(r.messages || []);
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {s.title}
              </button>
            ))
          ) : (
            <p className="muted small">你的好奇心，会在这里留下足迹。</p>
          )}
        </aside>
        <div className="card chat-main">
          {!messages.length ? (
            <div className="chat-welcome">
              <span className="ai-orb">
                <Sparkles size={34} />
              </span>
              <h2>今天，想理解什么？</h2>
              <p>
                无需准备一个完美的问题。
                <br />
                从你正在好奇的地方开始就好。
              </p>
              <div className="prompt-grid">
                {[
                  "ETF 与普通股票有什么不同？",
                  "为什么利率变化会影响债券？",
                  "第一次做预算，我应该先学什么？",
                  "我怕错过别人晒出的收益",
                ].map((p) => (
                  <button
                    className="secondary"
                    key={p}
                    onClick={() => setText(p)}
                  >
                    {p}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
              <small className="muted">
                演示解释基于站内课程。需要核验的事实，请回到原始资料。
              </small>
            </div>
          ) : (
            <div className="messages">
              {messages.map((m, i) => (
                <article className={"message " + m.role} key={i}>
                  <div className="eyebrow">
                    {m.role === "user"
                      ? "你"
                      : "FINPILOT · " +
                        (m.metadata_json?.provider === "live" ? "AI" : "DEMO")}
                  </div>
                  {m.role === "assistant" ? (
                    <ReadingBlocks markdown={m.content} compact />
                  ) : (
                    <p className="user-message-text">{m.content}</p>
                  )}
                  {m.metadata_json?.actions && (
                    <div className="ai-actions">
                      {m.metadata_json.actions.map((a) => (
                        <Link to={a.url} key={a.label}>
                          <span>{a.label}</span>
                          <b>{a.title}</b>
                          <ArrowUpRight size={15} />
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="你的问题"
              value={text}
              maxLength={mode === "explain" ? 6000 : 2000}
              rows={3}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入问题，或粘贴一段你想理解的金融文字…"
            />
            <div className="row between">
              <small className="muted">
                {text.length} / {mode === "explain" ? 6000 : 2000} ·
                不自动抓取网页
              </small>
              <button disabled={busy || !text.trim()}>
                {busy ? (
                  "正在整理思路…"
                ) : (
                  <>
                    <Send size={16} /> 发送
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error} {!user && <Link to="/login">去登录 →</Link>}
              </p>
            )}
          </form>
        </div>
        <aside className="related-knowledge card">
          <details open>
            <summary>对话之外，继续探索</summary>
            <p className="muted small">把这次理解，放回知识地图。</p>
            {related.length ? (
              related.map((a) => (
                <Link className="knowledge-action" to={a.url} key={a.label}>
                  <span>{a.label}</span>
                  <b>{a.title}</b>
                  <ArrowUpRight size={17} />
                </Link>
              ))
            ) : (
              <>
                <div className="knowledge-placeholder">
                  <Compass size={32} />
                  <h3>每个问题，都有下一步。</h3>
                  <p>开始对话后，这里会连接相关主题、课程和实验。</p>
                </div>
                <Link className="text-link" to="/learn">
                  先看看五条学习路径 →
                </Link>
              </>
            )}
          </details>
        </aside>
      </div>
    </>
  );
}
