import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const out = "docs/fin-pet/",
  base = "http://127.0.0.1:5176";
await fs.mkdir(out + "videos", { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: out + "videos", size: { width: 1440, height: 900 } },
  }),
  page = await context.newPage();
const errors = [],
  requests = [],
  passes = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => {
  if (/\/api\/(ai|chat)/.test(r.url())) requests.push(r.url());
});
const pass = (s) => {
  passes.push(s);
  console.log("PASS", s);
};
async function shot(name) {
  await page.screenshot({
    path: out + "screenshots/" + name + ".png",
    fullPage: true,
  });
}
try {
  await page.goto(base + "/fin-pet");
  await expect(page.locator(".pet-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "正面", exact: true }).click();
  const animationList = [
    ["眨眼", "Blink", 700],
    ["歪头", "Tilt", 2400],
    ["走动", "Walk", 2000],
    ["轻跳", "Jump", 1600],
    ["坐下", "Sit", 1300],
    ["安静坐着", "Seated", 1200],
    ["睡觉", "Sleep", 1500],
    ["醒来", "Wake", 2000],
    ["摸头", "Pet", 2000],
    ["挥手", "Wave", 2400],
  ];
  for (const [name, code, duration] of animationList) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".pet-stage")).toHaveAttribute(
      "data-action",
      code,
    );
    await page.waitForTimeout(duration * 0.48);
    await page
      .locator(".pet-stage")
      .screenshot({ path: out + "screenshots/action-" + code + ".png" });
    await page.waitForTimeout(duration * 0.65 + 300);
  }
  pass(
    "all ten explicit clips render in real WebGL; video and individual action screenshots",
  );
  for (const width of [1440, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".pet-stage canvas")).toBeVisible();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    if (width === 1440 || width === 390) await shot("demo-final-" + width);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "睡觉", exact: true }).click();
  const sequence = await page
    .locator(".pet-overlay")
    .getAttribute("data-sequence");
  for (const [name, path] of [
    ["首页", "/"],
    ["发现", "/discover"],
    ["财务工具", "/money-lab"],
    ["学概念", "/concept-studio"],
    ["我的世界", "/profile"],
  ]) {
    await page
      .getByRole("navigation", { name: "主导航", exact: true })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(base + path);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(".pet-overlay")).toHaveAttribute(
      "data-action",
      "Sleep",
    );
    await expect(page.locator(".pet-overlay")).toHaveAttribute(
      "data-sequence",
      sequence,
    );
    await shot("persistent-" + name);
  }
  pass(
    "five client-side navigation routes preserve sleep and director instance",
  );
  await page.getByRole("button", { name: "Fin 宠物设置", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Fin 宠物互动与设置" });
  await panel.getByRole("button", { name: "醒来", exact: true }).click();
  await panel.getByLabel("隐藏宠物", { exact: true }).check();
  await expect(page.locator(".pet-overlay")).toHaveAttribute(
    "data-visible",
    "false",
  );
  await page.reload();
  await expect(page.locator(".pet-overlay")).toHaveAttribute(
    "data-visible",
    "false",
  );
  await page.getByRole("button", { name: "Fin 宠物设置", exact: true }).click();
  await panel.getByLabel("隐藏宠物", { exact: true }).uncheck();
  await panel.getByLabel("省电：使用原 Fin 静态插画", { exact: true }).check();
  await expect(page.locator(".pet-overlay canvas")).toHaveCount(0);
  await panel
    .getByLabel("省电：使用原 Fin 静态插画", { exact: true })
    .uncheck();
  await panel.getByLabel("停靠位置").selectOption("top-left");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await page.reload();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("finpilot:fin-pet:prefs:v1")).dock,
    ),
    "top-left",
  );
  pass(
    "hide and docking survive reload; manual low-power removes WebGL; keyboard Escape works",
  );
  await page.goto(base + "/concept-studio");
  await page.locator("input[type=search]").first().focus();
  await expect(page.locator(".pet-overlay")).toHaveAttribute(
    "data-blocked",
    "true",
  );
  await page.locator("input[type=search]").first().blur();
  await page
    .getByRole("button", { name: "问 Fin", exact: false })
    .first()
    .click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect(page.locator(".pet-overlay")).toHaveAttribute(
    "data-blocked",
    "true",
  );
  await page.getByRole("button", { name: "关闭弹窗", exact: true }).click();
  pass(
    "focused input and existing FinChat modal suppress pet; chat still opens",
  );
  await page.goto(base + "/fin-pet");
  await expect(page.locator(".pet-stage")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "呼吸与眨眼", exact: true }).click();
  const canvas = page.locator(".pet-stage canvas");
  await page.waitForTimeout(500);
  const f1 = Number(await canvas.getAttribute("data-frames"));
  await page.waitForTimeout(2000);
  const f2 = Number(await canvas.getAttribute("data-frames"));
  const idleFps = (f2 - f1) / 2;
  assert.ok(idleFps > 10 && idleFps < 40);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  const stopped = await canvas.getAttribute("data-frames");
  await page.waitForTimeout(1000);
  assert.equal(await canvas.getAttribute("data-frames"), stopped);
  await shot("reduced-motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  pass(
    "idle actual render FPS " +
      idleFps +
      "; OS reduced-motion stops continuous frames",
  );
  await page.evaluate(() => {
    const c = document.querySelector(".pet-stage canvas");
    c.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(page.locator(".pet-stage .pet-fallback")).toBeVisible();
  await shot("webgl-fallback");
  pass("WebGL context loss falls back without breaking page");
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await fs.writeFile(
    out + "browser-results.json",
    JSON.stringify(
      { passes, errors, paidAiRequests: requests, idleFps },
      null,
      2,
    ),
  );
} catch (e) {
  console.log(page.url());
  await shot("failure");
  throw e;
} finally {
  const video = page.video();
  await context.close();
  if (video) await video.saveAs(out + "videos/desktop-actions.webm");
  await browser.close();
}
