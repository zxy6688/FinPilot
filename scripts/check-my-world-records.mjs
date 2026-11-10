import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage(),base='http://127.0.0.1:5176',out='docs/my-world-br/';
const errors=[];p.on('pageerror',e=>errors.push(e.message));
try {
 for(const tool of ['budget','loan','inflation','compound','savings']) {
  await p.goto(base+'/money-lab/'+tool);
  await p.getByRole('button',{name:tool==='savings'?'保存实验小票':'保存实验',exact:true}).click();
  await expect(p.getByText(tool==='savings'?'已收进发现手册':'已保存这次实验',{exact:true})).toBeVisible();
  await p.goto(base+'/profile');const card=p.locator('.mw-record').first();await card.getByRole('button',{name:'查看记录',exact:true}).click();await expect(card.locator('.mw-metrics')).toBeVisible();await card.locator('summary').click();await expect(card.locator('.mw-inputs')).toBeVisible();
  for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.screenshot({path:out+'receipt-'+tool+'-'+width+'.png',fullPage:true});}
  await card.getByRole('link',{name:'恢复参数并继续计算 →',exact:true}).click();await expect(p.locator('h1').first()).toBeVisible();
 }
 await p.goto(base+'/profile');await expect(p.locator('.mw-record')).toHaveCount(5);const before=await p.locator('.mw-record').count();const first=p.locator('.mw-record').first();await first.getByRole('button',{name:'查看记录',exact:true}).click();await first.getByRole('button',{name:'删除',exact:true}).click();await first.getByRole('button',{name:'确认删除',exact:true}).click();await expect(p.locator('.mw-record')).toHaveCount(before-1);await p.reload();await expect(p.locator('.mw-record')).toHaveCount(before-1);
 await p.evaluate(()=>{const key='finpilot:redesign:gate-a:guest',records=JSON.parse(localStorage.getItem(key)||'[]');records.unshift({id:'legacy-incomplete',title:'旧格式缺字段',kind:'receipt',at:'invalid',detail:'历史记录',url:'//untrusted.example',version:'legacy',payload:{}});localStorage.setItem(key,JSON.stringify(records));});await p.reload();const legacy=p.locator('.mw-record').filter({hasText:'旧格式缺字段'});await expect(legacy.getByText('原页面地址无效')).toBeVisible();await legacy.getByRole('button',{name:'查看记录',exact:true}).click();await expect(legacy.getByText(/旧记录未包含/)).toBeVisible();await expect(legacy.locator('a')).toHaveCount(0);await p.screenshot({path:out+'legacy-invalid.png',fullPage:true});
 await p.goto(base+'/concept-studio/17');const predict=p.locator('.cm-prediction button').first();await expect(predict).toHaveCSS('color','rgb(31, 63, 53)');await predict.focus();await p.keyboard.press('Enter');await expect(predict).toHaveAttribute('aria-pressed','true');await p.locator('.cm-primary').click();await expect(p.locator('.cm-results table')).toBeVisible();for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.screenshot({path:out+'micro-final-'+width+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);await fs.writeFile(out+'record-tests.json',JSON.stringify({passed:['five real tools save/preview/input detail/restore','delete survives refresh','legacy missing fields graceful fallback; invalid URL blocked','prediction readable and keyboard-operable'],errors},null,2));console.log('PASS five receipt formats, deletion persistence, legacy invalid URL and keyboard/contrast');
}finally{await b.close()}
