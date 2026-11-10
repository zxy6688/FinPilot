/**
 * FinPilot W1: add-on My World redesign using the EXISTING notebook + learning APIs.
 * This component does not migrate, rewrite, or merge historical records.
 * React router integration is a separate tiny change to the current main.tsx.
 */
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import { useLoad } from "../components/ui";
import type { Favorite, LearningPath } from "../types";
import { FinArt } from "./Fin";
import { EntryActions, entrySummary } from "./EntryActions";
import { useNotebook, type Entry } from "./state";
import "./my-world-v2.css";

type Section = "records" | "learning" | "saved";
type Kind = "all" | Entry["kind"];
const kindNames: Record<Entry["kind"], string> = {
  receipt: "财务计算",
  reading: "阅读笔记",
  concept: "概念笔记",
};
const resultLabels: Record<string, string> = {
  remaining: "预计结余",
  gap: "距预留目标缺口",
  spent: "计划支出合计",
  balance: "期末金额／实际购买力",
  nominal: "名义金额",
  net_received: "净到账",
  repayment_total: "偿还现金流合计",
  effective_annual_cost: "模型有效年成本",
  total_cost: "利息及费用",
  interest: "累计净变化",
  real_rate: "实际年变化率",
};
function safeLocalPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\"))
    return null;
  try {
    const url = new URL(raw, "http://finpilot.local");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "http://finpilot.local" || /[\\\x00-\x20]/.test(path))
      return null;
    if (
      !/^\/(concept-studio(?:\/(?:[1-9]|[12]\d|3[0-6]|etf-matrix))?|money-lab(?:\/(?:budget|loan|inflation|compound|savings))?|stories\/(?:budget|loan|etf|bonds)|decoder\/purchasing-power|lessons\/\d+|articles\/\d+|lab\/\d+|learn\/\d+|fintalk\/\d+)$/.test(
        path,
      )
    )
      return null;
    return raw;
  } catch {
    return null;
  }
}
function payloadOf(entry: Entry): Record<string, unknown> {
  return entry.payload &&
    typeof entry.payload === "object" &&
    !Array.isArray(entry.payload)
    ? (entry.payload as Record<string, unknown>)
    : {};
}
function recordSummary(entry: Entry): string {
  try {
    return entrySummary(entry) || entry.detail;
  } catch {
    return entry.detail;
  }
}
function notes(entry: Entry): string | null {
  const p = payloadOf(entry);
  const note = typeof p.note === "string" ? p.note : null;
  return note || null;
}
function metrics(entry: Entry): { label: string; display: string }[] {
  const p = payloadOf(entry);
  const exp = p.experiment;
  const current =
    exp && typeof exp === "object" && !Array.isArray(exp)
      ? (exp as Record<string, unknown>).current
      : p.current;
  if (!current || typeof current !== "object" || Array.isArray(current))
    return [];
  const tool = String(p.tool || entry.url.split("?")[0].split("/").pop());
  const labels = {
    ...resultLabels,
    balance: tool === "inflation" ? "折合今天的购买力" : "期末金额",
    gap: tool === "savings" ? "距储蓄目标缺口" : "距预留目标缺口",
    required_monthly: "达到目标需每月存入",
    total_paid: "还款及费用合计（含期初扣费）",
  };
  return Object.entries(current as Record<string, unknown>)
    .filter(
      ([k, v]) => k in labels && typeof v === "number" && Number.isFinite(v),
    )
    .slice(0, 4)
    .map(([k, v]) => ({
      label: labels[k as keyof typeof labels],
      display:
        k.endsWith("rate") || k.includes("annual_cost")
          ? `${(v as number).toFixed(2)}%`
          : `¥${(v as number).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }));
}
function groupKey(e: Entry): string {
  if (e.kind !== "receipt") return kindNames[e.kind];
  const url = safeLocalPath(e.url)?.split("?")[0] || "";
  const tool = url.match(
    /^\/money-lab\/(budget|loan|inflation|compound|savings)/,
  )?.[1];
  const label: Record<string, string> = {
    budget: "个人预算",
    loan: "贷款成本",
    inflation: "购买力",
    compound: "复利",
    savings: "储蓄规划",
  };
  return tool ? `财务计算 · ${label[tool]}` : "财务计算 · 其他";
}
function dateText(raw: string): string {
  const time = new Date(raw);
  return Number.isNaN(time.getTime())
    ? "时间未知"
    : time.toLocaleString("zh-CN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}
function RecordCard({
  entry,
  manage,
}: {
  entry: Entry;
  manage: ReturnType<typeof useNotebook>["manage"];
}) {
  const [expanded, setExpanded] = useState(false);
  const url = safeLocalPath(entry.url);
  const stats = metrics(entry);
  const p = payloadOf(entry);
  const model =
    p.experiment &&
    typeof p.experiment === "object" &&
    !Array.isArray(p.experiment)
      ? (p.experiment as Record<string, unknown>).current
      : p.current;
  const modelVersion =
    model && typeof model === "object" && "model_version" in model
      ? String((model as Record<string, unknown>).model_version)
      : null;
  return (
    <article className="mw-record">
      <div className="mw-record-meta">
        <span>{kindNames[entry.kind]}</span>
        <span>{entry.storage === "account" ? "账户记录" : "此浏览器"}</span>
        <span>{dateText(entry.at)}</span>
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.detail}</p>
      <div className="mw-record-actions">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "收起预览" : "查看记录"}
        </button>
        {url ? (
          <Link to={url}>
            {entry.kind === "receipt" ? "恢复参数并继续计算" : "返回原页面"} →
          </Link>
        ) : (
          <span role="status">原页面地址无效</span>
        )}
      </div>
      {expanded && (
        <div className="mw-record-preview">
          {stats.length > 0 && (
            <dl className="mw-metrics">
              {stats.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.display}</dd>
                </div>
              ))}
            </dl>
          )}
          <p>
            <b>保存时的输入／摘要：</b>
            {recordSummary(entry) || "未记录"}
          </p>
          {entry.kind === "receipt" &&
            !!model &&
            typeof model === "object" &&
            "inputs" in model && (
              <details>
                <summary>查看保存的参数</summary>
                <InputPreview inputs={(model as { inputs: unknown }).inputs} />
              </details>
            )}
          {notes(entry) && (
            <p>
              <b>我的笔记：</b>
              {notes(entry)}
            </p>
          )}
          {entry.kind === "concept" && typeof p.question === "string" && (
            <p>
              <b>理解题：</b>
              {p.question}
            </p>
          )}
          {entry.kind === "concept" && (
            <p>
              <b>即时题记录：</b>
              {typeof p.answer === "number"
                ? `已选择第 ${p.answer + 1} 项`
                : typeof p.choice === "number"
                  ? `旧分类题第 ${p.choice + 1} 项`
                  : "未保存原题答案"}
              ；不等于正式课程提交。
              {typeof p.selected === "number"
                ? ` ETF 案例：${["指数 ETF", "主动 ETF", "场外指数基金", "场外主动基金"][p.selected] || "未知"}`
                : ""}
            </p>
          )}
          {entry.kind === "receipt" && !stats.length && (
            <p>旧记录未包含可识别的计算结果；可按原地址查看，不补造指标。</p>
          )}
          <p className="mw-fine">
            记录格式 {entry.version || "未标注"}
            {modelVersion ? ` · 计算模型 ${modelVersion}` : ""} ·{" "}
            {entry.storage === "account"
              ? "登录账户保存"
              : "仅保存在当前浏览器"}
          </p>
          <EntryActions
            entry={entry}
            manage={manage}
            allowCompare={!!url && url.startsWith("/money-lab")}
          />
        </div>
      )}
    </article>
  );
}
function InputPreview({ inputs }: { inputs: unknown }) {
  if (!inputs || typeof inputs !== "object") return <p>未记录输入。</p>;
  const p = inputs as Record<string, unknown>;
  const labels: Record<string, string> = {
    income: "可用收入（元）",
    reserve: "计划预留（元）",
    principal: "初始金额／借款面额（元）",
    monthly: "每月存入（元）",
    months: "月数",
    years: "年数",
    target: "目标金额（元）",
    rate: "年利率（%）",
    inflation: "年通胀率（%）",
    growth: "名义年增长率（%）",
    upfront: "期初扣费（元）",
    monthly_fee: "每月费用（元）",
    frequency: "每年复利次数",
    basis: "利率口径",
    timing: "存入时点",
    method: "还款方式",
  };
  const names: Record<string, string> = {
    effective: "年有效利率",
    nominal: "年名义利率",
    begin: "月初",
    end: "月末",
    annuity: "等额本息",
    principal: "等额本金",
    bullet: "到期一次还本",
  };
  return (
    <>
      <dl className="mw-inputs">
        {Object.entries(p)
          .filter(
            ([k, v]) => k in labels && ["number", "string"].includes(typeof v),
          )
          .map(([k, v]) => (
            <div key={k}>
              <dt>{labels[k]}</dt>
              <dd>{names[String(v)] || String(v)}</dd>
            </div>
          ))}
      </dl>
      {Array.isArray(p.expenses) && (
        <ul>
          {p.expenses.map((e, i) => (
            <li key={i}>
              {String(e?.name || "未命名支出")}：
              {typeof e?.amount === "number" ? e.amount.toFixed(2) : "未记录"}{" "}
              元
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
function RecordSection() {
  const n = useNotebook();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [order, setOrder] = useState<"new" | "old">("new");
  const visible = useMemo(
    () =>
      n.entries
        .filter(
          (e) =>
            (kind === "all" || e.kind === kind) &&
            [e.title, e.detail, recordSummary(e), notes(e) || ""]
              .join(" ")
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase()),
        )
        .sort(
          (a, b) =>
            (order === "new" ? -1 : 1) * (a.at || "").localeCompare(b.at || ""),
        ),
    [n.entries, query, kind, order],
  );
  const grouped = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    visible.forEach((e) => {
      const key = groupKey(e);
      groups.set(key, [...(groups.get(key) || []), e]);
    });
    return [...groups];
  }, [visible]);
  return (
    <section aria-labelledby="mw-record-title" className="mw-section">
      <div className="mw-section-heading">
        <div>
          <h2 id="mw-record-title">保存的成果</h2>
          <p>
            已保存的预算、计算、文章和概念笔记，可以在这里预览、查找和重新打开。
          </p>
        </div>
        <span>{n.entries.length} 条记录</span>
      </div>
      <div className="mw-controls">
        <label>
          查找记录
          <input
            aria-label="查找我的记录"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名称、金额或笔记"
          />
        </label>
        <label>
          记录类型
          <select
            aria-label="记录类型"
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            <option value="all">全部</option>
            <option value="receipt">财务计算</option>
            <option value="reading">阅读笔记</option>
            <option value="concept">概念笔记</option>
          </select>
        </label>
        <label>
          排序
          <select
            aria-label="排序"
            value={order}
            onChange={(e) => setOrder(e.target.value as "new" | "old")}
          >
            <option value="new">最近保存</option>
            <option value="old">最早保存</option>
          </select>
        </label>
      </div>
      {n.error && (
        <p role="alert" className="mw-error">
          读取或修改失败：{n.error}{" "}
          <button
            onClick={() => window.dispatchEvent(new Event("redesign-save"))}
          >
            重新读取
          </button>
        </p>
      )}
      {n.loading ? (
        <p role="status">正在读取保存记录…</p>
      ) : n.error && !n.entries.length ? (
        <p>记录未完整载入，请重试。</p>
      ) : grouped.length ? (
        grouped.map(([group, items]) => (
          <div key={group} className="mw-group">
            <h3>
              {group} <small>{items.length}</small>
            </h3>
            <div className="mw-record-list">
              {items.map((e) => (
                <RecordCard
                  key={`${e.storage}:${e.id}`}
                  entry={e}
                  manage={n.manage}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="mw-empty">
          <FinArt size={90} action="notebook" />
          <h3>{n.entries.length ? "没有匹配的记录" : "目前还没有保存记录"}</h3>
          <p>
            {n.entries.length
              ? "修改筛选条件，查看其他记录。"
              : "使用财务工具、阅读专题或概念学习时，可以主动保存结果。"}
          </p>
          <button
            onClick={() => {
              setQuery("");
              setKind("all");
            }}
          >
            清除筛选
          </button>
          <Link to="/money-lab">查看财务工具 →</Link>
        </div>
      )}
      <p className="mw-fine">
        同一工具的多条记录仅按工具分类，未自动合并成一个项目；以后若新增项目关联信息，应由用户确认归属。删除操作无法撤销。
      </p>
    </section>
  );
}
type Memory = {
  reviews: { id: number; due_at: string }[];
  misconceptions: { id: number; tag: string; title: string; status: string }[];
};
function LearningSection() {
  const paths = useLoad<LearningPath[]>("/learning-paths");
  const memory = useLoad<Memory>("/v3/memory");
  const ongoing =
    paths.data?.filter(
      (p) =>
        p.lessons.some((l) => l.completed) &&
        p.lessons.some((l) => !l.completed),
    ) || [];
  return (
    <section className="mw-section" aria-labelledby="mw-learning-title">
      <div className="mw-section-heading">
        <div>
          <h2 id="mw-learning-title">学习与复习</h2>
          <p>
            这里显示已保存的课程与复习记录。浏览一个概念不会自动被计算为掌握。
          </p>
        </div>
      </div>
      {(paths.error || memory.error) && (
        <div className="mw-error" role="alert">
          学习记录读取失败：{paths.error || memory.error}{" "}
          <button
            onClick={() => {
              paths.reload();
              memory.reload();
            }}
          >
            重试
          </button>
        </div>
      )}
      {(paths.loading || memory.loading) && (
        <p role="status">正在读取学习状态…</p>
      )}
      {!paths.loading && !memory.loading && !paths.error && !memory.error && (
        <div className="mw-tiles">
          <div>
            <strong>继续课程</strong>
            <p>
              {ongoing.length
                ? `${ongoing.length} 条路线进行中`
                : "目前没有进行中的课程路线"}
            </p>
            {ongoing.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to={`/lessons/${p.lessons.find((l) => !l.completed)!.id}`}
              >
                {p.title} · 下一节 →
              </Link>
            ))}
            <Link to="/concept-studio?mode=courses">查看课程路线 →</Link>
          </div>
          <div>
            <strong>到期复习</strong>
            <p>
              {memory.data
                ? `${memory.data.reviews.filter((r) => new Date(r.due_at).getTime() <= Date.now()).length} 项到期`
                : "复习状态未读取"}
            </p>
            <Link to="/review">打开已有复习 →</Link>
          </div>
        </div>
      )}
      <div className="mw-legacy">
        <strong>完整学习历史</strong>
        <p>旧版的知识地图、实验反思、路线记录和 Fin 纪念内容保留原样。</p>
        <div className="rd-actions">
          <Link to="/profile/history">查看已有学习历史 →</Link>
          <Link to="/profile/history?tab=notebook">实验反思 →</Link>
          <Link to="/profile/history?tab=memories">Fin 纪念 →</Link>
        </div>
      </div>
    </section>
  );
}
const favoritesPaths: Record<string, string> = {
  article: "/articles/",
  lesson: "/lessons/",
  topic: "/topics/",
  lab: "/lab/",
  post: "/fintalk/",
};
function SavedSection() {
  const f = useLoad<Favorite[]>("/favorites");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  return (
    <section className="mw-section" aria-labelledby="mw-saved-title">
      <div className="mw-section-heading">
        <div>
          <h2 id="mw-saved-title">收藏的资料</h2>
          <p>与手动保存的计算记录分开管理，避免将收藏误认为已完成学习。</p>
        </div>
      </div>
      {f.error && (
        <p role="alert">
          {f.error} <button onClick={f.reload}>重试</button>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {f.loading && <p role="status">正在读取收藏…</p>}
      {f.data?.length ? (
        <div className="mw-record-list">
          {f.data.map((x) => (
            <article className="mw-saved" key={x.id}>
              <Link to={(favoritesPaths[x.kind] || "/topics/") + x.target_id}>
                {x.item?.title || "原资料暂不可用"}
              </Link>
              <button
                type="button"
                disabled={busyId === x.id}
                onClick={async () => {
                  setBusyId(x.id);
                  setError("");
                  try {
                    await api(`/favorites/${x.kind}/${x.target_id}`, "POST");
                    f.reload();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "操作失败");
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                取消收藏
              </button>
            </article>
          ))}
        </div>
      ) : (
        !f.loading && !f.error && <p>目前没有收藏的资料。</p>
      )}
    </section>
  );
}
export default function MyWorldV2() {
  const { user, logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const section = (params.get("section") || "records") as Section;
  const setSection = (value: Section) => setParams({ section: value });
  return (
    <div className="rd-page mw-world">
      <header className="mw-heading">
        <div>
          <h1>我的世界</h1>
          <button className="rd-text" onClick={()=>window.dispatchEvent(new CustomEvent('fin-pet-settings',{detail:{tab:'纪念册'}}))}>Fin 的纪念册</button>
          <p>保存的计算、阅读与学习记录，随时可以回来查找和继续。</p>
        </div>
        <FinArt action="notebook" size={132} />
      </header>
      <div className="mw-scope" role="status">
        {user ? (
          <>
            <b>当前账户：{user.name}</b>
            {user.email === "demo@finpilot.app" && (
              <strong>
                {" "}
                · 共享 Demo，记录对其他体验者可见，不是个人私密空间。
              </strong>
            )}
            。账户保存的记录可在同一服务的其他设备登录后恢复；仅此浏览器的历史记录不会自动上传。
          </>
        ) : (
          <>
            <b>访客模式。</b>{" "}
            手册记录仅存于当前浏览器，清除浏览器数据后可能丢失。登录后不会自动合并访客记录。{" "}
            <Link to="/login">登录或注册 →</Link>
          </>
        )}
      </div>
      <nav className="mw-tabs" aria-label="我的世界栏目">
        <button
          aria-current={section === "records" ? "page" : undefined}
          onClick={() => setSection("records")}
        >
          我的成果
        </button>
        <button
          aria-current={section === "learning" ? "page" : undefined}
          onClick={() => setSection("learning")}
        >
          学习与复习
        </button>
        <button
          aria-current={section === "saved" ? "page" : undefined}
          onClick={() => setSection("saved")}
        >
          资料收藏
        </button>
      </nav>
      {section === "records" ? (
        <RecordSection />
      ) : !user ? (
        <section className="mw-empty">
          <h2>需要登录才能读取账户数据</h2>
          <p>课程进度、复习记录和收藏保存在账户中。</p>
          <Link to="/login">登录或注册 →</Link>
        </section>
      ) : section === "learning" ? (
        <LearningSection />
      ) : (
        <SavedSection />
      )}
      {user && (
        <footer className="mw-account">
          <span>当前登录：{user.name}</span>
          <button type="button" onClick={() => void logout()}>
            退出登录
          </button>
        </footer>
      )}
    </div>
  );
}
