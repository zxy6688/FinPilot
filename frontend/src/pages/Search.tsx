import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, ArrowUpRight } from "lucide-react";
import { Heading, State, Empty, useLoad, Section } from "../components/ui";
interface Result {
  id: number;
  title: string;
  summary?: string;
  topic_id?: number;
}
const sections: Record<string, { label: string; path: string }> = {
  topics: { label: "Topics · 知识主题", path: "/topics/" },
  articles: { label: "Discover · 信息导航", path: "/topics/" },
  lessons: { label: "Learn · 课程", path: "/lessons/" },
  labs: { label: "Lab · 实验", path: "/lab/" },
  posts: { label: "FinTalk · 讨论", path: "/fintalk/" },
};
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [text, setText] = useState(q);
  const r = useLoad<Record<string, Result[]>>(
    "/search?q=" + encodeURIComponent(q),
  );
  return (
    <>
      <Heading
        eyebrow="SEARCH / 全站搜索"
        title="跟着好奇心，找到你的下一步。"
        description="搜索主题、资讯、课程、实验与讨论。"
      />
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: text.trim() });
        }}
      >
        <SearchIcon />
        <input
          aria-label="搜索关键词"
          maxLength={100}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="试试：利率、ETF、FOMO…"
        />
        <button>搜索</button>
      </form>
      {!q ? (
        <div className="card search-suggestions"><p>试试这些常见问题，也可以按 Ctrl K 随时搜索。</p>{["利率","ETF","预算","FOMO"].map(q=><button className="secondary" key={q} onClick={()=>{setText(q);setParams({q});}}>{q}</button>)}</div>
      ) : (
        <State loading={r.loading} error={r.error} retry={r.reload}>
          {r.data && Object.values(r.data).every((x) => !x.length) ? (
            <Empty text="没有找到相关内容，试试更简短的关键词。" />
          ) : (
            Object.entries(r.data || {}).map(
              ([key, items]) =>
                items.length > 0 && (
                  <Section key={key} title={sections[key].label}>
                    <div className="grid three">
                      {items.map((x) => (
                        <Link
                          className="card search-result"
                          key={x.id}
                          to={
                            sections[key].path +
                            (key === "articles" ? x.topic_id : x.id)
                          }
                        >
                          <h3>{x.title}</h3>
                          {x.summary && <p>{x.summary}</p>}
                          <ArrowUpRight size={18} />
                        </Link>
                      ))}
                    </div>
                  </Section>
                ),
            )
          )}
        </State>
      )}
    </>
  );
}
