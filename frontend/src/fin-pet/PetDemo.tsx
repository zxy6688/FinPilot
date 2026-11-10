import { useState } from "react";
import { Link } from "react-router-dom";
import PetViewport from "./PetViewport";
import { usePet } from "./PetProvider";
import { actions, type PetAction } from "./PetDirector";
import "./pet.css";
import PetLifePanel from "./PetLifePanel";
export default function PetDemo() {
  const [toyCommand,setToyCommand]=useState<{kind:string;id:number}>();
  const pet = usePet(),
    [angle, setAngle] = useState(0.32),
    [ready, setReady] = useState(false),
    [paused, setPaused] = useState(false),
    [expression, setExpression] = useState<
      | "Happy"
      | "Confused"
      | "Drowsy"
      | "Surprise"
      | "Shy"
      | "Sad"
      | "Relaxed"
      | undefined
    >();
  return (
    <article className="rd-page pet-demo">
      <header className="pet-demo-heading">
        <div>
          <p>Fin · 小窝与互动</p>
          <h1>一只有体积的 Fin。</h1>
          <p>
            旋转看看侧面和背面，再试试动作。角色为 Blender 建模的真实
            GLB，当前是技术与造型样板，尚非最终美术定稿。
          </p>
        </div>
        <Link to="/">回到首页 →</Link>
      </header>
      <div className="pet-demo-layout">
        <section
          className="pet-stage"
          aria-label="真实三维角色预览"
          data-ready={ready}
          data-action={pet.state.action}
        >
          <PetViewport
            studio
            room={pet.life.data.room}
            toyCommand={toyCommand}
            outfit={pet.life.data.outfit}
            onPlay={() => pet.life.react("PET_PLAY", true)}
            action={pet.state.action}
            sequence={pet.state.sequence}
            reduced={pet.reduced}
            paused={paused}
            angle={angle}
            expression={
              expression ||
              (pet.life.mood === "开心"
                ? "Happy"
                : pet.life.mood === "疲惫"
                  ? "Drowsy"
                  : pet.life.mood === "难过"
                    ? "Sad"
                    : pet.life.quiet
                      ? "Relaxed"
                      : undefined)
            }
            contact={pet.state.contact}
            lowPower={pet.prefs.lowPower}
            onReady={() => setReady(true)}
            onFinish={(sequence) =>
              pet.dispatch({ type: "FINISHED", sequence })
            }
          />
          <span className="pet-stage-label">
            {pet.prefs.lowPower
              ? "静态省电降级"
              : "真实 GLB · 可编辑骨架与面部形变 · 待人工美术验收"}
          </span>
        </section>
        <section className="pet-demo-controls">
          <div className="pet-view-buttons" aria-label="小窝玩具"><button onClick={()=>{setToyCommand({kind:'plane',id:Date.now()});pet.life.react('PET_PLAY',true)}}>抛纸飞机</button><button onClick={()=>{setToyCommand({kind:'ball',id:Date.now()});pet.life.react('PET_PLAY',true)}}>轻推小球</button></div>
          <PetLifePanel />
          <h2>看一看，动一动</h2>
          <div className="pet-view-buttons">
            {[
              ["正面", 0],
              ["侧面", Math.PI / 2],
              ["背面", Math.PI],
              ["三分之四侧", 0.5],
            ].map(([label, value]) => (
              <button key={label} onClick={() => setAngle(Number(value))}>
                {label}
              </button>
            ))}
          </div>
          <label>
            旋转角度
            <input
              aria-label="旋转角度"
              type="range"
              min={-3.14}
              max={3.14}
              step={0.01}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <p role="status">当前动作：{actions[pet.state.action]}</p>
          <div className="pet-view-buttons" aria-label="面部表情">
            {(
              [
                ["普通", undefined],
                ["开心", "Happy"],
                ["困惑", "Confused"],
                ["困倦", "Drowsy"],
                ["惊讶", "Surprise"],
                ["害羞", "Shy"],
                ["难过", "Sad"],
                ["放松", "Relaxed"],
              ] as const
            ).map(([label, value]) => (
              <button
                key={label}
                aria-pressed={expression === value}
                onClick={() => setExpression(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pet-actions">
            {(
              [
                "Idle",
                "Tilt",
                "Walk",
                "Run",
                "Jump",
                "Pet",
                "Groom",
                "Stretch",
                "Prone",
                "Shy",
                "Sleep",
                "Wake",
              ] as PetAction[]
            ).map((a) => (
              <button
                key={a}
                aria-pressed={pet.state.action === a}
                onClick={() => {
                  setExpression(undefined);
                  pet.act(a);
                }}
              >
                {actions[a]}
              </button>
            ))}
          </div>
          <button className="pet-primary" onClick={() => setPaused((v) => !v)}>
            {paused ? "继续播放" : "暂停画面"}
          </button>
          <button onClick={() => pet.setPanel(true)}>宠物设置</button>
          <p>
            在其他页面轻点 Fin 打开面板；长按 0.55
            秒摸头，拖动后停靠四角。键盘可打开面板并选择动作和位置。
          </p>
          <p>
            减少动画会停止连续动作，仅显示姿势。无 WebGL
            或开启省电模式时明确降级为原插画，不冒充 3D。
          </p>
        </section>
      </div>
      <section className="pet-demo-notes">
        <h2>这轮完成到哪里</h2>
        <p>
          已接入真实骨架、独立叶冠与肢体、眼部闭合、呼吸、走动、起跳预备与落地回弹、坐下、睡觉、醒来、摸头和挥手。动作在切换时混合过渡。
        </p>
        <p>
          这是程序化修型候选，不是专业美术终稿。已加入贴合面部的眼睛、眼睑与嘴角形变、脚底目标约束和蜷身休息。仍需打磨叶片、肩部连接和表情美感；没有柔体物理或真实触觉碰撞。摸头按接触位置调整朝向，走动限定在展示区域内。
        </p>
        <p>
          基础陪伴使用本地规则与脚本，不调用付费
          AI。心情仅由你主动选择；访客记录保存在本浏览器，登录后可主动保存到账户。角色美术仍待人工验收。
        </p>
      </section>
    </article>
  );
}
