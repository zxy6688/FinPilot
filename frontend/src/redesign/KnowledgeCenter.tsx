import references from "../../../content/concept-references.json";
import { ConceptMicroLab } from "./ConceptMicroLabs";
import { MicroState, useMicroValue, type MicroValues } from "./MicroState";
import { diagramNotes, optionFeedback } from "./conceptReview";
import { ConceptEvidencePanel } from "./ConceptEvidencePanel";
import ConceptDirectory from "./ConceptDirectory";
import EtfConcept from "./EtfConcept";
import { RiskExperiment, BehaviorExperiment } from "./KnowledgeInteractions";
import { useEffect, useState, useRef } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import {
  knowledge,
  lessons,
  conceptById,
  conceptUrl,
  journeyMap,
} from "./knowledgeData";
import { FinArt } from "./Fin";
import { useNotebook } from "./state";
import { useAuth } from "../services/auth";
import { useLoad } from "../components/ui";
import { api } from "../services/api";
import type { LearningPath } from "../types";
import { snapshotId } from "./Experiments";
import { learningStorage } from "../services/learningStorage";

type Recent = { id: number; at: string };
function recentKey(id?: number) {
  return "finpilot:knowledge:recent:" + String(id ?? "guest");
}
function recentRead(id?: number): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(recentKey(id)) || "[]");
  } catch {
    return [];
  }
}
export function LearningTrail({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth(),
    p = useLoad<LearningPath[]>("/learning-paths"),
    h = useLoad<{ continue: { title: string; url: string }[] }>("/v3/home"),
    [recent, setRecent] = useState(() => recentRead(user?.id));
  const pending = h.data?.continue || [];
  const ongoing =
    p.data?.filter(
      (x) =>
        x.lessons.some((l) => l.completed) &&
        x.lessons.some((l) => !l.completed),
    ) || [];
  return (
    <section
      className={"k-trail " + (compact ? "compact" : "")}
      aria-label="继续学习"
    >
      <div>
        <span className="rd-kicker">每一次理解，都有来处</span>
        <h2>
          {recent.length || ongoing.length || pending.length
            ? "接着上次，再走一步。"
            : "从一个生活问题开始。"}
        </h2>
        <p>看过不等于掌握；完成练习后再回顾，才能留下更可靠的理解证据。</p>
      </div>
      <div>
        {pending.slice(0, compact ? 1 : 2).map((x) => (
          <Link key={x.url} className="k-recent" to={x.url}>
            接着读：{x.title} →
          </Link>
        ))}
        {recent.slice(0, compact ? 1 : 3).map((r) => (
          <div className="k-recent" key={r.id}>
            <Link to={conceptUrl(r.id)}>
              最近看过 · {conceptById(r.id)?.title} <ArrowRight size={16} />
            </Link>
            {!compact && (
              <button
                className="rd-text-link"
                onClick={() => {
                  const next = recent.filter((x) => x.id !== r.id);
                  localStorage.setItem(
                    recentKey(user?.id),
                    JSON.stringify(next),
                  );
                  setRecent(next);
                }}
              >
                移除浏览记录
              </button>
            )}
          </div>
        ))}
        {ongoing.slice(0, 2).map((p) => (
          <Link
            className="k-recent"
            key={p.id}
            to={"/lessons/" + p.lessons.find((l) => !l.completed)!.id}
          >
            继续路线：{p.title} · 下一课 →
          </Link>
        ))}
        {!recent.length && !ongoing.length && !pending.length && (
          <Link className="rd-button" to={conceptUrl(17)}>
            从生活费预算入门 <ArrowRight size={17} />
          </Link>
        )}
        <small>最近浏览仅此浏览器；登录后的课程与主动保存记录来自账户。</small>
      </div>
    </section>
  );
}
export function KnowledgeCenter() {
  return <ConceptDirectory />;
}
function Diagram({ c }: { c: (typeof knowledge.concepts)[number] }) {
  const [step, setStep] = useMicroValue<number>("diagram", 0);
  return (
    <div className="k-mechanism">
      <span className="rd-kicker">理解一条关系 · 点击逐步拆解</span>
      <div className="k-diagram">
        {c.diagram.map((s, i) => (
          <button key={s} aria-pressed={step === i} onClick={() => setStep(i)}>
            <span>{i + 1}</span>
            <strong>{s}</strong>
            {i < c.diagram.length - 1 && <ArrowRight size={18} />}
          </button>
        ))}
      </div>
      <div className="k-step" role="status">
        <FinArt size={76} mood="thinking" />
        <p>{diagramNotes[c.id][step % 3]}</p>
      </div>
    </div>
  );
}
function DeepExperiment({ id }: { id: number }) {
  if (id === 8 || id === 21 || id === 22) return <RiskExperiment />;
  if ([13, 14, 15, 16, 24].includes(id)) return <BehaviorExperiment />;
  return <ConceptMicroLab conceptId={id} />;
}
export function ConceptDetail() {
  const { id } = useParams();
  return Number(id) === 7 ? (
    <EtfConcept />
  ) : (
    <ConceptContentWrapper id={Number(id)} />
  );
}
function ConceptContentWrapper({ id }: { id: number }) {
  const [params] = useSearchParams();
  const { user } = useAuth();
  return (
    <ConceptContent
      key={`${user?.id ?? "guest"}:${id}:${params.get("entry") || "new"}`}
      id={id}
    />
  );
}
function ConceptContent({ id }: { id: number }) {
  const c = conceptById(id),
    { user } = useAuth(),
    n = useNotebook(),
    [params] = useSearchParams();
  const [micro, setMicro] = useState<MicroValues>({}),
    [microErrors, setMicroErrors] = useState<Record<string, string>>({});
  const restored = useRef(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [recorded, setRecorded] = useState(0);
  const key = "concept-answer:" + id,
    [answer, setAnswer] = useState<number | null>(() => {
      const a = learningStorage.getItem(key);
      return a === null ? null : Number(a);
    }),
    [note, setNote] = useState(""),
    [saved, setSaved] = useState(false),
    [review, setReview] = useState(""),
    [busy, setBusy] = useState(false);
  const reference =
    references[String(id) as keyof typeof references] || c?.reference;
  const domain = knowledge.domains.find((d) => d.id === c?.domain);
  const back = params.get("from");
  const safeBack = back && Object.keys(journeyMap).includes(back) ? back : null;
  useEffect(() => {
    if (!c) return;
    const items = recentRead(user?.id).filter((x) => x.id !== id);
    localStorage.setItem(
      recentKey(user?.id),
      JSON.stringify(
        [{ id, at: new Date().toISOString() }, ...items].slice(0, 16),
      ),
    );
  }, [id, user?.id]);
  useEffect(() => {
    if (restored.current || n.loading) return;
    const record = n.entries.find((e) => e.id === params.get("entry"));
    const payload = record?.payload as {
      concept_id?: number;
      answer?: number;
      note?: string;
      micro?: MicroValues;
    };
    if (payload?.concept_id === id) {
      setAnswer(payload.answer ?? null);
      setNote(payload.note || "");
      setSaved(true);
      setMicro(payload.micro || {});
      setSavedUrl(record!.url);
      restored.current = true;
    } else if (params.get("entry") && !n.error) {
      setLoadMessage(
        "未找到当前账户或浏览器中的这条概念记录；原记录未被修改。",
      );
    }
  }, [n.entries, n.loading, params.get("entry")]);
  if (!c)
    return (
      <div className="rd-page">
        <h1>没有这个概念</h1>
        <Link to="/concept-studio">返回知识中心</Link>
      </div>
    );
  const nextAction = [7, 19, 20, 35].includes(id)
    ? ["/concept-studio/etf-matrix", "在 ETF 课堂继续辨别交易形式与策略"]
    : [6, 9, 33, 34].includes(id)
      ? ["/stories/bonds#experiment", "改变债券收益率，观察价格"]
      : [17, 25, 4, 29].includes(id)
        ? ["/money-lab/budget", "把收入与支出放进预算"]
        : [27].includes(id)
          ? ["/money-lab/loan", "比较贷款还款与全部费用"]
          : [1, 2, 32].includes(id)
            ? ["/money-lab/inflation", "比较名义金额与实际购买力"]
            : [3, 28].includes(id)
              ? ["/money-lab/compound", "比较时间和假设净收益率"]
              : [8, 21, 22].includes(id)
                ? ["/lab/3", "观察不同风险路径"]
                : [13, 14, 15, 16, 24].includes(id)
                  ? ["/lab/6", "观察追涨时的决策过程"]
                  : null;
  const deep = [
    1, 2, 3, 6, 7, 8, 9, 13, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 27, 28, 32,
    33, 34, 35,
  ].includes(id);
  return (
    <div className="rd-page k-concept">
      <nav className="k-breadcrumb">
        <Link to="/concept-studio">学概念</Link>
        <span>/</span>
        <Link to={"/concept-studio?domain=" + c.domain}>{domain?.title}</Link>
        <span>/ {c.title}</span>
        {safeBack && (
          <Link className="rd-text-link" to={safeBack}>
            回到刚才的专题 / 工具 →
          </Link>
        )}
      </nav>
      <header className="k-concept-cover">
        <div>
          <span className="rd-kicker">{c.level} · 解释、实验与理解检查</span>
          <h1>{c.title}</h1>
          <p>{c.summary}</p>
          <div className="rd-actions">
            <a className="rd-button" href="#concept-practice">
              {deep ? "亲手验证" : "做一次理解检查"} ↓
            </a>
            <Link className="rd-text-link" to={conceptUrl(c.prerequisite)}>
              先看看：{conceptById(c.prerequisite)?.title}
            </Link>
          </div>
        </div>
        <FinArt size={170} action="notebook" />
      </header>
      <ConceptEvidencePanel
        key={recorded}
        answer={answer !== null}
        noteSaved={saved}
        quizId={"id" in c.quiz ? c.quiz.id : undefined}
        lessonIds={c.lesson_ids}
      />
      {loadMessage && <p role="status">{loadMessage}</p>}
      <MicroState.Provider
        value={{
          values: micro,
          change: (key, value) => {
            setMicro((v) => ({ ...v, [key]: value }));
            setSaved(false);
          },
          errors: microErrors,
          validate: (key, error) =>
            setMicroErrors((v) =>
              v[key] === error ? v : { ...v, [key]: error },
            ),
        }}
      >
        <article>
          <Diagram c={c} />
          <div className="k-reading-columns">
            <section>
              <span className="rd-kicker">01 / 先把意思说清楚</span>
              <h2>它到底在说什么？</h2>
              <ReactMarkdown>{c.explain}</ReactMarkdown>
              <h3>为什么与你有关</h3>
              <ReactMarkdown>{c.life}</ReactMarkdown>
            </section>
            <aside className="k-case">
              <span className="rd-kicker">02 / 把概念放进生活</span>
              <h2>一个可检查的例子</h2>
              <small>原创教学场景，不是市场报价或个人建议</small>
              <ReactMarkdown>{c.example}</ReactMarkdown>
            </aside>
          </div>
          <section className="k-misconception">
            <span className="rd-kicker">03 / 多问一句，少走弯路</span>
            <h2>容易混淆的地方</h2>
            <ReactMarkdown>{c.misunderstanding}</ReactMarkdown>
            <details>
              <summary>适用边界与假设</summary>
              <ReactMarkdown>{c.boundary}</ReactMarkdown>
            </details>
          </section>
          <section id="concept-practice">
            <div className="rd-section-head">
              <div>
                <span className="rd-kicker">
                  04 / 换一个条件，看理解是否站得住
                </span>
                <h2>{deep ? "现在，自己试一试。" : "现在，检验一个判断。"}</h2>
              </div>
            </div>
            {deep && <DeepExperiment id={id} />}
            <div className="k-quiz">
              <FinArt
                size={96}
                mood={answer === c.quiz.correct_answer ? "bright" : "curious"}
              />
              <div>
                <span className="rd-kicker">理解检查 · 一次答对不代表掌握</span>
                <h3>{c.quiz.question}</h3>
                <div className="k-answers">
                  {c.quiz.options.map((option, i) => (
                    <button
                      key={option}
                      className="rd-secondary"
                      aria-pressed={answer === i}
                      onClick={() => {
                        setAnswer(i);
                        learningStorage.setItem(key, String(i));
                        setSaved(false);
                        setReview("");
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {answer !== null && (
                  <p className="k-feedback" role="status">
                    {answer === c.quiz.correct_answer
                      ? "判断正确。"
                      : "再看一下条件。"}
                    {optionFeedback[id]?.[answer] || c.quiz.explanation}
                  </p>
                )}
                {answer !== null && user && "id" in c.quiz && (
                  <button
                    className="rd-text-link"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api("/quizzes/" + c.quiz.id + "/answer", "POST", {
                          answer,
                        });
                        setReview("本次作答已记录，并进入原有复习系统。");
                        setRecorded((v) => v + 1);
                      } catch (e) {
                        setReview((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    记录这次作答，加入复习
                  </button>
                )}
                <p role="status">
                  {review ||
                    ("id" in c.quiz
                      ? "即时反馈尚未提交到课程；登录后可主动记录作答。"
                      : "这道新情景题为即时理解检查；保存发现后可重开回顾，不计入课程复习队列。")}
                </p>
              </div>
            </div>
          </section>
          <section className="k-save">
            <div>
              <span className="rd-kicker">留下自己的解释，而不只是一个勾</span>
              <h2>这次，你分清了什么？</h2>
              <p>
                {n.scope}。保存题目、答案和笔记；可以在我的世界重新打开或删除。
              </p>
            </div>
            <div>
              <label>
                我的理解
                <textarea
                  aria-label="我的理解"
                  disabled={n.loading || busy}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="用自己的话说一个变化、一个条件或一个误区…"
                />
              </label>
              <button
                className="rd-button"
                disabled={
                  busy ||
                  saved ||
                  n.loading ||
                  Object.values(microErrors).some(Boolean)
                }
                onClick={async () => {
                  setBusy(true);
                  try {
                    const entryId = await snapshotId("knowledge-c4-" + id, {
                      answer,
                      note,
                      micro,
                    });
                    const ok = await n.save({
                      id: entryId,
                      kind: "concept",
                      title: c.title + " · 我的理解",
                      url: conceptUrl(id) + "?entry=" + entryId,
                      detail:
                        answer === null
                          ? "仅保存笔记，尚未作答"
                          : answer === c.quiz.correct_answer
                            ? "已练习：本题答对；尚不代表掌握"
                            : "已练习：需要回顾本题解释",
                      payload: {
                        concept_id: id,
                        micro,
                        revision: "concept-c4-v1",
                        answer,
                        note,
                        question: c.quiz.question,
                        correct: answer === c.quiz.correct_answer,
                      },
                    });
                    setSaved(ok);
                    if (ok) setSavedUrl(conceptUrl(id) + "?entry=" + entryId);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {saved ? "发现已保存" : "保存这次理解"}
              </button>
              {saved && (
                <Link className="rd-text-link" to={savedUrl}>
                  重新打开这次保存 →
                </Link>
              )}
              <p role="status">
                {saved
                  ? "笔记、答案与互动参数已保存；正式作答单独记录。"
                  : "编辑后请保存，未保存修改不会进入发现手册。"}
              </p>
              {n.error && (
                <p role="alert">
                  {n.error}。草稿仍在，请重试；如记录冲突请修改后另存新记录。
                </p>
              )}
            </div>
          </section>
          <section className="k-next">
            <span className="rd-kicker">05 / 下一步有方向</span>
            <h2>把这一点，接到更大的问题。</h2>
            <div className="k-next-links">
              {nextAction && (
                <Link to={nextAction[0]}>
                  继续动手：{nextAction[1]} <ArrowRight />
                </Link>
              )}
              <Link to={c.story}>
                回到相关专题，看看完整情景 <ArrowRight />
              </Link>
              <Link to={"/lessons/" + c.lesson_ids[0]}>
                进入课程：{lessons.find((l) => l.id === c.lesson_ids[0])?.title}
                <ArrowRight />
              </Link>
              {c.related.map((id) => (
                <Link key={id} to={conceptUrl(id)}>
                  接着理解：{conceptById(id)?.title}
                  <ArrowUpRight />
                </Link>
              ))}
            </div>
            <details>
              <summary>内容来源与延伸阅读</summary>
              <p>{c.source_note}</p>
              <p>内容原稿：{c.origin}</p>
              <a href={reference.url} target="_blank" rel="noreferrer">
                {reference.title}
              </a>
              <p>{reference.role}</p>
            </details>
          </section>
        </article>
      </MicroState.Provider>
    </div>
  );
}
export function TopicCompatibility() {
  const { id } = useParams();
  return <Navigate replace to={conceptUrl(Number(id))} />;
}
export function KnowledgeConnections() {
  const { pathname } = useLocation();
  const ids = journeyMap[pathname];
  if (!ids) return null;
  return (
    <section className="k-context" aria-label="理解这里的关键词">
      <div>
        <span className="rd-kicker">先懂一个词，再继续探索</span>
        <p>展开看解释；进入完整概念后，可返回本页。</p>
      </div>
      <div>
        {ids.map((id) => {
          const c = conceptById(id)!;
          return (
            <details key={id}>
              <summary>{c.title}</summary>
              <p>{c.summary}</p>
              <Link
                to={conceptUrl(id) + "?from=" + encodeURIComponent(pathname)}
              >
                图解、练习与相关课程 →
              </Link>
            </details>
          );
        })}
      </div>
    </section>
  );
}
export function LearningBreadcrumb() {
  const { pathname } = useLocation();
  if (!/^\/(lessons|learn\/|review|lab\/)/.test(pathname)) return null;
  return (
    <nav className="k-breadcrumb">
      <Link to="/concept-studio">学概念 · 知识中心</Link>
      <span>/</span>
      <Link to="/concept-studio#courses">课程与学习路线</Link>
      <span>/</span>
      <Link to="/review">错题与复习</Link>
    </nav>
  );
}
