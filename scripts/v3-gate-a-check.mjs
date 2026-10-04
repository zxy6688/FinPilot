import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/screenshots/v3';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',locale:'zh-CN'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{await page.goto('http://127.0.0.1:5176/');await expect(page.locator('.star')).toHaveCount(7);await expect(page.locator('.today-focus')).toHaveCount(1);await page.screenshot({path:out+'/gate-a-home-desktop.png',fullPage:true});await page.locator('.star').first().focus();await page.keyboard.press('Enter');await expect(page.getByLabel('主题速览',{exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByLabel('主题速览',{exact:true})).toHaveCount(0);
await page.locator("h1").click();
for(const width of [375,390,430,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);if(width===390)await page.screenshot({path:out+'/gate-a-home-mobile.png',fullPage:true});}
expect(errors).toEqual([]);await writeFile('docs/v3-gate-a-check.json',JSON.stringify({checks:['Single Today task','Seven real topic nodes','Keyboard topic panel and Esc','375/390/430/768 no horizontal overflow'],errors},null,2));console.log('Gate A browser checks passed');}finally{await browser.close();}
