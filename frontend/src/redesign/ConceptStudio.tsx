import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Bookmark } from "lucide-react";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import { useNotebook } from "./state";
import { FinArt } from "./Fin";
const cases = [
  {
    title: "跟踪宽基指数的 ETF",
    trade: true,
    index: true,
    detail: "既在交易所交易，也以跟踪指数为目标。它同时属于 ETF 和指数基金。",
  },
  {
    title: "主动管理的 ETF",
    trade: true,
    index: false,
    detail:
      "在交易所交易，但由管理人主动选择持仓。ETF 的形式并没有规定它一定跟踪指数。",
  },
  {
    title: "场外指数共同基金",
    trade: false,
    index: true,
    detail: "以跟踪指数为目标，但通过场外申购赎回；它是指数基金，却不是 ETF。",
  },
];
export function ConceptPlay({ compact = false }: { compact?: boolean }) {
  const [current, setCurrent] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const c = cases[current];
  return (
    <div className={"rd-concept-play " + (compact ? "compact" : "")}>
      <div
        className="rd-concept-switch"
        role="group"
        aria-label="选择一个基金案例"
      >
        {cases.map((v, i) => (
          <button
            key={v.title}
            aria-pressed={current === i}
            onClick={() => setCurrent(i)}
          >
            {v.title}
          </button>
        ))}
      </div>
      <div className="a1-matrix-wrap">
        <div className="a1-matrix-caption">
          <span>↓ 交易形式</span>
          <span>投资策略 →</span>
        </div>
        <div
          className="a1-matrix"
          role="group"
          aria-label="交易形式与投资策略分类矩阵"
        >
          <span className="a1-axis-corner">两条分类线</span>
          <b className="a1-column-label">跟踪指数</b>
          <b className="a1-column-label">主动管理</b>
          <b className="a1-row-label">
            ETF<small>交易所交易</small>
          </b>
          {[0, 1].map((i) => (
            <button
              key={i}
              aria-pressed={current === i}
              onClick={() => setCurrent(i)}
            >
              <span className="a1-matrix-point">
                {current === i ? "●" : "○"}
              </span>
              <strong>{cases[i].title}</strong>
              <small>
                {i === 0 ? "形式与策略的交集" : "ETF 也可以不跟踪指数"}
              </small>
            </button>
          ))}
          <b className="a1-row-label">
            非 ETF<small>场外申购赎回</small>
          </b>
          <button aria-pressed={current === 2} onClick={() => setCurrent(2)}>
            <span className="a1-matrix-point">{current === 2 ? "●" : "○"}</span>
            <strong>场外指数共同基金</strong>
            <small>指数基金也可以不是 ETF</small>
          </button>
          <div className="a1-matrix-context">
            <span>场外主动基金</span>
            <small>
              补充分类位置
              <br />
              当前三个案例未覆盖此格
            </small>
          </div>
        </div>
        <div className="a1-selection">
          <span>当前案例</span>
          <b>
            {c.trade ? "ETF 形式" : "非 ETF 形式"} ×{" "}
            {c.index ? "指数策略" : "主动策略"}
          </b>
          <small>点击交点或上方案例切换</small>
        </div>
      </div>
      <p className="rd-concept-feedback" aria-live="polite">
        {c.detail}
      </p>
      {compact && (
        <div className="rd-mini-question">
          <b>小判断：所有 ETF 都跟踪指数吗？</b>
          <div>
            <button
              className="rd-secondary"
              aria-pressed={answer === 0}
              onClick={() => setAnswer(0)}
            >
              是的
            </button>
            <button
              className="rd-secondary"
              aria-pressed={answer === 1}
              onClick={() => setAnswer(1)}
            >
              不一定
            </button>
          </div>
          {answer !== null && (
            <p role="status">
              {answer === 1
                ? "对。ETF 是形式，跟踪指数是策略。两者有交集。"
                : "再看“主动管理的 ETF”：它在交易所交易，但不必跟踪指数。"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
export default function ConceptStudio() {
  const { user } = useAuth();
  const notebook = useNotebook();
  const [answer, setAnswer] = useState<number | null>(null),
    [feedback, setFeedback] = useState(""),
    [busy, setBusy] = useState(false),
    [correct, setCorrect] = useState(false),
    [saved, setSaved] = useState(false);
  async function check(i: number) {
    setAnswer(i);
    setCorrect(false);
    setSaved(false);
    setBusy(true);
    try {
      if (user)
        await api("/v3/compare/etf-index-fund/check", "POST", { answer: i });
      setCorrect(i === 2);
      setFeedback(
        [
          "“所有”是关键陷阱。主动管理 ETF 就是反例：交易形式不会自动决定投资策略。试着切换上方第二个案例。",
          "“必须”把策略误当成了形式。场外指数共同基金也跟踪指数，但不在交易所盘中买卖。试着切换第三个案例。",
          "你把两个维度分开了：ETF 回答怎么买卖，指数策略回答如何选择投资组合。两者是交叉关系。",
        ][i],
      );
    } catch (e) {
      setFeedback((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/">首页</Link> / 学概念 / ETF 与指数基金
      </div>
      <div className="rd-heading rd-heading-row">
        <div>
          <span className="rd-kicker">
            Concept Studio · 不背定义，试着拆开它
          </span>
          <h1>
            ETF 和指数基金，
            <br />
            不是同一条分类线。
          </h1>
          <p>
            换一个案例，看看“交易形式”和“投资策略”怎样组合。5
            分钟，分清一个常见混淆。
          </p>
        </div>
        <FinArt mood="curious" size={130} />
      </div>
      <div className="rd-concept-topline">
        <span>01 操作图解</span>
        <span>02 做个判断</span>
        <span>03 留下理解</span>
      </div>
      <section className="rd-sheet">
        <div className="rd-section-head">
          <div>
            <span className="rd-kicker">动手拆一拆</span>
            <h2>同一只基金，可以有两种身份。</h2>
          </div>
          <span className="rd-tag">三个教学案例 · 非具体产品</span>
        </div>
        <ConceptPlay />
      </section>
      <div className="rd-concept-bottom">
        <section className="rd-quiz">
          <span className="rd-kicker">轮到你来判断</span>
          <h2>下面哪句话更准确？</h2>
          <p>选错也没关系，重点是找出哪一个条件被偷换了。</p>
          {[
            "所有 ETF 都跟踪指数",
            "指数基金必须是 ETF",
            "ETF 是形式，指数跟踪是策略",
          ].map((t, i) => (
            <button
              className={"rd-answer " + (answer === i ? "chosen" : "")}
              key={t}
              disabled={busy}
              onClick={() => check(i)}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {t}
              {answer === i && correct && <Check size={19} />}
            </button>
          ))}
          {feedback && (
            <div
              className={"rd-answer-feedback " + (correct ? "correct" : "")}
              role="status"
            >
              <b>{correct ? "分清了，两条线。" : "看看这个条件。"}</b>
              <p>{feedback}</p>
            </div>
          )}
          <small>
            {user
              ? "判断通过已有后端记录，纳入当前账户的概念复习。"
              : "访客练习仅展示反馈；登录后才写入既有概念复习记录。"}
          </small>
        </section>
        <aside className="rd-concept-note">
          <FinArt action={saved ? "notebook" : "card"} size={100} />
          <h2>记住这个问题，比记术语更有用。</h2>
          <p>下次看到一个基金名称，分别问：</p>
          <ol>
            <li>它在哪里、以什么方式交易？</li>
            <li>它按什么策略选择投资组合？</li>
            <li>它的费用、流动性和跟踪误差是什么？</li>
          </ol>
          <p>指数策略不等于保本；可以交易，也不等于任何时候都容易成交。</p>
          <button
            className="rd-button"
            disabled={!correct || notebook.loading}
            onClick={() => {
              if (
                notebook.save({
                  id: "concept-etf",
                  kind: "concept",
                  title: "ETF × 指数基金：两条分类线",
                  url: "/concept-studio",
                  detail: "已正确判断：ETF 是交易形式，指数跟踪是策略。",
                  payload: { comparison: "etf-index-fund", choice: 2 },
                })
              )
                setSaved(true);
            }}
          >
            <Bookmark size={17} />
            {saved ? "概念卡已放进手册" : "答对后保存概念卡"}
          </button>
          <small>本浏览器原型保存；不把一次答对当作完全掌握。</small>
          {notebook.error && <p role="alert">{notebook.error}</p>}
        </aside>
      </div>
      <section className="rd-next-strip">
        <div>
          <h2>让这次理解，接上下一步。</h2>
          <p>已有课程、路线和复习服务仍然保留。</p>
        </div>
        <Link to="/learn" className="rd-secondary">
          进入学习路线 <ArrowRight size={16} />
        </Link>
        <Link to="/compare/etf-index-fund" className="rd-text-link">
          查看原概念对照
        </Link>
      </section>
      <p className="rd-source">
        依据：
        <a
          href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24"
          target="_blank"
          rel="noreferrer"
        >
          Investor.gov · Exchange-Traded Funds ↗
        </a>
        。本页为原创教学图解，不是产品筛选建议。
      </p>
    </div>
  );
}
