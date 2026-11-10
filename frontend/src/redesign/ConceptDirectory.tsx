import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { knowledge, lessons } from "./knowledgeData";
import { useLoad } from "../components/ui";
import { useAuth } from "../services/auth";
import type { LearningPath } from "../types";
import "./concept-br.css";

export default function ConceptDirectory() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const paths = useLoad<LearningPath[]>("/learning-paths");
  const mode =
    params.get("mode") || (location.hash === "#courses" ? "courses" : "index");
  const q = params.get("q") || "",
    domain = params.get("domain") || "";
  const all = params.get("all") === "1";
  const filtered = knowledge.concepts.filter(
    (c) =>
      (!domain || c.domain === domain) &&
      (!q.trim() ||
        (c.title + c.summary).toLowerCase().includes(q.trim().toLowerCase())),
  );
  const shown = all || q.trim() || domain ? filtered : filtered.slice(0, 8);
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    setParams(next, { replace: true });
  }
  if (params.has("concept"))
    return (
      <Navigate
        replace
        to={
          "/concept-studio/7?concept=" +
          encodeURIComponent(params.get("concept")!)
        }
      />
    );
  return (
    <div className="rd-page cs-directory">
      <header className="cs-cover">
        <div>
          <h1>学概念</h1>
          <p>
            查找金融概念，阅读定义、案例和关系图解，通过练习检查理解。也可以沿课程路线系统学习。
          </p>
          <div className="cs-stats">
            <span>
              <b>{knowledge.concepts.length}</b> 个概念
            </span>
            <span>
              <b>{knowledge.domains.length}</b> 个领域
            </span>
            <span>
              <b>{lessons.length}</b> 节课程
            </span>
            <span>
              <b>5</b> 条路线
            </span>
          </div>
        </div>
        <div className="cs-cover-art">
          <img
            src="/redesign/gate-b/budget-studio.png"
            alt="知识工作台上的书本、账本和储蓄罐"
          />
        </div>
      </header>
      <nav className="cs-modes" aria-label="学习模式">
        <button
          aria-pressed={mode !== "courses"}
          onClick={() => change({ mode: "index" })}
        >
          知识索引
        </button>
        <button
          aria-pressed={mode === "courses"}
          onClick={() => change({ mode: "courses" })}
        >
          课程路线
        </button>
      </nav>
      {mode !== "courses" ? (
        <section aria-label="金融概念索引">
          <h2>金融概念索引</h2>
          <p>按领域筛选，或直接搜索名称与解释。</p>
          <div className="cs-search">
            <input
              type="search"
              aria-label="搜索概念"
              value={q}
              placeholder="搜索 ETF、流动性、实际收益率…"
              onChange={(e) => change({ q: e.target.value })}
            />
            <span aria-live="polite">{filtered.length} 个概念</span>
          </div>
          <div className="cs-domains" aria-label="知识领域">
            {[{ id: "", title: "全部领域" }, ...knowledge.domains].map((d) => (
              <button
                key={d.id}
                aria-pressed={domain === d.id}
                onClick={() => change({ domain: d.id })}
              >
                {d.title}
              </button>
            ))}
          </div>
          {(q || domain) && (
            <button
              className="rd-secondary cs-clear"
              onClick={() => change({ q: "", domain: "", all: "" })}
            >
              清除筛选
            </button>
          )}
          {!shown.length && (
            <div className="cs-empty" role="status">
              未找到相符概念。清除筛选，或
              <Link to={"/search?q=" + encodeURIComponent(q)}>
                搜索其他资料
              </Link>
              。
            </div>
          )}
          <div className="cs-grid">
            {shown.map((c) => (
              <Link
                className="cs-card"
                key={c.id}
                to={
                  "/concept-studio/" +
                  c.id +
                  "?return=" +
                  encodeURIComponent(location.pathname + location.search)
                }
              >
                <span>
                  {knowledge.domains.find((d) => d.id === c.domain)?.title} ·{" "}
                  {c.level}
                </span>
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
                <strong>
                  查看解释与练习 <span aria-hidden="true">↗</span>
                </strong>
              </Link>
            ))}
          </div>
          {!q.trim() && !domain && (
            <div className="cs-expand">
              <button
                className="rd-secondary"
                onClick={() => change({ all: all ? "" : "1" })}
              >
                {all ? "收起目录" : "查看全部 36 个概念"}
              </button>
            </div>
          )}
        </section>
      ) : (
        <section id="courses" aria-label="课程与学习路线">
          <h2>课程与学习路线</h2>
          <p>
            {user
              ? "完成情况来自当前账户的课程记录。"
              : "访客可阅读课程；登录后保存课程进度。"}
          </p>
          {paths.loading ? (
            <p role="status">正在读取课程…</p>
          ) : paths.error ? (
            <p role="alert">
              课程暂时不可用。<button onClick={paths.reload}>重试</button>
            </p>
          ) : (
            <div className="cs-paths">
              {paths.data?.map((route, i) => {
                const done = route.lessons.filter((l) => l.completed).length;
                const next =
                  route.lessons.find((l) => !l.completed) || route.lessons[0];
                return (
                  <article key={route.id}>
                    <span>路线 {i + 1}</span>
                    <h3>{route.title}</h3>
                    <p>{route.summary}</p>
                    <p>
                      {user
                        ? `${done} / ${route.lessons.length} 节已完成`
                        : `${route.lessons.length} 节课程 · 访客阅读`}
                    </p>
                    <div className="rd-actions">
                      <Link className="rd-secondary" to={"/lessons/" + next.id}>
                        {done === route.lessons.length
                          ? "回顾课程"
                          : done
                            ? "继续学习"
                            : "开始学习"}
                      </Link>
                      <Link to={"/learn/" + route.id}>查看路线 →</Link>
                    </div>
                    <details>
                      <summary>展开课程目录</summary>
                      <ol>
                        {route.lessons.map((l) => (
                          <li key={l.id}>
                            <Link to={"/lessons/" + l.id}>{l.title}</Link>
                            <small>
                              {user && l.completed ? "已完成 · " : ""}
                              {l.minutes} 分钟
                            </small>
                          </li>
                        ))}
                      </ol>
                    </details>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
      <aside className="cs-review">
        <div>
          <h3>复习已记录的知识</h3>
          <p>课程作答与复习使用原有记录；浏览概念不等于完成学习。</p>
        </div>
        <Link className="rd-button" to="/review">
          打开复习
        </Link>
      </aside>
    </div>
  );
}
