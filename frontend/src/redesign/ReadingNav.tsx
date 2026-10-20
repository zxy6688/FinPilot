import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { learningStorage } from "../services/learningStorage";

export function ReadingNav() {
  const location = useLocation(),
    [items, setItems] = useState<{ id: string; title: string }[]>([]),
    [current, setCurrent] = useState(""),
    [back, setBack] = useState("");
  const active =
    location.pathname.startsWith("/stories/") ||
    location.pathname === "/decoder/purchasing-power";
  useEffect(() => {
    if (!active) {
      setItems([]);
      return;
    }
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("article section[id]"),
    ).filter((s) => s.querySelector("h2,h3"));
    setItems(
      sections.map((s) => ({
        id: s.id,
        title: s.querySelector("h2,h3")!.textContent || s.id,
      })),
    );
    const read = () => {
      const section = sections
        .filter((s) => s.getBoundingClientRect().top < innerHeight * 0.45)
        .at(-1);
      setCurrent(section?.id || sections[0]?.id || "");
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [location.pathname, active]);
  if (!active || !items.length) return null;
  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section className="px-reading-nav" aria-label="阅读与实验导航">
      <div className="rd-actions">
        <button
          className="rd-button"
          onClick={() => {
            setBack(current);
            learningStorage.setItem(
              "reading-return:" + location.pathname,
              current,
            );
            (
              document.querySelector("#experiment .gb-controls") ||
              document.getElementById("experiment") ||
              document.getElementById("matrix")
            )?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          直接试一试 ↓
        </button>
        {back && (
          <button className="rd-secondary" onClick={() => jump(back)}>
            回到刚才阅读处 ↑
          </button>
        )}
        <span>
          第 {Math.max(1, items.findIndex((i) => i.id === current) + 1)} /{" "}
          {items.length} 节
        </span>
      </div>
      <details>
        <summary>选择阅读章节</summary>
        <nav>
          {items.map((i) => (
            <button
              key={i.id}
              aria-current={current === i.id ? "location" : undefined}
              onClick={() => jump(i.id)}
            >
              {i.title}
            </button>
          ))}
        </nav>
      </details>
      <small>
        阅读位置自动记住；笔记与实验需主动保存。即时练习不代表已掌握。
      </small>
    </section>
  );
}

export function BackToReading() {
  const location = useLocation();
  if (
    !location.pathname.startsWith("/stories/") &&
    location.pathname !== "/decoder/purchasing-power"
  )
    return null;
  return (
    <button
      className="rd-text-link px-reading-return"
      onClick={() => {
        const id =
          learningStorage.getItem("reading-return:" + location.pathname) ||
          document.querySelector("article section[id]")?.id;
        if (id)
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      回到刚才阅读处 ↑
    </button>
  );
}
