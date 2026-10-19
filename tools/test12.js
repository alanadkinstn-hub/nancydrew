// copies count: debounce double-tap on +, minus removes latest (confirm if data), per-copy Delete with undo
const { chromium } = require('playwright-core');
const U=process.argv[2];const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${vp.width}]`;
const p=await (await b.newContext({viewport:vp,isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let dialogs=[],answer=false;p.on('dialog',d=>{dialogs.push(d.message());answer?d.accept():d.dismiss()});
await p.goto(U);await p.waitForSelector('.scard');await p.evaluate(async()=>{S.copies=[];S.titles={};S.wish={};await save()});
const id='gd-3',n=()=>p.evaluate(i=>copiesOf(i).length,id);
await p.goto(U+'#/s/gd');await p.waitForSelector(`[data-own="${id}"]`);const row=`.row[data-id="${id}"]`;
const plus=async()=>{await p.click(`${row} [data-own]`);const x=await p.$('.sheet [data-x=""]');if(x)await x.click();await p.waitForTimeout(150)};
ok(!(await p.$(`${row} [data-unown]`)),`${t} no minus when 0 copies`);
await p.$eval(`${row} [data-own]`,e=>{e.click();e.click();e.click()});await p.waitForTimeout(300);{const x=await p.$('.sheet [data-x=""]');if(x)await x.click()}await p.waitForTimeout(300);
ok(await n()===1,`${t} rapid triple tap adds only 1 copy (${await n()})`);
await p.waitForTimeout(800);await plus();await p.waitForTimeout(800);await plus();ok(await n()===3,`${t} deliberate taps add (${await n()})`);
ok(await p.$eval(`${row} [data-own]`,e=>e.textContent.includes('3')),`${t} shows ×3`);
await p.waitForTimeout(800);await p.click(`${row} [data-unown]`);await p.waitForTimeout(300);ok(await n()===2&&!dialogs.length,`${t} minus removes blank copy without confirm`);
await p.evaluate(async i=>{const cs=copiesOf(i);const l=cs.reduce((a,x)=>(x.created||0)>=(a.created||0)?x:a);l.notes='signed';l.created=Date.now()+5;await save()},id);
await p.waitForTimeout(800);await p.click(`${row} [data-unown]`);await p.waitForTimeout(300);ok(dialogs.length===1&&await n()===2,`${t} copy with data: confirm shown, cancel keeps it`);
answer=true;await p.waitForTimeout(800);await p.click(`${row} [data-unown]`);await p.waitForTimeout(300);ok(await n()===1&&!(await p.evaluate(()=>S.copies.some(c=>c.notes==='signed'))),`${t} confirm OK removes the most recent (with data)`);
await p.click('#toast button');await p.waitForTimeout(300);ok(await n()===2,`${t} Undo restores it`);
await p.goto(U+'#/b/'+id);await p.waitForSelector('[data-delcopy]');ok((await p.$$('[data-delcopy]')).length===2,`${t} Delete on each copy`);
answer=false;dialogs=[];const sid=await p.evaluate(()=>S.copies.find(c=>c.notes==='signed').id);await p.click(`[data-delcopy="${sid}"]`);await p.waitForTimeout(300);ok(dialogs.length===1&&await n()===2,`${t} Delete with data asks and cancel keeps`);
const bid=await p.evaluate(()=>S.copies.find(c=>!c.notes).id);await p.waitForTimeout(800);await p.click(`[data-delcopy="${bid}"]`);await p.waitForTimeout(300);ok(await n()===1&&p.url().includes('#/b/'),`${t} Delete blank copy stays on page`);
const box=await p.$eval('[data-delcopy]',e=>{const r=e.getBoundingClientRect();return r.right<=innerWidth&&r.height>=24});ok(box,`${t} Delete button fits`);
ok(!errs.length,`${t} no errors ${errs}`)}
await b.close()})();
