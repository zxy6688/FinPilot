import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:5176",
  api = "http://127.0.0.1:8004/api";
const reg = await page.request.post(api + "/auth/register", {
  data: {
    email: `gatec${Date.now()}@example.com`,
    name: "慢慢理解",
    password: "ReviewPass123",
  },
});
const token = (await reg.json()).token,
  headers = { Authorization: "Bearer " + token };
async function shot(name) {
  await page.evaluate(() => {
    document.activeElement instanceof HTMLElement &&
      document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `docs/screenshots/v3/gate-c-${name}-desktop.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/v3/gate-c-${name}-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await page.goto(base);
  await page.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  await page.goto(base + "/lab/1");
  await expect(page.locator(".prediction-sheet")).toBeVisible();
  await shot("prediction");
  await page.getByRole("button", { name: "更高", exact: true }).click();
  await page
    .locator(".prediction-sheet textarea")
    .fill("提高利率后，复利终值应当提高。");
  await page.getByRole("button", { name: "保存预测，进入实验" }).click();
  await expect(page.locator(".experiment-controls")).toBeVisible();
  await page.getByRole("slider", { name: "年名义收益率" }).fill("8");
  await page.getByRole("button", { name: "运行这个假设" }).click();
  await expect(page.locator(".model-value")).toBeVisible();
  await shot("lab-result");
  await page
    .locator(".reflection-sheet textarea")
    .fill(
      "相同投入下，提高利率让最终值增加。模型假设固定收益，不代表现实承诺。",
    );
  await page.getByRole("button", { name: "保存这次反思", exact: true }).click();
  await expect(page.getByText("已保存到 Notebook")).toBeVisible();
  await page.reload();
  await expect(page.locator(".prediction-sheet")).toBeVisible();
  await page.goto(base + "/learn/routes/2");
  await expect(page.locator(".route-timeline")).toBeVisible();
  await shot("route");
  await page.reload();
  await expect(page.locator(".route-current")).toBeVisible();
  await page.goto(base + "/compare/etf-index-fund");
  await page.getByRole("button", { name: "举个例子", exact: true }).click();
  await expect(page.locator(".context-answer")).toBeVisible();
  await expect(page.locator(".context-answer")).toContainText("ETF");
  await page.getByRole("link", { name: /打开完整 AI Copilot/ }).click();
  await expect(page).toHaveURL(/session=/);
  await expect(page.locator(".messages")).toContainText("ETF");
  await shot("copilot");
  await page.goto(base + "/profile");
  await expect(page.locator(".world-overview")).toBeVisible();
  await shot("world");
  await page.getByRole("button", { name: "Notebook", exact: true }).click();
  await expect(page.locator(".notebook")).toContainText("相同投入下");
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.locator(".constellation-full .star")).toHaveCount(24);
  await shot("constellation");
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v3-gate-c-check.json",
    JSON.stringify(
      {
        checks: [
          "Prediction persisted before simulation",
          "Backend result and reflection saved",
          "Saved route survives reload",
          "Comparison AI keeps Copilot session",
          "Notebook shows real reflection",
          "24 true constellation nodes",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Gate C workflow passed");
} finally {
  await browser.close();
}
