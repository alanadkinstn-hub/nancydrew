const { chromium } = require('playwright-core');
const U='http://localhost:8766/';const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667}]){const t=`[${vp.width}]`;
const p=await (await b.newContext({viewport:vp,isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ids=async bs=>{await p.goto(U+'#/ratings');await p.waitForSelector('#basisChips');await p.click(`[data-basis="${bs}"]`);await p.waitForTimeout(150);return p.$$eval('#app .row',r=>r.map(x=>x.dataset.id))};
const rate=async(id,k,n)=>{await p.goto(U+'#/b/'+id);await p.waitForSelector('#rateCard');await p.click(`[data-rate="${k}:${n}"]`);await p.waitForSelector(`[data-rate="${k}:${n}"].on`)};
await rate('gd-55','rating',1);await rate('gd-45','rating',10);await rate('gd-3','rOT',1);await rate('gd-3','rRT',10);await rate('gd-12','rRT',1);await rate('files-5','rating',1);await rate('digest-70','rating',10);
let best=await ids('best');
for(const id of ['gd-55','gd-45','gd-3','gd-12','files-5','digest-70'])ok(best.includes(id),`${t} ${id} in My Ratings (best)`);
ok(best[best.length-1]==='gd-55'||best.slice(-3).includes('gd-55'),`${t} rating-1 books at the bottom`);
ok(await p.$eval('.sub-h[data-score="1"]',e=>e.textContent.includes('3 books')),`${t} ★1 group lists gd-55, gd-12, files-5`);
let ot=await ids('ot');ok(ot.join()==='gd-3',`${t} OT basis: gd-3 (OT 1) shown`);
ok(await p.$eval('#basisNote',e=>e.textContent.includes('4 other rated books are hidden')),`${t} OT basis explains hidden single-rated books`);
await p.click('#toBest');await p.waitForTimeout(150);ok(await p.$eval('[data-basis="best"]',e=>e.classList.contains('on')),`${t} link switches to Best`);
let rt=await ids('rt');ok(rt.join()==='gd-3,gd-12',`${t} RT basis: 10 then 1`);
await p.goto(U+'#/s/gd');await p.waitForSelector('.row[data-id="gd-55"]');
ok(await p.$eval('.row[data-id="gd-55"] .badge, .row[data-id="gd-55"]',e=>e.textContent.includes('★1')),`${t} list badge ★1 on #55`);
ok(await p.$eval('[data-star="gd-55"]',e=>e.textContent==='📌'&&!e.textContent.includes('★')),`${t} wishlist button uses 📌, not a star`);
// top rated filter includes 1
await p.waitForSelector('.chip[data-f="top"]',{timeout:3000}).catch(()=>{});const tr=await p.$('.chip[data-f="top"]');ok(!!tr,'top chip');if(tr){await tr.click();await p.waitForTimeout(150);ok((await p.$$eval('.row',r=>r.map(x=>x.dataset.id))).includes('gd-55'),`${t} Top rated filter includes rating 1`)}
// migration keeps 1 (dual) and single on 39-58
await p.evaluate(async()=>{S.titles={'gd-2':{rating:1},'gd-50':{rating:1}};migrateTitles(S.titles);await save()});
ok(await p.evaluate(()=>S.titles['gd-2'].rOT===1&&S.titles['gd-50'].rating===1),`${t} migration preserves rating 1`);
best=await ids('best');ok(best.includes('gd-2')&&best.includes('gd-50'),`${t} migrated 1s visible`);
ok(!errs.length,`${t} no errors ${errs}`)}
await b.close()})();
