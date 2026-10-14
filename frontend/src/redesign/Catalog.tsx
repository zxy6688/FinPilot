import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Search, Calculator, BookOpen } from "lucide-react";
import { MiniLab } from "./MoneyLab";
import { FinArt } from "./Fin";
import { PurchasingArt } from "./Decoder";
import { topics } from "./state";

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
    url: "/concept-studio",
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

export function ToolDirectory() {
  const [params] = useSearchParams();
  if (params.has("receipt") || params.has("monthly"))
    return <Navigate replace to={"/money-lab/savings?" + params.toString()} />;
  return (
    <div className="rd-page">
      <header className="gb-tool-heading">
        <div>
          <span className="rd-kicker">Money Lab · 五个生活里的实验</span>
          <h1>先选一个，想算清的问题。</h1>
          <p>
            不用填完一张复杂的表。每套工具都从可修改的示例开始，再比较、保存和继续。
          </p>
        </div>
        <FinArt action="receipt" size={130} />
      </header>
      <MiniLab />
      <div className="gb-tool-directory">
        {toolsCatalog.map((t, i) => (
          <Link
            to={"/money-lab/" + t.id}
            className={"gb-tool-entry tool-" + t.id}
            key={t.id}
          >
            <div className="gb-tool-index">
              <span>0{i + 1}</span>
              <Calculator size={24} />
            </div>
            <div>
              <small>{t.tag} · 确定性计算</small>
              <h2>{t.title}</h2>
              <p>{t.question}</p>
              <span>{t.description}</span>
            </div>
            <ArrowUpRight size={25} />
          </Link>
        ))}
      </div>
      <div className="gb-editor-note">
        <BookOpen size={24} />
        <div>
          <b>模型帮助看清条件，不替你作选择。</b>
          <p>
            所有示例为教学假设；记录保存具体参数和公式口径，重新打开时保留历史结果供核对。
          </p>
        </div>
      </div>
      <Link className="rd-text-link" to="/lab">
        继续旧版实验与反思记录 →
      </Link>
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
export function Magazine() {
  const [filter, setFilter] = useState("全部"),
    [q, setQ] = useState("");
  const category = (id: string) =>
    id === "loan"
      ? "借贷"
      : id === "etf" || id === "bonds"
        ? "市场与投资"
        : "钱与生活";
  const matches = topics.filter(
    (t) =>
      (filter === "全部" || category(t.id) === filter) &&
      (!q.trim() ||
        (t.title + t.summary).toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="rd-page gb-magazine">
      <div className="gb-magazine-masthead">
        <span className="rd-kicker">Discover · FinPilot 编辑室</span>
        <span>原创专题 / 官方资料 / 假设实验</span>
      </div>
      <header className="gb-magazine-lead">
        <div>
          <span className="rd-kicker">这一期，从钱与时间开始</span>
          <h1>
            把听过的概念，
            <br />
            变成自己的理解。
          </h1>
          <p>
            五个具体问题，五条可以亲手走完的路径。阅读不是终点，你可以改数字、看结果，再留下发现。
          </p>
          <Link to="/decoder/purchasing-power" className="rd-button">
            本期深读：钱与购买力 <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="gb-magazine-feature">
          <PurchasingArt />
          <b>账户里的 ¥10000，和篮子里的生活</b>
          <span>8 分钟 · 可调通胀 / 名义与实际曲线</span>
        </div>
      </header>
      <div className="gb-magazine-filter">
        <div className="rd-filter">
          {["全部", "钱与生活", "市场与投资", "借贷"].map((t) => (
            <button
              key={t}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label>
          <Search size={18} />
          <input
            aria-label="筛选专题"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="在五个专题中找一个问题"
          />
        </label>
      </div>
      <div className="gb-editorial-list">
        {matches.map((t, i) => (
          <article key={t.id}>
            <Link className="gb-story-cover" to={t.path}>
              <Cover id={t.id} />
            </Link>
            <div>
              <span className="rd-kicker">{category(t.id)} / 原创互动专题</span>
              <h2>
                <Link to={t.path}>{t.title}</Link>
              </h2>
              <p>{t.summary}</p>
              <div className="gb-story-meta">
                <span>{t.id === "purchasing-power" ? "8" : "10–12"} 分钟</span>
                <span>
                  {
                    (
                      {
                        budget: "预算分类与情景比较",
                        bonds: "定价与收益率实验",
                        loan: "还款现金流对照",
                        etf: "矩阵、案例与判断",
                        "purchasing-power": "名义与实际金额对照",
                      } as Record<string, string>
                    )[t.id]
                  }
                </span>
              </div>
              <small>
                官方概念资料 + 原创解释；数值为教学假设。资料核对 2026-10-14。
              </small>
              <Link className="rd-text-link" to={t.path}>
                读懂，再动手 <ArrowUpRight size={17} />
              </Link>
            </div>
            <span className="gb-editorial-number">0{i + 1}</span>
          </article>
        ))}
      </div>
      {!matches.length && (
        <div className="rd-empty-notebook">
          <FinArt action="card" size={90} />
          <div>
            <h2>这一期没有对应专题。</h2>
            <p>可以换个更短的关键词，或在完整资料库继续找。</p>
            <button
              className="rd-secondary"
              onClick={() => {
                setQ("");
                setFilter("全部");
              }}
            >
              显示全部五个专题
            </button>
            <Link className="rd-text-link" to="/discover/library">
              打开资料库 →
            </Link>
          </div>
        </div>
      )}
      <section className="gb-source-shelf">
        <div>
          <span className="rd-kicker">从现实资料继续核对</span>
          <h2>打开出处，看看原本怎么说。</h2>
          <p>
            以下是机构教育资料，不是实时新闻。它们提供定义与机制，站内专题提供中文解释和互动。
          </p>
        </div>
        <div>
          {[
            [
              "ECB",
              "物价与通胀的定义",
              "https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html",
            ],
            [
              "CFPB",
              "收入、账单与现金流工具",
              "https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/",
            ],
            [
              "Investor.gov",
              "基金、ETF 与投资风险",
              "https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-4",
            ],
          ].map(([a, b, c]) => (
            <a key={a} href={c} target="_blank" rel="noreferrer">
              <small>{a} · 官方教育资料</small>
              <b>{b}</b>
              <ArrowUpRight size={20} />
            </a>
          ))}
        </div>
      </section>
      <div className="gb-next">
        <Link to="/discover/library">查看既有资讯、来源与课程关联 →</Link>
        <Link to="/fintalk">到 FinTalk 讨论你的理解</Link>
      </div>
    </div>
  );
}
