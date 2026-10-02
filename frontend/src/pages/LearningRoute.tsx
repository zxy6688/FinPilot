import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heading, State, useLoad, SaveButton } from "../components/ui";
import ContextAI from "../components/ContextAI";
import { stateLabels } from "../components/UnderstandingMap";
import type { LearningRoute } from "../v2types";
import type { Topic } from "../types";
export function RouteBuilder() {
  const r = useLoad<Topic[]>("/topics"),
    [target, setTarget] = useState(""),
    nav = useNavigate();
  return (
    <section className="card route-builder">
      <div>
        <span className="eyebrow">BUILD A LEARNING ROUTE</span>
        <h2>你下一步想理解什么？</h2>
        <p>从已有学习证据出发，沿真实知识关系连接目标。</p>
      </div>
      <State loading={r.loading} error={r.error} retry={r.reload}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (target) nav("/learn/routes/" + target);
          }}
        >
          <label htmlFor="route-target">目标 Topic</label>
          <select
            id="route-target"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">选择一个想理解的概念</option>
            {r.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} · {t.english}
              </option>
            ))}
          </select>
          <button disabled={!target}>建立学习路线 →</button>
        </form>
      </State>
    </section>
  );
}
export default function LearningRoutePage() {
  const { id } = useParams(),
    r = useLoad<LearningRoute>("/v2/learning-routes/" + id);
  const target = r.data?.steps[r.data.steps.length - 1];
  return (
    <>
      <Link className="breadcrumb" to="/learn">
        ← 返回 Learn
      </Link>
      <Heading
        eyebrow="LEARNING ROUTE / 知识连接路线"
        title={target ? "通向「" + target.title + "」" : "找到下一步的理解"}
        description="从已经接触的知识出发，解释每一步为什么相连。"
      />
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data && (
          <>
            <div className="route-intro card">
              <span className="tag">
                {r.data.kind === "connection"
                  ? "Connection Route · 连通路线"
                  : r.data.kind === "no_path"
                    ? "尚无连接路线"
                    : r.data.kind === "already_known"
                      ? "复习目标"
                      : "Learning Route · 有向路线"}
              </span>
              <p>{r.data.reason}</p>
              <p className="muted">
                {r.data.personalized
                  ? "起点依据你的站内学习证据。"
                  : "目前没有足够学习记录，先从基础目录寻找连接。"}
              </p>
              <div className="row wrap">
                <span>收藏目标，稍后从 Home 继续：</span>
                <SaveButton kind="topic" id={Number(id)} />
              </div>
            </div>
            <ol className="route-steps">
              {r.data.steps.map((s, i) => (
                <li key={s.id}>
                  <article
                    className={
                      "card route-step " + (s.is_target ? "target" : "")
                    }
                  >
                    <span className="route-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="row wrap">
                        <span className="tag">
                          {s.state === "established" ? "Known · " : ""}
                          {stateLabels[s.state]}
                        </span>
                        {s.is_next && (
                          <span className="tag">Next · 下一步</span>
                        )}
                        {s.is_target && (
                          <span className="tag">Target · 目标</span>
                        )}
                      </div>
                      <h2>{s.title}</h2>
                      <p>
                        Learning Evidence {s.evidence}% · 已完成{" "}
                        {s.completed_lessons} 节相关课程
                      </p>
                      <div className="row wrap">
                        <Link
                          className="button secondary"
                          to={"/topics/" + s.id}
                        >
                          理解主题
                        </Link>
                        {s.lesson_id && (
                          <Link
                            className="text-link"
                            to={"/lessons/" + s.lesson_id}
                          >
                            进入课程 →
                          </Link>
                        )}
                        {s.lab_id ? (
                          <Link className="text-link" to={"/lab/" + s.lab_id}>
                            关联实验 →
                          </Link>
                        ) : (
                          <span className="muted small">暂无直接关联实验</span>
                        )}
                      </div>
                    </div>
                  </article>
                  {r.data!.relations[i] && (
                    <div className="route-connection">
                      <span aria-hidden="true">↓</span>
                      <b>{r.data!.relations[i].relation_label}</b>
                      <small>
                        {r.data!.relations[i].from_title} →{" "}
                        {r.data!.relations[i].to_title}
                        {r.data!.relations[i].traversed_reverse
                          ? " · 本步沿连接反向探索，不表示反向因果"
                          : ""}
                      </small>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <ContextAI
              context={{ source_type: "route", source_id: Number(id) }}
              title={target?.title || "学习路线"}
              actions={["explain", "next", "quiz"]}
            />
          </>
        )}
      </State>
    </>
  );
}
