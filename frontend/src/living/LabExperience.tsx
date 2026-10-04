import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { State, useLoad, SaveButton } from "../components/ui";
import { useAuth } from "../services/auth";
import { api } from "../services/api";
import ContextAI from "../components/ContextAI";
import { RouteReturn } from "./RouteExperience";
import Fin from "./Fin";
import type { Lab, LabInputs, Simulation } from "../types";
export interface Reflection {
  id: number;
  lab_id: number;
  lab_title?: string;
  prediction: string;
  reason: string;
  inputs: LabInputs | null;
  result: Simulation | null;
  comparison: {
    baseline_value: number | null;
    delta: number;
    direction: string;
    matched: boolean | null;
    note: string;
  } | null;
  reflection: string;
  created_at: string;
  completed_at: string | null;
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
const directions = [
  ["higher", "更高"],
  ["lower", "更低"],
  ["same", "接近不变"],
  ["uncertain", "还不确定"],
];
export default function LabExperience() {
  const { id } = useParams();
  return <Experiment key={id} id={Number(id)} />;
}
function Experiment({ id }: { id: number }) {
  const r = useLoad<Lab>("/labs/" + id),
    { user, refresh } = useAuth();
  const [record, setRecord] = useState<Reflection | null>(null),
    [prediction, setPrediction] = useState("uncertain"),
    [reason, setReason] = useState(""),
    [reflection, setReflection] = useState(""),
    [inputs, setInputs] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [changed, setChanged] = useState(false);
  useEffect(() => {
    let active = true;
    if (user)
      api<Reflection | null>(`/v3/labs/${id}/prediction`)
        .then((row) => {
          if (active) {
            setRecord(row);
            if (row?.inputs) setInputs(row.inputs);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoaded(true);
        });
    else setLoaded(true);
    return () => {
      active = false;
    };
  }, [user?.id, id]);
  async function predict() {
    setBusy(true);
    setError("");
    try {
      const row = await api<Reflection>(`/v3/labs/${id}/prediction`, "POST", {
        prediction,
        reason,
      });
      setRecord(row);
      window.dispatchEvent(new Event("living-updated"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      setRecord(
        await api<Reflection>(
          `/v3/reflections/${record.id}/experiment`,
          "POST",
          inputs,
        ),
      );
      setChanged(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      setRecord(
        await api<Reflection>(`/v3/reflections/${record.id}/complete`, "POST", {
          reflection,
        }),
      );
      await refresh();
      window.dispatchEvent(new Event("living-updated"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function change(key: keyof LabInputs, value: number) {
    setChanged(true);
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
      <label className="experiment-slider">
        <span>
          {label}
          <b>
            {inputs[key].toLocaleString()}
            {suffix}
          </b>
        </span>
        <input
          type="range"
          aria-label={label}
          value={inputs[key]}
          min={min}
          max={max}
          step={step}
          disabled={!!record?.completed_at || busy}
          onChange={(e) => change(key, Number(e.target.value))}
        />
      </label>
    );
  }
  const slug = r.data?.slug,
    behavior = ["fomo", "loss", "crash"].includes(slug || "");
  const choices =
    slug === "risk"
      ? ["平稳路径", "中等波动", "较高波动"]
      : slug === "fomo"
        ? ["马上跟随", "先核查信息与约束", "只看盈利截图"]
        : slug === "loss"
          ? ["只盯回本价", "重新检查证据", "扩大风险追回损失"]
          : ["立即行动", "暂停重审目标", "加杠杆回本"];
  return (
    <State loading={r.loading || !loaded} error={r.error} retry={r.reload}>
      {r.data && (
        <div className="lab-experience">
          <Link className="breadcrumb" to="/lab">
            ← Lab
          </Link>
          <header className="living-heading">
            <span className="eyebrow">PREDICT · EXPERIMENT · REFLECT</span>
            <h1>{r.data.title}</h1>
            <p>{r.data.question}</p>
            <SaveButton kind="lab" id={id} />
          </header>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {!record ? (
            <section className="prediction-sheet">
              <Fin size={46} mood="curious" />
              <span className="eyebrow">FIRST, YOUR OWN THOUGHT</span>
              <h2>
                {behavior
                  ? "你觉得，什么信息会改变自己的选择？"
                  : "改变一个参数，最终模型值会怎样变化？"}
              </h2>
              <p>
                {behavior
                  ? "先写下你可能如何反应，以及为什么。行为情景不根据金额曲线判断你的性格或决策能力。"
                  : "先预测最终值相对默认设置会更高、更低，还是接近不变。下一步会显示默认参数，你可以只改变一个参数，观察差异。"}
              </p>
              <div
                className="prediction-directions"
                role="group"
                aria-label="预测方向"
              >
                {directions.map(([value, label]) => (
                  <button
                    key={value}
                    className={
                      "secondary " + (prediction === value ? "selected" : "")
                    }
                    aria-pressed={prediction === value}
                    onClick={() => setPrediction(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                我这样想，是因为…
                <textarea
                  value={reason}
                  maxLength={1000}
                  minLength={4}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    behavior
                      ? "写下你会核查的一条信息，或可能受影响的一种情绪。"
                      : "写下你想改变的参数，以及你预期它会怎样影响结果。"
                  }
                />
              </label>
              {user ? (
                <button
                  disabled={busy || reason.trim().length < 4}
                  onClick={predict}
                >
                  保存预测，进入实验 →
                </button>
              ) : (
                <Link className="button" to="/login">
                  登录后留下预测 →
                </Link>
              )}
            </section>
          ) : (
            <>
              <div className="prediction-note">
                <span>
                  你的预测 ·{" "}
                  {directions.find((d) => d[0] === record.prediction)?.[1]}
                </span>
                <p>{record.reason}</p>
              </div>
              <div className="experiment-workspace">
                <aside className="experiment-controls">
                  <span className="eyebrow">CHANGE ONE THING</span>
                  {!behavior &&
                    slug !== "interest" &&
                    slider("principal", "初始金额", 1000, 100000, 1000)}
                  {slug === "compound" &&
                    slider("monthly", "每月投入", 0, 5000, 100)}
                  {["compound", "inflation", "interest"].includes(slug || "") &&
                    slider(
                      "rate",
                      slug === "inflation"
                        ? "通胀率"
                        : slug === "interest"
                          ? "市场要求收益率"
                          : "年名义收益率",
                      slug === "inflation" ? -5 : 0,
                      15,
                      0.5,
                      "%",
                    )}
                  {["compound", "inflation"].includes(slug || "") &&
                    slider("years", "时间", 1, 30, 1, " 年")}
                  {slug === "allocation" && (
                    <>
                      {slider("stocks", "股票比例", 0, 100, 5, "%")}
                      {slider(
                        "bonds",
                        "债券比例",
                        0,
                        100 - inputs.stocks,
                        5,
                        "%",
                      )}
                      <small>现金 {100 - inputs.stocks - inputs.bonds}%</small>
                    </>
                  )}
                  {["risk", "fomo", "loss", "crash"].includes(slug || "") && (
                    <div className="experiment-choices">
                      {choices.map((c, i) => (
                        <button
                          key={i}
                          className={
                            "secondary " +
                            (inputs.choice === i ? "selected" : "")
                          }
                          aria-pressed={inputs.choice === i}
                          disabled={!!record.completed_at}
                          onClick={() => change("choice", i)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    disabled={busy || !!record.completed_at}
                    onClick={run}
                  >
                    {busy ? "正在计算…" : "运行这个假设"}
                  </button>
                  <p className="small muted">
                    默认对照：初始 10,000、月投 500、利率 5%、10 年、股票
                    50%、债券 30%、情景 2。各实验只使用相关参数。
                  </p>
                </aside>
                <section className="experiment-result">
                  {record.result ? (
                    <>
                      <span className="eyebrow">WHAT THE MODEL SHOWS</span>
                      {changed && (
                        <p className="notice">
                          参数已变化；下方仍是上一次计算结果，请重新运行。
                        </p>
                      )}
                      {record.result.value !== null && (
                        <div className="model-value">
                          <strong>
                            {record.result.value.toLocaleString()}
                          </strong>
                          <span>教学模型最终值</span>
                        </div>
                      )}
                      {record.result.points.length > 0 && (
                        <div className="experiment-chart">
                          <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={record.result.points}>
                              <CartesianGrid
                                strokeDasharray="3 6"
                                vertical={false}
                                stroke="#e1e8df"
                              />
                              <XAxis dataKey="year" fontSize={11} />
                              <YAxis width={62} fontSize={11} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="value"
                                name="模型值"
                                stroke="#356b73"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <h3>发生了什么</h3>
                      <p>{record.result.explanation}</p>
                      {record.comparison && (
                        <div className="result-comparison">
                          <b>
                            {record.comparison.matched === null
                              ? "把理由与观察放在一起"
                              : record.comparison.matched
                                ? "变化方向与你的预测一致"
                                : "变化方向和预测不同，这正是值得观察的地方"}
                          </b>
                          {record.comparison.baseline_value !== null && (
                            <p>
                              默认对照{" "}
                              {record.comparison.baseline_value.toLocaleString()}{" "}
                              · 差额 {record.comparison.delta.toLocaleString()}
                            </p>
                          )}
                          <small>{record.comparison.note}</small>
                        </div>
                      )}
                      <details>
                        <summary>为什么，以及模型没有包括什么</summary>
                        <p>{r.data.educational_notes?.why}</p>
                        <p>{r.data.educational_notes?.not_means}</p>
                      </details>
                      <ContextAI
                        compact
                        context={{
                          source_type: "lab",
                          source_id: id,
                          inputs: record.inputs || inputs,
                        }}
                        title={r.data.title}
                        actions={["result", "changed", "limits"]}
                      />
                    </>
                  ) : (
                    <div className="experiment-empty">
                      <Fin size={54} mood="thinking" />
                      <h2>给你的想法一个可观察的结果。</h2>
                      <p>调整左侧一个参数，然后运行模型。</p>
                    </div>
                  )}
                </section>
              </div>
              {record.result && (
                <section className="reflection-sheet">
                  <span className="eyebrow">LEAVE A THOUGHT, NOT A SCORE</span>
                  <h2>这一次，你看清了什么？</h2>
                  {record.completed_at ? (
                    <>
                      <p>{record.reflection}</p>
                      <span className="tag">已保存到 Notebook</span>
                      <Link to="/profile?tab=notebook" className="text-link">
                        查看自己的反思 →
                      </Link>
                      <button
                        className="text-link"
                        onClick={() => {
                          setRecord(null);
                          setReason("");
                          setReflection("");
                          setInputs(initial);
                        }}
                      >
                        开始一次新的预测
                      </button>
                    </>
                  ) : (
                    <>
                      <label>
                        结果与预测哪里相同或不同？哪个假设最重要？
                        <textarea
                          value={reflection}
                          maxLength={3000}
                          onChange={(e) => setReflection(e.target.value)}
                          placeholder="用自己的话，写下一个从实验中带走的理解。"
                        />
                      </label>
                      <button
                        disabled={
                          busy || changed || reflection.trim().length < 8
                        }
                        onClick={save}
                      >
                        保存这次反思
                      </button>
                    </>
                  )}
                </section>
              )}
            </>
          )}
          <RouteReturn />
        </div>
      )}
    </State>
  );
}
