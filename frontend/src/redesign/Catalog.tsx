import "./discover-br.css";
import { knowledgeIndex, labs } from "./knowledgeData";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Search, BookOpen, PiggyBank, TrendingDown, ReceiptText, ChartNoAxesCombined, ChevronDown } from "lucide-react";
import { FinArt } from "./Fin";
import { PurchasingArt } from "./Decoder";
import { topics } from "./state";
import "./money-lab-directory.css";

export const toolsCatalog = [
  {
    id: "savings",
    title: "储蓄目标规划",
    question: "每月存多少，才能更接近目标？",
    description: "已有金额、月存与存入时点 → 预计余额与目标缺口",
    tag: "为未来准备",
    related: "/stories/budget",
  },
  {
    id: "compound",
    title: "复利与时间价值",
    question: "多一年时间，会带来什么变化？",
    description: "年限与利率口径 → 本金、假设增长与 A/B 曲线",
    tag: "理解时间",
    related: "/decoder/purchasing-power",
  },
  {
    id: "inflation",
    title: "通胀与购买力",
    question: "账户变多，真的买得更多吗？",
    description: "名义增长与通胀 → 折合今天的金额与实际收益率",
    tag: "看清分量",
    related: "/decoder/purchasing-power",
  },
  {
    id: "loan",
    title: "贷款实际成本",
    question: "每月少还一点，真的更便宜吗？",
    description: "期限、利率与费用 → 逐期现金流与有效年成本",
    tag: "核对成本",
    related: "/stories/loan",
  },
  {
    id: "budget",
    title: "个人预算情景比较",
    question: "突然多一笔支出，计划还能继续吗？",
    description: "收入、支出与储备 → 支出结构、结余与计划缺口",
    tag: "安排生活",
    related: "/stories/budget",
  },
];
export const siteCatalog = [
  ...knowledgeIndex,
  ...topics.map((t) => ({
    id: "story-" + t.id,
    title: t.title,
    summary: t.summary,
    url: t.path,
    group: "原创互动专题",
  })),
  ...toolsCatalog.map((t) => ({
    id: "tool-" + t.id,
    title: t.title,
    summary: t.question + " " + t.description,
    url: "/money-lab/" + t.id,
    group: "财务工具",
  })),
  {
    id: "concept-etf",
    title: "ETF 与指数基金：二维分类矩阵",
    summary: "概念 案例 交易策略 判断 复习",
    url: "/concept-studio/etf-matrix",
    group: "概念互动",
  },
];
export function searchCatalog(q: string) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return words.length
    ? siteCatalog.filter((x) =>
        words.every((w) => (x.title + x.summary).toLowerCase().includes(w)),
      )
    : [];
}

const moneyDirectoryItems = [
  {
    id: "savings", number: "02", title: "储蓄规划", category: "目标与期限",
    summary: "根据储蓄目标反推每月存入金额，或估算固定月存额下的期末金额。",
    input: "已有资金、月存额、期限、假设利率",
    output: "目标差额、预计余额、所需月存额",
    Icon: PiggyBank,
  },
  {
    id: "inflation", number: "03", title: "购买力计算", category: "通胀与实际价值",
    summary: "比较未来名义金额与折合今天的购买力，观察通胀假设的影响。",
    input: "金额、期限、通胀率、金额增长率",
    output: "名义金额、实际购买力、实际收益率",
    Icon: TrendingDown,
  },
  {
    id: "loan", number: "04", title: "贷款成本", category: "借款与费用",
    summary: "核算实际到账、各期还款及费用，比较不同贷款方案的成本。",
    input: "面额、利率、期限、相关费用",
    output: "净到账、总支付、额外成本",
    Icon: ReceiptText,
  },
  {
    id: "compound", number: "05", title: "复利计算", category: "本金与时间",
    summary: "比较本金、年限、利率和计息频率对期末金额的影响。",
    input: "本金、期限、利率、计息频率",
    output: "期末金额、本金、假设增长",
    Icon: ChartNoAxesCombined,
  },
];

export function ToolDirectory() {
  const [params] = useSearchParams();
  if (params.has("receipt") || params.has("monthly"))
    return <Navigate replace to={"/money-lab/savings?" + params.toString()} />;
  return (
    <div className="rd-page money-directory">
      <header className="money-directory-head">
        <div className="money-directory-title">
          <div className="money-directory-overline"><span>MONEY LAB</span><span>5 项计算工具</span></div>
          <h1>财务工具</h1>
          <p>选择一项计算，填写条件、查看结果，并比较不同方案。</p>
        </div>
        <div className="money-directory-mascot"><FinArt action="receipt" size={100} /></div>
      </header>

      <section className="money-directory-work" aria-label="五项财务计算工具">
        <Link to="/money-lab/budget" className="money-directory-feature">
          <div className="money-directory-feature-copy">
            <span className="money-directory-order">01 / 日常收支</span>
            <h2>个人预算</h2>
            <p>输入月度可用资金与计划支出，计算预计结余，比较不同预算方案。</p>
            <dl className="money-directory-facts">
              <div><dt>输入</dt><dd>资金、计划支出、储备目标</dd></div>
              <div><dt>结果</dt><dd>预计结余、目标缺口、支出结构</dd></div>
            </dl>
            <span className="money-directory-action">打开预算工具 <ArrowUpRight size={19} aria-hidden="true" /></span>
          </div>
          <div className="money-directory-feature-art">
            <img src="/redesign/gate-b/budget-studio.png" alt="" loading="eager" />
          </div>
        </Link>
        <div className="money-directory-grid">
          {moneyDirectoryItems.map(({ id, number, title, category, summary, input, output, Icon }) => (
            <Link to={"/money-lab/" + id} className={"money-directory-card money-directory-" + id} key={id}>
              <div className="money-directory-card-top">
                <span className="money-directory-order">{number} / {category}</span>
                <span className="money-directory-symbol"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              </div>
              <h2>{title}</h2>
              <p className="money-directory-card-summary">{summary}</p>
              <div className="money-directory-card-facts">
                <div><span>输入</span>{input}</div>
                <div><span>查看</span>{output}</div>
              </div>
              <div className="money-directory-card-link">进入工具 <ArrowUpRight size={17} aria-hidden="true" /></div>
            </Link>
          ))}
        </div>
      </section>

      <div className="money-directory-method">
        <BookOpen size={21} strokeWidth={1.8} aria-hidden="true" />
        <div><b>关于计算结果</b><p>工具采用明确的公式与输入假设。结果用于学习和情景比较，并非对实际收益或费用的保证。</p></div>
        <Link to="/methods">计算方法 <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>

      <section id="classic-labs" className="money-directory-legacy" aria-label="教学实验">
        <details>
          <summary><span><b>教学实验</b><small>原有 8 项机制实验，保留原入口及历史记录</small></span><ChevronDown size={21} aria-hidden="true" /></summary>
          <div className="money-directory-legacy-grid">
            {labs.map((l) => (
              <Link key={l.id} to={"/lab/" + l.id}>
                <span className="money-directory-legacy-num">{String(l.id).padStart(2, "0")}</span>
                <div><b>{l.title}</b><small>{l.question}</small></div>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}

function Cover({ id }: { id: string }) {
  if (["budget", "loan", "bonds", "etf"].includes(id))
    return (
      <img
        src={"/redesign/gate-b/" + id + "-studio.png"}
        alt="原创专题情景插画；不是现实事件照片"
      />
    );
  if (id === "purchasing-power") return <PurchasingArt />;
  return (
    <div className="gb-catalog-matrix">
      <span>交易 × 策略</span>
      <b>指数 ETF</b>
      <b>主动 ETF</b>
      <b>场外指数</b>
      <b>场外主动</b>
    </div>
  );
}
const issues=[
 ["purchasing-power","同样的 10,000 元，购买力会怎样变化？","账户金额与实际购买力是两个不同的量。根据设定的通胀率和期限，查看固定金额折合今天的购买力。","案例 · 互动图表"],
 ["budget","大学生预算：临时支出会影响什么？","以 2,500 元的假设生活费为例，区分支出、预计结余与预留资金。","预算案例 · 情景判断"],
 ["bonds","降息之后，债券价格一定会上涨吗？","从政策利率、市场收益率到债券现金流，区分影响价格的不同因素。","定价实验 · 机制解释"],
 ["etf","ETF：交易形式、费用与投资风险","阅读基金资料，核对交易价格、费用与所持资产的风险。","结构图解 · 风险判断"],
 ["loan","借款 20,000 元，实际能到账多少？","以期初扣费的假设案例，区分借款面额、净到账与还款现金流。","现金流示例 · 成本辨析"]
];
export function Magazine(){
 const [group,setGroup]=useState(0),[query,setQuery]=useState("");
 const visible=issues.filter(([id,...text])=>(!group||group===(["bonds","etf"].includes(id)?2:1))&&text.join("").toLowerCase().includes(query.trim().toLowerCase()));
 const card=([id,title,desc,tag]:string[])=><Link className={"issue "+(id==="purchasing-power"?"lead":"")} key={id} to={id==="purchasing-power"?"/decoder/purchasing-power":"/stories/"+id}><div><small>{tag}</small><h2>{title}</h2><p>{desc}</p>{id==="purchasing-power"&&<p>教学假设：¥10,000 · 3 年 · 年通胀 3% → 折合今天约 ¥9,151.42</p>}<b>阅读专题 ↗</b></div><Cover id={id}/></Link>;
 return <main className="rd-page discover-br"><header><Link to="/discover/library">完整资料库 ↗</Link><h1>发现</h1><p>五篇金融专题，涵盖个人预算、购买力、债券、ETF 和借款成本。每篇均包含案例、解释与互动练习。</p></header>{visible.filter(x=>x[0]==="purchasing-power").map(card)}<section className="issue-filter">{["全部（5）","生活与财务（3）","市场与投资（2）"].map((l,i)=><button key={l} aria-pressed={i===group} onClick={()=>setGroup(i)}>{l}</button>)}<label>搜索五篇精选专题 <input value={query} onChange={e=>setQuery(e.target.value)}/></label></section><div className="issues">{visible.filter(x=>x[0]!=="purchasing-power").map(card)}</div>{!visible.length&&<p role="status">没有找到匹配专题。<button onClick={()=>{setQuery("");setGroup(0)}}>清除筛选</button></p>}<aside><h2>资料与来源</h2><p>外部教育资料</p><a href="https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html">ECB · 通胀</a>　<a href="https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/">CFPB · 预算与现金流</a>　<a href="https://www.investor.gov/introduction-investing/investing-basics/investment-products">Investor.gov · 投资产品</a><p><Link to="/discover/library">浏览资料库</Link>　<Link to="/fintalk">FinTalk 讨论</Link></p></aside></main>
}
