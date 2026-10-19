// printing code field removed (v1.15 HB / v1.7 ND): no input, summary, CSV column; old data with pcode imports and is preserved quietly
const { chromium } = require('playwright-core');
const U=process.argv[2];const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${vp.width}]`;
const p=await (await b.newContext({viewport:vp,isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(U);await p.waitForSelector('.scard');
await p.evaluate(async()=>{S.copies=[];S.titles={};await save()});
const bid=await p.evaluate(()=>Object.keys(BOOK)[0]);
await p.goto(U+'#/c/'+bid+'/new');await p.waitForSelector('#saveBtn');
ok(!(await p.$('#pcode'))&&!/Printing code/.test(await p.textContent('#app')),`${t} field gone from form`);
await p.click('#saveBtn');await p.waitForTimeout(400);
ok(await p.evaluate(()=>S.copies.length===1),`${t} copy saves`);
const out=await p.evaluate(()=>{const o=[];window.download=(n,x)=>o.push(x);exportJSON(false);return o});
const old=JSON.parse(out[0]);old.copies[0].pcode='1927A-1';
await p.evaluate(async j=>{await importJSON(new File([j],'b.json'),'replace')},JSON.stringify(old));await p.waitForTimeout(300);
ok(await p.evaluate(()=>S.copies.length===1&&S.copies[0].pcode==='1927A-1'),`${t} old backup with field imports, value kept`);
await p.goto(U+'#/b/'+bid);await p.waitForTimeout(400);ok(!(await p.textContent('#app')).includes('1927A-1'),`${t} not shown on summary`);
await p.goto(U+'#/c/'+bid+'/'+await p.evaluate(()=>S.copies[0].id));await p.waitForSelector('#saveBtn');await p.click('#saveBtn');await p.waitForTimeout(400);
ok(await p.evaluate(()=>S.copies[0].pcode==='1927A-1'),`${t} editing keeps stored value`);
const o2=await p.evaluate(()=>{const o=[];window.download=(n,x)=>o.push(x);exportCopiesCSV();exportJSON(false);return o});
ok(!/Printing code/.test(o2[0])&&!o2[0].includes('1927A-1'),`${t} no CSV column`);ok(JSON.parse(o2[1]).copies[0].pcode==='1927A-1',`${t} JSON backup keeps value`);
await p.goto(U+'#/search');await p.waitForSelector('#q');await p.fill('#q','1927a-1');await p.waitForTimeout(500);ok(!(await p.$('.row[data-id="'+bid+'"]')),`${t} not searchable`);
ok(!errs.length,`${t} no errors ${errs}`)}
await b.close()})();
