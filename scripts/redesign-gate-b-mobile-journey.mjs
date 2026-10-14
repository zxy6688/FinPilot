import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const base = "http://127.0.0.1:5176",
  out = "docs/redesign/screenshots/gate-b";
const b = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }),
  c = await b.newContext({ viewport: { width: 390, height: 844 } }),
  p = await c.newPage(),
  errors = [],
  checks = [];
p.on("pageerror", (e) => errors.push(e.message));
const ready = async () => {
  await p.waitForTimeout(500);
  if (await p.locator(".gb-results").count())
    await p.locator(".gb-results[aria-busy=false]").waitFor();
};
try {
  const login = await c.request.post(base + "/api/auth/login", {
    data: { email: "demo@finpilot.app", password: "demo123456" },
  });
  const token = (await login.json()).token;
  assert.ok(token);
  await c.addInitScript(
    (t) => localStorage.setItem("finpilot_token", t),
    token,
  );
  await p.goto(base + "/");
  await p
    .getByPlaceholder("输入问题或专题名称，找相关内容")
    .fill("大学生的第一份预算");
  await p.getByRole("button", { name: "找内容", exact: true }).click();
  await ready();
  assert.ok(p.url().includes("/stories/budget"));
  await p.getByLabel("可用收入（元）", { exact: true }).fill("2800");
  await ready();
  await p.getByRole("button", { name: "加入 600 元维修支出" }).click();
  await ready();
  await p.getByRole("link", { name: "带这些数字打开完整预算工具" }).click();
  await ready();
  assert.equal(
    await p.getByLabel("可用收入（元）", { exact: true }).inputValue(),
    "2800",
  );
  await p.getByLabel("这次我发现").fill("手机完整旅程：维修后仍需检查储备");
  await p.getByRole("button", { name: "保存实验", exact: true }).click();
  await p.getByText("已保存这次实验", { exact: true }).waitFor();
  await p.screenshot({
    path: out + "/final-mobile-budget-saved.png",
    fullPage: true,
  });
  await p.getByRole("link", { name: "去手册重新打开" }).click();
  await p
    .locator(".rd-entry")
    .filter({ hasText: "手机完整旅程：维修后仍需检查储备" })
    .first()
    .getByRole("link", { name: "恢复参数并重新计算" })
    .click();
  await ready();
  assert.equal(
    await p.getByLabel("可用收入（元）", { exact: true }).inputValue(),
    "2800",
  );
  checks.push(
    "390px Home exact question→budget story→edit→600 repair→full tool→save→Notebook→restore",
  );
  await p.goto(base + "/stories/loan");
  await ready();
  await p
    .getByRole("button", {
      name: "不能，净到账少于之后归还的现金，仍有成本",
      exact: true,
    })
    .click();
  await p.getByLabel("我的理解", { exact: true }).fill("贷款专题恢复验证");
  await p.getByRole("button", { name: "保存这条发现", exact: true }).click();
  await p.getByText("发现已保存", { exact: true }).waitFor();
  await p.goto(base + "/decoder/purchasing-power");
  await ready();
  await p.getByLabel("假设年通胀率（%）", { exact: true }).fill("4.2");
  await ready();
  await p.getByLabel("我的一句发现（可选）").fill("购买力专题恢复验证");
  await p.getByRole("button", { name: "保存这次发现", exact: true }).click();
  await p.getByText("已保存这次发现", { exact: true }).waitFor();
  const response = await c.request.get(base + "/api/v3/artifacts", {
    headers: { Authorization: "Bearer " + token },
  });
  const records = await response.json();
  for (const note of ["贷款专题恢复验证", "购买力专题恢复验证"]) {
    const record = records.find((e) => e.payload.note === note);
    assert.ok(record);
    const fresh = await b.newContext({ viewport: { width: 390, height: 844 } });
    await fresh.addInitScript(
      (t) => localStorage.setItem("finpilot_token", t),
      token,
    );
    const q = await fresh.newPage();
    await q.goto(base + record.url);
    await q.waitForTimeout(1200);
    assert.equal(await q.locator("textarea").last().inputValue(), note);
    if (note.startsWith("贷款"))
      assert.equal(
        await q
          .getByRole("button", {
            name: "不能，净到账少于之后归还的现金，仍有成本",
            exact: true,
          })
          .getAttribute("aria-pressed"),
        "true",
      );
    else
      assert.equal(
        await q.getByLabel("假设年通胀率（%）", { exact: true }).inputValue(),
        "4.2",
      );
    await q.screenshot({
      path:
        out +
        `/final-mobile-${note.startsWith("贷款") ? "loan" : "purchasing"}-story-restored.png`,
      fullPage: true,
    });
    await fresh.close();
    checks.push(note + ": fresh mobile browser retains note and interaction");
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "docs/redesign/gate-b/mobile-journey.json",
    JSON.stringify({ status: "passed", checks, errors }, null, 2),
  );
  console.log(JSON.stringify({ status: "passed", checks }, null, 2));
} finally {
  await b.close();
}
