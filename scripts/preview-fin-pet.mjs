import {
  chromium,
  expect,
} from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
await fs.mkdir("docs/fin-pet/screenshots", { recursive: true });
const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }),
  p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
p.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
try {
  await p.goto("http://127.0.0.1:5176/fin-pet");
  await expect(p.locator(".pet-stage")).toHaveAttribute("data-ready", "true", {
    timeout: 60000,
  });
  await p.getByRole("button", { name: "暂停画面", exact: true }).click();
  for (const view of ["正面", "侧面", "背面"]) {
    await p.getByRole("button", { name: view, exact: true }).click();
    await p.waitForTimeout(300);
    await p
      .locator(".pet-stage")
      .screenshot({ path: "docs/fin-pet/screenshots/" + view + ".png" });
  }
  await p.screenshot({
    path: "docs/fin-pet/screenshots/demo-1440.png",
    fullPage: true,
  });
  console.log("READY");
} finally {
  await b.close();
}
