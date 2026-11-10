import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Search,
  ArrowUpRight,
  House,
  Compass,
  Calculator,
  BookOpen,
  UserRound,
} from "lucide-react";
import { useAuth } from "../services/auth";
import SearchOverlay from "../components/SearchOverlay";
import { ReadingMemory } from "./ReadingMemory";
import { FinChat } from "./FinChat";
import { RestoreNotice } from "./RestoreNotice";
import { ReadingNav } from "./ReadingNav";
import { KnowledgeConnections, LearningBreadcrumb } from "./KnowledgeCenter";
import FinButton, {FinArt} from "./Fin";
export default function RedesignLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState(false);
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
    setSearch(false);
    document.title = "FinPilot · 看懂金融，形成自己的判断";
  }, [location.pathname, location.hash]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (loading) return <p role="status">正在读取账户…</p>;
  return (
    <div className="rd-shell">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      <header className="rd-header">
        <Link className="rd-logo" to="/" aria-label="FinPilot 首页">
          <Compass size={30} className="a1-brand-compass" />
          <span>
            FinPilot<span className="rd-logo-dot">.</span>
          </span>
        </Link>
        <nav aria-label="主导航">
          {[
            ["/", "首页"],
            ["/discover", "发现"],
            ["/money-lab", "财务工具"],
            ["/concept-studio", "学概念"],
            ["/profile", "我的世界"],
          ].map(([to, t]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                isActive ||
                (to === "/discover" && /^\/(stories|decoder)\//.test(location.pathname)) ||
                (to === "/concept-studio" &&
                  /^\/(lessons|learn|topics|review|knowledge)(\/|$)/.test(
                    location.pathname,
                  )) ||
                (to === "/money-lab" && location.pathname.startsWith("/lab"))
                  ? "active"
                  : undefined
              }
            >
              {t}
            </NavLink>
          ))}
        </nav>
        <div className="rd-header-actions">
          <button className="rd-icon" aria-label="Fin 宠物设置" onClick={() => window.dispatchEvent(new Event("fin-pet-settings"))}><span className="pet-recover"><FinArt size={30} action="calm" /></span></button>
          <button
            className="rd-icon"
            aria-label="全站搜索"
            onClick={() => setSearch(true)}
          >
            <Search size={20} />
          </button>
          <button
            className="rd-ask"
            onClick={() => window.dispatchEvent(new Event("fin-chat"))}
          >
            问 Fin <ArrowUpRight size={15} />
          </button>
          <Link
            className="rd-user"
            to={user ? "/profile" : "/login"}
            aria-label={user ? "我的账户" : "登录"}
          >
            {user ? user.name.slice(0, 1) : <UserRound size={19} />}
          </Link>
          <span
            className={
              "rd-mobile-fin" +
              (location.pathname === "/" ? " a1-home-fin-hidden" : "")
            }
          >
            <FinButton size={32} />
          </span>
        </div>
      </header>
      <main
        id="main-content"
        className="rd-main"
        tabIndex={-1}
        key={user?.id ?? "guest"}
      >
        {user?.email === "demo@finpilot.app" && (
          <p className="rd-notice" role="note">
            这是共享演示账户，所有使用此账号的人都能看到保存的内容。不要输入个人收支或私人信息。
            <Link to="/login">使用独立账户 →</Link>
          </p>
        )}
        <ReadingMemory />
        <RestoreNotice />
        <ReadingNav />
        <LearningBreadcrumb />
        <Outlet />
        <KnowledgeConnections />
        <FinChat />
      </main>
      {location.pathname === "/" ? <footer className="rd-footer"><Link className="rd-logo" to="/">FinPilot.</Link><div><Link to="/discover/library">内容来源</Link><Link to="/methods">计算方法</Link><Link to="/fin-design">关于 Fin</Link></div><small>本站提供金融教育内容及情景计算，结果依据输入条件和模型假设，不构成投资建议。</small></footer> : <footer className="rd-footer">
        <div>
          <Link className="rd-logo" to="/">
            FinPilot.
          </Link>
          <p>把信息看明白，把数字算清楚。</p>
        </div>
        <div>
          <Link to="/fin-design">认识 Fin</Link>
          <Link to="/profile">发现手册</Link>
          <Link to="/fintalk">相关讨论</Link>
          <Link to="/methods">方法与数据说明</Link>
        </div>
        <small>
          金融教育用途，不构成投资建议。计算基于明确的假设，不代表收益承诺。
          <br />
          V3 · 金融探索工作室 · AI Demo 能力有限 · 账户保存 / 访客仅本机
        </small>
      </footer>}
      <nav className="rd-bottom-nav" aria-label="手机导航">
        {[
          ["/", "首页", House],
          ["/discover", "发现", Compass],
          ["/money-lab", "工具", Calculator],
          ["/concept-studio", "学概念", BookOpen],
          ["/profile", "我的", UserRound],
        ].map(([to, label, Icon]) => {
          const C = Icon as typeof House;
          return (
            <NavLink
              key={String(to)}
              to={String(to)}
              end={to === "/"}
              className={({ isActive }) =>
                isActive ||
                (to === "/discover" && /^\/(stories|decoder)\//.test(location.pathname)) ||
                (to === "/concept-studio" &&
                  /^\/(lessons|learn|topics|review|knowledge)(\/|$)/.test(
                    location.pathname,
                  )) ||
                (to === "/money-lab" && location.pathname.startsWith("/lab"))
                  ? "active"
                  : undefined
              }
            >
              <C size={21} />
              {String(label)}
            </NavLink>
          );
        })}
      </nav>
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </div>
  );
}
