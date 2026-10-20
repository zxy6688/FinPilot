import knowledge from "../../../content/knowledge.json";
import lessons from "../../../content/lessons.json";
import labs from "../../../content/labs.json";
export { knowledge, lessons, labs };
export const conceptUrl = (id: number) => `/concept-studio/${id}`;
export const conceptById = (id: number) =>
  knowledge.concepts.find((c) => c.id === id);
export const knowledgeIndex = [
  ...knowledge.concepts.map((c) => ({
    id: "core-" + c.id,
    title: c.title,
    summary: c.summary,
    url: conceptUrl(c.id),
    group: "核心概念",
  })),
  ...lessons.map((l) => ({
    id: "lesson-" + l.id,
    title: l.title,
    summary: l.ask_prompts.join(" "),
    url: "/lessons/" + l.id,
    group: "课程",
  })),
];
export const journeyMap: Record<string, number[]> = {
  "/stories/budget": [17, 25, 4],
  "/decoder/purchasing-power": [1, 2, 32],
  "/stories/etf": [7, 19, 20, 35],
  "/stories/bonds": [6, 9, 33, 34],
  "/stories/loan": [27, 28, 25],
  "/money-lab/budget": [17, 25],
  "/money-lab/loan": [27, 28],
  "/money-lab/compound": [3, 28],
  "/money-lab/inflation": [2, 32],
  "/money-lab/savings": [18, 4],
};
