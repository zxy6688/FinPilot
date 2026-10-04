import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  }),
  base = "http://127.0.0.1:5176",
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
try {
  const r = await p.request.post("http://127.0.0.1:8004/api/auth/register", {
    data: {
      email: "a11y" + Date.now() + "@example.com",
      name: "交互检查",
      password: "ReviewPass123",
    },
  });
  const token = (await r.json()).token;
  await p.goto(base);
  await p.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  await p.goto(base + "/articles/1");
  await p.locator(".reader-lead").waitFor();
  await p.evaluate(() => {
    const el = document.querySelector(".reader-lead");
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(range);
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await expect(p.locator(".selection-tools")).toBeVisible();
  await p
    .locator(".selection-tools")
    .getByRole("button", { name: "简单解释", exact: true })
    .click();
  await expect(p.locator("dialog .context-answer")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press("Tab");
    expect(
      await p.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await p.keyboard.press("Escape");
  await expect(p.locator("dialog")).toHaveCount(0);
  await expect(p.locator(".selection-tools")).toHaveCount(0);
  await p.keyboard.press("Control+k");
  await expect(p.getByRole("combobox", { name: "搜索知识" })).toBeVisible();
  await p.getByRole("combobox", { name: "搜索知识" }).fill("ETF");
  await expect(p.locator("#global-search-results")).toContainText("ETF");
  await p.keyboard.press("Escape");
  await expect(p.locator("dialog")).toHaveCount(0);
  await p.goto(base);
  await expect(p.locator(".fin").first()).toBeVisible();
  expect(
    await p
      .locator(".fin svg")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await p.route("**/api/v3/home", (route) => route.abort());
  await p.reload();
  await expect(
    p.getByRole("button", { name: "重新尝试", exact: true }),
  ).toBeVisible();
  await p.unroute("**/api/v3/home");
  await p.getByRole("button", { name: "重新尝试", exact: true }).click();
  await expect(p.locator(".today-focus")).toBeVisible();
  expect(errors).toEqual([]);
  await writeFile(
    "docs/v3-interaction-check.json",
    JSON.stringify(
      {
        checks: [
          "Real text selection opens contextual AI",
          "Native dialog contains keyboard focus",
          "Escape closes dialog and selection",
          "Ctrl-K search and Escape",
          "Reduced-motion disables Fin animation",
          "API failure offers retry and recovers",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("V3 interaction checks passed");
} finally {
  await b.close();
}
