import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { findExploration } from "../frontend/src/redesign/questionRouting.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const dir = "docs/redesign/gate-b/routing";
await mkdir(dir + "/screenshots", { recursive: true });
const cases = [
  ["存钱为什么不等于购买力不变？", "exact", "/decoder/purchasing-power"],
  ["  存钱，为什么不等于购买力不变?  ", "exact", "/decoder/purchasing-power"],
  ["ETF 和指数基金，是一回事吗？", "exact", "/concept-studio"],
  ["ｅｔｆ 和指数基金，是一回事吗？", "exact", "/concept-studio"],
  ["从一次降息，读懂债券", "exact", "/stories/bonds"],
  ["大学生的第一份预算", "exact", "/stories/budget"],
  ["一笔贷款，到底要还多少钱？", "exact", "/stories/loan"],
  ["", "empty", null],
  ["   ", "empty", null],
  ["明天适合出去旅行吗", "unknown", null],
  ["每月花500元喝咖啡", "unknown", null],
  ["我有3000元，存哪家银行最好", "unknown", null],
  ["明年通胀率是多少", "related", null],
  ["ETF怎么买，哪只最好", "related", null],
  ["ETF和指数基金是一回事吗？哪个适合我", "related", null],
  ["每月存1000元三年后有多少", "related", null],
  ["复利怎么算", "related", null],
  ["每月还款1000元", "related", null],
  ["存钱为什么等于购买力不变", "mixed", null],
  ["每月存钱还是买ETF", "mixed", null],
  ["通胀与指数基金", "mixed", null],
  ["通胀会影响我的储蓄吗", "mixed", null],
  ["存钱为什么不等于购买力不变？还有贷款月供呢", "mixed", null],
  ["降息后基金和债券都会涨吗", "mixed", null],
];
for (const [q, kind, destination] of cases) {
  const r = findExploration(q);
  assert.equal(r.kind, kind, q);
  assert.equal(r.destination, destination, q);
}
assert.deepEqual(
  findExploration("每月还款1000元").suggestions.map((s) => s.id),
  ["loan"],
);
const b = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await b.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  locale: "zh-CN",
});
const p = await context.newPage();
const errors = [],
  failed = [],
  checks = [],
  layouts = [];
let chatPosts = 0;
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
p.on("response", (r) => {
  if (r.status() >= 400) failed.push(r.status() + " " + r.url());
});
p.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/api/chat")
    chatPosts++;
});
const base = "http://127.0.0.1:5176";
async function home() {
  await p.goto(base);
  await p.waitForLoadState("networkidle");
}
async function shot(name) {
  await p.screenshot({ path: dir + "/screenshots/" + name + ".png" });
}
async function submit(q) {
  await p.getByLabel("寻找相关探索内容", { exact: true }).fill(q);
  await p.getByRole("button", { name: "找内容", exact: true }).click();
}
try {
  for (const width of [375, 390, 430, 768, 1440]) {
    await p.setViewportSize({
      width,
      height: width === 768 ? 1024 : width === 1440 ? 900 : 844,
    });
    await home();
    await expect(p.locator(".rd-hero h1")).toBeVisible();
    await expect(p.locator(".rd-hero-scene>img")).toBeVisible();
    const layout = await p.evaluate(() => {
      const h = document.querySelector(".rd-hero h1"),
        hero = document.querySelector(".rd-hero"),
        fin = document.querySelector(".rd-scene-fin-hit"),
        img = document.querySelector(".rd-hero-scene>img");
      const r = document.createRange();
      r.selectNodeContents(h);
      const rects = [...r.getClientRects()].filter(
        (r) => r.width > 0 && r.height > 0,
      );
      const right = Math.max(...rects.map((r) => r.right));
      const fr = fin.getBoundingClientRect();
      const hr = hero.getBoundingClientRect();
      return {
        width: innerWidth,
        fontSize: parseFloat(getComputedStyle(h).fontSize),
        titleRight: right,
        finHitLeft: fr.left,
        titleFinGap: fr.left - right,
        titleBottom: h.getBoundingClientRect().bottom,
        heroBottom: hr.bottom,
        imageLoaded: img.complete && img.naturalWidth === 1774,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        tasksBottom: document.querySelector(".rd-tasks").getBoundingClientRect()
          .bottom,
        bottomNavTop:
          innerWidth < 600
            ? document.querySelector(".rd-bottom-nav").getBoundingClientRect()
                .top
            : null,
      };
    });
    assert.equal(layout.overflow, false);
    assert.equal(layout.imageLoaded, true);
    assert.ok(layout.fontSize >= 29, "Do not shrink title");
    assert.ok(
      layout.titleFinGap >= 0,
      "Title encroaches Fin interactive area " + JSON.stringify(layout),
    );
    if (width < 600)
      assert.ok(
        layout.tasksBottom <= layout.bottomNavTop,
        "Bottom navigation covers tasks",
      );
    layouts.push(layout);
    await shot("home-" + width);
    await p.locator(".rd-scene-fin-hit").click();
    await expect(p.getByRole("dialog")).toBeVisible();
    await p.keyboard.press("Escape");
    await expect(p.getByRole("dialog")).toHaveCount(0);
  }
  checks.push(
    "375/390/430/768/1440: title stays >=29px, Fin visible and clickable, no horizontal overflow; phone tasks above bottom nav",
  );
  await p.setViewportSize({ width: 390, height: 844 });
  for (const [q, kind, destination] of cases) {
    await home();
    await submit(q);
    if (destination) {
      await p.waitForURL(base + destination);
      await expect(p.locator("h1").first()).toBeVisible();
    } else {
      await expect(p).toHaveURL(base + "/");
      if (kind === "empty")
        await expect(
          p.getByText("请先输入问题或专题名称，也可以选择下面的入口。"),
        ).toBeVisible();
      else
        await expect(
          p.getByRole("region", { name: "探索内容建议" }),
        ).toBeVisible();
    }
  }
  checks.push(
    "All 24 classifier cases exercised through real browser navigation; wrong keyword routes prevented",
  );
  await home();
  await submit("存钱为什么不等于购买力不变？");
  await p.waitForURL("**/decoder/purchasing-power");
  await p.waitForLoadState("networkidle");
  await shot("question-exact-match");
  await p.goBack();
  await expect(p.getByLabel("寻找相关探索内容", { exact: true })).toHaveValue(
    "存钱为什么不等于购买力不变？",
  );
  await submit("每月存1000元三年后有多少");
  await expect(p.locator(".a1-content-suggestions")).toContainText(
    "不会从问题自动提取参数",
  );
  await shot("question-related");
  await p.locator(".a1-suggestion-links a").click();
  await p.waitForURL("**/money-lab/savings");
  await expect(p.locator("h1")).toBeVisible();
  await p.goBack();
  await expect(p.getByLabel("寻找相关探索内容", { exact: true })).toHaveValue(
    "每月存1000元三年后有多少",
  );
  const mixed = "  每月存钱还是买ETF？  ";
  await submit(mixed);
  await expect(p.locator(".a1-content-suggestions")).toContainText(
    "涉及多个主题",
  );
  await shot("question-mixed");
  await p.reload();
  await expect(p.getByLabel("寻找相关探索内容", { exact: true })).toHaveValue(
    mixed,
  );
  await p.getByRole("button", { name: "找内容", exact: true }).click();
  await p.getByRole("link", { name: "带着原问题去问 Fin" }).click();
  await p.waitForURL("**/copilot?**");
  await expect(p.getByLabel("你的问题", { exact: true })).toHaveValue(mixed);
  await p.getByLabel("你的问题", { exact: true }).scrollIntoViewIfNeeded();
  await shot("question-preserved-in-copilot");
  assert.equal(chatPosts, 0, "Must not auto-send a question");
  checks.push(
    "Exact navigation/back, chosen suggestion/back, reload, and Copilot prefill preserve raw question including whitespace; no automatic chat POST",
  );
  await home();
  await submit("明天适合出去旅行吗");
  await expect(p.locator(".a1-content-suggestions")).toContainText("通用入口");
  await shot("question-unmatched");
  await submit("");
  await expect(p.locator(".a1-content-suggestions")).toHaveCount(0);
  await shot("question-empty");
  await p.reload();
  await expect(p.getByLabel("寻找相关探索内容", { exact: true })).toHaveValue(
    "",
  );
  await submit("每月还款1000元");
  await expect(p.locator(".a1-suggestion-links a")).toHaveCount(1);
  await expect(p.locator(".a1-suggestion-links a")).toHaveAttribute(
    "href",
    "/stories/loan",
  );
  await expect(p.locator(".a1-content-suggestions")).toContainText(
    "真实还款计算",
  );
  await shot("question-loan-not-savings");
  checks.push(
    "Unknown shows generic entrances, empty clears draft, loan repayment suggests loan guide rather than savings calculator",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  await writeFile(
    dir + "/checks.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        status: "passed",
        cases: cases.map(([question, kind, destination]) => ({
          question,
          kind,
          destination,
          passed: true,
        })),
        layouts,
        checks,
        errors,
        failed,
        chatPosts,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        status: "passed",
        routingCases: cases.length,
        layouts,
        checks,
        errors,
        failed,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
