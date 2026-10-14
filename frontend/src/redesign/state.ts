import { useEffect, useState } from "react";
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
};
export function useNotebook() {
  const { user, loading } = useAuth();
  const key = "finpilot:redesign:gate-a:" + String(user?.id ?? "guest");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        setEntries(JSON.parse(localStorage.getItem(key) || "[]"));
      } catch {
        setEntries([]);
        setError("浏览器保存不可用，请检查存储权限。");
      }
    };
    read();
    window.addEventListener("redesign-save", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("redesign-save", read);
      window.removeEventListener("storage", read);
    };
  }, [key]);
  function save(entry: Omit<Entry, "at" | "version">) {
    if (loading) return false;
    try {
      const current: Entry[] = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [
        { ...entry, at: new Date().toISOString(), version: "gate-a-2026-10" },
        ...current.filter((e) => e.id !== entry.id),
      ].slice(0, 60);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event("redesign-save"));
      setError("");
      return true;
    } catch {
      setError("未能保存：浏览器存储不可用或已满。");
      return false;
    }
  }
  return {
    entries: loading ? [] : entries,
    save,
    error,
    scope: user ? "当前账户 · 此浏览器" : "访客 · 此浏览器",
    loading,
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
    time: "专题导读",
    summary: "先看清固定支出，再为想做的事留出空间。",
    path: "/stories/budget",
    color: "yellow",
    num: "02",
  },
  {
    id: "bonds",
    title: "从一次降息，读懂债券",
    tag: "信息解读",
    time: "专题导读",
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
    path: "/concept-studio",
    color: "peach",
    num: "04",
  },
  {
    id: "loan",
    title: "一笔贷款，到底要还多少钱？",
    tag: "借贷成本",
    time: "专题导读",
    summary: "利率只是开始，期限、费用与时点也要放进账本。",
    path: "/stories/loan",
    color: "cream",
    num: "05",
  },
];
