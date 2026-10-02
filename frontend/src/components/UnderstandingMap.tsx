import { useState } from "react";
import { Link } from "react-router-dom";
import { State, useLoad, Progress, Section } from "./ui";
import type { Understanding, EvidenceState } from "../v2types";
export const stateLabels: Record<EvidenceState, string> = {
  unexplored: "未探索",
  exploring: "正在理解",
  building: "逐步建立",
  established: "已有较充分学习证据",
};
export default function UnderstandingMap() {
  const r = useLoad<Understanding>("/v2/understanding-map"),
    [domain, setDomain] = useState(0);
  const selected = r.data?.domains.find((d) => d.id === domain);
  return (
    <Section title="我的理解地图" en="UNDERSTANDING MAP">
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data && (
          <>
            <p className="notice" title={r.data.notice}>
              {r.data.notice} 缺少某类内容时会重新分配可用权重。
            </p>
            {!r.data.has_evidence && (
              <div className="card onboarding">
                <h3>还没有学习证据 · No learning evidence yet</h3>
                <p>
                  浏览主题、完成课程、自测和保存实验后，这张地图会逐步形成。
                </p>
                <Link className="button" to="/learn/1">
                  开始 Money Basics
                </Link>
              </div>
            )}
            <div className="domain-strip">
              {r.data.domains.map((d) => (
                <button
                  className={"domain-card " + (domain === d.id ? "active" : "")}
                  aria-pressed={domain === d.id}
                  key={d.id}
                  onClick={() => setDomain(domain === d.id ? 0 : d.id)}
                >
                  <span className="eyebrow">{d.english}</span>
                  <b>
                    {d.covered} / {d.total} 个主题已接触
                  </b>
                  <Progress value={d.total ? (d.covered / d.total) * 100 : 0} />
                  <small>
                    {d.completed_lessons} / {d.lesson_count} 节完成 ·{" "}
                    {d.needs_review} 个值得复习
                  </small>
                </button>
              ))}
            </div>
            <div className="row between wrap">
              <p>
                {selected ? selected.title : "全部主题"} · 点击卡片查看证据构成
              </p>
              <Link
                className="button secondary"
                to={"/learn/routes/" + r.data.suggested_route}
              >
                继续知识路线 →
              </Link>
            </div>
            {r.data.recent_topics.length > 0 && (
              <p className="muted">
                最近留下证据：
                {r.data.recent_topics.map((t) => t.title).join(" · ")}
              </p>
            )}
            <div className="evidence-grid">
              {r.data.topics
                .filter((t) => !selected || selected.topic_ids.includes(t.id))
                .map((t) => (
                  <details
                    className={"card evidence-card " + t.state}
                    key={t.id}
                  >
                    <summary>
                      <span className="row between">
                        <b>{t.title}</b>
                        <span className="tag">{stateLabels[t.state]}</span>
                      </span>
                      <span className="evidence-value">
                        Learning Evidence <strong>{t.evidence}%</strong>
                      </span>
                      <Progress value={t.evidence} />
                    </summary>
                    <div className="evidence-detail">
                      <p>
                        课程 {t.completed_lessons}/{t.lesson_count} · 最近答对{" "}
                        {t.correct_questions}/{t.question_count} · 实验{" "}
                        {t.lab_participation}/{t.lab_count}
                      </p>
                      <p>
                        {t.engaged
                          ? "已浏览或收藏相关内容"
                          : "尚无浏览或收藏记录"}
                        {t.wrong_questions > 0 &&
                          `；${t.wrong_questions} 道题值得复习`}
                      </p>
                      <small>
                        可用权重：课程 {t.weights.lesson}% / 自测{" "}
                        {t.weights.quiz}% / 实验 {t.weights.lab}% / 接触{" "}
                        {t.weights.engagement}%
                      </small>
                      <div className="row wrap">
                        <Link to={"/topics/" + t.id}>探索主题 →</Link>
                        <Link to={"/learn/routes/" + t.id}>建立路线 →</Link>
                        {t.lesson_id && (
                          <Link to={"/lessons/" + t.lesson_id}>相关课程 →</Link>
                        )}
                      </div>
                    </div>
                  </details>
                ))}
            </div>
          </>
        )}
      </State>
    </Section>
  );
}
