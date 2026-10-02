import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
const base = process.env.FINPILOT_BROWSER_URL || "http://127.0.0.1:5174";
const out = "docs/screenshots/v2";
await mkdir(out, { recursive: true });
const quizzes = JSON.parse(await readFile("content/quizzes.json", "utf8"));
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: "zh-CN",
  reducedMotion: "reduce",
});
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
async function go(path) {
  await page.goto(base + path);
  await page.waitForLoadState("networkidle");
}
async function shot(name) {
  if (!["desktop-contextual-ai", "mobile-ai-v2"].includes(name)) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.screenshot({
    path: `${out}/${name}.png`,
    fullPage: !["desktop-contextual-ai", "mobile-ai-v2"].includes(name),
  });
}
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS", name);
}
async function ai(button, expected) {
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".context-answer")).toContainText(expected);
  await expect(page.locator(".context-source")).toContainText("Demo AI");
}
try {
  await check(
    "demo home: continuation, review, graph reasons, material and lab",
    async () => {
      await go("/login");
      await page
        .getByRole("button", { name: "填入体验账户", exact: true })
        .click();
      await page.getByRole("button", { name: "登录", exact: true }).click();
      await expect(page).toHaveURL(base + "/");
      await expect(page.locator(".workspace-continue")).toContainText("债券");
      await expect(page.locator(".review-panel")).toContainText("错题");
      expect(await page.locator(".next-topic").count()).toBeGreaterThan(0);
      expect(await page.locator(".relevant-item").count()).toBeGreaterThan(0);
      await expect(page.locator(".scenario-teaser")).toContainText("利率");
      await shot("desktop-home-v2");
    },
  );
  await check(
    "understanding evidence: domains, topic states and details",
    async () => {
      await go("/profile");
      await expect(page.locator(".domain-card")).toHaveCount(5);
      await expect(page.locator(".evidence-card")).toHaveCount(24);
      await page
        .locator(".evidence-card")
        .filter({ hasText: "利率" })
        .locator("summary")
        .click();
      await expect(
        page.locator(".evidence-detail").filter({ visible: true }).first(),
      ).toContainText("可用权重");
      await shot("desktop-understanding-map");
      await page.locator(".domain-card").first().click();
      expect(await page.locator(".evidence-card").count()).toBeLessThan(24);
    },
  );
  await check(
    "route from Topic: known, next, target and real edge",
    async () => {
      await go("/topics/6");
      await page
        .getByRole("link", { name: "Build route to this topic" })
        .click();
      await expect(page.locator(".route-steps")).toContainText("Known");
      await expect(page.locator(".route-steps")).toContainText("Next");
      await expect(page.locator(".route-steps")).toContainText("Target");
      await expect(page.locator(".route-connection")).toContainText(
        "通过折现影响固定现金流价格",
      );
      await shot("desktop-learning-route");
      await ai(
        page.getByRole("button", { name: "简单解释", exact: true }),
        "理解这条路线",
      );
      await page.keyboard.press("Escape");
    },
  );
  await check(
    "lesson contextual actions, selected section, follow-up and focus return",
    async () => {
      await go("/lessons/9");
      const trigger = page
        .getByRole("button", { name: "简单解释", exact: true })
        .first();
      await ai(trigger, "当前阅读片段");
      await shot("desktop-contextual-ai");
      await page
        .getByLabel("继续围绕当前内容提问")
        .fill("请再讲一个条件变化的例子");
      await page.getByRole("button", { name: "发送追问" }).click();
      await expect(page.getByLabel("继续围绕当前内容提问")).toHaveValue("");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await ai(
        page.getByRole("button", { name: "考考我", exact: true }).first(),
        "检查一下理解",
      );
      await page.keyboard.press("Escape");
    },
  );
  await check("relation keyboard and contextual why", async () => {
    await go("/topics/9");
    await page.locator(".relation-edge").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".relation-detail")).toBeVisible();
    await shot("desktop-topic-v2");
    await ai(
      page.getByRole("button", { name: "为什么相连", exact: true }),
      "为什么相连",
    );
    await page.keyboard.press("Escape");
  });
  await check(
    "Discover personalized reasons, filters and contextual material",
    async () => {
      await go("/discover");
      expect(await page.locator(".personal-material").count()).toBeGreaterThan(
        0,
      );
      await shot("desktop-discover-v2");
      await page.getByRole("button", { name: "真实资料", exact: true }).click();
      await expect(page.locator(".article-card")).toHaveCount(12);
      await ai(
        page
          .locator(".article-card")
          .first()
          .getByRole("button", { name: "连接我的学习", exact: true }),
        "与您的学习".replace("您", "你"),
      );
      await page.keyboard.press("Escape");
    },
  );
  await check(
    "all eight scenarios and preserved labs; recomputed explanation",
    async () => {
      for (let id = 1; id <= 8; id++) {
        await go("/lab/" + id);
        await expect(page.locator(".scenario-intro")).toBeVisible();
        await expect(page.locator(".scenario-reflection")).toBeVisible();
      }
      await go("/lab/5");
      await page
        .getByRole("slider", { name: "市场年收益率", exact: true })
        .fill("7");
      await expect(page.locator(".scenario-reflection")).toBeVisible();
      await ai(
        page.getByRole("button", { name: "解释实验结果", exact: true }),
        "rate：5 → 7",
      );
      await page.keyboard.press("Escape");
      await shot("desktop-scenario-lab");
    },
  );
  await check(
    "saved contextual session retains lab parameters in Copilot",
    async () => {
      await go("/copilot");
      await page.locator(".session-link").first().click();
      await expect(
        page.locator(".notice").filter({ hasText: "Context" }),
      ).toContainText("lab");
      await page
        .getByLabel("你的问题", { exact: true })
        .fill("继续解释这个条件");
      await page.getByRole("button", { name: "发送", exact: true }).click();
      await expect(page.getByLabel("你的问题", { exact: true })).toHaveValue(
        "",
      );
      await expect(page.locator(".message").last()).toContainText(
        "rate：5 → 7",
      );
    },
  );
  await check("search routes and topic-linked discussion", async () => {
    await go("/search?q=bonds");
    await expect(
      page.getByRole("link", { name: /建立学习路线：债券/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "全站搜索" }).click();
    await page.getByRole("combobox").fill("ETF");
    await expect(page.getByRole("option").first()).toContainText("学习路线");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/learn\/routes\//);
    await go("/fintalk/1");
    await expect(
      page.getByRole("link", { name: /Related Topics/ }),
    ).toBeVisible();
  });
  await check(
    "new-user UI journey updates home and understanding; no demo leakage",
    async () => {
      const fresh = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const p = await fresh.newPage();
      await p.goto(base + "/login");
      await p.getByRole("button", { name: "第一次来？注册账户" }).click();
      await p.getByLabel("昵称", { exact: true }).fill("新的学习者");
      await p
        .getByLabel("邮箱", { exact: true })
        .fill("v2-" + Date.now() + "@example.com");
      await p.getByLabel("密码", { exact: true }).fill("learn123456");
      await p.getByRole("button", { name: "创建账户", exact: true }).click();
      await expect(p.locator(".onboarding")).toContainText(
        "还没有你的学习证据",
      );
      await p.goto(base + "/profile");
      await expect(
        p.getByText("还没有学习证据 · No learning evidence yet"),
      ).toBeVisible();
      await p.goto(base + "/lessons/1");
      await expect(p.locator(".quiz-card")).toHaveCount(
        quizzes.filter((q) => q.lesson_id === 1).length,
      );
      const first = quizzes.find((q) => q.lesson_id === 1);
      await p
        .locator(".quiz-card")
        .first()
        .locator(".quiz-options button")
        .nth((first.correct_answer + 1) % first.options.length)
        .click();
      await p.goto(base + "/");
      await expect(p.locator(".review-panel")).toContainText("错题");
      await p.goto(base + "/lessons/1");
      const qs = quizzes.filter((q) => q.lesson_id === 1);
      for (let i = 0; i < qs.length; i++)
        await p
          .locator(".quiz-card")
          .nth(i)
          .locator(".quiz-options button")
          .nth(qs[i].correct_answer)
          .click();
      await p
        .getByRole("button", { name: "完成本课，记录成长", exact: true })
        .click();
      await p.goto(base + "/profile");
      await expect(p.locator(".stats-grid")).toContainText("1");
      await expect(p.locator(".evidence-card").first()).not.toContainText(
        "Learning Evidence 0%",
      );
      await fresh.close();
    },
  );
  await check(
    "375 / 390 / 430 / 768 responsive workspace, route, map and dialogs",
    async () => {
      for (const width of [375, 390, 430, 768]) {
        await page.setViewportSize({ width, height: 844 });
        for (const path of [
          "/",
          "/learn/routes/6",
          "/profile",
          "/discover",
          "/topics/9",
          "/lessons/9",
          "/lab/5",
        ]) {
          await go(path);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            width + " " + path,
          ).toBe(true);
        }
        await go("/topics/9");
        await page.locator(".mobile-relation button").first().click();
        await ai(
          page.getByRole("button", { name: "为什么相连", exact: true }),
          "为什么相连",
        );
        expect(
          await page.evaluate(() => {
            const d = document.querySelector("dialog");
            return d.getBoundingClientRect().width <= innerWidth;
          }),
        ).toBe(true);
        await page.keyboard.press("Escape");
        console.log("MOBILE", width);
      }
    },
  );
  await check("mobile final screenshots and context", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go("/");
    await shot("mobile-home-v2");
    await go("/learn/routes/6");
    await shot("mobile-learning-route-v2");
    await go("/profile");
    await shot("mobile-understanding-map");
    await go("/lessons/9");
    await ai(
      page.getByRole("button", { name: "简单解释", exact: true }).first(),
      "当前阅读片段",
    );
    await shot("mobile-ai-v2");
    await page.keyboard.press("Escape");
  });
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v2-browser-check.json",
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        errors,
        viewports: [1440, 375, 390, 430, 768],
        date: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log("V2 BROWSER PASSED", checks.length);
} finally {
  await browser.close();
}
