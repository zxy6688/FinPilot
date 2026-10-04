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
const request = page.request;
const reg = await request.post("http://127.0.0.1:8004/api/auth/register", {
  data: {
    email: `gateb${Date.now()}@example.com`,
    name: "阅读体验",
    password: "ReviewPass123",
  },
});
const token = (await reg.json()).token;
try {
  await page.goto("http://127.0.0.1:5176");
  await page.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  for (const [route, name, selector] of [
    ["/articles/1", "article", ".reader-heading"],
    ["/lessons/2", "lesson", ".reading-layout"],
    ["/compare/nominal-real", "compare", ".compare-sides"],
    ["/review", "review", ".review-question"],
  ]) {
    await page.goto("http://127.0.0.1:5176" + route);
    await expect(page.locator(selector)).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/v3/gate-b-${name}-desktop.png`,
      fullPage: true,
    });
    for (const width of [375, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route + " " + width,
      ).toBe(true);
      if (width === 390)
        await page.screenshot({
          path: `docs/screenshots/v3/gate-b-${name}-mobile.png`,
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v3-gate-b-check.json",
    JSON.stringify(
      {
        routes: ["Article", "Lesson", "Compare", "Review"],
        widths: [375, 390, 430, 768],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Gate B checks passed");
} finally {
  await browser.close();
}
