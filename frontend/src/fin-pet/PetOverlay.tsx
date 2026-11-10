import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { usePet } from "./PetProvider";
import { actions, type PetAction } from "./PetDirector";
import PetViewport from "./PetViewport";
import { touchTone } from "./PetAudio";
import "./pet.css";
import PetLifePanel from "./PetLifePanel";
type Point = { x: number; y: number };
export default function PetOverlay() {
  const pet = usePet(),
    location = useLocation(),
    ref = useRef<HTMLDivElement>(null),
    close = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 }),
    [blocked, setBlocked] = useState(true),
    [dragging, setDragging] = useState(false),
    [mobile, setMobile] = useState(innerWidth < 700);
  const gesture = useRef<{
    id: number;
    start: Point;
    origin: Point;
    moved: boolean;
    held: boolean;
    timer: number;
  } | null>(null);
  const doAction = (action: PetAction) => {
    pet.act(action);
    if (!pet.prefs.muted) touchTone();
  };
  const locate = useCallback(() => {
    if (gesture.current?.moved) return;
    const small = innerWidth < 700;
    setMobile(small);
    const w = small ? 72 : 128,
      h = small ? 86 : 154;
    const active = document.activeElement;
    const typing =
      active instanceof HTMLElement &&
      active.matches('input,textarea,select,[contenteditable="true"]') &&
      !active.closest(".pet-panel");
    const modal = !!document.querySelector(
      'dialog[open], [role="dialog"]:not(.pet-panel)',
    );
    const keyboard =
      !!visualViewport && visualViewport.height < innerHeight * 0.76;
    if (typing || modal || keyboard) {
      setBlocked(true);
      return;
    }
    const spots: Record<string, Point> = {
      "top-left": { x: 12, y: 84 },
      "top-right": { x: innerWidth - w - 12, y: 84 },
      "bottom-left": { x: 12, y: innerHeight - h - 100 },
      "bottom-right": { x: innerWidth - w - 12, y: innerHeight - h - 100 },
    };
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        'input,textarea,select,button,a,h1,h2,[role="button"],output,.gb-results,.lab-results',
      ),
    )
      .filter(
        (e) =>
          !e.closest(".pet-overlay,.pet-panel") &&
          e.getClientRects().length > 0,
      )
      .map((e) => e.getBoundingClientRect());
    const order = [
      pet.prefs.dock,
      ...Object.keys(spots).filter((k) => k !== pet.prefs.dock),
    ];
    const preferred = pet.prefs.position
      ? {
          x: Math.max(8, Math.min(innerWidth - w - 8, pet.prefs.position.x)),
          y: Math.max(
            84,
            Math.min(innerHeight - h - 100, pet.prefs.position.y),
          ),
        }
      : null;
    const spot = [
      ...(preferred ? [preferred] : []),
      ...order.map((k) => spots[k]),
    ].find(
      (p) =>
        p.y > 75 &&
        !controls.some(
          (r) =>
            r.width &&
            r.height &&
            p.x < r.right + 6 &&
            p.x + w > r.left - 6 &&
            p.y < r.bottom + 6 &&
            p.y + h > r.top - 6,
        ),
    );
    setBlocked(!spot);
    if (spot)
      setPosition((old) => (old.x === spot.x && old.y === spot.y ? old : spot));
  }, [pet.prefs.dock, pet.prefs.position]);
  useEffect(() => {
    locate();
    let timer = 0;
    const schedule = () => {
      if (!timer)
        timer = window.setTimeout(() => {
          timer = 0;
          locate();
        }, 120);
    };
    const main = document.querySelector("main");
    const resize = new ResizeObserver(schedule);
    const mutation = new MutationObserver(schedule);
    if (main) {
      resize.observe(main);
      mutation.observe(main, { childList: true, subtree: true });
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("focusin", schedule);
    window.addEventListener("focusout", schedule);
    visualViewport?.addEventListener("resize", schedule);
    return () => {
      clearTimeout(timer);
      resize.disconnect();
      mutation.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("focusin", schedule);
      window.removeEventListener("focusout", schedule);
      visualViewport?.removeEventListener("resize", schedule);
    };
  }, [locate, location.pathname]);
  useEffect(
    () => () => {
      if (gesture.current) clearTimeout(gesture.current.timer);
    },
    [],
  );
  useEffect(() => {
    if (!pet.panel) return;
    const before = document.activeElement as HTMLElement;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pet.setPanel(false);
        before?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [pet.panel]);
  function down(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const g = {
      id: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      origin: position,
      moved: false,
      held: false,
      timer: 0,
    };
    g.timer = window.setTimeout(() => {
      if (!g.moved) {
        g.held = true;
        const r = ref.current?.getBoundingClientRect();
        pet.act(
          "Pet",
          r
            ? {
                x: Math.max(
                  -1,
                  Math.min(1, ((g.start.x - r.left) / r.width) * 2 - 1),
                ),
                y: Math.max(
                  -1,
                  Math.min(1, ((g.start.y - r.top) / r.height) * 2 - 1),
                ),
              }
            : undefined,
        );
        pet.life.react("PET_PAT", true);
        if (!pet.prefs.muted) touchTone();
      }
    }, 550);
    gesture.current = g;
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId || g.held) return;
    const dx = e.clientX - g.start.x,
      dy = e.clientY - g.start.y;
    if (Math.hypot(dx, dy) > 8) {
      clearTimeout(g.timer);
      if (!g.moved) {
        g.moved = true;
        setDragging(true);
        pet.act("Walk");
      }
      setPosition({
        x: Math.max(
          8,
          Math.min(innerWidth - (mobile ? 80 : 136), g.origin.x + dx),
        ),
        y: Math.max(
          80,
          Math.min(innerHeight - (mobile ? 180 : 245), g.origin.y + dy),
        ),
      });
    }
  }
  function up(e: PointerEvent<HTMLButtonElement>, cancel = false) {
    const g = gesture.current;
    if (!g) return;
    clearTimeout(g.timer);
    gesture.current = null;
    setDragging(false);
    if (g.moved && !cancel) {
      pet.life.react("PET_DRAG", true);
      pet.update({
        position,
        dock: `${e.clientY < innerHeight / 2 ? "top" : "bottom"}-${e.clientX < innerWidth / 2 ? "left" : "right"}` as typeof pet.prefs.dock,
      });
      pet.act("Idle");
    } else if (!g.held && !cancel) {
      doAction("Wave");
      pet.setPanel(true);
    }
    locate();
  }
  const visible =
    !pet.prefs.hidden && !blocked && location.pathname !== "/fin-pet";
  return (
    <>
      <div
        ref={ref}
        className="pet-overlay"
        data-action={pet.state.action}
        data-sequence={pet.state.sequence}
        data-blocked={blocked}
        data-visible={visible}
        style={{
          left: position.x,
          top: position.y,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <button
          className="pet-touch"
          aria-label="Fin 3D 宠物：点击互动，长按摸头，拖动移动"
          aria-haspopup="dialog"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={(e) => up(e)}
          onPointerCancel={(e) => up(e, true)}
          onClick={(e) => {
            if (e.detail === 0) {
              doAction("Wave");
              pet.setPanel(true);
            }
          }}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          {location.pathname !== "/fin-pet" && (
            <PetViewport
              action={pet.state.action}
              outfit={pet.life.data.outfit}
              expression={
                pet.life.mood === "开心"
                  ? "Happy"
                  : pet.life.mood === "疲惫"
                    ? "Drowsy"
                    : pet.life.mood === "难过"
                      ? "Sad"
                      : pet.life.quiet
                        ? "Relaxed"
                        : undefined
              }
              sequence={pet.state.sequence}
              contact={pet.state.contact}
              reduced={pet.reduced}
              paused={!visible}
              lowPower={pet.prefs.lowPower || pet.prefs.hidden}
              onFinish={(sequence) =>
                pet.dispatch({ type: "FINISHED", sequence })
              }
            />
          )}
        </button>
      </div>
      {pet.panel && (
        <aside
          className="pet-panel"
          role="dialog"
          aria-label="Fin 宠物互动与设置"
        >
          <header>
            <div>
              <h2>Fin</h2>
              <p>3D 技术样板 · 造型与动作待验收</p>
            </div>
            <button
              ref={close}
              aria-label="关闭宠物面板"
              onClick={() => pet.setPanel(false)}
            >
              ×
            </button>
          </header>
          <p className="pet-current" role="status">
            当前：{actions[pet.state.action]}。基础动作在本机运行。
          </p>
          <PetLifePanel />
          <div className="pet-actions">
            {(
              [
                "Wave",
                "Pet",
                "Tilt",
                "Jump",
                "Sit",
                "Sleep",
                "Wake",
              ] as PetAction[]
            ).map((a) => (
              <button key={a} onClick={() => doAction(a)}>
                {actions[a]}
              </button>
            ))}
          </div>
          <fieldset>
            <legend>显示与声音</legend>
            <label>
              <input
                type="checkbox"
                checked={pet.prefs.hidden}
                onChange={(e) => {
                  if (e.target.checked) pet.life.react("PET_HIDE", true);
                  pet.update({ hidden: e.target.checked });
                }}
              />
              隐藏宠物
            </label>
            <label>
              <input
                type="checkbox"
                checked={pet.prefs.muted}
                onChange={(e) => pet.update({ muted: e.target.checked })}
              />
              静音（默认关闭轻触提示音）
            </label>
            <label>
              <input
                type="checkbox"
                checked={pet.prefs.reduced}
                onChange={(e) => pet.update({ reduced: e.target.checked })}
              />
              减少动画
            </label>
            <label>
              <input
                type="checkbox"
                checked={pet.prefs.lowPower}
                onChange={(e) => pet.update({ lowPower: e.target.checked })}
              />
              省电：使用原 Fin 静态插画
            </label>
            {pet.systemReduced && <p>系统已要求减少动画，优先遵守系统设置。</p>}
          </fieldset>
          <label className="pet-dock">
            停靠位置
            <select
              value={pet.prefs.dock}
              onChange={(e) =>
                pet.update({ dock: e.target.value as typeof pet.prefs.dock })
              }
            >
              <option value="top-left">左上</option>
              <option value="top-right">右上</option>
              <option value="bottom-left">左下</option>
              <option value="bottom-right">右下</option>
            </select>
          </label>
          <div className="pet-links">
            <button
              onClick={() => {
                pet.update({ dock: "bottom-right", position: undefined });
                pet.act("Idle");
              }}
            >
              重置位置
            </button>
            <button
              onClick={() => {
                pet.setPanel(false);
                window.dispatchEvent(new Event("fin-chat"));
              }}
            >
              问 Fin
            </button>
            <Link to="/fin-pet" onClick={() => pet.setPanel(false)}>
              查看 3D 动作演示 →
            </Link>
          </div>
          <small>
            输入、弹窗和手机键盘出现时自动让位。设置仅保存在此浏览器；不读取输入内容，不同步财务数据。小窝、心情和换装尚未接入。
          </small>
        </aside>
      )}
    </>
  );
}
