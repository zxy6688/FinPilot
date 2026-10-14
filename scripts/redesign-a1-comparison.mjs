import {chromium, expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import {readFile, writeFile} from 'node:fs/promises';
const dir='docs/redesign/a1/';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:5176');await p.waitForLoadState('networkidle');
 await expect(p.locator('.rd-bottom-nav')).toBeVisible();
 await p.screenshot({path:dir+'screenshots/home-mobile-first-screen.png'});
 await p.setViewportSize({width:1440,height:900});
 await p.goto('http://127.0.0.1:5176/fin-design');await p.waitForLoadState('networkidle');
 for(let i=0;i<3;i++) await p.locator('.rd-sheet').nth(i).screenshot({path:dir+`screenshots/fin-${['views','expressions','actions'][i]}.png`});
 const sources=[
 ['已认可主视觉 / 概念图','docs/redesign/visual_refs/02_APPROVED_RICH_DIRECTION.png','视觉方向参照；其中的文案与数字不是当前产品事实。'],
 ['Gate A / 原运行截图','docs/redesign/screenshots/home-first-screen.png','已被用户拒绝的版本，原图保持不变。'],
 ['Gate A1 / 当前运行截图',dir+'screenshots/home-first-screen.png','真实 1440×900 页面，等待人工审查。']
 ];
 const panels=await Promise.all(sources.map(async([title,path,note])=>`<section><h2>${title}</h2><p>${note}</p><img src="data:image/png;base64,${(await readFile(path)).toString('base64')}"/></section>`));
 const html=`<!doctype html><meta charset="utf-8"><title>FinPilot Gate A1 · 三方视觉对照</title><style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#f4f7f2;color:#28473e;font-family:'Microsoft YaHei',sans-serif}h1{font-size:27px;margin:0 0 8px}p{font-size:13px;color:#5d7368}main{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}section{background:white;border:1px solid #ccdace;border-radius:12px;padding:14px;align-self:start}h2{font-size:20px;margin:4px 0}img{display:block;width:100%;height:auto;margin-top:16px}footer{padding-top:20px;font-size:14px}</style><h1>FinPilot · 已认可方向 / Gate A / Gate A1</h1><p>并排图仅等比缩放用于对照；原始分辨率文件均附在审查包内。此图不代表视觉验收通过。</p><main>${panels.join('')}</main><footer>AWAITING HUMAN GATE A1 REVIEW · 无 Gate B 开发、无部署、无提交或推送</footer>`;
 await writeFile(dir+'comparison.html',html);
 await p.setViewportSize({width:2400,height:600});await p.setContent(html);await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await p.screenshot({path:dir+'comparison.png',fullPage:true});
 console.log('Comparison and 4 dedicated screenshots captured');
} finally {await b.close();}
