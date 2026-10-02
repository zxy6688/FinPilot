import RelationDetail from "./RelationDetail";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import type { TopicDetail } from "../types";
export default function KnowledgeMap({ topic }: { topic: TopicDetail }) {
  const [selected, setSelected] = useState<string>(
    "点击关系线查看说明；点击节点继续探索。",
  );
  const [relationId, setRelationId] = useState<number | null>(null);
  const marker = useId().replace(/:/g, "");
  const incoming = topic.relations.filter((e) => e.to_topic_id === topic.id),
    outgoing = topic.relations.filter((e) => e.from_topic_id === topic.id);
  const height = Math.max(
      360,
      Math.max(incoming.length, outgoing.length) * 104 + 56,
    ),
    cy = height / 2;
  const edges = [
    ...incoming.map((e, i) => ({
      e,
      left: true,
      x: 132,
      y: (height / (incoming.length + 1)) * (i + 1),
    })),
    ...outgoing.map((e, i) => ({
      e,
      left: false,
      x: 908,
      y: (height / (outgoing.length + 1)) * (i + 1),
    })),
  ];
  return (
    <section className="knowledge-map card">
      <div className="row between">
        <div>
          <div className="eyebrow">KNOWLEDGE MAP</div>
          <h2>把概念连起来</h2>
        </div>
        <span className="tag">{topic.relations.length} 条知识连接</span>
      </div>
      <svg
        className="relationship-svg"
        viewBox={`0 0 1040 ${height}`}
        role="group"
        aria-label={`${topic.title}知识关系图`}
      >
        <defs>
          <marker
            id={marker}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 8 4 0 8" fill="#74988A" />
          </marker>
        </defs>
        {edges.map(({ e, left, y }) => {
          const label = e.relation_label,
            from = left ? 220 : 614,
            to = left ? 426 : 820,
            ly = (cy + y) / 2;
          return (
            <g
              key={e.id}
              role="button"
              tabIndex={0}
              aria-label={`${e.from_title}，${label}，${e.to_title}`}
              className="relation-edge"
              onClick={() => {
                setRelationId(e.id);
                setSelected(
                  `${e.from_title} → ${e.to_title}：${label}。具体影响取决于条件，不表示单一因素决定结果。`,
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setRelationId(e.id);
                  setSelected(
                    `${e.from_title} → ${e.to_title}：${label}。具体影响取决于条件。`,
                  );
                }
              }}
            >
              <title>
                {e.from_title} → {e.to_title}：{label}
              </title>
              <path
                d={`M${from} ${left ? y : cy} C${left ? 305 : 710} ${left ? y : cy},${left ? 335 : 750} ${left ? cy : y},${to} ${left ? cy : y}`}
                fill="none"
                stroke="#9CB7A9"
                strokeWidth="2"
                markerEnd={`url(#${marker})`}
              />
              <rect
                x={(left ? 322 : 720) - 89}
                y={ly - 25}
                width="178"
                height="45"
                rx="8"
                fill="#F1F5F0"
              />
              <text
                x={left ? 322 : 720}
                y={ly - 5}
                textAnchor="middle"
                fontSize="13"
                fill="#405D50"
              >
                {label.match(/.{1,12}/g)?.map((line, i) => (
                  <tspan key={i} x={left ? 322 : 720} dy={i ? 18 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
        <rect
          x="426"
          y={cy - 48}
          width="188"
          height="96"
          rx="22"
          fill="#173F35"
        />
        <text
          x="520"
          y={cy - 3}
          textAnchor="middle"
          fill="white"
          fontSize="24"
          fontWeight="600"
        >
          {topic.title}
        </text>
        <text
          x="520"
          y={cy + 23}
          textAnchor="middle"
          fill="#C4D7CC"
          fontSize="12"
        >
          当前主题 · {topic.domain}
        </text>
        {edges.map(({ e, left, x, y }) => {
          const id = left ? e.from_topic_id : e.to_topic_id,
            title = left ? e.from_title : e.to_title,
            related = topic.related.find((t) => t.id === id);
          return (
            <Link
              key={e.id}
              to={`/topics/${id}`}
              className="topic-node"
              aria-label={`探索${title}`}
            >
              <title>{related?.summary || title}</title>
              <rect
                x={x - 88}
                y={y - 31}
                width="176"
                height="62"
                rx="15"
                fill="#FFFDF8"
                stroke="#BFCFC3"
              />
              <circle cx={x - 61} cy={y} r="4" fill="#B89552" />
              <text
                x={x + 7}
                y={y + 6}
                textAnchor="middle"
                fill="#173F35"
                fontSize="18"
              >
                {title}
              </text>
            </Link>
          );
        })}
      </svg>
      <div className="map-mobile">
        <div className="map-mobile-center">
          {topic.title}
          <small>知识连接</small>
        </div>
        {topic.relations.map((e) => (
          <div className="mobile-relation" key={e.id}>
            <div>
              <Link to={`/topics/${e.from_topic_id}`}>{e.from_title}</Link>
              <span aria-hidden="true"> → </span>
              <Link to={`/topics/${e.to_topic_id}`}>{e.to_title}</Link>
            </div>
            <button
              className="quiet"
              onClick={() => {
                setRelationId(e.id);
                setSelected(
                  `${e.from_title} → ${e.to_title}：${e.relation_label}。具体影响取决于条件。`,
                );
              }}
            >
              {e.relation_label}
            </button>
          </div>
        ))}
      </div>
      <p className="map-explanation" aria-live="polite">
        {selected}
      </p>
      {relationId !== null && (
        <RelationDetail topicId={topic.id} relationId={relationId} />
      )}
    </section>
  );
}
