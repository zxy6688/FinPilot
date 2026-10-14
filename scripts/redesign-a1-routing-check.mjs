import { chromium, expect } from "../frontend/node_modules/@playwright/test/index.mjs";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
const base = "http://127.0.0.1:5176";
const cases = [
  ["存钱为什么不等于购买力不变？", "/decoder/purchasing-power"],
  ["通胀会影响我的储蓄吗", "/decoder/purchasing-power"],
  ["物价变高了怎么办", "/decoder/purchasing-power"],
  ["每月存500，两年后多少钱", "/money-lab"],
  ["复利怎么算", "/money-lab"],
  ["ETF等于指数基金吗", "/concept-studio"],
  ["etf是什么", "/concept-studio"],
  ["每月存钱还是买ETF", null],
  ["通胀与指数基金", null],
  ["", null], ["   ", null], ["今天心情怎么样", null],
];
const errors = []; page.on("pageerror",e=>errors.push(e.message));
try {
  for(const [question, path] of cases){
    await page.goto(base); await page.getByLabel("今天想弄明白的问题").fill(question);
    await page.getByRole("button",{name:"选择探索入口"}).click();
    if(path) await page.waitForURL(base+path);
    else {await expect(page.locator(".rd-question-choice")).toBeVisible();await expect(page).toHaveURL(base+"/");}
  }
  if(errors.length) throw Error(JSON.stringify(errors));
  await writeFile("docs/redesign/a1/routing-check.json", JSON.stringify({checked_at:new Date().toISOString(),status:"passed",cases:cases.map(([question,expected])=>({question,expected:expected||"explicit choice",passed:true})),errors},null,2));
  console.log(`${cases.length} routing cases passed`);
} finally {await browser.close();}
