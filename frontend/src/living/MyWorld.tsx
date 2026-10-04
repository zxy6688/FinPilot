import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../services/auth";
import { State, useLoad } from "../components/ui";
import type { HomeData } from "./types";
import type { SavedRoute } from "./RouteExperience";
import type { Reflection } from "./LabExperience";
import type { Moment } from "./MomentHost";
import Constellation from "./Constellation";
import Fin from "./Fin";
interface Memory {
  reviews: {
    id: number;
    due_at: string;
    streak: number;
    item_key: string;
    topic_id: number;
  }[];
  misconceptions: { id: number; tag: string; title: string; status: string }[];
}
const status: Record<string, string> = {
  suspected: "一次值得回看的回答",
  observed: "重复出现的概念混淆",
  addressed: "已完成比较，等待复习确认",
  resolved: "后续复习已确认",
};
const paths: Record<string, string> = {
  article: "/articles/",
  lesson: "/lessons/",
  topic: "/topics/",
  lab: "/lab/",
};
export default function MyWorld() {
  const { user, logout } = useAuth();
  return !user ? (
    <div className="world-guest">
      <Fin size={70} mood="resting" seed />
      <h1>你的理解，会慢慢有自己的形状。</h1>
      <p>登录后，阅读位置、复习、实验反思和知识连接都保存在这里。</p>
      <Link to="/login" className="button">
        开始自己的地图 →
      </Link>
    </div>
  ) : (
    <WorldContent name={user.name} logout={logout} />
  );
}
function WorldContent({
  name,
  logout,
}: {
  name: string;
  logout: () => Promise<void>;
}) {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const home = useLoad<HomeData>("/v3/home"),
    world = useLoad<HomeData["world"]>("/v3/world");
  return (
    <State
      loading={home.loading || world.loading}
      error={home.error || world.error}
      retry={() => {
        home.reload();
        world.reload();
      }}
    >
      {home.data && world.data && (
        <div className="my-world">
          <header className="world-heading">
            <div>
              <span className="eyebrow">MY WORLD / {name}</span>
              <h1>
                理解过的，
                <br />
                正在连成你的世界。
              </h1>
              <p>{world.data.companion.message}</p>
            </div>
            <button className="text-link" onClick={() => void logout()}>
              退出账户
            </button>
          </header>
          <nav className="world-tabs" aria-label="My World sections">
            {[
              ["overview", "Overview"],
              ["knowledge", "Knowledge"],
              ["notebook", "Notebook"],
              ["collection", "Collection"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setParams({ tab: id })}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "overview" ? (
            <>
              <div className="world-overview">
                <div>
                  <Constellation world={home.data.world} compact />
                </div>
                <aside className="world-next">
                  <span className="eyebrow">YOUR NEXT SMALL STEP</span>
                  <h2>{home.data.today.title}</h2>
                  <p>{home.data.today.detail}</p>
                  <Link to={home.data.today.url} className="button">
                    继续理解 →
                  </Link>
                  <div className="world-facts">
                    <span>
                      {world.data.summary.explored} <small>接触过的概念</small>
                    </span>
                    <span>
                      {world.data.summary.connections} <small>建立的连接</small>
                    </span>
                  </div>
                  <Link className="text-link" to="/review">
                    短复习 · {world.data.summary.review_due} 项到期 →
                  </Link>
                </aside>
              </div>
              <section className="world-capsule">
                <Fin size={34} mood="calm" />
                <div>
                  <h3>Daily capsule</h3>
                  <p>
                    {home.data.capsule?.completed
                      ? "今天已完成，给理解留一点消化的时间。"
                      : "每天一小组，回想、辨认、带走一个理解。"}
                  </p>
                </div>
                {!home.data.capsule?.completed && (
                  <Link to={home.data.capsule?.url || "/review?kind=capsule"}>
                    2–3 分钟 →
                  </Link>
                )}
              </section>
              <FinCorner companion={world.data.companion} />
              <RouteList />
              <MemoryList />
            </>
          ) : tab === "knowledge" ? (
            <>
              <p className="muted">
                节点颜色与文字同时表示状态；连接线仅在两端都有充分学习证据时点亮。
              </p>
              <Constellation world={world.data} />
              <section className="knowledge-details">
                <h2>Recently clearer</h2>
                {world.data.topics
                  .filter(
                    (t) => t.state === "building" || t.state === "established",
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <details key={t.id}>
                      <summary>
                        {t.title} ·{" "}
                        {t.state === "established"
                          ? "已有学习证据"
                          : "逐步建立"}
                      </summary>
                      <p>
                        完成 {t.completed_lessons} 节相关课程 · 综合学习证据{" "}
                        {t.evidence}/100。这里不评估金融能力。
                      </p>
                      <Link to={"/topics/" + t.id}>查看主题 →</Link>
                    </details>
                  ))}
                {!world.data.topics.some(
                  (t) => t.state === "building" || t.state === "established",
                ) && <p>完成一节课并练习后，这里会出现真实的理解足迹。</p>}
              </section>
              <MemoryList />
            </>
          ) : tab === "notebook" ? (
            <Notebook />
          ) : tab === "collection" ? (
            <Collection />
          ) : (
            <FinCorner companion={world.data.companion} expanded />
          )}
        </div>
      )}
    </State>
  );
}
function RouteList() {
  const r = useLoad<SavedRoute[]>("/v3/routes");
  return (
    <section className="world-section">
      <span className="eyebrow">ROUTES IN PROGRESS</span>
      <h2>留在路上的好奇心</h2>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data
          ?.filter((x) => x.status === "active")
          .map((x) => (
            <Link
              className="world-list-row"
              key={x.id}
              to={`/learn/routes/${x.target_topic_id}?saved=${x.id}`}
            >
              <b>{x.route_snapshot.title}</b>
              <span>
                第 {x.current_step + 1} / {x.route_snapshot.steps.length} 步 →
              </span>
            </Link>
          ))}
        {!r.data?.some((x) => x.status === "active") && (
          <p className="muted">
            还没有未完成的路线。
            <Link to="/learn">从一个想理解的问题开始 →</Link>
          </p>
        )}
      </State>
    </section>
  );
}
function MemoryList() {
  const r = useLoad<Memory>("/v3/memory");
  return (
    <section className="world-section">
      <span className="eyebrow">MEMORY & DISTINCTIONS</span>
      <h2>值得再看清一点的地方</h2>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data?.misconceptions
          .filter((m) => m.status !== "suspected")
          .map((m) => (
            <Link
              className="world-list-row"
              to={"/compare/" + m.tag}
              key={m.id}
            >
              <b>{m.title}</b>
              <span>{status[m.status]} →</span>
            </Link>
          ))}
        {!r.data?.misconceptions.some((m) => m.status !== "suspected") && (
          <p className="muted">
            暂时没有重复出现的概念混淆。一次答错不会被贴成标签。
          </p>
        )}
        <details>
          <summary>查看复习安排 · {r.data?.reviews.length || 0} 项</summary>
          {r.data?.reviews.map((x) => (
            <div className="world-list-row" key={x.id}>
              <Link to={"/topics/" + x.topic_id}>相关概念</Link>
              <span>
                {new Date(x.due_at).toLocaleDateString("zh-CN")} · 连续辨认{" "}
                {x.streak} 次
              </span>
            </div>
          ))}
        </details>
      </State>
    </section>
  );
}
function Notebook() {
  const r = useLoad<Reflection[]>("/v3/notebook");
  return (
    <section className="world-section notebook">
      <span className="eyebrow">YOUR OWN WORDS</span>
      <h2>不只记住结论，也记住怎么想。</h2>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data?.map((x) => (
          <article key={x.id}>
            <small>
              {x.completed_at &&
                new Date(x.completed_at).toLocaleDateString("zh-CN")}{" "}
              · {x.lab_title}
            </small>
            <h3>{x.reflection}</h3>
            <details>
              <summary>展开当时的预测与结果</summary>
              <p>
                <b>原来的想法：</b>
                {x.reason}
              </p>
              <p>
                <b>模型观察：</b>
                {x.result?.explanation}
              </p>
              {x.result?.value !== null && (
                <p>
                  模型最终值 {x.result?.value.toLocaleString()}，默认对照{" "}
                  {x.comparison?.baseline_value?.toLocaleString()}
                </p>
              )}
              <p className="small muted">
                实际输入：{JSON.stringify(x.inputs)}
              </p>
              <Link to={"/lab/" + x.lab_id}>回到实验 →</Link>
            </details>
          </article>
        ))}
        {!r.data?.length && (
          <div className="quiet-empty">
            <Fin size={38} mood="resting" />
            <p>
              第一次实验反思会留在这里。<Link to="/lab">去 Lab 试一试 →</Link>
            </p>
          </div>
        )}
      </State>
    </section>
  );
}
function Collection() {
  const r =
    useLoad<
      { id: number; kind: string; target_id: number; item: { title: string } }[]
    >("/favorites");
  return (
    <section className="world-section">
      <span className="eyebrow">SAVED FOR LATER</span>
      <h2>想再回来看的东西</h2>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data?.map((x) => (
          <Link
            key={x.id}
            className="world-list-row"
            to={(paths[x.kind] || "/topics/") + x.target_id}
          >
            <b>{x.item.title}</b>
            <span>{x.kind} →</span>
          </Link>
        ))}
        {!r.data?.length && (
          <p className="muted">还没有收藏。阅读时可以轻点书签，留给下次。</p>
        )}
      </State>
    </section>
  );
}
function FinCorner({
  companion,
  expanded = false,
}: {
  companion: HomeData["world"]["companion"];
  expanded?: boolean;
}) {
  const r = useLoad<Moment[]>("/v3/moments");
  return (
    <section className="fin-corner">
      <div className="fin-corner-intro">
        <Fin
          size={68}
          mood={companion.mood}
          domains={companion.domains_awakened}
          seed={companion.companion_form === "seed"}
        />
        <div>
          <span className="eyebrow">FIN'S QUIET CORNER</span>
          <h2>我们一起看懂的那些瞬间。</h2>
          <p>
            形态来自真实学习：指南针、笔记本、轨道、天线与棱镜，分别对应五个逐渐开启的领域。
          </p>
        </div>
      </div>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        <div className="moment-memories">
          {r.data?.slice(0, expanded ? 100 : 3).map((m) => (
            <article key={m.id}>
              <small>
                {new Date(m.created_at).toLocaleDateString("zh-CN")}
              </small>
              <b>{m.title}</b>
              <p>{m.detail}</p>
            </article>
          ))}
        </div>
        {!r.data?.length && (
          <p className="muted">
            这里还很安静。完成第一节课，留下第一个真实的记忆。
          </p>
        )}
        {!expanded && !!r.data?.length && (
          <Link className="text-link" to="/profile?tab=memories">
            看看全部记忆 →
          </Link>
        )}
      </State>
    </section>
  );
}
