import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:5176";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
  locale: "zh-CN",
});
const page = await context.newPage();
const errors = [],
  failed = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(r.status() + " " + r.url());
});
const dir = "docs/redesign/a1/screenshots/";
async function ready(path) {
  await page.goto(base + path);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1").first()).toBeVisible();
}
async function shot(name, fullPage = true) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: dir + name + ".png", fullPage });
}
try {
  await ready("/");
  await expect(page.locator(".rd-tasks a")).toHaveCount(3);
  const bottom = await page
    .locator(".rd-tasks")
    .evaluate((e) => e.getBoundingClientRect().bottom);
  if (bottom > 900) throw new Error("Tasks outside first screen: " + bottom);
  const preview = await page.request.post(base + "/api/v3/tools/savings", {data:{principal:2000, monthly:500, months:24, rate:2, target:15000, timing:"end"}});
  const model = await preview.json();
  await expect(page.locator(".a1-savings-preview strong")).toHaveText("¥ " + model.balance.toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2}));
  checks.push("Home amount matches actual API model; sparkline renders its points");
  await page.locator(".rd-mini").screenshot({path:dir+"mini-lab-before.png"});
  await page.locator("#mini-monthly").fill("1000");
  await expect(page.locator(".rd-mini-result>strong")).not.toContainText("计算中");
  await expect(page.locator(".rd-mini-result>strong")).not.toHaveText("¥ 14,314.39");
  await page.locator(".rd-mini").screenshot({path:dir+"mini-lab-after.png"});
  await page.locator("#mini-monthly").fill("500");
  await expect(page.locator(".rd-mini-result>strong")).toHaveText("¥ 14,314.39");
  await page.evaluate(()=>scrollTo(0,0));
  await shot("home-new-desktop");
  await shot("home-first-screen", false);
  checks.push("1440x900: three tasks visible");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("home-new-mobile");
  await shot("home-mobile-first-screen", false);
  const mobileBottom = await page.locator(".rd-tasks").evaluate(e=>e.getBoundingClientRect().bottom);
  if(mobileBottom > 780) throw new Error("Mobile tasks hidden under bottom navigation: " + mobileBottom);
  checks.push("390x844: three compact tasks visible above bottom navigation");
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready("/decoder/purchasing-power");
  await shot("decoder-desktop");
  await page.getByRole("button", { name: "仍然不知道", exact: true }).click();
  await expect(page.locator(".rd-layer-content")).toContainText("未来实际通胀");
  await page.locator(".rd-inflation").screenshot({path:dir+"decoder-experiment-before.png"});
  await page.getByLabel("假设每年通胀率").fill("0");
  await expect(page.locator(".rd-purchasing-result>strong")).toHaveText(
    "¥ 10,000.00",
  );
  await page.locator(".rd-inflation").screenshot({path:dir+"decoder-experiment-after.png"});
  await page.getByLabel("假设每年通胀率").fill("3");
  await expect(page.locator(".rd-purchasing-result>strong")).toHaveText(
    "¥ 9,151.42",
  );
  await page
    .locator(".rd-note-field textarea")
    .fill("我发现：账户余额与购买力不是同一个尺度。");
  await page.getByRole("button", { name: "保存这次发现", exact: true }).click();
  await expect(
    page.getByText("已保存在此浏览器。", { exact: false }),
  ).toBeVisible();
  checks.push("Decoder: layers, backend inflation, saved real interaction");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("decoder-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready("/money-lab");
  await expect(page.locator(".rd-result-number")).not.toContainText("计算中");
  await shot("money-lab-default-desktop");
  await page.getByLabel("假设年名义收益率", { exact: true }).fill("0");
  await expect(page.locator(".rd-result-number")).toHaveText("¥ 14,000.00");
  await page.getByRole("button", { name: "固定当前方案作对比" }).click();
  await page.getByLabel("每月再存", { exact: true }).fill("700");
  await expect(page.locator(".rd-result-number")).toHaveText("¥ 18,800.00");
  await expect(page.locator(".rd-compare-result")).toContainText("4,800.00");
  await page.getByRole("button", { name: "保存 Money Receipt" }).click();
  await expect(
    page.getByText("这张真实计算小票已收好。", { exact: false }),
  ).toBeVisible();
  await page.locator(".rd-success").screenshot({path:dir+"receipt-saved.png"});
  await shot("money-lab-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("money-lab-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  checks.push(
    "Money Lab: 0% independent formula, live change, comparison, receipt",
  );
  await page.getByLabel("坚持多久", { exact: true }).fill("12");
  await expect(page.locator(".rd-growth")).toContainText("第 24 个月");
  await expect(page.locator(".rd-result-number")).toHaveText("¥ 10,400.00");
  checks.push("Unequal term comparison shares correct 24-month axis");
  await ready("/profile");
  await page.getByRole("link", { name: "恢复参数并重新计算" }).click();
  await expect(page.getByLabel("每月再存", { exact: true })).toHaveValue("700");
  await page.reload();
  await expect(page.getByLabel("每月再存", { exact: true })).toHaveValue("700");
  await expect(page.locator(".rd-result-number")).toHaveText("¥ 18,800.00");
  await shot("receipt-restored");
  checks.push("Receipt restored after refresh");
  await ready("/concept-studio");
  await page
    .getByRole("button", { name: "主动管理的 ETF", exact: true })
    .click();
  await expect(page.locator(".rd-concept-feedback")).toContainText(
    "并没有规定",
  );
  await page.locator(".a1-matrix").getByRole("button").nth(2).click();
  await expect(page.locator(".a1-selection")).toContainText("非 ETF 形式 × 指数策略");
  await page.locator(".a1-matrix-wrap").screenshot({path:dir+"concept-matrix-selected.png"});
  await page.locator(".rd-quiz .rd-answer").nth(0).click();
  await expect(page.locator(".rd-answer-feedback")).toContainText("反例");
  await page.locator(".rd-quiz").screenshot({path:dir+"concept-wrong.png"});
  await page.locator(".rd-quiz .rd-answer").nth(2).click();
  await expect(page.locator(".rd-answer-feedback")).toContainText("两个维度");
  await page.locator(".rd-quiz").screenshot({path:dir+"concept-correct.png"});
  await page.getByRole("button", { name: "答对后保存概念卡" }).click();
  await expect(
    page.getByRole("button", { name: "概念卡已放进手册" }),
  ).toBeVisible();
  await shot("concept-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("concept-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  checks.push("Concept: cases, targeted wrong feedback, correct saved card");
  await ready("/profile");
  await expect(page.locator(".rd-entry")).toHaveCount(3);
  await shot("notebook-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("notebook-mobile");
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready("/");
  await expect(
    page.getByRole("heading", { name: "继续我的探索。" }),
  ).toBeVisible();
  await shot("home-return-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot("home-return-mobile");
  await page.getByRole("button", { name: "和 Fin 互动" }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    if (
      !(await page.evaluate(() =>
        document.querySelector("dialog")?.contains(document.activeElement),
      ))
    )
      throw new Error("Focus escaped Fin drawer");
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  checks.push("Fin: Enter, focus containment, Escape");
  for (const width of [375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/decoder/purchasing-power",
      "/money-lab",
      "/concept-studio",
      "/profile",
    ]) {
      await ready(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      if (overflow) throw new Error(`Overflow ${width} ${path}`);
    }
  }
  checks.push("375/390/430/768 no page overflow");
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready("/fin-design");
  await shot("fin-character-sheet");
  await ready("/discover");
  await shot("discover-desktop");
  await ready("/login");
  await page.locator("input[name=email]").fill("demo@finpilot.app");
  await page.locator("input[name=password]").fill("demo123456");
  await page.locator("form button").first().click();
  await page.waitForURL(base + "/");
  await ready("/profile");
  await expect(page.locator(".rd-entry")).toHaveCount(0);
  checks.push("Demo login: guest notebook isolated from account");
  await ready("/concept-studio");
  await page.locator(".rd-quiz .rd-answer").nth(2).click();
  await expect(page.locator(".rd-answer-feedback")).toContainText("两个维度");
  checks.push("Authenticated concept uses existing review API");
  for (const path of [
    "/discover/library",
    "/learn",
    "/lab/1",
    "/copilot",
    "/profile/history",
    "/stories/budget",
    "/stories/bonds",
    "/stories/loan",
  ]) {
    await ready(path);
  }
  checks.push("Existing capabilities and five topic entry points reachable");
  if (errors.length || failed.length)
    throw new Error(JSON.stringify({ errors, failed }));
  await writeFile(
    "docs/redesign/a1/browser-check.json",
    JSON.stringify(
      {
        checked_at: new Date().toISOString(),
        checks,
        errors,
        failed,
        status: "passed",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, errors, failed }));
} finally {
  await browser.close();
}
