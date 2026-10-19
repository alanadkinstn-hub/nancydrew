// v1.7 / ND v1.1 checks, updated for the v1.9 spine picker: spine chip, number on cover, artist, ghostwriters (HB), pin tab, old-backup restore, yspine migration. Usage: node test9.js URL hb|nd [old-backup.json]
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
 await p.click('.copy');await p.waitForSelector('#spSeg');ok(!(await p.$('#spSeg .on'))&&await p.$eval('#ncSeg [data-v=""]',e=>e.classList.contains('on')),`${t} old copy defaults: no YS, number unknown`);}
await p.goto(U+'#/c/gd-3/new');await p.waitForSelector('#spSeg');await p.click('#textSeg [data-t="Revised"]');await p.click('#spSeg [data-v="Yellow"]');await p.click('#ncSeg [data-v="Yes"]');
ok(await p.$eval('#spSeg [data-v="Yellow"]',e=>e.classList.contains('on')),`${t} Yellow spine chip selects (v1.9 spine picker; old YSPC format shortcut retired)`);
await p.selectOption('#illus',{index:2});const sb=await p.$('#saveBtn');await sb.scrollIntoViewIfNeeded();await sb.click();await p.waitForTimeout(400);
const c=await p.evaluate(()=>S.copies.filter(c=>c.bookId==='gd-3').pop());ok(c&&c.spine==='Yellow'&&c.numCover==='Yes'&&c.illus&&!('yspine' in c),`${t} saved yspine/numCover/illus`);
await p.goto(U+'#/s/gd');await p.waitForSelector('.row[data-id="gd-3"]');ok(await p.$eval('.row[data-id="gd-3"]',e=>!!e.querySelector('.b.sp[data-spine="Yellow"]')),`${t} spine badge`);
await p.click('.chip[data-f="sp:Yellow"]');await p.waitForTimeout(100);ok((await p.$$eval('.row',r=>r.map(x=>x.dataset.id).join()))==='gd-3',`${t} Yellow spine filter`);
await p.goto(U+'#/b/gd-3');await p.waitForSelector('.copy');ok(await p.$eval('#app',e=>e.textContent.includes('yellow spine')&&e.textContent.includes('number on cover')),`${t} copy summary`);
if(APP==='hb'){ok(await p.$eval('#app',e=>e.textContent.includes('Leslie McFarlane')&&e.textContent.includes('Alistair Hunter')),`${t} HB ghostwriter + reviser`);
 await p.goto(U+'#/b/gd-17');await p.waitForSelector('#rateCard');ok(await p.$eval('#app',e=>e.textContent.includes('hardyboys.us credits John Button')),`${t} disagreement note`);
 await p.goto(U+'#/search');await p.fill('#q','buranelli');await p.waitForTimeout(200);ok((await p.$$eval('#res .row',r=>r.length))>=7,`${t} search by ghostwriter`);}
await p.goto(U+'#/more');await p.waitForSelector('#csvCopies');const [d1]=await Promise.all([p.waitForEvent('download'),p.click('#csvCopies')]);const csv=fs.readFileSync(await d1.path(),'utf8');ok(csv.includes('Spine color')&&csv.includes(',Yellow,')&&csv.includes('Number on cover'),`${t} copies CSV columns`);
const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#csvList')]);const c2=fs.readFileSync(await d2.path(),'utf8');ok(c2.includes('Ghostwriter'),`${t} checklist CSV ghostwriter`);
const [d3]=await Promise.all([p.waitForEvent('download'),p.click('#bkLite')]);const j=JSON.parse(fs.readFileSync(await d3.path(),'utf8'));ok(j.copies.some(c=>c.spine==='Yellow'&&c.numCover==='Yes'),`${t} backup has new fields`);
{const mk=(id,ys)=>({id:'m'+id+ys,bookId:id,text:'',format:'',dj:true,yspine:ys,created:1});const bk={app:APP==='hb'?'hardyboys-catalog':'nancydrew-catalog',version:1,copies:[mk('gd-20',true),mk('gd-21',false)],wish:{},custom:[],titles:{},rank:{}};fs.writeFileSync('/tmp/mig.json',JSON.stringify(bk));
 await p.goto(U+'#/more');await p.waitForSelector('#imp');await p.click('#imp');await p.click('[data-m="replace"]');await p.setInputFiles('#importFile','/tmp/mig.json');await p.waitForTimeout(600);
 const m=await p.evaluate(()=>S.copies.map(c=>[c.bookId,c.spine||'',('yspine' in c)]));ok(JSON.stringify(m)===JSON.stringify([['gd-20','Yellow',false],['gd-21','',false]]),`${t} yspine migration ${JSON.stringify(m)}`);
 await p.evaluate(async()=>{S.copies[1].yspine=true;await save()});await p.goto(U);await p.reload();await p.waitForSelector('.scard');ok(await p.evaluate(()=>S.copies[1].spine==='Yellow'&&!('yspine' in S.copies[1])),`${t} stored-data migration on load`);}
ok(!errs.length,`${t} no errors ${errs}`);await ctx.close()}
await b.close()})();
