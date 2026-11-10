/**
 * FinPilot C3: concept-level, purpose-built experiments.
 * ADDITIVE MODULE — integrate into the latest ConceptDetail; do not replace
 * its C0–C2 ETF work, quizzes, notebooks or restore logic.
 * Every calculation uses the EXISTING FastAPI deterministic model.
 */
import { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./concept-microlabs.css";
import { MicroState, useMicroValue } from "./MicroState";

type ModelResponse = Record<string, unknown> & {
  assumptions?: string;
  model_version?: string;
};
type Params = Record<string, unknown>;

type Props = {
  title: string;
  question: string;
  endpoint: string;
  baseline: Params;
  changed: Params;
  changedLabel: string;
  changedValue: string;
  fullTool: string;
  fullToolLabel: string;
  fields: { name: string; field: string; kind?: "money" | "rate" | "plain" }[];
  note: string;
};
function display(
  value: unknown,
  kind: "money" | "rate" | "plain" = "plain",
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const n = value.toLocaleString("zh-CN", {
    maximumFractionDigits: kind === "rate" ? 2 : 2,
    minimumFractionDigits: kind === "money" ? 2 : 0,
  });
  return kind === "money" ? `¥${n}` : kind === "rate" ? `${n}%` : n;
}
function Comparison({
  title,
  question,
  endpoint,
  baseline,
  changed,
  changedLabel,
  changedValue,
  fullTool,
  fullToolLabel,
  fields,
  note,
}: Props) {
  const [results, setResults] = useState<[ModelResponse, ModelResponse] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshot, setSnapshot] = useState("");
  const [prediction, setPrediction] = useMicroValue<string>("prediction", "");
  const context = useContext(MicroState);
  const invalid = Object.values(context?.errors || {}).some(Boolean);
  const [updated, setUpdated] = useState("");
  const currentSignature = JSON.stringify([baseline, changed]);
  const pending = !!results && currentSignature !== snapshot;
  const request = useRef(0);
  const latest = useRef(currentSignature);
  latest.current = currentSignature;
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function calculate() {
    const serial = ++request.current;
    setBusy(true);
    setError("");
    try {
      const data = await Promise.all([
        api<ModelResponse>(endpoint, "POST", baseline),
        api<ModelResponse>(endpoint, "POST", changed),
      ]);
      if (serial !== request.current || latest.current !== currentSignature)
        return;
      setResults(data as [ModelResponse, ModelResponse]);
      setSnapshot(currentSignature);
      setUpdated(new Date().toLocaleTimeString("zh-CN"));
    } catch (e) {
      if (serial === request.current && latest.current === currentSignature) {
        setError(e instanceof Error ? e.message : "计算失败，请重试。");
        setResults(null);
      }
    } finally {
      if (serial === request.current) setBusy(false);
    }
  }
  return (
    <section className="cm-experiment" aria-label={title}>
      <div className="cm-intro">
        <span className="cm-kicker">情景比较</span>
        <h3>{title}</h3>
        <p>{question}</p>
      </div>
      <div className="cm-experiment-controls">
        <div>
          <strong>只改变一个条件</strong>
          <p>
            {changedLabel}：<b>{changedValue}</b>
          </p>
        </div>
        <div
          className="cm-prediction"
          role="group"
          aria-label="预测主要指标的变化方向"
        >
          <span>预测「{fields[0].name}」的变化</span>
          {(
            [
              ["higher", "增加"],
              ["lower", "减少"],
              ["same", "不变"],
            ] as const
          ).map(([v, t]) => (
            <button
              key={v}
              type="button"
              aria-pressed={prediction === v}
              onClick={() => setPrediction(v)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className="cm-primary"
          type="button"
          disabled={busy || invalid}
          onClick={() => void calculate()}
        >
          {busy ? "计算中…" : results ? "重新比较" : "显示比较结果"}
        </button>
      </div>
      {error && (
        <p className="cm-error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <p className="cm-warning" role="status">
          条件已修改，尚未重新计算。请重新比较。
        </p>
      )}
      {results && !pending && (
        <div className="cm-results" aria-live="polite">
          <table>
            <caption>保持其余条件不变时的计算结果</caption>
            <thead>
              <tr>
                <th scope="col">指标</th>
                <th scope="col">原情景</th>
                <th scope="col">修改后</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.field}>
                  <th scope="row">{f.name}</th>
                  <td>{display(results[0][f.field], f.kind)}</td>
                  <td>{display(results[1][f.field], f.kind)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cm-small">
            结果更新于 {updated}（人民币）。你的预测：
            {prediction === "higher"
              ? "增加"
              : prediction === "lower"
                ? "减少"
                : prediction === "same"
                  ? "不变"
                  : "未选择"}
            。实际变化：
            {Number(results[1][fields[0].field]) >
            Number(results[0][fields[0].field])
              ? "增加"
              : Number(results[1][fields[0].field]) <
                  Number(results[0][fields[0].field])
                ? "减少"
                : "不变"}
            。其他条件相同；不以一次预测判断掌握程度。
          </p>
          <details>
            <summary>计算假设与模型版本</summary>
            <p>{results[1].assumptions || "请查看完整计算工具的方法说明。"}</p>
            <small>模型版本：{results[1].model_version || "未返回"}</small>
          </details>
        </div>
      )}
      <p className="cm-note">{note}</p>
      <Link to={fullTool} className="cm-external">
        需要输入完整方案时，使用「{fullToolLabel}」 →
      </Link>
    </section>
  );
}
function Adjust({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const ctx = useContext(MicroState);
  const error =
    !Number.isFinite(value) || value < min || value > max
      ? `请输入 ${min} 至 ${max} ${suffix}`
      : "";
  useEffect(() => {
    ctx?.validate(label, error);
    return () => ctx?.validate(label, "");
  }, [error, label]);
  return (
    <div className="cm-slider">
      <label>
        {label}（{suffix || "数值"}）
        <input
          aria-label={label}
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? NaN : Number(e.target.value))
          }
          aria-invalid={!!error}
        />
      </label>
      <input
        aria-label={label + "滑块"}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
function BudgetMicro() {
  const [extra, setExtra] = useMicroValue<number>("extra", 600);
  const base = {
    income: 2500,
    reserve: 300,
    expenses: [
      { name: "固定费用", amount: 1200, kind: "fixed" },
      { name: "日常费用", amount: 550, kind: "flexible" },
    ],
  };
  return (
    <>
      <Adjust
        label="新增维修费用"
        value={extra}
        onChange={setExtra}
        min={0}
        max={1000}
        step={50}
        suffix=" 元"
      />
      <Comparison
        title="临时支出改变了什么？"
        question="同一笔月度预算中，只增加一笔临时维修费。比较预计结余和预留目标缺口。"
        endpoint="/v3/tools/budget"
        baseline={base}
        changed={{
          ...base,
          expenses: [
            ...base.expenses,
            { name: "临时维修", amount: extra, kind: "once" },
          ],
        }}
        changedLabel="维修费用"
        changedValue={`${extra} 元`}
        fullTool="/money-lab/budget"
        fullToolLabel="个人预算"
        fields={[
          { name: "计划支出合计", field: "spent", kind: "money" },
          { name: "预计结余", field: "remaining", kind: "money" },
          { name: "距预留目标的缺口", field: "gap", kind: "money" },
        ]}
        note="单月假设预算；没有记录真实银行卡交易。"
      />
    </>
  );
}
function LoanMicro() {
  const [upfront, setUpfront] = useMicroValue<number>("upfront", 800);
  const base = {
    principal: 20000,
    rate: 6,
    months: 24,
    method: "annuity",
    upfront: 200,
    monthly_fee: 0,
  };
  return (
    <>
      <Adjust
        label="修改后的期初扣费"
        value={upfront}
        onChange={setUpfront}
        min={0}
        max={2000}
        step={100}
        suffix=" 元"
      />
      <Comparison
        title="借款面额相同，到手金额相同吗？"
        question="借款面额、利率与期限保持不变，只调整期初费用。"
        endpoint="/v3/tools/loan"
        baseline={base}
        changed={{ ...base, upfront }}
        changedLabel="期初扣费"
        changedValue={`${upfront} 元`}
        fullTool="/money-lab/loan"
        fullToolLabel="贷款成本"
        fields={[
          { name: "实际净到账", field: "net_received", kind: "money" },
          {
            name: "还款与费用合计（含期初扣费）",
            field: "total_paid",
            kind: "money",
          },
          {
            name: "模型有效年成本",
            field: "effective_annual_cost",
            kind: "rate",
          },
        ]}
        note="有效年成本是模型计算结果，不等同于特定监管口径 APR。"
      />
    </>
  );
}
function InflationMicro() {
  const [inflation, setInflation] = useMicroValue<number>("inflation", 3);
  const base = { principal: 10000, years: 3, inflation: 0, growth: 0 };
  return (
    <>
      <Adjust
        label="假设年通胀率"
        value={inflation}
        onChange={setInflation}
        min={0}
        max={15}
        step={0.5}
        suffix="%"
      />
      <Comparison
        title="名义金额不变，购买力会怎样变化？"
        question="只调整假设通胀率，比较 3 年后账户金额与折合今天的购买力。"
        endpoint="/v3/tools/inflation"
        baseline={base}
        changed={{ ...base, inflation }}
        changedLabel="假设年通胀率"
        changedValue={`${inflation}%`}
        fullTool="/money-lab/inflation"
        fullToolLabel="购买力计算"
        fields={[
          { name: "名义金额", field: "nominal", kind: "money" },
          { name: "折合今天的购买力", field: "balance", kind: "money" },
          { name: "实际年变化率", field: "real_rate", kind: "rate" },
        ]}
        note="固定通胀率为教学假设，不是价格预测；个人消费篮子可能不同。"
      />
    </>
  );
}
function CompoundMicro() {
  const [years, setYears] = useMicroValue<number>("years", 10);
  const base = {
    principal: 10000,
    rate: 4,
    years: 5,
    frequency: 12,
    basis: "effective",
  };
  return (
    <>
      <Adjust
        label="对照期限"
        value={years}
        onChange={setYears}
        min={5}
        max={30}
        step={1}
        suffix=" 年"
      />
      <Comparison
        title="本金相同，期限改变会怎样？"
        question="使用同一假设的年有效收益率，仅改变投入年数。"
        endpoint="/v3/tools/compound"
        baseline={base}
        changed={{ ...base, years }}
        changedLabel="第二个方案的期限"
        changedValue={`${years} 年`}
        fullTool="/money-lab/compound"
        fullToolLabel="复利计算"
        fields={[
          { name: "期末金额", field: "balance", kind: "money" },
          { name: "累计净变化", field: "interest", kind: "money" },
          { name: "年有效收益率", field: "effective_rate", kind: "rate" },
        ]}
        note="一次性投入，固定假设收益率；不含追加投入、税费或现实投资波动。"
      />
    </>
  );
}
function BondMicro() {
  const [yieldRate, setYieldRate] = useMicroValue<number>("yieldRate", 4.5);
  const base = { face: 1000, coupon: 3, years: 5, yield_rate: 3 };
  return (
    <>
      <Adjust
        label="市场要求收益率"
        value={yieldRate}
        onChange={setYieldRate}
        min={0}
        max={10}
        step={0.5}
        suffix="%"
      />
      <Comparison
        title="同一张债券，要求收益率变了会怎样？"
        question="票息、面额、到期日保持不变，只改变用于折现的市场要求收益率。"
        endpoint="/v3/experiments/bond"
        baseline={base}
        changed={{ ...base, yield_rate: yieldRate }}
        changedLabel="用于折现的收益率"
        changedValue={`${yieldRate}%`}
        fullTool="/stories/bonds#experiment"
        fullToolLabel="债券定价专题"
        fields={[{ name: "模型价格", field: "price", kind: "money" }]}
        note="此处为年付固定票息、无违约的假设模型；不直接使用政策利率作为定价输入。"
      />
    </>
  );
}
function FeesMicro() {
  const [fee, setFee] = useMicroValue<number>("fee", 0.5);
  const base = {
    principal: 10000,
    rate: 5,
    years: 20,
    frequency: 12,
    basis: "effective",
  };
  return (
    <>
      <Adjust
        label="简化的年费率假设"
        value={fee}
        onChange={setFee}
        min={0}
        max={2}
        step={0.1}
        suffix="%"
      />
      <Comparison
        title="长期费用会改变终值多少？"
        question="为了单独观察费用的累积影响，假设费用使年有效净变化率从 5% 降至 5% 减去费率。"
        endpoint="/v3/tools/compound"
        baseline={base}
        changed={{ ...base, rate: 5 - fee }}
        changedLabel="用于复利模型的年有效净变化率"
        changedValue={`${(5 - fee).toFixed(1)}%`}
        fullTool="/money-lab/compound"
        fullToolLabel="复利计算"
        fields={[
          { name: "期末金额", field: "balance", kind: "money" },
          { name: "累计净变化", field: "interest", kind: "money" },
        ]}
        note="这是用于学习的简化近似，不代表真实基金按日计提费用的计算规则，也不预测投资回报。"
      />
    </>
  );
}

type CashEvent = { day: number; label: string; amount: number };
function simulateCashflow(day: number) {
  const ordered: CashEvent[] = [
    { day, label: "假设收入到账", amount: 2000 },
    { day: 5, label: "房租与必要支出", amount: -1600 },
    { day: 25, label: "其他生活支出", amount: -300 },
  ].sort((a, b) => a.day - b.day || b.amount - a.amount);
  let balance = 300,
    minimum = balance;
  const timeline = ordered.map((e) => {
    balance += e.amount;
    minimum = Math.min(minimum, balance);
    return { ...e, balance };
  });
  return { timeline, final: balance, minimum, gap: Math.max(0, -minimum) };
}
function CashflowMicro() {
  const [arrivalDay, setArrivalDay] = useMicroValue<number>("arrivalDay", 20);
  const base = simulateCashflow(1),
    changed = simulateCashflow(Number.isFinite(arrivalDay) ? arrivalDay : 20);
  return (
    <section className="cm-experiment" aria-label="现金流时间线">
      <span className="cm-kicker">时间顺序</span>
      <h3>月末余额相同，月中可能仍然缺钱</h3>
      <p>
        初始余额 300 元，收入 2,000 元，房租及必要支出 1,600 元，其他生活支出
        300 元。只改变收入到账日期。
      </p>
      <Adjust
        label="收入到账日"
        value={arrivalDay}
        onChange={setArrivalDay}
        min={1}
        max={30}
        step={1}
        suffix=" 日"
      />
      {Number.isFinite(arrivalDay) && arrivalDay >= 1 && arrivalDay <= 30 && (
        <>
          <div className="cm-results">
            <table>
              <caption>按日期计算的余额（假设同日收入先于支出到账）</caption>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>资金事件</th>
                  <th>事后余额</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>期初</td>
                  <td>起始现金</td>
                  <td>¥300.00</td>
                </tr>
                {changed.timeline.map((e, i) => (
                  <tr key={i}>
                    <td>第 {e.day} 天</td>
                    <td>
                      {e.label} {e.amount >= 0 ? "+" : ""}
                      {e.amount} 元
                    </td>
                    <td>¥{e.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cm-cash-summary">
            <p>
              月末余额：<strong>¥{changed.final.toFixed(2)}</strong>（与第 1
              天到账情景相同）
            </p>
            <p>
              月内最低余额：<strong>¥{changed.minimum.toFixed(2)}</strong>
            </p>
            <p>
              临时资金缺口：<strong>¥{changed.gap.toFixed(2)}</strong>
            </p>
          </div>
        </>
      )}
      <p className="cm-note">
        教学假设不考虑授信、透支利息和账单宽限期；提前到账情景的临时资金缺口为 ¥
        {base.gap.toFixed(2)}。这里计算的是收支顺序，不是银行账户的实时流水。
      </p>
      <Link className="cm-external" to="/money-lab/budget">
        需要做完整月度预算，使用「个人预算」 →
      </Link>
    </section>
  );
}
/**
 * Pass the actual concept ID. ETF 7 is purposely omitted because C2 owns it.
 * Concepts not listed here may keep the existing Risk/Behavior micro-experiments
 * or have no interactive component. Never automatically embed a full Money Lab.
 */
export function ConceptMicroLab({ conceptId }: { conceptId: number }) {
  if (conceptId === 17) return <BudgetMicro />;
  if (conceptId === 25) return <CashflowMicro />;
  if (conceptId === 27) return <LoanMicro />;
  if ([1, 2, 32].includes(conceptId)) return <InflationMicro />;
  if (conceptId === 3) return <CompoundMicro />;
  if (conceptId === 28) return <FeesMicro />;
  if ([6, 9, 33, 34].includes(conceptId)) return <BondMicro />;
  return null;
}
