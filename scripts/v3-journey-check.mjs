import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, writeFile } from "node:fs/promises";
const questions = JSON.parse(await readFile("content/quizzes.json", "utf8"));
const lessons = JSON.parse(await readFile("content/lessons.json", "utf8"));
const comparisons = {
  "nominal-real": 1,
  "apr-apy": 1,
  "volatility-risk": 1,
  "etf-index-fund": 2,
};
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  locale: "zh-CN",
});
const errors = [],
  checks = [],
  base = "http://127.0.0.1:5176",
  server = "http://127.0.0.1:8004/api";
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
let headers = {};
async function get(path) {
  const r = await page.request.get(server + path, { headers });
  expect(r.ok(), path + ": " + (await r.text())).toBe(true);
  return r.json();
}
async function post(path, data = {}) {
  const r = await page.request.post(server + path, { headers, data });
  expect(r.ok(), path + ": " + (await r.text())).toBe(true);
  return r.json();
}
async function shot(name, mobile = false) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `docs/screenshots/v3/${name}.png`,
    fullPage: true,
  });
  if (mobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      name,
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/v3/${name}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
}
async function dismissMoment() {
  const close = page.getByRole("button", { name: "关闭这条记忆", exact: true });
  if (await close.isVisible()) await close.click();
}
try {
  await page.goto(base);
  await expect(page.locator(".star")).toHaveCount(7);
  await shot("home-new", true);
  await page.goto(base + "/login");
  // Register through the real API; every learning interaction below uses the real UI/API.
  const reg = await post("/auth/register", {
    email: `v3journey${Date.now()}@example.com`,
    name: "一位学习者",
    password: "ReviewPass123",
  });
  headers = { Authorization: "Bearer " + reg.token };
  await page.evaluate(
    (t) => localStorage.setItem("finpilot_token", t),
    reg.token,
  );
  await page.goto(base + "/lessons/1");
  await expect(page.locator(".quiz-card")).toHaveCount(2);
  for (const [qindex, q] of questions
    .filter((q) => q.lesson_id === 1)
    .entries()) {
    const card = page.locator(".quiz-card").nth(qindex);
    await card.locator(".quiz-options button").nth(q.correct_answer).click();
    await expect(card.locator(".feedback")).toContainText("回答正确");
  }
  await page
    .getByRole("button", { name: "完成本课，记录成长", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "✓ 本课已完成", exact: true }),
  ).toBeVisible();
  await page.goto(base);
  await expect(
    page.locator(".star-building,.star-established").first(),
  ).toBeVisible();
  expect((await get("/v3/home")).world.companion.companion_form).toBe(
    "awakened",
  );
  checks.push("New user completes lesson; actual node lights and Fin awakens");
  await dismissMoment();
  await shot("home-return", true);
  await page.goto(base + "/articles/1");
  await expect(page.locator(".reader-body")).toBeVisible();
  await page.evaluate(() => scrollTo(0, 550));
  await expect
    .poll(async () => {
      const s = await get("/v3/reading/article/1");
      return s?.position || 0;
    })
    .toBeGreaterThan(0.05);
  const before = await page.evaluate(() => scrollY);
  await page.reload();
  await expect(
    page.getByText("已回到上次阅读位置", { exact: true }),
  ).toBeVisible();
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(
    100,
  );
  checks.push("Article scroll position survives reload");
  await page.locator(".term-trigger").first().click();
  await expect(page.locator(".term-popover")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".term-popover")).toHaveCount(0);
  checks.push("Glossary opens and closes by Escape");
  await shot("article", true);
  await page.getByRole("button", { name: "我已读完", exact: true }).click();
  await expect(page.getByText("已记录读完", { exact: true })).toBeVisible();
  await page.goto(base + "/lessons/2");
  const wrong = page.locator(".quiz-card").first();
  for (let i = 0; i < 2; i++) {
    await wrong.locator(".quiz-options button").first().click();
    await expect(wrong.locator(".feedback")).toBeVisible();
    await expect(wrong.locator(".quiz-options button").first()).toBeEnabled();
  }
  await expect(
    wrong.getByRole("link", { name: /Don’t mix these up/ }),
  ).toBeVisible();
  await wrong.getByRole("link", { name: /Don’t mix these up/ }).click();
  await expect(page.locator(".compare-sides")).toBeVisible();
  await shot("compare");
  await page.locator(".compare-check .review-options button").nth(1).click();
  await expect(page.locator(".compare-check")).toContainText("分清了这条边界");
  expect(
    (await get("/v3/memory")).misconceptions.find(
      (m) => m.tag === "nominal-real",
    ).status,
  ).toBe("addressed");
  checks.push(
    "Repeated misconception offers Compare; successful check records addressed",
  );
  await page.goto(base + "/review");
  await expect(page.locator(".review-question")).toBeVisible();
  await shot("review", true);
  let session = await get(
    "/v3/review/" + new URL(page.url()).searchParams.get("id"),
  );
  while (!session.completed_at) {
    if (
      await page
        .getByRole("button", { name: "我想过了，展开选项", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "我想过了，展开选项", exact: true })
        .click();
    const item = session.item;
    const answer = item.key.startsWith("q:")
      ? questions.find((q) => q.id === Number(item.key.slice(2))).correct_answer
      : comparisons[item.key.slice(2)];
    await page.locator(".review-options button").nth(answer).click();
    await expect(page.locator(".review-question")).toContainText(
      "这一次，想清楚了",
    );
    session = await get("/v3/review/" + session.id);
    await page
      .getByRole("button", {
        name: session.completed_at ? "收好这次理解" : /继续下一题/,
      })
      .click();
  }
  await expect(page.locator(".review-question")).toContainText(
    "今天的理解，留下来了",
  );
  expect(
    (await get("/v3/memory")).misconceptions.find(
      (m) => m.tag === "nominal-real",
    ).status,
  ).toBe("resolved");
  checks.push(
    "Short focused review completes; later correct recall resolves misconception",
  );
  await page.goto(base + "/learn/routes/2");
  await expect(page.locator(".route-timeline")).toBeVisible();
  let rid = Number(new URL(page.url()).searchParams.get("saved"));
  await page.reload();
  await expect(page.locator(".route-current")).toBeVisible();
  await shot("route", true);
  let route = await get("/v3/routes/" + rid);
  while (route.status !== "completed") {
    const s = route.route_snapshot.steps[route.current_step];
    if (s.options) {
      const choice =
        s.kind === "Connect"
          ? 0
          : questions.find((q) => q.id === s.question_id).correct_answer;
      await page
        .locator(".route-current .review-options button")
        .nth(choice)
        .click();
      await expect
        .poll(async () => (await get("/v3/routes/" + rid)).current_step)
        .toBeGreaterThan(route.current_step);
    } else {
      await page
        .getByRole("link", { name: "开始这一步", exact: false })
        .click();
      if (s.kind === "Read") {
        await expect(page.locator(".reader-body")).toBeVisible();
        await page
          .getByRole("button", { name: "我已读完", exact: true })
          .click();
        await expect(
          page.getByText("已记录读完", { exact: true }),
        ).toBeVisible();
      } else if (s.kind === "Compare") {
        await page
          .locator(".compare-check .review-options button")
          .nth(comparisons[s.compare_id])
          .click();
        await expect(page.locator(".compare-check")).toContainText(
          "分清了这条边界",
        );
      } else if (s.kind === "Experiment") {
        await expect(page.locator(".prediction-sheet")).toBeVisible();
        await page
          .locator(".prediction-sheet textarea")
          .fill("通胀提高可能让同样金额的购买力更低。");
        await page.getByRole("button", { name: "更低", exact: true }).click();
        await page
          .getByRole("button", { name: "保存预测，进入实验", exact: false })
          .click();
        await expect(page.locator(".experiment-controls")).toBeVisible();
        await page
          .getByRole("slider", { name: "通胀率", exact: true })
          .fill("8");
        await page
          .getByRole("button", { name: "运行这个假设", exact: true })
          .click();
        await expect(page.locator(".model-value")).toBeVisible();
        await page
          .locator(".reflection-sheet textarea")
          .fill(
            "当通胀假设提高，同样名义金额能换到的东西减少。模型使用固定通胀，不是现实预测。",
          );
        await page
          .getByRole("button", { name: "保存这次反思", exact: true })
          .click();
        await expect(page.getByText("已保存到 Notebook")).toBeVisible();
      }
      await page.locator(".route-return a").click();
      await expect(page.locator(".route-current")).toBeVisible();
    }
    route = await get("/v3/routes/" + rid);
  }
  await expect(page.locator(".route-current")).toContainText(
    "你走通了这条路线",
  );
  await shot("route-complete");
  checks.push(
    "Saved route completes through actual recall/read/connect/compare/experiment/check records",
  );
  // Build both endpoints through supported learning APIs, not database inserts or score overrides.
  for (const lesson of lessons.filter((l) =>
    (l.topic_ids || [l.topic_id]).some((t) => [1, 2].includes(t)),
  )) {
    for (const q of questions.filter((q) => q.lesson_id === lesson.id))
      await post("/quizzes/" + q.id + "/answer", { answer: q.correct_answer });
    await post("/progress/" + lesson.id);
  }
  await page.goto(base + "/profile?tab=knowledge");
  await expect(page.locator(".constellation-full .star")).toHaveCount(24);
  expect((await get("/v3/world")).summary.connections).toBeGreaterThan(0);
  await expect(
    page.locator(".constellation-line.unlocked").first(),
  ).toBeVisible();
  await dismissMoment();
  await shot("constellation");
  await page.locator(".star").first().click();
  await expect(page.getByLabel("主题速览", { exact: true })).toBeVisible();
  await shot("topic-detail");
  await page.keyboard.press("Escape");
  checks.push(
    "Two learned endpoints unlock a real relation; accessible in-place topic details",
  );
  await page.goto(base + "/profile");
  await expect(page.locator(".world-overview")).toBeVisible();
  await dismissMoment();
  await shot("my-world", true);
  await page.getByRole("button", { name: "Notebook", exact: true }).click();
  await expect(page.locator(".notebook")).toContainText("通胀假设提高");
  await shot("notebook");
  await page.goto(base + "/profile?tab=memories");
  await expect(page.locator(".moment-memories")).toContainText("两点之间");
  await dismissMoment();
  await shot("fin-corner");
  await page.goto(base + "/articles/101");
  await expect(page.locator(".reader-heading")).toBeVisible();
  await expect(page.locator(".reader-context")).toContainText("概念");
  await shot("real-world");
  checks.push("Real-world reader connects known and missing concepts");
  for (const route of [
    "/discover",
    "/learn",
    "/knowledge",
    "/fintalk",
    "/search?q=ETF",
    "/copilot",
    "/lab",
  ]) {
    await page.goto(base + route);
    await expect(page.locator("h1").first()).toBeVisible();
    await shot(route.split("?")[0].slice(1));
    for (const width of [375, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route + " width " + width,
      ).toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  checks.push(
    "Discover, Learn, Explore, FinTalk, Search, Copilot and Lab fit 375/390/430/768",
  );
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v3-journey-check.json",
    JSON.stringify(
      { checked_at: new Date().toISOString(), checks, errors },
      null,
      2,
    ),
  );
  console.log("V3 full journey passed: " + checks.length + " checks");
} finally {
  await browser.close();
}
