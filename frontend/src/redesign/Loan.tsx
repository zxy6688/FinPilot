import { useStoryInputs } from "./StoryInputs";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SaveExperiment, useCalculation } from "./Experiments";
import { money, useNotebook } from "./state";
import { FinArt } from "./Fin";
import { CheckUnderstanding, StorySave } from "./Stories";
import { readDraft, numericDisplay } from "./drafts";
type LoanInputs = {
  principal: number;
  rate: number;
  months: number;
  method: "annuity" | "principal";
  upfront: number;
  monthly_fee: number;
};
type LoanResult = {
  model_version: string;
  inputs: LoanInputs;
  net_received: number;
  total_interest: number;
  total_fees: number;
  total_cost: number;
  total_paid: number;
  effective_annual_cost: number;
  first_payment: number;
  last_payment: number;
  schedule: {
    month: number;
    principal: number;
    interest: number;
    fee: number;
    payment: number;
    balance: number;
  }[];
  assumptions: string;
};
const defaults: LoanInputs = {
  principal: 20000,
  rate: 6,
  months: 24,
  method: "annuity",
  upfront: 200,
  monthly_fee: 0,
};
export function LoanWorkbench({ embedded = false }: { embedded?: boolean }) {
  const [params] = useSearchParams(),
    n = useNotebook();
  const [inputs, setInputs] = useState<LoanInputs>(() =>
    readDraft(
      params.get("inputs") || sessionStorage.getItem("loan-draft"),
      defaults,
    ),
  );
  const { result, busy, error } = useCalculation<LoanResult>("loan", inputs),
    [fixed, setFixed] = useState<LoanResult | null>(null),
    [historical, setHistorical] = useState<LoanResult | null>(null),
    [month, setMonth] = useState(1);
  const once = useRef("");
  useEffect(() => {
    sessionStorage.setItem("loan-draft", JSON.stringify(inputs));
  }, [inputs]);
  useEffect(() => {
    const id = params.get("receipt");
    if (!id || once.current === id) return;
    const p = n.entries.find((e) => e.id === id)?.payload as
      | { experiment: { current: LoanResult; fixed: LoanResult | null } }
      | undefined;
    if (p?.experiment?.current) {
      setInputs(p.experiment.current.inputs);
      setFixed(p.experiment.fixed);
      setHistorical(p.experiment.current);
      once.current = id;
    }
  }, [params, n.entries]);
  useStoryInputs(setInputs);
  const period = result?.schedule[Math.min(month, inputs.months) - 1];
  return (
    <div className={embedded ? "gb-embedded" : "rd-page gb-tool-page"}>
      {!embedded && (
        <>
          <div className="rd-breadcrumb">
            <Link to="/money-lab">财务工具</Link> / 贷款实际成本
          </div>
          <header className="gb-tool-heading">
            <div>
              <span className="rd-kicker">
                Money Lab / 04 · 每一笔现金流都算数
              </span>
              <h1>借到的钱，和要还的钱。</h1>
              <p>把费用、时间与还款方式摆到一起，再比较两份计划。</p>
            </div>
            <FinArt action="card" size={110} />
          </header>
        </>
      )}
      {historical && (
        <p className="rd-notice" role="status">
          已恢复原参数与比较情景。历史总成本 ¥{money(historical.total_cost)}（
          {historical.model_version}），下方独立重算。
        </p>
      )}
      <div className="gb-workbench">
        <div className="gb-controls">
          <span className="rd-kicker">明确假设 · 不推荐借贷产品</span>
          <h2>先把费用写全</h2>
          <div className="gb-time-fields">
            {(
              [
                ["principal", "借款面额（元）", 100, 10000000, 100],
                ["rate", "年名义利率（%）", 0, 60, 0.1],
                ["months", "还款期数（月）", 1, 600, 1],
                ["upfront", "期初扣除费用（元）", 0, 10000000, 10],
                ["monthly_fee", "每月另付费用（元）", 0, 100000, 1],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={numericDisplay(inputs[key])}
                  onChange={(e) =>
                    setInputs({
                      ...inputs,
                      [key]: e.target.value === "" ? NaN : +e.target.value,
                    })
                  }
                />
                {key === "months" && (
                  <input
                    aria-label="期限滑块"
                    type="range"
                    min="1"
                    max="120"
                    value={inputs.months}
                    onChange={(e) =>
                      setInputs({ ...inputs, months: +e.target.value })
                    }
                  />
                )}
              </label>
            ))}
            <label>
              还款方式
              <select
                value={inputs.method}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    method: e.target.value as LoanInputs["method"],
                  })
                }
              >
                <option value="annuity">等额本息</option>
                <option value="principal">等额本金</option>
              </select>
            </label>
          </div>
          <p className="gb-help">
            示例费用仅为教学输入。期初费用从放款中扣除，每月费用在还款之外另付。
          </p>
        </div>
        <div className="gb-results" aria-busy={busy}>
          <span className="rd-kicker">
            {busy ? "正在核算现金流…" : "借款的总成本 = 利息 + 明确费用"}
          </span>
          <h2>总成本</h2>
          <strong className="gb-big-number">
            {result ? `¥ ${money(result.total_cost)}` : "—"}
          </strong>
          {error && <p role="alert">{error} 净到账须大于零，期限须为整月。</p>}
          {result && (
            <>
              <div className="gb-result-strip">
                <div>
                  <span>净到账</span>
                  <b>¥{money(result.net_received)}</b>
                </div>
                <div>
                  <span>有效年成本（非监管 APR）</span>
                  <b>{result.effective_annual_cost.toFixed(3)}%</b>
                </div>
              </div>
              <div className="gb-cashflow">
                <div className="gb-cash-in">
                  <small>今天 / 收到</small>
                  <strong>+ ¥{money(result.net_received)}</strong>
                  <span>面额 − 期初费用</span>
                </div>
                <div className="gb-cash-out">
                  <small>一个月后 / 首期支付</small>
                  <strong>− ¥{money(result.first_payment)}</strong>
                  <span>本金 + 利息 + 月费用</span>
                </div>
                <div className="gb-cash-out">
                  <small>第 {inputs.months} 月 / 最后一期</small>
                  <strong>− ¥{money(result.last_payment)}</strong>
                  <span>按模型全部归还</span>
                </div>
              </div>
              <svg
                className="gb-payment-chart"
                viewBox="0 0 600 220"
                role="img"
                aria-label="每期本金、利息与费用构成"
              >
                <text x="20" y="20" fill="#48685c" fontSize="14">
                  每期支付构成 · 青绿本金 / 金色利息 / 珊瑚费用
                </text>
                {result.schedule.map((r, i) => {
                  const max = Math.max(
                      ...result.schedule.map((x) => x.payment),
                      1,
                    ),
                    w = 550 / inputs.months;
                  let y = 180;
                  return (
                    <g key={i}>
                      {[
                        [r.principal, "#267b78"],
                        [r.interest, "#e9c365"],
                        [r.fee, "#e9a28e"],
                      ].map(([v, c], j) => {
                        const h = (Number(v) / max) * 140;
                        y -= h;
                        return (
                          <rect
                            key={j}
                            x={25 + i * w}
                            y={y}
                            width={Math.max(0.3, w * 0.8)}
                            height={h}
                            fill={String(c)}
                          />
                        );
                      })}
                    </g>
                  );
                })}
                <text x="25" y="207" fontSize="14" fill="#48685c">
                  第 1 月
                </text>
                <text
                  x="570"
                  y="207"
                  textAnchor="end"
                  fontSize="14"
                  fill="#48685c"
                >
                  第 {inputs.months} 月
                </text>
              </svg>
              <label className="gb-chart-cursor">
                查看第 {Math.min(month, inputs.months)} 期
                <input
                  type="range"
                  aria-label="查看还款期数"
                  min="1"
                  max={inputs.months}
                  value={Math.min(month, inputs.months)}
                  onChange={(e) => setMonth(+e.target.value)}
                />
              </label>
              {period && (
                <p className="gb-insight">
                  本金 ¥{money(period.principal)} + 利息 ¥
                  {money(period.interest)} + 费用 ¥{money(period.fee)} = 本期 ¥
                  {money(period.payment)}；剩余本金 ¥{money(period.balance)}。
                </p>
              )}
              <div className="gb-result-strip">
                <div>
                  <span>全部利息</span>
                  <b>¥{money(result.total_interest)}</b>
                </div>
                <div>
                  <span>全部明确费用</span>
                  <b>¥{money(result.total_fees)}</b>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="gb-comparison">
        <div>
          <h3>每月压力小，不一定总成本低。</h3>
          <p>
            {fixed && result
              ? `固定 A：${fixed.inputs.months} 期、${fixed.inputs.method === "annuity" ? "等额本息" : "等额本金"}、年名义利率 ${fixed.inputs.rate}%。当前 B 首期变化 ¥${money(result.first_payment - fixed.first_payment)}，总成本变化 ¥${money(result.total_cost - fixed.total_cost)}。`
              : "固定 A，再改变期限、费用或还款方式。查看每期负担与总成本的取舍。"}
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
            <summary>完整还款表、公式口径与不适用情形</summary>
            <p>{result.assumptions}</p>
            <p>
              本金及全部利息费用合计 ¥{money(result.total_paid)}
              ，其中期初费用已从面额扣除，不能再重复加入逐月现金流。有效成本使各期付款折现合计等于净到账，再以
              (1+月 IRR)^12−1 年化。
            </p>
            <div className="rd-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>月</th>
                    <th>本金</th>
                    <th>利息</th>
                    <th>费用</th>
                    <th>本期支付</th>
                    <th>剩余本金</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((p) => (
                    <tr key={p.month}>
                      <td>{p.month}</td>
                      <td>{money(p.principal)}</td>
                      <td>{money(p.interest)}</td>
                      <td>{money(p.fee)}</td>
                      <td>{money(p.payment)}</td>
                      <td>{money(p.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          {embedded ? (
            <Link
              className="rd-button"
              to={`/money-lab/loan?inputs=${encodeURIComponent(JSON.stringify(inputs))}`}
            >
              带参数比较完整贷款方案 →
            </Link>
          ) : (
            <>
              <SaveExperiment
                tool="loan"
                title="贷款成本对照"
                detail={`${inputs.months} 期 · 成本 ¥${money(result.total_cost)} · 有效年成本 ${result.effective_annual_cost.toFixed(3)}%`}
                payload={{ current: result, fixed }}
                disabled={busy}
              />
              <Link className="rd-text-link" to="/stories/loan#experiment">
                回到贷款专题 →
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function LoanStory() {
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 借贷成本
      </div>
      <header className="gb-story-hero">
        <div>
          <span className="rd-kicker">
            生活实验 05 · 原创互动专题 · 约 12 分钟
          </span>
          <h1>
            一笔贷款，
            <br />
            到底要还多少钱？
          </h1>
          <p>
            不要只盯着一个利率。把今天拿到的、每个月付出的，以及费用发生的时点，放到同一条时间线上。
          </p>
          <small>以下金额、期限与费用均为教学假设，不对应任何借贷产品。</small>
        </div>
        <img
          src="/redesign/gate-b/loan-studio.png"
          alt="日历与分期排列的硬币、计算器和账单，表示不同时间发生的现金流"
        />
      </header>
      <div className="gb-reading-layout">
        <nav className="gb-reading-nav">
          {[
            ["case", "从净到账开始"],
            ["method", "两种还款方式"],
            ["experiment", "比较现金流"],
            ["check", "常见误区"],
            ["sources", "来源与边界"],
            ["takeaway", "保存发现"],
          ].map(([k, v]) => (
            <a href={"#" + k} key={k}>
              {v}
            </a>
          ))}
        </nav>
        <article className="gb-article">
          <section id="case">
            <span className="gb-kicker">01 / 一份看似简单的借款</span>
            <h2>写着借 20000 元，拿到手可能不是 20000 元。</h2>
            <p>
              假设借款面额为 20000 元，期初扣除 200 元明确手续费，实际能使用的是
              19800 元。若仍按 20000
              元计算合同利息和还款，比较成本时就不能假装自己拥有过全部面额。若每月还另付管理费用，它也是真实现金流，不会因为名字没有“利息”两个字就消失。
            </p>
            <p>
              金额、利率与成本各有用途：总成本告诉你一共为借款多付多少；每期还款提示现金安排压力；年化指标则尝试把不同时间长度放在共同尺度上。没有哪一个数字能够独自回答“是否适合我”，本工具也不会推荐借贷产品。
            </p>
            <div className="gb-flow">
              <div>
                <small>名义面额</small>
                <strong>¥20000</strong>
                <small>合同计算本金的起点</small>
              </div>
              <div>
                <small>期初扣费</small>
                <strong>− ¥200</strong>
                <small>同一笔费用不重复计算</small>
              </div>
              <div>
                <small>真正可用</small>
                <strong>¥19800</strong>
                <small>有效成本的流入起点</small>
              </div>
            </div>
          </section>
          <section id="method">
            <span className="gb-kicker">02 / 同样的本金，不同的归还节奏</span>
            <h2>“等额”究竟等的是什么？</h2>
            <p>
              等额本息让不含额外费用的每期本金与利息合计相同：初期剩余本金较多，利息占比更大，后期逐渐减少。等额本金每期归还相同本金，利息随着余额降低，所以初期付款较高、之后逐步减少。同样利率与期限下，归还本金更早通常会减少计息余额，但前期现金压力也更大。
            </p>
            <p>
              把期限拉长，经常能让每期付款更低，却也让未还本金存在更久；如果每月费用不变，付费次数也会增加。不要把“月供下降”直接读成“便宜了”。工具里的固定
              A 与当前 B 会同时显示第一期负担和总成本的变化。
            </p>
          </section>
          <section id="experiment">
            <span className="gb-kicker">03 / 先保持其他条件不变</span>
            <h2>改一次期限，再改一次费用。</h2>
            <p>
              先固定默认方案为 A，把 24 个月改为 48
              个月；看每期支付下降了多少，总成本又增加了多少。再试一次 0%
              名义利率、保留费用的情景：没有合同利息，并不等于借款没有成本。你可以逐期查看本金、利息、费用和剩余本金。
            </p>
            <LoanWorkbench embedded />
          </section>
          <section id="check">
            <h2>年化口径，不是可以随意互换的名字。</h2>
            <p>
              此处按净到账与等间隔月末付款求月度内部收益率，再复合成年有效成本。监管
              APR
              的费用纳入规则、年化惯例及披露要求可能因地区和产品而不同。本站没有执行某一监管披露规范，因此明确不把结果标作“官方
              APR”。
            </p>
            <CheckUnderstanding
              id="loan"
              question="借款名义利率是 0%，但期初有费用，能说借款没有成本吗？"
              options={[
                "能，利率为零就免费",
                "不能，净到账少于之后归还的现金，仍有成本",
                "只要期限足够长，费用就自动消失",
              ]}
              correct={1}
              feedback={[
                "利率只描述一项收费口径，期初和逐月费用也必须计入。",
                "正确。把净到账与全部付款按时点比较，才能看到有效成本。",
                "年化幅度可能改变，但已经支付的费用不会因期限长就消失。",
              ]}
            />
          </section>
          <section id="sources">
            <h2>模型能解释什么，不能替代什么？</h2>
            <p>
              固定名义利率、等间隔月末付款、费用时点明确，是本模型的前提。提前结清、宽限期、逾期罚息、浮动利率、按实际天数计息、复杂保险与分次放款，都需要另外的现金流安排；不能把本页直接当作合同结算单。表格只在展示时四舍五入到分，实际机构逐期舍入可能带来微小差异。
            </p>
            <ul className="gb-source-list">
              <li>
                <a
                  href="https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CFPB · Interest rate 与 APR 的区别
                </a>
                <p>
                  官方教育资料，解释费用为何影响整体借款成本；美国按揭背景，不直接套作本地法规。核对
                  2026-10-14。本站现金流模型与中文案例为原创教学。
                </p>
              </li>
            </ul>
          </section>
          <section id="takeaway">
            <StorySave
              slug="loan"
              title="贷款成本 · 我的现金流发现"
              sources={["CFPB interest rate vs APR"]}
            />
            <div className="gb-next">
              <Link to="/money-lab/loan">保存自己的两种还款情景 →</Link>
              <Link to="/stories/budget">看看月度预算能否承受</Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
