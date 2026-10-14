import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (name) => {
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
};
const ready = async () => {
  await page.locator(".gb-results[aria-busy=false]").waitFor();
  await page.waitForTimeout(200);
};
try {
  await page.goto(base + "/stories/budget");
  await ready();
  await shot("b1-budget-story-desktop");
  await page.goto(base + "/money-lab/budget");
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /750.00/);
  await shot("b1-budget-before");
  await page.getByRole("button", { name: "加入 600 元维修支出" }).click();
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /150.00/);
  await shot("b1-budget-after");
  await page.getByRole("button", { name: "恢复 A 参数" }).click();
  await ready();
  assert.match(await page.locator(".gb-big-number").innerText(), /750.00/);
  const login = await context.request.post(base + "/api/auth/login", {
    data: { email: "demo@finpilot.app", password: "demo123456" },
  });
  assert.equal(login.status(), 200);
  const token = (await login.json()).token;
  await page.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  await page.reload();
  await ready();
  await page
    .getByLabel("这次我发现")
    .fill("Gate B1 实测：结余与储备目标分别核对");
  await page.getByRole("button", { name: "保存实验", exact: true }).click();
  await page.getByText("已保存这次实验", { exact: true }).waitFor();
  await shot("b1-budget-saved");
  const records = await context.request.get(base + "/api/v3/artifacts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const artifact = (await records.json()).find(
    (x) => x.detail.includes("750.00") && x.payload.note?.startsWith("Gate B1"),
  );
  assert.ok(artifact);
  const second = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await second.addInitScript(
    (t) => localStorage.setItem("finpilot_token", t),
    token,
  );
  const reopen = await second.newPage();
  await reopen.goto(base + artifact.url);
  await reopen.getByText(/已恢复原参数和 A\/B 情景/).waitFor();
  await reopen.screenshot({
    path: `${out}/b1-new-session-restored.png`,
    fullPage: true,
  });
  await second.close();
  for (const width of [375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/stories/budget");
    await ready();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `story overflow ${width}`,
    );
    await shot(`b1-story-${width}`);
    await page.goto(base + "/money-lab/budget");
    await ready();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `tool overflow ${width}`,
    );
    await shot(`b1-budget-${width}`);
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/b1-checks.json",
    JSON.stringify(
      {
        status: "passed",
        checks: [
          "budget 750 → 150 → restore 750",
          "real authenticated save",
          "fresh browser context restore",
          "375/390/430/768 no overflow",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("B1 browser checks passed");
} finally {
  await browser.close();
}
