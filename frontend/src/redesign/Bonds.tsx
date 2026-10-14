import { useStoryInputs } from "./StoryInputs";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { money } from "./state";
import { CheckUnderstanding, StorySave } from "./Stories";
import { readDraft, numericDisplay } from "./drafts";
type BondInput = {
  face: number;
  coupon: number;
  years: number;
  yield_rate: number;
};
type BondResult = {
  price: number;
  modified_duration: number;
  scenarios: { yield: number; price: number }[];
  points: { yield: number; price: number }[];
  assumptions: string;
  inputs: BondInput;
  model_version: string;
};
export function BondExperiment() {
  const [params] = useSearchParams();
  const [inputs, setInputs] = useState<BondInput>(() =>
    readDraft(params.get("inputs") || sessionStorage.getItem("bond-draft"), {
      face: 1000,
      coupon: 3,
      years: 5,
      yield_rate: 3,
    }),
  );
  const [result, setResult] = useState<BondResult | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    sessionStorage.setItem("bond-draft", JSON.stringify(inputs));
    let live = true;
    setBusy(true);
    const t = setTimeout(
      () =>
        api<BondResult>("/v3/experiments/bond", "POST", inputs)
          .then((r) => {
            if (live) {
              setResult(r);
              setError("");
              sessionStorage.setItem("bond-result", JSON.stringify(r));
            }
          })
          .catch((e) => {
            if (live) {
              setError(e.message);
              setResult(null);
            }
          })
          .finally(() => {
            if (live) setBusy(false);
          }),
      160,
    );
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [inputs]);
  useStoryInputs(setInputs);
  const max = Math.max(1, ...(result?.points.map((p) => p.price) || []));
  return (
    <div className="gb-embedded">
      <div className="gb-workbench">
        <div className="gb-controls">
          <h3>把市场收益率单独拎出来</h3>
          {(
            [
              ["yield_rate", "市场年收益率（%）", -5, 30, 0.1],
              ["coupon", "固定年票息率（%）", 0, 20, 0.1],
              ["years", "剩余年限", 1, 30, 1],
            ] as const
          ).map(([k, l, min, max, step]) => (
            <label key={k}>
              {l}
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={numericDisplay(inputs[k])}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    [k]: e.target.value === "" ? NaN : +e.target.value,
                  })
                }
              />
              <input
                aria-label={l + "滑块"}
                type="range"
                min={min}
                max={max}
                step={step}
                value={inputs[k] || 0}
                onChange={(e) => setInputs({ ...inputs, [k]: +e.target.value })}
              />
            </label>
          ))}
          <p className="gb-help">
            面值固定 ¥1000。默认票息 3% 表示每年承诺付息
            ¥30，不会因市场报价变化而自动改写。
          </p>
        </div>
        <div className="gb-results" aria-busy={busy}>
          <span className="rd-kicker">全部未来现金流的现值</span>
          <h2>教学定价</h2>
          <strong className="gb-big-number">
            {result ? "¥ " + money(result.price) : "—"}
          </strong>
          {error && <p role="alert">{error}</p>}
          {result && (
            <>
              <svg
                className="gb-payment-chart"
                viewBox="0 0 500 245"
                aria-label="同一债券的市场收益率越高，现金流现值越低"
                role="img"
              >
                <line x1="45" x2="460" y1="200" y2="200" stroke="#bbcfc1" />
                <path
                  d={result.points
                    .map(
                      (p, i) =>
                        `${i ? "L" : "M"}${45 + ((p.yield + 5) / 20) * 415},${200 - (p.price / max) * 165}`,
                    )
                    .join(" ")}
                  fill="none"
                  stroke="#267b78"
                  strokeWidth="3"
                />
                <text x="45" y="225" fill="#48675b" fontSize="15">
                  −5%
                </text>
                <text
                  x="460"
                  y="225"
                  textAnchor="end"
                  fill="#48675b"
                  fontSize="15"
                >
                  15% 市场收益率
                </text>
                <text x="45" y="20" fill="#48675b" fontSize="15">
                  价格（元） · 最高 ¥{money(max)}
                </text>
              </svg>
              <div className="gb-bond-scenarios">
                {result.scenarios.map((s) => (
                  <div key={s.yield}>
                    <span>市场 {s.yield.toFixed(1)}%</span>
                    <b>¥{money(s.price)}</b>
                  </div>
                ))}
              </div>
              <p className="gb-insight">
                修正久期约 {result.modified_duration.toFixed(2)}{" "}
                年。同一现金流、小幅平行变动时，收益率上升 0.1
                个百分点，价格约下降{" "}
                {(result.modified_duration * 0.1).toFixed(2)}
                %；大幅变化需重新定价。
              </p>
            </>
          )}
        </div>
      </div>
      {result && (
        <details className="gb-methods">
          <summary>定价方法和边界</summary>
          <p>{result.assumptions}</p>
          <p>
            价格 = 各年票息 ÷ (1+市场收益率)^年数的合计 + 面值 ÷
            (1+市场收益率)^到期年数。
          </p>
        </details>
      )}
    </div>
  );
}
export function BondsStory() {
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 市场与投资
      </div>
      <header className="gb-story-hero">
        <div>
          <span className="rd-kicker">机制实验 03 · 教学假设 · 约 12 分钟</span>
          <h1>
            从一次降息，
            <br />
            读懂债券。
          </h1>
          <p>
            同一条消息，为什么不一定带来同一个价格方向？先把四个经常混用的词拆开。
          </p>
          <small>本文不对应某次真实政策发布；没有实时行情或新闻预测。</small>
        </div>
        <img
          src="/redesign/gate-b/bonds-studio.png"
          alt="政策建筑、市场利率柱与债券凭证的层次场景"
        />
      </header>
      <div className="gb-reading-layout">
        <nav className="gb-reading-nav">
          {[
            ["case", "假设一条政策消息"],
            ["mechanism", "四个不同概念"],
            ["experiment", "债券定价实验"],
            ["check", "预期与误区"],
            ["sources", "可靠来源"],
            ["takeaway", "留下理解"],
          ].map(([k, v]) => (
            <a href={"#" + k} key={k}>
              {v}
            </a>
          ))}
        </nav>
        <article className="gb-article">
          <section id="case">
            <h2>如果大家早就知道它会降呢？</h2>
            <p>
              设想一个没有对应真实国家或日期的课堂情景：央行把政策利率下调 0.25
              个百分点。读者甲说“利率低了，旧债券一定涨”；读者乙先问“此前市场预期降多少？这只债券的市场收益率怎样变？”第二个问题更接近定价真正需要的信息。
            </p>
            <p>
              若这一步早在预期中，价格可能已提前调整；若原先预期下调 0.50
              个百分点，实际结果反而可能让一部分参与者修正判断。即使政策方向不变，信用风险、通胀预期、期限补偿和买卖需求仍可能改变某只债券的市场收益率。这里没有给出真实市场的必然反应，而是在拆分条件。
            </p>
          </section>
          <section id="mechanism">
            <h2>政策信号，要经过市场这座桥。</h2>
            <div className="gb-flow">
              <div>
                <small>政策利率</small>
                <strong>央行工具</strong>
                <small>影响短端融资条件与预期，不是所有债券的收益率</small>
              </div>
              <div>
                <small>市场收益率</small>
                <strong>折现条件</strong>
                <small>期限、风险与预期共同参与，决定现金流现值</small>
              </div>
              <div>
                <small>债券价格</small>
                <strong>交易金额</strong>
                <small>既定票息和本金，在当前折现条件下值多少</small>
              </div>
            </div>
            <p>
              票息率回答发行人按面值承诺支付多少利息；市场收益率回答以当前价格买入、在一组现金流假设下对应的回报尺度。两者可以不同：固定票息没有变，但交易价格能够变。用较高收益率折现同一笔未来付款，它今天的现值就较低，这才是常说的价格与收益率反向关系的条件。
            </p>
            <div className="gb-story-callout">
              <b>不是“所有利率下降 → 所有债券都上涨”。</b>
              <p>
                反向关系固定了债券现金流及其他条件。把央行政策利率直接塞进每只债券的定价公式，就跳过了市场预期与风险这一层。
              </p>
            </div>
          </section>
          <section id="experiment">
            <h2>同样每年 30 元，今天该值多少？</h2>
            <p>
              默认假设面值 1000 元、年付票息 3%、剩余 5 年。先把市场收益率从 3%
              调到 2%，再调到
              4%。固定现金流的价格如何变化？接着只改年限，看看同样的收益率变化对长短债的影响。
            </p>
            <BondExperiment />
            <p>
              久期把现金流到达时间和权重浓缩成一个敏感性指标，不单是“还有几年到期”。一般条件相同、期限更长或票息更低时，价格对利率更敏感；但久期近似只适合小幅变动。可赎回债券或信用状况变化不能只靠这条曲线解释。
            </p>
          </section>
          <section id="check">
            <h2>把“不知道”也放进判断里。</h2>
            <CheckUnderstanding
              id="bonds"
              question="看到政策降息，判断某只债券价格前最该补充什么？"
              options={[
                "不用补充，所有债券都会涨",
                "市场收益率、原先预期及信用等条件是否变化",
                "只看债券名称里有没有“稳健”",
              ]}
              correct={1}
              feedback={[
                "反向定价关系固定了现金流与折现条件；政策利率不等于某只债券收益率。",
                "这能避免把政策方向直接当作价格结论。仍需真实市场数据，本页不提供预测。",
                "名称不是现金流、风险或市场报价的证据。",
              ]}
            />
            <p>
              即使打算持有到期，也要区分信用违约风险、途中卖出的价格风险和票息再投资条件；“到期还面值”是依合同履约的假设，不是所有债券无条件保本的保证。
            </p>
          </section>
          <section id="sources">
            <h2>机制资料，不是最新事件。</h2>
            <ul className="gb-source-list">
              <li>
                <a
                  href="https://www.ecb.europa.eu/mopo/intro/transmission/html/index.en.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  ECB · Transmission mechanism of monetary policy
                </a>
                <p>
                  政策、预期、市场利率与资产价格之间的传导解释。官方教育资料，核对
                  2026-10-14。
                </p>
              </li>
              <li>
                <a
                  href="https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds"
                  target="_blank"
                  rel="noreferrer"
                >
                  Investor.gov · Bonds — FAQs
                </a>
                <p>
                  债券现金流与信用、利率、通胀、流动性风险。本文案例和定价图由原创教学模型生成，不含当期报价。
                </p>
              </li>
            </ul>
          </section>
          <section id="takeaway">
            <StorySave
              slug="bonds"
              title="降息与债券 · 我的条件清单"
              sources={["ECB monetary transmission", "Investor.gov Bonds FAQs"]}
            />
            <div className="gb-next">
              <Link to="/concept-studio">下一步：基金的交易形式与策略 →</Link>
              <Link to="/decoder/purchasing-power">
                延伸：固定票息的实际购买力
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
