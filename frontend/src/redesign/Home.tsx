import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  BookOpen,
  Calculator,
  Compass,
  Bookmark,
  Clock,
  ChevronRight,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { HomeData } from "../living/types";
import FinButton, { FinArt } from "./Fin";
import { findExploration, type ExplorationMatch } from "./questionRouting";
import { SavingsPreview } from "./TaskPreviews";
import { MiniLab } from "./MoneyLab";
import { ConceptPlay } from "./ConceptStudio";
import { PurchasingArt } from "./Decoder";
import { topics, useNotebook } from "./state";
export function StoryArt({ kind = "budget" }: { kind?: string }) {
  return (
    <svg viewBox="0 0 260 170" aria-hidden="true">
      {kind === "budget" ? (
        <>
          <ellipse cx="135" cy="149" rx="90" ry="10" fill="#d9cb9f" />
          <g transform="rotate(-9 130 80)">
            <rect
              x="65"
              y="15"
              width="130"
              height="135"
              rx="9"
              fill="#fffdf6"
              stroke="#b8a876"
            />
            <rect x="76" y="15" width="10" height="135" fill="#267B78" />
            <path
              d="M103 45h63M103 64h50M103 94h63M103 114h34"
              stroke="#adb8a0"
              strokeWidth="5"
            />
            <rect x="146" y="96" width="36" height="27" rx="5" fill="#F1C467" />
          </g>
          <circle
            cx="63"
            cy="125"
            r="24"
            fill="#F1C467"
            stroke="#b5974c"
            strokeWidth="2"
          />
          <path
            d="M56 116l7 9 7 -9m-7 8v14m-10 -8h20"
            fill="none"
            stroke="#9b7738"
            strokeWidth="2"
          />
        </>
      ) : kind === "bonds" ? (
        <>
          <rect
            x="32"
            y="23"
            width="192"
            height="125"
            rx="11"
            fill="#fffdf6"
            stroke="#91b7bf"
          />
          <path d="M51 119h152M51 92h152M51 65h152" stroke="#d7e2de" />
          <path
            d="M53 65l38 20 31 -8 37 34 42 7"
            stroke="#c58b79"
            fill="none"
            strokeWidth="4"
          />
          <path
            d="M53 124l38 -20 31 8 37 -34 42 -28"
            stroke="#267B78"
            fill="none"
            strokeWidth="4"
          />
          <circle cx="201" cy="50" r="7" fill="#F1C467" />
        </>
      ) : (
        <>
          <circle cx="106" cy="85" r="56" fill="#e7ca9a" opacity=".8" />
          <circle cx="161" cy="85" r="56" fill="#79BDCC" opacity=".65" />
          <path
            d="M115 85l13 13 28 -31"
            fill="none"
            stroke="#267B78"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
export function StoryGrid() {
  return (
    <div className="rd-story-grid">
      <Link className="rd-feature-story" to={topics[0].path}>
        <div>
          <span className="rd-kicker">本期深读 · 钱与生活</span>
          <h3>
            存钱，为什么不等于
            <br />
            购买力不变？
          </h3>
          <p>{topics[0].summary}</p>
          <span className="rd-text-link">
            进入金融解读室 <ArrowUpRight size={17} />
          </span>
          <small>原创专题 · 官方概念来源 · 8 分钟互动阅读</small>
        </div>
        <PurchasingArt />
      </Link>
      <div className="rd-small-stories">
        {topics.slice(1, 3).map((t) => (
          <Link to={t.path} className={"rd-small-story " + t.color} key={t.id}>
            <div>
              <span className="rd-kicker">
                {t.tag} · {t.time}
              </span>
              <h3>{t.title}</h3>
              <p>{t.summary}</p>
              <span className="rd-text-link">打开专题导读 ↗</span>
            </div>
            <StoryArt kind={t.id} />
          </Link>
        ))}
      </div>
      <div className="rd-story-bottom">
        {topics.slice(3).map((t) => (
          <Link to={t.path} key={t.id}>
            <span className={"rd-story-number " + t.color}>{t.num}</span>
            <div>
              <small>
                {t.tag} · {t.time}
              </small>
              <h3>{t.title}</h3>
            </div>
            <ArrowUpRight size={21} />
          </Link>
        ))}
      </div>
    </div>
  );
}
export default function Home() {
  const nav = useNavigate();
  const notebook = useNotebook();
  const { user } = useAuth();
  const [question, setQuestion] = useState(() => {
      try {
        return sessionStorage.getItem("finpilot:exploration-question") || "";
      } catch {
        return "";
      }
    }),
    [match, setMatch] = useState<ExplorationMatch | null>(null);
  const [history, setHistory] = useState<HomeData | null>(null);
  useEffect(() => {
    let active = true;
    if (user)
      api<HomeData>("/v3/home")
        .then((v) => {
          if (active) setHistory(v);
        })
        .catch(() => {});
    else setHistory(null);
    return () => {
      active = false;
    };
  }, [user?.id]);
  function routeQuestion() {
    const result = findExploration(question);
    if (result.destination) nav(result.destination);
    else setMatch(result);
  }
  const returning =
    notebook.entries.length > 0 || (history?.continue.length || 0) > 0;
  return (
    <div className="rd-page rd-home">
      <section className="rd-hero">
        <div className="rd-hero-copy">
          <span className="rd-kicker">
            <i className="rd-sun" /> 给好奇心，一个有依据的答案
          </span>
          <h1>
            看懂金融，
            <br />
            形成自己的判断<span>。</span>
          </h1>
          <p>
            财经信息看得懂，生活里的数字算得清，
            <br className="rd-desktop-only" />
            抽象概念也能自己试一试。
          </p>
          <label
            className="a1-exploration-label"
            htmlFor="exploration-question"
          >
            寻找相关探索内容
          </label>
          <form
            className="rd-question"
            onSubmit={(e) => {
              e.preventDefault();
              routeQuestion();
            }}
          >
            <Search size={20} />
            <input
              id="exploration-question"
              aria-describedby="exploration-help"
              value={question}
              maxLength={200}
              onChange={(e) => {
                setQuestion(e.target.value);
                setMatch(null);
                try {
                  sessionStorage.setItem(
                    "finpilot:exploration-question",
                    e.target.value,
                  );
                } catch {
                  /* In-memory draft remains available. */
                }
              }}
              placeholder="输入问题或专题名称，找相关内容"
            />
            <button type="submit">找内容</button>
          </form>
          <small id="exploration-help" className="a1-exploration-help">
            这是内容导航，不会直接生成问题答案。仅完整匹配专题标题时直接打开。
          </small>
          <div className="rd-question-chips">
            <Link to="/stories/bonds">降息后，债券一定涨吗？</Link>
            <Link to="/money-lab">每月存 500 元，两年后呢？</Link>
            <Link to="/concept-studio">ETF ≠ 指数基金？</Link>
          </div>
        </div>
        <div className="rd-hero-scene">
          <img
            src="/redesign/a1/exploration-studio.png"
            alt="Fin 的金融探索桌：学习手册、增长图、信息剪报和计算器"
          />
          <FinButton scene />
          <span className="rd-scene-note">
            <i /> 小小好奇，慢慢看懂。
          </span>
        </div>
      </section>
      {match?.kind === "empty" && (
        <p className="a1-exploration-empty" role="status">
          请先输入问题或专题名称，也可以选择下面的入口。
        </p>
      )}
      {match && match.kind !== "empty" && (
        <section
          className="rd-question-choice a1-content-suggestions"
          aria-label="探索内容建议"
        >
          <div role="status">
            <b>
              {match.kind === "mixed"
                ? "涉及多个主题，请选择这次想探索的内容。"
                : match.kind === "unknown"
                  ? "还没有找到对应专题，可以从这些通用入口开始。"
                  : "有相关内容，但不一定能回答你的具体问题。"}
            </b>
            <p>
              你的原问题：<q>{question}</q>
            </p>
          </div>
          <div className="a1-suggestion-links">
            {match.suggestions.map((item) => (
              <Link key={item.id} to={item.path}>
                <b>
                  {item.title}
                  <ArrowUpRight size={16} />
                </b>
                <small>{item.scope}</small>
              </Link>
            ))}
          </div>
          <div className="a1-question-followup">
            <Link to={"/copilot?q=" + encodeURIComponent(question)}>
              带着原问题去问 Fin <ArrowUpRight size={15} />
            </Link>
            <small>
              保留原文，不自动发送。当前本地为 Demo 演示，不能保证解答任意问题。
            </small>
          </div>
        </section>
      )}
      <section className="rd-tasks" aria-label="三大任务入口">
        <Link className="rd-task rd-task-read" to="/decoder/purchasing-power">
          <div className="rd-task-icon">
            <BookOpen size={25} />
          </div>
          <span className="rd-kicker">Decoder · 金融解读室</span>
          <h2>
            看懂一件事 <ArrowUpRight />
          </h2>
          <p>钱没少，为什么能买到的变少了？</p>
          <div className="a1-read-preview">
            <span className="a1-paper-label">正在解读 / 01</span>
            <b>金额没变 ≠ 购买力没变</b>
            <span className="a1-reading-line">
              同一篮子商品 · 价格是比较的尺
            </span>
            <small>ECB 概念说明 → 生活例子 → 亲手验证</small>
          </div>
          <div className="rd-task-bottom">
            <span>官方概念来源 · 原创解读</span>
            <ArrowRight size={18} />
          </div>
        </Link>
        <Link className="rd-task rd-task-calc" to="/money-lab">
          <div className="rd-task-icon">
            <Calculator size={25} />
          </div>
          <span className="rd-kicker">Money Lab · 财务实验室</span>
          <h2>
            算清一个问题 <ArrowUpRight />
          </h2>
          <p>每月存一点，离目标还有多远？</p>
          <SavingsPreview />
          <div className="rd-task-bottom">
            <span>调参数，比方案，留一张小票</span>
            <ArrowRight size={18} />
          </div>
        </Link>
        <Link className="rd-task rd-task-concept" to="/concept-studio">
          <div className="rd-task-icon">
            <Compass size={25} />
          </div>
          <span className="rd-kicker">Concept Studio · 概念工作室</span>
          <h2>
            弄懂一个概念 <ArrowUpRight />
          </h2>
          <p>ETF 和指数基金，是一回事吗？</p>
          <div className="a1-concept-preview">
            <span>交易形式 × 投资策略</span>
            <div className="a1-mini-matrix">
              <b>指数 ETF</b>
              <span>主动 ETF</span>
              <span>场外指数</span>
              <span>场外主动</span>
            </div>
            <small>两条分类线，不是同义词</small>
          </div>
          <div className="rd-task-bottom">
            <span>亲手切换案例，再做个判断</span>
            <ArrowRight size={18} />
          </div>
        </Link>
      </section>
      <section className="rd-home-section">
        <div className="rd-section-head">
          <div>
            <span className="rd-kicker">从现实问题出发</span>
            <h2>这一期，值得弄明白的事。</h2>
          </div>
          <Link className="rd-text-link" to="/discover">
            所有精选 <ArrowUpRight size={18} />
          </Link>
        </div>
        <StoryGrid />
      </section>
      <section className="rd-home-section">
        <div className="rd-section-head">
          <div>
            <span className="rd-kicker">不止看看，也动手试试</span>
            <h2>数字一变，理解就近了一点。</h2>
          </div>
          <Link className="rd-text-link" to="/money-lab">
            进入财务工具 <ArrowUpRight size={18} />
          </Link>
        </div>
        <MiniLab />
        <div className="rd-tool-shortcuts">
          <Link to="/lab/1">
            <span>01 / 复利与时间</span>
            <b>早开始一年，会有什么不同？</b>
            <ArrowUpRight size={20} />
          </Link>
          <Link to="/decoder/purchasing-power#experiment">
            <span>02 / 通胀购买力</span>
            <b>同样的钱，还能买到多少？</b>
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
      <section className="rd-home-section rd-home-concept">
        <div className="rd-section-head">
          <div>
            <span className="rd-kicker">一分钟弄懂</span>
            <h2>看起来相似，不代表是一回事。</h2>
          </div>
          <Link className="rd-text-link" to="/concept-studio">
            走进概念工作室 <ArrowUpRight size={18} />
          </Link>
        </div>
        <ConceptPlay compact />
      </section>
      <section className="rd-home-section rd-continue">
        <div className="rd-section-head">
          <div>
            <span className="rd-kicker">
              {returning ? "接上你自己的线索" : "第一站，从一个小问题开始"}
            </span>
            <h2>
              {returning ? "继续我的探索。" : "不用全懂，先弄明白一件事。"}
            </h2>
          </div>
        </div>
        {returning ? (
          <div className="rd-history-list">
            {notebook.entries.slice(0, 2).map((e) => (
              <Link key={e.id} to={e.url}>
                <BookOpen size={22} />
                <div>
                  <b>{e.title}</b>
                  <p>{e.detail}</p>
                  <small>
                    你主动保存于 {new Date(e.at).toLocaleDateString("zh-CN")}
                  </small>
                </div>
                <ChevronRight size={20} />
              </Link>
            ))}
            {history?.continue.slice(0, 2).map((t) => (
              <Link to={t.url} key={t.url}>
                <Clock size={22} />
                <div>
                  <b>{t.title}</b>
                  <p>{t.detail}</p>
                  <small>来自现有账户的真实记录</small>
                </div>
                <ChevronRight size={20} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rd-start-strip">
            <span className="rd-step-number">01</span>
            <div>
              <h3>从「钱没少，购买力却变了」开始。</h3>
              <p>读一个生活例子 → 拖动一个滑块 → 保存你的一句发现。</p>
            </div>
            <Link className="rd-button" to="/decoder/purchasing-power">
              开始这一站 <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </section>
      <section className="rd-notebook-banner">
        <div className="rd-book-visual">
          <FinButton size={146} />
          <span className="rd-book-tag">我的发现手册</span>
        </div>
        <div>
          <span className="rd-kicker">
            My World · 每一次想明白，都可以留下来
          </span>
          <h2>
            把“我懂了”，
            <br />
            变成下次找得到的发现。
          </h2>
          <p>
            {notebook.entries.length
              ? `这本浏览器手册里，已经有 ${notebook.entries.length} 张你亲手保存的记录。`
              : "一段解读、一张计算小票、一个分清的概念。从第一张开始，慢慢积累。"}
          </p>
          <Link className="rd-button" to="/profile">
            打开我的发现手册 <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
export function Discover() {
  return (
    <div className="rd-page">
      <div className="rd-heading rd-discover-heading">
        <div>
          <span className="rd-kicker">Discover · FinPilot 编辑室</span>
          <h1>
            把世界的消息，
            <br />
            读成自己的理解。
          </h1>
          <p>
            从可信资料与生活问题出发。这里没有热搜倒计时，只有值得停下来想一想的事。
          </p>
        </div>
        <FinArt action="card" size={150} />
      </div>
      <div className="rd-editor-note">
        <span>本期主题</span>
        <b>钱、时间，以及那些容易混淆的数字。</b>
        <small>原创教学与专题导读 · 非实时新闻流</small>
      </div>
      <StoryGrid />
      <section className="rd-next-strip">
        <div>
          <h2>还想沿着一个问题继续找？</h2>
          <p>旧有资料目录、课程和相关话题讨论仍保留。</p>
        </div>
        <Link className="rd-secondary" to="/discover/library">
          查看资料库 <ArrowUpRight size={17} />
        </Link>
        <Link className="rd-text-link" to="/fintalk">
          相关讨论
        </Link>
      </section>
    </div>
  );
}
export function Notebook() {
  const n = useNotebook();
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState("all");
  const entries = n.entries.filter(
    (e) => filter === "all" || e.kind === filter,
  );
  return (
    <div className="rd-page">
      <div className="rd-heading rd-heading-row">
        <div>
          <span className="rd-kicker">My World · {n.scope}</span>
          <h1>我的金融发现手册。</h1>
          <p>真正算过的数字，亲手分清的概念，还有想继续追问的事。</p>
        </div>
        <FinButton size={122} />
      </div>
      <div className="rd-notice">
        Gate A 原型记录保存在本浏览器，按访客 /
        当前账户分开；不跨设备同步，不替代已有账户记录。
        <Link to="/profile/history">查看原有学习记录 →</Link>
      </div>
      <div className="rd-filter" role="group" aria-label="记录类型">
        {[
          ["all", "全部发现"],
          ["reading", "金融解读"],
          ["receipt", "实验小票"],
          ["concept", "概念卡"],
        ].map(([v, t]) => (
          <button
            key={v}
            aria-pressed={filter === v}
            onClick={() => setFilter(v)}
          >
            {t}
          </button>
        ))}
      </div>
      {entries.length ? (
        <div className="rd-notebook-grid">
          {entries.map((e) => (
            <article className={"rd-entry " + e.kind} key={e.id}>
              <div className="rd-row">
                <span className="rd-kicker">
                  {e.kind === "receipt"
                    ? "Money Receipt"
                    : e.kind === "reading"
                      ? "一次阅读发现"
                      : "一张概念卡"}
                </span>
                <Bookmark size={19} />
              </div>
              <h2>{e.title}</h2>
              <p>{e.detail}</p>
              <small>
                {new Date(e.at).toLocaleString("zh-CN")} · 本浏览器保存
              </small>
              <Link className="rd-text-link" to={e.url}>
                {e.kind === "receipt" ? "恢复参数并重新计算" : "回到这次探索"}{" "}
                <ArrowUpRight size={17} />
              </Link>
              {e.kind === "receipt" && (
                <small>包含原始参数、结果与公式版本</small>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rd-empty-notebook">
          <FinArt action="notebook" size={150} />
          <div>
            <h2>
              {filter === "all"
                ? "第一张发现，等你来写。"
                : "这一页，暂时还没有记录。"}
            </h2>
            <p>这里不会自动填入别人的故事。算一次小目标，再把结果收进来。</p>
            <Link className="rd-button" to="/money-lab">
              做一次储蓄实验 <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      )}
      <section className="rd-next-strip">
        <div>
          <h2>继续已有的学习</h2>
          <p>原有路线、复习与 Notebook 数据保留，没有重置。</p>
        </div>
        <Link className="rd-secondary" to="/learn">
          学习路线
        </Link>
        <Link className="rd-secondary" to="/review">
          复习一下
        </Link>
        <Link className="rd-text-link" to="/copilot">
          和 Fin 继续聊
        </Link>
      </section>
      <div className="rd-account-strip">
        {user ? (
          <>
            <span>已登录：{user.name}</span>
            <button className="rd-text" onClick={() => logout()}>
              退出当前账户
            </button>
          </>
        ) : (
          <Link className="rd-text-link" to="/login">
            登录现有账户 →
          </Link>
        )}
      </div>
    </div>
  );
}
export function StoryPreview() {
  const { slug } = useParams();
  const t = topics.find((t) => t.id === slug);
  const content: Record<
    string,
    { lead: string; sections: [string, string][]; url: string; button: string }
  > = {
    budget: {
      lead: "预算不是把每一笔钱都关起来，而是先看见：哪些承诺已经作出，哪些选择还握在手里。",
      sections: [
        [
          "先分清“必须支付”与“可以调整”",
          "用一个教学例子开始：每月可用 2,500 元，先列住宿、基础餐饮、交通与通信，再单独记录娱乐和可推迟的购买。不要把每一笔娱乐支出都当作错误；真正要检查的是总额是否超过可靠收入，以及意外支出从哪里来。",
        ],
        [
          "给意外留一个位置",
          "预算中的应急储备是用途安排，不是消费项目。先确定你需要承担的风险、获得支持的方式与资金取用条件，再设储备目标。没有一个比例适合所有大学生。",
        ],
        [
          "现在可以做的练习",
          "先把一个真实储备目标带进储蓄规划器，计算按月存入的结果。完整的固定/弹性支出录入、预算情景变化与预算小票将在 Gate B 经批准后实现。",
        ],
      ],
      url: "/money-lab",
      button: "先算一个储备目标",
    },
    bonds: {
      lead: "新闻里的“降息”，首先是一个政策动作。债券的价格，还要回答市场要求多少回报，以及这个动作是否早已被预期。",
      sections: [
        [
          "先问“哪一个利率”",
          "政策利率、银行报价、债券市场收益率不是同一个数字。一条政策消息可能影响预期，但不能把政策调整幅度直接填进所有债券的折现率。此处是机制教学，不引用虚构的当期降息事件。",
        ],
        [
          "保持现金流不变，再改变折现率",
          "已有实验使用面值 1,000 元、每年付息 50 元、剩余 5 年的纯教学债券。把市场要求收益率调高，同一笔未来现金流折回今天会更少；调低则相反。前提是其他条件不变。",
        ],
        [
          "为什么现实里未必上涨",
          "市场可能已经预先计价，也可能同时出现信用、流动性或风险偏好的变化。Gate B 将补齐有日期的政策案例、证据链与事件脉络；现在先通过保留的真实定价实验理解一个变量。",
        ],
      ],
      url: "/lab/5",
      button: "操作已有债券定价实验",
    },
    loan: {
      lead: "每月还得起，和总成本低，是两个问题。先把到账、每次还款与附加费用放到同一条时间线上。",
      sections: [
        [
          "利率口径需要一起看",
          "同样写着一个百分比，年名义利率、有效年率和包含某些费用的 APR 未必可直接互换。APR 的具体法定口径因地区与产品不同；本导读不把它们混成一个万能数字。",
        ],
        [
          "延长期限不等于减少总成本",
          "在相同本金与正利率的标准等额本息模型下，延长期限通常降低月供，却增加累计利息。若存在服务费、提前还款费用或不同现金流时点，要把这些条件单独说明。不能只看一个“日息很低”的展示值。",
        ],
        [
          "本轮能力边界",
          "Gate A 尚未实现贷款成本计算器，所以这里不输出伪造的月供或“最优方案”。可以先查看已有 APR/APY 概念对照；真实还款模型、费用对比与贷款 Receipt 需要 Gate B 批准后开发并测试。",
        ],
      ],
      url: "/compare/apr-apy",
      button: "先分清 APR 与 APY",
    },
  };
  const c = content[slug || ""];
  if (!t || !c)
    return (
      <div className="rd-page">
        <h1>这条专题入口不存在。</h1>
        <Link to="/discover">返回发现</Link>
      </div>
    );
  return (
    <div className="rd-page rd-preview">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 专题导读
      </div>
      <div className="rd-preview-hero">
        <div>
          <span className="rd-kicker">{t.tag} · 原创教学导读</span>
          <h1>{t.title}</h1>
          <p>{c.lead}</p>
        </div>
        <StoryArt kind={t.id} />
      </div>
      <div className="rd-notice">
        Gate A 范围说明：这是有实质内容的导读和已有能力入口；完整专题与新工具在
        Gate B 人工批准后深化。
      </div>
      <article className="rd-reader">
        {c.sections.map(([h, p], i) => (
          <section key={h}>
            <span className="rd-kicker">0{i + 1}</span>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
        <Link className="rd-button" to={c.url}>
          {c.button}
          <ArrowUpRight size={17} />
        </Link>
        <p className="rd-source">
          此页为教学解释，不是新闻、贷款报价或投资建议。所连接的原实验 /
          对照页有具体假设与来源说明。
        </p>
      </article>
    </div>
  );
}
export function Methods() {
  return (
    <div className="rd-page rd-reader">
      <h1>方法与数据说明</h1>
      <section>
        <h2>三类能力，清楚区分</h2>
        <p>
          编辑内容是站内原创教学与官方资料的机制解释，不冒充实时新闻。财务计算由
          FastAPI 确定性数学模型完成，不交给 AI 猜数。当前 AI 为
          Demo，复用已有上下文解释能力，不声称核实任意用户文章。
        </p>
      </section>
      <section>
        <h2>Gate A 的保存范围</h2>
        <p>
          新发现、Money Receipt 与概念卡存于浏览器 localStorage，按当前账户 ID
          或访客分区。清除浏览器数据会丢失这些原型记录；没有跨设备同步、数据库迁移或完整权限隔离承诺。请只用于本地审查，不输入敏感财务信息。原服务器学习数据仍由已有登录及归属检查保护。
        </p>
      </section>
      <section>
        <h2>可以复核的计算</h2>
        <p>
          储蓄模型按年名义收益率除以 12 逐月复利，支持月初 /
          月末投入、零利率与反推目标月存；展示到分，过程不逐月舍入。通胀实验复用原后端公式。完整公式和输入边界见各工具。贷款和预算的新计算器尚未实现。
        </p>
      </section>
      <section>
        <h2>数据与隐私</h2>
        <p>
          SQLite 仅位于 V3 本地目录；没有上传数据库或私密凭据。Demo
          登录账号提供在登录页面。外部资料打开第三方站点；若日后配置 External
          AI，问题与必要上下文可能发送给服务商，当前不进行此类调用。
        </p>
      </section>
      <Link className="rd-text-link" to="/fin-design">
        查看 Fin 完整角色设定 →
      </Link>
    </div>
  );
}
