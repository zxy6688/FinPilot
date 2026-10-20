import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.TRIAL_URL;
if(!base?.startsWith('https://'))throw Error('TRIAL_URL must be HTTPS');
const code=(await fs.readFile('../trial-runtime/INVITATION.txt','utf8')).split(/\r?\n/)[1];
const out='docs/deployment/screenshots';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage(),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{
 await p.waitForLoadState('networkidle',{timeout:60000});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0),{},{timeout:60000});
 for(const panel of await p.locator('.gb-results,.rd-output-panel').all())await expect(panel).toHaveAttribute('aria-busy','false',{timeout:30000});
};
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await p.locator('[name=code]').fill(code);await p.getByRole('button',{name:'进入体验'}).click();await p.locator('.rd-hero').waitFor({timeout:60000});
 await expect(p.getByText('测试版本 · AI Demo',{exact:false})).toBeVisible();
 await ready();await p.screenshot({path:out+'/home-desktop.png',fullPage:true});
 const health=await ctx.request.get(base+'/api/health');assert.equal((await health.json()).ai_mode,'demo');
 await p.goto(base+'/login');await expect(p.getByRole('button',{name:'填入体验账户'})).toHaveCount(0);
 await p.getByRole('button',{name:'第一次来？注册账户'}).click();
 const email='browser-trial-'+Date.now()+'@example.test',password='synthetic-trial-123';
 await p.locator('[name=name]').fill('队友试用测试');await p.locator('[name=email]').fill(email);await p.locator('[name=password]').fill(password);await p.getByRole('button',{name:/创建账户/}).click();await p.waitForURL(base+'/');
 for(const path of ['/stories/budget','/decoder/purchasing-power','/stories/bonds','/stories/etf','/stories/loan','/money-lab/savings','/money-lab/compound','/money-lab/inflation','/money-lab/loan','/money-lab/budget']){
  await p.goto(base+path);await p.locator('h1').first().waitFor();await p.waitForTimeout(800);
  if(path.startsWith('/money-lab/'))await p.locator('.gb-results,.rd-output-panel').first().waitFor();
  await ready();await p.screenshot({path:out+'/'+path.replaceAll('/','-')+'.png',fullPage:true});
 }
 await p.goto(base+'/concept-studio');await expect(p.locator('.k-domain')).toHaveCount(6);
 await p.goto(base+'/money-lab/budget');await p.getByLabel('可用收入（元）',{exact:true}).fill('3100');await p.waitForTimeout(600);await p.getByLabel('这次我发现').fill('试用站保存恢复验证');
 await p.getByRole('button',{name:'保存实验',exact:true}).click();await p.getByText('已保存这次实验',{exact:true}).waitFor();
 await p.goto(base+'/profile');await p.getByLabel('查找我的记录').fill('试用站保存恢复验证');await p.locator('.rd-entry').getByRole('link',{name:'恢复参数并重新计算'}).click();await expect(p.getByLabel('可用收入（元）',{exact:true})).toHaveValue('3100');
 await p.reload();await expect(p.getByLabel('可用收入（元）',{exact:true})).toHaveValue('3100');
 checks.push('HTTPS invitation → browser registration → five stories/tools → six domains → save → My World restore → SPA refresh');
 for(const width of [375,390,430,768]){
  await p.setViewportSize({width,height:900});
  for(const path of ['/','/concept-studio','/money-lab/budget']){
   await p.goto(base+path);await p.locator('h1').first().waitFor();await p.waitForTimeout(500);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await ready();await p.screenshot({path:out+'/'+(path==='/'?'home':path.replaceAll('/','-'))+'-'+width+'.png',fullPage:true});
  }
 }
 await p.goto(base+'/concept-studio/30');await p.getByRole('button',{name:'问 Fin',exact:false}).first().click();
 await expect(p.getByRole('dialog')).toContainText('流动性');await p.getByRole('dialog').getByRole('textbox').fill('解释这个概念与相关课程的区别');
 await p.getByRole('button',{name:'发送追问',exact:true}).click();await p.locator('.gb-chat-answer').waitFor({timeout:30000});
 await p.screenshot({path:out+'/fin-demo.png',fullPage:true});checks.push('Fin contextual Demo response works');
 assert.deepEqual(errors,[]);
 checks.push('375/390/430/768 responsive pages without overflow; zero page errors');
 await fs.writeFile('docs/deployment/browser-checks.json',JSON.stringify({status:'passed',url:base,network:'Local browser through public HTTPS tunnel (not independent external probe)',checks,errors},null,2));
 console.log(JSON.stringify({status:'passed',checks}));
}catch(error){
 await p.screenshot({path:out+'/failure.png',fullPage:true});
 console.log(JSON.stringify({url:p.url(),text:(await p.locator('body').innerText()).slice(0,1200),errors}));
 throw error;
}finally{await browser.close()}
