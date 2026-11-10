import ts from "../frontend/node_modules/typescript/lib/typescript.js";
import fs from "node:fs";
import assert from "node:assert/strict";
const source = fs.readFileSync("frontend/src/fin-pet/PetDirector.ts", "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { direct, initialPet } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
let s = direct(
  initialPet,
  { type: "ACTION", action: "Jump", source: "user" },
  1000,
);
assert.equal(s.action, "Jump");
assert.equal(
  direct(s, { type: "ACTION", action: "Wave", source: "user" }, 1100),
  s,
);
assert.equal(
  direct(s, { type: "ACTION", action: "Wave", source: "ambient" }, 1500),
  s,
);
assert.equal(direct(s, { type: "FINISHED", sequence: 0 }), s);
s = direct(s, { type: "FINISHED", sequence: s.sequence });
assert.equal(s.action, "Idle");
s = direct(s, { type: "ACTION", action: "Sit", source: "user" }, 3000);
s = direct(s, { type: "FINISHED", sequence: s.sequence });
assert.equal(s.action, "Seated");
s = direct(s, { type: "ACTION", action: "Sleep", source: "user" }, 4000);
assert.equal(s.resting, "Sleep");
assert.equal(
  direct(s, { type: "ACTION", action: "Wave", source: "ambient" }, 50000),
  s,
);
s = direct(s, { type: "ACTION", action: "Wake", source: "user" }, 60000);
s = direct(s, { type: "FINISHED", sequence: s.sequence });
assert.equal(s.action, "Idle");
assert.equal(
  direct(s, { type: "ACTION", action: "Unknown", source: "user" }, 70000),
  s,
);
s = direct(s, { type: "RESET" });
assert.equal(s.action, "Idle");
assert.equal(s.lastUserAt, 0);
console.log(
  "PASS 11 director assertions: priority/cooldown/stale completion/sit/sleep/wake/reset",
);
let sleep=direct(initialPet,{type:'ACTION',action:'Sleep',source:'user'},100000);
assert.equal(sleep.action,'Sit');
sleep=direct(sleep,{type:'FINISHED',sequence:sleep.sequence});assert.equal(sleep.action,'LieDown');
sleep=direct(sleep,{type:'FINISHED',sequence:sleep.sequence});assert.equal(sleep.action,'Sleep');
let jumping=direct(sleep,{type:'ACTION',action:'Jump',source:'user'},101000);assert.equal(jumping.action,'Wake');
jumping=direct(jumping,{type:'FINISHED',sequence:jumping.sequence});assert.equal(jumping.action,'Jump');
jumping=direct(jumping,{type:'FINISHED',sequence:jumping.sequence});assert.equal(jumping.action,'Idle');
const touched=direct(initialPet,{type:'ACTION',action:'Pet',source:'user',contact:{x:-.7,y:-.3}},100000);assert.deepEqual(touched.contact,{x:-.7,y:-.3});
console.log('PASS 7 P0.5 assertions: sit/curl/sleep/wake/action/rest and actual contact coordinates');
