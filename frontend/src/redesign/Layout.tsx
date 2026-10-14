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
import FinButton from "./Fin";
export default function RedesignLayout() {
  const { user } = useAuth();
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
            <NavLink key={to} to={to} end={to === "/"}>
              {t}
            </NavLink>
          ))}
        </nav>
        <div className="rd-header-actions">
          <button
            className="rd-icon"
            aria-label="全站搜索"
            onClick={() => setSearch(true)}
          >
            <Search size={20} />
          </button>
          <Link className="rd-ask" to="/copilot">
            问 Fin <ArrowUpRight size={15} />
          </Link>
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
      <main id="main-content" className="rd-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="rd-footer">
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
          V3 重设计 · Gate A1 审查原型 · AI Demo · 保存仅在此浏览器
        </small>
      </footer>
      <nav className="rd-bottom-nav" aria-label="手机导航">
        {[
          ["/", "首页", House],
          ["/discover", "发现", Compass],
          ["/money-lab", "工具", Calculator],
          ["/profile", "我的", BookOpen],
        ].map(([to, label, Icon]) => {
          const C = Icon as typeof House;
          return (
            <NavLink key={String(to)} to={String(to)} end={to === "/"}>
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
