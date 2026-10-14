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
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
  locale: "zh-CN",
});
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const url = "http://127.0.0.1:5176";
const checks = [];
try {
  await p.goto(url);
  await p.getByLabel("今天想弄明白的问题").fill("我想每月存钱");
  await p.getByRole("button", { name: "选择探索入口" }).click();
  await p.waitForURL("**/money-lab");
  await p.getByLabel("假设年名义收益率", { exact: true }).fill("12");
  await p.getByLabel("坚持多久", { exact: true }).fill("1");
  await p.getByLabel("存入时间", { exact: true }).selectOption("begin");
  await expect(p.locator(".rd-result-number")).toHaveText("¥ 2,525.00");
  await p.getByRole("button", { name: "保存 Money Receipt" }).click();
  checks.push(
    "Touch viewport: question routing, month-begin 2525 verified, receipt saved",
  );
  await p.getByRole("link", { name: "去发现手册查看" }).click();
  await expect(p.locator(".rd-entry")).toHaveCount(1);
  await p.reload();
  await expect(p.locator(".rd-entry")).toHaveCount(1);
  await p.getByRole("link", { name: "恢复参数并重新计算" }).click();
  await expect(p.getByLabel("存入时间", { exact: true })).toHaveValue("begin");
  checks.push("Touch viewport: Notebook refresh and input restore");
  await p.goto(url + "/decoder/purchasing-power#experiment");
  await expect(p.getByLabel("假设每年通胀率")).toBeInViewport();
  await p.getByLabel("假设每年通胀率").fill("0");
  await expect(p.locator(".rd-purchasing-result>strong")).toHaveText(
    "¥ 10,000.00",
  );
  await p.getByRole("button", { name: "保存这次发现", exact: true }).click();
  checks.push(
    "Touch viewport: direct section link, inflation slider, reading save",
  );
  await p.goto(url + "/concept-studio");
  await p
    .getByRole("button", { name: "场外指数共同基金", exact: true })
    .click();
  await expect(p.locator(".rd-market-drawing")).toContainText("基金公司");
  await p.locator(".rd-quiz .rd-answer").nth(1).click();
  await expect(p.locator(".rd-answer-feedback")).toContainText("场外指数");
  await p.locator(".rd-quiz .rd-answer").nth(2).click();
  await p.getByRole("button", { name: "答对后保存概念卡" }).click();
  checks.push(
    "Touch viewport: conceptual counterexample and saved correct card",
  );
  await p.goto(url + "/");
  await expect(
    p.getByRole("heading", { name: "继续我的探索。" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "和 Fin 互动" }).first().click();
  await p.getByRole("button", { name: "让 Fin 安静一会儿" }).click();
  await p.getByRole("button", { name: "和 Fin 互动" }).first().click();
  await expect(
    p.getByRole("button", { name: "让 Fin 回来陪伴" }),
  ).toBeVisible();
  await p.keyboard.press("Escape");
  checks.push("Touch viewport: real return state, Fin quiet toggle");
  if (errors.length) throw new Error(JSON.stringify(errors));
  await writeFile(
    "docs/redesign/mobile-check.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await b.close();
}
