import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import Modal from "./Modal";
import { api } from "../services/api";
import { State, Empty } from "./ui";
type Item = { id: number; title: string; topic_id?: number };
const groups = [
  { key: "routes", label: "学习路线", path: "/learn/routes/" },
  { key: "topics", label: "知识主题", path: "/topics/" },
  { key: "lessons", label: "课程", path: "/lessons/" },
  { key: "articles", label: "Discover", path: "/topics/" },
  { key: "labs", label: "实验", path: "/lab/" },
  { key: "posts", label: "FinTalk", path: "/fintalk/" },
];
export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const nav = useNavigate(),
    input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(""),
    [data, setData] = useState<Record<string, Item[]>>({}),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [active, setActive] = useState(0),
    [tick, setTick] = useState(0);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    let live = true;
    setActive(0);
    setError("");
    setData({});
    setLoading(Boolean(query.trim()));
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      api<Record<string, Item[]>>(
        "/search?q=" + encodeURIComponent(query.trim()),
      )
        .then((v) => {
          if (live) setData(v);
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, tick]);
  const results = groups.flatMap((g) =>
    (data[g.key] || []).slice(0, 5).map((item) => ({
      ...item,
      group: g.label,
      url: g.path + (g.key === "articles" ? item.topic_id : item.id),
    })),
  );
  function open(url: string) {
    onClose();
    nav(url);
  }
  useEffect(() => {
    document
      .getElementById(`search-option-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <Modal title="搜索知识地图" onClose={onClose} className="search-modal">
      <div className="palette-input">
        <Search size={21} />
        <input
          ref={input}
          aria-label="搜索知识"
          role="combobox"
          aria-expanded={Boolean(query.trim())}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            results.length ? `search-option-${active}` : undefined
          }
          maxLength={100}
          placeholder="利率、ETF，或一个想弄懂的问题…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((n) => (results.length ? (n + 1) % results.length : 0));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((n) =>
                results.length ? (n - 1 + results.length) % results.length : 0,
              );
            }
            if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              open(results[active].url);
            }
          }}
        />
      </div>
      {!query.trim() ? (
        <div className="search-suggestions">
          <p className="muted">从一个熟悉的概念开始</p>
          {["利率", "ETF", "预算", "FOMO"].map((q) => (
            <button
              key={q}
              className="secondary"
              onClick={() => {
                setQuery(q);
                input.current?.focus();
              }}
            >
              {q}
            </button>
          ))}
        </div>
      ) : (
        <State
          loading={loading}
          error={error}
          retry={() => setTick((n) => n + 1)}
        >
          {results.length ? (
            <div
              id="global-search-results"
              role="listbox"
              aria-label="搜索结果"
              className="palette-results"
            >
              {results.map((r, i) => (
                <div key={r.group + r.id}>
                  {(i === 0 || results[i - 1].group !== r.group) && (
                    <div className="palette-group">{r.group}</div>
                  )}
                  <div
                    id={`search-option-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={
                      "palette-option " + (active === i ? "active" : "")
                    }
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => open(r.url)}
                  >
                    <span>{r.title}</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="还没有找到。试试更短的关键词，如“债券”。" />
          )}
        </State>
      )}
      <div className="palette-footer">
        <span>↑ ↓ 选择 · Enter 打开 · Esc 关闭</span>
        <button
          className="quiet"
          onClick={() => open("/search?q=" + encodeURIComponent(query))}
        >
          完整搜索页 →
        </button>
      </div>
    </Modal>
  );
}
