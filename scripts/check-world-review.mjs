import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage(),base='http://127.0.0.1:5176';
try {
 const r=await p.request.post(base+'/api/auth/register',{data:{email:'review-'+Date.now()+'@example.com',password:'Audit-only-2026',name:'复习流程审查'}});assert.equal(r.status(),201);const {token}=await r.json();
 await p.goto(base);await p.evaluate(t=>localStorage.setItem('finpilot_token',t),token);await p.goto(base+'/concept-studio/17');await p.locator('.k-answers button').nth(0).click();await p.getByRole('button',{name:'记录这次作答，加入复习',exact:true}).click();await expect(p.getByText('本次作答已记录，并进入原有复习系统。')).toBeVisible();
 await p.goto(base+'/profile?section=learning');await p.getByRole('link',{name:'打开已有复习 →'}).click();
 let answered=0;
 for(let i=0;i<20;i++){
  await expect(p.locator('.review-options, .review-question .secondary, .review-question a[href="/profile"]').first()).toBeVisible();
  if(await p.getByText('今天的理解，留下来了。',{exact:true}).count())break;
  const reveal=p.getByRole('button',{name:'我想过了，展开选项',exact:true});if(await reveal.count())await reveal.click();
  await p.locator('.review-options button').first().click();answered++;
  await p.getByRole('button',{name:/继续下一题|收好这次理解/}).click();
 }
 await expect(p.getByText('今天的理解，留下来了。',{exact:true})).toBeVisible();assert.ok(answered>0);await p.screenshot({path:'docs/my-world-br/review-completed.png',fullPage:true});await fs.writeFile('docs/my-world-br/review-flow.json',JSON.stringify({passed:true,answered},null,2));console.log('PASS My World to real review completed',answered);
 await p.goto(base+'/concept-studio/17');await p.getByLabel('我的理解',{exact:true}).fill('把不定期支出纳入预留，预算才不会遗漏。');await p.getByRole('button',{name:'保存这次理解',exact:true}).click();await expect(p.getByRole('link',{name:'重新打开这次保存 →',exact:true})).toBeVisible();await p.goto(base+'/profile');await p.getByRole('button',{name:'查看记录',exact:true}).click();for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.screenshot({path:'docs/my-world-br/account-ready-'+width+'.png',fullPage:true});}

}catch(e){console.log(await p.locator('body').innerText());throw e}finally{await b.close()}
