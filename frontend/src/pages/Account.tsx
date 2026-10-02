import UnderstandingMap from "../components/UnderstandingMap";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  Award,
  BookOpen,
  Flame,
  Target,
  Bookmark,
  LogOut,
} from "lucide-react";
import { useAuth } from "../services/auth";
import { Heading, Section, State, Empty, useLoad } from "../components/ui";
import { BrandMark, KnowledgeCompass } from "../components/Brand";
import { formatDate } from "../components/ui";
import type { Profile, Badge, Favorite, LearningPath } from "../types";
export function LoginPage() {
  const auth = useAuth(),
    nav = useNavigate();
  const emailInput = useRef<HTMLInputElement>(null),
    passwordInput = useRef<HTMLInputElement>(null);
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <div className="brand">
          <BrandMark size={40} />
          FinPilot
        </div>
        <div className="eyebrow">你的知识旅程，从这里开始</div>
        <h1>
          看懂金融，
          <br />
          形成自己的判断。
        </h1>
        <p>
          不需要一开始就懂很多。
          <br />
          保持好奇，一点一点来。
        </p>
        <KnowledgeCompass compact />
      </div>
      <form
        className="card auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            await auth.login(
              String(f.get("email")),
              String(f.get("password")),
              register ? String(f.get("name")) : undefined,
            );
            nav("/");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="eyebrow">FINPILOT ACCOUNT</div>
        <h2>{register ? "开始你的学习旅程" : "欢迎回来"}</h2>
        <p className="muted">
          {register
            ? "创建账户，记录每一次理解。"
            : "继续探索，接着上次的好奇心。"}
        </p>
        {register && (
          <label>
            昵称
            <input
              name="name"
              required
              maxLength={60}
              autoComplete="nickname"
            />
          </label>
        )}
        <label>
          邮箱
          <input
            ref={emailInput}
            name="email"
            maxLength={254}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          密码
          <input
            ref={passwordInput}
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="至少 8 个字符"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="full-width" disabled={busy}>
          {busy ? "请稍候…" : register ? "创建账户" : "登录"}{" "}
          <ArrowRight size={17} />
        </button>
        <button
          type="button"
          className="quiet full-width"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "已有账户？去登录" : "第一次来？注册账户"}
        </button>
        <div className="demo-account">
          <b>先体验一下？</b>
          <p>体验课程、实验和学习足迹。填入后点击上方“登录”。</p>
          <button
            type="button"
            className="secondary full-width"
            disabled={busy}
            onClick={() => {
              setRegister(false);
              setError("");
              if (emailInput.current)
                emailInput.current.value = "demo@finpilot.app";
              if (passwordInput.current)
                passwordInput.current.value = "demo123456";
              emailInput.current?.focus();
            }}
          >
            填入体验账户
          </button>
        </div>
      </form>
    </div>
  );
}
export function ProfilePage() {
  const auth = useAuth();
  if (auth.loading) return <State loading>{null}</State>;
  if (!auth.user)
    return (
      <div className="state">
        <Compass size={40} />
        <h1>每一点成长，都值得记录。</h1>
        <p>登录后查看学习进度、错题复习与收藏。</p>
        <Link className="button" to="/login">
          登录 / 注册
        </Link>
      </div>
    );
  return <ProfileContent />;
}
function ProfileContent() {
  const auth = useAuth(),
    nav = useNavigate();
  const p = useLoad<Profile>("/users/me"),
    badges = useLoad<Badge[]>("/badges"),
    favorites = useLoad<Favorite[]>("/favorites"),
    paths = useLoad<LearningPath[]>("/learning-paths");
  const nextPath = paths.data?.find((p) => p.progress < 100);
  const nextLesson = nextPath?.lessons.find((l) => !l.completed);
  const [error, setError] = useState("");
  const target = (f: Favorite) =>
    f.kind === "article"
      ? "/topics/" + f.item.topic_id
      : ({
          lesson: "/lessons/",
          topic: "/topics/",
          post: "/fintalk/",
          lab: "/lab/",
        }[f.kind] || "/") + f.target_id;
  return (
    <State loading={p.loading} error={p.error} retry={p.reload}>
      {p.data && (
        <>
          <Heading
            eyebrow="MY UNDERSTANDING / LEARNING EVIDENCE"
            title={p.data.name + "的理解地图"}
            description="这里记录你学会了什么，以及下一步值得探索的方向。"
          >
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await auth.logout();
                  nav("/");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={15} /> 退出登录
            </button>
          </Heading>
          {error && <p className="error">{error}</p>}
          <UnderstandingMap />
          <div className="stats-grid">
            {[
              [BookOpen, p.data.completed_lessons, "完成课程"],
              [Target, p.data.quiz_accuracy + "%", "最近作答正确率"],
              [Flame, p.data.streak, "连续学习天数（北京时间）"],
              [Bookmark, p.data.favorites, "收藏内容"],
            ].map(([Icon, value, label]) => {
              const I = Icon as typeof BookOpen;
              return (
                <div className="card stat-card" key={String(label)}>
                  <I size={22} />
                  <b>{String(value)}</b>
                  <span>{String(label)}</span>
                </div>
              );
            })}
          </div>
          <Section title="接着上次，继续学习">
            <State
              loading={paths.loading}
              error={paths.error}
              retry={paths.reload}
            >
              {nextLesson ? (
                <Link
                  className="card profile-continue"
                  to={`/lessons/${nextLesson.id}`}
                >
                  <BookOpen size={28} />
                  <div>
                    <span className="muted small">{nextPath?.title}</span>
                    <h3>{nextLesson.title}</h3>
                    <span>
                      约 {nextLesson.minutes} 分钟 · {nextLesson.question_count}{" "}
                      道自测
                    </span>
                  </div>
                  <ArrowRight />
                </Link>
              ) : (
                <Link className="text-link" to="/learn">
                  回到学习路径复习 →
                </Link>
              )}
            </State>
          </Section>
          <Section title="成长的里程碑" en="YOUR BADGES">
            <State
              loading={badges.loading}
              error={badges.error}
              retry={badges.reload}
            >
              <div className="badge-grid">
                {badges.data?.map((b) => (
                  <div
                    className={
                      "card badge-card " + (b.earned ? "earned" : "locked")
                    }
                    key={b.id}
                  >
                    <Award size={38} />
                    <b>{b.title}</b>
                    <p>{b.description}</p>
                    <span className="tag">
                      {b.earned ? "已获得" : "待解锁"}
                    </span>
                  </div>
                ))}
              </div>
            </State>
          </Section>
          <Section title="最近的学习记录">
            <div className="card activity-list">
              {p.data.recent_activity?.length ? (
                p.data.recent_activity.map((a) => (
                  <Link className="activity-row" key={a.id} to={a.url}>
                    <span className="activity-dot" />
                    <div>
                      <span className="muted small">{a.kind}</span>
                      <h3>{a.title}</h3>
                    </div>
                    <time>{formatDate(a.created_at)}</time>
                    <ArrowRight size={16} />
                  </Link>
                ))
              ) : (
                <Empty text="完成一节课、做一次实验，学习记录就会出现在这里。" />
              )}
            </div>
          </Section>
          <Section title="收藏的好问题与好内容" en="SAVED FOR LATER">
            <State
              loading={favorites.loading}
              error={favorites.error}
              retry={favorites.reload}
            >
              {favorites.data?.length ? (
                <div className="grid three">
                  {favorites.data.map((f) => (
                    <Link className="card" key={f.id} to={target(f)}>
                      <span className="tag">{f.kind}</span>
                      <h3>{f.item.title}</h3>
                      <span className="text-link">继续探索 →</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty text="还没有收藏。在资讯、课程、Topic、实验或帖子上点击书签即可保存。" />
              )}
            </State>
          </Section>
        </>
      )}
    </State>
  );
}
