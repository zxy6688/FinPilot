import { useStoryInputs } from "./StoryInputs";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Bookmark, Plus, RotateCcw, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { FinArt } from "./Fin";
import { money, useNotebook } from "./state";

import { readDraft, numericDisplay } from "./drafts";
export type Expense = {
  name: string;
  amount: number;
  kind: "fixed" | "flexible" | "once";
};
export type BudgetInputs = {
  income: number;
  reserve: number;
  expenses: Expense[];
};
export const budgetDefaults: BudgetInputs = {
  income: 2500,
  reserve: 300,
  expenses: [
    { name: "住宿与通信", amount: 500, kind: "fixed" },
    { name: "餐饮", amount: 900, kind: "flexible" },
    { name: "交通与娱乐", amount: 350, kind: "flexible" },
    { name: "意外维修", amount: 0, kind: "once" },
  ],
};
type BudgetResult = {
  model_version: string;
  inputs: BudgetInputs;
  spent: number;
  remaining: number;
  available: number;
  gap: number;
  overspend: number;
  ratio: number | null;
  categories: { name: string; value: number }[];
  assumptions: string;
};

export function useCalculation<T>(tool: string, inputs: unknown) {
  const [result, setResult] = useState<T | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let live = true;
    setBusy(true);
    setError("");
    const t = setTimeout(() => {
      api<T>("/v3/tools/" + tool, "POST", inputs)
        .then((r) => {
          if (live) setResult(r);
        })
        .catch((e) => {
          if (live) {
            setError(e.message);
            setResult(null);
          }
        })
        .finally(() => {
          if (live) setBusy(false);
        });
    }, 180);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [tool, JSON.stringify(inputs)]);
  return { result, error, busy };
}

export async function snapshotId(prefix: string, value: unknown) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return (
    prefix +
    "-" +
    Array.from(new Uint8Array(hash))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 40)
  );
}

export function SaveExperiment({
  tool,
  title,
  payload,
  detail,
  disabled = false,
}: {
  tool: string;
  title: string;
  payload: unknown;
  detail: string;
  disabled?: boolean;
}) {
  const n = useNotebook();
  const [restoreParams] = useSearchParams();
  const restoredNote = useRef("");
  const [note, setNote] = useState(""),
    [status, setStatus] = useState(""),
    [saving, setSaving] = useState(false);
  const lock = useRef(false);
  useEffect(() => setStatus(""), [JSON.stringify(payload), note]);
  useEffect(() => {
    const id = restoreParams.get("receipt");
    if (!id || id === restoredNote.current) return;
    const entry = n.entries.find((e) => e.id === id);
    if (entry) {
      const p = entry.payload as { note?: string };
      setNote(p.note || "");
      restoredNote.current = id;
    }
  }, [restoreParams, n.entries]);
  return (
    <section className="gb-save">
      <FinArt action={status ? "receipt" : "notebook"} size={88} />
      <div>
        <h3>留下一张实验小票</h3>
        <p>{n.scope} · 包含情景、参数、结果及模型版本。</p>
        <label>
          这次我发现
          <textarea
            aria-label="这次我发现"
            value={note}
            maxLength={1500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="写下一个改变了你理解的数字…"
          />
        </label>
        <button
          className="rd-button"
          disabled={disabled || saving || !!status}
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setSaving(true);
            try {
              const data = { tool, experiment: payload, note };
              const id = await snapshotId(tool, data);
              if (
                await n.save({
                  id,
                  kind: "receipt",
                  title,
                  url: `/money-lab/${tool}?receipt=${id}`,
                  detail,
                  payload: data,
                })
              )
                setStatus("已保存这次实验");
            } finally {
              lock.current = false;
              setSaving(false);
            }
          }}
        >
          <Bookmark size={17} />
          {saving ? "保存中…" : status || "保存实验"}
        </button>
        {status && (
          <Link className="rd-text-link" to="/profile">
            去手册重新打开 →
          </Link>
        )}
        {n.error && <p role="alert">{n.error} 参数仍在，请重试。</p>}
      </div>
    </section>
  );
}

export function BudgetChart({
  result,
  other,
}: {
  result: BudgetResult;
  other?: BudgetResult | null;
}) {
  const segments = [
    ...result.categories.map((x, i) => ({
      value: x.value,
      color: ["#267B78", "#79BDCC", "#EFA79B"][i],
      label: ["固定支出", "弹性支出", "一次性支出"][i],
    })),
    {
      value: Math.max(0, result.remaining),
      color: "#F1C467",
      label: "尚未支出的余额",
    },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="gb-budget-viz">
      <svg
        viewBox="0 0 320 260"
        role="img"
        aria-label={`支出结构：已花 ${money(result.spent)} 元，结余 ${money(result.remaining)} 元`}
      >
        <circle
          cx="160"
          cy="128"
          r="91"
          fill="none"
          stroke="#edf1e9"
          strokeWidth="30"
        />
        {segments.map((x) => {
          const start = offset;
          offset += (x.value / total) * 572;
          return (
            <circle
              key={x.label}
              cx="160"
              cy="128"
              r="91"
              fill="none"
              stroke={x.color}
              strokeWidth="30"
              strokeDasharray={`${(x.value / total) * 572} 572`}
              strokeDashoffset={-start}
              transform="rotate(-90 160 128)"
            />
          );
        })}
        <text x="160" y="110" textAnchor="middle" className="gb-svg-label">
          本月已支出
        </text>
        <text x="160" y="143" textAnchor="middle" className="gb-svg-value">
          ¥{money(result.spent)}
        </text>
        <text x="160" y="167" textAnchor="middle" className="gb-svg-label">
          {result.ratio === null
            ? "无收入，比例不适用"
            : `占收入 ${(result.ratio * 100).toFixed(1)}%`}
        </text>
      </svg>
      <div className="gb-legend">
        {segments.map((x) => (
          <div key={x.label}>
            <i style={{ background: x.color }} />
            <span>{x.label}</span>
            <b>¥{money(x.value)}</b>
          </div>
        ))}
      </div>
      {other && (
        <p className="gb-difference">
          相比固定情景 A，本月结余变化{" "}
          <b>¥{money(result.remaining - other.remaining)}</b>
          ；为储备目标留下空间后，可自由分配变化{" "}
          <b>¥{money(result.available - other.available)}</b>。
        </p>
      )}
    </div>
  );
}

export function BudgetWorkbench({ embedded = false }: { embedded?: boolean }) {
  const [params] = useSearchParams(),
    n = useNotebook();
  const [inputs, setInputs] = useState<BudgetInputs>(() =>
    readDraft(
      params.get("inputs") || sessionStorage.getItem("budget-draft"),
      budgetDefaults,
    ),
  );
  useEffect(() => {
    sessionStorage.setItem("budget-draft", JSON.stringify(inputs));
  }, [inputs]);
  const { result, error, busy } = useCalculation<BudgetResult>(
    "budget",
    inputs,
  );
  const [fixed, setFixed] = useState<BudgetResult | null>(null),
    [historical, setHistorical] = useState<BudgetResult | null>(null);
  const restored = useRef("");
  useEffect(() => {
    const id = params.get("receipt");
    if (!id || restored.current === id) return;
    const record = n.entries.find((x) => x.id === id);
    if (record) {
      const p = record.payload as {
        experiment: { current: BudgetResult; fixed: BudgetResult | null };
      };
      if (p?.experiment?.current?.inputs) {
        setInputs(p.experiment.current.inputs);
        setFixed(p.experiment.fixed);
        setHistorical(p.experiment.current);
        restored.current = id;
      }
    }
  }, [params, n.entries]);
  useStoryInputs(setInputs);
  const update = (i: number, change: Partial<Expense>) =>
    setInputs((p) => ({
      ...p,
      expenses: p.expenses.map((e, j) => (j === i ? { ...e, ...change } : e)),
    }));
  return (
    <div className={embedded ? "gb-embedded" : "rd-page gb-tool-page"}>
      {!embedded && (
        <>
          <div className="rd-breadcrumb">
            <Link to="/money-lab">财务工具</Link> / 个人预算
          </div>
          <header className="gb-tool-heading">
            <div>
              <span className="rd-kicker">Money Lab / 05 · 生活里的选择</span>
              <h1>给每一笔钱，留一个位置。</h1>
              <p>先看清本月的生活，再试试一笔意外支出会改变什么。</p>
            </div>
            <FinArt action="receipt" size={110} />
          </header>
        </>
      )}
      {historical && (
        <div className="rd-notice" role="status">
          已恢复原参数和 A/B 情景。保存时结余 ¥{money(historical.remaining)}（
          {historical.model_version}）；下面按当前模型重新计算。
        </div>
      )}
      <div className="gb-workbench">
        <div className="gb-controls">
          <span className="rd-kicker">
            {fixed ? "当前情景 B" : "教学示例 · 可以改成你的数字"}
          </span>
          <h2>这个月，钱怎么安排？</h2>
          <div className="gb-field-pair">
            <label>
              可用收入（元）
              <input
                type="number"
                min="0"
                max="10000000"
                value={numericDisplay(inputs.income)}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    income: e.target.value === "" ? NaN : +e.target.value,
                  })
                }
              />
            </label>
            <label>
              计划储备（元）
              <input
                type="number"
                min="0"
                max="10000000"
                value={numericDisplay(inputs.reserve)}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    reserve: e.target.value === "" ? NaN : +e.target.value,
                  })
                }
              />
            </label>
          </div>
          <p className="gb-help">
            储备尚未花掉：先扣实际支出，再看能否留下这笔钱。
          </p>
          <div className="gb-expenses">
            {inputs.expenses.map((e, i) => (
              <div className="gb-expense" key={i}>
                <input
                  aria-label={`支出名称 ${i + 1}`}
                  maxLength={40}
                  value={e.name}
                  onChange={(v) => update(i, { name: v.target.value })}
                />
                <select
                  aria-label={`支出分类 ${i + 1}`}
                  value={e.kind}
                  onChange={(v) =>
                    update(i, { kind: v.target.value as Expense["kind"] })
                  }
                >
                  <option value="fixed">固定</option>
                  <option value="flexible">弹性</option>
                  <option value="once">一次性</option>
                </select>
                <input
                  aria-label={`${e.name}金额`}
                  type="number"
                  min="0"
                  value={numericDisplay(e.amount)}
                  onChange={(v) =>
                    update(i, {
                      amount: v.target.value === "" ? NaN : +v.target.value,
                    })
                  }
                />
                <button
                  aria-label={`删除${e.name}`}
                  onClick={() =>
                    setInputs({
                      ...inputs,
                      expenses: inputs.expenses.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="rd-text"
            disabled={inputs.expenses.length >= 30}
            onClick={() =>
              setInputs({
                ...inputs,
                expenses: [
                  ...inputs.expenses,
                  {
                    name: `新支出 ${inputs.expenses.length + 1}`,
                    amount: 0,
                    kind: "flexible",
                  },
                ],
              })
            }
          >
            <Plus size={15} /> 添加一项支出
          </button>
          <div className="gb-scenario">
            <b>试试：自行车突然坏了</b>
            <p>把维修作为本月一次性支出，而不是每个月都扣一次。</p>
            <button
              className="rd-secondary"
              onClick={() => {
                if (result && !fixed) setFixed(result);
                const i = inputs.expenses.findIndex(
                  (e) => e.name === "意外维修",
                );
                if (i >= 0) update(i, { amount: 600, kind: "once" });
                else
                  setInputs({
                    ...inputs,
                    expenses: [
                      ...inputs.expenses,
                      { name: "意外维修", amount: 600, kind: "once" },
                    ],
                  });
              }}
            >
              加入 600 元维修支出
            </button>
          </div>
        </div>
        <div className="gb-results" aria-busy={busy} aria-live="polite">
          <span className="rd-kicker">
            {busy ? "更新数字中…" : "收入 − 实际支出"}
          </span>
          <h2>本月结余</h2>
          <strong className="gb-big-number">
            {result ? `¥ ${money(result.remaining)}` : "—"}
          </strong>
          {error && (
            <p role="alert">{error} 请检查空值、负数、重复名称和金额范围。</p>
          )}
          {result && (
            <>
              <div className="gb-result-strip">
                <div>
                  <span>留出储备后可分配</span>
                  <b>¥{money(result.available)}</b>
                </div>
                <div>
                  <span>{result.gap > 0 ? "距离计划还差" : "计划缺口"}</span>
                  <b>¥{money(result.gap)}</b>
                </div>
              </div>
              <BudgetChart result={result} other={fixed} />
              <p className="gb-insight">
                {result.overspend > 0
                  ? `支出已经超过收入 ¥${money(result.overspend)}。先识别能调整的支出；借钱并不会让预算缺口消失。`
                  : result.gap > 0
                    ? "本月没有超支，但尚不足以完成全部储备目标。把必要支出和储备目标分别检查。"
                    : "这份计划能覆盖支出和储备目标，剩余空间仍可以为未来留着。"}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="gb-comparison">
        <div>
          <h3>{fixed ? "固定 A，试算 B" : "先保留一个参照"}</h3>
          <p>
            {fixed
              ? `情景 A：收入 ¥${money(fixed.inputs.income)}，支出 ¥${money(fixed.spent)}，储备 ¥${money(fixed.inputs.reserve)}。`
              : "固定当前计划，再改变支出或收入。对比不会覆盖原来的参数。"}
          </p>
        </div>
        <button
          className="rd-secondary"
          disabled={!result || busy}
          onClick={() => setFixed(result)}
        >
          固定当前为 A
        </button>
        {fixed && (
          <button
            className="rd-secondary"
            onClick={() => setInputs(structuredClone(fixed.inputs))}
          >
            <RotateCcw size={16} />
            恢复 A 参数
          </button>
        )}
      </div>
      {result && (
        <>
          <details className="gb-methods">
            <summary>假设与计算口径</summary>
            <p>{result.assumptions}</p>
            <p>
              结余 = 收入 − 固定支出 − 弹性支出 − 一次性支出；可分配 = 结余 −
              计划储备。零收入时不计算支出收入比。
            </p>
          </details>
          {embedded ? (
            <Link
              className="rd-button"
              to={`/money-lab/budget?inputs=${encodeURIComponent(JSON.stringify(inputs))}`}
            >
              带这些数字打开完整预算工具 <ArrowUpRight size={17} />
            </Link>
          ) : (
            <>
              <SaveExperiment
                tool="budget"
                title="我的预算情景"
                payload={{ current: result, fixed }}
                detail={`本月结余 ¥${money(result.remaining)} · 储备后 ¥${money(result.available)}`}
                disabled={busy}
              />
              <Link className="rd-text-link" to="/stories/budget">
                为什么这样安排？回到预算专题 →
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
