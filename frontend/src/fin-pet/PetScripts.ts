import library from "./scripts.json";
import type { PetAction } from "./PetDirector";
export type Behavior =
  | "Idle"
  | "Curious"
  | "Happy"
  | "Sleepy"
  | "Sleeping"
  | "Playing"
  | "Comforting"
  | "Focused";
export type ScriptHistory = {
  seen: Record<string, number>;
  recent: string[];
  day: string;
  daily: number;
  session: number;
  lastSpeech: number;
  counts?: Record<string, number>;
};
export const newHistory = (): ScriptHistory => ({
  seen: {},
  recent: [],
  day: new Date().toLocaleDateString(),
  daily: 0,
  session: 0,
  lastSpeech: 0,
});
const mapping: Record<string, PetAction> = {
  wave: "Wave",
  tilt: "Tilt",
  blink: "Blink",
  rest: "LieDown",
  book: "Seated",
  compass: "Tilt",
  notebook: "Seated",
  nod: "Tilt",
  scratch: "Tilt",
  hop: "Jump",
  inspect: "Tilt",
  receipt: "Wave",
  return_card: "Tilt",
  happy: "Jump",
  sit: "Sit",
  lamp: "Seated",
  approach: "Pet",
  nuzzle: "Pet",
  balance: "Walk",
  spin: "Walk",
  sleep: "Sleep",
  stretch: "Wake",
  curl: "LieDown",
  oops: "Tilt",
};
export function chooseScript(
  trigger: string,
  history: ScriptHistory,
  explicit: boolean,
  blocked: boolean,
  now = Date.now(),
  random = Math.random,
) {
  if (blocked && !explicit) return null;
  const day = new Date(now).toLocaleDateString();
  const h =
    day === history.day ? history : { ...history, day, daily: 0, counts: {} };
  const pool = library.filter(
    (s) =>
      s.trigger === trigger &&
      (!s.require_explicit_action || explicit) &&
      now - (h.seen[s.id] || 0) >= s.cooldown_seconds * 1000 &&
      !h.recent.includes(s.id) &&
      (h.counts?.[s.id] || 0) < s.daily_limit,
  );
  if (!pool.length) return null;
  const s = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  const speak =
    explicit ||
    (h.session < 2 && h.daily < 5 && now - h.lastSpeech >= 15 * 60 * 1000);
  const action: PetAction =
    s.id === "small_surprise_01"
      ? "Groom"
      : s.animation === "stretch"
        ? "Stretch"
        : mapping[s.animation] || "Idle";
  return {
    script: s,
    action,
    text: speak ? s.voice_text : "",
    history: {
      ...h,
      counts: { ...h.counts, [s.id]: (h.counts?.[s.id] || 0) + 1 },
      seen: { ...h.seen, [s.id]: now },
      recent: [...h.recent, s.id].slice(-12),
      daily: h.daily + (speak && s.voice_text ? 1 : 0),
      session: h.session + (speak && s.voice_text ? 1 : 0),
      lastSpeech: speak && s.voice_text ? now : h.lastSpeech,
    },
  };
}
export const scripts = library;
