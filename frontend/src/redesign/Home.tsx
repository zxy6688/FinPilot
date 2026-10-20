import { WorldShelf } from "./WorldShelf";
import { LearningTrail } from "./KnowledgeCenter";
import { EntryActions, entrySummary } from "./EntryActions";
import { learningStorage } from "../services/learningStorage";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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
  if (["budget", "loan", "bonds"].includes(kind))
    return (
      <img
        className="gb-home-story-art"
        src={"/redesign/gate-b/" + kind + "-studio.png"}
        alt="原创教学情景插画"
      />
    );
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
              <span className="rd-text-link">阅读与动手探索 ↗</span>
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
        return learningStorage.getItem("finpilot:exploration-question") || "";
      } catch {
        return "";
      }
    }),
    [match, setMatch] = useState<ExplorationMatch | null>(null);
  function routeQuestion() {
    const result = findExploration(question);
    if (result.destination) nav(result.destination);
    else setMatch(result);
  }
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
            搜索站内专题和工具
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
                  learningStorage.setItem(
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
            输入你的困惑，选择相关专题或工具；这里不会直接生成答案。
          </small>
          <div className="rd-question-chips">
            <Link to="/stories/bonds">降息后，债券一定涨吗？</Link>
            <Link to="/money-lab">每月存 500 元，两年后呢？</Link>
            <Link to="/concept-studio/7">ETF ≠ 指数基金？</Link>
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
            {match.suggestions.map((item, index) => (
              <Link key={item.id} to={item.path}>
                <b>
                  {item.title}
                  <ArrowUpRight size={16} />
                </b>
                <small>
                  {match.kind === "unknown" ? "通用起点" : "与你提到的主题相关"}{" "}
                  ·{" "}
                  {item.path.includes("money-lab")
                    ? "财务工具"
                    : item.path.includes("concept")
                      ? "概念互动"
                      : "互动专题"}{" "}
                  · {index === 0 ? "建议先试" : "也可以探索"}：{item.scope}
                </small>
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
          <p>从六个领域，找到你想弄懂的概念。</p>
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
            <span>选一个概念，观察、练习并继续</span>
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
        <div className="rd-story-grid k-feature-only">
          <Link className="rd-feature-story" to="/stories/budget">
            <div>
              <span className="rd-kicker">本期精选 · 从大学生活费开始</span>
              <h3>
                给每一笔钱，
                <br />
                安排一个去处。
              </h3>
              <p>
                一次突发支出，会怎样改变月底？从分类到比较，再留下自己的预算实验。
              </p>
              <span className="rd-text-link">进入大学生的第一份预算 →</span>
            </div>
            <StoryArt kind="budget" />
          </Link>
        </div>
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
          <Link to="/money-lab/compound">
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
      <LearningTrail compact />
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
              ? `这本发现手册里，已经有 ${notebook.entries.length} 张你亲手保存的记录。`
              : "一段解读、一张计算小票、一个分清的概念。从第一张开始，慢慢积累。"}
          </p>
          {notebook.entries.slice(0, 2).map((e) => (
            <Link key={e.id} className="gb-home-discovery" to={e.url}>
              <b>{e.title}</b>
              <span>{e.detail}</span>
            </Link>
          ))}
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
  const [search, setSearch] = useState(""),
    [order, setOrder] = useState("newest");
  const entries = n.entries
    .filter(
      (e) =>
        (filter === "all" || e.kind === filter) &&
        (e.title + entrySummary(e) + JSON.stringify(e.payload || {}))
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => (order === "newest" ? -1 : 1) * a.at.localeCompare(b.at));
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
        {user
          ? "已登录：新记录保存到当前账户，可在同一服务的其他浏览器登录恢复。历史浏览器原型记录仍保留在本机，不自动合并。"
          : "访客记录仅保存在此浏览器，不跨设备。登录后新保存的记录归属当前账户；访客记录不自动上传。"}
        <Link to="/profile/history">查看原有学习记录 →</Link>
      </div>
      {n.error && <p role="alert">{n.error}</p>}
      {n.entries[0] && (
        <section className="gb-recent-discovery">
          <FinArt action="notebook" size={112} />
          <div>
            <span className="rd-kicker">最近留下的一张发现</span>
            <h2>{n.entries[0].title}</h2>
            <p>{n.entries[0].detail}</p>
            <Link className="rd-text-link" to={n.entries[0].url}>
              接着这次探索 →
            </Link>
          </div>
        </section>
      )}
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
      <div className="rd-actions">
        <label>
          查找我的记录
          <input
            aria-label="查找我的记录"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名称、参数或笔记"
          />
        </label>
        <label>
          排序
          <select
            aria-label="记录排序"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="newest">最新在前</option>
            <option value="oldest">最早在前</option>
          </select>
        </label>
      </div>
      {entries.length ? (
        <div className="rd-notebook-grid">
          {entries.map((e) => (
            <article className={"rd-entry " + e.kind} key={e.id}>
              <div className="rd-row">
                <span className="rd-kicker">
                  {e.kind === "receipt"
                    ? "实验小票"
                    : e.kind === "reading"
                      ? "一次阅读发现"
                      : "一张概念卡"}
                </span>
                <Bookmark size={19} />
              </div>
              <h2>{e.title}</h2>
              <p>{e.detail}</p>
              <p className="gb-help">{entrySummary(e)}</p>
              {e.kind === "receipt" &&
                typeof (e.payload as { note?: unknown })?.note === "string" &&
                (e.payload as { note: string }).note && (
                  <p className="gb-help">
                    我的发现：{(e.payload as { note: string }).note}
                  </p>
                )}
              <small>
                {new Date(e.at).toLocaleString("zh-CN")} ·{" "}
                {e.storage === "account" ? "账户保存" : "仅此浏览器"}
              </small>
              <Link className="rd-text-link" to={e.url}>
                {e.kind === "receipt" ? "恢复参数并重新计算" : "回到这次探索"}{" "}
                <ArrowUpRight size={17} />
              </Link>
              <EntryActions entry={e} manage={n.manage} />
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
            <p>
              没有符合当前筛选的记录。可以换个关键词，或先做一次实验并保存。
            </p>
            <Link className="rd-button" to="/money-lab">
              做一次储蓄实验 <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      )}
      <LearningTrail />
      <WorldShelf />
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
  return t && t.path !== "/stories/" + slug ? (
    <Navigate replace to={t.path} />
  ) : (
    <div className="rd-page">
      <h1>这份专题还不存在。</h1>
      <Link to="/discover">返回五个精选专题 →</Link>
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
        <h2>账户与访客的保存范围</h2>
        <p>
          登录后的新发现、实验小票与概念卡保存到当前账户，访问同一个服务并登录可跨浏览器恢复。访客与
          A1
          历史本机记录仍在浏览器中，明确标注“仅此浏览器”，不自动上传或合并。清除浏览器数据会丢失本机记录。网络保存失败时不会显示成功，可保留输入重试。
        </p>
      </section>
      <section>
        <h2>可以复核的计算</h2>
        <p>
          储蓄区分月初/月末与年名义/年有效口径；复利明确计息频率；通胀按物价折算实际购买力；贷款按净到账与逐月付款计算有效成本，不标作监管
          APR；预算分开实际支出与计划储备。每套工具都公开假设、限制及历史结果，数值由确定性后端计算。
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
