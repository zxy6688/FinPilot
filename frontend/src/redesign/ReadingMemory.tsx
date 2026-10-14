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
    const write = async () => {
      if (!ready || !active) return;
      const height = document.documentElement.scrollHeight - innerHeight;
      const position = Math.max(
        0,
        Math.min(0.99, height > 0 ? scrollY / height : 0),
      );
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>(
          "article section[id],.rd-reader-body section[id]",
        ),
      );
      const last = sections
        .filter((s) => s.getBoundingClientRect().top < innerHeight * 0.5)
        .at(-1);
      if (!last || position < 0.02) return;
      const data: Reading = {
        progress: position,
        position,
        last_section: last.id,
        completed: false,
      };
      localStorage.setItem(key, JSON.stringify(data));
      if (user) {
        try {
          await api(`/v3/reading/story/${id}`, "POST", data);
          if (active) setError("");
        } catch {
          if (active)
            setError("阅读位置尚未同步到账户；可继续阅读，稍后滚动会重试。");
        }
      }
    };
    const scroll = () => {
      clearTimeout(timer);
      timer = setTimeout(write, 800);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("scroll", scroll);
    };
  }, [location.pathname, user?.id, loading]);
  return error ? (
    <p className="gb-reading-error" role="status">
      {error}
    </p>
  ) : null;
}
