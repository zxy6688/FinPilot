import { useAuth } from "../services/auth";
import { useLoad } from "../components/ui";
import { api } from "../services/api";
import type { Favorite } from "../types";
import { Link } from "react-router-dom";
import { useState } from "react";
export function WorldShelf() {
  const { user } = useAuth();
  return (
    <section className="k-world-links">
      <h2>资料、练习和陪伴，也在这里。</h2>
      <p>保存的概念与实验在发现手册中；课程作答与错题沿用原有学习记录。</p>
      <div>
        <Link to="/review">错题与到期复习 →</Link>
        <Link to="/concept-studio#courses">课程与正在进行的路线 →</Link>
        <Link to="/profile/history">查看原有反思、学习足迹与 Fin 纪念物 →</Link>
        <Link to="/fin-design">认识 Fin 的表情与动作 →</Link>
      </div>
      {user ? (
        <Favorites />
      ) : (
        <p>登录后读取账户收藏；访客发现仅保存在此浏览器。</p>
      )}
    </section>
  );
}
function Favorites() {
  const f = useLoad<Favorite[]>("/favorites"),
    [error, setError] = useState("");
  const urls: Record<string, string> = {
    article: "/articles/",
    lesson: "/lessons/",
    topic: "/topics/",
    lab: "/lab/",
    post: "/fintalk/",
  };
  return (
    <div className="k-favorites">
      <h3>我收藏的资料</h3>
      {f.error && (
        <p role="alert">
          {f.error}
          <button onClick={f.reload}>重试</button>
        </p>
      )}
      {!f.loading && !f.data?.length && (
        <p>
          还没有收藏资料。
          <Link to="/discover/library">去资料库找一篇值得留下的阅读 →</Link>
        </p>
      )}
      {f.data?.map((x) => (
        <div className="k-recent" key={x.id}>
          <Link to={(urls[x.kind] || "/topics/") + x.target_id}>
            {x.item.title}
          </Link>
          <button
            className="rd-text-link"
            onClick={async () => {
              try {
                await api("/favorites/" + x.kind + "/" + x.target_id, "POST");
                f.reload();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            取消收藏
          </button>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
