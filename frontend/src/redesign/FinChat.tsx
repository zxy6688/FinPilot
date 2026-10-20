import { learningStorage } from "../services/learningStorage";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import { FinArt } from "./Fin";
import type { Message } from "../types";
type Context = NonNullable<Message["metadata_json"]>["context"];
const map: Record<string, [number, string, string?]> = {
  "/stories/budget": [1, "预算专题"],
  "/decoder/purchasing-power": [2, "购买力专题"],
  "/stories/bonds": [3, "降息与债券"],
  "/stories/etf": [4, "ETF 专题"],
  "/stories/loan": [5, "贷款专题"],
  "/money-lab/savings": [101, "储蓄规划", "savings"],
  "/money-lab/compound": [102, "复利与时间", "compound"],
  "/money-lab/inflation": [103, "通胀购买力", "inflation"],
  "/money-lab/loan": [104, "贷款成本", "loan"],
  "/money-lab/budget": [105, "预算情景", "budget"],
  "/concept-studio": [201, "ETF 二维矩阵"],
};
export function FinChat() {
  const { user } = useAuth(),
    loc = useLocation();
  const [open, setOpen] = useState(false),
    [prompt, setPrompt] = useState(""),
    [answer, setAnswer] = useState(""),
    [session, setSession] = useState<number | null>(null),
    [context, setContext] = useState<Context>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setSession(null);
    setAnswer("");
    setContext(undefined);
    setOpen(false);
  }, [user?.id]);
  useEffect(() => {
    const show = () => {
      const source = map[loc.pathname];
      let c: Context = undefined;
      if (source) {
        const raw = source[2]
          ? learningStorage.getItem(source[2] + "-draft")
          : null;
        let tool_inputs;
        try {
          tool_inputs = raw ? JSON.parse(raw) : undefined;
        } catch {}
        c = {
          source_type: "redesign",
          source_id: source[0],
          title: source[1],
          action: "explain",
          selected_text: window.getSelection()?.toString().slice(0, 1200) || "",
          ...(tool_inputs ? { tool_inputs } : {}),
        };
      }
      setContext(c);
      setAnswer("");
      setError("");
      setOpen(true);
    };
    window.addEventListener("fin-chat", show);
    return () => window.removeEventListener("fin-chat", show);
  }, [loc.pathname]);
  const key = "fin-chat:" + String(user?.id ?? "guest");
  const full = () => {
    learningStorage.setItem(key, JSON.stringify({ context, session, prompt }));
    setOpen(false);
  };
  return open ? (
    <Modal
      title="和 Fin 接着想一想"
      onClose={() => setOpen(false)}
      className="gb-fin-chat"
    >
      <div className="gb-fin-chat-head">
        <FinArt size={72} mood={busy ? "thinking" : "curious"} />
        <div>
          <b>{context?.title || "从一个具体问题开始"}</b>
          <p>Demo 只解释已有内容；不核验任意新闻，不提供实时行情。</p>
        </div>
      </div>
      {context?.selected_text && (
        <blockquote>{context.selected_text}</blockquote>
      )}
      {!user && (
        <p className="rd-notice">
          登录后可使用原有 Copilot 会话并保存对话。当前页面和实验仍可免费试用。
          <Link to="/login" onClick={full}>
            登录 →
          </Link>
        </p>
      )}
      {answer && (
        <div className="gb-chat-answer" role="status">
          {answer}
        </div>
      )}
      <label>
        你的追问
        <textarea
          maxLength={1800}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：这里为什么要区分两种利率？"
        />
      </label>
      <div className="rd-actions">
        <button
          className="rd-button"
          disabled={!user || busy || !prompt.trim()}
          onClick={async () => {
            const requestToken = localStorage.getItem("finpilot_token");
            setBusy(true);
            setError("");
            try {
              const r = await api<{
                content: string;
                session_id: number;
                context?: Context;
              }>("/chat", "POST", {
                message: prompt,
                mode: "tutor",
                session_id: session,
                context,
              });
              if (localStorage.getItem("finpilot_token") !== requestToken)
                return;
              setSession(r.session_id);
              setContext(r.context || context);
              setAnswer(r.content);
              setPrompt("");
              learningStorage.setItem(
                key,
                JSON.stringify({
                  context: r.context || context,
                  session: r.session_id,
                  prompt: "",
                }),
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "整理已有解释…" : "发送追问"}
        </button>
        <Link
          className="rd-text-link"
          to={"/copilot" + (session ? "?session=" + session : "")}
          onClick={full}
        >
          在完整 Copilot 继续 →
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
    </Modal>
  ) : null;
}
