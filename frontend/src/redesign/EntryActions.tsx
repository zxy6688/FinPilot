import { useState } from "react";
import { Link } from "react-router-dom";
import type { Entry } from "./state";

export function entrySummary(entry: Entry) {
  const payload = entry.payload as {
    current?: { inputs?: Record<string, unknown> };
    experiment?: { current?: { inputs?: Record<string, unknown> } };
  };
  const inputs =
    payload?.current?.inputs || payload?.experiment?.current?.inputs;
  if (!inputs) return entry.detail;
  const labels: Record<string, string> = {
    income: "可用收入",
    reserve: "计划储备",
    principal: "本金",
    monthly: "每月存入",
    months: "月数",
    years: "年数",
    rate: "年利率%",
    inflation: "通胀率%",
    growth: "金额增长率%",
    upfront: "期初费用",
    monthly_fee: "月费用",
  };
  const parts = Object.entries(inputs)
    .filter(([k]) => labels[k])
    .map(([k, v]) => `${labels[k]} ${v}`);
  if (Array.isArray(inputs.expenses))
    parts.push(
      `支出 ${inputs.expenses.length} 项 · 合计 ${inputs.expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0).toFixed(2)} 元`,
    );
  return parts.join(" · ");
}
export function EntryActions({
  entry,
  manage,
}: {
  entry: Entry;
  manage: (
    entry: Entry,
    action: "rename" | "delete",
    title?: string,
  ) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<"rename" | "delete" | null>(null),
    [title, setTitle] = useState(entry.title),
    [busy, setBusy] = useState(false);
  return (
    <div className="px-entry-actions">
      <div className="rd-actions">
        <button
          className="rd-secondary"
          onClick={() => {
            setTitle(entry.title);
            setMode("rename");
          }}
        >
          重命名
        </button>
        <button className="rd-secondary" onClick={() => setMode("delete")}>
          删除
        </button>
        {entry.kind === "receipt" && (
          <Link
            className="rd-text-link"
            to={entry.url + (entry.url.includes("?") ? "&" : "?") + "compare=1"}
          >
            以此为 A，再试一个方案 →
          </Link>
        )}
      </div>
      {mode && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (await manage(entry, mode, title.trim())) setMode(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "rename" ? (
            <label>
              记录名称
              <input
                aria-label="记录名称"
                maxLength={180}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </label>
          ) : (
            <p role="alert">
              确定删除“{entry.title}”？将从
              {entry.storage === "account" ? "此账户" : "此浏览器"}
              真正移除，无法撤销；不会删除其他实验。
            </p>
          )}
          <div className="rd-actions">
            <button
              className="rd-button"
              disabled={busy || (mode === "rename" && !title.trim())}
            >
              {busy ? "处理中…" : mode === "rename" ? "保存名称" : "确认删除"}
            </button>
            <button
              type="button"
              className="rd-secondary"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
