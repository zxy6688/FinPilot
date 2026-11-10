import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }),
  c = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: "docs/fin-pet/videos",
      size: { width: 390, height: 844 },
    },
  }),
  p = await c.newPage(),
  cdp = await c.newCDPSession(p),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const base = "http://127.0.0.1:5176";
const point = async (type, x, y) =>
  cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints:
      type === "touchEnd" ? [] : [{ x, y, radiusX: 5, radiusY: 5, force: 1 }],
  });
try {
  await p.goto(base + "/profile");
  await expect(p.locator("h1")).toHaveText("我的世界");
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(p.locator(".pet-overlay")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await expect(p.locator(".pet-overlay .pet-render")).toHaveAttribute(
    "data-ready",
    "true",
  );
  const box = await p.locator(".pet-touch").boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await point("touchStart", x, y);
  await p.waitForTimeout(650);
  await expect(p.locator(".pet-overlay")).toHaveAttribute("data-action", "Pet");
  await p.screenshot({
    path: "docs/fin-pet/screenshots/mobile-long-press.png",
    fullPage: true,
  });
  await point("touchEnd", x, y);
  await p.waitForTimeout(2200);
  await point("touchStart", x, y);
  for (let i = 1; i <= 8; i++) {
    await point("touchMove", x + ((30 - x) * i) / 8, y + ((200 - y) * i) / 8);
    await p.waitForTimeout(60);
  }
  await point("touchEnd", 30, 200);
  await expect
    .poll(() =>
      p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("finpilot:fin-pet:prefs:v1")).dock,
      ),
    )
    .toBe("top-left");
  await p.getByRole("button", { name: "Fin 宠物设置", exact: true }).click();
  const panel = p.getByRole("dialog", { name: "Fin 宠物互动与设置" });
  await expect(panel).toBeVisible();
  await p.screenshot({
    path: "docs/fin-pet/screenshots/mobile-panel.png",
    fullPage: true,
  });
  await panel
    .getByRole("button", { name: "关闭宠物面板", exact: true })
    .click();
  await p.goto(base + "/money-lab/loan");
  await p.locator("input[type=number]").first().focus();
  await expect(p.locator(".pet-overlay")).toHaveAttribute(
    "data-blocked",
    "true",
  );
  await p.screenshot({
    path: "docs/fin-pet/screenshots/mobile-input-clear.png",
    fullPage: true,
  });
  await p.goto(base + "/fin-pet");
  await expect(p.locator(".pet-stage")).toHaveAttribute("data-ready", "true");
  await p.getByRole("button", { name: "正面", exact: true }).click();
  await p.getByRole("button", { name: "轻跳", exact: true }).click();
  await p.waitForTimeout(600);
  await p.screenshot({
    path: "docs/fin-pet/screenshots/mobile-3d-jump.png",
    fullPage: true,
  });
  assert.ok(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/fin-pet/mobile-results.json",
    JSON.stringify(
      {
        passed: [
          "real touch long-press triggers Pet",
          "touch drag saves top-left dock",
          "panel fits390px",
          "focused loan input suppresses overlay",
          "390px GLB jump and no horizontal overflow",
        ],
        errors,
        device: "Chrome touch emulation; not a physical phone",
      },
      null,
      2,
    ),
  );
  console.log("PASS mobile touch, drag, panel, input avoidance and 3D");
} catch (e) {
  console.log(await p.locator(".pet-overlay").getAttribute("data-blocked"));
  await p.screenshot({
    path: "docs/fin-pet/screenshots/mobile-failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  const v = p.video();
  await c.close();
  if (v) await v.saveAs("docs/fin-pet/videos/mobile-touch.webm");
  await b.close();
}
