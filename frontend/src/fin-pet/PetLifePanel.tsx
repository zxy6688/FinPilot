import { useState } from "react";
import { usePet } from "./PetProvider";
export default function PetLifePanel() {
  const pet = usePet(),
    l = pet.life;
  const [note, setNote] = useState("");
  const minutes = Math.floor(l.focus.remaining / 60),
    seconds = l.focus.remaining % 60;
  return (
    <section className="pet-life">
      <nav aria-label="宠物生活">
        {["陪伴", "专注", "小窝", "纪念册"].map((t) => (
          <button
            key={t}
            aria-pressed={l.tab === t}
            onClick={() => l.setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      {l.tab === "陪伴" && (
        <>
          <h3>现在想怎样待一会儿？</h3>
          <div className="pet-actions">
            {[
              ["开心", "MOOD_GOOD"],
              ["疲惫", "MOOD_TIRED"],
              ["烦躁", "MOOD_IRRITATED"],
              ["难过", "MOOD_LOW"],
              ["想有人陪", "MOOD_COMPANY"],
              ["平静", "MOOD_UNSURE"],
            ].map(([m, e]) => (
              <button
                key={m}
                aria-pressed={l.mood === m}
                onClick={() => {
                  l.setMood(m);
                  l.react(e, true);
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <p>只回应你主动选择的心情，不根据学习或财务数据推测。</p>
          <label>
            <input
              type="checkbox"
              checked={l.quiet}
              onChange={(e) => {
                l.setQuiet(e.target.checked);
                pet.act(e.target.checked ? "Sit" : "Idle");
              }}
            />
            安静陪伴，不主动说话
          </label>
          <button onClick={() => l.react("PET_PAT", true)}>摸摸头</button>
          <button onClick={() => l.react("PET_REST", true)}>休息一会儿</button>
        </>
      )}
      {l.tab === "专注" && (
        <>
          <h3>一起专注</h3>
          <output className="pet-clock" aria-live="off">
            {minutes}:{String(seconds).padStart(2, "0")}
          </output>
          <label>
            时长（分钟）
            <input
              type="number"
              min="1"
              max="180"
              disabled={l.focus.running}
              value={Math.max(1, Math.ceil(l.focus.remaining / 60))}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1 && n <= 180)
                  l.setFocus((f) => ({ ...f, remaining: Math.round(n) * 60 }));
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={l.focus.remind}
              onChange={(e) =>
                l.setFocus((f) => ({ ...f, remind: e.target.checked }))
              }
            />
            结束后提醒休息
          </label>
          <button
            onClick={() => {
              l.setFocus((f) => ({
                ...f,
                running: !f.running,
                endsAt: Date.now() + f.remaining * 1000,
              }));
              l.setBehavior("Focused");
              pet.act("Sit");
            }}
          >
            {l.focus.running ? "暂停" : "开始 / 继续"}
          </button>
          <button
            onClick={() => {
              l.setFocus((f) => ({ ...f, running: false, remaining: 1500 }));
              l.setBehavior("Idle");
              pet.act("Idle");
            }}
          >
            结束计时
          </button>
          <p>计时仅在本次页面会话中运行；关闭网站不会后台提醒。</p>
        </>
      )}
      {l.tab === "小窝" && (
        <>
          <h3>Fin 的小窝</h3>
          <p>布置与装扮将在三维小窝中显示。</p>
          <a href="/fin-pet">进入三维小窝与玩具 →</a>
          <label>
            窗景
            <select
              value={l.data.room.window}
              onChange={(e) =>
                l.setData((d) => ({
                  ...d,
                  room: {
                    ...d.room,
                    window: e.target.value as typeof d.room.window,
                  },
                }))
              }
            >
              <option value="garden">花园</option>
              <option value="rain">雨天（布景）</option>
              <option value="night">夜晚</option>
            </select>
          </label>
          {(["lamp", "bed"] as const).map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={l.data.room[k]}
                onChange={(e) =>
                  l.setData((d) => ({
                    ...d,
                    room: { ...d.room, [k]: e.target.checked },
                  }))
                }
              />
              {k === "lamp" ? "台灯" : "小床"}
            </label>
          ))}
          <label>
            软垫
            <select
              value={l.data.room.cushion}
              onChange={(e) =>
                l.setData((d) => ({
                  ...d,
                  room: {
                    ...d.room,
                    cushion: e.target.value as "mint" | "cream",
                  },
                }))
              }
            >
              <option value="mint">薄荷绿</option>
              <option value="cream">奶白</option>
            </select>
          </label>
          {(["hat", "scarf"] as const).map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={l.data.outfit[k]}
                onChange={(e) =>
                  l.setData((d) => ({
                    ...d,
                    outfit: { ...d.outfit, [k]: e.target.checked },
                  }))
                }
              />
              {k === "hat" ? "软帽" : "围巾"}
            </label>
          ))}
        </>
      )}
      {l.tab === "纪念册" && (
        <>
          <h3>留下自己想记住的片段</h3>
          <textarea
            aria-label="纪念片段"
            maxLength={600}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            disabled={!note.trim()}
            onClick={() => {
              l.remember(note);
              setNote("");
            }}
          >
            加入纪念册
          </button>
          {l.text && (
            <button onClick={() => l.remember(l.text)}>保留刚才的互动</button>
          )}
          {l.data.memories.length === 0 && (
            <p>还没有保留片段。这里不会自动记录你的心情。</p>
          )}
          {l.data.memories.map((m) => (
            <article key={m.id}>
              <time>{new Date(m.at).toLocaleString()}</time>
              <p>{m.text}</p>
              {m.url && <a href={m.url}>重新打开来源</a>}
              <button
                onClick={() =>
                  l.setData((d) => ({
                    ...d,
                    memories: d.memories.filter((x) => x.id !== m.id),
                  }))
                }
              >
                删除片段
              </button>
            </article>
          ))}
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(l.data.memories, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "Fin-memories.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            导出纪念册
          </button>
        </>
      )}
      {l.achievement && (
        <button
          onClick={() =>
            l.remember(
              l.achievement!.trigger === "SAVE_OK"
                ? "一次已确认的保存"
                : "完成一节课程",
              l.achievement!.url,
            )
          }
        >
          把刚才的真实成果收入纪念册
        </button>
      )}
      {l.text && !l.quiet && (
        <p role="status" className="pet-line">
          {l.text}
        </p>
      )}
      <p role="status">{l.status}</p>
      <button disabled={!l.ready} onClick={() => void l.save()}>
        保存宠物布置与纪念册
      </button>
    </section>
  );
}
