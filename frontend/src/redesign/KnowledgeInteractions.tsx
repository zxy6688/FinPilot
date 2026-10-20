import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { conceptById, conceptUrl } from "./knowledgeData";
export function ConceptTerm({
  id,
  children,
}: {
  id: number;
  children?: React.ReactNode;
}) {
  const c = conceptById(id)!,
    loc = useLocation();
  return (
    <details className="k-term">
      <summary>{children || c.title}</summary>
      <span>
        {c.summary}{" "}
        <Link to={conceptUrl(id) + "?from=" + encodeURIComponent(loc.pathname)}>
          查看图解与练习 →
        </Link>
      </span>
    </details>
  );
}
export function RiskExperiment() {
  const [together, setTogether] = useState(true),
    [weight, setWeight] = useState(50);
  const a = -20,
    b = together ? -20 : 10,
    result = (a * weight) / 100 + b * (1 - weight / 100);
  return (
    <section className="k-scenario">
      <h3>两份资产，真的分开了风险吗？</h3>
      <p>
        教学假设：A 在同一情景下跌20%；B
        可选择同向下跌20%或上涨10%。观察分配比例与共同冲击的区别。
      </p>
      <label>
        A 的比例 {weight}%
        <input
          type="range"
          min="0"
          max="100"
          value={weight}
          onChange={(e) => setWeight(+e.target.value)}
        />
      </label>
      <div className="rd-actions">
        <button
          className="rd-secondary"
          aria-pressed={together}
          onClick={() => setTogether(true)}
        >
          共同冲击：B 也跌20%
        </button>
        <button
          className="rd-secondary"
          aria-pressed={!together}
          onClick={() => setTogether(false)}
        >
          不同表现：B 涨10%
        </button>
      </div>
      <div className="k-risk-bars">
        <div style={{ width: weight + "%" }}>A {weight}%</div>
        <div style={{ width: 100 - weight + "%" }}>B {100 - weight}%</div>
      </div>
      <strong role="status">
        组合变化 {result.toFixed(1)}% · 1000元变成{" "}
        {(1000 * (1 + result / 100)).toFixed(0)}元
      </strong>
      <p>
        {together
          ? "共同下跌时，改变两者比例并不能减少这个共同冲击。"
          : "本情景中不同表现产生缓冲，但这不是未来相关性或保本保证。"}{" "}
        此处不含费用，不预测真实资产收益。
      </p>
    </section>
  );
}
export function BehaviorExperiment() {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <section className="k-scenario">
      <h3>五个人赞同，是五份证据吗？</h3>
      <p>教学情景：群里五位朋友转发同一段“机会难得”的视频。你最先做什么？</p>
      <div className="k-answers">
        {[
          "先数支持的人，再跟随",
          "追问原始出处和反对理由",
          "只因大家赞同就反对",
        ].map((v, i) => (
          <button
            className="rd-secondary"
            key={v}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            {v}
          </button>
        ))}
      </div>
      {choice !== null && (
        <p role="status">
          {
            [
              "热度不是独立证据。五次转发可能都来自同一个未经核实的说法。",
              "这是检查判断过程：先识别证据是否独立，再核查条件。你不需要为了独立而刻意选少数意见。",
              "反从众也可能让群体决定你的方向。关键是依据，而不是赞同者有多少。",
            ][choice]
          }
        </p>
      )}
      <small>这是决策过程练习，不据一次选择诊断人格。</small>
    </section>
  );
}
