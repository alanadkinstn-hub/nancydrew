// Nancy Drew-specific checks: collector fields, ghostwriter filters, backup schema, pin icons, no errors.
const { chromium } = require('playwright-core'); const fs=require('fs');
const U='http://localhost:8766/';const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${vp.width}]`;
const ctx=await b.newContext({viewport:vp,isMobile:true,hasTouch:true,acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForSelector('.scard');
ok((await p.title())==='Nancy Drew Collection'&&(await p.textContent('#title'))==='Nancy Drew Collection',`${t} title + header`);
ok(await p.$eval('nav.tabs a[data-t="wish"]',e=>e.textContent.includes('📌')&&!e.textContent.includes('★')),`${t} wishlist tab uses pin`);
ok(await p.evaluate(()=>SERIES[0].books.filter(b=>b.ry).length===34&&SERIES[0].books.length===56),`${t} 56 originals, 34 revised`);
await p.goto(U+'#/s/gd');await p.waitForSelector('.chip[data-f="benson"]');await p.click('.chip[data-f="benson"]');await p.waitForTimeout(100);
const ben=await p.$$eval('.row',r=>r.length);ok(ben===23,`${t} Benson filter shows 23 (got ${ben})`);
await p.click('.chip[data-f="newstory"]');await p.waitForTimeout(100);ok((await p.$$eval('.row',r=>r.map(x=>x.dataset.id).join()))==='gd-2,gd-4,gd-5,gd-11,gd-12,gd-14,gd-17,gd-18',`${t} new-story filter`);
await p.goto(U+'#/c/gd-1/new');await p.waitForSelector('#illus');await p.click('#textSeg [data-t="Original"]');await p.click('#djSeg [data-v="1"]');
ok(await p.isVisible('#djStyle'),`${t} DJ style shows when DJ=yes`);
await p.selectOption('#illus','Russell H. Tandy');await p.selectOption('#djStyle',{index:1});await p.selectOption('#endpapers',{label:'Orange silhouette (c.1932–47)'});await p.selectOption('#format',{label:'Blue, orange silhouette (1932–46)'});
const bb=await p.$('#saveBtn');await bb.scrollIntoViewIfNeeded();await bb.click();await p.waitForTimeout(400);
const c=await p.evaluate(()=>S.copies.find(c=>c.bookId==='gd-1'));ok(c&&c.illus==='Russell H. Tandy'&&c.djStyle==='White spine'&&c.text==='Original',`${t} copy saved with ND fields`);
await p.goto(U+'#/b/gd-1');await p.waitForSelector('.copy');ok(await p.$eval('.copy',e=>e.textContent.includes('Tandy art')),`${t} copy summary shows artist`);
ok(await p.$eval('#app',e=>e.textContent.includes('Mildred Wirt (Benson)')),`${t} ghostwriter shown`);
await p.goto(U+'#/more');await p.waitForSelector('#bkLite');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#bkLite')]);const j=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
ok(j.app==='nancydrew-catalog'&&j.series==='nancydrew'&&j.version===1&&Array.isArray(j.copies)&&j.copies[0].illus,`${t} backup schema + series field`);
const [dl2]=await Promise.all([p.waitForEvent('download'),p.click('#csvList')]);const csv=fs.readFileSync(await dl2.path(),'utf8');ok(csv.includes('Ghostwriter')&&csv.includes('Walter Karig'),`${t} checklist CSV has ghostwriters`);
await p.goto(U+'#/search');await p.fill('#q','karig');await p.waitForTimeout(200);ok((await p.$$eval('#res .row',r=>r.length))===3,`${t} search by ghostwriter`);
ok(!errs.length,`${t} no errors ${errs}`);await ctx.close()}
await b.close()})();
