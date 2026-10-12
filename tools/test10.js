// v1.4: picture-cover images in revised contexts; user cover still wins.
const { chromium } = require('playwright-core');
const U=process.argv[2]||'http://localhost:8766/';const ok=(c,m)=>{if(!c){console.log('FAIL:',m);process.exitCode=1}else console.log('PASS:',m)};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const vp of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){const t=`[${vp.width}]`;
const p=await (await b.newContext({viewport:vp,isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(U);await p.waitForSelector('.scard');
const pc=await p.evaluate(()=>Object.keys(COVERS).filter(k=>/^gd-\d+$/.test(k)&&COVERS[k].pc&&+k.slice(3)<=56).length);ok(pc===56,`${t} 56 picture covers (${pc})`);
await p.evaluate(async()=>{S.titles={'gd-1':{rOT:8,rRT:9},'gd-45':{rating:7},'gd-14':{rOT:5,rRT:6}};await save()});
await p.goto(U+'#/ratings');await p.waitForSelector('#basisChips');await p.click('[data-basis="rt"]');await p.waitForTimeout(300);
const src=async id=>p.$eval(`.row[data-id="${id}"] img.thumb`,e=>e.dataset.src||e.src).catch(()=>'');
ok((await src('gd-1')).includes('15147866'),`${t} Revised ranking: #1 shows picture cover`);
ok((await src('gd-45')).includes('15140532'),`${t} Revised ranking: #45 picture cover`);
ok((await src('gd-14')).includes('15148073'),`${t} Revised ranking: #14 flashlight fallback`);
await p.click('[data-basis="ot"]');await p.waitForTimeout(300);ok((await src('gd-1')).includes('15150724'),`${t} Original ranking: #1 original jacket`);
await p.click('[data-basis="rt"]');await p.waitForTimeout(300);await p.click('.row[data-id="gd-1"]');await p.waitForSelector('#coverCap');
ok(await p.$eval('#bigcover',e=>e.src.includes('15147866')),`${t} book page from Revised context shows picture cover`);
ok(await p.$eval('#eraSeg',e=>e.textContent.includes('Picture cover')&&e.textContent.includes('Original jacket')),`${t} era chooser labels`);
ok(await p.$eval('#coverCap',e=>e.textContent.includes('yellow spine')),`${t} caption`);
await p.evaluate(async()=>{S.titles['gd-1'].cover='data:image/gif;base64,R0lGODlhAQABAAAAACw=';await save()});
await p.goto(U+'#/ratings');await p.waitForSelector('#basisChips');await p.click('[data-basis="rt"]');await p.waitForTimeout(300);
ok((await p.$eval('.row[data-id="gd-1"] img.thumb',e=>e.src)).startsWith('data:'),`${t} user cover override wins`);
ok(!errs.length,`${t} no errors ${errs}`)}
await b.close()})();
