import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  Bookmark,
  RotateCcw,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { api } from "../services/api";
import { money, useNotebook } from "./state";
import { numericDisplay } from "./drafts";
import { snapshotId } from "./Experiments";
import { FinArt } from "./Fin";
export type Inputs = {
  principal: number;
  monthly: number;
  months: number;
  rate: number;
  target: number;
  timing: "begin" | "end";
  basis?: "nominal" | "effective";
};
export type Result = {
  model_version: string;
  inputs: Inputs;
  balance: number;
  contributions: number;
  interest: number;
  required_monthly: number;
  gap: number;
  reached_month: number | null;
  points: { month: number; balance: number; contributions: number }[];
  assumptions: string;
};
export const defaults: Inputs = {
  principal: 2000,
  monthly: 500,
  months: 24,
  rate: 2,
  target: 15000,
  timing: "end",
};
export function useSavings(input: Inputs) {
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  const seq = useRef(0);
  useEffect(() => {
    const n = ++seq.current;
    setBusy(true);
    setError("");
    const t = setTimeout(() => {
      api<Result>("/v3/tools/savings", "POST", input)
        .then((r) => {
          if (n === seq.current) setResult(r);
        })
        .catch((e) => {
          if (n === seq.current) {
            setResult(null);
            setError(e.message);
          }
        })
        .finally(() => {
          if (n === seq.current) setBusy(false);
        });
    }, 160);
    return () => {
      clearTimeout(t);
      seq.current++;
    };
  }, [JSON.stringify(input)]);
  return { result, error, busy };
}
export function GrowthChart({
  result,
  other,
}: {
  result: Result;
  other?: Result | null;
}) {
  const max =
    Math.max(result.balance, result.contributions, other?.balance || 0, 1) *
    1.08;
  const horizon = Math.max(result.inputs.months, other?.inputs.months || 0);
  const endX = 55 + (result.inputs.months / horizon) * 570;
  const line = (data: Result["points"], field: "balance" | "contributions") =>
    data
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${55 + (p.month / horizon) * 570},${244 - (p[field] / max) * 204}`,
      )
      .join(" ");
  const path = line(result.points, "balance");
  return (
    <div className="rd-growth">
      <svg
        viewBox="0 0 660 285"
        role="img"
        aria-label={`储蓄增长图：第 ${result.inputs.months} 个月预计 ${money(result.balance)} 元；本金 ${money(result.contributions)} 元`}
      >
        <defs>
          <linearGradient id="rd-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#7fc4b2" stopOpacity=".35" />
            <stop offset="1" stopColor="#7fc4b2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="55"
              y1={244 - f * 204}
              x2="625"
              y2={244 - f * 204}
              stroke="#dce7df"
              strokeDasharray="3 6"
            />
            <text x="48" y={249 - f * 204} textAnchor="end">
              {Math.round(max * f).toLocaleString()}
            </text>
          </g>
        ))}
        <path d={path + `L${endX} 244H55Z`} fill="url(#rd-area)" />
        <path
          d={line(result.points, "contributions")}
          fill="none"
          stroke="#b39656"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        {other && (
          <path
            d={line(other.points, "balance")}
            fill="none"
            stroke="#c08069"
            strokeWidth="3"
            strokeDasharray="8 5"
          />
        )}
        <path
          className="rd-chart-line"
          d={path}
          fill="none"
          stroke="#267B78"
          strokeWidth="3.5"
        />
        <circle
          cx={endX}
          cy={244 - (result.balance / max) * 204}
          r="5"
          fill="#267B78"
        />
        <text x="55" y="270">
          现在
        </text>
        <text x="340" y="270" textAnchor="middle">
          第 {Math.round(horizon / 2)} 个月
        </text>
        <text x="625" y="270" textAnchor="end">
          第 {horizon} 个月
        </text>
      </svg>
      <div className="rd-legend">
        <span>
          <i />
          当前方案
        </span>
        <span>
          <i className="gold" />
          累计投入
        </span>
        {other && (
          <span>
            <i className="coral" />
            对比方案
          </span>
        )}
      </div>
    </div>
  );
}
export function MiniLab() {
  const [monthly, setMonthly] = useState(500);
  const { result, busy, error } = useSavings({ ...defaults, monthly });
  return (
    <div className="rd-mini">
      <div>
        <span className="rd-kicker">手边的小实验</span>
        <h2>
          每月少花一点，
          <br />
          两年后多一份底气。
        </h2>
        <p>从每月的咖啡钱开始，试试时间的力量。</p>
        <label htmlFor="mini-monthly">
          每月存入 <b>¥ {monthly}</b>
        </label>
        <input
          id="mini-monthly"
          type="range"
          min="0"
          max="2000"
          step="100"
          value={monthly}
          onChange={(e) => setMonthly(+e.target.value)}
        />
        <small>初始 ¥2,000 · 24 个月 · 假设年名义收益率 2% · 月末存入</small>
        <Link
          className="rd-text-link"
          to={"/money-lab/savings?monthly=" + monthly}
        >
          调整全部参数 <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="rd-mini-result" aria-busy={busy}>
        <span>预计期末金额 · 后端实时计算</span>
        <strong>
          {error
            ? "暂不可用"
            : busy
              ? "计算中…"
              : "¥ " + money(result?.balance || 0)}
        </strong>
        {result && <GrowthChart result={result} />}
        <small>假设不变时的计算结果，不是收益承诺。</small>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  );
}
export default function MoneyLab() {
  const [params] = useSearchParams();
  const notebook = useNotebook();
  const [input, setInput] = useState<Inputs>(() => ({
    ...defaults,
    monthly: Number(params.get("monthly") || 500),
  }));
  useEffect(() => {
    sessionStorage.setItem("savings-draft", JSON.stringify(input));
  }, [input]);
  const { result, error, busy } = useSavings(input);
  const [compare, setCompare] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState("");
  const restoreOnce = useRef("");
  useEffect(() => {
    const id = params.get("receipt");
    if (id && restoreOnce.current !== id) {
      const entry = notebook.entries.find((e) => e.id === id);
      if (entry?.payload) {
        const raw = entry.payload as Result & {
          current?: Result;
          fixed?: Result;
        };
        const r = raw.current || raw;
        setCompare(raw.fixed || null);
        setInput(r.inputs);
        setRestored(
          r.model_version === "savings-monthly-v1"
            ? "已恢复这张小票的全部参数，正在重新计算。"
            : "历史公式版本不同：按当前版本重算，请核对差异。",
        );
        restoreOnce.current = id;
      }
    }
  }, [params, notebook.entries]);
  function update(k: keyof Inputs, v: number | string) {
    setInput((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }
  function updateFromCompare() {
    if (compare) {
      setInput({ ...compare.inputs });
      setSaved(false);
    }
  }
  async function save() {
    if (!result || busy) return;
    const id = await snapshotId("savings", { current: result, fixed: compare });
    if (
      await notebook.save({
        id,
        kind: "receipt",
        title: "我的储蓄计划",
        url: "/money-lab/savings?receipt=" + id,
        detail: `${input.months} 个月 · 每月 ¥${input.monthly} → ¥${money(result.balance)}`,
        payload: { current: result, fixed: compare },
      })
    ) {
      setSaved(true);
    }
  }
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/">首页</Link> / 财务工具 / 储蓄规划
      </div>
      <div className="rd-heading rd-heading-row">
        <div>
          <span className="rd-kicker">Money Lab · 把生活里的数字算清楚</span>
          <h1>
            给一个小目标，
            <br className="rd-mobile-only" />
            算一条可走的路。
          </h1>
          <p>调整金额与时间，比一比两种方案。看清假设，再决定自己的下一步。</p>
        </div>
        <FinArt action={saved ? "receipt" : "tilt"} size={108} />
      </div>
      <div className="rd-tool-tabs">
        <span className="selected">储蓄规划</span>
        <Link to="/money-lab/compound">复利与时间 ↗</Link>
        <Link to="/money-lab/inflation">通胀购买力 ↗</Link>
        <Link to="/money-lab/loan">贷款实际成本</Link>
        <Link to="/money-lab/budget">个人预算</Link>
      </div>
      {restored && (
        <p className="rd-notice" role="status">
          {restored}
        </p>
      )}
      <div className="rd-calculator">
        <section className="rd-input-panel">
          <div className="rd-row">
            <h2>
              <SlidersHorizontal size={19} /> 我的计划
            </h2>
            <button
              className="rd-icon"
              title="恢复默认参数"
              aria-label="恢复默认参数"
              onClick={() => {
                setInput(defaults);
                setCompare(null);
                setSaved(false);
              }}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          {(
            [
              ["principal", "现在已有", "元", 0, 10000000, 100],
              ["monthly", "每月再存", "元", 0, 100000, 100],
              ["months", "坚持多久", "个月", 1, 600, 1],
              ["rate", "假设年利率", "%", 0, 30, 0.1],
              ["target", "目标金额", "元", 1, 100000000, 100],
            ] as const
          ).map(([key, label, unit, min, max, step]) => (
            <label className="rd-field" key={key}>
              <span>{label}</span>
              <div>
                <input
                  type="number"
                  aria-label={label}
                  min={min}
                  max={max}
                  step={step}
                  value={numericDisplay(input[key])}
                  onChange={(e) =>
                    update(
                      key,
                      e.target.value === "" ? NaN : Number(e.target.value),
                    )
                  }
                />
                <span>{unit}</span>
              </div>
            </label>
          ))}
          <label className="rd-field">
            <span>利率口径</span>
            <select
              value={input.basis || "nominal"}
              onChange={(e) => update("basis", e.target.value)}
              aria-label="利率口径"
            >
              <option value="nominal">年名义利率（除以 12）</option>
              <option value="effective">年有效收益率（等效月利率）</option>
            </select>
          </label>
          <label className="rd-field">
            <span>存入时间</span>
            <select
              value={input.timing}
              onChange={(e) => update("timing", e.target.value)}
              aria-label="存入时间"
            >
              <option value="end">每月月末</option>
              <option value="begin">每月月初</option>
            </select>
          </label>
          <small>利率只是教学假设。这里不计税费，也不匹配具体金融产品。</small>
        </section>
        <section className="rd-output-panel" aria-busy={busy}>
          <div className="rd-row">
            <span className="rd-kicker">预计期末金额</span>
            <span className="rd-status">
              {busy ? "正在计算" : "确定性公式 · 后端计算"}
            </span>
          </div>
          <div className="rd-result-number" aria-live="polite">
            {busy
              ? "计算中…"
              : error
                ? "请检查输入"
                : "¥ " + money(result?.balance || 0)}
          </div>
          {error && (
            <p className="rd-error" role="alert">
              {error}
            </p>
          )}
          {result && (
            <>
              <div className="rd-result-breakdown">
                <span>
                  累计投入 <b>¥ {money(result.contributions)}</b>
                </span>
                <span>
                  假设收益 <b>¥ {money(result.interest)}</b>
                </span>
              </div>
              <div className="a1-goal-meter">
                <div>
                  <span>目标覆盖 · ¥{money(result.inputs.target)}</span>
                  <b>
                    {((result.balance / result.inputs.target) * 100).toFixed(1)}
                    %
                  </b>
                </div>
                <progress
                  aria-label="计算结果占储蓄目标的比例"
                  value={Math.min(result.balance, result.inputs.target)}
                  max={result.inputs.target}
                />
                <small>
                  按当前假设计算；超过目标时进度条封顶，百分比保留实际值。
                </small>
              </div>
              <GrowthChart result={result} other={compare} />
              {compare && (
                <div className="a1-scenario-cards">
                  <div>
                    <span>B / 当前方案</span>
                    <b>¥ {money(result.balance)}</b>
                    <small>
                      {result.inputs.months} 个月 · 每月 ¥
                      {result.inputs.monthly}
                    </small>
                  </div>
                  <div>
                    <span>A / 已固定方案</span>
                    <b>¥ {money(compare.balance)}</b>
                    <small>
                      {compare.inputs.months} 个月 · 每月 ¥
                      {compare.inputs.monthly}
                    </small>
                  </div>
                </div>
              )}
              <div className="rd-target">
                <span>
                  {result.gap === 0 ? <Check size={21} /> : <span>↗</span>}
                </span>
                <div>
                  <b>
                    {result.gap === 0
                      ? `在第 ${result.reached_month} 个月达到目标`
                      : `距离目标还差 ¥${money(result.gap)}`}
                  </b>
                  <p>
                    同样的期限与利率，达到目标需每月存入约{" "}
                    <strong>¥ {money(result.required_monthly)}</strong>。
                  </p>
                </div>
              </div>
            </>
          )}
          <div className="rd-actions">
            {compare && (
              <button
                className="rd-secondary"
                onClick={() => updateFromCompare()}
              >
                恢复 A 参数
              </button>
            )}
            <button
              disabled={busy || !result || !!error}
              onClick={() => {
                setCompare(result);
                setSaved(false);
              }}
              className="rd-secondary"
            >
              <Plus size={16} /> 固定当前为 A
            </button>
            <button
              disabled={busy || !result || !!error || notebook.loading || saved}
              onClick={save}
              className="rd-button"
            >
              <Bookmark size={16} />
              {saved ? "已收进发现手册" : "保存 Money Receipt"}
            </button>
          </div>
          {saved && (
            <p className="rd-success" role="status">
              这张真实计算小票已收好。
              <Link to="/profile">去发现手册查看 →</Link>
            </p>
          )}
          {notebook.error && <p role="alert">{notebook.error}</p>}
          <small>
            保存范围：{notebook.scope}
            。保留参数、结果、A/B、公式版本与时间。
          </small>
        </section>
      </div>
      {compare && result && (
        <section className="rd-compare-result">
          <div className="rd-row">
            <h2>换一个变量，看看差别。</h2>
            <button className="rd-text" onClick={() => setCompare(null)}>
              取消对比
            </button>
          </div>
          <p>已固定方案 A。继续调整左侧参数，当前方案 B 会实时更新。</p>
          <div className="rd-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>方案</th>
                  <th>月存 / 期限</th>
                  <th>利率 / 时点</th>
                  <th>期末金额</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [result, "B · 当前"],
                  [compare, "A · 已固定"],
                ].map(([r, label]) => {
                  const v = r as Result;
                  return (
                    <tr key={String(label)}>
                      <th>{String(label)}</th>
                      <td>
                        ¥{v.inputs.monthly} / {v.inputs.months} 月
                      </td>
                      <td>
                        {v.inputs.rate}% /{" "}
                        {v.inputs.timing === "end" ? "月末" : "月初"}
                      </td>
                      <td>¥{money(v.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p>
            期末相差 <b>¥ {money(result.balance - compare.balance)}</b>
            。期限不同时不是同等条件比较；本金增加也不等于收益增加。
          </p>
        </section>
      )}
      <details className="rd-method">
        <summary>怎么算出来的？公式、现金流与逐月明细</summary>
        <p>
          r = 年名义收益率 ÷ 12；n = 月数。月末存入：FV = P(1+r)ⁿ + M × ((1+r)ⁿ
          − 1) / r。月初存入时，月存部分再乘 (1+r)。r=0 时为 P+Mn。
        </p>
        <p>
          每月保留高精度计算，展示四舍五入到分。反推月存向上取到分，避免舍入后未达标。不含税费及负收益情景。公式版本：savings-monthly-v1。
        </p>
        <a
          href="https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator"
          target="_blank"
          rel="noreferrer"
        >
          参考：Investor.gov 复利计算的参数说明 ↗
        </a>
        {result && (
          <div className="rd-table-scroll rd-month-table">
            <table>
              <thead>
                <tr>
                  <th>月数</th>
                  <th>累计投入</th>
                  <th>期末余额</th>
                </tr>
              </thead>
              <tbody>
                {result.points.map((p) => (
                  <tr key={p.month}>
                    <td>{p.month}</td>
                    <td>{money(p.contributions)}</td>
                    <td>{money(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}
