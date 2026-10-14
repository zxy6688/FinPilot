import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  ExternalLink,
  Check,
  BookOpen,
} from "lucide-react";
import { api } from "../services/api";
import { useNotebook, money } from "./state";
import { snapshotId } from "./Experiments";
import { TimeWorkbench } from "./TimeTools";
import { FinArt } from "./Fin";
export function PurchasingArt() {
  return (
    <svg
      viewBox="0 0 430 230"
      role="img"
      aria-label="相同的一万元，账户金额与购物篮购买力对照插画"
    >
      <ellipse cx="210" cy="207" rx="181" ry="13" fill="#cdded3" />
      <g transform="rotate(-7 110 110)">
        <rect
          x="24"
          y="49"
          width="167"
          height="122"
          rx="14"
          fill="#fffdf6"
          stroke="#a6bdb0"
          strokeWidth="2"
        />
        <rect x="39" y="65" width="44" height="24" rx="5" fill="#F1C467" />
        <text x="40" y="123" fill="#24585A" fontSize="29" fontWeight="700">
          ¥10,000
        </text>
        <path d="M40 141h92" stroke="#adbbb0" strokeWidth="4" />
        <circle cx="164" cy="74" r="10" fill="#b9d9ca" />
      </g>
      <path
        d="M259 105q0 -70 61 -60q41 7 42 60"
        fill="none"
        stroke="#a87942"
        strokeWidth="8"
      />
      <path
        d="M239 92h147l-17 106H258Z"
        fill="#ecd4a0"
        stroke="#a87942"
        strokeWidth="3"
      />
      <path
        d="M254 120h116m-111 29h105m-100 29h95M283 101l7 89m37 -89 -4 89m28 -89 -12 89"
        stroke="#c5a46a"
        strokeWidth="2"
      />
      <path
        d="M282 88q-25 -34 -3 -45q17 -7 22 5q18 -20 31 0q7 24 -20 42"
        fill="#e8a18b"
      />
      <path d="M316 92q-9 -39 13 -48q28 0 31 49" fill="#87b69b" />
      <path d="M280 40q4 -14 13 -15" stroke="#267B78" strokeWidth="4" />
      <path
        d="M203 113h31m-8 -7 8 7 -8 7"
        fill="none"
        stroke="#267B78"
        strokeWidth="3"
      />
      <text x="52" y="213" fontSize="13" fill="#425f59">
        账户里的数字
      </text>
      <text x="272" y="223" fontSize="13" fill="#425f59">
        能买到的东西
      </text>
    </svg>
  );
}
export function InflationLab() {
  return <TimeWorkbench tool="inflation" embedded />;
}
export default function Decoder() {
  const notebook = useNotebook();
  const [layer, setLayer] = useState("fact"),
    [answer, setAnswer] = useState<number | null>(null),
    [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [params] = useSearchParams();
  useEffect(() => {
    const entry = notebook.entries.find((e) => e.id === params.get("reading"));
    if (entry) {
      const p = entry.payload as { note?: string; answer?: number };
      setNote(p.note || "");
      if (p.answer === 0 || p.answer === 1) setAnswer(p.answer);
    }
  }, [notebook.entries, params]);
  return (
    <div className="rd-page rd-decoder">
      <div className="rd-breadcrumb">
        <Link to="/discover">发现</Link> / 金融解读室 / 钱与生活
      </div>
      <header className="rd-story-hero">
        <div>
          <div className="rd-row">
            <span className="rd-tag">编辑精选 01</span>
            <span className="rd-kicker">原创教学专题 · 约 8 分钟</span>
          </div>
          <h1>
            存钱，为什么不等于
            <br />
            购买力不变？
          </h1>
          <p>
            钱还在账户里，为什么熟悉的一篮子东西，却越来越难装满？先分清数字，再讨论生活。
          </p>
          <div className="rd-story-meta">
            <BookOpen size={16} /> FinPilot 编辑室 · 机制解释，非实时新闻
          </div>
        </div>
        <PurchasingArt />
      </header>
      <div className="a1-evidence-strip">
        <a href="#layers">
          <span>01 / 依据</span>
          <b>ECB 官方机制说明</b>
          <small>解释概念，不是当期通胀数据</small>
        </a>
        <a href="#timeline">
          <span>02 / 推演</span>
          <b>同一篮子 × 时间</b>
          <small>100 元、3% 均为教学假设</small>
        </a>
        <a href="#experiment">
          <span>03 / 验证</span>
          <b>你来改变一个条件</b>
          <small>结果随输入由实际模型计算</small>
        </a>
      </div>
      <div className="rd-reader-layout">
        <aside className="rd-reader-nav">
          <span className="rd-kicker">这次一起弄明白</span>
          {[
            ["start", "01 一张购物清单"],
            ["layers", "02 事实、解释与未知"],
            ["timeline", "03 时间怎样改变价格"],
            ["experiment", "04 亲手换个假设"],
            ["limits", "05 把结论放回生活"],
            ["takeaway", "06 留下自己的发现"],
          ].map(([id, t]) => (
            <a key={id} href={"#" + id}>
              {t}
            </a>
          ))}
          <div className="rd-reading-fin">
            <FinArt mood="resting" size={75} />
            <p>
              先看清假设，
              <br />
              再相信数字。
            </p>
          </div>
        </aside>
        <article className="rd-reader">
          <section id="start">
            <span className="rd-kicker">01 / 从生活开始</span>
            <h2>账户没少一分钱，不代表它能换到同样的东西。</h2>
            <p>
              假设你为毕业旅行留了一万元，暂时不考虑利息。一年后打开账户，余额仍然是一万元。但火车票、住宿、餐食并不是一串静止的价格。如果原来计划里的同一组东西涨价了，你可能要缩短行程，或补上一笔钱。这就是“金额没变”和“购买力没变”之间的距离。
            </p>
            <p>
              这里有两个不同的问题：账户记录的是多少元，叫
              <strong>名义金额</strong>；这些钱能换到多少商品和服务，讨论的是
              <strong>实际购买力</strong>
              。前者可以直接看余额，后者必须选择一个价格参照。没有参照，单独说“钱变多了”或“钱缩水了”，往往会把两件事混在一起。
            </p>
            <blockquote>先问“相对于什么”，再问“增加了多少”。</blockquote>
            <p>
              本页所有金额和通胀率都是明确的教学假设。旅行的例子不是某个真实用户的消费记录，也不是对未来价格的预测。我们的目标，是学会把一个看起来简单的数字拆成有条件的判断。
            </p>
          </section>
          <section id="layers">
            <span className="rd-kicker">02 / 给信息分层</span>
            <h2>什么是事实，什么只是解释？</h2>
            <div className="rd-layer-tabs" role="group" aria-label="信息类型">
              {[
                ["fact", "来源支持的概念"],
                ["explain", "教学解释"],
                ["unknown", "仍然不知道"],
              ].map(([id, t]) => (
                <button
                  key={id}
                  aria-pressed={layer === id}
                  onClick={() => setLayer(id)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="rd-layer-content" aria-live="polite">
              {layer === "fact" ? (
                <>
                  <b>通胀描述的是广泛的价格变化。</b>
                  <p>
                    单个商品涨价，不足以说明总体通胀。统计价格指数会考虑一组商品与服务及其权重。不同家庭购买的东西不同，感受到的变化也可能不同。
                  </p>
                  <a
                    href="https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    原始资料：欧洲央行「What is inflation?」{" "}
                    <ExternalLink size={14} />
                  </a>
                </>
              ) : layer === "explain" ? (
                <>
                  <b>把“同一篮子东西”当作比较尺。</b>
                  <p>
                    这是本页的原创教学模型：固定消费组合，假设它每年按同一个比例涨价，再看一万元能买下原来那篮子的多少。这样可以隔离“价格变化”这个变量，并不表示现实家庭永远买同样的东西。
                  </p>
                </>
              ) : (
                <>
                  <b>模型不能告诉你未来会发生什么。</b>
                  <p>
                    我们不知道未来实际通胀、你的旅行地点、消费结构和储蓄利率。平均价格指数也不能直接预测每一种商品。不要把滑块上的
                    3% 当作已知事实，更不能把它当作某个国家当年的官方数值。
                  </p>
                </>
              )}
            </div>
          </section>
          <section id="timeline">
            <span className="rd-kicker">03 / 看见时间</span>
            <h2>涨价累积在上一年的价格上。</h2>
            <p>
              设同一篮子商品今天价值 100 元，每年恰好涨价 3%。一年后是 103
              元，第二年是在 103 元上再增加 3%，得到 106.09 元；第三年约为
              109.27 元。这里不能把三年的涨幅简单当作 3% ×
              3%，因为每次变化的基数已经不同。
            </p>
            <div className="rd-price-timeline">
              {[
                ["现在", "100.00"],
                ["1 年后", "103.00"],
                ["2 年后", "106.09"],
                ["3 年后", "109.27"],
              ].map(([t, n]) => (
                <div key={t}>
                  <span>{t}</span>
                  <b>¥{n}</b>
                  <small>相同的一篮子</small>
                </div>
              ))}
            </div>
            <p>
              反过来看，如果手里一直只有 100 元，三年后买到的比例是 100 ÷
              109.27，约为原来的
              91.51%。为了保持可比，我们把未来的钱折回今天的价格，这个换算后的数值就是本页实验里的“实际购买力”。
            </p>
            <p>
              这不是账户被扣了钱，也不是资产市场价格下跌，而是衡量尺度变了。区分这三件事，能帮助你读懂“本金安全”“名义收益”和“跑赢通胀”等说法各自在回答什么问题。
            </p>
          </section>
          <section id="experiment">
            <span className="rd-kicker">04 / 自己试一试</span>
            <h2>如果只改一个条件，结果会怎样？</h2>
            <p>
              先把通胀率拉到 0%，再调到
              3%；保持利率不变，延长时间。观察的是同一万元的购买力，而不是某个投资产品的收益曲线。
            </p>
            <InflationLab />
            <div className="rd-reader-check">
              <b>
                小判断：默认教学情景（1万元、3年、通胀3%、名义增长0%）中的“¥9,151.42”，代表什么？
              </b>
              {[
                "银行会把账户余额扣到这个数",
                "以今天价格衡量的购买力约为这个数",
              ].map((t, i) => (
                <button
                  key={t}
                  className={"rd-answer " + (answer === i ? "chosen" : "")}
                  onClick={() => setAnswer(i)}
                >
                  {t}
                </button>
              ))}
              {answer !== null && (
                <p role="status">
                  {answer === 1
                    ? "对。名义余额仍是一万元；变化的是用今天价格衡量的购买能力。"
                    : "再分开看：账户余额在这个模型里始终是一万元，9,151.42 是价格换算后的购买力。"}
                </p>
              )}
            </div>
          </section>
          <section id="limits">
            <span className="rd-kicker">05 / 把模型放回生活</span>
            <h2>“不存钱”并不是这个故事的结论。</h2>
            <p>
              短期要用的钱、应急储备和长期目标，解决的问题不同。流动性让你能在需要时动用资金；价格波动意味着你可能在不合适的时点承受损失。仅仅因为通胀会影响购买力，就得出“所有储蓄都应该拿去投资”，跳过了用途、时间和风险三个重要条件。
            </p>
            <p>
              如果加入利息，要同时比较钱的增长与价格的增长。比如一年名义增长
              2%、同一参照价格增长 3%，实际变化应是 1.02 ÷ 1.03 − 1，约
              −0.97%，而不是把任何两个百分比相减都当作精确答案。简单相减只是在幅度较小时的近似。
            </p>
            <p>
              还要留意：你自己的房租、餐饮或学费组合，未必和统计指数的消费篮子相同。平均数是理解整体的工具，不是每个人账单的复印件。当一条信息说“物价在下降”，也需要核对它指的是涨幅变小，还是价格水平真的降低。
            </p>
            <div className="rd-boundary">
              <b>这个实验没有包括</b>
              <p>
                动态通胀、消费替代、税费及个人消费权重；名义增长仅为你设定的固定假设。它解释一个关系，不替你选择金融产品。
              </p>
            </div>
          </section>
          <section id="takeaway">
            <span className="rd-kicker">06 / 留下一点自己的理解</span>
            <h2>下次看到一个收益数字，先多问一句。</h2>
            <ul>
              <li>这是名义金额，还是扣除价格变化后的实际价值？</li>
              <li>比较的是多长时间、哪一种价格参照？</li>
              <li>用的是已发生的数据，还是人为设定的假设？</li>
            </ul>
            <label className="rd-note-field">
              我的一句发现（可选）
              <textarea
                aria-label="我的一句发现（可选）"
                maxLength={600}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setSaved(false);
                }}
                placeholder="例如：余额不变，不代表买到的东西也不变。"
              />
            </label>
            <button
              className="rd-button"
              onClick={async () => {
                const experiment = JSON.parse(
                  sessionStorage.getItem("inflation-result") || "null",
                );
                const id = await snapshotId("purchasing", {
                  note,
                  experiment,
                  answer,
                });
                if (
                  await notebook.save({
                    id,
                    kind: "reading",
                    title: "存钱与购买力：别把两种数字混在一起",
                    url: `/decoder/purchasing-power?reading=${id}&inputs=${encodeURIComponent(JSON.stringify(experiment?.inputs || {}))}#takeaway`,
                    detail:
                      note || "名义金额与实际购买力，需要不同的衡量尺度。",
                    payload: {
                      article_id: "purchasing-power",
                      source: "ECB · What is inflation?",
                      editorial_version: "gate-b-1",
                      experiment,
                      note,
                      answer,
                    },
                  })
                )
                  setSaved(true);
              }}
            >
              <Bookmark size={17} />
              {saved ? "已保存这次发现" : "保存这次发现"}
            </button>
            {saved && (
              <p className="rd-success" role="status">
                <Check size={17} /> 已保存：{notebook.scope}。
                <Link to="/profile">打开我的发现手册 →</Link>
              </p>
            )}
            {notebook.error && <p role="alert">{notebook.error}</p>}
            <small>
              仅记录你主动保存的发现，不把读完当作掌握，也不会虚构学习成就。
            </small>
          </section>
          <section className="rd-sources" id="sources">
            <h3>资料与编辑说明</h3>
            <p>
              原创教学内容；参考以下官方机制说明，不转载原文。2026-10-13
              核对链接。资料用于解释概念，不作为当期通胀数据。
            </p>
            <a
              href="https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html"
              target="_blank"
              rel="noreferrer"
            >
              欧洲央行 · What is inflation? <ExternalLink size={15} />
            </a>
            <p>
              数字示例为 FinPilot
              独立计算；滑块结果来自站内原通胀模型。你的输入没有被当作已核实的外部事实。
            </p>
          </section>
          <Link className="rd-next-strip" to="/money-lab">
            <div>
              <span className="rd-kicker">下一步：把目标变成数字</span>
              <h3>每月存多少，才能走近一个小目标？</h3>
            </div>
            <ArrowUpRight size={28} />
          </Link>
        </article>
      </div>
    </div>
  );
}
