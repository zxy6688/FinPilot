import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FinArt } from "./Fin";
import { money, useNotebook } from "./state";
import { SaveExperiment, useCalculation } from "./Experiments";

import { readDraft, numericDisplay } from "./drafts";
export type TimeInputs = {
  principal: number;
  rate?: number;
  years: number;
  frequency?: number;
  basis?: string;
  inflation?: number;
  growth?: number;
};
export type TimeResult = {
  model_version: string;
  inputs: TimeInputs;
  balance: number;
  nominal?: number;
  interest?: number;
  effective_rate?: number;
  real_rate?: number;
  points: { x: number; value: number; reference: number }[];
  assumptions: string;
};
export const timeDefaults: Record<string, TimeInputs> = {
  compound: {
    principal: 10000,
    rate: 4,
    years: 10,
    frequency: 12,
    basis: "effective",
  },
  inflation: { principal: 10000, inflation: 3, growth: 0, years: 3 },
};

export function TrendChart({
  result,
  fixed,
  tool,
}: {
  result: TimeResult;
  fixed?: TimeResult | null;
  tool: string;
}) {
  const points = [...result.points, ...(fixed?.points || [])];
  const maxX = Math.max(...points.map((x) => x.x), 1),
    max = Math.max(1, ...points.flatMap((p) => [p.value, p.reference])) * 1.08;
  const [cursor, setCursor] = useState<number | null>(null);
  const active =
    result.points[cursor ?? result.points.length - 1] || result.points.at(-1)!;
  const path = (ps: TimeResult["points"], key: "value" | "reference") =>
    ps
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${65 + (p.x / maxX) * 525},${230 - (p[key] / max) * 190}`,
      )
      .join(" ");
  return (
    <div className="gb-trend">
      <svg
        viewBox="0 0 640 280"
        role="img"
        aria-label={
          tool === "inflation"
            ? "名义金额与实际购买力随时间变化图"
            : "本金与复利金额随时间变化图"
        }
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="65"
              x2="590"
              y1={230 - t * 190}
              y2={230 - t * 190}
              stroke="#d7e5da"
              strokeDasharray="3 5"
            />
            <text
              x="57"
              y={235 - t * 190}
              textAnchor="end"
              fontSize="12"
              fill="#567268"
            >
              {Math.round(max * t).toLocaleString()}
            </text>
          </g>
        ))}
        <path
          d={path(result.points, "reference")}
          fill="none"
          stroke="#d6ab4f"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <path
          d={path(result.points, "value")}
          fill="none"
          stroke="#267b78"
          strokeWidth="3"
        />
        {fixed && (
          <path
            d={path(fixed.points, "value")}
            fill="none"
            stroke="#d9907e"
            strokeWidth="2"
          />
        )}
        <circle
          cx={65 + (active.x / maxX) * 525}
          cy={230 - (active.value / max) * 190}
          r="5"
          fill="#267b78"
        />
        <text x="65" y="263" fill="#567268" fontSize="13">
          今天
        </text>
        <text x="590" y="263" fill="#567268" fontSize="13" textAnchor="end">
          {maxX} 年
        </text>
      </svg>
      <div className="gb-chart-key">
        <span>青绿：{tool === "inflation" ? "实际购买力" : "复利金额"}</span>
        <span>虚线：{tool === "inflation" ? "名义金额" : "最初本金"}</span>
        {fixed && <span>珊瑚：固定 A</span>}
      </div>
      <label className="gb-chart-cursor">
        查看第 {active.x} 年 · ¥{money(active.value)}
        <input
          aria-label="查看年份"
          type="range"
          min="0"
          max={Math.max(0, result.points.length - 1)}
          value={cursor ?? result.points.length - 1}
          onChange={(e) => setCursor(+e.target.value)}
        />
      </label>
    </div>
  );
}

export function TimeWorkbench({
  tool,
  embedded = false,
  onResult,
}: {
  tool: "compound" | "inflation";
  embedded?: boolean;
  onResult?: (r: TimeResult) => void;
}) {
  const [params] = useSearchParams(),
    n = useNotebook();
  const [inputs, setInputs] = useState<TimeInputs>(() =>
    readDraft(
      params.get("inputs") || sessionStorage.getItem(`${tool}-draft`),
      timeDefaults[tool],
    ),
  );
  const { result, busy, error } = useCalculation<TimeResult>(tool, inputs),
    [fixed, setFixed] = useState<TimeResult | null>(null),
    [historical, setHistorical] = useState<TimeResult | null>(null);
  const restored = useRef("");
  useEffect(() => {
    sessionStorage.setItem(`${tool}-draft`, JSON.stringify(inputs));
  }, [inputs, tool]);
  useEffect(() => {
    if (result) {
      onResult?.(result);
      sessionStorage.setItem(`${tool}-result`, JSON.stringify(result));
    }
  }, [result]);
  useEffect(() => {
    const id = params.get("receipt");
    if (!id || id === restored.current) return;
    const p = n.entries.find((e) => e.id === id)?.payload as
      | { experiment: { current: TimeResult; fixed: TimeResult | null } }
      | undefined;
    if (p?.experiment?.current) {
      setInputs(p.experiment.current.inputs);
      setFixed(p.experiment.fixed);
      setHistorical(p.experiment.current);
      restored.current = id;
    }
  }, [params, n.entries]);
  const title = tool === "compound" ? "复利与时间价值" : "通胀与购买力";
  const update = (key: keyof TimeInputs, value: number | string) =>
    setInputs((p) => ({ ...p, [key]: value }));
  const field = (
    key: keyof TimeInputs,
    label: string,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={numericDisplay(inputs[key])}
        onChange={(e) =>
          update(key, e.target.value === "" ? NaN : +e.target.value)
        }
      />
      <input
        aria-label={label + "滑块"}
        type="range"
        min={min}
        max={Math.min(max, key === "principal" ? 100000 : max)}
        step={step}
        value={Number(inputs[key]) || 0}
        onChange={(e) => update(key, +e.target.value)}
      />
    </label>
  );
  return (
    <div className={embedded ? "gb-embedded" : "rd-page gb-tool-page"}>
      {!embedded && (
        <>
          <div className="rd-breadcrumb">
            <Link to="/money-lab">财务工具</Link> / {title}
          </div>
          <header className="gb-tool-heading">
            <div>
              <span className="rd-kicker">Money Lab · 时间里的两种数字</span>
              <h1>
                {tool === "compound"
                  ? "给时间，一个看得见的形状。"
                  : "钱的数字，和钱的分量。"}
              </h1>
              <p>
                {tool === "compound"
                  ? "改变时间和利率口径，分清投入本金与假设增长。"
                  : "让账户金额与今天能买到的东西，出现在同一张图上。"}
              </p>
            </div>
            <FinArt action="tilt" size={108} />
          </header>
        </>
      )}
      {historical && (
        <div role="status" className="rd-notice">
          已恢复原参数与 A/B。历史结果 ¥{money(historical.balance)}（
          {historical.model_version}）；当前结果独立重算，不覆盖历史。
        </div>
      )}
      <div className="gb-workbench">
        <div className="gb-controls">
          <span className="rd-kicker">
            {fixed ? "当前情景 B" : "教学假设 · 不是收益预测"}
          </span>
          <h2>{title}</h2>
          <div className="gb-time-fields">
            {field("principal", "初始金额（元）", 0, 10000000, 100)}
            {field("years", "时间（年）", 0, 60)}
            {tool === "compound" ? (
              <>
                {field("rate", "假设年利率（%）", -50, 30, 0.1)}
                <label>
                  利率口径
                  <select
                    value={inputs.basis}
                    onChange={(e) => update("basis", e.target.value)}
                  >
                    <option value="effective">年有效收益率</option>
                    <option value="nominal">年名义利率</option>
                  </select>
                </label>
                <label>
                  每年计息次数
                  <select
                    disabled={inputs.basis === "effective"}
                    value={inputs.frequency}
                    onChange={(e) => update("frequency", +e.target.value)}
                  >
                    {[1, 2, 4, 12].map((v) => (
                      <option key={v} value={v}>
                        {v} 次
                      </option>
                    ))}
                  </select>
                </label>
                <p className="gb-help">
                  {inputs.basis === "effective"
                    ? "年有效收益率已经包含年内复利，不能再除以 12 重复计息。"
                    : "年名义利率按频次拆分；实际全年增长率见右侧。"}
                </p>
              </>
            ) : (
              <>
                {field("inflation", "假设年通胀率（%）", -20, 30, 0.1)}
                {field("growth", "金额年有效增长率（%）", -50, 30, 0.1)}
                <p className="gb-help">
                  名义增长指账户金额的增长；实际收益扣除物价变化。负通胀是教学通缩情景。
                </p>
              </>
            )}
          </div>
        </div>
        <div className="gb-results" aria-busy={busy}>
          <span className="rd-kicker">
            {busy
              ? "正在计算…"
              : `${inputs.years} 年后 · ${fixed ? "情景 B" : "当前情景"}`}
          </span>
          <h2>{tool === "inflation" ? "折合今天的购买力" : "复利后的金额"}</h2>
          <strong className="gb-big-number">
            {result ? "¥ " + money(result.balance) : "—"}
          </strong>
          {error && <p role="alert">{error} 请检查空值与输入范围。</p>}
          {result && (
            <>
              <div className="gb-result-strip">
                <div>
                  <span>
                    {tool === "inflation" ? "名义金额" : "假设利息 / 损失"}
                  </span>
                  <b>¥{money(result.nominal ?? result.interest ?? 0)}</b>
                </div>
                <div>
                  <span>
                    {tool === "inflation" ? "实际年收益率" : "有效年收益率"}
                  </span>
                  <b>
                    {(result.real_rate ?? result.effective_rate ?? 0).toFixed(
                      3,
                    )}
                    %
                  </b>
                </div>
              </div>
              <TrendChart result={result} fixed={fixed} tool={tool} />
              <div className="gb-insight">
                {tool === "inflation"
                  ? "物价增长快于账户金额时，数字变多仍可能买得更少。实际收益率使用相除，不能简单当成两个利率相减。"
                  : "时间放大的是假设增长，也可能放大持续损失。曲线是固定参数的推演，不是市场会沿着它前进。"}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="gb-comparison">
        <div>
          <h3>{fixed ? "比较同一问题的两个情景" : "固定 A，再改一个条件"}</h3>
          <p>
            {fixed && result
              ? `A：初始 ¥${money(fixed.inputs.principal)}、${fixed.inputs.years} 年、${tool === "compound" ? "利率 " + fixed.inputs.rate + "%（" + (fixed.inputs.basis === "effective" ? "年有效" : "年名义") + "）" : "通胀 " + fixed.inputs.inflation + "%、名义增长 " + fixed.inputs.growth + "%"}；当前期末金额比 A 变化 ¥${money(result.balance - fixed.balance)}。`
              : "保留现在的结果，比较不同年限、利率或通胀假设。"}
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
            onClick={() => setInputs({ ...fixed.inputs })}
          >
            恢复 A 参数
          </button>
        )}
      </div>
      {result && (
        <>
          <details className="gb-methods">
            <summary>公式、假设与局限</summary>
            <p>{result.assumptions}</p>
            <p>
              {tool === "inflation"
                ? "未来名义金额 = 初始金额 × (1+名义增长率)^年数；实际购买力 = 未来名义金额 ÷ (1+通胀率)^年数。"
                : "年有效口径：PV × (1+r)^t。年名义口径：PV × (1+r/m)^(m×t)，m 为每年计息次数。"}
            </p>
          </details>
          {embedded ? (
            <Link
              className="rd-button"
              to={`/money-lab/${tool}?inputs=${encodeURIComponent(JSON.stringify(inputs))}`}
            >
              带这些参数打开完整工具 →
            </Link>
          ) : (
            <>
              <SaveExperiment
                tool={tool}
                title={title + "实验"}
                detail={`${inputs.years} 年 · ¥${money(result.balance)}`}
                payload={{ current: result, fixed }}
                disabled={busy}
              />
              <Link
                className="rd-text-link"
                to="/decoder/purchasing-power#experiment"
              >
                回到购买力专题的实验处 →
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
