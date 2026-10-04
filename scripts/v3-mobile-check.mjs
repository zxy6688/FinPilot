import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, writeFile } from "node:fs/promises";
const questions = JSON.parse(await readFile("content/quizzes.json", "utf8"));
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  locale: "zh-CN",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:5176",
  api = "http://127.0.0.1:8004/api";
try {
  const r = await page.request.post(api + "/auth/register", {
    data: {
      email: "mobile" + Date.now() + "@example.com",
      name: "手机学习者",
      password: "ReviewPass123",
    },
  });
  const token = (await r.json()).token,
    headers = { Authorization: "Bearer " + token };
  await page.goto(base);
  await page.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  await page.goto(base + "/articles/2");
  await expect(page.locator(".reader-body")).toBeVisible();
  await page.locator(".term-trigger").first().click();
  await expect(page.locator(".term-popover")).toBeVisible();
  await page.getByRole("button", { name: "关闭释义", exact: true }).click();
  await page.getByRole("button", { name: "我已读完", exact: true }).click();
  await expect(page.getByText("已记录读完", { exact: true })).toBeVisible();
  await page.goto(base + "/compare/etf-index-fund");
  await page.locator(".compare-check .review-options button").nth(2).click();
  await expect(page.locator(".compare-check")).toContainText("分清了这条边界");
  await page.goto(base + "/review?kind=capsule");
  await expect(page.locator(".review-question")).toBeVisible();
  let id = new URL(page.url()).searchParams.get("id");
  let s = await (
    await page.request.get(api + "/v3/review/" + id, { headers })
  ).json();
  while (!s.completed_at) {
    if (
      await page
        .getByRole("button", { name: "我想过了，展开选项", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "我想过了，展开选项", exact: true })
        .click();
    const item = s.item;
    const answer = item.key.startsWith("q:")
      ? questions.find((q) => q.id === Number(item.key.slice(2))).correct_answer
      : {
          "nominal-real": 1,
          "apr-apy": 1,
          "volatility-risk": 1,
          "etf-index-fund": 2,
        }[item.key.slice(2)];
    await page.locator(".review-options button").nth(answer).click();
    await expect(page.locator(".review-question")).toContainText(
      "这一次，想清楚了",
    );
    s = await (
      await page.request.get(api + "/v3/review/" + id, { headers })
    ).json();
    await page
      .getByRole("button", {
        name: s.completed_at ? "收好这次理解" : /继续下一题/,
      })
      .click();
  }
  await expect(page.locator(".review-question")).toContainText(
    "今天的理解，留下来了",
  );
  await page.reload();
  await expect(page.locator(".review-question")).toContainText(
    "今天的理解，留下来了",
  );
  await page.goto(base + "/learn/routes/7");
  await expect(page.locator(".route-timeline")).toBeVisible();
  const saved = new URL(page.url()).searchParams.get("saved");
  await page.reload();
  await expect(page).toHaveURL(new RegExp("saved=" + saved));
  await expect(page.locator(".route-current")).toBeVisible();
  await page.goto(base + "/lab/8");
  await page
    .locator(".prediction-sheet textarea")
    .fill("我想先暂停，区分原来的损失与新的信息。");
  await page.getByRole("button", { name: /保存预测，进入实验/ }).click();
  await page.getByRole("button", { name: "运行这个假设", exact: true }).click();
  await expect(page.locator(".experiment-result")).toContainText("发生了什么");
  await page
    .locator(".reflection-sheet textarea")
    .fill("同样的涨跌幅不能相抵，先核查条件比急着回本更有帮助。");
  await page.getByRole("button", { name: "保存这次反思", exact: true }).click();
  await expect(page.getByText("已保存到 Notebook")).toBeVisible();
  await page.getByRole("link", { name: /查看自己的反思/ }).click();
  await expect(page.locator(".notebook")).toContainText("同样的涨跌幅不能相抵");
  await page.goto(base + "/articles/101");
  await page
    .locator(".reader-context")
    .getByRole("button", { name: "简单解释", exact: true })
    .click();
  await expect(page.locator("dialog .context-answer")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /打开完整 AI Copilot/ }).click();
  await expect(page).toHaveURL(/session=/);
  await expect(page.locator(".messages")).toContainText("美联储2025年9月决议");
  await page.goto(base + "/profile");
  await expect(page.locator(".world-capsule")).toContainText("今天已完成");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v3-mobile-check.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        viewport: 390,
        checks: [
          "Article glossary and completion",
          "Compare check",
          "Daily Capsule answers and reload completion",
          "Route save and reload",
          "Behavioral prediction and reflection",
          "Notebook real record",
          "Context AI to same mobile Copilot session",
          "Completed capsule does not prompt again",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("V3 mobile flow passed");
} finally {
  await browser.close();
}
