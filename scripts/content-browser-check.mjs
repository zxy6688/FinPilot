import { chromium, expect } from '../frontend/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors=[], checks=[];
page.on('pageerror', e=>errors.push(e.message));
async function go(route){await page.goto('http://127.0.0.1:5173'+route);await page.waitForLoadState('networkidle');}
function assert(ok,message){if(!ok)throw new Error(message)}
try {
 await go('/discover');
 await page.getByRole('button',{name:'真实资料',exact:true}).click();await page.waitForLoadState('networkidle');
 await expect(page.locator('.article-card')).toHaveCount(12);
 const links=await page.locator('.article-card a[target="_blank"]').evaluateAll(els=>els.map(e=>e.href));
 assert(new Set(links).size===12,'unique official deep links');
 await page.getByRole('button',{name:'原创解释',exact:true}).click();await page.waitForLoadState('networkidle');
 await expect(page.locator('.article-card')).toHaveCount(16);
 assert(await page.locator('.article-card a[target="_blank"]').count()===0,'explainer fabricated links');
 checks.push('12 REAL_WORLD / 16 EXPLAINER filters and source links');
 await go('/learn');for(const name of ['Money Basics','Personal Finance','Investment Basics','Understand Markets','Behavioral Finance']) assert((await page.locator('body').innerText()).includes(name),'missing path '+name);
 await go('/lessons/28');assert((await page.locator('body').innerText()).includes('从众'),'missing new lesson');assert(await page.locator('.quiz-card').count()===2,'new lesson questions');
 checks.push('five learning paths and new lesson with quizzes');
 await go('/topics/9');const relations=await page.locator('.relationship-svg').textContent();assert(relations.includes('通过货币政策影响'),'direction and labels');
 await page.screenshot({path:'docs/screenshots/topic-content-desktop.png',fullPage:true});checks.push('directed topic relationships');
 await go('/fintalk/1');assert((await page.locator('body').innerText()).includes('虚构学习者'),'persona label');assert((await page.locator('.reply').innerText()).includes('虚构学习者'),'reply identity');checks.push('fictional post and reply identities');
 await go('/lab/4');assert((await page.locator('body').innerText()).includes('这不意味着什么'),'lab boundary');checks.push('lab explanation and model boundary');
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/learn/5','/lessons/26','/topics/7','/topics/9','/fintalk/1']) {await go(route);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+route);}
 await page.screenshot({path:'docs/screenshots/community-content-mobile.png',fullPage:true});checks.push('new content mobile overflow');
 assert(errors.length===0,errors.join(';'));
 await writeFile('docs/content-browser-check.json',JSON.stringify({passed:checks.length,checks,errors,date:new Date().toISOString()},null,2));
 console.log(JSON.stringify({passed:checks.length,checks}));
} finally {await browser.close();}
