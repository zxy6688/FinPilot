import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import {
  chooseScript,
  newHistory,
  type Behavior,
  type ScriptHistory,
} from "./PetScripts";
import type { PetAction } from "./PetDirector";
import { BUSINESS_EVENT, type ConfirmedEvent } from "./PetBusinessEvents";
import { useLocation } from "react-router-dom";
export type Memory = { id: string; at: string; text: string; url?: string };
export type LifeData = {
  prefs?: Record<string, unknown>;
  room: {
    window: "garden" | "rain" | "night";
    lamp: boolean;
    cushion: "mint" | "cream";
    bed: boolean;
  };
  outfit: { hat: boolean; scarf: boolean };
  memories: Memory[];
  scriptHistory: ScriptHistory;
};
const empty = (): LifeData => ({
  room: { window: "garden", lamp: true, cushion: "mint", bed: true },
  outfit: { hat: false, scarf: false },
  memories: [],
  scriptHistory: newHistory(),
});
export function usePetLife(
  userId: number | undefined,
  act: (a: PetAction, source?: "user" | "ambient") => void,
  prefs: Record<string, unknown>,
  restorePrefs: (p: Record<string, unknown>) => void,
) {
  const location = useLocation();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const [data, setData] = useState<LifeData>(empty),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState(""),
    [behavior, setBehavior] = useState<Behavior>("Idle"),
    [text, setText] = useState(""),
    [quiet, setQuiet] = useState(false),
    [mood, setMood] = useState(""),
    [tab, setTab] = useState("陪伴");
  const [focus, setFocus] = useState<{
    remaining: number;
    running: boolean;
    endsAt: number;
    remind: boolean;
  }>({ remaining: 1500, running: false, endsAt: 0, remind: false });
  const ref = useRef(data),
    generation = useRef(0),
    revision = useRef(0),
    lastActive = useRef(0),
    loadedOwner = useRef<number | undefined>(undefined);
  ref.current = data;
  useEffect(() => {
    const g = ++generation.current;
    setReady(false);
    setQuiet(false);
    setMood("");
    setText("");
    setBehavior("Idle");
    setFocus({ remaining: 1500, running: false, endsAt: 0, remind: false });
    setData(empty());
    revision.current = 0;
    const load = async () => {
      try {
        const value = userId
          ? await api<{ snapshot: Partial<LifeData>; revision: number }>(
              "/v3/pet",
            )
          : {
              snapshot: JSON.parse(
                localStorage.getItem("finpilot:pet-life:guest") || "{}",
              ),
              revision: 0,
            };
        if (g !== generation.current) return;
        revision.current = value.revision;
        if (value.snapshot.prefs) restorePrefs(value.snapshot.prefs);
        setData({
          ...empty(),
          ...value.snapshot,
          scriptHistory: {
            ...newHistory(),
            ...value.snapshot.scriptHistory,
            session: 0,
          },
        });
        loadedOwner.current = userId;
        setStatus(
          userId ? "已读取此账户的宠物记录" : "访客记录仅保存在此浏览器",
        );
        setReady(true);
      } catch {
        if (g === generation.current)
          setStatus("读取失败，未覆盖已有记录。请刷新重试。");
      }
    };
    void load();
    return () => {
      generation.current++;
    };
  }, [userId]);
  useEffect(() => {
    if (ready && !userId)
      localStorage.setItem("finpilot:pet-life:guest", JSON.stringify(data));
  }, [data, ready, userId]);
  async function save() {
    if (!ready || loadedOwner.current !== userId) return;
    const g = generation.current;
    setStatus("正在保存…");
    try {
      if (userId) {
        const result = await api<{ revision: number }>("/v3/pet", "POST", {
          revision: revision.current,
          snapshot: { ...ref.current, prefs: prefsRef.current },
        });
        if (g !== generation.current) return;
        revision.current = result.revision;
      } else
        localStorage.setItem(
          "finpilot:pet-life:guest",
          JSON.stringify({ ...ref.current, prefs: prefsRef.current }),
        );
      setStatus(userId ? "已保存到当前账户" : "已保存到此浏览器");
    } catch (e) {
      if (g === generation.current)
        setStatus(e instanceof Error ? e.message : "保存失败，请重试");
    }
  }
  function react(trigger: string, explicit = false) {
    if (!ready || prefsRef.current.hidden) return;
    const active = document.activeElement;
    const busy =
      quiet ||
      focus.running ||
      !!active?.matches("input,textarea,select,[contenteditable=true]") ||
      !!document.querySelector("dialog[open]");
    if (!explicit && Date.now() - lastActive.current < 20000) return;
    const result = chooseScript(
      trigger,
      ref.current.scriptHistory,
      explicit,
      busy,
    );
    if (!result) return;
    if (explicit) lastActive.current = Date.now();
    setData((d) => ({ ...d, scriptHistory: result.history }));
    act(result.action, explicit ? "user" : "ambient");
    setText(quiet ? "" : result.text);
    setBehavior(
      trigger==='MOOD_TIRED'?'Sleepy':trigger==='MOOD_GOOD'?'Happy':trigger.startsWith("IDLE_")?'Idle':trigger.startsWith("MOOD_")
        ? "Comforting"
        : trigger === "PET_PLAY"
          ? "Playing"
          : trigger === "PET_REST"
            ? "Sleeping"
            : trigger === "QUIZ_CORRECT" || trigger === "LESSON_COMPLETED"
              ? "Happy"
              : "Curious",
    );
  }
  const reactRef = useRef(react);
  reactRef.current = react;
  useEffect(() => {
    if (!ready) return;
    const key = "finpilot:pet-last-visit:" + String(userId || "guest");
    const last = Number(localStorage.getItem(key) || 0);
    const now = Date.now();
    reactRef.current(
      !last
        ? "FIRST_OPEN"
        : new Date(last).toDateString() === new Date(now).toDateString()
          ? "RETURN_SAME_DAY"
          : "RETURN_LATER",
    );
    localStorage.setItem(key, String(now));
  }, [ready, userId]);
  const [achievement, setAchievement] = useState<ConfirmedEvent | null>(null);
  useEffect(() => setAchievement(null), [userId]);
  useEffect(() => {
    if (!ready) return;
    const trigger = location.pathname.startsWith("/concept-studio")
      ? "ENTER_CONCEPT"
      : location.pathname.startsWith("/money-lab")
        ? "ENTER_MONEY"
        : location.pathname.startsWith("/discover")
          ? "ENTER_DISCOVER"
          : location.pathname.startsWith("/profile")
            ? "ENTER_WORLD"
            : null;
    if (trigger) reactRef.current(trigger);
  }, [location.pathname, ready]);
  useEffect(() => {
    const received = (e: Event) => {
      const event = (e as CustomEvent<ConfirmedEvent>).detail;
      reactRef.current(event.trigger);
      if (["LESSON_COMPLETED", "SAVE_OK"].includes(event.trigger))
        setAchievement(event);
    };
    window.addEventListener(BUSINESS_EVENT, received);
    return () => window.removeEventListener(BUSINESS_EVENT, received);
  }, []);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(""), 9000);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => {
    if (!ready) return;
    let count = 0;
    const t = setInterval(() => {
      count++;
      reactRef.current(
        new Date().getHours() >= 22
          ? "NIGHT_LOCAL"
          : count % 4 === 0
            ? "IDLE_LONG"
            : Math.random() < 0.3
              ? "SMALL_SURPRISE"
              : "IDLE_BRIEF",
      );
    }, 90000);
    return () => clearInterval(t);
  }, [ready]);
  useEffect(() => {
    if (!focus.running) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((focus.endsAt - Date.now()) / 1000));
      setFocus((f) => ({ ...f, remaining: left, running: left > 0 }));
      if (left === 0) {
        setBehavior("Happy");
        if (focus.remind) reactRef.current("FOCUS_FINISHED", true);
        else act("Stretch");
      }
    }, 500);
    return () => clearInterval(t);
  }, [focus.running, focus.endsAt,focus.remind]);
  function remember(value: string, url?: string) {
    if (!value.trim() || !ready) return;
    setData((d) => ({
      ...d,
      memories: [
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          text: value.trim().slice(0, 600),
          url,
        },
        ...d.memories,
      ].slice(0, 100),
    }));
    setStatus(userId ? "已加入草稿，请保存到账户" : "已保存在此浏览器");
  }
  return {
    data,
    setData,
    ready,
    status,
    save,
    behavior,
    setBehavior,
    text,
    quiet,
    setQuiet,
    mood,
    setMood,
    tab,
    setTab,
    focus,
    setFocus,
    react,
    remember,
    achievement,
  };
}
