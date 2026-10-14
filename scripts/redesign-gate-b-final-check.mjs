import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage(),
  checks = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = async (p) => {
  await p.waitForTimeout(500);
  for (const selector of [".gb-results", ".rd-output-panel"])
    if (await p.locator(selector).count())
      await p.locator(selector + "[aria-busy=false]").waitFor();
};
try {
  const login = await context.request.post(base + "/api/auth/login", {
    data: { email: "demo@finpilot.app", password: "demo123456" },
  });
  assert.equal(login.status(), 200);
  const token = (await login.json()).token;
  await context.addInitScript(
    (t) => localStorage.setItem("finpilot_token", t),
    token,
  );
  const cases = [
    ["savings", "每月再存", "713"],
    ["compound", "初始金额（元）", "12345"],
    ["inflation", "假设年通胀率（%）", "4.5"],
    ["loan", "每月另付费用（元）", "17"],
    ["budget", "可用收入（元）", "3123"],
  ];
  for (const [tool, label, value] of cases) {
    await page.goto(base + "/money-lab/" + tool);
    await ready(page);
    await page.getByLabel(label, { exact: true }).fill(value);
    await ready(page);
    if (tool !== "savings")
      await page.getByLabel("这次我发现").fill("完整恢复验证 " + tool);
    await page
      .getByRole("button", {
        name: tool === "savings" ? "保存 Money Receipt" : "保存实验",
        exact: true,
      })
      .click();
    await page
      .getByText(tool === "savings" ? "已收进发现手册" : "已保存这次实验", {
        exact: true,
      })
      .waitFor();
    const r = await context.request.get(base + "/api/v3/artifacts", {
      headers: { Authorization: "Bearer " + token },
    });
    const record = (await r.json()).find(
      (e) =>
        e.url.startsWith("/money-lab/" + tool + "?") &&
        (tool === "savings"
          ? e.payload.current.inputs.monthly === 713
          : e.payload.note === "完整恢复验证 " + tool),
    );
    assert.ok(record, tool);
    const fresh = await browser.newContext({
      viewport: { width: 390, height: 900 },
    });
    await fresh.addInitScript(
      (t) => localStorage.setItem("finpilot_token", t),
      token,
    );
    const p = await fresh.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + record.url);
    await p
      .getByText(/已恢复/)
      .first()
      .waitFor();
    await ready(p);
    assert.equal(
      await p.getByLabel(label, { exact: true }).inputValue(),
      value,
      tool + " restored input",
    );
    if (tool !== "savings")
      assert.equal(
        await p.getByLabel("这次我发现").inputValue(),
        "完整恢复验证 " + tool,
      );
    const actual = await p
      .locator(tool === "savings" ? ".rd-output-panel" : ".gb-results")
      .innerText();
    assert.ok(!actual.includes("NaN"));
    await p.screenshot({
      path: `${out}/final-${tool}-account-restored-390.png`,
      fullPage: true,
    });
    await fresh.close();
    checks.push(
      tool +
        ": actual UI save → new 390px browser → parameters and notes restored",
    );
  }
  for (const [slug, question, answer] of [
    ["budget", "修车后结余", "尚未超支，但储备目标还有 150 元缺口"],
    ["bonds", "看到政策降息", "市场收益率、原先预期及信用等条件是否变化"],
    ["etf", "两只产品都叫指数基金", "不够，还要核对指数、交易成本、跟踪和风险"],
  ]) {
    await page.goto(base + "/stories/" + slug);
    await ready(page);
    const quiz = page.locator(".gb-quiz").filter({ hasText: question });
    await quiz.getByRole("button", { name: answer, exact: true }).click();
    await page
      .getByLabel("我的理解", { exact: true })
      .fill("跨会话发现 " + slug);
    await page
      .getByRole("button", { name: "保存这条发现", exact: true })
      .click();
    await page.getByText("发现已保存", { exact: true }).waitFor();
    const r = await context.request.get(base + "/api/v3/artifacts", {
      headers: { Authorization: "Bearer " + token },
    });
    const record = (await r.json()).find(
      (e) => e.payload.note === "跨会话发现 " + slug,
    );
    assert.ok(record);
    const fresh = await browser.newContext();
    await fresh.addInitScript(
      (t) => localStorage.setItem("finpilot_token", t),
      token,
    );
    const p = await fresh.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + record.url);
    await p.waitForTimeout(1000);
    assert.equal(
      await p.getByLabel("我的理解", { exact: true }).inputValue(),
      "跨会话发现 " + slug,
    );
    assert.equal(
      await p
        .locator(".gb-quiz")
        .filter({ hasText: question })
        .getByRole("button", { name: answer, exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await fresh.close();
    checks.push(
      slug + ": story notes and specific quiz answer restored in fresh browser",
    );
  }
  await page.goto(base + "/money-lab/inflation");
  await ready(page);
  await page.getByRole("button", { name: "问 Fin", exact: true }).click();
  await page.getByLabel("你的追问").fill("为什么名义与实际金额不同");
  await page.getByRole("button", { name: "发送追问" }).click();
  await page.locator(".gb-chat-answer").waitFor();
  await page.getByRole("link", { name: "在完整 Copilot 继续" }).click();
  await page.getByText(/接着探索：通胀购买力/).waitFor();
  await page.getByRole("button", { name: "新的好问题" }).click();
  assert.equal(await page.getByText(/接着探索：通胀购买力/).count(), 0);
  checks.push("new Copilot conversation clears unrelated carried context");
  await page.goto(base + "/money-lab/compound?receipt=missing-review-id");
  await page
    .getByRole("alert")
    .filter({ hasText: "当前账户或浏览器中没有这条记录" })
    .waitFor();
  checks.push("missing receipt does not falsely claim restored parameters");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/final-checks.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await browser.close();
}
