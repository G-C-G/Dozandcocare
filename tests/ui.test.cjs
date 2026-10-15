/* End-to-end checks for the Doz and CoCare Trips prototype.
   Run: NODE_PATH=$(npm root -g) node tests/ui.test.cjs   (needs playwright and a Chromium) */
const { chromium } = require('playwright');
const path = require('path');
const URL = 'file://' + path.resolve(__dirname, '../app/index.html');

let pass = 0, fail = 0;
function ok(cond, name, extra) { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); } }

function lum(hex) { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const DONE = { driver: { done: true, step: 4, signedIn: true, contact: '', phase: 'contact' }, admin: { done: true, step: 6, orgOk: true, wfOk: true, contractsOk: true, tripAdded: true } };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx.addInitScript(d => { try { if (!localStorage.getItem('dozcare.ob.v1')) localStorage.setItem('dozcare.ob.v1', JSON.stringify(d)); } catch (e) {} }, DONE);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_/.test(m.text())) errors.push(m.text()); });
  const text = async sel => (await p.locator(sel).first().innerText()).replace(/\s+/g, ' ');
  const body = async () => (await p.locator('#app').innerText()).replace(/\s+/g, ' ');
  const click = (sel) => p.locator(sel).first().click();
  const saved = () => p.waitForTimeout(600);
  const fresh = async () => { await p.goto(URL); await p.evaluate(() => { document.getElementById('demo').open = true; }); await p.selectOption('#speed', '90'); await p.evaluate(() => { document.getElementById('demo').open = false; }); };
  const overflow = async (label) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); ok(o <= 1, 'no horizontal scroll: ' + label, 'overflow ' + o); };

  console.log('Contrast of design tokens (WCAG AA 4.5:1)');
  [['#18233F', '#FFFFFF'], ['#18233F', '#F3F6FB'], ['#53607C', '#FFFFFF'], ['#53607C', '#F3F6FB'], ['#233B82', '#FFFFFF'], ['#FFFFFF', '#233B82'], ['#18233F', '#E49342'],
   ['#1B6B3F', '#E3F3EA'], ['#7A4B00', '#FDF1D8'], ['#A3261E', '#FBE7E5'], ['#1A2C63', '#E8EDFA']].forEach(([a, b]) => ok(ratio(a, b) >= 4.5, a + ' on ' + b, ratio(a, b).toFixed(2)));

  console.log('Driver: home and next trip');
  await fresh();
  let b = await body();
  ok(/Good (morning|afternoon)/.test(b) && /Amara/.test(b), 'friendly greeting with driver name');
  ok(/Your next trip/.test(b) && /9:30 AM/.test(b) && /214 Elm St/.test(b) && /880 Oak Ave/.test(b), 'next trip shows time, pickup, destination');
  ok(await p.locator('button:has-text("View trip")').count() === 1, 'one primary action: View trip');
  ok(await p.locator('.tabs button').count() === 5, 'five driver tabs (claiming enabled)');

  console.log('Driver: guided trip');
  await click('button:has-text("View trip")');
  b = await body();
  ok(/Upcoming trip/.test(b) && /Step 1 of 4/.test(b), 'trip screen states where you are');
  ok(await p.locator('.actionbar button').count() === 1, 'one action at this stage');
  await click('.actionbar button'); await saved();
  b = await body();
  ok(/Arrival recorded at/.test(b), 'arrival confirmed with a time');
  ok(!/Contract A|Contract B/.test(b.replace(/Which contract/, '')), 'driver is not asked for a contract when office set one');
  await click('.actionbar button'); // start without odometer
  b = await body();
  ok(/Enter the odometer reading/.test(b) && await p.locator('#odoS[aria-invalid=true]').count() === 1, 'start without odometer shows inline error');
  await p.fill('#odoS', '48210'); await click('.actionbar button'); await saved();
  ok(/Trip started at/.test(await body()), 'trip start confirmed');
  await overflow('driver trip in progress (390px)');
  await p.selectOption('#why', 'At appointment'); await click('button:has-text("Pause and record waiting")'); await saved();
  ok(/Trip paused/.test(await body()) && await p.locator('#wT').count() === 1, 'waiting shows a running timer');
  await p.waitForTimeout(1200);
  await click('.actionbar button'); await saved();
  ok(/Trip resumed at .* Waited \d\d:\d\d/.test(await body()), 'resume records how long the wait was');
  await p.waitForFunction(() => window.__app.state().trips.find(t => t.id === 'T-2002').progress >= 1, null, { timeout: 60000 });
  ok(/reached the destination/.test(await body()), 'arrival at destination is stated');
  await click('.actionbar button'); await saved(); // End trip
  await p.fill('#odoE', '48200'); await click('.actionbar button');
  ok(/lower than the starting reading/.test(await body()), 'ending odometer lower than start is blocked with a clear reason');
  console.log('Driver: failure keeps work');
  await p.fill('#odoE', '48220.9');
  await p.evaluate(() => document.getElementById('demo').open = true);
  await click('[data-demo=fail-net]'); await click('.actionbar button'); await saved();
  { const bb = await body(), v = await p.inputValue('#odoE').catch(() => 'no input'); ok(/no connection, so this was not saved/.test(bb) && v === '48220.9', 'network failure explains itself and keeps the entry', v + ' | ' + bb.slice(0, 260)); }
  await click('[data-demo=fail-auth]'); await click('.actionbar button'); await saved();
  ok(/login has expired/.test(await body()) && await p.inputValue('#odoE') === '48220.9', 'expired login explains itself and keeps the entry');
  await click('.actionbar button'); await saved();
  b = await body();
  ok(/Trip submitted at .* saved/.test(b) && /What happens next/.test(b), 'success is confirmed, next step explained');
  ok(!/\$\d/.test(b), 'driver sees no money amounts');
  await click('.actionbar button'); // back home
  await p.click('.tabs button:has-text("History")');
  ok(/T-2002/.test(await body()) && /Sent to office/.test(await body()), 'history lists the submitted trip');

  console.log('Driver: claiming jobs');
  await fresh();
  await p.click('.tabs button:has-text("Available")');
  b = await body();
  ok(/T-2004|10:15 AM/.test(b) && /11:00 AM/.test(b), 'eligible jobs listed');
  ok(/Overlaps your 9:30 AM trip/.test(b), 'conflicting jobs explain why they cannot be taken');
  ok(await p.locator('button:has-text("Take this trip")').count() === 2, 'only eligible jobs can be taken');
  await p.evaluate(() => document.getElementById('demo').open = true);
  await click('[data-demo=race]');
  await p.locator('button:has-text("Take this trip")').first().click(); await saved();
  b = await body();
  ok(/just taken by another driver/.test(b) && await p.locator('button:has-text("Take this trip")').count() === 1, 'lost race explained, list refreshed');
  await p.locator('button:has-text("Take this trip")').first().click(); await saved();
  b = await body();
  ok(/Trip claimed successfully/.test(b) && /Upcoming trip/.test(b), 'claim confirmed and the trip opens');
  await overflow('claim confirmation (390px)');

  console.log('Driver: empty state');
  await fresh();
  await p.evaluate(() => { const s = window.__app.state(); s.trips.forEach(t => { if (t.driver === 'D2') t.driver = null; }); });
  await p.click('#roleOffice'); await p.click('#roleDriver');
  b = await body();
  ok(/You do not have any trips assigned right now/.test(b) && /New assignments will appear here/.test(b), 'no-trip state says what to do next');

  console.log('Office: overview and review queue');
  await fresh();
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.click('#roleOffice');
  b = await body();
  ok(/Needs your attention/.test(b) && /no driver/.test(b) && /T-2000/.test(b), 'attention list leads the overview');
  ok(await p.locator('.tile').count() === 6, 'six status tiles, each with a definition');
  await p.click('.tile:has-text("Needs review")');
  const rows = await p.locator('#rows tr.go').count();
  ok(rows === 2 && /T-1998/.test(await text('#rows')) && /T-2000/.test(await text('#rows')), 'tile opens the filtered list', 'rows ' + rows);
  await overflow('office trips (1280px)');

  console.log('Office: trip record');
  await p.click('#rows button:has-text("T-2000")');
  b = await body();
  ok(/Estimated contract amount/.test(b) && /\$15\.00/.test(b) && /18\.8 mi/.test(b) && /\$1\.75 per mile/.test(b), 'financial calculation is shown line by line');
  ok(/not profit/.test(b), 'amount is not presented as profit');
  ok(/above the 10% limit/.test(b), 'mileage difference explained with the rule');
  ok(/None applied\. A waiting-fee rule/.test(b), 'recorded waiting separated from billable waiting');
  await click('button:has-text("Approve this distance")');
  ok(/Write a reason/.test(await body()), 'resolution requires a reason');
  await p.fill('#note', 'Driver took a detour for a road closure.'); await click('button:has-text("Approve this distance")'); await saved();
  b = await body();
  ok(/Distance approved: 18\.8 mi/.test(b) && /Awaiting approval/.test(b), 'review item resolved and recorded');
  await click('button:has-text("Approve for billing")'); await saved();
  b = await body();
  ok(/Approved for billing/.test(b) && /\$47\.90/.test(b) && /Mileage resolved/.test(b), 'approved amount ($15.00 + 18.8 x $1.75 = $47.90) and history');
  await p.click('.crumbs button');
  await p.click('#rows button:has-text("T-1998")');
  await p.selectOption('#ctr', 'A'); await click('button:has-text("Save contract")'); await saved();
  ok(/Awaiting approval/.test(await body()), 'assigning a contract clears the review flag');

  console.log('Office: assign and filters');
  await p.click('.adm nav button:has-text("Trips")');
  ok(await p.inputValue('#fs') === 'Needs review', 'filter from the overview is still applied'); await click('[data-a=clearF]');
  await p.fill('#fq', 'T-2003'); await p.waitForTimeout(100);
  ok(await p.locator('#rows tr.go').count() === 1, 'search by trip ID');
  await p.click('#rows button:has-text("T-2003")');
  await p.selectOption('#asg', 'D4'); await click('button:has-text("Save driver")'); await saved();
  ok(/assigned to Priya/.test(await body()) && /Scheduled/.test(await body()), 'driver assignment saved and confirmed');
  await p.click('.crumbs button');
  ok(await p.inputValue('#fq') === 'T-2003', 'filters survive returning to the list');

  console.log('Office: import');
  await p.click('.adm nav button:has-text("Import trips")');
  await click('button:has-text("Check rows")');
  b = await body();
  ok(/Ready to import 3/.test(b) && /Rejected 3/.test(b) && /Already in the system 1/.test(b), 'import summary: 3 ready, 3 rejected, 1 duplicate');
  ok(/real 24-hour time/.test(b) && /Destination is missing/.test(b) && /Contract must be A, B or blank/.test(b), 'each rejected row says why');
  const before = await p.evaluate(() => window.__app.state().trips.length);
  await click('button:has-text("Import 3 valid rows")'); await saved();
  const after = await p.evaluate(() => window.__app.state().trips.length);
  ok(after === before + 3, 'valid rows imported');
  const left = await p.inputValue('#imptext');
  ok(left.split('\n').length === 4 && /25:90/.test(left), 'rejected rows stay in the box to fix');
  await p.fill('#imptext', left.replace('25:90', '13:30').replace(',,B', ',Elm,B').replace(',C', ',B'));
  await click('button:has-text("Check rows")');
  ok(/Ready to import 3/.test(await body()), 'fixed rows pass on re-check');

  console.log('Office: settings');
  await p.click('.adm nav button:has-text("Contracts")');
  ok(/unconfirmed/.test(await body()), 'rates labelled unconfirmed');
  await p.check('#mAssign');
  await p.click('#roleDriver');
  ok(await p.locator('.tabs button').count() === 4 && !/Available/.test(await text('.tabs')), 'assign-only mode hides Available jobs from drivers');

  console.log('Layout and touch targets');
  await fresh(); await p.setViewportSize({ width: 360, height: 760 });
  await overflow('driver home (360px)');
  await p.click('.tabs button:has-text("Available")'); await overflow('available (360px)');
  const small = await p.evaluate(() => [...document.querySelectorAll('#app button, #app input, #app select, #app textarea, .tabs button')].filter(e => e.offsetParent && !(e.classList.contains('link') || e.classList.contains('back'))).filter(e => e.getBoundingClientRect().height < 44).map(e => e.outerHTML.slice(0, 80)));
  ok(small.length === 0, 'driver controls are at least 44px tall', small.join(' | '));
  await p.click('#roleOffice'); await p.click('.adm nav button:has-text("Trips")'); await overflow('office trips cards (360px)');
  ok(await p.locator('#cardrows .tripcard').count() > 5 && !(await p.locator('.tablewrap').isVisible()), 'small screens show cards instead of a squeezed table');
  await p.setViewportSize({ width: 768, height: 900 }); await overflow('office trips (768px)');
  await p.click('.adm nav button:has-text("Overview")'); await overflow('office overview (768px)');


  console.log('Driver onboarding (phone, first run)');
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const q = await ctx2.newPage(); const qerr = [];
  q.on('pageerror', e => qerr.push(e.message));
  const qb = async () => (await q.locator('#app').innerText()).replace(/\s+/g, ' ');
  await q.goto(URL);
  b = await qb();
  ok(/Welcome to Doz and CoCare/.test(b) && /all in one place/.test(b) && await q.locator('button:has-text("Get started")').count() === 1, 'welcome screen is short with one action');
  ok(await q.locator('.tabs').count() === 0, 'no navigation competes with onboarding');
  await q.click('button:has-text("Get started")');
  b = await qb();
  ok(/Your office has already set up your account/.test(b) && !/Create (an )?account|Sign up/i.test(b), 'sign-in explains that the office created the account');
  ok(/I cannot sign in/.test(b), 'recovery help is visible on the sign-in screen');
  await q.fill('#siC', 'abc'); await q.click('.actionbar button');
  ok(/at least 10 digits|email your office gave you/.test(await qb()) && await q.locator('#siC[aria-invalid=true]').count() === 1, 'bad contact shows a clear error');
  await q.fill('#siC', '555 010 2002'); await q.click('.actionbar button');
  ok(/6-digit code to 555 010 2002/.test(await qb()), 'code step names where the code was sent');
  await q.fill('#siK', '000000'); await q.click('.actionbar button');
  ok(/That code is not right/.test(await qb()), 'wrong code explains what to do');
  await q.fill('#siK', '123456'); await q.click('.actionbar button');
  b = await qb();
  ok(/Amara/.test(b) && /D2/.test(b) && /Doz and CoCare LLC/.test(b), 'details already on file are shown');
  ok(await q.locator('#app input, #app textarea').count() === 0, 'driver is not asked to type anything again');
  await q.click('button:has-text("Something is not right")');
  ok(/Tell your office/.test(await qb()), 'a wrong detail has a way forward');
  await q.click('button:has-text("This is correct")');
  b = await qb();
  ok(/1 of 6/.test(b) && /Find your trips/.test(b), 'intro starts at step 1 of 6');
  ok(!/P-0\d\d/.test(b) && /Example/.test(b), 'intro uses examples, not passenger data');
  for (const t of ['See where to go', 'Take an open job', 'Arrive and start', 'Record waiting']) { await q.click('.actionbar button:has-text("Next")'); ok(new RegExp(t).test(await qb()), 'intro slide: ' + t); }
  await q.click('.actionbar button:has-text("Next")');
  ok(/Finish the trip/.test(await qb()) && await q.locator('button:has-text("Finish")').count() >= 1, 'last slide offers Finish');
  await q.click('.actionbar button:has-text("Finish")');
  b = await qb();
  ok(/Your next trip/.test(b) && await q.locator('.tabs').count() === 1, 'driver lands on a home screen with their next trip');
  await q.reload();
  ok(/Your next trip/.test(await qb()) && !/Welcome to Doz/.test(await qb()), 'onboarding is remembered and not shown again');
  await q.click('.tabs button:has-text("Help")');
  b = await qb();
  ok(/How to use the app/.test(b) && /Common questions/.test(b) && /If something goes wrong/.test(b), 'help area has guide, questions and fixes');
  ok(/have not been set up in this app yet/.test(b) && !/\d{3}[- ]\d{3}[- ]\d{4}/.test(b.replace(/555 010 2002/, '')), 'support contact is not invented');
  await q.click('button:has-text("Show me how the app works")');
  ok(/1 of 6/.test(await qb()), 'intro can be reopened from Help');
  await q.click('button:has-text("Close")');
  ok(/Common questions/.test(await qb()), 'closing the intro returns to Help');
  await q.click('button:has-text("Sign out")');
  ok(/Sign in/.test(await qb()) && !/Welcome to Doz/.test(await qb()), 'signing out returns to sign-in, not the whole intro');

  console.log('Driver onboarding: skipping');
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const r3 = await ctx3.newPage(); await r3.goto(URL);
  await r3.click('button:has-text("Get started")'); await r3.fill('#siC', 'amara@example.com'); await r3.click('.actionbar button'); await r3.fill('#siK', '123456'); await r3.click('.actionbar button');
  await r3.click('button:has-text("This is correct")'); await r3.click('button:has-text("Skip for now")');
  ok(/Your next trip/.test((await r3.locator('#app').innerText())), 'intro can be skipped and work is available immediately');
  await ctx3.close();

  console.log('Office onboarding (setup wizard)');
  const ctx4 = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx4.addInitScript(d => { try { if (!localStorage.getItem('dozcare.ob.v1')) localStorage.setItem('dozcare.ob.v1', JSON.stringify(d)); } catch (e) {} }, { driver: DONE.driver, admin: { done: false, step: 0, orgOk: false, wfOk: false, contractsOk: false, tripAdded: false } });
  const w = await ctx4.newPage(); const werr = []; w.on('pageerror', e => werr.push(e.message));
  const wb = async () => (await w.locator('#app').innerText()).replace(/\s+/g, ' ');
  const wsave = () => w.waitForTimeout(600);
  await w.goto(URL); await w.click('#roleOffice');
  b = await wb();
  ok(/Let.s get Doz and CoCare ready/.test(b) && /five short steps/.test(b) && !/\d+ minutes/.test(b), 'welcome explains the steps without inventing a time');
  ok(await w.locator('.adm nav').count() === 0, 'no empty dashboard during setup');
  await w.click('.actionbar button:has-text("Start setup")');
  b = await wb();
  ok(/Doz and CoCare LLC/.test(b) && /Nothing to type/.test(b), 'organisation is pre-filled, nothing to retype');
  await w.click('.actionbar button:has-text("Confirm and continue")'); await wsave();
  b = await wb();
  ok(/Your contracts/.test(b) && /have not been verified/.test(b) && /20 miles: \$13\.50 \+ 20 × \$1\.60 = \$45\.50/.test(b), 'contracts step shows a worked example and an honesty warning');
  ok(/Enter the amount specified in the contract/.test(b), 'contextual help sits beside the rate');
  await w.click('.actionbar button:has-text("Save contracts")');
  ok(/Tick the box/.test(await wb()), 'contracts cannot be saved without checking them');
  await w.check('#cok'); await w.click('.actionbar button:has-text("Save contracts")'); await wsave();
  b = await wb();
  ok(/Contracts saved/.test(b) && /Your drivers/.test(b), 'contracts saved, moves to drivers');
  await w.fill('#dn', 'Jordan'); await w.fill('#dc', 'new@example.com'); await w.click('button:has-text("Add driver")'); await wsave();
  ok(/A driver named Jordan already exists/.test(await wb()), 'duplicate driver name is caught');
  await w.fill('#dn', 'Riley Chen'); await w.fill('#dc', 'jordan@example.com'); await w.click('button:has-text("Add driver")'); await wsave();
  ok(/already used by Jordan/.test(await wb()), 'duplicate contact is caught, not silently added');
  await w.fill('#dn', 'Riley Chen'); await w.fill('#dc', 'riley@example.com'); await w.click('button:has-text("Add driver")'); await wsave();
  b = await wb();
  ok(/Driver added/.test(b) && /Riley Chen/.test(b) && /Invited, not signed in yet/.test(b) && /does not send messages/.test(b), 'driver added with a plain activation status and an honest note');
  ok(await w.inputValue('#dn') === '', 'form clears after success');
  await w.click('summary:has-text("Import a list of drivers")');
  await w.fill('#drvcsv', 'name,contact\nTaylor Brooks,taylor@example.com\nBad Row,12\nRiley Two,RILEY@example.com');
  await w.click('button:has-text("Check list")');
  b = await wb();
  ok(/1 ready to add, 1 need fixing, 1 already exist/.test(b), 'driver import previews good, bad and duplicate rows');
  await w.click('button:has-text("Add 1 driver")'); await wsave();
  ok(/1 driver added/.test(await wb()), 'driver import confirmed');
  await w.click('.actionbar button:has-text("Continue")');
  b = await wb();
  ok(/Import trips/.test(b) && /Create a trip/.test(b) && /many trips at once/.test(b) && /one trip by typing/.test(b), 'two clear trip options, one sentence each');
  await w.click('button:has-text("Create a trip") >> nth=0');
  await w.click('.card button:has-text("Add trip")');
  ok(/Use the format 2026-10-15/.test(await wb()) && /not the passenger/.test(await wb()), 'trip form explains each invalid field');
  await w.fill('#ctd', '2026-10-15'); await w.fill('#ctt', '15:30'); await w.fill('#ctp', 'P-200'); await w.fill('#ctk', '1 Test St'); await w.fill('#ctz', '2 Sample Rd'); await w.selectOption('#ctc', 'B');
  await w.click('.card button:has-text("Add trip")'); await wsave();
  ok(/Trip added/.test(await wb()), 'trip added with a confirmation');
  await w.click('.actionbar button:has-text("Continue")');
  b = await wb();
  ok(/Review your setup/.test(b) && /essential setup is done/.test(b), 'review says the essentials are done');
  ok((b.match(/Done/g) || []).length >= 5 && !/Not done/.test(b), 'only completed steps are marked done');
  await w.click('.actionbar button:has-text("Finish setup")');
  b = await wb();
  ok(/You are all set/.test(b) && /Overview/.test(b) && /Import trips/.test(b) && /Help/.test(b), 'tour explains each section in one line');
  await w.click('.actionbar button:has-text("Go to Overview")');
  b = await wb();
  ok(/Needs your attention/.test(b) && !/Setup is not finished/.test(b), 'overview opens once setup is complete');
  await w.click('.adm nav button:has-text("Drivers")');
  ok(/Riley Chen/.test(await wb()) && /Taylor Brooks/.test(await wb()), 'new drivers are listed under Drivers');
  await w.reload(); await w.click('#roleOffice');
  ok(/Needs your attention/.test(await wb()) && !/Let.s get Doz/.test(await wb()), 'setup progress is remembered');
  await w.click('.adm nav button:has-text("Help")');
  ok(/Run setup again/.test(await wb()) && /Why is Approve for billing greyed out/.test(await wb()), 'office help area offers setup and answers');

  console.log('Office onboarding: leaving early and empty states');
  const ctx5 = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await ctx5.addInitScript(d => { try { if (!localStorage.getItem('dozcare.ob.v1')) localStorage.setItem('dozcare.ob.v1', JSON.stringify(d)); } catch (e) {} }, { driver: DONE.driver, admin: { done: false, step: 0, orgOk: false, wfOk: false, contractsOk: false, tripAdded: false } });
  const x = await ctx5.newPage(); await x.goto(URL); await x.click('#roleOffice');
  await x.click('.actionbar button:has-text("I will do this later")');
  let xb = (await x.locator('#app').innerText()).replace(/\s+/g, ' ');
  ok(/Setup is not finished/.test(xb) && /contract rates/.test(xb), 'leaving early still gives access, with a clear reminder of what is essential');
  await x.click('button:has-text("Continue setup")');
  ok(/Your organisation/.test((await x.locator('#app').innerText())), 'reminder returns to the first missing step');
  await x.evaluate(() => { const s = window.__app.state(); s.ob.admin.done = true; s.drivers.length = 0; s.aView = 'drivers'; });
  await x.click('#roleDriver'); await x.click('#roleOffice');
  await x.click('.adm nav button:has-text("Overview")'); await x.click('.adm nav button:has-text("Drivers")');
  xb = (await x.locator('#app').innerText()).replace(/\s+/g, ' ');
  ok(/No drivers have been added yet/.test(xb) && /Add a driver to start assigning trips/.test(xb), 'no-driver state explains what to do');
  await x.click('.adm nav button:has-text("Import trips")');
  await x.click('button:has-text("Use the example")');
  ok(/P-123/.test(await x.inputValue('#imptext')), 'import offers an example to start from');
  await x.click('button:has-text("Check rows")');
  xb = (await x.locator('#app').innerText()).replace(/\s+/g, ' ');
  ok(/Preview: these trips will be added/.test(xb), 'import shows a preview before anything is added');
  ok(werr.length === 0 && qerr.length === 0, 'no script errors during onboarding', werr.concat(qerr).join(' | '));
  await ctx2.close(); await ctx4.close(); await ctx5.close();

  ok(errors.length === 0, 'no script errors', errors.join(' | '));
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
