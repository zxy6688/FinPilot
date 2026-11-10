// Documentation-only capture: public website, isolated guest storage, no account writes.
import { chromium, expect } from '../../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const base='https://finpilot.cn',out='tmp/readme-capture';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await context.addInitScript(()=>localStorage.setItem('finpilot:fin-pet:prefs:v1',JSON.stringify({hidden:true})));
const page=await context.newPage(),verify=expect.configure({timeout:20000}),shots=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function ready(){await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>null))));}
async function go(path){await page.goto(base+path);await verify(page.locator('h1').first()).toBeVisible();await ready();}
async function shot(name,description,selector){await ready();await page.waitForTimeout(500);const file=out+'/'+name+'.png';if(selector)await page.locator(selector).screenshot({path:file});else await page.screenshot({path:file});const bytes=await fs.readFile(file);shots.push({name,description,url:page.url(),viewport:page.viewportSize(),selector:selector||null,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});console.log('Captured',name);}
try{
 await go('/');await shot('home-desktop','真实生产首页，访客初始状态');
 await page.locator('#exploration-question').fill('ETF 与指数基金有什么区别');await page.locator('#exploration-question').press('Enter');await verify(page.locator('.rd-question-choice')).toBeVisible();await shot('home-search','真实站内候选，提交后仍留在首页','.rd-question-choice');
 await go('/discover');await shot('discover-desktop','五篇原创专题目录');
 await go('/money-lab');await shot('money-lab-desktop','五套财务工具目录');
 await go('/money-lab/budget');await verify(page.getByRole('button',{name:'保留此方案为 A',exact:true})).toBeEnabled();await page.getByRole('button',{name:'保留此方案为 A',exact:true}).click();await page.getByLabel('可用收入（元）',{exact:true}).fill('3100');await page.waitForTimeout(1000);await page.evaluate(()=>scrollTo(0,220));await shot('budget-comparison','教学假设：2500 与 3100 收入的真实预算对比');await page.getByRole('button',{name:'保存实验',exact:true}).click();await verify(page.getByText('已保存这次实验',{exact:true})).toBeVisible();
 await go('/concept-studio');await shot('concept-studio-desktop','知识索引：领域与精选概念');
 await go('/concept-studio/7');await verify(page.getByRole('button',{name:'主动 ETF',exact:true})).toBeEnabled();await page.getByRole('button',{name:'主动 ETF',exact:true}).click();await shot('etf-matrix','交易形式与策略二维矩阵：已选主动 ETF','#etf-matrix');await page.getByLabel('用自己的话记录一个区别或仍需核对的问题').fill('教学示例：ETF 描述交易形式，指数基金描述投资策略。');await page.getByRole('button',{name:'保存笔记与互动',exact:true}).click();await verify(page.getByText(/笔记与互动状态已保存/)).toBeVisible();
 await go('/profile');await shot('my-world-desktop','真实访客笔记与预算小票，仅保存在本截图会话');const record=page.locator('.mw-record').filter({hasText:'我的预算情景'}).first();await record.getByRole('button',{name:'查看记录',exact:true}).click();await shot('my-world-receipt','预算小票实际预览，教学输入', '.mw-record:has(.mw-metrics)');
 await go('/fin-pet');await page.waitForSelector('.pet-stage[data-ready=true]',{timeout:60000});await page.getByRole('button',{name:'小窝',exact:true}).click();await page.getByRole('checkbox',{name:'围巾',exact:true}).check();await page.waitForTimeout(1200);await shot('fin-room','实际 Three.js / GLB 小窝与围巾，不是原画');
 await page.setViewportSize({width:390,height:844});await go('/');await shot('home-mobile','390px 首页，已有本会话保存结果');await go('/profile');await shot('my-world-mobile','390px 访客发现手册');
 if(errors.length)throw new Error(errors.join('\n'));
 await fs.writeFile(out+'/capture.json',JSON.stringify({capturedAt:new Date().toISOString(),sourceCommit:'ab4a29c2e6902e2cbd8736d53d8005fbc313c4e5',source:'live production; no personal/account data; guest UI operations only',floatingPet:'hidden using existing preference; actual 3D shown on dedicated Fin page',errors,shots},null,2));
}finally{await browser.close();}
