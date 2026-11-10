import {ReadingMicro} from "./ReadingMicro";
import { ConceptTerm } from "./KnowledgeInteractions";
import { learningStorage } from "../services/learningStorage";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { snapshotId } from "./Experiments";
import { FinArt } from "./Fin";
import { useNotebook } from "./state";

export function CheckUnderstanding({
  question,
  options,
  correct,
  feedback,
  id,
}: {
  question: string;
  options: string[];
  correct: number;
  feedback: string[];
  id: string;
}) {
  const n = useNotebook(),
    [params] = useSearchParams();
  const valid = (value: unknown) =>
    value !== null &&
    value !== undefined &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) < options.length
      ? Number(value)
      : null;
  const [answer, setAnswer] = useState<number | null>(() =>
    valid(learningStorage.getItem("question:" + id)),
  );
  useEffect(() => {
    const entry = n.entries.find((e) => e.id === params.get("reading"));
    if (!entry) return;
    const p = entry.payload as {
      questions?: Record<string, unknown>;
      question?: unknown;
      topic?: string;
    };
    const value =
      p.questions?.[id] ?? (p.topic === id ? p.question : undefined);
    const restored = valid(value);
    if (restored !== null) {
      setAnswer(restored);
      learningStorage.setItem("question:" + id, String(restored));
    }
  }, [params, n.entries, id]);
  return (
    <div className="gb-quiz">
      <span className="rd-kicker">即时练习 · 不计入复习</span>
      <h3>{question}</h3>
      {options.map((o, i) => (
        <button
          key={o}
          aria-pressed={answer === i}
          onClick={() => {
            setAnswer(i);window.dispatchEvent(new Event("reading-edit"));
            learningStorage.setItem("question:" + id, String(i));
          }}
        >
          {o}
        </button>
      ))}
      {answer !== null && (
        <div role="status">
          <b>
            {answer === correct
              ? "这个区分很关键。"
              : "再看一个容易忽略的条件。"}
          </b>{" "}
          {feedback[answer]}
        </div>
      )}
    </div>
  );
}

export function StorySave({
  slug,
  title,
  sources,
}: {
  slug: string;
  title: string;
  sources: string[];
}) {
  const n = useNotebook(),
    [params] = useSearchParams();
  const [note, setNote] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(()=>{const edit=()=>setSaved(false);window.addEventListener("reading-edit",edit);return ()=>window.removeEventListener("reading-edit",edit)},[]);
  useEffect(() => {
    const id = params.get("reading");
    const entry = n.entries.find((e) => e.id === id);
    if (entry) {
      const p = entry.payload as { note?: string; section?: string };
      setNote(p.note || "");
    }
  }, [params, n.entries.find(e=>e.id===params.get("reading"))?.id]);
  return (
    <section className="gb-save">
      <FinArt action="notebook" size={80} />
      <div>
        <h3>保存这次专题和你的笔记。</h3>
        <p>
          {n.scope} ·
          保存问题、参数和来源。阅读位置自动记住；这张笔记将打开到“我的发现”。
        </p>
        <label>
          我的理解
          <textarea
            aria-label="我的理解"
            maxLength={1500}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="例如：储备目标不是已经花掉的钱…"
          />
        </label>
        <button
          disabled={busy}
          className="rd-button"
          onClick={async () => {
            setBusy(true);
            try {
              const payload = {
                topic: slug,
                micro: Number(learningStorage.getItem("reading-micro:"+slug)??(slug==="loan"?200:0)),
                note,
                sources,
                section: "takeaway",
                editorial_version: "gate-b-px-1",
                experiment: slug==="bonds" ? JSON.parse(learningStorage.getItem("bond-draft")||"null") : null,
                question: learningStorage.getItem("question:" + slug),
                questions: Object.fromEntries(
                  learningStorage
                    .keys()
                    .filter(
                      (k) =>
                        k === "question:" + slug ||
                        k.startsWith("question:" + slug + "-"),
                    )
                    .map((k) => [k.slice(9), learningStorage.getItem(k)]),
                ),
              };
              const id = await snapshotId("reading", payload);
              if (
                await n.save({
                  id,
                  kind: "reading",
                  title,
                  url: `/stories/${slug}?reading=${id}#${payload.section}`,
                  detail: note || "已保存专题与资料来源",
                  payload,
                })
              )
                setSaved(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "保存中…" : saved ? "发现已保存" : "保存这条发现"}
        </button>
        {saved && (
          <Link to="/profile" className="rd-text-link">
            已保存：{title} · {n.scope}。查看手册 →
          </Link>
        )}
        {n.error && <p role="alert">{n.error}</p>}
      </div>
    </section>
  );
}

export function BudgetStory() {
  return (
    <div className="rd-page">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 金融解读室 / 钱与生活
      </div>
      <header className="gb-story-hero">
        <div>
          <span className="rd-kicker">
            生活实验 01 · 原创互动专题
          </span>
          <h1>大学生预算：临时支出会影响什么？</h1>
          <p>
            不是把喜欢的东西全部划掉，而是在下一次意外之前，知道自己还有多少选择。
          </p>
          <small>小林的生活费均为教学假设，不是大学生平均开销。</small>
        </div>
        <img
          src="/redesign/gate-b/budget-studio.png"
          alt="校园窗边的预算手册、餐饮、交通与维修账单，展示日常选择和应急准备"
        />
      </header>
      <div className="gb-reading-layout">
        <nav className="gb-reading-nav" aria-label="专题目录">
          {[
            ["case", "一笔生活费"],
            ["categories", "先分清三件事"],
            ["experiment", "自己动手安排"],
            ["check", "检查理解"],
            ["sources", "来源与方法"],
            ["takeaway", "我的发现"],
          ].map(([id, t]) => (
            <a href={"#" + id} key={id}>
              {t}
            </a>
          ))}
        </nav>
        <article className="gb-article">
          <div className="k-inline-glossary">
            读到不熟悉的词，先展开看：
            <ConceptTerm id={17}>{"预算"}</ConceptTerm>
          </div>
          <section id="case">
            <span className="gb-kicker">01 / 从一个有点熟悉的月末开始</span>
            <h2>2500 元够不够，先别急着回答。</h2>
            <p>
              假设小林本月可用生活费 2500 元。住宿和通信约 500 元，餐饮计划 900
              元，交通与娱乐 350 元。他还想留出 300
              元应急储备。只把支出相加，会得到 1750 元；但“还剩 750
              元”和“可以随意花 750
              元”不是同一回事：如果继续保留储备目标，自由安排的空间其实是 450
              元。
            </p>
            <p>
              预算的价值不是给出所有人都该遵守的比例，而是让已经作出的承诺、还可以调整的选择和想为未来留下的钱同时可见。学期初买书、回家车票、一次维修，都可能让这个月和上个月很不一样。只记“平均每月”容易遗漏发生时点。
            </p>
            <div className="gb-flow">
              <div>
                <small>可靠收入</small>
                <strong>¥2500</strong>
                <small>先确认本月能使用，而非尚未到账的兼职计划</small>
              </div>
              <div>
                <small>实际支出计划</small>
                <strong>− ¥1750</strong>
                <small>住宿、餐饮、交通娱乐</small>
              </div>
              <div>
                <small>为未来保留</small>
                <strong>− ¥300</strong>
                <small>尚未消费，仍然是你的钱</small>
              </div>
            </div>
          </section>
          <section id="categories">
            <span className="gb-kicker">
              02 / 分类是为了选择，不是为了贴标签
            </span>
            <h2>固定、弹性与一次性，回答不同的问题。</h2>
            <p>
              固定支出描述本月已经较难改变的承诺，比如已约定的住宿费。弹性支出并不等于“不必要”：吃饭是必要的，但不同用餐方式会改变总额。一次性支出表示发生频率；它也可能十分必要，比如修车。因此工具中的分类是帮助看清当月现金安排的简化标签，并不评价消费好坏。
            </p>
            <CheckUnderstanding
              id="budget-category"
              question="自行车维修 600 元，只在本月发生。预算里怎样处理？"
              options={[
                "放进一次性支出，并检查本月剩余空间",
                "当作每个月都会发生的固定支出",
                "从储备目标里删掉它，就不算支出了",
              ]}
              correct={0}
              feedback={[
                "这样能保留发生时点；是否用已有应急金支付，还要另外核对现金余额。",
                "会让未来月份重复计入同一维修；长期维修储备可以按月准备，但不等于本月账单。",
                "已经支付的钱仍是支出。调整储备目标不能抹掉真实现金流。",
              ]}
            />
            <div className="gb-story-callout">
              <b>储备不是支出，也不是凭空多出的收入。</b>
              <p>
                若要动用以前存下来的钱，应把本月真正可使用的转入资金计入可用收入，并在原储备账户里相应扣减。本模型不替你追踪多个账户，不要把同一笔钱计算两次。
              </p>
            </div>
          </section>
          <section id="experiment">
            <span className="gb-kicker">03 / 亲手改一个条件</span>
            <h2>如果这周突然要修车呢？</h2>
            <p>
              下面的默认数字就是小林的计划。先看结余，再点击加入 600
              元维修：结余从 750 元变成 150 元，虽然没有花超收入，但离 300
              元储备目标还差 150
              元。这里仅改变临时费用，其他条件保持不变。
            </p>
            <ReadingMicro kind="budget"/>
          </section>
          <section id="check">
            <span className="gb-kicker">04 / 数字之后，做一次判断</span>
            <h2>“没超支”不一定等于“计划完成”。</h2>
            <p>
              收支平衡只是第一道检查。还需要确认该支付的账单是否都写下来了、款项什么时候到账、是否把应急资金当成长期收入。如果可用收入为零，工具仍会准确给出支出与缺口，但不会用“无限百分比”制造误导。短期出现缺口时，先识别支出能否延后、是否有可用储备和可信支持，不把贷款当作增加收入。
            </p>
            <CheckUnderstanding
              id="budget"
              question="修车后结余 150 元，储备目标 300 元，哪种说法准确？"
              options={[
                "已经超支 150 元",
                "尚未超支，但储备目标还有 150 元缺口",
                "结余必须减到零，预算才正确",
              ]}
              correct={1}
              feedback={[
                "超支比较的是支出与收入；这里支出还没有超过收入。",
                "正是如此。消费缺口与储备目标缺口是两个不同的检查。",
                "结余可以保留；把钱花完不是预算成功的条件。",
              ]}
            />
          </section>
          <section id="sources">
            <span className="gb-kicker">05 / 来源与边界</span>
            <h2>方法有依据，数字是假设。</h2>
            <p>
              本篇案例、互动题与中文解释由 FinPilot
              原创。预算收入与支出相减属于现金算术；按月查看不等于逐日现金流管理。官方工具用于参考整理收入、账单与储蓄目标的思路，不代表美国机构对本案例或国内消费水平的建议。
            </p>
            <ul className="gb-source-list">
              <li>
                <a
                  href="https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/toolkit/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CFPB · Your Money, Your Goals toolkit
                </a>
                <p>
                  预算、账单和现金流教育工具。资料类型：官方教育；本页核对日期
                  2026-11-04，非实时统计。
                </p>
              </li>
              <li>
                <a
                  href="https://www.consumerfinance.gov/documents/10038/cfpb_creating-cash-flow-budget_tool_2021-08.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  CFPB · Creating a cash flow budget（2021 版）
                </a>
                <p>延伸理解到账和支付时点。本站单月模型没有模拟逐周余额。</p>
              </li>
            </ul>
          </section>
          <section id="takeaway">
            <StorySave
              slug="budget"
              title="大学生的第一份预算 · 我的发现"
              sources={[
                "CFPB Your Money, Your Goals",
                "CFPB cash flow budget 2021",
              ]}
            />
            <div className="gb-next">
              <Link to="/money-lab/budget">下一步：保存你自己的预算实验 →</Link>
              <Link to="/decoder/purchasing-power">
                延伸：明年的同一笔生活费
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
