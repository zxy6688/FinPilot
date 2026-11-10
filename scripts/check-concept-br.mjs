import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = "http://127.0.0.1:5176",
  out = "docs/concept-br/";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const context = await browser.newContext(),
  page = await context.newPage(),
  errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
const pass = (s) => {
  results.push(s);
  console.log("PASS", s);
};
async function shot(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out + name + ".png", fullPage: true });
}
async function ready() {
  await expect(
    page.getByRole("button", { name: "保存笔记与互动", exact: true }),
  ).toBeEnabled();
}
try {
  assert.equal((await context.request.get(base + "/api/health")).status(), 200);
  await page.goto(base + "/concept-studio");
  await expect(page.locator(".cs-card")).toHaveCount(8);
  for (const width of [1440, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "directory overflow " + width,
    );
    await shot("catalog-" + width);
  }
  await page
    .getByRole("button", { name: "查看全部 36 个概念", exact: true })
    .click();
  await expect(page.locator(".cs-card")).toHaveCount(36);
  const urls = await page
    .locator(".cs-card")
    .evaluateAll((es) => es.map((e) => e.getAttribute("href")));
  assert.equal(new Set(urls.map((u) => u.split("?")[0])).size, 36);
  await page.getByLabel("搜索概念", { exact: true }).fill("ETF");
  await expect(
    page
      .locator(".cs-card")
      .filter({ has: page.getByRole("heading", { name: "ETF", exact: true }) }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "投资产品", exact: true }).click();
  await page.getByRole("button", { name: "课程路线", exact: true }).click();
  await expect(page.locator(".cs-paths article")).toHaveCount(5);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "课程路线", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await shot("courses-390");
  await page.getByRole("button", { name: "知识索引", exact: true }).click();
  await expect(page.getByLabel("搜索概念", { exact: true })).toHaveValue("ETF");
  await expect(
    page.getByRole("button", { name: "投资产品", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("搜索概念", { exact: true }).fill("不存在的火星概念");
  await expect(page.locator(".cs-empty")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选", exact: true }).click();
  await expect(page.locator(".cs-card")).toHaveCount(8);
  pass(
    "8 default / 36 full; six domains, search, empty, clear, URL refresh and mode persistence",
  );
  for (const url of urls) {
    await page.goto(base + url);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByText("没有这个概念", { exact: true })).toHaveCount(
      0,
    );
  }
  const paths = await (
    await context.request.get(base + "/api/learning-paths")
  ).json();
  assert.equal(paths.length, 5);
  assert.equal(
    new Set(paths.flatMap((p) => p.lessons.map((l) => l.id))).size,
    28,
  );
  for (const p of paths) {
    await page.goto(base + "/learn/" + p.id);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  pass(
    "36 actual concept routes and five actual learning routes; 28 lessons reachable",
  );
  await page.goto(base + "/concept-studio/7");
  await ready();
  for (const width of [1440, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "ETF overflow " + width,
    );
    await shot("etf-" + width);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  const names = ["指数 ETF", "主动 ETF", "场外指数基金", "场外主动基金"];
  for (const name of names) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".cs-matrix-result h3")).toContainText(name);
  }
  await page.getByRole("button", { name: "指数 ETF", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "指数 ETF", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "主动 ETF", exact: true }).click();
  await page
    .getByRole("button", { name: "A · 名称是否热门", exact: true })
    .click();
  await expect(page.locator(".cs-feedback").first()).toContainText(
    "名称热门不能说明",
  );
  await page
    .getByRole("button", { name: "C · 今天涨幅排名", exact: true })
    .click();
  await expect(page.locator(".cs-feedback").first()).toContainText(
    "一天的涨幅排名",
  );
  await page
    .getByRole("button", { name: "B · 跟踪标的与产品文件", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "B · 只要在交易所交易，就一定跟踪指数",
      exact: true,
    })
    .click();
  await expect(page.locator(".cs-feedback").last()).toContainText(
    "交易场所不决定策略",
  );
  await page
    .getByRole("button", {
      name: "C · 只要主动管理，就不能在交易所交易",
      exact: true,
    })
    .click();
  await expect(page.locator(".cs-feedback").last()).toContainText("并不冲突");
  await page
    .getByRole("button", {
      name: "A · 可以是主动 ETF，不必是指数基金",
      exact: true,
    })
    .click();
  await page
    .getByLabel("用自己的话记录一个区别或仍需核对的问题")
    .fill("访客测试：形式与策略分开判断。");
  await expect(page.getByText(/有未保存修改/)).toBeVisible();
  await page
    .getByRole("button", { name: "保存笔记与互动", exact: true })
    .click();
  await expect(page.getByText(/笔记与互动状态已保存/)).toBeVisible();
  const saved = await page
    .getByRole("link", { name: "重新打开保存记录", exact: true })
    .getAttribute("href");
  await shot("etf-interaction-390");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot("etf-interaction-1440");
  await page.goto(base + saved);
  await expect(
    page.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
  ).toHaveValue("访客测试：形式与策略分开判断。");
  await expect(
    page.getByRole("button", { name: "主动 ETF", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "B · 跟踪标的与产品文件", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  pass(
    "four matrix cells, keyboard, distinct feedback for every option, guest notes/answer/case restoration",
  );
  await page.evaluate(() => {
    const key = "finpilot:redesign:gate-a:guest";
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    records.push({
      id: "legacy-etf-test",
      kind: "concept",
      title: "旧 ETF 卡",
      url: "/concept-studio?concept=legacy-etf-test",
      payload: {
        comparison: "etf-index-fund",
        choice: 2,
        case: 2,
        note: "旧笔记",
      },
      version: "gate-a",
      at: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(records));
  });
  for (const path of [
    "/concept-studio?concept=legacy-etf-test",
    "/concept-studio/etf-matrix?concept=legacy-etf-test",
  ]) {
    await page.goto(base + path);
    await expect(page).toHaveURL(/concept-studio\/7\?concept=/);
    await expect(
      page.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
    ).toHaveValue("旧笔记");
    await expect(
      page.getByRole("button", { name: "场外指数基金", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/旧分类题已恢复/)).toBeVisible();
  }
  await page.goto(base + "/concept-studio/7?entry=does-not-exist");
  await expect(page.getByText(/未找到这条记录/).first()).toBeVisible();
  pass(
    "legacy ?concept and etf-matrix restore old answer/case/note; missing record explained",
  );
  const email = "concept-review-" + Date.now() + "@example.com",
    password = "ConceptReview-test-2026";
  const registration = await context.request.post(base + "/api/auth/register", {
    data: { email, password, name: "Concept 审查测试" },
  });
  assert.equal(registration.status(), 201);
  const { token } = await registration.json();
  await page.evaluate(
    (token) => localStorage.setItem("finpilot_token", token),
    token,
  );
  await page.goto(base + "/concept-studio/7");
  await ready();
  await expect(
    page.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
  ).toHaveValue("");
  await page.getByRole("button", { name: "场外主动基金", exact: true }).click();
  await page
    .getByRole("button", { name: "B · 跟踪标的与产品文件", exact: true })
    .click();
  await page
    .getByLabel("用自己的话记录一个区别或仍需核对的问题")
    .fill("账户测试：保存后重新登录恢复。");
  await page.route("**/api/v3/artifacts", async (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "测试保存失败" }),
        })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "保存笔记与互动", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "保存未完成" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
  ).toHaveValue("账户测试：保存后重新登录恢复。");
  await shot("save-failure");
  await page.unroute("**/api/v3/artifacts");
  await page
    .getByRole("button", { name: "保存笔记与互动", exact: true })
    .click();
  await expect(page.getByText(/笔记与互动状态已保存/)).toBeVisible();
  const accountUrl = await page
    .getByRole("link", { name: "重新打开保存记录", exact: true })
    .getAttribute("href");
  await page
    .getByRole("button", { name: "提交原题作答到复习", exact: true })
    .click();
  await expect(
    page.getByText("本次原题作答已记录，可在复习系统查看。"),
  ).toBeVisible();
  const accountContext = await browser.newContext(),
    fresh = await accountContext.newPage();
  const login = await accountContext.request.post(base + "/api/auth/login", {
    data: { email, password },
  });
  assert.equal(login.status(), 200);
  const token2 = (await login.json()).token;
  await fresh.goto(base);
  await fresh.evaluate(
    (t) => localStorage.setItem("finpilot_token", t),
    token2,
  );
  await fresh.goto(base + accountUrl);
  await expect(
    fresh.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
  ).toHaveValue("账户测试：保存后重新登录恢复。");
  await expect(
    fresh.getByRole("button", { name: "场外主动基金", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await fresh.screenshot({
    path: out + "account-restored.png",
    fullPage: true,
  });
  await accountContext.close();
  await page.evaluate(() => localStorage.removeItem("finpilot_token"));
  await page.goto(base + accountUrl);
  await expect(page.getByText(/未找到这条记录/).first()).toBeVisible();
  await expect(
    page.getByLabel("用自己的话记录一个区别或仍需核对的问题"),
  ).toHaveValue("");
  pass(
    "real account save, 503 draft retention/retry, fresh login restore, formal quiz13 submission and guest isolation",
  );
  assert.deepEqual(errors, []);
  pass("no uncaught browser errors");
  await fs.writeFile(
    out + "browser-results.json",
    JSON.stringify(
      { at: new Date().toISOString(), base, results, errors },
      null,
      2,
    ),
  );
} catch (e) {
  console.error("FAILED AT", page.url());
  await page.screenshot({ path: out + "failure.png", fullPage: true });
  throw e;
} finally {
  await browser.close();
}
