import { WorldShelf } from "./WorldShelf";
import { LearningTrail } from "./KnowledgeCenter";
import { EntryActions, entrySummary } from "./EntryActions";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,


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
  const notebook = useNotebook();
  const { user } = useAuth();
  const recent = user?.email !== "demo@finpilot.app" && [...notebook.entries]
    .sort((a,b) => b.at.localeCompare(a.at))
    .find(e => /^\/(money-lab\/(savings|loan|inflation|compound|budget)|stories\/(budget|bonds|etf|loan)|decoder\/purchasing-power|concept-studio\/([1-9]|[12]\d|3[0-6]))([?#]|$)/.test(e.url));
  const [question, setQuestion] = useState("");
  const [match, setMatch] = useState<ExplorationMatch | null>(null);
  function routeQuestion(value = question) {
    setQuestion(value);
    setMatch(findExploration(value));
  }
  return (
    <div className="rd-page rd-home">
      <section className="rd-hero">
        <div className="rd-hero-copy">
          <h1>FinPilot</h1>
          <strong>金融专题 · 交互计算 · 基础课程</strong>
          <p>涵盖个人预算、储蓄、购买力、债券、基金及基础金融概念。</p>
          <label
            className="a1-exploration-label"
            htmlFor="exploration-question"
          >
            查找内容
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
              }}
              placeholder="搜索专题、概念或工具"
            />
            <button type="submit">查找</button>
          </form>
          <small id="exploration-help" className="a1-exploration-help">
            仅检索站内内容。
          </small>
          <div className="rd-question-chips">
            {["每月生活费如何安排？", "通胀如何影响购买力？", "ETF 与指数基金有什么区别？"].map(example =>
              <button key={example} onClick={() => routeQuestion(example)}>{example}</button>
            )}
          </div>
        </div>
        <div className="rd-hero-scene">
          <img
            src="/redesign/a1/exploration-studio.png"
            alt="Fin 的金融探索桌：学习手册、增长图、信息剪报和计算器"
          />
          <FinButton scene />

        </div>
      </section>
      {match?.kind === "empty" && (
        <p className="a1-exploration-empty" role="status">
          请输入关键词，或选择一个示例问题。
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
                ? "找到多个相关主题"
                : match.kind === "unknown"
                  ? "没有找到直接对应的内容"
                  : "相关内容"}
            </b>
            <p>
              {match.kind === "mixed" ? "请选择这次要查看的内容。" : match.kind === "unknown" ? "可更换关键词，或进入专题、工具和概念目录查看。" : null}
            </p>
          </div>
          <div className="a1-suggestion-links">
            {match.suggestions.map((item) => (
              <Link key={item.id} to={item.path}>
                <b>
                  {item.title}
                  <ArrowUpRight size={16} />
                </b>
                <small>
                  {item.scope} · {item.path.startsWith("/money-lab") ? (item.id==="budget" ? "打开预算工具" : "打开工具") : item.path.startsWith("/concept") ? (item.id==="concept" ? "学习 ETF" : "查看概念") : "阅读专题"}
                </small>
              </Link>
            ))}
          </div>
          {/\d[\d,.]*\s*元/.test(question) && <p>识别到“{question.match(/(?:每月\s*)?\d[\d,.]*\s*元/)?.[0]}”。当前版本不会自动填入工具。</p>}
        </section>
      )}
      <section className="home-portals" aria-label="三项内容入口">
        {[
          ["专题阅读","通胀、债券、ETF 与个人财务","查看专题","/discover"],
          ["财务工具","预算、储蓄目标、购买力与贷款成本","选择工具","/money-lab"],
          ["概念学习","基础解释、实例与理解检查","查看概念","/concept-studio"]
        ].map(([title,desc,cta,path],i)=><Link key={path} to={path}><svg viewBox="0 0 180 85" aria-hidden="true">{i===0?<g transform="rotate(-8 90 42)"><rect x="41" y="13" width="95" height="66" rx="5" fill="#dbc993"/><rect x="48" y="7" width="95" height="66" rx="4" fill="#fffbed"/><path d="M60 22h60M60 39h40M60 51h54" stroke="#69948c" strokeWidth="5"/></g>:i===1?<g fill="none" strokeWidth="4"><path d="M24 65 Q80 68 150 14" stroke="#237e78"/><path d="M24 65 Q85 52 150 44" stroke="#d39b47"/></g>:<g>{["#539f97","#b2d5d0","#ecc983","#d6e4ec"].map((c,j)=><rect key={c} x={48+j%2*44} y={7+Math.floor(j/2)*37} width="40" height="33" rx="6" fill={c}/>)}</g>}</svg><h2>{title}</h2><p>{desc}</p><b>{cta} ↗</b></Link>)}
      </section>
      {recent && <section className="rd-next-strip"><div><span className="rd-kicker">继续上次 · {recent.kind==="receipt"?"工具":recent.kind==="concept"?"概念":"专题"} · {notebook.scope}</span><h2>{recent.title}</h2></div><Link className="rd-button" to={recent.url}>继续 →</Link><Link to="/profile">查看全部</Link></section>}
      {notebook.error && <p role="status">这条记录暂时无法打开，请在“我的世界”中查看。<Link to="/profile">打开我的世界</Link></p>}
      <section className="rd-home-section">
        <div className="rd-section-head">
          <div>
            <h2>专题精选</h2></div><Link to="/discover">全部专题 ↗</Link></div>
        <div className="home-budget"><div><small>个人财务 / 预算</small><h3>大学生生活费预算</h3><p>以一个月的生活费为例，区分固定支出、弹性支出和一次性支出，观察临时费用如何影响预计结余。</p><Link to="/stories/budget">阅读专题 ↗</Link></div><StoryArt kind="budget"/>
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
