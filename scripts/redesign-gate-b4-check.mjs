import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }),
  page = await b.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = async () => {
  await page.locator(".gb-results[aria-busy=false]").waitFor();
  await page.waitForTimeout(180);
};
try {
  await page.goto(base + "/stories/bonds");
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /1,000.00/);
  await page.getByLabel("市场年收益率（%）", { exact: true }).fill("2");
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /1,047.13/);
  await page
    .getByRole("button", { name: "不用补充，所有债券都会涨", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "政策利率不等于" })
    .waitFor();
  await page
    .getByRole("button", {
      name: "市场收益率、原先预期及信用等条件是否变化",
      exact: true,
    })
    .click();
  await page.screenshot({
    path: `${out}/b4-bonds-desktop.png`,
    fullPage: true,
  });
  await page.goto(base + "/stories/etf");
  await page
    .getByRole("button", { name: "授权参与者的申赎", exact: true })
    .click();
  await page.getByText("份额创建 / 赎回", { exact: true }).waitFor();
  await page.screenshot({ path: `${out}/b4-etf-desktop.png`, fullPage: true });
  await page.goto(base + "/concept-studio");
  await page
    .getByRole("button", { name: "主动管理的 ETF", exact: true })
    .first()
    .click();
  const buttons = page.locator(".rd-quiz-options button");
  console.log(await buttons.count());
  await page.getByRole("button").filter({ hasText: "所有 ETF" }).last().click();
  await page.getByText(/主动管理 ETF 就是反例/).waitFor();
  await page.screenshot({
    path: `${out}/b4-concept-wrong.png`,
    fullPage: true,
  });
  await page
    .getByRole("button")
    .filter({ hasText: "ETF 是形式，指数跟踪是策略" })
    .last()
    .click();
  await page.getByRole("button", { name: "答对后保存概念卡" }).click();
  await page.getByRole("button", { name: "概念卡已放进手册" }).waitFor();
  await page.goto(base + "/profile");
  await page.getByRole("link", { name: "回到这次探索" }).click();
  await page.getByText(/已恢复这张概念卡的判断/).waitFor();
  await page.screenshot({
    path: `${out}/b4-concept-restored.png`,
    fullPage: true,
  });
  for (const width of [375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ["bonds", "etf"]) {
      await page.goto(base + "/stories/" + slug);
      if (slug === "bonds") await ready();
      else await page.waitForTimeout(200);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `${out}/b4-${slug}-${width}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/b4-checks.json",
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "bond yield 3→2 price 1000→1047.13",
          "bond wrong/correct feedback",
          "ETF mechanism switch",
          "concept wrong/correct/save/reopen",
          "four mobile widths",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("B4 browser checks passed");
} finally {
  await b.close();
}
