// printing code field (restored HB v1.17 / ND v1.9): optional, form, summary, search, CSV, JSON backup, old backup restores
const { chromium } = require('playwright-core');
const U=process.argv[2];const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${vp.width}]`;
const p=await (await b.newContext({viewport:vp,isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(U);await p.waitForSelector('.scard');
await p.evaluate(async()=>{S.copies=[];S.titles={};await save()});
await p.goto(U+'#/c/gd-1/new');await p.waitForSelector('#pcode');
ok(await p.$eval('#pcode',e=>e.value===''&&/^e\.g\./.test(e.placeholder)),`${t} field present, optional, placeholder`);
await p.fill('#pcode','1927A-1');await p.click('#saveBtn');await p.waitForTimeout(400);
ok(await p.evaluate(()=>S.copies[0]&&S.copies[0].pcode==='1927A-1'),`${t} saved`);
await p.goto(U+'#/b/gd-1');await p.waitForTimeout(400);ok((await p.textContent('#app')).includes('printing code 1927A-1'),`${t} on copy summary`);
await p.goto(U+'#/search');await p.waitForSelector('#q');await p.fill('#q','1927a-1');await p.waitForTimeout(500);ok(!!(await p.$('.row[data-id="gd-1"]')),`${t} searchable`);
const out=await p.evaluate(()=>{const o=[];window.download=(n,x)=>o.push(x);exportCopiesCSV();exportJSON(false);return o});
ok(/Printing code/.test(out[0])&&out[0].includes('1927A-1'),`${t} CSV`);ok(JSON.parse(out[1]).copies[0].pcode==='1927A-1',`${t} JSON backup`);
const old=JSON.parse(out[1]);for(const c of old.copies)delete c.pcode;
await p.evaluate(async j=>{await importJSON(new File([j],'b.json'),'replace')},JSON.stringify(old));await p.waitForTimeout(300);
ok(await p.evaluate(()=>S.copies.length===1&&!S.copies[0].pcode),`${t} old backup without field restores`);
await p.goto(U+'#/c/gd-1/'+await p.evaluate(()=>S.copies[0].id));await p.waitForSelector('#pcode');ok(await p.$eval('#pcode',e=>e.value===''),`${t} old copy edits fine`);
const kb=JSON.parse(out[1]);kb.copies[0].pcode='X9-KEEP';
await p.evaluate(async j=>{await importJSON(new File([j],'b.json'),'replace')},JSON.stringify(kb));await p.waitForTimeout(300);
await p.goto(U+'#/b/gd-1');await p.waitForTimeout(400);ok((await p.textContent('#app')).includes('printing code X9-KEEP'),`${t} stored value shows again`);
await p.goto(U+'#/c/gd-1/'+await p.evaluate(()=>S.copies[0].id));await p.waitForSelector('#pcode');ok(await p.$eval('#pcode',e=>e.value==='X9-KEEP'),`${t} stored value in form`);
await p.click('#saveBtn');await p.waitForTimeout(400);ok(await p.evaluate(()=>S.copies[0].pcode==='X9-KEEP'),`${t} survives re-save`);
await p.reload();await p.waitForTimeout(500);ok(await p.evaluate(()=>S.copies[0].pcode==='X9-KEEP'),`${t} survives reload`);
ok(!errs.length,`${t} no errors ${errs}`)}
await b.close()})();
