import { useId } from "react";
import type { FinMood } from "./types";
export default function Fin({
  mood = "calm",
  size = 64,
  domains = [],
  seed = false,
}: {
  mood?: FinMood;
  size?: number;
  domains?: number[];
  seed?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <span
      className={"fin fin-" + mood + (seed ? " fin-seed" : "")}
      role="img"
      aria-label={"Fin · " + mood}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#f6faf8" />
            <stop offset=".55" stopColor="#c6e0d9" />
            <stop offset="1" stopColor="#82b3b2" />
          </linearGradient>
        </defs>
        <path
          className="fin-trail"
          d="M36 75Q21 83 12 73M32 82Q24 89 19 84"
          fill="none"
          stroke="#82b3b2"
          strokeWidth="1.5"
          opacity=".65"
        />
        <path
          d="M79 65A35 35 0 1 0 46 85"
          fill="none"
          stroke="#7ea6a4"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path d="M49 8l3 5-6 0Z" fill="#356b73" />
        <path
          d="M27 34C34 17 59 17 70 35C79 50 72 66 58 73C51 78 46 76 43 72C26 70 20 50 27 34Z"
          fill={"url(#" + id + ")"}
          stroke="#8db6b1"
          strokeWidth=".7"
        />
        {!seed && (
          <g
            className="fin-eyes"
            stroke="#356b73"
            strokeWidth="2.8"
            strokeLinecap="round"
          >
            {mood === "resting" ? (
              <>
                <path d="M38 47h5M55 47h5" />
              </>
            ) : (
              <>
                <path d="M40 44v4M57 44v4" />
                {mood === "bright" && (
                  <path d="M46 55q4 3 8 0" fill="none" strokeWidth="1.4" />
                )}
              </>
            )}
          </g>
        )}
        {domains.includes(1) && <circle cx="75" cy="29" r="2" fill="#d7a65b" />}
        {domains.includes(5) && (
          <path
            d="M69 72l13-3 2 14-13 2zM74 74l1 9"
            fill="#f7f8f5"
            stroke="#82b3b2"
          />
        )}
        {domains.includes(2) && (
          <ellipse
            cx="50"
            cy="50"
            rx="43"
            ry="15"
            transform="rotate(-30 50 50)"
            fill="none"
            stroke="#9abba5"
            strokeWidth="1"
            opacity=".6"
          />
        )}
        {domains.includes(3) && (
          <path d="M61 20l5-8m-1-4h3" stroke="#82b3b2" fill="none" />
        )}
        {domains.includes(4) && (
          <path d="M81 47l6 7-8 4z" stroke="#a39abb" fill="#f0edf5" />
        )}
      </svg>
    </span>
  );
}
