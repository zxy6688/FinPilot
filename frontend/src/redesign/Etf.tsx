import { BackToReading } from "./ReadingNav";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConceptPlay } from "./ConceptStudio";
import { CheckUnderstanding, StorySave } from "./Stories";
export function EtfMechanism() {
  const [layer, setLayer] = useState<"trade" | "create">("trade");
  return (
    <div className="gb-etf-mechanism">
      <div className="rd-filter">
        <button
          aria-pressed={layer === "trade"}
          onClick={() => setLayer("trade")}
        >
          普通投资者的交易
        </button>
        <button
          aria-pressed={layer === "create"}
          onClick={() => setLayer("create")}
        >
          授权参与者的申赎
        </button>
      </div>
      <div className="gb-flow">
        <div>
          <small>{layer === "trade" ? "买方投资者" : "一篮子证券或现金"}</small>
          <strong>{layer === "trade" ? "支付市价" : "申购"}</strong>
          <small>
            {layer === "trade"
              ? "成交价格由市场买卖形成"
              : "具体安排依基金文件，并非任意个人都能参与"}
          </small>
        </div>
        <div>
          <small>
            {layer === "trade" ? "交易所二级市场" : "授权参与者 ↔ 基金"}
          </small>
          <strong>{layer === "trade" ? "份额转手" : "份额创建 / 赎回"}</strong>
          <small>
            {layer === "trade"
              ? "通常与其他交易者成交"
              : "大额单位与资产之间的交换机制"}
          </small>
        </div>
        <div>
          <small>{layer === "trade" ? "卖方投资者" : "一篮子证券或现金"}</small>
          <strong>{layer === "trade" ? "交出份额" : "赎回"}</strong>
          <small>
            {layer === "trade"
              ? "通常不是要求基金卖出一篮子资产"
              : "套利可能帮助价格靠近净值，但不保证无偏离"}
          </small>
        </div>
      </div>
      <p aria-live="polite">
        {layer === "trade"
          ? "你在交易所买一份 ETF，通常买到已有份额；这不同于直接向基金做大额申购。交易价可能高于或低于每份净值。"
          : "一级申赎与二级交易相互连接，但普通投资者交易时仍会遇到价差、流动性和折溢价。机制不能保证任意时刻成交在净值。"}
      </p>
    </div>
  );
}
export function EtfStory() {
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 市场与投资
      </div>
      <header className="gb-etf-hero">
        <div>
          <span className="rd-kicker">概念深读 04 · 原创专题 · 约 10 分钟</span>
          <h1>ETF 究竟是什么？</h1>
          <p>
            给“怎么买”和“买什么”各留一条坐标轴。一次拆开交易结构、投资策略和你真正承担的风险。
          </p>
        </div>
        <img
          className="gb-etf-cover-image"
          src="/redesign/gate-b/etf-studio.png"
          alt="两篮资产与连接它们的交易桥，原创概念场景插画"
        />
      </header>
      <div className="gb-reading-layout">
        <nav className="gb-reading-nav">
          {[
            ["matrix", "先分开两条轴"],
            ["trade", "交易与申赎"],
            ["cost", "费用与跟踪"],
            ["check", "风险判断"],
            ["sources", "来源"],
            ["takeaway", "保存发现"],
          ].map(([k, v]) => (
            <a href={"#" + k} key={k}>
              {v}
            </a>
          ))}
        </nav>
        <article className="gb-article">
          <section id="matrix">
            <BackToReading />
            <h2>一个名字，不能替代两个问题。</h2>
            <p>
              听到“ETF”和“指数基金”时，很容易以为只是两个不同叫法。实际上 ETF
              首先描述一种在交易所买卖基金份额的形式；指数基金描述以跟踪某个市场指数为目标的策略。形式与策略可以相交，不能相互替代。下方每个案例都对应一种可能的组合，而不是某只推荐产品。
            </p>
            <ConceptPlay />
            <p>
              指数 ETF 同时处在两个集合内。主动管理 ETF
              可以在交易所交易，但持仓选择不必机械跟踪指数。场外指数共同基金则以指数为参照，却不通过交易所盘中买卖份额。“基金”一词本身不能帮你确定交易方式、策略或风险，需要查看具体文件。
            </p>
          </section>
          <section id="trade">
            <h2>市场里的份额，从哪里来？</h2>
            <p>
              普通投资者通常在二级市场以成交价格买卖 ETF
              份额。另一个层面上，授权参与者依基金安排，通过一篮子证券或现金与基金交换大额份额。两个层面的连接有助于解释价格为何常围绕净值，但不应简化为“ETF
              永远按净值交易”。
            </p>
            <EtfMechanism />
            <div className="gb-story-callout">
              <b>价格与净值接近，不等于没有交易成本。</b>
              <p>
                买卖报价之间可能存在价差，成交也可能偏离净值。市场不活跃、底层资产难以估值或交易时间不同，都可能让观察和成交更复杂。这里没有接入实时报价，不能判断某只
                ETF 此刻是否值得买。
              </p>
            </div>
          </section>
          <section id="cost">
            <h2>不只是费率，还是“跟得怎么样”。</h2>
            <p>
              基金运作费用会影响投资者得到的净回报，二级交易还可能有佣金、价差等成本。低费用不保证高回报，也不代表所有指数产品的费用和持仓相同。比较前要先确认是否跟踪同一个指数、分红如何处理以及比较的时间区间。
            </p>
            <div className="gb-flow">
              <div>
                <small>费用</small>
                <strong>付出了什么</strong>
                <small>管理及其他明确费用，影响净回报</small>
              </div>
              <div>
                <small>跟踪差异</small>
                <strong>差了多少</strong>
                <small>指定期间基金回报与指数回报之差</small>
              </div>
              <div>
                <small>跟踪误差</small>
                <strong>偏离多稳定</strong>
                <small>偏离的波动程度，需说明计算口径与样本</small>
              </div>
            </div>
            <p>
              跟踪差异和跟踪误差不是同一件事：一个产品可能稳定地落后指数一小段，另一个则时高时低。现金头寸、交易摩擦、抽样复制和指数调整都可能产生偏离。主动
              ETF
              的目标可能不是复制指数，因此不能把“越像指数越好”当作所有基金的评价标准。
            </p>
          </section>
          <section id="check">
            <h2>分散与方便，并不取消风险。</h2>
            <p>
              持有一篮子资产不代表没有集中风险：某个行业或少数重仓仍可能左右表现。指数也可能下跌；某些产品采用杠杆、反向或衍生结构，风险和持有路径需要另外理解，本专题不对这些复杂产品建立完整模型。应先确认自己看的是哪一种结构，而不是只看到
              ETF 三个字母。
            </p>
            <CheckUnderstanding
              id="etf-risk"
              question="两只产品都叫指数基金，就能直接按费率判断哪只更合适吗？"
              options={[
                "可以，费率最低就一定最好",
                "不够，还要核对指数、交易成本、跟踪和风险",
                "只要是 ETF，就没有流动性风险",
              ]}
              correct={1}
              feedback={[
                "不同指数意味着不同资产与风险。单一费率不能替代完整比较。",
                "对。先让比较对象与口径可比，再理解各项成本与边界。",
                "交易形式不保证成交深度或零价差。流动性仍要单独检查。",
              ]}
            />
            <Link className="rd-button" to="/concept-studio">
              回到矩阵：完成判断并保存概念卡 →
            </Link>
          </section>
          <section id="sources">
            <h2>可追溯的概念依据</h2>
            <ul className="gb-source-list">
              <li>
                <a
                  href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24"
                  target="_blank"
                  rel="noreferrer"
                >
                  Investor.gov · Updated Investor Bulletin: ETFs
                </a>
                <p>
                  交易、授权参与者、净值与折溢价的官方教育说明。核对
                  2026-10-14。
                </p>
              </li>
              <li>
                <a
                  href="https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4"
                  target="_blank"
                  rel="noreferrer"
                >
                  Investor.gov · Index Funds
                </a>
                <p>
                  指数策略及相关风险。本站中文解释、矩阵与案例为原创教学，不含具体产品推荐或市场价格。
                </p>
              </li>
            </ul>
          </section>
          <section id="takeaway">
            <StorySave
              slug="etf"
              title="ETF · 交易形式与投资策略"
              sources={[
                "Investor.gov ETF bulletin",
                "Investor.gov Index Funds",
              ]}
            />
            <div className="gb-next">
              <Link to="/concept-studio">继续练习并加入复习 →</Link>
              <Link to="/stories/bonds">延伸：基金里的债券怎样定价</Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
