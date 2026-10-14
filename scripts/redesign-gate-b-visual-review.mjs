import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = process.cwd(),
  dir = "docs/redesign/screenshots/gate-b",
  report = "docs/redesign/gate-b";
const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }),
  p = await b.newPage({ viewport: { width: 390, height: 844 } });
const pages = [
  ["/", "home"],
  ["/discover", "discover"],
  ["/money-lab", "directory"],
  ["/stories/budget", "budget-story"],
  ["/decoder/purchasing-power", "purchasing"],
  ["/stories/loan", "loan-story"],
  ["/stories/bonds", "bonds"],
  ["/stories/etf", "etf"],
  ["/money-lab/savings", "savings"],
  ["/money-lab/compound", "compound"],
  ["/money-lab/inflation", "inflation"],
  ["/money-lab/loan", "loan"],
  ["/money-lab/budget", "budget"],
  ["/concept-studio", "concept"],
  ["/profile", "notebook"],
  ["/copilot", "copilot"],
  ["/fin-design", "fin"],
];
try {
  for (const [url, name] of pages) {
    await p.goto("http://127.0.0.1:5176" + url);
    await p.waitForTimeout(900);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: `${dir}/final-${name}-first-390.png` });
  }
  for (const width of [375, 430, 768]) {
    await p.setViewportSize({ width, height: 844 });
    await p.goto("http://127.0.0.1:5176/");
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${dir}/final-home-first-${width}.png` });
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
  for (const [url, name] of [
    ["/profile", "notebook"],
    ["/fin-design", "fin"],
    ["/copilot", "copilot"],
  ]) {
    await p.goto("http://127.0.0.1:5176" + url);
    await p.waitForTimeout(700);
    await p.screenshot({
      path: `${dir}/final-${name}-desktop.png`,
      fullPage: true,
    });
  }
  const css =
    "body{margin:0;padding:32px;background:#f3f5ef;color:#193d40;font:18px system-ui}h1{font-size:28px}h2{font-size:19px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}figure{margin:0;background:white;padding:12px;border-radius:12px}img{width:100%;height:auto;display:block}figcaption{padding:12px 0;font-weight:600}p{line-height:1.6}a{color:#267b78}";
  const fig = (src, title) =>
    `<figure><figcaption>${title}</figcaption><a href="${src}"><img src="${src}"></a></figure>`;
  const compare = `<!doctype html><meta charset="utf-8"><title>Gate B 视觉对照</title><style>${css}</style><h1>FinPilot · 已认可目标 / A1 实现 / Gate B 实现</h1><p>左图为设计目标；中、右为真实运行截图。图片均可点击查看原始分辨率。首页品牌主画和 Fin 图谱哈希保持一致；此对照供人工验收，不代表用户已批准 Gate B。</p><div class="grid">${fig("../visual_refs/02_APPROVED_RICH_DIRECTION.png", "认可的艺术方向（概念图）")}${fig("../a1-p0/screenshots/home-1440.png", "A1/P0 已认可基础（真实页面）")}${fig("../screenshots/gate-b/b5-home-first-screen.png", "Gate B 首页（真实页面）")}</div><h2>核心工作台延续</h2><div class="grid">${fig("../a1/screenshots/money-lab-desktop.png", "A1 储蓄工作台")}${fig("../screenshots/gate-b/b5-savings-desktop.png", "Gate B 原储蓄能力深化")}${fig("../screenshots/gate-b/b5-loan-desktop.png", "Gate B 新贷款工作台")}</div><h2>手机首页：冻结基础与当前页面</h2><div class="grid">${fig("../a1-p0/screenshots/home-390.png", "A1/P0 · 390px")}${fig("../screenshots/gate-b/final-home-first-390.png", "Gate B · 390px")}${fig("../screenshots/gate-b/final-home-first-375.png", "Gate B · 375px")}</div>`;
  await fs.writeFile(report + "/visual-comparison.html", compare);
  await p.setViewportSize({ width: 1920, height: 1080 });
  await p.goto(
    pathToFileURL(path.join(root, report, "visual-comparison.html")).href,
  );
  await p.screenshot({
    path: report + "/visual-comparison.png",
    fullPage: true,
  });
  const contact = `<!doctype html><meta charset="utf-8"><title>Gate B 手机首屏索引</title><style>${css}.grid{grid-template-columns:repeat(5,1fr)}</style><h1>Gate B · 390px 实际手机首屏</h1><p>这些是浏览器原始截图的索引缩略展示，点击打开原图；未改写页面像素。</p><div class="grid">${pages.map(([, name]) => fig("../screenshots/gate-b/final-" + name + "-first-390.png", name)).join("")}</div>`;
  await fs.writeFile(report + "/mobile-contact-sheet.html", contact);
  await p.goto(
    pathToFileURL(path.join(root, report, "mobile-contact-sheet.html")).href,
  );
  await p.screenshot({
    path: report + "/mobile-contact-sheet.png",
    fullPage: true,
  });
  console.log(
    "Real first-screen screenshots and linked visual comparison generated",
  );
} finally {
  await b.close();
}
