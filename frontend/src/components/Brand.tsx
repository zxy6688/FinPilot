import { Link } from "react-router-dom";
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#173F35" />
      <circle cx="24" cy="24" r="15" stroke="#C9DFD3" strokeWidth="1.3" />
      <path d="M29 15 19 20 17 32 29 27 29 15Z" fill="#EAF2ED" />
      <path d="m19 20 10 7" stroke="#173F35" strokeWidth="1.5" />
      <circle cx="29" cy="15" r="3" fill="#B89552" />
      <circle cx="17" cy="32" r="2.5" fill="#8FBDA9" />
    </svg>
  );
}
export function KnowledgeCompass({ compact = false }: { compact?: boolean }) {
  const nodes = [
    { id: 9, title: "利率", sub: "资金的时间价格", x: 248, y: 42 },
    { id: 7, title: "ETF", sub: "连接指数与基金", x: 421, y: 154 },
    { id: 21, title: "风险", sub: "理解不确定性", x: 354, y: 342 },
    { id: 2, title: "通胀", sub: "观察购买力", x: 144, y: 342 },
    { id: 13, title: "行为", sub: "看见决策偏差", x: 74, y: 154 },
  ];
  return (
    <div className={"knowledge-compass " + (compact ? "compact" : "")}>
      <svg
        viewBox="0 0 500 410"
        role="img"
        aria-label="FinPilot 知识罗盘：从利率、ETF、风险、通胀与行为进入学习"
      >
        <circle
          cx="248"
          cy="204"
          r="144"
          fill="none"
          stroke="currentColor"
          opacity=".12"
        />
        <circle
          cx="248"
          cy="204"
          r="104"
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 8"
          opacity=".2"
        />
        {nodes.map((n) => (
          <path
            key={n.id}
            d={`M248 204 L${n.x} ${n.y}`}
            stroke="currentColor"
            opacity=".17"
          />
        ))}
        <path
          d="M248 60 A144 144 0 0 1 384 250"
          stroke="#B89552"
          strokeWidth="3"
          fill="none"
        />
        <circle cx="248" cy="204" r="68" fill="#173F35" />
        <text
          x="248"
          y="199"
          textAnchor="middle"
          fill="#fff"
          fontSize="25"
          fontWeight="700"
        >
          FinPilot
        </text>
        <text
          x="248"
          y="224"
          textAnchor="middle"
          fill="#BCD2C6"
          fontSize="12"
          letterSpacing="2"
        >
          KNOWLEDGE
        </text>
        {nodes.map((n) => (
          <Link
            to={`/topics/${n.id}`}
            key={n.id}
            className="compass-node"
            aria-label={`探索${n.title}`}
          >
            <title>{n.sub}</title>
            <rect
              x={n.x - 57}
              y={n.y - 25}
              width="114"
              height="52"
              rx="14"
              fill="#FFFDF8"
              stroke="#D3DDD4"
            />
            <circle cx={n.x - 34} cy={n.y} r="4" fill="#B89552" />
            <text
              x={n.x + 6}
              y={n.y + 6}
              fontSize="17"
              fontWeight="600"
              textAnchor="middle"
              fill="#173F35"
            >
              {n.title}
            </text>
          </Link>
        ))}
        <text x="250" y="402" textAnchor="middle" fontSize="12" fill="#52685E">
          从一个问题出发，连接整个知识世界
        </text>
      </svg>
      <p className="compass-relations">央行 → 利率 → 债券 · 通胀 → 购买力</p>
    </div>
  );
}
