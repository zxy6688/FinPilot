import fs from 'node:fs';import assert from 'node:assert/strict';import ts from '../frontend/node_modules/typescript/lib/typescript.js';
const scripts=JSON.parse(fs.readFileSync('frontend/src/fin-pet/scripts.json'));assert.equal(scripts.length,120);assert.equal(new Set(scripts.map(s=>s.id)).size,120);assert.ok(scripts.every(s=>s.review_status==='reviewed-p0-p4-v1'));
let source=fs.readFileSync('frontend/src/fin-pet/PetScripts.ts','utf8').replace(/import library from ["']\.\/scripts\.json["'];/,'const library='+JSON.stringify(scripts)+';');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;const {chooseScript,newHistory}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const trigger of new Set(scripts.map(s=>s.trigger))){const r=chooseScript(trigger,newHistory(),true,false,Date.now(),()=>0);assert.ok(r,trigger);assert.equal(r.script.trigger,trigger)}
assert.equal(chooseScript('IDLE_BRIEF',newHistory(),false,true),null);
const h=newHistory();h.session=2;h.daily=5;const r=chooseScript('FIRST_OPEN',h,false,false);assert.equal(r.text,'');
const first=chooseScript('PET_PAT',newHistory(),true,false);const next=chooseScript('PET_PAT',first.history,true,false);assert.notEqual(first.script.id,next.script.id);
console.log('PASS 120 reviewed unique scripts; all 30 triggers selectable; input suppression; daily/session speech cap; no immediate repeat');
