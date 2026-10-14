import { useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import type { FinMood } from "../living/types";
export function FinArt({
  mood = "calm",
  size = 64,
  action = "",
  view = "",
}: {
  mood?: FinMood;
  size?: number;
  action?: string;
  view?: string;
}) {
  const cells: Record<string, number> = {
    front: 0,
    "three-quarter": 1,
    back: 2,
    side: 3,
    calm: 4,
    curious: 5,
    thinking: 6,
    bright: 7,
    resting: 8,
    wave: 9,
    tilt: 10,
    card: 11,
    receipt: 12,
    notebook: 13,
  };
  const key = view || action || mood;
  const cell = cells[key] ?? cells.calm;
  const labels: Record<string, string> = {
    front: "正面",
    "three-quarter": "侧面",
    back: "背面",
    calm: "陪伴",
    curious: "好奇",
    thinking: "思考",
    bright: "明亮",
    resting: "休息",
    wave: "挥手",
    tilt: "歪头观察",
    card: "翻卡片",
    receipt: "递出小票",
    notebook: "收进手册",
  };
  // The painted atlas has optical spacing, not exact equal-cell gutters.
  // Explicit viewports preserve entire poses without leaking adjacent feet.
  const regions = [
    [30, 10, 300, 317],
    [340, 10, 290, 317],
    [647, 15, 304, 312],
    [960, 10, 284, 317],
    [30, 335, 300, 302],
    [340, 329, 298, 308],
    [647, 329, 300, 308],
    [957, 337, 293, 300],
    [20, 674, 311, 250],
    [344, 639, 293, 285],
    [646, 654, 308, 278],
    [956, 639, 297, 289],
    [28, 929, 305, 313],
    [338, 931, 300, 313],
  ];
  return (
    <svg
      role="img"
      aria-label={"Fin · " + (labels[key] || key)}
      className={"rd-fin-art a1-fin-sprite rd-fin-" + mood}
      width={size}
      height={size}
      viewBox={regions[cell].join(" ")}
      overflow="hidden"
    >
      <image
        href="/redesign/a1/fin-atlas-spaced.png"
        width="1254"
        height="1254"
      />
    </svg>
  );
}

export default function FinButton({
  size = 48,
  scene = false,
}: {
  size?: number;
  scene?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [quiet, setQuiet] = useState(
    () => sessionStorage.getItem("fin-quiet") === "yes",
  );
  return (
    <>
      <button
        className={"rd-fin-button" + (scene ? " rd-scene-fin-hit" : "")}
        aria-label="和 Fin 互动"
        onClick={() => setOpen(true)}
      >
        {!scene && <FinArt size={size} mood={quiet ? "resting" : "curious"} />}
      </button>
      {open && (
        <Modal
          title="Fin 在这里"
          onClose={() => setOpen(false)}
          className="rd-fin-dialog"
        >
          <FinArt
            size={112}
            mood={quiet ? "resting" : "bright"}
            action={quiet ? "" : "wave"}
          />
          <p>要不要把一个小问题，变成一张自己的发现？</p>
          <div className="rd-drawer-actions">
            <button
              className="rd-button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event("fin-chat"));
              }}
            >
              问 Fin 一个问题
            </button>
            <Link
              className="rd-secondary"
              to="/profile"
              onClick={() => setOpen(false)}
            >
              看看我的发现
            </Link>
            <button
              className="rd-text"
              onClick={() => {
                const next = !quiet;
                setQuiet(next);
                sessionStorage.setItem("fin-quiet", next ? "yes" : "no");
                setOpen(false);
              }}
            >
              {quiet ? "让 Fin 回来陪伴" : "让 Fin 安静一会儿"}
            </button>
          </div>
          <small>
            AI 使用现有 Copilot。当前 Demo 模式不提供任意文章的智能核验。
          </small>
        </Modal>
      )}
    </>
  );
}
export function FinDesign() {
  return (
    <div className="rd-page rd-design">
      <div className="rd-heading">
        <span className="rd-kicker">角色设计 · Gate A1 视觉基线</span>
        <h1>认识陪你探索的 Fin。</h1>
        <p>
          一个温暖好奇的小导航员。统一轮廓、配色与动作，而不是随页面变化的装饰。
        </p>
      </div>
      <section className="rd-sheet">
        <h2>01 / 轮廓与三视</h2>
        <div className="rd-fin-line">
          {["front", "three-quarter", "back"].map((v, i) => (
            <figure key={v}>
              <FinArt view={v} size={192} />
              <figcaption>{["正面", "3/4 侧面", "背面"][i]}</figcaption>
            </figure>
          ))}
        </div>
        <div className="rd-swatches">
          {[
            "#FFFDF6",
            "#267B78",
            "#7AC6D0",
            "#24585A",
            "#F1C467",
            "#F2B7A6",
          ].map((c) => (
            <span key={c}>
              <i style={{ background: c }} />
              {c}
            </span>
          ))}
        </div>
        <p>
          身体约占全高
          65%；冠、鳍翼、双眼、罗盘为四个识别点。轮廓浅描边，暖白有体积；黄色用于罗盘而非大片装饰。
        </p>
      </section>
      <section className="rd-sheet">
        <h2>02 / 五种表情</h2>
        <div className="rd-fin-line">
          {(
            ["calm", "curious", "thinking", "bright", "resting"] as FinMood[]
          ).map((m, i) => (
            <figure key={m}>
              <FinArt mood={m} size={120} />
              <figcaption>
                {["陪伴", "好奇", "思考", "明亮", "休息"][i]}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="rd-sheet">
        <h2>03 / 五个动作</h2>
        <div className="rd-fin-line">
          {["wave", "tilt", "card", "receipt", "notebook"].map((m, i) => (
            <figure key={m}>
              <FinArt action={m} size={120} />
              <figcaption>
                {
                  ["轻轻挥手", "歪头观察", "翻小卡片", "递出小票", "收进手册"][
                    i
                  ]
                }
              </figcaption>
            </figure>
          ))}
        </div>
        <p>
          动作以静态关键姿态交付；微动效只用于真实点击与保存反馈。系统减少动画时保持静态。
        </p>
      </section>
      <section className="rd-sheet">
        <h2>04 / 小尺寸与背景验证</h2>
        <div className="rd-size-tests">
          {[32, 64, 192].map((s) => (
            <figure key={s}>
              <FinArt size={s} />
              <figcaption>{s}px</figcaption>
            </figure>
          ))}
          <div style={{ background: "#267B78", padding: 20, borderRadius: 20 }}>
            <FinArt size={96} />
          </div>
          <div style={{ background: "#F1C467", padding: 20, borderRadius: 20 }}>
            <FinArt size={96} />
          </div>
        </div>
      </section>
      <Link className="rd-button" to="/">
        查看首页中的实际组合
      </Link>
    </div>
  );
}
