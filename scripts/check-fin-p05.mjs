import {chromium,expect} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const out='docs/fin-pet-p05';await fs.mkdir(out+'/screenshots',{recursive:true});await fs.mkdir(out+'/videos',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={errors:[],checks:[],performance:[],limitations:['Mobile is Chrome emulation, not physical-device heat testing.','Update timing measures JS animation work, not GPU execution.']};
async function open(mobile=false,video=false){const c=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},...(video?{recordVideo:{dir:out+'/videos',size:{width:1440,height:1000}}}:{})});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:5176/fin-pet');await p.waitForSelector('.pet-stage[data-ready="true"]');await p.waitForTimeout(700);return {c,p};}
try {
 const {c,p}=await open();
 for(const [label,file] of [['正面','front'],['三分之四侧','quarter'],['侧面','side'],['背面','back']]){await p.getByRole('button',{name:label,exact:true}).click();await p.waitForTimeout(350);await p.locator('.pet-stage').screenshot({path:`${out}/screenshots/${file}.png`});}
 await p.getByRole('button',{name:'正面',exact:true}).click();
 for(const label of ['普通','开心','困惑','困倦']){await p.getByRole('button',{name:label,exact:true}).click();await p.waitForTimeout(350);await p.locator('.pet-stage').screenshot({path:`${out}/screenshots/expression-${label}.png`});}
 await p.getByRole('button',{name:'普通',exact:true}).click();
 for(const [label,file,duration] of [['呼吸与眨眼','idle',7000],['歪头','tilt',4500],['走动','walk',6000],['轻跳','jump',4000],['摸头','pet',5000],['睡觉','sleep-wake',13000]]){
  const run=await open(false,true);await run.p.getByRole('button',{name:label,exact:true}).click();await run.p.waitForTimeout(duration);
  if(file==='sleep-wake'){await expect(run.p.locator('.pet-stage')).toHaveAttribute('data-action','Sleep');await run.p.getByRole('button',{name:'醒来',exact:true}).click();await run.p.waitForTimeout(6000);await expect(run.p.locator('.pet-stage')).toHaveAttribute('data-action','Idle');}
  report.checks.push(file+' played');const v=run.p.video();await run.c.close();await v.saveAs(`${out}/videos/${file}.webm`);await v.delete();
 }
 const turn=await open(false,true);for(let i=0;i<=120;i++){await turn.p.getByLabel('旋转角度').evaluate((e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},(-3.14+i*6.28/120).toFixed(2));await turn.p.waitForTimeout(65);}const v=turn.p.video();await turn.c.close();await v.saveAs(out+'/videos/360.webm');await v.delete();
 for(const label of ['呼吸与眨眼','走动']){await p.getByRole('button',{name:label,exact:true}).click();const first=await p.locator('canvas').evaluate(e=>Number(e.dataset.frames));const t=Date.now();await p.waitForTimeout(3000);const d=await p.locator('canvas').evaluate(e=>({...e.dataset}));report.performance.push({mode:label,fps:(Number(d.frames)-first)/((Date.now()-t)/1000),...d});}
 await c.close();
 for(const mobile of [false,true]){const run=await open(mobile);for(const [route,name] of [['/','home'],['/discover','discover'],['/money-lab','money-lab'],['/concept-studio','concept'],['/profile','my-world']]){await run.p.goto('http://127.0.0.1:5176'+route);await run.p.waitForTimeout(1400);await expect(run.p.locator('h1').first()).toBeVisible();await run.p.screenshot({path:`${out}/screenshots/${mobile?'mobile':'desktop'}-${name}.png`});report.checks.push(`${mobile?'mobile':'desktop'} ${route}`);}
 await run.p.getByRole('button',{name:'Fin 宠物设置',exact:true}).click();await expect(run.p.getByRole('dialog',{name:'Fin 宠物互动与设置'})).toBeVisible();await run.p.locator('.pet-panel').evaluate(e=>e.scrollTop=e.scrollHeight);await run.p.screenshot({path:`${out}/screenshots/${mobile?'mobile':'desktop'}-panel-bottom.png`});await run.c.close();}
} finally {await fs.writeFile(out+'/browser-report.json',JSON.stringify(report,null,2));await b.close();}
if(report.errors.length)throw new Error(report.errors.join('\n'));console.log(JSON.stringify(report,null,2));
