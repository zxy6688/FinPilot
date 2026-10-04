import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  FlaskConical,
  Radio,
} from "lucide-react";
import { useLoad, State } from "../components/ui";
import Constellation from "../living/Constellation";
import Fin from "../living/Fin";
import type { HomeData } from "../living/types";
export default function Home() {
  const r = useLoad<HomeData>("/v3/home");
  const data = r.data;
  return (
    <div className="living-home">
      <section className="living-hero">
        <div className="hero-copy">
          <div className="overline">
            <span className="line-dot" /> FINANCIAL LEARNING, A LITTLE MORE
            HUMAN
          </div>
          <h1>
            看懂金融，
            <br />
            形成自己的判断<span className="hero-stop">。</span>
          </h1>
          <p className="hero-english">
            Build your own map of
            <br />
            money and markets.
          </p>
          <p className="hero-note">
            从一个好奇的问题，走向一片逐渐清晰的世界。
          </p>
          <Link
            className="button living-primary"
            to={data?.has_evidence ? data.today.url : "/learn/1"}
          >
            {data?.has_evidence
              ? data.today.kind === "review"
                ? "2-minute review"
                : data.today.kind === "route"
                  ? "Resume your route"
                  : "Continue"
              : "Start exploring"}
            <ArrowUpRight size={17} />
          </Link>
          <span className="hero-footnote">一点理解，慢慢相连。</span>
        </div>
        <div className="hero-world">
          {data ? (
            <Constellation world={data.world} compact />
          ) : (
            <div
              className="constellation-loading"
              aria-label="知识星图正在加载"
            >
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </section>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {data && (
          <>
            {!data.has_evidence && (
              <section className="first-question">
                <span className="overline">YOUR FIRST DIRECTION</span>
                <h2>你想先理解什么？</h2>
                <div className="interest-choices">
                  {[
                    ["Money", 1],
                    ["Personal Finance", 5],
                    ["Investing", 2],
                    ["Markets", 3],
                    ["Not sure", 1],
                  ].map(([label, id]) => (
                    <Link key={label} to={"/learn/" + id}>
                      {label}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <section className="today-section">
              <div className="section-label">
                <h2>
                  Today<span>今天，只向前一点。</span>
                </h2>
                <span className="overline">ONE GOOD NEXT STEP</span>
              </div>
              <Link className="today-focus" to={data.today.url}>
                <span className="today-number">01</span>
                <div>
                  <span className="overline">
                    {data.today.eyebrow} · {data.today.duration}
                  </span>
                  <h3>{data.today.title}</h3>
                  <p>{data.today.detail}</p>
                </div>
                <span className="today-action">
                  开始 <ArrowRight size={19} />
                </span>
              </Link>
            </section>
            <div className="home-editorial">
              <section className="continue-section">
                <div className="section-label">
                  <h2>
                    Continue<span>接着你的好奇心。</span>
                  </h2>
                </div>
                {data.continue.length ? (
                  data.continue.slice(0, 2).map((t) => (
                    <Link className="continue-row" key={t.url} to={t.url}>
                      <BookOpen size={19} />
                      <div>
                        <span className="overline">{t.eyebrow}</span>
                        <h3>{t.title}</h3>
                        <p>{t.detail}</p>
                      </div>
                      <ArrowUpRight size={17} />
                    </Link>
                  ))
                ) : (
                  <div className="quiet-empty">
                    <Fin size={34} mood="resting" />
                    <div>
                      <p>留一个问题，下次接着想。</p>
                      <span>读过的章节和正在走的路线，会在这里等你。</span>
                    </div>
                  </div>
                )}
              </section>
              <section className="home-signal">
                <div className="section-label">
                  <h2>
                    A signal for you<span>让知识与现实相遇。</span>
                  </h2>
                </div>
                {data.signal && (
                  <Link
                    className="signal-story"
                    to={"/topics/" + data.signal.topic_id}
                  >
                    <div className="signal-source">
                      <Radio size={14} />
                      {data.signal.source}
                      <span>来源资料 · 非实时资讯</span>
                    </div>
                    <h3>{data.signal.title}</h3>
                    <p>{data.signal.reason || data.signal.summary}</p>
                    <span className="text-link">
                      看看背后的概念 <ArrowUpRight size={15} />
                    </span>
                  </Link>
                )}
              </section>
            </div>
            <section className="home-explore">
              <div className="section-label">
                <h2>
                  Explore<span>理解，不止一条路。</span>
                </h2>
              </div>
              <div className="explore-links">
                {[
                  [BookOpen, "Paths", "系统地学一点", "/learn"],
                  [Compass, "Topics", "顺着联系去发现", "/topics/9"],
                  [FlaskConical, "Labs", "改变假设，看看结果", "/lab"],
                  [Radio, "Discover", "从真实世界出发", "/discover"],
                ].map(([Icon, title, note, url]) => {
                  const I = Icon as typeof BookOpen;
                  return (
                    <Link key={String(title)} to={String(url)}>
                      <I size={20} />
                      <div>
                        <h3>{String(title)}</h3>
                        <p>{String(note)}</p>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </State>
    </div>
  );
}
