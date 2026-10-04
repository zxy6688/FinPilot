import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import ContextAI from "../components/ContextAI";
import Fin from "./Fin";
interface Step {
  kind: string;
  title: string;
  detail: string;
  url?: string;
  options?: string[];
  minutes: number;
}
export interface SavedRoute {
  id: number;
  target_topic_id: number;
  current_step: number;
  status: string;
  last_active_at: string;
  route_snapshot: {
    title: string;
    reason: string;
    source_title: string;
    source_evidence: number;
    steps: Step[];
  };
}
export default function RouteExperience() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<SavedRoute | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState("");
  async function load() {
    setError("");
    setBusy(true);
    try {
      const row = params.get("saved")
        ? await api<SavedRoute>("/v3/routes/" + params.get("saved"))
        : await api<SavedRoute>("/v3/routes", "POST", {
            target_topic_id: Number(id),
          });
      setData(row);
      setParams({ saved: String(row.id) }, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (user) void load();
  }, [id, user?.id]);
  async function answer(answer: number) {
    if (!data) return;
    setBusy(true);
    try {
      const r = await api<{
        correct: boolean;
        explanation: string;
        route: SavedRoute;
      }>(`/v3/routes/${data.id}/answer`, "POST", {
        index: data.current_step,
        answer,
      });
      setData(r.route);
      setFeedback(r.explanation);
      window.dispatchEvent(new Event("living-updated"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const step = data?.route_snapshot.steps[data.current_step];
  return (
    <div className="route-experience">
      <Link to="/learn" className="breadcrumb">
        ← Learn
      </Link>
      <header className="living-heading">
        <span className="eyebrow">A ROUTE TO UNDERSTANDING</span>
        <h1>
          {data
            ? "慢慢走近「" + data.route_snapshot.title + "」"
            : "从好奇心出发，走通一条路线。"}
        </h1>
        <p>
          {data
            ? `从「${data.route_snapshot.source_title}」出发 · 约 ${data.route_snapshot.steps.reduce((a, b) => a + b.minutes, 0)} 分钟 · 自动保存进度`
            : "登录后，路线会根据你的学习记录保存。"}
        </p>
      </header>
      {!user ? (
        <Link to="/login" className="button">
          登录并建立路线 →
        </Link>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={load}>重试</button>
        </div>
      ) : !data ? (
        <p role="status">正在连接你的知识…</p>
      ) : (
        <div className="route-workspace">
          <aside>
            <ol className="route-timeline">
              {data.route_snapshot.steps.map((s, i) => (
                <li
                  key={i}
                  className={
                    i < data.current_step
                      ? "done"
                      : i === data.current_step
                        ? "current"
                        : ""
                  }
                >
                  <span>
                    {i < data.current_step
                      ? "✓"
                      : String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <small>
                      {s.kind} · {s.minutes} min
                    </small>
                    <b>{s.title}</b>
                    <em>
                      {i < data.current_step
                        ? "已有完成记录"
                        : i === data.current_step
                          ? "当前一步"
                          : "稍后"}
                    </em>
                  </div>
                </li>
              ))}
            </ol>
            <details className="route-evidence">
              <summary>这条路线为什么这样连接？</summary>
              <p>{data.route_snapshot.reason}</p>
              <p>
                起点学习证据：{data.route_snapshot.source_evidence} /
                100。它反映站内记录，不衡量金融能力。关系路径沿用真实知识目录。
              </p>
            </details>
          </aside>
          <section className="route-current">
            {step ? (
              <>
                <span className="eyebrow">
                  STEP {data.current_step + 1} / {step.kind}
                </span>
                <h2>{step.title}</h2>
                <p>{step.detail}</p>
                {step.options ? (
                  <div className="review-options">
                    {step.options.map((o, i) => (
                      <button
                        key={i}
                        disabled={busy}
                        className="secondary"
                        onClick={() => void answer(i)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <Link
                      className="button"
                      to={step.url + "?route=" + data.id}
                    >
                      开始这一步 →
                    </Link>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={load}
                    >
                      我已操作，检查记录
                    </button>
                    <p className="small muted">
                      完成后从页面下方回到路线；进度根据保存的学习记录更新。
                    </p>
                  </>
                )}
                {feedback && (
                  <p className="route-feedback" role="status">
                    {feedback}
                  </p>
                )}
                <ContextAI
                  compact
                  context={{
                    source_type: "route",
                    source_id: data.target_topic_id,
                  }}
                  title={data.route_snapshot.title}
                  actions={["why"]}
                />
              </>
            ) : (
              <>
                <Fin size={64} mood="bright" />
                <span className="eyebrow">ONE PATH, MADE YOURS</span>
                <h2>你走通了这条路线。</h2>
                <p>
                  阅读、练习和连接都留下了记录。下一次遇到这个概念，你有了自己的出发点。
                </p>
                <Link className="button" to="/profile">
                  看看 My World →
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export function RouteReturn() {
  const [params] = useSearchParams();
  const r = useLoadRoute(params.get("route"));
  return r ? (
    <div className="route-return">
      <Link to={`/learn/routes/${r.target_topic_id}?saved=${r.id}`}>
        ← 回到「{r.route_snapshot.title}」理解路线
      </Link>
    </div>
  ) : null;
}
function useLoadRoute(id: string | null) {
  const [data, setData] = useState<SavedRoute | null>(null);
  useEffect(() => {
    let active = true;
    if (id)
      api<SavedRoute>("/v3/routes/" + id)
        .then((r) => {
          if (active) setData(r);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  return data;
}
