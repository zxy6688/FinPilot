import { useState } from "react";
import { Link } from "react-router-dom";
import { State, useLoad, SaveButton } from "../components/ui";
import { useAuth } from "../services/auth";
import type { Article } from "../types";
import type { HomeData } from "./types";
export default function Discover() {
  const r = useLoad<Article[]>("/articles");
  const h = useLoad<HomeData>("/v3/home");
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(6);
  const all = r.data || [];
  const signals = all.filter((a) => a.content_type === "REAL_WORLD");
  const hero = h.data?.signal;
  const featured = hero
    ? signals.find((a) => a.id === hero.id) || signals[0]
    : signals[0];
  const forYou = all
    .filter((a) => a.content_type === "EXPLAINER")
    .filter(
      (a) =>
        !featured?.topic_ids?.length ||
        a.topic_ids.some((t) => featured.topic_ids.includes(t)),
    )
    .slice(0, 2);
  const library = all.filter(
    (a) =>
      a.id !== featured?.id &&
      !forYou.some((f) => f.id === a.id) &&
      (filter === "all" || a.content_type === filter),
  );
  const { user } = useAuth();
  return (
    <div className="discover-editorial">
      <header className="living-heading">
        <span className="eyebrow">READ THE WORLD A LITTLE DIFFERENTLY</span>
        <h1>
          世界很复杂，
          <br />
          理解可以从一个问题开始。
        </h1>
        <p>真实资料与原创解释，给每一次好奇心一个可靠的出发点。</p>
      </header>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {featured && (
          <section className="discover-lead">
            <div className="signal-illustration" aria-hidden="true">
              <svg viewBox="0 0 400 280">
                <circle cx="200" cy="140" r="91" />
                <circle cx="200" cy="140" r="62" />
                <path d="M35 180Q105 60 190 143T367 72M62 234L335 48M72 65L332 213" />
                <circle className="signal-dot" cx="200" cy="140" r="8" />
                <circle className="signal-dot" cx="97" cy="140" r="4" />
                <circle className="signal-dot" cx="300" cy="118" r="4" />
              </svg>
              <span>AN IDEA MEETS THE WORLD</span>
            </div>
            <div>
              <span className="eyebrow">
                A SIGNAL FOR YOU · {featured.source}
              </span>
              <h2>
                <Link to={"/articles/" + featured.id}>{featured.title}</Link>
              </h2>
              <p>{h.data?.signal?.reason || featured.why_it_matters}</p>
              <small>
                {featured.published_at || "原始页面未注明日期"} · 来源资料 /
                非实时资讯
              </small>
              <Link className="text-link" to={"/articles/" + featured.id}>
                读懂这份材料 →
              </Link>
            </div>
          </section>
        )}
        <section className="discover-for-you">
          <span className="eyebrow">
            {user ? "KEEP FOLLOWING YOUR CURIOSITY" : "TWO PLACES TO BEGIN"}
          </span>
          <h2>{user ? "接着你的好奇心" : "两个值得开始的问题"}</h2>
          <div>
            {forYou.map((a) => (
              <EditorialStory key={a.id} article={a} />
            ))}
          </div>
        </section>
        <section className="discover-library">
          <div className="editorial-section-heading">
            <div>
              <span className="eyebrow">THE READING ROOM</span>
              <h2>慢一点，读懂多一点。</h2>
            </div>
            <div
              className="editorial-filters"
              role="group"
              aria-label="阅读类型"
            >
              {[
                ["all", "全部"],
                ["EXPLAINER", "原创解释"],
                ["REAL_WORLD", "真实资料"],
              ].map(([value, label]) => (
                <button
                  className={filter === value ? "active" : ""}
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value);
                    setVisible(6);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="editorial-story-list">
            {library.slice(0, visible).map((a) => (
              <EditorialStory key={a.id} article={a} />
            ))}
          </div>
          {library.length > visible && (
            <button
              className="text-link"
              onClick={() => setVisible((v) => v + 6)}
            >
              再看几篇 →
            </button>
          )}
        </section>
        <section className="discover-ideas">
          <span className="eyebrow">IDEAS WORTH SEPARATING</span>
          <h2>两个概念，差别在哪里？</h2>
          <Link to="/compare/nominal-real">名义 / 实际回报 ↗</Link>
          <Link to="/compare/etf-index-fund">ETF / 指数基金 ↗</Link>
          <Link to="/compare/volatility-risk">波动 / 风险 ↗</Link>
          <Link to="/compare/apr-apy">APR / APY ↗</Link>
        </section>
      </State>
    </div>
  );
}
function EditorialStory({ article: a }: { article: Article }) {
  return (
    <article className="editorial-story">
      <div>
        <small>
          {a.content_type === "EXPLAINER"
            ? "FINPILOT ORIGINAL"
            : a.source + " · " + (a.published_at || "未注明日期")}
        </small>
        <h3>
          <Link to={"/articles/" + a.id}>{a.title}</Link>
        </h3>
        <p>{a.summary}</p>
        <Link className="text-link" to={"/articles/" + a.id}>
          继续阅读 →
        </Link>
      </div>
      <SaveButton kind="article" id={a.id} />
    </article>
  );
}
