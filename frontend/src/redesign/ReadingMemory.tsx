import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
const ids: Record<string, number> = {
  "/stories/budget": 1,
  "/decoder/purchasing-power": 2,
  "/stories/bonds": 3,
  "/stories/etf": 4,
  "/stories/loan": 5,
};
type Reading = {
  progress: number;
  position: number;
  last_section: string;
  completed: boolean;
};
export function ReadingMemory() {
  const location = useLocation(),
    { user, loading } = useAuth();
  const [error, setError] = useState("");
  useEffect(() => {
    const id = ids[location.pathname];
    if (!id || loading) return;
    let active = true,
      ready = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const key = `story-position:${user?.id ?? "guest"}:${id}`;
    const read = async () => {
      try {
        const saved = user
          ? await api<Reading | null>(`/v3/reading/story/${id}`)
          : JSON.parse(localStorage.getItem(key) || "null");
        if (!active) return;
        if (saved && !window.location.hash) {
          setTimeout(() => {
            if (active && window.scrollY < 120)
              document.getElementById(saved.last_section)?.scrollIntoView();
          }, 350);
        }
        setError("");
      } catch {
        if (active) setError("暂时未能读取账户阅读位置，正文仍可使用。");
      } finally {
        ready = true;
      }
    };
    read();
    const token = localStorage.getItem("finpilot_token");
    let latest: Reading | null = null;
    let lastSent = "";
    const persist = async () => {
      if (!latest || !user || !token) return;
      const encoded = JSON.stringify(latest);
      if (encoded === lastSent) return;
      lastSent = encoded;
      try {
        const response = await fetch(`/api/v3/reading/story/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: encoded,
          keepalive: true,
        });
        if (!response.ok) throw new Error();
        if (active) setError("");
      } catch {
        lastSent = "";
        if (active)
          setError(
            "阅读位置尚未同步到账户，继续滚动会重试；笔记仍需主动保存。",
          );
      }
    };
    const scroll = () => {
      if (!ready || !active) return;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("article section[id]"),
      );
      const last = sections
        .filter((s) => s.getBoundingClientRect().top < innerHeight * 0.45)
        .at(-1);
      if (!last) return;
      const position = Math.max(
        0,
        Math.min(
          0.99,
          scrollY /
            Math.max(1, document.documentElement.scrollHeight - innerHeight),
        ),
      );
      latest = {
        progress: position,
        position,
        last_section: last.id,
        completed: false,
      };
      localStorage.setItem(key, JSON.stringify(latest));
      clearTimeout(timer);
      timer = setTimeout(persist, 250);
    };
    const leave = () => {
      void persist();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("pagehide", leave);
    return () => {
      active = false;
      clearTimeout(timer);
      void persist();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("pagehide", leave);
    };
  }, [location.pathname, user?.id, loading]);
  return error ? (
    <p className="gb-reading-error" role="status">
      {error}
    </p>
  ) : null;
}
