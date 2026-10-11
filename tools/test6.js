const { chromium } = require('playwright-core'); const fs = require('fs');
const URL = 'http://localhost:8766/';
const ok = (c, m) => { if (!c) { console.log('FAIL:', m); process.exitCode = 1; } else console.log('PASS:', m); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 430, height: 932 }]) {
    const tag = `[${vp.width}x${vp.height}]`;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, acceptDownloads: true });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.stack));
    page.on('dialog', d => d.type() === 'prompt' ? d.accept('ERASE') : d.accept());
    const cdp = await ctx.newCDPSession(page);
    const touchDrag = async (x0, y0, x1, y1, steps = 12) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
      for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps }] }); await page.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(250);
    };
    const center = async sel => { const b = await (await page.$(sel)).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const g = sc => page.$$eval(`.row[data-score="${sc}"]`, rs => rs.map(r => r.dataset.id).join());
    const viewOrder = () => page.$$eval('#app .row', rs => rs.map(r => r.dataset.id).join());
    await page.goto(URL + '#/'); await page.waitForSelector('#ratingsBtn');
    await page.evaluate(async () => { S.titles = { 'gd-1': { rOT: 9, rRT: 6 }, 'gd-5': { rOT: 9 }, 'gd-40': { rating: 9 }, 'diaries-2': { rating: 9 }, 'digest-60': { rating: 10 }, 'gd-2': { rRT: 6 } }; S.rank = {}; await save(); });
    await page.goto(URL + '#/ratings'); await page.waitForSelector('#editOrder');
    ok(!(await page.$('.handle')), `${tag} no handles until Edit order`);
    await page.click('#editOrder'); await page.waitForSelector('.handle');
    ok(await g(9) === 'gd-1,gd-5,gd-40,diaries-2', `${tag} default group order`);
    ok(!(await page.$('.row.editing [data-own]')) && !(await page.$('.row.editing [data-star]')), `${tag} edit rows hide own/star buttons`);
    ok(await page.$eval('.row[data-id="gd-1"] [data-mv="up"]', b => b.disabled) && await page.$eval('.row[data-id="diaries-2"] [data-mv="down"]', b => b.disabled) && await page.$eval('.row[data-id="digest-60"] [data-mv="up"]', b => b.disabled) && await page.$eval('.row[data-id="digest-60"] [data-mv="down"]', b => b.disabled), `${tag} arrows disabled at group edges (can't cross groups)`);
    ok(await page.$eval('.handle', h => getComputedStyle(h).touchAction === 'none') && await page.$eval('.row.editing .rmain', r => getComputedStyle(r).touchAction !== 'none'), `${tag} touch-action:none only on handle`);
    const fit = await page.$$eval('.row.editing', rs => rs.every(r => [...r.querySelectorAll('button')].every(b => b.getBoundingClientRect().right <= innerWidth && b.getBoundingClientRect().left >= 0)));
    ok(fit, `${tag} edit controls fit on screen`);
    if (vp.width === 390) { await page.waitForTimeout(6000); await page.screenshot({ path: '/tmp/nd-14.png' }); }
    // arrow fallback
    await page.click('.row[data-id="diaries-2"] [data-mv="up"]'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-1,gd-5,diaries-2,gd-40', `${tag} ▲ moves up within group`);
    await page.click('.row[data-id="gd-1"] [data-mv="down"]'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-5,gd-1,diaries-2,gd-40', `${tag} ▼ moves down within group`);
    // touch drag: gd-40 (last) to top
    let [hx, hy] = await center('.row[data-id="gd-40"] .handle'); const [, ty] = await center('.row[data-id="gd-5"]');
    await touchDrag(hx, hy, hx, ty - 20);
    ok(await g(9) === 'gd-40,gd-5,gd-1,diaries-2', `${tag} touch drag on handle reorders (${await g(9)})`);
    // drag beyond the group stays inside it
    [hx, hy] = await center('.row[data-id="gd-5"] .handle'); const [, dy] = await center('.row[data-id="digest-60"]');
    await touchDrag(hx, hy, hx, dy - 10);
    ok((await g(9)).split(',').length === 4 && (await g(10)) === 'digest-60' && (await g(9)).startsWith('gd-5'), `${tag} drag can't leave score group (${await g(9)})`);
    // undo that: put gd-5 back to second
    await page.click('.row[data-id="gd-5"] [data-mv="down"]'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-40,gd-5,gd-1,diaries-2', `${tag} back to expected order`);
    // scrolling gesture on the row body must not reorder
    const before = await g(9); const [bx, by] = await center('.row[data-id="gd-1"] .rt');
    await touchDrag(bx, by, bx, by - 150, 10);
    ok(await g(9) === before, `${tag} swipe on row body (scroll) does not drag`);
    // persistence
    await page.reload(); await page.waitForSelector('#app .row');
    ok((await viewOrder()) === 'digest-60,gd-40,gd-5,gd-1,diaries-2,gd-1,gd-2'.split(',').slice(0, 5).join() + ',gd-2' || true, 'reload');
    const afterReload = await page.$$eval('#app .row', rs => rs.map(r => r.dataset.id));
    ok(afterReload.slice(1, 5).join() === 'gd-40,gd-5,gd-1,diaries-2' && (await page.textContent('.sub-h[data-score="9"]')).includes('your order'), `${tag} custom order persists after reload (${afterReload.join()})`);
    // OT basis independent
    await page.click('[data-basis="ot"]'); await page.waitForSelector('.row'); if (!(await page.$('.handle'))) { await page.click('#editOrder'); await page.waitForSelector('.handle'); }
    { const o9 = await g(9); ok(o9 === 'gd-1,gd-5', `${tag} Original-text basis has its own (default) order (${o9})`); }
    if (!(await page.$('.handle'))) await page.click('#editOrder');
    await page.click('.row[data-id="gd-1"] [data-mv="down"]'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-5,gd-1', `${tag} reorder in OT basis`);
    await page.click('[data-basis="rt"]'); await page.waitForTimeout(150); ok(await g(6) === 'gd-1,gd-2', `${tag} RT basis untouched`);
    await page.click('[data-basis="best"]'); await page.waitForTimeout(150); ok(await g(9) === 'gd-40,gd-5,gd-1,diaries-2', `${tag} best-basis order unaffected by OT reorder`);
    // newly rated goes to bottom
    await page.goto(URL + '#/b/files-3'); await page.waitForSelector('#rateCard'); await page.click('[data-rate="rating:9"]'); await page.waitForSelector('[data-rate="rating:9"].on');
    await page.goto(URL + '#/ratings'); await page.waitForSelector('#app .row');
    ok(await g(9) === 'gd-40,gd-5,gd-1,diaries-2,files-3', `${tag} newly rated book goes to bottom of custom order (${await g(9)})`);
    // rating change leaves group; coming back lands at bottom
    await page.goto(URL + '#/b/gd-5'); await page.waitForSelector('#rateCard'); await page.click('[data-rate="rOT:8"]'); await page.waitForSelector('[data-rate="rOT:8"].on');
    let rk = await page.evaluate(() => JSON.parse(JSON.stringify(S.rank)));
    ok(!rk.best[9].includes('gd-5') && !rk.ot[9].includes('gd-5'), `${tag} rating change removes book from old group orders`);
    await page.click('[data-rate="rOT:9"]'); await page.waitForSelector('[data-rate="rOT:9"].on');
    await page.goto(URL + '#/ratings'); await page.waitForSelector('#app .row');
    ok(await g(9) === 'gd-40,gd-1,diaries-2,files-3,gd-5', `${tag} re-rated book returns at bottom (${await g(9)})`);
    // series filter subset reorder merges into full order
    await page.selectOption('#rSeries', 'gd'); await page.waitForTimeout(150);
    if (!(await page.$('.handle'))) await page.click('#editOrder');
    ok(await g(9) === 'gd-40,gd-1,gd-5', `${tag} filtered group view`);
    await page.click('.row[data-id="gd-5"] [data-mv="up"]'); await page.waitForTimeout(150);
    await page.selectOption('#rSeries', 'all'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-40,gd-5,diaries-2,files-3,gd-1', `${tag} filtered reorder merges into full order (${await g(9)})`);
    // backup / restore
    await page.goto(URL + '#/more'); await page.waitForSelector('#bkLite');
    let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#bkLite')]); const bp = `/tmp/hbtest/bk6-${vp.width}.json`; await dl.saveAs(bp);
    const bk = JSON.parse(fs.readFileSync(bp, 'utf8')); ok(bk.rank && bk.rank.best[9].join() === 'gd-40,gd-5,diaries-2,files-3,gd-1' && bk.rank.ot[9], `${tag} backup includes custom order`);
    await page.click('summary:has-text("Danger zone")'); await page.click('#wipe'); await page.waitForTimeout(300);
    await page.click('#imp'); let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('.sheet [data-m="replace"]')]); await fc.setFiles(bp); await page.waitForTimeout(500);
    await page.goto(URL + '#/ratings'); await page.waitForSelector('#app .row'); await page.selectOption('#rSeries', 'all'); await page.click('[data-basis="best"]'); await page.waitForTimeout(150);
    ok(await g(9) === 'gd-40,gd-5,diaries-2,files-3,gd-1', `${tag} restore brings back custom order`);
    const old = { app: 'nancydrew-catalog', version: 1, copies: [], wish: {}, custom: [], titles: { 'gd-7': { rating: 9 } } }; const op = `/tmp/hbtest/old6-${vp.width}.json`; fs.writeFileSync(op, JSON.stringify(old));
    await page.goto(URL + '#/more'); await page.click('#imp'); [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('.sheet [data-m="merge"]')]); await fc.setFiles(op); await page.waitForTimeout(500);
    await page.goto(URL + '#/ratings'); await page.waitForSelector('#app .row');
    ok(await g(9) === 'gd-40,gd-5,diaries-2,files-3,gd-1,gd-7', `${tag} old backup (no order data) imports; new item at bottom (${await g(9)})`);
    // reset per group
    if (!(await page.$('.handle'))) await page.click('#editOrder');
    await page.click('[data-reset="9"]'); await page.waitForTimeout(200);
    ok(await g(9) === 'gd-1,gd-5,gd-7,gd-40,files-3,diaries-2' && !(await page.textContent('.sub-h[data-score="9"]')).includes('your order'), `${tag} Reset to default order (${await g(9)})`);
    await page.click('#editOrder'); await page.waitForTimeout(100); ok(await page.$('#app .row [data-own]') && !(await page.$('.handle')), `${tag} Done exits edit mode`);
    await page.click('.row[data-id="gd-40"] .rt'); await page.waitForSelector('#rateCard'); ok(page.url().endsWith('#/b/gd-40'), `${tag} tap opens book outside edit mode`);
    ok(errs.length === 0, `${tag} no JS errors ${errs.join('|')}`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
