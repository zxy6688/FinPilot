import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send } from "lucide-react";
import Modal from "./Modal";
import ReadingBlocks from "./ReadingBlocks";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { Action, LabInputs } from "../types";
export type ContextAction =
  | "explain"
  | "example"
  | "connect"
  | "quiz"
  | "why"
  | "next"
  | "result"
  | "changed"
  | "limits";
export interface AIContext {
  source_type: "topic" | "lesson" | "article" | "lab" | "relation" | "route";
  source_id: number;
  selected_text?: string;
  inputs?: LabInputs;
}
const labels: Record<ContextAction, string> = {
  explain: "简单解释",
  example: "举个例子",
  connect: "连接我的学习",
  quiz: "考考我",
  why: "为什么相连",
  next: "下一步理解什么",
  result: "解释实验结果",
  changed: "改变了什么",
  limits: "模型忽略了什么",
};
const kinds = {
  topic: "Topic",
  lesson: "Lesson",
  article: "Discover",
  lab: "Lab",
  relation: "Relation",
  route: "Learning Route",
};
export default function ContextAI({
  context,
  title,
  actions = ["explain", "connect"],
  compact = false,
}: {
  context: AIContext;
  title: string;
  actions?: ContextAction[];
  compact?: boolean;
}) {
  const [action, setAction] = useState<ContextAction | null>(null);
  return (
    <div className={"context-actions " + (compact ? "compact" : "")}>
      <span className="context-label">
        <Sparkles size={15} /> Ask in context
      </span>
      {actions.map((a) => (
        <button className="secondary" key={a} onClick={() => setAction(a)}>
          {labels[a]}
        </button>
      ))}
      {action && (
        <Modal
          className="context-modal"
          title="Contextual AI"
          onClose={() => setAction(null)}
        >
          <Conversation
            key={action + context.source_type + context.source_id}
            context={context}
            action={action}
            title={title}
          />
        </Modal>
      )}
    </div>
  );
}
function Conversation({
  context,
  action,
  title,
}: {
  context: AIContext;
  action: ContextAction;
  title: string;
}) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState(""),
    [provider, setProvider] = useState(""),
    [actions, setActions] = useState<Action[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [text, setText] = useState(""),
    [session, setSession] = useState<number | null>(null);
  async function send(message: string) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{
        content: string;
        provider: string;
        actions: Action[];
        session_id: number;
      }>("/chat", "POST", {
        message,
        mode: "explain",
        session_id: session,
        context: {
          ...context,
          selected_text: context.selected_text?.slice(0, 1200),
          action,
        },
      });
      setAnswer(r.content);
      setProvider(r.provider);
      setActions(r.actions);
      setSession(r.session_id);
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (user) void send(labels[action] + "：" + title);
  }, []);
  return (
    <>
      <div className="context-source">
        <span className="eyebrow">Context · {kinds[context.source_type]}</span>
        <h3>{title}</h3>
        <span className="tag">{labels[action]}</span>
        {provider && (
          <span className="tag">
            {provider === "live"
              ? "External AI"
              : provider === "demo-fallback"
                ? "Demo AI · 已回退"
                : "Demo AI"}
          </span>
        )}
      </div>
      {!user ? (
        <p className="notice">
          <Link to="/login">登录后围绕这段内容提问 →</Link>
        </p>
      ) : (
        <>
          {busy && <p role="status">正在结合当前内容组织解释…</p>}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <button
                onClick={() => void send(text || labels[action] + "：" + title)}
              >
                重试
              </button>
            </div>
          )}
          {answer && (
            <div className="context-answer">
              <ReadingBlocks markdown={answer} compact />
              <div className="row wrap">
                {actions.map((a) => (
                  <Link className="tag" key={a.url} to={a.url}>
                    {a.label} · {a.title} →
                  </Link>
                ))}
              </div>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim() && !busy) void send(text.trim());
            }}
            className="context-followup"
          >
            <label htmlFor="context-question">继续围绕当前内容提问</label>
            <textarea
              id="context-question"
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
            />
            <button disabled={busy || !text.trim()}>
              <Send size={15} /> 发送追问
            </button>
          </form>
          <Link className="text-link" to="/copilot">
            打开完整 AI Copilot（会话已保存） →
          </Link>
        </>
      )}
    </>
  );
}
