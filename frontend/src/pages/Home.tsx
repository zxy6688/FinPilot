import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Flame,
  BookOpen,
  FlaskConical,
  Send,
} from "lucide-react";
import { useAuth } from "../services/auth";
import {
  useLoad,
  State,
  Section,
  ArticleCard,
  Progress,
  PostCard,
} from "../components/ui";
import { KnowledgeCompass } from "../components/Brand";
import type { Article, LearningPath, Post, Recommendation } from "../types";
export default function Home() {
  const { user } = useAuth(),
    nav = useNavigate();
  const articles = useLoad<Article[]>("/articles"),
    paths = useLoad<LearningPath[]>("/learning-paths"),
    posts = useLoad<Post[]>("/posts"),
    recommendations = useLoad<Recommendation[]>("/recommendations");
  const [q, setQ] = useState("");
  const current =
    paths.data?.find((p) => p.progress > 0 && p.progress < 100) ||
    paths.data?.find((p) => p.progress < 100) ||
    paths.data?.[0];
  const lesson =
    current?.lessons.find((l) => !l.completed) || current?.lessons[0];
  const picks = articles.data
    ? [
        articles.data.find((a) => a.id === 101),
        articles.data.find((a) => a.id === 7),
      ].filter((a): a is Article => Boolean(a))
    : [];
  return (
    <>
      <div className="home-topline">
        <span className="eyebrow">FINANCIAL LEARNING & NAVIGATION</span>
        <span className="muted small">
          {new Date().toLocaleDateString("zh-CN", {
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="dot" />{" "}
            {user ? `${user.name}，欢迎继续探索` : "给每一个对金融好奇的人"}
          </span>
          <h1>
            看懂金融，
            <br />
            形成自己的<span className="accent">判断。</span>
          </h1>
          <p>
            从一条信息，到一个概念。
            <br />
            让课程、AI 与实验，陪你把知识连成地图。
          </p>
          <div className="row wrap hero-actions">
            <Link
              className="button"
              to={lesson ? `/lessons/${lesson.id}` : "/learn"}
            >
              {user ? "继续我的学习" : "开始第一节课"}
              <ArrowUpRight size={18} />
            </Link>
            <Link className="plain-link" to="/discover">
              探索值得理解的事 <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-stats">
            <span>
              <BookOpen size={17} />
              {user ? (
                <>
                  <b>{user.completed_lessons}</b> 节已完成
                </>
              ) : (
                <>28 节微课程</>
              )}
            </span>
            <span>
              {user ? (
                <>
                  <Flame size={17} />
                  连续学习 <b>{user.streak}</b> 天
                </>
              ) : (
                <>
                  <FlaskConical size={17} />8 个互动实验
                </>
              )}
            </span>
          </div>
        </div>
        <KnowledgeCompass />
      </section>
      <div className="home-primary">
        <Section title="今日值得理解" en="DISCOVER" to="/discover">
          <State
            loading={articles.loading}
            error={articles.error}
            retry={articles.reload}
          >
            <div className="grid two">
              {picks.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </State>
        </Section>
        <Section title="继续你的学习" to="/learn">
          <State
            loading={paths.loading}
            error={paths.error}
            retry={paths.reload}
          >
            {current && (
              <div className="card continue-card">
                <div className="continue-label">
                  <BookOpen size={26} />
                  <span>你的下一步</span>
                </div>
                <span className="eyebrow">{current.english}</span>
                <h3>{current.title}</h3>
                <p>{lesson?.title}</p>
                <div className="row between small">
                  <span>
                    {current.lessons.filter((l) => l.completed).length} /{" "}
                    {current.lessons.length} 节已完成
                  </span>
                  <b>{current.progress}%</b>
                </div>
                <Progress value={current.progress} />
                <ol className="mini-journey">
                  {current.lessons.slice(0, 3).map((l) => (
                    <li
                      key={l.id}
                      className={
                        l.completed
                          ? "done"
                          : l.id === lesson?.id
                            ? "current"
                            : ""
                      }
                    >
                      <span />
                      {l.title.split("：")[0]}
                    </li>
                  ))}
                </ol>
                <Link
                  className="button full-width"
                  to={`/lessons/${lesson?.id}`}
                >
                  继续学习 <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </State>
        </Section>
      </div>
      <div className="home-practice grid two">
        <div className="question-card">
          <div className="eyebrow">今日一问</div>
          <h2>
            为什么降息以后，
            <br />
            股票并不一定上涨？
          </h2>
          <p>先想一想市场已经预期了什么，再看发生了什么。</p>
          <details>
            <summary>展开思考提示</summary>
            <p>
              试着区分：政策本身、市场事先的预期，以及促使政策变化的经济背景。
            </p>
          </details>
          <div className="row wrap">
            <Link
              className="text-link"
              to="/copilot?mode=tutor&q=为什么降息并不一定意味着股票上涨？"
            >
              <Sparkles size={17} />让 FinPilot 讲给我听
            </Link>
            <Link className="plain-link" to="/fintalk?topic=9">
              看看大家的思考 →
            </Link>
          </div>
        </div>
        <Link className="lab-teaser" to="/lab/5">
          <div className="row between">
            <span className="eyebrow">今日实验 · 约 3 分钟</span>
            <FlaskConical size={24} />
          </div>
          <div className="lab-mini-chart" aria-hidden="true">
            <svg viewBox="0 0 440 95">
              <path
                d="M10 80H430M10 45H430M10 10H430"
                stroke="#D4DFD5"
                strokeDasharray="3 7"
              />
              <path
                d="M10 10C140 20 230 60 430 80"
                stroke="#456B7E"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="225" cy="47" r="6" fill="#B89552" />
            </svg>
          </div>
          <h2>利率动了，债券呢？</h2>
          <p>拖动收益率滑块，看见现金流背后的折现逻辑。</p>
          <span className="text-link">
            进入利率实验 <ArrowUpRight size={17} />
          </span>
        </Link>
      </div>
      <Section title="为你的好奇心推荐">
        <State
          loading={recommendations.loading}
          error={recommendations.error}
          retry={recommendations.reload}
        >
          <div className="grid three">
            {recommendations.data?.map((r) => (
              <Link
                className="card recommendation"
                key={r.id}
                to={`/lessons/${r.id}`}
              >
                <BookOpen size={22} />
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.reason}</p>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </State>
      </Section>
      <Section title="在讨论中，多理解一点" en="FINTALK" to="/fintalk">
        <State loading={posts.loading} error={posts.error} retry={posts.reload}>
          <div className="card discussion-list">
            {posts.data
              ?.slice()
              .sort((a, b) => b.comments - a.comments)
              .slice(0, 3)
              .map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
          </div>
        </State>
      </Section>
      <section className="quick-ask">
        <div>
          <Sparkles size={25} />
          <h2>从一个好问题开始。</h2>
          <p>不用先懂术语，说出你的困惑就好。</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) nav("/copilot?q=" + encodeURIComponent(q.trim()));
          }}
        >
          <div className="ask-input">
            <input
              aria-label="向FinPilot提问"
              maxLength={6000}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ETF 是什么？为什么人会追涨？"
            />
            <button disabled={!q.trim()} aria-label="发送问题">
              <Send size={19} />
            </button>
          </div>
          <div className="quick-tags">
            {["ETF 是什么", "帮我理解利率", "怎么开始做预算"].map((s) => (
              <Link key={s} to={"/copilot?q=" + encodeURIComponent(s)}>
                {s} ↗
              </Link>
            ))}
          </div>
        </form>
      </section>
    </>
  );
}
