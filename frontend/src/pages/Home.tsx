import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Compass, FlaskConical } from "lucide-react";
import {
  Heading,
  Section,
  State,
  useLoad,
  Progress,
  ArticleCard,
} from "../components/ui";
import { KnowledgeCompass } from "../components/Brand";
import type { Workspace } from "../v2types";
export default function Home() {
  const r = useLoad<Workspace>("/v2/home");
  return (
    <>
      <Heading
        eyebrow="MY FINPILOT / YOUR UNDERSTANDING WORKSPACE"
        title={
          r.data?.name
            ? `${r.data.name}，今天继续理解一点。`
            : "看懂金融，形成自己的判断。"
        }
        description="把上次的疑问、今天的发现和下一步学习，连成属于你的知识地图。"
      />
      <State loading={r.loading} error={r.error} retry={r.reload}>
        {r.data && (
          <>
            {!r.data.has_evidence && (
              <section className="onboarding card">
                <span className="eyebrow">WELCOME TO FINPILOT</span>
                <h2>从一个问题开始，不必先懂所有术语。</h2>
                <p>
                  这里还没有你的学习证据。以下是新手入口，不是对你的能力判断。
                </p>
                <div className="row wrap">
                  <Link className="button" to="/learn/1">
                    Start Money Basics
                  </Link>
                  <Link className="button secondary" to="/topics/1">
                    探索一个 Topic
                  </Link>
                  <Link className="button secondary" to="/lab/1">
                    尝试一个 Lab
                  </Link>
                  <Link className="text-link" to="/copilot">
                    Ask AI →
                  </Link>
                </div>
              </section>
            )}
            <div className="workspace-focus">
              <Section title="接着上次，继续学习" en="CONTINUE LEARNING">
                <div className="card workspace-continue">
                  <BookOpen size={28} />
                  {r.data.continue_learning ? (
                    <>
                      <span className="eyebrow">
                        {r.data.continue_learning.path_title}
                      </span>
                      <h2>{r.data.continue_learning.title}</h2>
                      <p>{r.data.continue_learning.reason}</p>
                      <div className="row between">
                        <span>路径完成进度</span>
                        <b>{r.data.continue_learning.progress}%</b>
                      </div>
                      <Progress value={r.data.continue_learning.progress} />
                      <Link
                        className="button"
                        to={"/lessons/" + r.data.continue_learning.id}
                      >
                        继续学习 <ArrowRight size={17} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2>已完成现有课程，回看一个概念吧。</h2>
                      <Link className="button" to="/learn">
                        复习学习路径
                      </Link>
                    </>
                  )}
                  <div className="row wrap">
                    {r.data.recent_topics.slice(0, 3).map((t) => (
                      <Link className="tag" key={t.id} to={"/topics/" + t.id}>
                        {t.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </Section>
              <Section title="值得再想一遍" en="NEEDS REVIEW">
                <div className="card review-panel">
                  {r.data.needs_review.length ? (
                    r.data.needs_review.map((t) => (
                      <Link
                        className="review-row"
                        key={t.id}
                        to={
                          t.lesson_id
                            ? "/lessons/" + t.lesson_id
                            : "/topics/" + t.id
                        }
                      >
                        <div>
                          <h3>{t.title}</h3>
                          <p>{t.reason}</p>
                          {t.wrong_questions > 0 && (
                            <small>
                              这些题累计出现 {t.repeated_errors} 次错误作答
                            </small>
                          )}
                        </div>
                        <ArrowRight size={19} />
                      </Link>
                    ))
                  ) : (
                    <>
                      <h3>让学习证据慢慢积累。</h3>
                      <p>完成自测后，仍有疑问的概念会出现在这里。</p>
                    </>
                  )}
                  <Link className="text-link" to="/profile">
                    查看 Understanding Map →
                  </Link>
                </div>
              </Section>
            </div>
            <Section
              title="顺着已有知识，再走一步"
              en="BECAUSE YOU LEARNED THIS"
            >
              <div className="grid three">
                {r.data.next_related_topics.length ? (
                  r.data.next_related_topics.map((t) => (
                    <article className="card next-topic" key={t.id}>
                      <span className="eyebrow">
                        {t.from_title} → {t.relation_label}
                      </span>
                      <h3>{t.title}</h3>
                      <p>{t.reason}</p>
                      <Link className="text-link" to={"/learn/routes/" + t.id}>
                        连接成学习路线 →
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="card">
                    <h3>知识连接从一次探索开始。</h3>
                    <p>浏览主题后，这里会根据真实关系解释下一步。</p>
                    <Link to="/learn">选择学习目标 →</Link>
                  </div>
                )}
              </div>
            </Section>
            <Section
              title="现实资料，连接你的理解"
              en="FROM THE REAL WORLD"
              to="/discover"
            >
              {r.data.relevant_real_world_items.length ? (
                <div className="grid three">
                  {r.data.relevant_real_world_items.map((a) => (
                    <div key={a.id} className="relevant-item">
                      <p className="relevance-note">
                        Related to Your Learning · {a.reason}
                      </p>
                      <ArticleCard article={a} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="notice">
                  尚无与当前学习证据关联的资料。
                  <Link to="/discover">从已有来源目录开始探索 →</Link>
                </p>
              )}
            </Section>
            <div className="grid two">
              <section className="card scenario-teaser">
                <FlaskConical size={30} />
                <span className="eyebrow">TRY IT IN A LAB</span>
                {r.data.recommended_lab ? (
                  <>
                    <h2>{r.data.recommended_lab.title}</h2>
                    <p>{r.data.recommended_lab.reason}</p>
                    <p>{r.data.recommended_lab.question}</p>
                    <Link
                      className="button secondary"
                      to={"/lab/" + r.data.recommended_lab.id}
                    >
                      改变一个参数，观察一下 →
                    </Link>
                  </>
                ) : (
                  <>
                    <h2>暂无直接关联实验</h2>
                    <p>可以先从主题课程继续理解，不会随机替你挑选。</p>
                    <Link to="/lab">浏览实验目录 →</Link>
                  </>
                )}
              </section>
              <section className="card route-teaser">
                <Compass size={30} />
                <span className="eyebrow">YOUR NEXT CONNECTION</span>
                <h2>把一个目标连成学习路线。</h2>
                <p>
                  {r.data.route_reason}
                  。路线使用现有主题关系，不把关联当作必然因果。
                </p>
                <Link
                  className="button"
                  to={"/learn/routes/" + r.data.route_target}
                >
                  查看建议路线 →
                </Link>
              </section>
            </div>
            <Section title="探索更大的知识系统" en="KNOWLEDGE COMPASS">
              <div className="compass-explore">
                <div>
                  <h2>理解不止一条路。</h2>
                  <p>个人工作台之外，保留一张可自由探索的金融知识罗盘。</p>
                  <Link className="text-link" to="/discover">
                    从真实世界的问题出发 →
                  </Link>
                </div>
                <KnowledgeCompass />
              </div>
            </Section>
          </>
        )}
      </State>
    </>
  );
}
