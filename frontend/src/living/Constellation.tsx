import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import Fin from "./Fin";
import type { World } from "./types";
const labels = {
  unexplored: "尚未探索",
  exploring: "正在接触",
  building: "逐步建立",
  established: "已有学习证据",
};
const positions = [
  [292, 57],
  [455, 144],
  [449, 315],
  [283, 397],
  [99, 332],
  [64, 155],
  [145, 230],
];
export default function Constellation({
  world,
  compact = false,
}: {
  world: World;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null),
    [hover, setHover] = useState<number | null>(null);
  const point = (i: number) =>
    compact
      ? positions[i % 7]
      : [
          260 + Math.cos(i * 2.399) * Math.sqrt(i + 1) * 46,
          225 + Math.sin(i * 2.399) * Math.sqrt(i + 1) * 39,
        ];
  const nodes = world.topics.map((t, i) => ({ ...t, point: point(i) })),
    current = nodes.find((t) => t.id === selected);
  const linked = world.relations.filter(
    (r) =>
      r.from_topic_id === (selected ?? hover) ||
      r.to_topic_id === (selected ?? hover),
  );
  return (
    <div
      className={
        "constellation " +
        (compact ? "constellation-mini" : "constellation-full")
      }
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelected(null);
      }}
    >
      <svg
        viewBox="0 0 530 455"
        className="constellation-svg"
        role="group"
        aria-label={
          compact
            ? "你的知识星图，选择一个主题"
            : "完整知识星图，选择主题查看细节"
        }
      >
        <circle className="orbit-guide" cx="266" cy="229" r="184" />
        <circle className="orbit-guide inner" cx="266" cy="229" r="116" />
        <path
          className="orbit-tick"
          d="M261 33h10M266 28v10M460 224v10M455 229h10M261 426h10M266 421v10M67 224v10M62 229h10"
        />
        {world.relations.map((r) => {
          const a = nodes.find((t) => t.id === r.from_topic_id),
            b = nodes.find((t) => t.id === r.to_topic_id);
          if (!a || !b) return null;
          const active = linked.some((x) => x.id === r.id);
          return (
            <path
              key={r.id}
              className={
                "constellation-line " +
                (r.unlocked ? "unlocked " : "") +
                (active ? "emphasized" : "")
              }
              d={`M${a.point} Q${(a.point[0] + b.point[0]) / 2 + 16},${(a.point[1] + b.point[1]) / 2 - 22} ${b.point}`}
            >
              <title>
                {a.title} → {r.relation_label} → {b.title}
              </title>
            </path>
          );
        })}
        {nodes.map((t, i) => (
          <g
            key={t.id}
            className={
              "star star-" +
              t.state +
              (t.id === selected ? " selected" : "") +
              (i === 0 && world.summary.explored ? " current" : "")
            }
            transform={`translate(${t.point})`}
            role="button"
            tabIndex={0}
            aria-label={`${t.title} · ${labels[t.state]}`}
            aria-pressed={selected === t.id}
            onMouseEnter={() => setHover(t.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(t.id)}
            onBlur={() => setHover(null)}
            onClick={() => setSelected(selected === t.id ? null : t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(selected === t.id ? null : t.id);
              }
            }}
          >
            <circle className="star-hit" r="26" />
            <circle className="star-aura" r="18" />
            <circle
              className="star-core"
              r={t.state === "unexplored" ? 4 : 6}
            />
            <text y="34" textAnchor="middle">
              {t.title}
            </text>
            <text className="star-status" y="48" textAnchor="middle">
              {t.state === "unexplored" ? "EXPLORE" : labels[t.state]}
            </text>
          </g>
        ))}
      </svg>
      <div className="constellation-fin">
        <Fin
          mood={world.companion.mood}
          size={compact ? 68 : 60}
          domains={world.companion.domains_awakened}
          seed={world.companion.companion_form === "seed"}
        />
        <span>
          {world.companion.companion_form === "seed"
            ? "A WORLD WAITING TO GROW"
            : "FIN · YOUR QUIET COMPANION"}
        </span>
      </div>
      <div className="constellation-caption">
        <span className="tiny-spark">✧</span> A living map of what you
        understand.
      </div>
      {current && (
        <aside className="constellation-detail" aria-label="主题速览">
          <button
            className="icon-button"
            onClick={() => setSelected(null)}
            aria-label="关闭主题速览"
          >
            <X size={16} />
          </button>
          <span className="overline">
            {current.english} · {labels[current.state]}
          </span>
          <h3>{current.title}</h3>
          <p>{current.summary}</p>
          {linked.length > 0 && (
            <p className="detail-relation">
              {linked[0].relation_label} ·{" "}
              {
                nodes.find(
                  (n) =>
                    n.id ===
                    (linked[0].from_topic_id === current.id
                      ? linked[0].to_topic_id
                      : linked[0].from_topic_id),
                )?.title
              }
            </p>
          )}
          <div className="row wrap">
            {current.lesson_id && (
              <Link to={"/lessons/" + current.lesson_id}>阅读课程</Link>
            )}
            {current.lab_id && (
              <Link to={"/lab/" + current.lab_id}>尝试实验</Link>
            )}
            <Link to={"/topics/" + current.id}>
              Open full topic <ArrowUpRight size={13} />
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
