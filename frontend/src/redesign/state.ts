import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
export type Entry = {
  id: string;
  kind: "receipt" | "reading" | "concept";
  title: string;
  url: string;
  at: string;
  detail: string;
  payload?: unknown;
  version: string;
  storage?: "account" | "browser";
};
export function useNotebook() {
  const { user, loading: authLoading } = useAuth();
  const key = "finpilot:redesign:gate-a:" + String(user?.id ?? "guest");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadedOwner, setLoadedOwner] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const identity = useRef(key);
  identity.current = key;
  useEffect(() => {
    let live = true;
    const read = async () => {
      if (authLoading) return;
      setLoading(true);
      try {
        const data = user
          ? await api<Entry[]>("/v3/artifacts")
          : JSON.parse(localStorage.getItem(key) || "[]");
        if (live) {
          setLoadedOwner(key);
          const local: Entry[] = JSON.parse(localStorage.getItem(key) || "[]");
          const serverIds = new Set((user ? data : []).map((e: Entry) => e.id));
          setEntries(
            user
              ? [
                  ...data.map((e: Entry) => ({
                    ...e,
                    storage: "account" as const,
                  })),
                  ...local
                    .filter((e) => !serverIds.has(e.id))
                    .map((e) => ({ ...e, storage: "browser" as const })),
                ]
              : data.map((e: Entry) => ({ ...e, storage: "browser" as const })),
          );
          setError("");
        }
      } catch (e) {
        if (live) {
          setEntries([]);
          setError(e instanceof Error ? e.message : "读取保存记录失败");
        }
      } finally {
        if (live) setLoading(false);
      }
    };
    setEntries([]);
    read();
    window.addEventListener("redesign-save", read);
    window.addEventListener("storage", read);
    return () => {
      live = false;
      window.removeEventListener("redesign-save", read);
      window.removeEventListener("storage", read);
    };
  }, [key, authLoading]);
  async function save(entry: Omit<Entry, "at" | "version">) {
    if (authLoading) return false;
    const owner = key;
    try {
      const record = {
        ...entry,
        payload: entry.payload || {},
        version: "gate-b-v1",
      };
      if (user) await api<Entry>("/v3/artifacts", "POST", record);
      else {
        const current: Entry[] = JSON.parse(localStorage.getItem(key) || "[]");
        localStorage.setItem(
          key,
          JSON.stringify(
            [
              { ...record, at: new Date().toISOString() },
              ...current.filter((e) => e.id !== entry.id),
            ].slice(0, 100),
          ),
        );
      }
      if (identity.current !== owner) return false;
      window.dispatchEvent(new Event("redesign-save"));
      setError("");
      return true;
    } catch (e) {
      if (identity.current === owner)
        setError(
          e instanceof Error ? e.message : "保存失败；内容仍保留，请重试。",
        );
      return false;
    }
  }
  return {
    entries: authLoading || loadedOwner !== key ? [] : entries,
    save,
    error,
    scope: user ? "账户保存 · 可跨浏览器恢复" : "访客 · 仅此浏览器",
    loading: authLoading || loading,
  };
}
export const money = (n: number) =>
  n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export const topics = [
  {
    id: "purchasing-power",
    title: "存钱，为什么不等于购买力不变？",
    tag: "钱与生活",
    time: "8 分钟",
    summary: "从一张购物清单出发，把账户里的数字与真正能买到的东西分开看。",
    path: "/decoder/purchasing-power",
    color: "mint",
    num: "01",
  },
  {
    id: "budget",
    title: "大学生的第一份预算",
    tag: "生活规划",
    time: "10–12 分钟互动",
    summary: "先看清固定支出，再为想做的事留出空间。",
    path: "/stories/budget",
    color: "yellow",
    num: "02",
  },
  {
    id: "bonds",
    title: "从一次降息，读懂债券",
    tag: "信息解读",
    time: "10–12 分钟互动",
    summary: "政策利率变了，债券价格为什么未必同方向？",
    path: "/stories/bonds",
    color: "blue",
    num: "03",
  },
  {
    id: "etf",
    title: "ETF 究竟是什么？",
    tag: "概念辨析",
    time: "5 分钟互动",
    summary: "交易形式和投资策略，是两条不同的坐标轴。",
    path: "/stories/etf",
    color: "peach",
    num: "04",
  },
  {
    id: "loan",
    title: "一笔贷款，到底要还多少钱？",
    tag: "借贷成本",
    time: "10–12 分钟互动",
    summary: "利率只是开始，期限、费用与时点也要放进账本。",
    path: "/stories/loan",
    color: "cream",
    num: "05",
  },
];
