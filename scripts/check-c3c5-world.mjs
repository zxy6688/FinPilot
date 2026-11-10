import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:5176',out='docs/my-world-br/';
const knowledge=JSON.parse(await fs.readFile('content/knowledge.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext(),page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const pass=s=>{results.push(s);console.log('PASS',s)};
async function shot(name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+name+'.png',fullPage:true})}
async function go(path){await page.goto(base+path);await expect(page.locator('h1').first()).toBeVisible()}
async function calc(){await page.locator('.cm-primary').click();await expect(page.locator('.cm-results table')).toBeVisible()}
try{
 await go('/profile');await expect(page.locator('h1')).toHaveText('我的世界');await shot('guest-empty');
 for(const c of knowledge.concepts){
   await go('/concept-studio/'+c.id);
   if(c.id!==7){
     await expect(page.locator('.gb-embedded')).toHaveCount(0);
     for(let i=0;i<3;i++){await page.locator('.k-diagram button').nth(i).click();await expect(page.locator('.k-step p')).not.toHaveText('')}
     for(let i=0;i<c.quiz.options.length;i++){await page.locator('.k-quiz .k-answers button').nth(i).click();await expect(page.locator('.k-feedback')).not.toHaveText('')}
     await page.locator('.k-quiz .k-answers button').nth(c.quiz.correct_answer).click();
     await page.getByLabel('我的理解',{exact:true}).fill('审查 '+c.id+'：'+c.title);
     await page.getByRole('button',{name:'保存这次理解',exact:true}).click();
     const restore=page.getByRole('link',{name:'重新打开这次保存 →',exact:true});await expect(restore).toBeVisible();const url=await restore.getAttribute('href');
     await go(url);await expect(page.getByLabel('我的理解',{exact:true})).toHaveValue('审查 '+c.id+'：'+c.title);
     await expect(page.locator('.k-quiz .k-answers button').nth(c.quiz.correct_answer)).toHaveAttribute('aria-pressed','true');
   }
   for(const width of [1440,768,430,390,375]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow concept '+c.id+' width '+width);if(width===1440||width===390)await shot('concept-'+c.id+'-'+width)}
 }
 pass('36 concepts, 108 diagram nodes and all options; 35 generic saved/restored; five widths, 72 screenshots');
 const scenarios=[[17,'新增维修费用',0,1000,'600'],[27,'修改后的期初扣费',0,2000,'800'],[2,'假设年通胀率',0,15,'3'],[3,'对照期限',5,30,'10'],[6,'市场要求收益率',0,10,'4.5'],[28,'简化的年费率假设',0,2,'0.5']];
 for(const [id,label,min,max,normal] of scenarios){await go('/concept-studio/'+id);const input=page.getByRole('spinbutton',{name:new RegExp(label)});
   await input.fill(normal);await calc();await shot('micro-'+id);
   await input.fill(String(max));await expect(page.getByText('条件已修改，尚未重新计算。请重新比较。')).toBeVisible();await calc();
   await input.fill(String(min));await calc();await input.fill(String(max+1));await expect(input).toHaveAttribute('aria-invalid','true');await expect(page.locator('.cm-primary')).toBeDisabled();
   await input.fill('');await expect(input).toHaveAttribute('aria-invalid','true');await input.fill(normal);await expect(page.locator('.cm-primary')).toBeEnabled();
 }
 await go('/concept-studio/25');await page.getByRole('spinbutton',{name:/收入到账日/}).fill('20');await expect(page.locator('.cm-cash-summary')).toContainText('1300.00');await page.getByRole('spinbutton',{name:/收入到账日/}).fill('1');await expect(page.locator('.cm-cash-summary')).toContainText('0.00');
 pass('six API micro models: defaults/bounds/invalid/stale; cashflow day 1/day 20 arithmetic');
 await go('/concept-studio/17');await page.route('**/api/v3/tools/budget',r=>r.fulfill({status:503,contentType:'application/json',body:'{"detail":"测试网络失败"}'}));await page.locator('.cm-primary').click();await expect(page.locator('.cm-error')).toBeVisible();await expect(page.getByRole('spinbutton',{name:/新增维修费用/})).toHaveValue('600');await page.unroute('**/api/v3/tools/budget');
 await page.route('**/api/v3/tools/budget',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.continue()});await page.locator('.cm-primary').click();await page.getByRole('spinbutton',{name:/新增维修费用/}).fill('950');await expect(page.locator('.cm-primary')).toBeEnabled();await expect(page.locator('.cm-results table')).toHaveCount(0);await page.unroute('**/api/v3/tools/budget');await calc();
 await page.getByLabel('我的理解',{exact:true}).fill('微实验参数950');await page.getByRole('button',{name:'保存这次理解',exact:true}).click();await page.getByRole('link',{name:'重新打开这次保存 →',exact:true}).click();await expect(page.getByRole('spinbutton',{name:/新增维修费用/})).toHaveValue('950');
 pass('network failure, changed-input delayed response ignored, micro parameter snapshot restored');
 await go('/money-lab/budget');await page.getByLabel('可用收入（元）',{exact:true}).fill('3456');await page.getByRole('button',{name:'保存实验',exact:true}).click();await expect(page.getByText('已保存这次实验',{exact:true})).toBeVisible();
 await go('/profile');await page.getByLabel('记录类型',{exact:true}).selectOption('receipt');const card=page.locator('.mw-record').first();await card.getByRole('button',{name:'查看记录',exact:true}).click();await expect(card).toContainText('3456');await card.getByRole('button',{name:'重命名',exact:true}).click();await card.getByLabel('记录名称',{exact:true}).fill('我的预算审查记录');await card.getByRole('button',{name:'保存名称',exact:true}).click();await expect(card.locator('h3')).toHaveText('我的预算审查记录');
 for(const width of [1440,768,430,390,375]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'world overflow '+width);await shot('guest-record-'+width)}
 await card.getByRole('link',{name:'以此为 A，再试一个方案 →',exact:true}).click();await expect(page.getByLabel('可用收入（元）',{exact:true})).toHaveValue('3456');await page.getByLabel('可用收入（元）',{exact:true}).fill('4567');await page.getByRole('button',{name:'保存实验',exact:true}).click();await expect(page.getByText('已保存这次实验',{exact:true})).toBeVisible();
 await go('/profile');await page.getByLabel('记录类型',{exact:true}).selectOption('receipt');await expect(page.locator('.mw-record')).toHaveCount(2);await page.getByLabel('查找我的记录').fill('我的预算审查记录');await page.locator('.mw-record').getByRole('link',{name:'恢复参数并继续计算 →',exact:true}).click();await expect(page.getByLabel('可用收入（元）',{exact:true})).toHaveValue('3456');
 pass('guest budget save/preview/rename/search, compare and separate new snapshot, original restore');
 const accounts=[];
 for(const name of ['A','B']){const email='c3c5-'+name+'-'+Date.now()+'@example.com',password='Audit-only-2026';const res=await context.request.post(base+'/api/auth/register',{data:{email,password,name:'审查账户 '+name}});assert.equal(res.status(),201);accounts.push({token:(await res.json()).token,email,password})}
 await page.evaluate(t=>localStorage.setItem('finpilot_token',t),accounts[0].token);await go('/profile');await expect(page.locator('.mw-record')).toHaveCount(0);
 for(const c of knowledge.concepts){await go('/concept-studio/'+c.id);if(c.id===7){await expect(page.getByRole('button',{name:'提交原题作答到复习',exact:true})).toBeVisible();continue;}const submit=page.getByRole('button',{name:'记录这次作答，加入复习',exact:true});await page.locator('.k-quiz .k-answers button').nth(c.quiz.correct_answer).click();await expect(submit).toHaveCount(c.quiz.id?1:0)}
 await go('/concept-studio/17');await page.locator('.k-quiz .k-answers button').nth(1).click();await page.getByRole('button',{name:'记录这次作答，加入复习',exact:true}).click();await expect(page.getByText('本次作答已记录，并进入原有复习系统。')).toBeVisible();await page.getByLabel('我的理解',{exact:true}).fill('账户 A 的笔记');await page.getByRole('button',{name:'保存这次理解',exact:true}).click();await expect(page.getByRole('link',{name:'重新打开这次保存 →',exact:true})).toBeVisible();
 const savedUrl=await page.getByRole('link',{name:'重新打开这次保存 →',exact:true}).getAttribute('href'),entryId=new URL(base+savedUrl).searchParams.get('entry');
 await go('/profile');await expect(page.locator('.mw-record')).toHaveCount(1);await page.locator('.mw-record').getByRole('button',{name:'查看记录',exact:true}).click();await expect(page.locator('.mw-record')).toContainText('账户 A 的笔记');
 await page.route('**/api/v3/artifacts/*',r=>r.request().method()==='DELETE'?r.fulfill({status:503,contentType:'application/json',body:'{"detail":"测试删除失败"}'}):r.continue());await page.getByRole('button',{name:'删除',exact:true}).click();await page.getByRole('button',{name:'确认删除',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'测试删除失败'})).toBeVisible();await expect(page.locator('.mw-record')).toHaveCount(1);await shot('delete-failure');await page.unroute('**/api/v3/artifacts/*');await page.getByRole('button',{name:'取消',exact:true}).click();
 for(const width of [1440,390]){await page.setViewportSize({width,height:900});await shot('account-record-'+width)}
 await page.getByRole('button',{name:'学习与复习',exact:true}).click();await expect(page.getByText(/项到期/)).toBeVisible();await shot('learning-390');await page.getByRole('link',{name:'打开已有复习 →'}).click();await expect(page.locator('h1').first()).toBeVisible();
 await context.request.post(base+'/api/favorites/lesson/7',{headers:{Authorization:'Bearer '+accounts[0].token}});await go('/profile?section=saved');await expect(page.locator('.mw-saved')).toHaveCount(1);await shot('favorites-390');await page.getByRole('button',{name:'取消收藏',exact:true}).click();await expect(page.locator('.mw-saved')).toHaveCount(0);
 for(const method of ['GET','PATCH','DELETE']){const r=await context.request.fetch(base+'/api/v3/artifacts/'+entryId,{method,headers:{Authorization:'Bearer '+accounts[1].token},...(method==='PATCH'?{data:{title:'不应成功'}}:{})});assert.equal(r.status(),404)}
 await page.evaluate(t=>localStorage.setItem('finpilot_token',t),accounts[1].token);await go(savedUrl);await expect(page.getByLabel('我的理解',{exact:true})).toHaveValue('');await go('/profile');await expect(page.locator('.mw-record')).toHaveCount(0);
 pass('27 formal IDs vs nine instant-only; account save and original quiz submission; deletion failure retained; favorites; account B cannot read/rename/delete A');
 await go('/profile/history');await expect(page.locator('h1').first()).toBeVisible();for(const endpoint of ['/v3/notebook','/v3/routes','/v3/memory','/v3/moments']){assert.equal((await context.request.get(base+'/api'+endpoint,{headers:{Authorization:'Bearer '+accounts[0].token}})).status(),200)}
 for(let id=1;id<=28;id++){await go('/lessons/'+id)}for(let id=1;id<=8;id++){await go('/lab/'+id)}
 pass('history and original APIs preserved; all 28 course URLs and eight labs render');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'browser-results.json',JSON.stringify({at:new Date().toISOString(),results,errors},null,2));
}catch(e){console.error(page.url());await shot('failure');throw e}finally{await browser.close()}
