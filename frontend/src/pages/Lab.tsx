import { ScenarioIntro, ScenarioReflection } from "../components/ScenarioLab";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FlaskConical,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Heading, State, useLoad, SaveButton } from "../components/ui";
import { api } from "../services/api";
import { useAuth } from "../services/auth";
import type { Lab, LabInputs, Simulation } from "../types";
const colors = ["mint", "peach", "blue", "lavender"];
export function Labs() {
  const r = useLoad<Lab[]>("/labs");
  return (
    <>
      <Heading
        eyebrow="LAB / 金融实验室"
        title="不急着做决定，先试着理解。"
        description="八个小实验，把抽象的概念变成看得见的变化。全部使用教学模型与固定情景。"
      />
      <State loading={r.loading} error={r.error} retry={r.reload}>
        <div className="grid three">
          {r.data?.map((l, i) => (
            <Link className="card lab-card" key={l.id} to={"/lab/" + l.id}>
              <div className={"lab-visual " + colors[i % 4]}>
                <span className="lab-index">LAB / 0{l.id}</span>
                <FlaskConical size={54} strokeWidth={1.2} />
                <div className="lab-wave">
                  {[30, 50, 40, 65, 55, 80, 72].map((v, j) => (
                    <i key={j} style={{ height: v + "%" }} />
                  ))}
                </div>
              </div>
              <div className="path-body">
                <div className="eyebrow">{l.english}</div>
                <h2>{l.title}</h2>
                <p>{l.question}</p>
                <span className="text-link">
                  开始探索 <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </State>
    </>
  );
}
const initial: LabInputs = {
  principal: 10000,
  monthly: 500,
  rate: 5,
  years: 10,
  stocks: 50,
  bonds: 30,
  choice: 1,
};
export function LabPage() {
  const { id } = useParams(),
    { user, refresh } = useAuth();
  const r = useLoad<Lab>("/labs/" + id);
  const [inputs, setInputs] = useState<LabInputs>(initial),
    [result, setResult] = useState<Simulation | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setInputs(initial);
    setResult(null);
    setSaved(false);
    setError("");
  }, [id]);
  useEffect(() => {
    let live = true;
    setResult(null);
    setBusy(true);
    const timer = setTimeout(() => {
      api<Simulation>(`/labs/${id}/simulate`, "POST", inputs)
        .then((v) => {
          if (live) setResult(v);
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setBusy(false);
        });
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [id, inputs]);
  function change(key: keyof LabInputs, value: number) {
    setSaved(false);
    setError("");
    setInputs((old) => ({
      ...old,
      [key]: value,
      ...(key === "stocks" && value + old.bonds > 100
        ? { bonds: 100 - value }
        : {}),
    }));
  }
  function slider(
    key: keyof LabInputs,
    label: string,
    min: number,
    max: number,
    step = 1,
    suffix = "",
  ) {
    return (
      <label className="slider-field">
        <span>
          {label}
          <b>
            {inputs[key].toLocaleString()}
            {suffix}
          </b>
        </span>
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={inputs[key]}
          onChange={(e) => change(key, Number(e.target.value))}
        />
        <small>
          {min.toLocaleString()}
          {suffix}
          <span>
            {max.toLocaleString()}
            {suffix}
          </span>
        </small>
      </label>
    );
  }
  const slug = r.data?.slug;
  const choices =
    slug === "risk"
      ? ["平稳路径", "中等波动", "较高波动"]
      : slug === "fomo"
        ? [
            "看到朋友赚钱，马上跟随",
            "先核查信息、风险和资金用途",
            "只收集更多盈利截图",
          ]
        : slug === "loss"
          ? ["只盯着回本价格", "重新检查证据与风险约束", "加大风险试图追回损失"]
          : ["立即采取行动", "暂停，重审目标和新信息", "加杠杆试图快速回本"];
  return (
    <State loading={r.loading} error={r.error} retry={r.reload}>
      {r.data && (
        <>
          <Link className="breadcrumb" to="/lab">
            ← 全部实验
          </Link>
          <Heading
            eyebrow={
              "LAB " + String(r.data.id).padStart(2, "0") + " · 约 3 分钟"
            }
            title={r.data.title}
            description={r.data.question}
          >
            <SaveButton kind="lab" id={r.data.id} />
          </Heading>
          <div className="notice">
            教学模拟 · 使用简化公式与固定情景，不使用实时行情，不预测未来收益。
          </div>
          <section className="lab-intro">
            <h2>你正在探索什么？</h2>
            <p>{r.data.educational_notes.exploring}</p>
          </section>
          <ScenarioIntro lab={r.data} />
          <div className="lab-workspace">
            <div className="card lab-controls">
              <div className="eyebrow">01 / 改变一个条件</div>
              <h2>从你的假设开始</h2>
              {[
                "compound",
                "inflation",
                "risk",
                "allocation",
                "crash",
              ].includes(slug || "") &&
                slider("principal", "初始金额", 1000, 100000, 1000, "元")}
              {slug === "compound" &&
                slider("monthly", "每月投入", 0, 5000, 100, "元")}
              {["compound", "inflation", "interest"].includes(slug || "") &&
                slider(
                  "rate",
                  slug === "inflation"
                    ? "年通胀率"
                    : slug === "interest"
                      ? "市场年收益率"
                      : "假设年收益率",
                  slug === "inflation" ? 0 : -2,
                  12,
                  0.5,
                  "%",
                )}
              {["compound", "inflation"].includes(slug || "") &&
                slider("years", "年限", 1, 40, 1, "年")}
              {slug === "allocation" && (
                <>
                  {slider("stocks", "股票比例", 0, 100, 5, "%")}
                  {slider("bonds", "债券比例", 0, 100 - inputs.stocks, 5, "%")}
                  <p>现金比例：{100 - inputs.stocks - inputs.bonds}%</p>
                </>
              )}
              {["risk", "fomo", "loss", "crash"].includes(slug || "") && (
                <div className="choice-list">
                  {choices.map((c, i) => (
                    <button
                      key={c}
                      className={inputs.choice === i ? "selected" : ""}
                      onClick={() => change("choice", i)}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="card lab-result">
              <div className="eyebrow">02 / 观察结果</div>
              {busy ? (
                <div className="muted" role="status">
                  计算中…
                </div>
              ) : (
                result && (
                  <>
                    {result.value !== null && (
                      <div className="result-value">
                        {result.value.toLocaleString("zh-CN", {
                          maximumFractionDigits: 2,
                        })}
                        <small>
                          元 ·{" "}
                          {slug === "allocation"
                            ? "下跌情景结果"
                            : slug === "interest"
                              ? "债券现值"
                              : slug === "inflation"
                                ? "实际购买力"
                                : "模型结果"}
                        </small>
                      </div>
                    )}
                    {result.points.length > 0 && (
                      <div className="chart">
                        <ResponsiveContainer width="100%" height={290}>
                          <LineChart
                            data={result.points}
                            margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
                          >
                            <CartesianGrid
                              strokeDasharray="4 4"
                              vertical={false}
                              stroke="#e6ece7"
                            />
                            <XAxis dataKey="year" tick={{ fontSize: 13 }} />
                            <YAxis
                              width={62}
                              tick={{ fontSize: 13 }}
                              tickFormatter={(v) =>
                                v >= 10000
                                  ? (v / 10000).toFixed(1) + "万"
                                  : String(v)
                              }
                            />
                            <Tooltip
                              contentStyle={{
                                borderRadius: 12,
                                border: "1px solid #D6DFD7",
                                fontSize: 14,
                              }}
                            />
                            <Legend />
                            <Line
                              name={
                                slug === "inflation" ? "实际购买力" : "模型金额"
                              }
                              type="monotone"
                              dataKey="value"
                              stroke="#1F725D"
                              strokeWidth={3}
                              isAnimationActive={false}
                              dot={false}
                            />
                            {slug === "compound" && (
                              <Line
                                name="累计投入"
                                dataKey="invested"
                                stroke="#456B7E"
                                strokeDasharray="5 5"
                                dot={false}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="explanation">
                      <span className="eyebrow">本次实验</span>
                      <h3>你观察到了什么？</h3>
                      <p>{result.explanation}</p>
                    </div>
                  </>
                )
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                disabled={busy || !result || saved}
                onClick={async () => {
                  if (!user) {
                    setError("请先登录，再保存实验记录。");
                    return;
                  }
                  setBusy(true);
                  try {
                    await api(`/labs/${id}/records`, "POST", inputs);
                    setSaved(true);
                    await refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={17} /> 已记录这次探索
                  </>
                ) : (
                  "保存实验记录"
                )}
              </button>
              {!user && (
                <Link className="text-link" to="/login">
                  登录并记录成长 →
                </Link>
              )}
            </div>
          </div>
          {result && !busy && (
            <ScenarioReflection lab={r.data} inputs={inputs} />
          )}
          <section className="card lab-notes">
            <h3>观察提示</h3>
            <p>{r.data.educational_notes.observe}</p>
            <h3>为什么会这样？</h3>
            <p>{r.data.educational_notes.why}</p>
            <h3>这不意味着什么？</h3>
            <p>{r.data.educational_notes.not_means}</p>
          </section>
          <div className="grid three related-actions">
            <Link
              className="card link-card"
              to={"/lessons/" + r.data.lesson_id}
            >
              继续学习 <ArrowRight size={18} />
            </Link>
            <Link className="card link-card" to={"/topics/" + r.data.topic_id}>
              探索相关概念 <ArrowRight size={18} />
            </Link>
            <Link
              className="card link-card"
              to={"/fintalk?topic=" + r.data.topic_id}
            >
              分享你的发现 <ArrowRight size={18} />
            </Link>
          </div>
        </>
      )}
    </State>
  );
}
