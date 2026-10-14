import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const out = "docs/redesign/screenshots/gate-b",
  base = "http://127.0.0.1:5176";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = async () => {
  await page.locator(".gb-results[aria-busy=false]").waitFor();
  await page.waitForTimeout(200);
};
try {
  for (const tool of ["compound", "inflation"]) {
    await page.goto(base + "/money-lab/" + tool);
    await ready();
    await page.screenshot({
      path: `${out}/b2-${tool}-desktop.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "固定当前为 A" }).click();
    await page.getByLabel("时间（年）", { exact: true }).fill("5");
    await ready();
    await page.getByRole("button", { name: "恢复 A 参数" }).click();
    await ready();
    assert.equal(
      await page.getByLabel("时间（年）", { exact: true }).inputValue(),
      tool === "compound" ? "10" : "3",
    );
    await page.getByRole("button", { name: "保存实验", exact: true }).click();
    await page.getByText("已保存这次实验", { exact: true }).waitFor();
    await page.getByRole("link", { name: "去手册重新打开" }).click();
    await page
      .locator(".rd-entry")
      .filter({
        hasText:
          tool === "compound" ? "复利与时间价值实验" : "通胀与购买力实验",
      })
      .first()
      .getByRole("link", { name: "恢复参数并重新计算" })
      .click();
    await page.getByText(/已恢复原参数与 A\/B/).waitFor();
    assert.ok(page.url().includes("/money-lab/" + tool + "?receipt="));
    assert.equal(
      await page.getByLabel("时间（年）", { exact: true }).inputValue(),
      tool === "compound" ? "10" : "3",
    );
    for (const w of [375, 390, 430, 768]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(base + "/money-lab/" + tool);
      await ready();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `${out}/b2-${tool}-${w}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(base + "/decoder/purchasing-power#experiment");
  await ready();
  await page.getByLabel("假设年通胀率（%）", { exact: true }).fill("5");
  await ready();
  await page.getByRole("link", { name: "带这些参数打开完整工具" }).click();
  await ready();
  assert.equal(
    await page.getByLabel("假设年通胀率（%）", { exact: true }).inputValue(),
    "5",
  );
  await page.getByRole("link", { name: "回到购买力专题的实验处" }).click();
  await ready();
  assert.equal(
    await page.getByLabel("假设年通胀率（%）", { exact: true }).inputValue(),
    "5",
  );
  await page.screenshot({
    path: `${out}/b2-purchasing-desktop.png`,
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/b2-checks.json",
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "A/B restore",
          "guest save/reopen",
          "four mobile widths",
          "topic→tool parameters→return",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("B2 browser checks passed");
} finally {
  await browser.close();
}
