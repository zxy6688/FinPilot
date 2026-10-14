import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
const b = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  p = await c.newPage(),
  errors = [],
  checks = [],
  routes = [];
p.on("pageerror", (e) => errors.push(e.message));
const ready = async () => {
  await p.waitForTimeout(450);
  for (const selector of [".gb-results", ".rd-output-panel"])
    if (await p.locator(selector).count())
      await p.locator(selector + "[aria-busy=false]").waitFor();
  await p.waitForTimeout(120);
};
const shot = async (name, full = true) =>
  p.screenshot({ path: `${out}/${name}.png`, fullPage: full });
const core = [
  ["/", "home"],
  ["/discover", "discover"],
  ["/money-lab", "directory"],
  ["/money-lab/savings", "savings"],
  ["/money-lab/compound", "compound"],
  ["/money-lab/inflation", "inflation"],
  ["/money-lab/budget", "budget"],
  ["/money-lab/loan", "loan"],
  ["/stories/budget", "budget-story"],
  ["/decoder/purchasing-power", "purchasing"],
  ["/stories/bonds", "bonds"],
  ["/stories/etf", "etf"],
  ["/stories/loan", "loan-story"],
  ["/concept-studio", "concept"],
  ["/profile", "notebook"],
];
try {
  await p.goto(base + "/");
  await p.getByRole("button", { name: "全站搜索" }).click();
  await p.getByRole("combobox", { name: "搜索知识" }).fill("贷款");
  await p.getByRole("option").filter({ hasText: "贷款实际成本" }).click();
  await ready();
  assert.ok(p.url().includes("/money-lab/loan"));
  checks.push("global search→actual loan tool");
  await p.goto(base + "/discover");
  await p.getByRole("button", { name: "借贷", exact: true }).click();
  assert.equal(await p.locator(".gb-editorial-list article").count(), 1);
  await p.getByLabel("筛选专题").fill("外星");
  await p.getByRole("heading", { name: "这一期没有对应专题。" }).waitFor();
  await p.getByRole("button", { name: "显示全部五个专题" }).click();
  assert.equal(await p.locator(".gb-editorial-list article").count(), 5);
  checks.push("Discover filters/empty/reset");
  // Login through the actual API, then exercise the UI using the returned account.
  const login = await c.request.post(base + "/api/auth/login", {
    data: { email: "demo@finpilot.app", password: "demo123456" },
  });
  assert.equal(login.status(), 200);
  const token = (await login.json()).token;
  await p.evaluate((t) => localStorage.setItem("finpilot_token", t), token);
  await p.reload();
  await p.goto(base + "/money-lab/budget");
  await ready();
  await p.getByLabel("这次我发现").fill("Gate B5 网络失败后重试 " + Date.now());
  await p.route("**/api/v3/artifacts", (route) => route.abort());
  await p.getByRole("button", { name: "保存实验", exact: true }).click();
  await p.getByRole("alert").filter({ hasText: "暂时没有连接" }).waitFor();
  assert.equal(await p.getByText("已保存这次实验", { exact: true }).count(), 0);
  assert.match(await p.getByLabel("这次我发现").inputValue(), /Gate B5/);
  await shot("b5-save-failed");
  await p.unroute("**/api/v3/artifacts");
  await p.getByRole("button", { name: "保存实验", exact: true }).click();
  await p.getByText("已保存这次实验", { exact: true }).waitFor();
  checks.push("offline save no false success; retry preserves note and inputs");
  await p.goto(base + "/stories/budget");
  await ready();
  await p.locator("#experiment").scrollIntoViewIfNeeded();
  await p.waitForTimeout(1400);
  let state = await c.request.get(base + "/api/v3/reading/story/1", {
    headers: { Authorization: "Bearer " + token },
  });
  assert.equal(state.status(), 200);
  assert.ok((await state.json())?.last_section);
  checks.push("authenticated story position persisted");
  await p.goto(base + "/money-lab/inflation");
  await ready();
  await p.getByRole("button", { name: "问 Fin", exact: true }).click();
  await p
    .getByLabel("你的追问")
    .fill("这个实验里的名义金额和购买力有什么区别？");
  await p.getByRole("button", { name: "发送追问" }).click();
  await p.locator(".gb-chat-answer").waitFor();
  await shot("b5-fin-context-drawer", false);
  const url = await p
    .getByRole("link", { name: "在完整 Copilot 继续" })
    .getAttribute("href");
  assert.match(url, /session=\d+/);
  await p.getByRole("link", { name: "在完整 Copilot 继续" }).click();
  await p.getByText(/接着探索：通胀购买力/).waitFor();
  await p.waitForTimeout(400);
  assert.ok(p.url().endsWith(url));
  await shot("b5-copilot-same-session");
  checks.push("Fin contextual model→same authenticated Copilot session");
  const sid = Number(new URL(p.url()).searchParams.get("session"));
  const history = await c.request.get(base + "/api/chat/sessions/" + sid, {
    headers: { Authorization: "Bearer " + token },
  });
  assert.equal((await history.json()).messages.length, 2);
  // Every core surface: actual pixels, loaded images, no horizontal overflow, visible heading.
  for (const [url, name] of core) {
    await p.goto(base + url);
    await ready();
    assert.equal(await p.locator("h1").count(), 1, url);
    const failed = await p
      .locator("img")
      .evaluateAll((imgs) =>
        imgs
          .filter((i) => !i.complete || i.naturalWidth === 0)
          .map((i) => i.src),
      );
    assert.deepEqual(failed, [], url + " broken images");
    await shot(`b5-${name}-desktop`);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(100);
    await shot(`b5-${name}-first-screen`, false);
    routes.push(url);
  }
  for (const width of [375, 390, 430, 768]) {
    await p.setViewportSize({ width, height: 900 });
    for (const [url, name] of core) {
      await p.goto(base + url);
      await ready();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `${url} overflow ${width}`,
      );
      await shot(`b5-${name}-${width}`);
      if (url === "/") {
        const titleRight = await p.locator(".rd-hero h1").evaluate((el) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            return Math.max(
              ...Array.from(r.getClientRects())
                .filter((x) => x.width > 0)
                .map((x) => x.right),
            );
          }),
          fin = await p.locator(".rd-scene-fin-hit").boundingBox();
        assert.ok(titleRight <= fin.x, `title overlap ${width}`);
      }
    }
  }
  checks.push("all 15 core surfaces at desktop and 375/390/430/768");
  await p.setViewportSize({ width: 1440, height: 1000 });
  for (const url of [
    "/discover/library",
    "/articles/1",
    "/learn",
    "/learn/1",
    "/lessons/1",
    "/learn/routes/1",
    "/lab",
    "/lab/1",
    "/review",
    "/compare/etf-index-fund",
    "/fintalk",
    "/profile/history",
    "/knowledge",
    "/search?q=ETF",
  ]) {
    await p.goto(base + url);
    await p.waitForTimeout(500);
    assert.equal(
      await p.getByText("好像走出了知识地图。", { exact: true }).count(),
      0,
      url,
    );
    routes.push(url);
  }
  checks.push("14 old learning/discussion/search routes retained");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/b5-checks.json",
    JSON.stringify({ status: "passed", checks, routes, errors }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await b.close();
}
