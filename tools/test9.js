// v1.7 / ND v1.1 checks: yellow spine, number on cover, artist, ghostwriters (HB), pin tab, old-backup restore.
const { chromium } = require('playwright-core'); const fs=require('fs');
const [U,APP,OLD]=process.argv.slice(2);const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${APP} ${vp.width}]`;
const ctx=await b.newContext({viewport:vp,isMobile:true,hasTouch:true,acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto(U);await p.waitForSelector('.scard');
ok(await p.$eval('nav.tabs a[data-t="wish"]',e=>e.textContent.includes('📌')&&!e.textContent.includes('★')),`${t} pin tab`);
if(OLD){const old=JSON.parse(fs.readFileSync(OLD,'utf8'));await p.goto(U+'#/more');await p.waitForSelector('#imp');await p.click('#imp');await p.click('[data-m="replace"]');await p.setInputFiles('#importFile',OLD);await p.waitForTimeout(600);
 ok(await p.evaluate(n=>S.copies.length===n,old.copies.length),`${t} old backup restores (${old.copies.length} copies)`);
 const id=old.copies[0].bookId;await p.goto(U+'#/b/'+id);await p.waitForSelector('.copy');ok(true,`${t} old copy renders`);
 await p.click('.copy');await p.waitForSelector('#ysSeg');ok(await p.$eval('#ysSeg [data-v="0"]',e=>e.classList.contains('on'))&&await p.$eval('#ncSeg [data-v=""]',e=>e.classList.contains('on')),`${t} old copy defaults: no YS, number unknown`);}
await p.goto(U+'#/c/gd-3/new');await p.waitForSelector('#ysSeg');await p.click('#textSeg [data-t="Revised"]');await p.click('#ysSeg [data-v="1"]');await p.click('#ncSeg [data-v="Yes"]');
const fmt=await p.$eval('#format',e=>e.value);ok(APP==='nd'?/YSPC/.test(fmt):fmt==='',`${t} yellow spine shortcut format="${fmt}"`);
await p.selectOption('#illus',{index:2});const sb=await p.$('#saveBtn');await sb.scrollIntoViewIfNeeded();await sb.click();await p.waitForTimeout(400);
const c=await p.evaluate(()=>S.copies.filter(c=>c.bookId==='gd-3').pop());ok(c&&c.yspine===true&&c.numCover==='Yes'&&c.illus,`${t} saved yspine/numCover/illus`);
await p.goto(U+'#/s/gd');await p.waitForSelector('.row[data-id="gd-3"]');ok(await p.$eval('.row[data-id="gd-3"]',e=>e.textContent.includes('YS')),`${t} YS badge`);
await p.click('.chip[data-f="ys"]');await p.waitForTimeout(100);ok((await p.$$eval('.row',r=>r.map(x=>x.dataset.id).join()))==='gd-3',`${t} Yellow spine filter`);
await p.goto(U+'#/b/gd-3');await p.waitForSelector('.copy');ok(await p.$eval('#app',e=>e.textContent.includes('yellow spine')&&e.textContent.includes('number on cover')),`${t} copy summary`);
if(APP==='hb'){ok(await p.$eval('#app',e=>e.textContent.includes('Leslie McFarlane')&&e.textContent.includes('Alistair Hunter')),`${t} HB ghostwriter + reviser`);
 await p.goto(U+'#/b/gd-17');await p.waitForSelector('#rateCard');ok(await p.$eval('#app',e=>e.textContent.includes('hardyboys.us credits John Button')),`${t} disagreement note`);
 await p.goto(U+'#/search');await p.fill('#q','buranelli');await p.waitForTimeout(200);ok((await p.$$eval('#res .row',r=>r.length))>=7,`${t} search by ghostwriter`);}
await p.goto(U+'#/more');await p.waitForSelector('#csvCopies');const [d1]=await Promise.all([p.waitForEvent('download'),p.click('#csvCopies')]);const csv=fs.readFileSync(await d1.path(),'utf8');ok(csv.includes('Yellow spine')&&csv.includes('Number on cover'),`${t} copies CSV columns`);
const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#csvList')]);const c2=fs.readFileSync(await d2.path(),'utf8');ok(c2.includes('Ghostwriter'),`${t} checklist CSV ghostwriter`);
const [d3]=await Promise.all([p.waitForEvent('download'),p.click('#bkLite')]);const j=JSON.parse(fs.readFileSync(await d3.path(),'utf8'));ok(j.copies.some(c=>c.yspine===true&&c.numCover==='Yes'),`${t} backup has new fields`);
ok(!errs.length,`${t} no errors ${errs}`);await ctx.close()}
await b.close()})();
