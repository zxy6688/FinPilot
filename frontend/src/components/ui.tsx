import ContextAI from "./ContextAI";
import { useState, useEffect, ReactNode, Component, ErrorInfo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
  Compass,
  MessageCircle,
  Heart,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { Article, Post, Favorite } from "../types";
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);
  const { user } = useAuth();
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    api<T>(path)
      .then((x) => {
        if (live) setData(x);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, tick, user?.id]);
  return { data, error, loading, reload: () => setTick((x) => x + 1), setData };
}
export function State({
  loading,
  error,
  children,
  retry,
}: {
  loading: boolean;
  error?: string;
  children: ReactNode;
  retry?: () => void;
}) {
  if (loading)
    return (
      <div className="skeleton-state" role="status" aria-label="正在加载内容">
        <span className="sr-only">正在加载内容</span>
        <div className="skeleton title" />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton short" />
      </div>
    );
  if (error)
    return (
      <div className="state error" role="alert">
        <AlertCircle />
        <p>{error}</p>
        {retry && <button onClick={retry}>重新尝试</button>}
        <Link to="/login">前往登录</Link>
      </div>
    );
  return <>{children}</>;
}
export function Empty({
  text = "这里还没有内容，试试其他筛选条件。",
}: {
  text?: string;
}) {
  return (
    <div className="state empty">
      <Compass size={32} />
      <p>{text}</p>
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}
export function Section({
  title,
  en,
  to,
  children,
}: {
  title: string;
  en?: string;
  to?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-title">
        <h2>
          {title} {en && <span>{en}</span>}
        </h2>
        {to && (
          <Link className="text-link" to={to}>
            查看全部 <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: value + "%" }} />
    </div>
  );
}
export function SaveButton({ kind, id }: { kind: string; id: number }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (user)
      api<Favorite[]>("/favorites")
        .then((fs) =>
          setSaved(fs.some((f) => f.kind === kind && f.target_id === id)),
        )
        .catch(() => {});
    else setSaved(false);
  }, [kind, id, user?.id]);
  return (
    <>
      <button
        className={"icon-button " + (saved ? "saved" : "")}
        disabled={busy}
        aria-label={saved ? "取消收藏" : "收藏"}
        title={saved ? "取消收藏" : "收藏"}
        onClick={async () => {
          if (!user) {
            nav("/login");
            return;
          }
          setBusy(true);
          setError("");
          try {
            setSaved(
              (
                await api<{ saved: boolean }>(
                  `/favorites/${kind}/${id}`,
                  "POST",
                )
              ).saved,
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      </button>
      {error && <small className="error">{error}</small>}
    </>
  );
}
export function formatDate(value: string | null | undefined) {
  if (!value) return "日期未标注";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "日期未标注"
    : d.toLocaleDateString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
}
export function ArticleCard({ article: a }: { article: Article }) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const real = a.content_type === "REAL_WORLD";
  const kind = !real
    ? "原创解释"
    : a.source_kind === "官方投教"
      ? "官方指南"
      : a.source_kind === "统计解读" || a.source_kind === "研究发布"
        ? "官方数据与研究"
        : "历史政策资料";
  async function record() {
    if (user)
      try {
        await api(`/articles/${a.id}/view`, "POST");
      } catch (e) {
        setError((e as Error).message);
      }
  }
  return (
    <article
      className={"card article-card " + (real ? "real-world" : "explainer")}
    >
      <div className="row between">
        <span className={"content-label " + (real ? "official" : "original")}>
          {kind}
        </span>
        <SaveButton kind="article" id={a.id} />
      </div>
      <div className="article-meta">
        {real ? (
          <>
            {a.source} · {formatDate(a.published_at)}
          </>
        ) : (
          <>
            FinPilot · 约 3 分钟 ·{" "}
            {a.difficulty === "Beginner" ? "入门" : "进阶"}
          </>
        )}
      </div>
      <h3>
        <Link to={`/topics/${a.topic_id}`} onClick={record}>
          {a.title}
        </Link>
      </h3>
      <p className="article-summary">{a.summary}</p>
      {real ? (
        <div className="why">
          <span>为什么值得理解</span>
          <p>{a.why_it_matters}</p>
        </div>
      ) : (
        <p className="explainer-context">{a.why_it_matters}</p>
      )}
      <div className="row wrap topic-tags">
        {a.topics?.map((t) => (
          <Link className="tag" key={t.id} to={`/topics/${t.id}`}>
            {t.title}
          </Link>
        ))}
      </div>
      <div className="card-actions">
        <Link
          onClick={record}
          className="text-link"
          to={`/copilot?mode=explain&q=${encodeURIComponent(a.title + "。" + a.summary)}`}
        >
          {real ? "理解这件事" : "开始理解"}
          <ArrowRight size={15} />
        </Link>
        {a.source_url && (
          <a
            href={a.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={record}
          >
            官方原文 <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      {error && (
        <small className="error" role="alert">
          {error}
        </small>
      )}
      <ContextAI
        compact
        context={{ source_type: "article", source_id: a.id }}
        title={a.title}
        actions={["explain", "connect"]}
      />
    </article>
  );
}
export function PostCard({ post: p }: { post: Post }) {
  return (
    <article className="post-row">
      <Link
        to={`/fintalk/${p.id}`}
        className={"avatar persona-tone-" + (p.user_id % 4)}
        aria-label={`${p.author}的讨论`}
      >
        {p.author.slice(0, 1)}
      </Link>
      <div className="post-info">
        <div className="post-byline">
          <b>{p.author}</b>
          <span>{p.learner_label || "FinPilot 学习者"}</span>
          {p.is_seed_persona && (
            <span className="fictional-label">虚构学习者</span>
          )}
          <time>{formatDate(p.created_at)}</time>
        </div>
        <h3>
          <Link to={`/fintalk/${p.id}`}>{p.title}</Link>
        </h3>
        <p className="post-preview">{p.body}</p>
        <div className="row wrap small post-meta">
          <Link className="tag" to={`/topics/${p.topic_id}`}>
            {p.topic_title || "相关主题"}
          </Link>
          <span>
            <MessageCircle size={15} /> {p.comments} 回复
          </span>
          <span>
            <Heart size={15} /> {p.likes} 赞
          </span>
          <Link className="text-link" to={`/fintalk/${p.id}`}>
            参与讨论 <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <SaveButton kind="post" id={p.id} />
    </article>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    return this.state.failed ? (
      <div className="state error">
        <h1>页面暂时无法显示</h1>
        <p>刷新页面重试，你已保存的学习记录仍在。</p>
        <button onClick={() => window.location.reload()}>刷新</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
