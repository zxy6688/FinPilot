import knowledge from "../../../content/knowledge.json" with { type: "json" };
// Explicit content lookup, not intent recognition or an answer generator.
export type Exploration = {
  id: string;
  title: string;
  path: string;
  scope: string;
};
const content: Exploration[] = [
  {
    id: "purchasing",
    title: "存钱，为什么不等于购买力不变？",
    path: "/decoder/purchasing-power",
    scope: "完整解读与通胀实验；不预测未来物价。",
  },
  {
    id: "concept",
    title: "ETF",
    path: "/concept-studio/7",
    scope: "辨别交易形式与投资策略；不评价具体基金。",
  },
  {
    id: "savings",
    title: "储蓄规划器",
    path: "/money-lab/savings",
    scope: "需要你填写金额、期限和利率；不会从问题自动提取参数。",
  },
  {
    id: "bonds",
    title: "降息与债券价格",
    path: "/stories/bonds",
    scope: "完整机制专题与债券定价实验；不判断具体债券涨跌。",
  },
  {
    id: "budget",
    title: "大学生的第一份预算",
    path: "/stories/budget",
    scope: "预算分类、录入与情景比较；保存并恢复个人实验。",
  },
  {
    id: "loan",
    title: "一笔贷款，到底要还多少钱？",
    path: "/stories/loan",
    scope: "完整贷款专题与真实还款计算；不推荐借贷产品。",
  },
];
const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s，,。.!！?？：:、]/g, "");
// Only complete existing topic titles qualify for direct navigation.
// Loose keywords and numeric questions must not enter this allowlist.
const exactTopics = content.filter((c) => c.id !== "savings");
export type ExplorationMatch = {
  kind: "exact" | "related" | "mixed" | "unknown" | "empty";
  destination: string | null;
  suggestions: Exploration[];
};
export function findExploration(question: string): ExplorationMatch {
  const q = question.trim();
  if (!q) return { kind: "empty", destination: null, suggestions: [] };
  const exact = exactTopics.find((c) => normalize(c.title) === normalize(q));
  if (exact)
    return { kind: "exact", destination: exact.path, suggestions: [exact] };
  const core = knowledge.concepts.map((c) => ({
    id: "core-" + c.id,
    title: c.title,
    path: "/concept-studio/" + c.id,
    scope: c.summary,
  }));
  const exactCore = core.find((c) => normalize(c.title) === normalize(q));
  if (exactCore)
    return {
      kind: "exact",
      destination: exactCore.path,
      suggestions: [exactCore],
    };
  const related: Record<string, boolean> = {
    purchasing: /通胀|购买力|物价/.test(q),
    concept: /ETF|指数|基金/i.test(q),
    savings: /复利|储蓄|存钱|存款|月存|存入|(?:每月|每个月).{0,6}存/.test(q),
    bonds: /降息|债券|国债/.test(q),
    budget: /预算|生活费|支出/.test(q),
    loan: /贷款|借款|还款|月供|房贷/.test(q),
  };
  const matches = content.filter((c) => related[c.id]).map(item => {
    if (item.id === "budget") return /预算是什么|什么是预算/.test(q)
      ? { ...item, title: "预算", path: "/concept-studio/17", scope: "认识预算如何安排收入与支出。" }
      : { ...item, title: "预算规划", scope:"输入可用资金与各项计划支出，计算预计结余，比较不同安排。", path: "/money-lab/budget" };
    if (item.id === "loan") return { ...item, title: "贷款比较工具", path: "/money-lab/loan" };
    return item;
  });
  const suggestions = matches.length
    ? matches
    : core.filter((c) => q.toLowerCase().includes(c.title.toLowerCase()));
  return {
    kind:
      suggestions.length > 1
        ? "mixed"
        : suggestions.length
          ? "related"
          : "unknown",
    destination: null,
    suggestions: suggestions.length ? [...suggestions, ...(matches.some(m=>m.path==="/money-lab/budget") ? [{...content[4],title:"大学生生活费预算",scope:"介绍支出分类和临时费用对预算结果的影响。"}] : [])].slice(0, 3) : [{id:"directory",title:"专题目录",path:"/discover",scope:"浏览金融专题"},{id:"tools",title:"工具目录",path:"/money-lab",scope:"选择财务工具"},{id:"concepts",title:"概念目录",path:"/concept-studio",scope:"按领域学习概念"}],
  };
}
export const questionDestination = (question: string) =>
  findExploration(question).destination;
