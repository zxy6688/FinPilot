import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Search, ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../services/auth";
import { BrandMark } from "./Brand";
import SearchOverlay from "./SearchOverlay";
import Modal from "./Modal";
const links = [
  ["/", "Home"],
  ["/discover", "Discover"],
  ["/learn", "Learn"],
  ["/copilot", "AI Copilot"],
  ["/lab", "Lab"],
  ["/fintalk", "FinTalk"],
  ["/profile", "Profile"],
];
const info = {
  about: {
    title: "关于 FinPilot",
    body: "看懂金融，形成自己的判断。FinPilot 面向大学生与金融初学者，将官方资料、知识主题、微课程、AI 解释与交互实验连接起来。社区中的虚构学习者有明确身份标记；其讨论用于展示学习方法，不代表真实用户经历。",
  },
  privacy: {
    title: "隐私与数据",
    body: "此本地版本把账户、密码哈希、学习进度、对话与讨论保存在当前项目的 SQLite 数据库中。登录凭据保存在此浏览器的本地存储，退出登录后移除。Demo AI 在本地使用站内内容；若维护者配置外部模型服务，提问和必要的对话上下文会发送给该服务。请勿输入账户密码、身份证件或其他敏感信息。外部资料链接会打开第三方网站，其隐私规则由对应网站提供。",
  },
  disclaimer: {
    title: "金融教育说明",
    body: "FinPilot 提供金融教育与信息辅助，不构成投资建议。投资决策应由用户基于自身情况独立作出。课程中的数字、实验曲线与情景用于解释机制，不预测未来收益。学习足迹仅反映站内课程与测验数据，不评估投资能力或风险承受能力。",
  },
};
export default function Layout() {
  const { user } = useAuth(),
    location = useLocation();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(false),
    [modal, setModal] = useState<keyof typeof info | null>(null);
  useEffect(() => {
    setOpen(false);
    setSearch(false);
    window.scrollTo(0, 0);
    const names: Record<string, string> = {
      discover: "发现",
      learn: "学习路径",
      lessons: "微课程",
      topics: "知识地图",
      copilot: "AI 学习助手",
      lab: "金融实验室",
      fintalk: "学习社区",
      profile: "学习足迹",
      login: "登录",
      search: "搜索",
    };
    document.title =
      (names[location.pathname.split("/")[1]]
        ? names[location.pathname.split("/")[1]] + " · "
        : "") + "FinPilot · 看懂金融";
  }, [location.pathname]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="FinPilot 首页">
          <BrandMark />
          FinPilot<span className="version">V2</span>
        </Link>
        <nav
          id="main-navigation"
          className={open ? "open" : ""}
          aria-label="主导航"
        >
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="全站搜索"
            title="搜索 · Ctrl K"
            onClick={() => setSearch(true)}
          >
            <Search size={20} />
          </button>
          <span className="header-divider" />
          {user ? (
            <Link
              className="avatar"
              title="我的学习足迹"
              aria-label="我的学习足迹"
              to="/profile"
            >
              {user.name.slice(0, 1)}
            </Link>
          ) : (
            <Link className="button small-button" to="/login">
              开始学习 <ArrowUpRight size={15} />
            </Link>
          )}
          <button
            className="icon-button menu-button"
            aria-label="切换导航"
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main className="main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <Link className="brand" to="/">
            <BrandMark size={32} />
            FinPilot
          </Link>
          <p>看懂金融，形成自己的判断。</p>
          <small>Financial Learning & Navigation</small>
        </div>
        <div className="footer-links">
          <b>探索</b>
          {[
            ["/discover", "发现"],
            ["/learn", "学习"],
            ["/lab", "实验"],
            ["/fintalk", "社区"],
          ].map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </div>
        <div className="footer-links">
          <b>关于</b>
          <button onClick={() => setModal("about")}>关于 FinPilot</button>
          <button onClick={() => setModal("privacy")}>隐私与数据</button>
          <button onClick={() => setModal("disclaimer")}>金融教育说明</button>
        </div>
        <div className="footer-bottom">
          <p>
            FinPilot
            提供金融教育与信息辅助，不构成投资建议。投资决策应由用户基于自身情况独立作出。
          </p>
          <span>© 2026 FinPilot</span>
        </div>
      </footer>
      {search && <SearchOverlay onClose={() => setSearch(false)} />}{" "}
      {modal && (
        <Modal title={info[modal].title} onClose={() => setModal(null)}>
          <p className="legal-copy">{info[modal].body}</p>
        </Modal>
      )}
    </>
  );
}
