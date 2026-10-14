import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
const b = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = async () => {
  await page.locator(".gb-results[aria-busy=false]").waitFor();
  await page.waitForTimeout(250);
};
try {
  await page.goto(base + "/money-lab/loan");
  await ready();
  await page.screenshot({ path: `${out}/b3-loan-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "固定当前为 A" }).click();
  await page.getByLabel("年名义利率（%）", { exact: true }).fill("0");
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /200.00/);
  await page.getByLabel("每月另付费用（元）", { exact: true }).fill("10");
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /440.00/);
  await page.screenshot({
    path: `${out}/b3-zero-interest-with-fees.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "保存实验", exact: true }).click();
  await page.getByText("已保存这次实验", { exact: true }).waitFor();
  await page.getByRole("link", { name: "去手册重新打开" }).click();
  await page.getByRole("link", { name: "恢复参数并重新计算" }).click();
  await page.getByText(/已恢复原参数与比较情景/).waitFor();
  await ready();
  assert.equal(
    await page.getByLabel("年名义利率（%）", { exact: true }).inputValue(),
    "0",
  );
  assert.equal(
    await page.getByLabel("每月另付费用（元）", { exact: true }).inputValue(),
    "10",
  );
  await page.getByRole("button", { name: "恢复 A 参数" }).click();
  await ready();
  assert.equal(
    await page.getByLabel("年名义利率（%）", { exact: true }).inputValue(),
    "6",
  );
  await page.goto(base + "/stories/loan");
  await ready();
  await page
    .getByRole("button", { name: "能，利率为零就免费", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "期初和逐月费用" })
    .waitFor();
  await page
    .getByRole("button", {
      name: "不能，净到账少于之后归还的现金，仍有成本",
      exact: true,
    })
    .click();
  await page.screenshot({
    path: `${out}/b3-story-desktop.png`,
    fullPage: true,
  });
  for (const w of [375, 390, 430, 768]) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const [url, name] of [
      ["/stories/loan", "story"],
      ["/money-lab/loan", "tool"],
    ]) {
      await page.goto(base + url);
      await ready();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `${out}/b3-${name}-${w}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/b3-checks.json",
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "zero rate with fees 200→440",
          "save/reopen restores rate and fee",
          "A/B restore",
          "wrong/correct concept feedback",
          "four mobile widths",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("B3 browser checks passed");
} finally {
  await b.close();
}
