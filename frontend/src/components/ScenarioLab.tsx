import type { Lab, LabInputs } from "../types";
import ContextAI from "./ContextAI";
const scenarios: Record<string, string> = {
  compound:
    "你想为三年后的学习计划留下一笔预算。先观察投入频率与期限，再比较固定利率假设改变后的曲线。",
  inflation:
    "你为未来的生活费留下相同名义金额。改变通胀和期限，看看它能购买的东西为何可能不同。",
  risk: "三条教学收益路径看起来终点不同。比较中途波动，想一想：只看最后一个数，会遗漏什么？",
  allocation:
    "一份虚构的资产拼图由不同部分组成。只改变一个比例，观察模型输出；这里不寻找适合个人的配置。",
  interest:
    "一张票息固定的教学债券，市场要求的收益率变了。改变收益率，观察同一组现金流的价格如何变化。",
  fomo: "朋友分享了盈利截图，你担心错过机会。先选择一种反应，再区分已知事实、情绪与缺失的信息。",
  loss: "一个教学情景出现账面损失。比较三种反应，思考回本价格为什么可能成为判断的锚点。",
  crash:
    "假设市场出现明显下跌。比较行动之前，先想一想资金用途、时间范围和模型没有描述的风险。",
};
export function ScenarioIntro({ lab }: { lab: Lab }) {
  return (
    <section className="card scenario-intro">
      <span className="eyebrow">SCENARIO / 把概念放进情境</span>
      <p>{scenarios[lab.slug] || lab.question}</p>
      <span className="muted small">
        改变一个输入 → 观察 → 解释 → 反思；教学场景不提供实际投资指令。
      </span>
    </section>
  );
}
export function ScenarioReflection({
  lab,
  inputs,
}: {
  lab: Lab;
  inputs: LabInputs;
}) {
  return (
    <section className="card scenario-reflection">
      <span className="eyebrow">OBSERVATION → REFLECTION</span>
      <h2>如果条件改变，你的解释还成立吗？</h2>
      <div className="grid three">
        <div>
          <h3>What changed?</h3>
          <p>
            这次改变的是哪个参数或选择？与默认情景相比，哪些输出发生了变化？
          </p>
        </div>
        <div>
          <h3>Why?</h3>
          <p>{lab.educational_notes.why}</p>
        </div>
        <div>
          <h3>What is left out?</h3>
          <p>{lab.educational_notes.not_means}</p>
        </div>
      </div>
      <ContextAI
        context={{ source_type: "lab", source_id: lab.id, inputs }}
        title={lab.title}
        actions={["result", "changed", "limits", "quiz"]}
      />
    </section>
  );
}
