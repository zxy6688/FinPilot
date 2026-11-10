import {ConceptEvidencePanel} from "./ConceptEvidencePanel";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import { useNotebook } from "./state";
import { snapshotId } from "./Experiments";
import { conceptById, journeyMap } from "./knowledgeData";
import "./concept-br.css";

const cases = [
  [
    "指数 ETF",
    "交易所买卖份额；组合按指数规则构建。",
    "核对跟踪指数、复制方法、费用与跟踪误差。",
  ],
  [
    "主动 ETF",
    "交易所买卖份额；管理人按投资目标主动选择持仓，不必跟踪指数。",
    "核对投资目标、选股或选债方法、持仓与费用。",
  ],
  [
    "场外指数基金",
    "通过基金或销售渠道申购赎回；策略以跟踪指数为目标。",
    "核对申赎安排、跟踪指数、费用与到账时间。",
  ],
  [
    "场外主动基金",
    "通过基金或销售渠道申购赎回；组合由管理人主动管理。",
    "核对投资范围、管理方法、申赎条件与费用。",
  ],
];
const original = conceptById(7)!;
const source =
  "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/characteristics-mutual-funds-exchange-traded-funds";
type State = {
  selected: number;
  answer: number | null;
  transfer: number | null;
  note: string;
  legacyChoice?: number;
};
const empty: State = { selected: 0, answer: null, transfer: null, note: "" };
const option = (v: unknown, max = 2) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : null;
function restore(value: unknown): State | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  if (p.concept_id !== 7 && p.comparison !== "etf-index-fund") return null;
  return {
    selected: option(p.selected ?? p.case, 3) ?? 0,
    answer: p.concept_id === 7 ? option(p.answer) : null,
    transfer: option(p.transfer),
    note: typeof p.note === "string" ? p.note : "",
    ...(option(
      p.legacyChoice ?? (p.comparison === "etf-index-fund" ? p.choice : null),
    ) !== null
      ? { legacyChoice: (p.legacyChoice ?? p.choice) as number }
      : {}),
  };
}
export function EtfCompatibility() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={"/concept-studio/7" + location.search + location.hash}
    />
  );
}
export default function EtfConcept() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  return (
    <EtfLearning
      key={
        (user?.id ?? "guest") +
        ":" +
        (params.get("entry") || params.get("concept") || "new")
      }
    />
  );
}
function EtfLearning() {
  const { user } = useAuth(),
    notebook = useNotebook();
  const [params] = useSearchParams();
  const entryId = params.get("entry") || params.get("concept");
  const draftKey =
    "finpilot:etf-draft:" + (user?.id ?? "guest") + ":" + (entryId || "new");
  const [state, setState] = useState<State>(empty),
    [baseline, setBaseline] = useState(JSON.stringify(empty));
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [saveError, setSaveError] = useState("");
  const [review, setReview] = useState(""),
    [reviewBusy, setReviewBusy] = useState(false),
    [restored, setRestored] = useState(!entryId);
  const [savedUrl, setSavedUrl] = useState("");
  const initialized = useRef(false),
    touched = useRef(false);
  const dirty = JSON.stringify(state) !== baseline;
  useEffect(() => {
    const key = "finpilot:knowledge:recent:" + (user?.id ?? "guest");
    try {
      const recent = JSON.parse(localStorage.getItem(key) || "[]") as {
        id: number;
        at: string;
      }[];
      localStorage.setItem(
        key,
        JSON.stringify(
          [
            { id: 7, at: new Date().toISOString() },
            ...recent.filter((x) => x.id !== 7),
          ].slice(0, 16),
        ),
      );
    } catch {
      /* Viewing is possible without browser storage. */
    }
  }, [user?.id]);
  useEffect(() => {
    if (initialized.current || notebook.loading || (entryId && notebook.error))
      return;
    let next = empty;
    if (entryId) {
      const entry = notebook.entries.find((e) => e.id === entryId);
      const recovered = restore(entry?.payload);
      if (!recovered) {
        setStatus(
          entry
            ? "这条记录不是可恢复的 ETF 概念记录。可以继续阅读，原记录未被修改。"
            : "未找到这条记录。请确认账户；记录可能已删除或仅保存在原浏览器。",
        );
        initialized.current = true;
        return;
      }
      next = recovered;
      setStatus("已恢复历史记录。即时答案与正式复习记录分别保存。");
      setRestored(true);
    }
    setBaseline(JSON.stringify(next));
    try {
      const draft = sessionStorage.getItem(draftKey);
      if (draft) {
        next = { ...next, ...JSON.parse(draft) };
        setStatus("已恢复此标签页的未保存草稿。请保存到发现手册。");
      }
    } catch {
      /* Storage may be unavailable; editing still works. */
    }
    if (!touched.current) setState(next);
    initialized.current = true;
  }, [notebook.loading, notebook.entries, notebook.error, entryId, draftKey]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function change(update: Partial<State>) {
    touched.current = true;
    const next = { ...state, ...update };
    setState(next);
    setStatus("");
    setSaveError("");
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      setStatus("临时草稿存储不可用；离开前请保存笔记。");
    }
  }
  async function save() {
    setBusy(true);
    setSaveError("");
    const snapshot = { ...state };
    try {
      const payload = { concept_id: 7, revision: "concept-7-r1", ...snapshot };
      const id = await snapshotId("knowledge-7-r1", payload);
      const url = "/concept-studio/7?entry=" + id;
      if (
        await notebook.save({
          id,
          kind: "concept",
          title: "ETF · 我的笔记",
          url,
          detail: snapshot.note || "已保存分类案例与即时练习；不代表已掌握",
          payload,
        })
      ) {
        setBaseline(JSON.stringify(snapshot));
        setSavedUrl(url);
        setStatus(
          "笔记与互动状态已保存。继续编辑后可保存为新记录，旧记录保留。",
        );
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* already persisted */
        }
      } else setSaveError("保存未完成，草稿仍在页面中，请重试。");
    } catch {
      setSaveError("保存失败，草稿仍在页面中，请重试。");
    } finally {
      setBusy(false);
    }
  }
  const from = params.get("from");
  const returnParam = params.get("return") || "";
  const returnUrl = /^\/concept-studio(?:\?[^#]*)?$/.test(returnParam)
    ? returnParam
    : "/concept-studio";
  const canEdit = !notebook.loading && (!entryId || restored);
  return (
    <div className="rd-page cs-detail">
      <nav className="cs-breadcrumb">
        <Link to={returnUrl}>学概念</Link>
        <span>/</span>
        <Link to="/concept-studio?domain=products">投资产品</Link>
        <span>/ ETF</span>
      </nav>
      {from && Object.hasOwn(journeyMap, from) && (
        <Link className="rd-text-link" to={from}>
          返回刚才的专题 / 工具 →
        </Link>
      )}
      <header className="cs-detail-cover">
        <div>
          <span>投资产品 · 入门</span>
          <h1>ETF</h1>
          <p>
            ETF
            是一类可以在证券交易所交易的基金。交易形式与投资策略需要分别判断：ETF
            可以跟踪指数，也可以主动管理。
          </p>
        </div>
        <img
          src="/redesign/gate-b/etf-studio.png"
          alt="基金资料与分类研究工作台"
        />
      </header>
      <ConceptEvidencePanel key={review} answer={state.answer!==null || state.transfer!==null} noteSaved={!!savedUrl || (!!entryId&&restored&&!dirty)} quizId={13} lessonIds={[7]}/>
      <div className="cs-detail-layout">
        <article>
          <section className="cs-block" id="etf-definition">
            <h2>定义与适用范围</h2>
            <ReactMarkdown>{original.explain}</ReactMarkdown>
            <p>
              指数基金按投资策略分类，以跟踪指数为目标；ETF
              则描述基金的交易形式。二者有交集，不能互相替代。
            </p>
            <div className="cs-callout">
              <h3>案例：交易价格不等于净值</h3>
              <ReactMarkdown>{original.example}</ReactMarkdown>
            </div>
            <p className="cs-muted">
              本页分类参考美国 SEC
              投资者教育资料中的基金范围，不涵盖所有交易所交易产品。不同市场的产品名称、法律结构和规则可能不同，具体产品以公开文件为准。
            </p>
          </section>
          <section className="cs-block" id="etf-matrix">
            <h2>交易形式与投资策略</h2>
            <p>
              点击四个位置，分别核对“怎么买卖”和“如何选择持仓”。以下是教学类别，不是具体产品推荐。
            </p>
            <div className="cs-matrix" role="group" aria-label="基金分类矩阵">
              <span>
                交易形式 ↓<br />
                投资策略 →
              </span>
              <b>跟踪指数</b>
              <b>主动管理</b>
              <b>ETF</b>
              {[0, 1].map((i) => (
                <button
                  key={i}
                  disabled={busy || !canEdit}
                  aria-pressed={state.selected === i}
                  onClick={() => change({ selected: i })}
                >
                  {cases[i][0]}
                </button>
              ))}
              <b>非 ETF</b>
              {[2, 3].map((i) => (
                <button
                  key={i}
                  disabled={busy || !canEdit}
                  aria-pressed={state.selected === i}
                  onClick={() => change({ selected: i })}
                >
                  {cases[i][0]}
                </button>
              ))}
            </div>
            <div className="cs-matrix-result" aria-live="polite">
              <h3>当前案例：{cases[state.selected][0]}</h3>
              <p>{cases[state.selected][1]}</p>
              <p>{cases[state.selected][2]}</p>
            </div>
            <div className="cs-distinction">
              <div>
                <h3>ETF 不一定是指数基金</h3>
                <p>主动 ETF 在交易所交易，但不以复制指数为必要条件。</p>
              </div>
              <div>
                <h3>指数基金不一定是 ETF</h3>
                <p>场外指数基金也能跟踪指数，但采用不同的申购赎回安排。</p>
              </div>
            </div>
          </section>
          <section className="cs-block" id="etf-boundary">
            <h2>费用、风险与使用边界</h2>
            <ReactMarkdown>{original.misunderstanding}</ReactMarkdown>
            <p>{original.boundary}</p>
            <details>
              <summary>阅读产品文件时检查什么</summary>
              <ReactMarkdown>{original.life}</ReactMarkdown>
            </details>
          </section>
          <section className="cs-block" id="etf-practice">
            <h2>理解检查</h2>
            <h3>{original.quiz.question}</h3>
            {original.quiz.options.map((text, i) => (
              <button
                className="cs-choice"
                key={text}
                disabled={busy || !canEdit}
                aria-pressed={state.answer === i}
                onClick={() => {
                  change({ answer: i });
                  setReview("");
                }}
              >
                {String.fromCharCode(65 + i)} · {text}
              </button>
            ))}
            {state.answer !== null && (
              <p className="cs-feedback" role="status">
                {
                  [
                    "名称热门不能说明持仓、策略或风险。请先阅读产品文件，核对投资目标。",
                    "判断正确。产品文件说明投资目标、持仓范围与机制；指数型产品还需核对跟踪标的。",
                    "一天的涨幅排名只描述过去的价格变化，不能说明基金持有什么或承担哪些风险。",
                  ][state.answer]
                }
              </p>
            )}
            <p className="cs-muted">
              选择答案只显示即时反馈。原题 13
              可以主动提交到课程复习；一次答对不代表已掌握。
            </p>
            {user && (
              <button
                className="rd-secondary"
                disabled={
                  state.answer === null || reviewBusy || !!review || !canEdit
                }
                onClick={async () => {
                  setReviewBusy(true);
                  try {
                    await api("/quizzes/13/answer", "POST", {
                      answer: state.answer,
                    });
                    setReview("本次原题作答已记录，可在复习系统查看。");
                  } catch {
                    setReview(
                      "提交失败，请重新选择答案后重试；即时答案仍保留。",
                    );
                  } finally {
                    setReviewBusy(false);
                  }
                }}
              >
                {reviewBusy ? "正在提交…" : "提交原题作答到复习"}
              </button>
            )}
            {review && <p role="status">{review}</p>}
            <h3>新情景：基金甲的交易与策略</h3>
            <p>
              教学假设：甲可在交易所买卖，管理人按研究结果主动选择持仓，并不以跟踪某个指数为目标。下列哪项成立？
            </p>
            {[
              "可以是主动 ETF，不必是指数基金",
              "只要在交易所交易，就一定跟踪指数",
              "只要主动管理，就不能在交易所交易",
            ].map((text, i) => (
              <button
                className="cs-choice"
                key={text}
                disabled={busy || !canEdit}
                aria-pressed={state.transfer === i}
                onClick={() => change({ transfer: i })}
              >
                {String.fromCharCode(65 + i)} · {text}
              </button>
            ))}
            {state.transfer !== null && (
              <p className="cs-feedback" role="status">
                {
                  [
                    "判断正确。交易形式与主动策略可以同时存在，对应矩阵右上格。",
                    "交易场所不决定策略。题干明确说甲不以跟踪指数为目标，不能据此认定为指数基金。",
                    "主动管理与交易所买卖并不冲突。主动 ETF 正是这两项条件的组合。",
                  ][state.transfer]
                }
              </p>
            )}
            <p className="cs-muted">
              此情景题仅即时反馈，随笔记保存；不写入正式题库或复习队列。
            </p>
            {state.legacyChoice !== undefined && (
              <p className="cs-callout">
                旧分类题已恢复：你当时选择了“
                {
                  [
                    "所有 ETF 都跟踪指数",
                    "指数基金必须是 ETF",
                    "ETF 是形式，指数跟踪是策略",
                  ][state.legacyChoice]
                }
                ”。
                {state.legacyChoice === 2
                  ? "该判断正确。"
                  : "该判断混淆了形式与策略，请对照上方矩阵。"}
                旧答案未冒充本页原题答案。
              </p>
            )}
          </section>
          <section className="cs-block" id="etf-notes">
            <h2>个人笔记</h2>
            <p>
              {notebook.scope}。保存笔记、选中案例和即时答案；正式作答单独记录。
            </p>
            {entryId && !restored && !notebook.loading && (
              <p role="status">
                {status} <Link to="/concept-studio/7">开始新的 ETF 笔记</Link>
              </p>
            )}
            <label htmlFor="etf-note">
              用自己的话记录一个区别或仍需核对的问题
            </label>
            <textarea
              id="etf-note"
              maxLength={2000}
              value={state.note}
              disabled={busy || !canEdit}
              onChange={(e) => change({ note: e.target.value })}
              placeholder="例如：ETF 说明怎么买卖，指数策略说明如何选持仓。"
            />
            <div className="rd-actions">
              <button
                className="rd-button"
                disabled={busy || !canEdit || (!dirty && !!savedUrl)}
                onClick={save}
              >
                {busy ? "正在保存…" : "保存笔记与互动"}
              </button>
              {savedUrl && <Link to={savedUrl}>重新打开保存记录</Link>}
            </div>
            <p aria-live="polite">
              {dirty
                ? "有未保存修改。临时草稿仅保留在此标签页，请主动保存。"
                : status}
            </p>
            {(saveError || notebook.error) && (
              <p role="alert">
                {saveError} {notebook.error}
                <button
                  className="rd-text-link"
                  onClick={() =>
                    window.dispatchEvent(new Event("redesign-save"))
                  }
                >
                  重新读取保存记录
                </button>
              </p>
            )}
          </section>
          <section className="cs-block">
            <h2>继续学习</h2>
            <div className="rd-actions">
              <Link to="/stories/etf">阅读 ETF 专题 →</Link>
              <Link to="/concept-studio/19">查看基金概念 →</Link>
            </div>
            <details>
              <summary>相关课程与来源</summary>
              <p>
                <Link to="/lessons/7">ETF 原有课程</Link>
              </p>
              <p>
                分类与练习依据：
                <a href={source} target="_blank" rel="noreferrer">
                  Investor.gov · Mutual Funds and ETFs（2025-04-29）
                </a>
                。2026-11-09 核对。页面案例为原创教学假设，不是实时行情。
              </p>
            </details>
          </section>
        </article>
        <aside className="cs-page-nav">
          <details open>
            <summary>本页内容</summary>
            <nav>
              {[
                ["definition", "定义与案例"],
                ["matrix", "交易形式与投资策略"],
                ["boundary", "费用与风险"],
                ["practice", "理解检查"],
                ["notes", "个人笔记"],
              ].map(([id, title]) => (
                <a key={id} href={"#etf-" + id}>
                  {title}
                </a>
              ))}
            </nav>
            <p>阅读、练习和笔记均可在本页完成。</p>
          </details>
        </aside>
      </div>
    </div>
  );
}
