/* Doz and CoCare Trips: front-end prototype.
   Everything runs in the browser against DEMO_DATA below. There is no server, login or database.
   Production would replace DEMO_DATA and save() with real API calls. */
(function () {
'use strict';

/* ================= DEMO DATA (invented; keep separate from logic) ================= */
var H = 3600;
function T(h, m) { return h * H + m * 60; }
var PATHS = [
  [[60,50],[60,170],[220,170],[220,230],[300,230]],
  [[360,50],[300,50],[300,170],[140,170],[140,290]],
  [[140,50],[140,110],[220,110],[220,290],[300,290]],
  [[60,290],[60,230],[220,230],[220,170]],
  [[60,110],[140,110],[140,170]],
  [[220,50],[220,290],[300,290]]
];
var SC = 0.025;      // map units to miles (illustration only)
var MPH = 28;        // simulated driving speed
var DEMO = {
  driverId: 'D2',
  drivers: [{id:'D1',name:'Jordan',contact:'jordan@example.com',status:'Active'},{id:'D2',name:'Amara',contact:'555 010 2002',status:'Active'},{id:'D3',name:'Marcus',contact:'marcus@example.com',status:'Active'},{id:'D4',name:'Priya',contact:'555 010 2004',status:'Active'},{id:'D5',name:'Sam',contact:'sam@example.com',status:'Invited'}],
  rates: { A: {f:13.5, m:1.6}, B: {f:15, m:1.75} },   // owner-supplied, UNCONFIRMED
  settings: { mode: 'claim', tol: 10 },
  startClock: T(8, 52),
  trips: [
    {id:'T-1998',time:T(7,10),pax:'P-077',pickup:'18 Mill Rd',drop:'200 Elm St',pts:PATHS[4],driver:'D5',contract:null,done:{odoS:51200,odoE:51209.4,mapMi:9.1,start:T(7,12),end:T(7,49)}},
    {id:'T-1999',time:T(7,30),pax:'P-081',pickup:'77 Harbor Ln',drop:'9 Oak Ave',pts:PATHS[5],driver:'D3',contract:'A',done:{odoS:30112,odoE:30121.6,mapMi:9.4,start:T(7,33),end:T(8,2)}},
    {id:'T-2000',time:T(7,45),pax:'P-066',pickup:'4 River Rd',drop:'310 Market St',pts:PATHS[1],driver:'D1',contract:'B',done:{odoS:77001,odoE:77019.8,mapMi:14.9,start:T(7,48),end:T(8,31)}},
    {id:'T-2001',time:T(8,0),pax:'P-009',pickup:'101 Oak Ave',drop:'5 Harbor Ln',pts:PATHS[5],driver:'D4',contract:'B',approved:true,done:{odoS:47980,odoE:47994.2,mapMi:13.9,start:T(8,3),end:T(8,44),wait:[T(8,30),T(8,36)+30]}},
    {id:'T-2002',time:T(9,30),pax:'P-014',pickup:'214 Elm St',drop:'880 Oak Ave',pts:PATHS[0],driver:'D2',contract:'A',note:'Call the passenger when you arrive.'},
    {id:'T-2003',time:T(9,45),pax:'P-022',pickup:'9 Harbor Ln',drop:'61 Mill Rd',pts:PATHS[1],driver:null,contract:'B'},
    {id:'T-2004',time:T(10,15),pax:'P-031',pickup:'45 Oak Ave',drop:'300 Harbor Ln',pts:PATHS[2],driver:null,contract:null},
    {id:'T-2005',time:T(11,0),pax:'P-040',pickup:'12 River Rd',drop:'77 Market St',pts:PATHS[3],driver:null,contract:'A'},
    {id:'T-2006',time:T(9,20),pax:'P-052',pickup:'3 Elm St',drop:'18 Mill Rd',pts:PATHS[4],driver:'D4',contract:'B'},
    {id:'T-2007',time:T(13,0),pax:'P-060',pickup:'60 Mill Rd',drop:'12 Elm St',pts:PATHS[1],driver:'D2',contract:'B',note:'Passenger uses a walker.'},
    {id:'T-2008',time:T(9,50),pax:'P-018',pickup:'300 Market St',drop:'15 River Rd',pts:PATHS[3],driver:null,contract:'A'}
  ],
  importSample: 'date,time,passenger_ref,pickup,destination,contract\n2026-10-15,12:15,P-101,22 Elm St,400 Oak Ave,A\n2026-10-15,12:45,P-102,8 Mill Rd,90 Harbor Ln,B\n2026-10-16,08:30,P-103,15 River Rd,70 Market St,\n2026-10-15,11:00,P-040,12 River Rd,77 Market St,A\n2026-10-15,25:90,P-104,1 Elm St,2 Oak Ave,A\n2026-10-15,14:00,P-105,3 Mill Rd,,B\n2026-10-15,14:30,P-106,5 Elm St,6 Oak Ave,C'
};

/* ================= helpers ================= */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function clock(s, sec) { s = Math.floor(s); var h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12; return h12 + ':' + pad(m) + (sec ? ':' + pad(s % 60) : '') + ' ' + ap; }
function dur(s) { s = Math.max(0, Math.floor(s)); var h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s % 60); }
function money(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function mi(n) { return n.toFixed(1) + ' mi'; }
function plen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); return L; }
function at(p, t) { var L = plen(p) * t, a = 0; for (var i = 1; i < p.length; i++) { var s = Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); if (a + s >= L || i === p.length - 1) { var f = s ? Math.min(1, (L - a) / s) : 0; return {x: p[i-1][0] + (p[i][0] - p[i-1][0]) * f, y: p[i-1][1] + (p[i][1] - p[i-1][1]) * f, a: Math.atan2(p[i][1] - p[i-1][1], p[i][0] - p[i-1][0]) * 180 / Math.PI}; } a += s; } return {x: p[0][0], y: p[0][1], a: 0}; }
function upTo(p, t) { var L = plen(p) * t, a = 0, o = [p[0]]; for (var i = 1; i < p.length; i++) { var s = Math.hypot(p[i][0] - p[i-1][0], p[i][1] - p[i-1][1]); if (a + s >= L) { var f = (L - a) / s; o.push([p[i-1][0] + (p[i][0] - p[i-1][0]) * f, p[i-1][1] + (p[i][1] - p[i-1][1]) * f]); return o; } o.push(p[i]); a += s; } return o; }
function pts(a) { return a.map(function (q) { return q[0] + ',' + q[1]; }).join(' '); }

/* ================= state ================= */
var S, SIM = {speed: 30, base: 0, real: 0};
function now() { return SIM.base + (performance.now() - SIM.real) / 1000 * SIM.speed; }
function setSpeed(v) { SIM.base = now(); SIM.real = performance.now(); SIM.speed = v; }
var DRIVERS = [];
function drvName(id) { for (var i = 0; i < DRIVERS.length; i++) if (DRIVERS[i].id === id) return DRIVERS[i].name; return 'Unassigned'; }
function nextTripId() { S.tripSeq++; return 'T-' + (3000 + S.tripSeq); }
function byId(id) { for (var i = 0; i < S.trips.length; i++) if (S.trips[i].id === id) return S.trips[i]; return null; }
function log(t, label, detail, actor, kind) { t.log.push({t: now(), label: label, detail: detail || '', actor: actor || 'System', kind: kind || ''}); }

function mkTrip(o) {
  var t = {id: o.id, date: o.date || '2026-10-15', time: o.time, pax: o.pax, pickup: o.pickup, drop: o.drop, pts: o.pts, note: o.note || '',
    driver: o.driver || null, contract: o.contract || null, contractBy: o.contract ? 'office' : null, contractOk: true,
    phase: 'assigned', odoS: null, odoE: null, progress: 0, moving: 0, tripStart: null, tripEnd: null, mapMi: null,
    waits: [], wait: null, log: [], approved: false, resolved: null, problem: null, problemOpen: false, atDrop: false, lastMsg: ''};
  t.mi = Math.round(plen(t.pts) * SC * 10) / 10;
  if (o.done) {
    var d = o.done, who = drvName(t.driver);
    t.phase = 'done'; t.odoS = d.odoS; t.odoE = d.odoE; t.mapMi = d.mapMi; t.progress = 1; t.tripStart = d.start; t.tripEnd = d.end; t.approved = !!o.approved;
    t.log.push({t: d.start - 3600, label: 'Assigned to ' + who, detail: '', actor: 'Office', kind: ''});
    t.log.push({t: d.start - 240, label: 'Arrived at pickup', detail: '', actor: who, kind: ''});
    t.log.push({t: d.start, label: 'Trip started', detail: 'Odometer ' + d.odoS.toFixed(1), actor: who, kind: ''});
    if (d.wait) { t.waits.push({s: d.wait[0], e: d.wait[1], why: 'At appointment'}); t.log.push({t: d.wait[0], label: 'Stopped to wait', detail: 'At appointment', actor: who, kind: 'wait'}); t.log.push({t: d.wait[1], label: 'Resumed trip', detail: 'Waited ' + dur(d.wait[1] - d.wait[0]), actor: who, kind: 'wait'}); }
    t.log.push({t: d.end, label: 'Trip submitted', detail: 'Odometer ' + d.odoE.toFixed(1) + ' (' + mi(d.odoE - d.odoS) + ')', actor: who, kind: ''});
    if (t.approved) t.log.push({t: d.end + 1800, label: 'Approved for billing', detail: '', actor: 'Office', kind: ''});
  }
  return t;
}
function init() {
  DRIVERS = JSON.parse(JSON.stringify(DEMO.drivers));
  SIM.base = DEMO.startClock; SIM.real = performance.now();
  S = {role: S ? S.role : 'driver', dTab: 'home', dTrip: null, dFrom: 'home', aView: 'overview', aTrip: null, f: {q: '', driver: '', contract: '', status: '', date: 'all'},
    trips: DEMO.trips.map(mkTrip), rates: JSON.parse(JSON.stringify(DEMO.rates)), mode: DEMO.settings.mode, tol: DEMO.settings.tol,
    drivers: DRIVERS, ob: (S && S.ob) || loadOb(), tourIdx: 0, tourReplay: false, wizSub: '', wrongInfo: false, drvImp: {text: 'name,contact', result: null}, tripSeq: 0,
    busy: false, err: null, msg: '', fail: null, race: false, claimLog: [], imp: {text: DEMO.importSample, result: null, last: null}, lastKey: '', fieldErr: {}};
  render();
}

/* ================= derived data ================= */
function odoMiles(t) { return t.odoS != null && t.odoE != null ? Math.round((t.odoE - t.odoS) * 10) / 10 : null; }
function variance(t) { var m = odoMiles(t); return t.mapMi > 0 && m != null ? Math.abs(m - t.mapMi) / t.mapMi : 0; }
function approvedMiles(t) { return t.resolved ? t.resolved.miles : odoMiles(t); }
function calc(t) { var m = approvedMiles(t); if (!t.contract || m == null) return null; var r = S.rates[t.contract]; return {f: r.f, rate: r.m, miles: m, mile$: Math.round(m * r.m * 100) / 100, total: Math.round((r.f + m * r.m) * 100) / 100}; }
function waitTotal(t) { var s = 0; t.waits.forEach(function (w) { s += w.e - w.s; }); if (t.wait) s += now() - t.wait.s; return s; }
function reasons(t) {
  var r = [];
  if (t.problem && t.problemOpen) r.push('Driver reported a problem: “' + t.problem + '”');
  if (!t.contract) r.push(t.phase === 'done' ? 'No contract is assigned to this completed trip' : 'No contract is assigned yet');
  else if (t.contractBy === 'driver' && !t.contractOk) r.push('The driver chose this contract. Confirm it is correct');
  if (t.phase === 'done' && t.odoE != null && !t.resolved && variance(t) > S.tol / 100) r.push('Odometer distance differs from the map estimate by ' + Math.round(variance(t) * 100) + '%, above the ' + S.tol + '% limit');
  return r;
}
function statusOf(t) {
  if (t.phase === 'done') return t.approved ? 'Approved for billing' : reasons(t).length ? 'Needs review' : 'Awaiting approval';
  if (!t.driver) return 'Awaiting assignment';
  return t.phase === 'assigned' ? 'Scheduled' : 'In progress';
}
var BADGE = {'Awaiting assignment': ['neutral', '○'], 'Scheduled': ['info', '◷'], 'In progress': ['info', '▶'], 'Needs review': ['warn', '!'], 'Awaiting approval': ['warn', '◔'], 'Approved for billing': ['ok', '✓']};
var STATUS_DEF = {'Awaiting assignment': 'No driver yet', 'Scheduled': 'Driver assigned, not started', 'In progress': 'Driver has arrived or started', 'Needs review': 'Missing or conflicting information', 'Awaiting approval': 'Completed, checks passed', 'Approved for billing': 'Approved by office. Invoicing is not tracked yet'};
function badge(s) { var b = BADGE[s]; return '<span class="badge b-' + b[0] + '"><i aria-hidden="true">' + b[1] + '</i>' + esc(s) + '</span>'; }
function estDur(t) { return t.mi / MPH * 3600 + 900; }
function conflict(driver, c) { var r = S.trips.filter(function (t) { return t.driver === driver && t.phase !== 'done' && t.id !== c.id && t.time < c.time + estDur(c) && c.time < t.time + estDur(t); }); return r[0] || null; }
function rel(t) { var m = Math.round((t.time - now()) / 60); return m > 1 ? 'in ' + m + ' min' : m >= -1 ? 'now' : Math.abs(m) + ' min ago'; }
function greet() { var h = Math.floor(now() / 3600); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

/* ================= saving (simulated server) ================= */
function announce(m) { $('live').textContent = ''; setTimeout(function () { $('live').textContent = m; }, 30); }
function save(apply, okMsg) {
  if (S.busy) return;
  S.busy = true; S.err = null; render();
  setTimeout(function () {
    var f = S.fail; S.fail = null; S.busy = false;
    if (f) {
      S.err = f === 'auth' ? 'Your login has expired, so this was not saved. Sign in again and retry. Everything you entered is still here.' : 'There is no connection, so this was not saved. Check your signal and tap the button again. Everything you entered is still here.';
      render(); announce(S.err); return;
    }
    var m = apply(); S.msg = typeof m === 'string' ? m : (okMsg || '');
    render(); if (S.msg) announce(S.msg);
  }, 350);
}
function btn(label, a, cls, extra) { return '<button type="button" class="btn ' + (cls || 'primary') + '" data-a="' + a + '" ' + (extra || '') + (S.busy ? ' disabled' : '') + '>' + (S.busy && (cls || 'primary') === 'primary' ? 'Saving…' : label) + '</button>'; }

/* ================= map ================= */
function roadSvg() {
  var xs = [60,140,220,300,360], ys = [50,110,170,230,290], g = '';
  g += '<path d="M-10 205 C 60 188, 110 252, 190 240 S 330 196, 410 214" fill="none" stroke="#CFE1F7" stroke-width="22"/><rect x="150" y="62" width="58" height="40" rx="6" fill="#DCEFDC"/><rect x="308" y="182" width="64" height="38" rx="6" fill="#DCEFDC"/><rect x="70" y="118" width="62" height="44" rx="6" fill="#DFE6F5"/>';
  g += '<path d="M-10 330 L 410 90" stroke="#E8B27A" stroke-width="10"/><path d="M-10 330 L 410 90" stroke="#F6D3AB" stroke-width="7"/>';
  xs.forEach(function (x) { g += '<line x1="' + x + '" y1="-10" x2="' + x + '" y2="330" stroke="#D3DBEC" stroke-width="9"/>'; });
  ys.forEach(function (y) { g += '<line x1="-10" y1="' + y + '" x2="410" y2="' + y + '" stroke="#D3DBEC" stroke-width="9"/>'; });
  xs.forEach(function (x) { g += '<line x1="' + x + '" y1="-10" x2="' + x + '" y2="330" stroke="#fff" stroke-width="6.5"/>'; });
  ys.forEach(function (y) { g += '<line x1="-10" y1="' + y + '" x2="410" y2="' + y + '" stroke="#fff" stroke-width="6.5"/>'; });
  return g;
}
function pin(x, y, c, l) { return '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0 C-9 -10 -10 -16 -10 -19 A10 10 0 1 1 10 -19 C10 -16 9 -10 0 0Z" fill="' + c + '" stroke="#fff" stroke-width="1.5"/><text y="-15" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="Figtree,sans-serif">' + l + '</text></g>'; }
function mapDyn(t) {
  var p = t.pts, h = '<polyline points="' + pts(p) + '" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><polyline points="' + pts(p) + '" fill="none" stroke="#233B82" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
  if (t.progress > 0) h += '<polyline points="' + pts(upTo(p, Math.max(t.progress, .001))) + '" fill="none" stroke="#E49342" stroke-width="4.4" stroke-linejoin="round" stroke-linecap="round"/>';
  var e = p[p.length - 1], c = at(p, t.progress);
  h += pin(p[0][0], p[0][1], '#233B82', 'P') + pin(e[0], e[1], '#E49342', 'D');
  h += '<g transform="translate(' + c.x + ' ' + c.y + ')"><circle r="12" fill="#E49342" opacity=".25"/><g transform="rotate(' + c.a + ')"><circle r="7.5" fill="#E49342" stroke="#fff" stroke-width="2"/><path d="M-2.5 -3.5 L4 0 L-2.5 3.5Z" fill="#18233F"/></g></g>';
  return h;
}
function mapHtml(t) { return '<div class="mapwrap"><svg viewBox="0 20 400 290" role="img" aria-label="Map showing the route from pickup to destination">' + roadSvg() + '<g id="mapdyn">' + mapDyn(t) + '</g></svg><div class="mapnote">Illustration of the route. Not live GPS.</div></div>'; }

/* ================= driver views ================= */
var DID = DEMO.driverId;
function myOpen() { return S.trips.filter(function (t) { return t.driver === DID && t.phase !== 'done'; }).sort(function (a, b) { return a.time - b.time; }); }
function stageText(t) { return {assigned: 'Not started', arrived: t.wait ? 'Waiting at pickup' : 'At pickup', inTrip: t.wait ? 'Waiting' : 'On the trip', ending: 'Finishing', done: 'Submitted'}[t.phase]; }
function routeHtml(t) { return '<div class="route"><span class="dot"></span><div><span class="muted small">Pickup</span><div class="big">' + esc(t.pickup) + '</div></div><span class="dot d"></span><div><span class="muted small">Destination</span><div class="big">' + esc(t.drop) + '</div></div></div>'; }
function tripCard(t, from) { return '<button type="button" class="tripcard" data-a="openTrip" data-id="' + t.id + '" data-from="' + from + '"><div class="row"><span class="big num">' + clock(t.time) + '</span><span class="badge b-info">' + esc(stageText(t)) + '</span></div>' + routeHtml(t) + '<span class="muted small">Passenger ' + esc(t.pax) + ' · ' + esc(t.id) + '</span></button>'; }

function driverHome() {
  var mine = myOpen(), active = mine.filter(function (t) { return t.phase !== 'assigned'; })[0], next = active || mine[0];
  var h = '<h1 id="h1">' + greet() + ', ' + esc(drvName(DID)) + '</h1>';
  if (!next) {
    h += '<div class="card empty"><h2>You do not have any trips assigned right now</h2><p class="muted">New assignments will appear here.' + (S.mode === 'claim' ? ' You can also pick up open jobs from the Available tab.' : '') + '</p>' + (S.mode === 'claim' ? '<button type="button" class="btn navy" data-a="tab" data-tab="avail">See available jobs</button>' : '') + '</div>';
  } else {
    h += '<section class="stack tight" aria-labelledby="nx"><h2 id="nx">' + (active ? 'Your current trip' : 'Your next trip') + '</h2>' +
      '<div class="card stack"><div class="row"><span class="big num">' + clock(next.time) + '</span><span class="muted">' + (next.phase === 'assigned' ? 'Pickup ' + rel(next) : esc(stageText(next))) + '</span></div>' + routeHtml(next) +
      '<p class="muted small">Passenger ' + esc(next.pax) + (next.note ? ' · ' + esc(next.note) : '') + '</p>' + (next.problem && next.problemOpen ? '' : '') +
      '<button type="button" class="btn primary block" data-a="openTrip" data-id="' + next.id + '" data-from="home">' + (active ? 'Continue trip' : 'View trip') + '</button></div></section>';
    var later = mine.filter(function (t) { return t !== next; });
    if (later.length) h += '<p class="muted">' + later.length + ' more trip' + (later.length > 1 ? 's' : '') + ' later today. <button type="button" class="link" data-a="tab" data-tab="trips">See all my trips</button></p>';
  }
  return h;
}
function driverTrips() {
  var mine = myOpen(), h = '<h1 id="h1">My trips</h1>';
  if (!mine.length) return h + '<div class="card empty"><h2>No upcoming trips</h2><p class="muted">When a trip is assigned to you or you take one, it will be listed here.</p></div>';
  return h + '<div class="stack">' + mine.map(function (t) { return tripCard(t, 'trips'); }).join('') + '</div>';
}
function driverAvail() {
  var open = S.trips.filter(function (t) { return !t.driver && t.phase !== 'done'; }).sort(function (a, b) { return a.time - b.time; });
  var ok = [], no = [];
  open.forEach(function (t) { var c = conflict(DID, t); (c ? no : ok).push({t: t, c: c}); });
  var h = '<h1 id="h1">Available jobs</h1><p class="muted">First to take a job gets it. Only jobs that fit your schedule can be taken.</p>';
  if (S.err) h += '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(S.err) + '</span></div>';
  if (S.msg) h += '<div class="msg ok"><span aria-hidden="true">✓</span><span>' + esc(S.msg) + '</span></div>';
  if (!open.length) return h + '<div class="card empty"><h2>No open jobs right now</h2><p class="muted">New jobs appear here when the office posts them.</p><button type="button" class="btn second" data-a="refresh">Refresh</button></div>';
  h += '<div class="stack">' + ok.map(function (x) { var t = x.t; return '<div class="card stack"><div class="row"><span class="big num">' + clock(t.time) + '</span><span class="muted small">About ' + t.mi.toFixed(0) + ' mi · ' + esc(t.id) + '</span></div>' + routeHtml(t) + btn('Take this trip', 'claim', 'navy', 'data-id="' + t.id + '"') + '</div>'; }).join('') + '</div>';
  if (!ok.length) h += '<div class="msg info"><span aria-hidden="true">i</span><span>None of the open jobs fit your schedule right now.</span></div>';
  if (no.length) h += '<section class="stack tight"><h2>Not available to you</h2>' + no.map(function (x) { var t = x.t; return '<div class="tripcard off"><div class="row"><span class="big num">' + clock(t.time) + '</span><span class="badge b-neutral">Overlaps your ' + clock(x.c.time) + ' trip</span></div><div class="muted">' + esc(t.pickup) + ' → ' + esc(t.drop) + '</div></div>'; }).join('') + '</section>';
  return h + '<button type="button" class="btn quiet" data-a="refresh">Refresh list</button>';
}
function driverHistory() {
  var done = S.trips.filter(function (t) { return t.driver === DID && t.phase === 'done'; });
  var h = '<h1 id="h1">History</h1>';
  if (!done.length) return h + '<div class="card empty"><h2>Nothing yet</h2><p class="muted">Trips you complete will be listed here.</p></div>';
  return h + '<div class="stack">' + done.map(function (t) { return '<div class="card stack tight"><div class="row"><span class="big">' + clock(t.time) + ' · ' + esc(t.id) + '</span><span class="badge ' + (t.approved ? 'b-ok' : 'b-info') + '"><i aria-hidden="true">' + (t.approved ? '✓' : '→') + '</i>' + (t.approved ? 'Approved' : 'Sent to office') + '</span></div><div class="muted">' + esc(t.pickup) + ' → ' + esc(t.drop) + '</div><div class="muted small">' + mi(odoMiles(t)) + ' · waited ' + dur(waitTotal(t)) + '</div></div>'; }).join('') + '</div>';
}
function reasonSelect() { return '<div class="field"><label for="why">Reason for waiting</label><select id="why"><option>Passenger not ready</option><option>At appointment</option><option>Traffic or road closure</option><option>Other</option></select><p class="help">Record waiting time according to the company\'s approved procedure.</p></div>'; }
function fieldErr(id) { return S.fieldErr[id] ? '<p class="error" id="' + id + 'E">' + esc(S.fieldErr[id]) + '</p>' : ''; }
function driverTrip(t) {
  var title = {assigned: 'Upcoming trip', arrived: t.wait ? 'Waiting at pickup' : 'You are at the pickup', inTrip: t.wait ? 'Trip paused' : 'Trip in progress', ending: 'Finish your trip', done: 'Trip submitted'}[t.phase];
  var cur = {assigned: 0, arrived: 1, inTrip: 2, ending: 3, done: 4}[t.phase], lab = ['Go to pickup', 'At pickup', 'Driving', 'Finish'];
  var h = '<button type="button" class="back" data-a="back">← ' + (S.dFrom === 'trips' ? 'My trips' : S.dFrom === 'history' ? 'History' : 'Home') + '</button><div><h1 id="h1">' + title + '</h1><p class="muted">' + esc(t.id) + ' · Pickup ' + clock(t.time) + '</p></div>';
  h += '<div><div class="steps" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<span class="' + (i < cur ? 'd' : i === cur ? 'c' : '') + '"></span>'; }).join('') + '</div><p class="muted small" style="margin-top:4px">' + (t.phase === 'done' ? 'All steps complete' : 'Step ' + (cur + 1) + ' of 4: ' + lab[cur]) + '</p></div>';
  if (S.err) h += '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(S.err) + '</span></div>';
  else if (t.lastMsg) h += '<div class="msg ok"><span aria-hidden="true">✓</span><span>' + esc(t.lastMsg) + '</span></div>';
  h += '<div class="card stack">' + routeHtml(t) + '<dl class="kv"><dt>Passenger</dt><dd>' + esc(t.pax) + '</dd>' + (t.note ? '<dt>Note</dt><dd>' + esc(t.note) + '</dd>' : '') + '</dl>' + (t.phase === 'assigned' ? '<a class="btn quiet" style="align-self:flex-start" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(t.pickup) + '">Open directions</a>' : '') + '</div>';
  var bar = '';
  if (t.phase === 'assigned') bar = btn('I have arrived at pickup', 'arrive');
  else if (t.phase === 'arrived') {
    if (t.wait) h += '<div class="waitbox" role="timer"><span>Waiting at pickup</span><b id="wT">' + dur(now() - t.wait.s) + '</b><span>' + esc(t.wait.why) + '</span></div>';
    else {
      if (!t.contract) h += '<fieldset class="field card"><legend>Which contract is this trip under?</legend><p class="help">The office has not set one. Choose, or ask the office.</p><div class="stack tight"><label class="choice" for="cA"><input type="radio" name="dc" id="cA" value="A" data-a="pickC"> Contract A</label><label class="choice" for="cB"><input type="radio" name="dc" id="cB" value="B" data-a="pickC"> Contract B</label><label class="choice" for="cU"><input type="radio" name="dc" id="cU" value="U" data-a="pickC"> I am not sure</label></div>' + fieldErr('dc') + '</fieldset>';
      h += '<div class="field card"><label for="odoS">Odometer reading now (miles)</label><input id="odoS" type="number" inputmode="decimal" step="0.1" min="0" placeholder="For example 48210.0" ' + (S.fieldErr.odoS ? 'aria-invalid="true" aria-describedby="odoSE"' : '') + '><p class="help">Record the vehicle\'s odometer reading at the start of the trip.</p>' + fieldErr('odoS') + '</div>';
      h += '<div class="card stack tight"><h3>Is the passenger not ready?</h3>' + reasonSelect() + btn('Start recording waiting time', 'wait', 'second') + '</div>';
    }
    bar = t.wait ? btn('Passenger is ready', 'resume') : btn('Start trip', 'start');
  } else if (t.phase === 'inTrip') {
    if (t.wait) h += '<div class="waitbox" role="timer"><span>Waiting</span><b id="wT">' + dur(now() - t.wait.s) + '</b><span>' + esc(t.wait.why) + '</span></div>';
    h += mapHtml(t) + '<div class="stats"><div class="stat"><span>Trip time</span><b id="sT">' + dur(now() - t.tripStart) + '</b></div><div class="stat"><span>Driving</span><b id="sM">' + dur(t.moving) + '</b></div><div class="stat"><span>Waiting</span><b id="sW">' + dur(waitTotal(t)) + '</b></div><div class="stat"><span>Route distance</span><b id="sG">' + (t.mi * t.progress).toFixed(1) + '</b></div></div>';
    if (t.atDrop && !t.wait) h += '<div class="msg info"><span aria-hidden="true">i</span><span>You have reached the destination.</span></div>';
    if (!t.wait) h += '<div class="card stack tight"><h3>Stopping for a while?</h3>' + reasonSelect() + btn('Pause and record waiting', 'wait', 'second') + '</div>';
    bar = t.wait ? btn('Resume trip', 'resume') : btn('End trip', 'end');
  } else if (t.phase === 'ending') {
    var oe = S.fieldErr.odoE;
    h += '<div class="stats"><div class="stat"><span>Start odometer</span><b>' + t.odoS.toFixed(1) + '</b></div><div class="stat"><span>Route distance</span><b>' + (t.mi * t.progress).toFixed(1) + '</b></div></div>';
    h += '<div class="field card"><label for="odoE">Odometer reading now (miles)</label><input id="odoE" type="number" inputmode="decimal" step="0.1" min="0" placeholder="For example ' + (t.odoS + 10.5).toFixed(1) + '" ' + (oe ? 'aria-invalid="true" aria-describedby="odoEE"' : '') + '><p class="help">Record the vehicle\'s odometer reading at the end of the trip. The office checks the mileage afterwards.</p>' + fieldErr('odoE') + '</div>';
    bar = btn('Submit trip', 'submit');
  } else {
    h += '<div class="card stack"><h2>What happens next</h2><p>The office checks the mileage and approves the trip. You do not need to do anything else.</p><dl class="kv"><dt>Distance</dt><dd class="num">' + mi(odoMiles(t)) + '</dd><dt>Trip time</dt><dd class="num">' + dur(t.tripEnd - t.tripStart) + '</dd><dt>Waiting</dt><dd class="num">' + dur(waitTotal(t)) + '</dd></dl></div>';
    bar = '<button type="button" class="btn primary block" data-a="home">Back to home</button>';
  }
  h += '<details class="card"><summary style="font-weight:600;min-height:32px;cursor:pointer">Report a problem with this trip</summary><div class="stack" style="margin-top:12px"><div class="field"><label for="prob">What happened?</label><textarea id="prob"></textarea></div>' + btn('Send to office', 'report', 'second') + '</div></details>';
  return {html: h, bar: bar};
}
function driverShell() {
  var stg = drvStage();
  if (stg === 'welcome') return welcomeView(); if (stg === 'signin') return signinView(); if (stg === 'confirm') return confirmView(); if (stg === 'tour') return tourView();
  var t = S.dTrip ? byId(S.dTrip) : null, body, bar = '', tabs = true;
  if (t) { var r = driverTrip(t); body = r.html; bar = r.bar; tabs = false; }
  else body = S.dTab === 'trips' ? driverTrips() : S.dTab === 'avail' ? driverAvail() : S.dTab === 'history' ? driverHistory() : S.dTab === 'help' ? driverHelp() : driverHome();
  var T2 = [['home', 'Home', '⌂'], ['trips', 'My trips', '☰']].concat(S.mode === 'claim' ? [['avail', 'Available', '⊕']] : []).concat([['history', 'History', '↻'], ['help', 'Help', '?']]);
  return '<div class="drv"><main id="main">' + body + '</main>' +
    (tabs ? '<nav class="tabs" aria-label="Driver"><div class="in">' + T2.map(function (x) { return '<button type="button" data-a="tab" data-tab="' + x[0] + '" ' + (S.dTab === x[0] ? 'aria-current="page"' : '') + '><span aria-hidden="true">' + x[2] + '</span>' + x[1] + '</button>'; }).join('') + '</div></nav>' : '<div class="actionbar"><div class="in">' + bar + '</div></div>') + '</div>';
}

/* ================= office views ================= */
function counts() { var c = {}; Object.keys(BADGE).forEach(function (k) { c[k] = 0; }); S.trips.forEach(function (t) { c[statusOf(t)]++; }); return c; }
function attention() {
  var it = [], un = S.trips.filter(function (t) { return !t.driver && t.phase !== 'done'; });
  S.trips.filter(function (t) { return statusOf(t) === 'Needs review'; }).forEach(function (t) { it.push({sev: 'warn', txt: '<b>' + t.id + '</b>: ' + esc(reasons(t)[0]) + (reasons(t).length > 1 ? ' (+' + (reasons(t).length - 1) + ' more)' : ''), go: {a: 'openTrip', id: t.id}, label: 'Review'}); });
  S.trips.filter(function (t) { return t.problem && t.problemOpen && t.phase !== 'done'; }).forEach(function (t) { it.push({sev: 'warn', txt: '<b>' + t.id + '</b>: driver reported a problem: “' + esc(t.problem) + '”', go: {a: 'openTrip', id: t.id}, label: 'Open trip'}); });
  if (un.length) it.push({sev: 'warn', txt: '<b>' + un.length + ' trip' + (un.length > 1 ? 's have' : ' has') + ' no driver.</b> ' + (S.mode === 'claim' ? 'Drivers can take them from Available jobs, or you can assign one.' : 'Assign a driver to each.'), go: {a: 'tile', status: 'Awaiting assignment'}, label: 'Show unassigned'});
  var nc = S.trips.filter(function (t) { return !t.contract && t.phase !== 'done'; });
  if (nc.length) it.push({sev: 'warn', txt: '<b>' + nc.length + ' upcoming trip' + (nc.length > 1 ? 's have' : ' has') + ' no contract.</b> The rate cannot be calculated until one is set.', go: {a: 'tile', contract: '__none'}, label: 'Show trips'});
  var aa = S.trips.filter(function (t) { return statusOf(t) === 'Awaiting approval'; });
  if (aa.length) it.push({sev: 'info', txt: '<b>' + aa.length + ' completed trip' + (aa.length > 1 ? 's are' : ' is') + ' ready for approval.</b> All checks passed.', go: {a: 'tile', status: 'Awaiting approval'}, label: 'Review and approve'});
  S.claimLog.forEach(function (c) { it.push({sev: 'info', txt: '<b>' + esc(drvName(c.driver)) + '</b> tried to take <b>' + c.trip + '</b> at ' + clock(c.t) + ' but another driver already had it.', go: {a: 'openTrip', id: c.trip}, label: 'Open trip'}); });
  if (S.imp.last && S.imp.last.rejected) it.push({sev: 'warn', txt: '<b>Last import:</b> ' + S.imp.last.rejected + ' row' + (S.imp.last.rejected > 1 ? 's were' : ' was') + ' rejected and not imported.', go: {a: 'nav', view: 'imports'}, label: 'Fix rows'});
  if (!DRIVERS.length) it.unshift({sev: 'warn', txt: '<b>No drivers have been added yet.</b> Add a driver to start assigning trips.', go: {a: 'nav', view: 'drivers'}, label: 'Add a driver'});
  return it;
}
function dataAttrs(g) { return Object.keys(g).map(function (k) { return 'data-' + (k === 'a' ? 'a' : k) + '="' + esc(g[k]) + '"'; }).join(' '); }
function overview() {
  var c = counts(), at = attention(), h = '<div><h1 id="h1">Overview</h1><p class="muted">' + S.trips.length + ' trips on the schedule · ' + clock(now()) + '</p></div>' + setupBanner();
  h += '<section class="card" aria-labelledby="na"><h2 id="na" style="margin-bottom:8px">Needs your attention</h2>' + (at.length ? '<ul class="attn">' + at.map(function (i) { return '<li><span class="badge b-' + i.sev + '"><i aria-hidden="true">' + (i.sev === 'warn' ? '!' : 'i') + '</i>' + (i.sev === 'warn' ? 'Check' : 'Info') + '</span><span class="t">' + i.txt + '</span><button type="button" class="btn second sm" ' + dataAttrs(i.go) + '>' + i.label + '</button></li>'; }).join('') + '</ul>' : '<p class="muted">Nothing needs attention right now.</p>') + '</section>';
  h += '<section aria-labelledby="tt" class="stack tight"><h2 id="tt">Trips by status</h2><div class="tiles">' + Object.keys(BADGE).map(function (k) { return '<button type="button" class="tile" data-a="tile" data-status="' + k + '"><span class="l">' + badge(k) + '</span><b>' + c[k] + '</b><span class="def">' + STATUS_DEF[k] + '</span></button>'; }).join('') + '</div></section>';
  return h;
}
function filtered() {
  var f = S.f, q = f.q.trim().toLowerCase();
  return S.trips.filter(function (t) {
    if (f.date === 'today' && t.date !== '2026-10-15') return false;
    if (f.driver === '__none' ? t.driver : f.driver && t.driver !== f.driver) return false;
    if (f.contract === '__none' ? t.contract : f.contract && t.contract !== f.contract) return false;
    if (f.status && statusOf(t) !== f.status) return false;
    if (q && (t.id + ' ' + t.pax + ' ' + t.pickup + ' ' + t.drop).toLowerCase().indexOf(q) < 0) return false;
    return true;
  }).sort(function (a, b) { return a.date === b.date ? a.time - b.time : a.date < b.date ? -1 : 1; });
}
function sel(id, label, opts, val) { return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>'; }
function tripsView() {
  var f = S.f, h = '<div class="row"><h1 id="h1">Trips</h1><button type="button" class="btn navy sm" data-a="nav" data-view="newtrip">Add a trip</button></div>';
  h += '<div class="card"><form class="filters" role="search" onsubmit="return false"><div class="field"><label for="fq">Search</label><input type="search" id="fq" value="' + esc(f.q) + '" placeholder="Trip ID, passenger or address"></div>' +
    sel('fd', 'Driver', [['', 'All drivers'], ['__none', 'Unassigned']].concat(DRIVERS.map(function (d) { return [d.id, d.name]; })), f.driver) +
    sel('fc', 'Contract', [['', 'All'], ['A', 'Contract A'], ['B', 'Contract B'], ['__none', 'No contract']], f.contract) +
    sel('fs', 'Status', [['', 'All statuses']].concat(Object.keys(BADGE).map(function (k) { return [k, k]; })), f.status) +
    sel('fdt', 'Date', [['all', 'All dates'], ['today', 'Today']], f.date) + '</form></div>';
  h += '<div class="row"><p class="muted" id="count" aria-live="polite"></p><button type="button" class="btn quiet" data-a="clearF">Clear filters</button></div>';
  h += '<div class="card tablewrap" style="padding:0"><table><thead><tr><th>Trip</th><th>Pickup</th><th>Route</th><th>Driver</th><th>Contract</th><th>Status</th><th>Review</th></tr></thead><tbody id="rows"></tbody></table></div><div class="cards" id="cardrows"></div>';
  return h;
}
function renderRows() {
  var list = filtered(), rb = $('rows'), cb = $('cardrows'); if (!rb) return;
  $('count').textContent = list.length + ' trip' + (list.length === 1 ? '' : 's') + ' shown';
  if (!list.length) { var e = '<div class="empty"><h2>No trips match</h2><p class="muted">Try clearing a filter or searching for something else.</p></div>'; rb.innerHTML = '<tr><td colspan="7">' + e + '</td></tr>'; cb.innerHTML = '<div class="card">' + e + '</div>'; return; }
  rb.innerHTML = list.map(function (t) { var r = reasons(t).length; return '<tr class="go" data-a="openTrip" data-id="' + t.id + '"><td><button type="button" class="link" data-a="openTrip" data-id="' + t.id + '">' + t.id + '</button><div class="muted small">' + esc(t.pax) + '</div></td><td class="num">' + clock(t.time) + (t.date !== '2026-10-15' ? '<div class="muted small">' + t.date + '</div>' : '') + '</td><td>' + esc(t.pickup) + ' → ' + esc(t.drop) + '</td><td>' + esc(drvName(t.driver)) + '</td><td>' + (t.contract ? 'Contract ' + t.contract : '<span class="muted">None</span>') + '</td><td>' + badge(statusOf(t)) + '</td><td>' + (r ? '<span class="badge b-warn"><i aria-hidden="true">!</i>' + r + ' to check</span>' : '<span class="muted">None</span>') + '</td></tr>'; }).join('');
  cb.innerHTML = list.map(function (t) { var r = reasons(t).length; return '<button type="button" class="tripcard" data-a="openTrip" data-id="' + t.id + '"><div class="row"><b>' + t.id + ' · ' + clock(t.time) + '</b>' + badge(statusOf(t)) + '</div><div>' + esc(t.pickup) + ' → ' + esc(t.drop) + '</div><div class="muted small">' + esc(drvName(t.driver)) + ' · ' + (t.contract ? 'Contract ' + t.contract : 'No contract') + (r ? ' · ' + r + ' to check' : '') + '</div></button>'; }).join('');
}
function section(title, body) { return '<section class="sec card" aria-label="' + esc(title) + '"><h2>' + title + '</h2>' + body + '</section>'; }
function recordView(t) {
  var st = statusOf(t), rs = reasons(t), h = '<div class="crumbs"><button type="button" data-a="backTrips">Trips</button> / ' + t.id + '</div><div class="row"><h1 id="h1">Trip ' + t.id + '</h1>' + badge(st) + '</div>';
  if (S.err) h += '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(S.err) + '</span></div>';
  if (S.msg) h += '<div class="msg ok"><span aria-hidden="true">✓</span><span>' + esc(S.msg) + '</span></div>';
  if (rs.length) h += '<div class="msg warn"><span aria-hidden="true">!</span><div><b>Needs your attention</b><ul style="margin:4px 0 0;padding-left:20px">' + rs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>';
  // A. summary
  var a = '<dl class="kv"><dt>Date and pickup</dt><dd>' + t.date + ' at ' + clock(t.time) + '</dd><dt>Pickup</dt><dd>' + esc(t.pickup) + '</dd><dt>Destination</dt><dd>' + esc(t.drop) + '</dd><dt>Passenger</dt><dd>' + esc(t.pax) + '</dd><dt>Driver</dt><dd>' + esc(drvName(t.driver)) + '</dd></dl>';
  var locked = t.approved;
  a += '<div class="two"><div class="stack tight">' + sel('asg', 'Assign driver', [['', 'Unassigned']].concat(DRIVERS.filter(function (d) { return d.status === 'Active' || d.id === t.driver; }).map(function (d) { return [d.id, d.name]; })), t.driver || '') + btn('Save driver', 'assign', 'second', locked || t.phase !== 'assigned' ? 'disabled' : '') + '</div><div class="stack tight">' + sel('ctr', 'Contract', [['', 'Not assigned'], ['A', 'Contract A'], ['B', 'Contract B']], t.contract || '') + btn('Save contract', 'setContract', 'second', locked ? 'disabled' : '') + '</div></div>' + (locked ? '<p class="muted small">Approved trips are locked.</p>' : t.phase !== 'assigned' ? '<p class="muted small">The driver has started this trip, so the driver can no longer be changed here.</p>' : '');
  h += section('Trip summary', a);
  // B. financial
  var c = calc(t), fin;
  if (c) {
    fin = '<div class="calc"><div class="ln"><span>Contract ' + t.contract + (t.contractBy === 'driver' ? ' (chosen by driver)' : ' (set by office)') + '</span><span></span></div><div class="ln"><span>Flat fee</span><span class="num">' + money(c.f) + '</span></div><div class="ln"><span>' + mi(c.miles) + ' × ' + money(c.rate) + ' per mile</span><span class="num">' + money(c.mile$) + '</span></div><div class="ln t"><span>' + (t.approved ? 'Approved billable amount' : 'Estimated contract amount') + '</span><span class="num">' + money(c.total) + '</span></div></div><p class="muted small">' + (t.approved ? 'Approved by the office for billing.' : 'Calculated from ' + (t.resolved ? 'the miles you approved' : 'the odometer distance') + '. Not yet approved.') + ' This is the amount charged under the contract. It is not profit. Driver pay and costs are not tracked yet.</p>';
  } else fin = '<p class="muted">' + (!t.contract ? 'Assign a contract to calculate the amount.' : 'The amount will be calculated when the trip is submitted.') + '</p><p class="muted small">Rates (flat fee plus per mile) come from the Contracts page and are unconfirmed.</p>';
  h += section('Financial', fin);
  // C. mileage
  var m = odoMiles(t), mv = '';
  if (m == null) mv = '<p class="muted">Mileage appears here after the driver submits the trip.</p>';
  else {
    var diff = Math.abs(m - t.mapMi), pc = Math.round(variance(t) * 100), over = variance(t) > S.tol / 100;
    mv = '<dl class="kv"><dt>Start odometer</dt><dd class="num">' + t.odoS.toFixed(1) + '</dd><dt>End odometer</dt><dd class="num">' + t.odoE.toFixed(1) + '</dd><dt>Odometer distance</dt><dd class="num">' + mi(m) + '</dd><dt>Map estimate</dt><dd class="num">' + mi(t.mapMi) + '</dd><dt>Difference</dt><dd class="num">' + mi(diff) + ' (' + pc + '%)</dd></dl>' +
      (t.resolved ? '<div class="msg ok"><span aria-hidden="true">✓</span><span>Resolved by office: ' + mi(t.resolved.miles) + ' approved (' + esc(t.resolved.basis) + '). Reason: ' + esc(t.resolved.note) + '</span></div>' :
       over ? '<div class="msg warn"><span aria-hidden="true">!</span><span>Difference is ' + pc + '%, above the ' + S.tol + '% limit. Decide which distance to bill, and record why.</span></div>' : '<div class="msg ok"><span aria-hidden="true">✓</span><span>Difference is ' + pc + '%, within the ' + S.tol + '% limit.</span></div>');
    if (over && !t.resolved && !t.approved) mv += '<div class="stack card" style="background:var(--bg)"><h3>Resolve the difference</h3><div class="field"><label for="basis">Distance to approve</label><select id="basis"><option value="odo">Odometer distance (' + mi(m) + ')</option><option value="map">Map estimate (' + mi(t.mapMi) + ')</option><option value="custom">Another value</option></select></div><div class="field"><label for="cust">Other value (miles), only if you chose Another value</label><input id="cust" type="number" step="0.1" min="0"></div><div class="field"><label for="note">Reason (required)</label><textarea id="note"></textarea>' + fieldErr('note') + '</div>' + btn('Approve this distance', 'resolveMi', 'navy') + '</div>';
  }
  h += section('Mileage check', mv + '<p class="muted small">The ' + S.tol + '% limit is a demo setting. Change it under Contracts.</p>');
  // D. waiting
  var w = t.waits.length || t.wait ? '<dl class="kv"><dt>Recorded waiting</dt><dd class="num">' + dur(waitTotal(t)) + '</dd>' + t.waits.map(function (x, i) { return '<dt>Period ' + (i + 1) + '</dt><dd>' + clock(x.s, 1) + ' to ' + clock(x.e, 1) + ' (' + dur(x.e - x.s) + '), ' + esc(x.why) + '</dd>'; }).join('') + '</dl>' : '<p class="muted">No waiting recorded.</p>';
  h += section('Waiting time', w + '<dl class="kv"><dt>Billable waiting</dt><dd>None applied. A waiting-fee rule has not been confirmed, so waiting is recorded only.</dd></dl>');
  // problem + confirm contract actions
  var act = '';
  if (t.contractBy === 'driver' && !t.contractOk && t.contract) act += '<div class="row"><span>The driver chose Contract ' + t.contract + '.</span>' + btn('Confirm contract', 'confirmC', 'second') + '</div>';
  if (t.problem && t.problemOpen) act += '<div class="stack tight"><p>Driver reported: “' + esc(t.problem) + '”</p>' + btn('Mark problem as handled', 'handled', 'second') + '</div>';
  if (act) h += section('Needs a decision', act);
  // E. history
  var L = t.log.slice().sort(function (x, y) { return x.t - y.t; }), li = function (e) { return '<li><time>' + clock(e.t, 1) + '</time><div><b>' + esc(e.label) + '</b>' + (e.detail ? '<div class="muted small">' + esc(e.detail) + '</div>' : '') + '<div class="who">' + esc(e.actor) + '</div></div></li>'; };
  h += section('Activity history', L.length ? '<ul class="hist">' + L.slice(-6).map(li).join('') + '</ul>' + (L.length > 6 ? '<details><summary style="cursor:pointer;font-weight:600;min-height:32px">Earlier events (' + (L.length - 6) + ')</summary><ul class="hist">' + L.slice(0, -6).map(li).join('') + '</ul></details>' : '') + '<p class="muted small">This demo does not lock history. A real system must store it so it cannot be changed.</p>' : '<p class="muted">No activity yet.</p>');
  // approve
  var ok = st === 'Awaiting approval';
  h += '<div class="card stack"><h2>Approval</h2><p class="muted">' + (t.approved ? 'This trip is approved for billing.' : ok ? 'All checks passed. Approving marks the trip ready to invoice.' : t.phase !== 'done' ? 'Available after the driver submits the trip.' : 'Resolve the items above first.') + '</p>' + (t.approved ? '' : btn('Approve for billing', 'approve', 'primary', ok ? '' : 'disabled')) + '</div>';
  return h;
}
function parseImport(text) {
  var lines = text.split(/\r?\n/).map(function (l, i) { return {n: i + 1, s: l}; }).filter(function (l) { return l.s.trim(); }), res = {good: [], bad: [], dup: [], attn: 0, fatal: ''};
  if (!lines.length) { res.fatal = 'The file is empty. Paste rows or choose a CSV file.'; return res; }
  var hd = lines[0].s.split(',').map(function (x) { return x.trim().toLowerCase(); }), need = ['date', 'time', 'passenger_ref', 'pickup', 'destination', 'contract'], miss = need.filter(function (n) { return hd.indexOf(n) < 0; });
  if (miss.length) { res.fatal = 'The first line must list these columns: ' + need.join(', ') + '. Missing: ' + miss.join(', ') + '.'; return res; }
  res.header = lines[0].s; var seen = {};
  lines.slice(1).forEach(function (l) {
    var c = l.s.split(',').map(function (x) { return x.trim(); }), r = {}; hd.forEach(function (k, i) { r[k] = c[i] || ''; });
    var why = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) why.push('Date must look like 2026-10-15');
    var tm = /^(\d{1,2}):(\d{2})$/.exec(r.time); if (!tm || +tm[1] > 23 || +tm[2] > 59) why.push('Time must be a real 24-hour time such as 09:30');
    if (!/^P-\d+$/.test(r.passenger_ref)) why.push('Passenger reference must look like P-123');
    if (!r.pickup) why.push('Pickup address is missing');
    if (!r.destination) why.push('Destination is missing');
    if (r.contract && ['A', 'B'].indexOf(r.contract.toUpperCase()) < 0) why.push('Contract must be A, B or blank');
    if (why.length) { res.bad.push({n: l.n, raw: l.s, why: why.join('. ')}); return; }
    var min = +tm[1] * 3600 + +tm[2] * 60, key = [r.date, min, r.passenger_ref, r.pickup, r.destination].join('|');
    var dupe = S.trips.some(function (t) { return [t.date, t.time, t.pax, t.pickup, t.drop].join('|') === key; }) || seen[key];
    seen[key] = true;
    if (dupe) { res.dup.push({n: l.n, raw: l.s}); return; }
    if (!r.contract) res.attn++;
    res.good.push({date: r.date, time: min, pax: r.passenger_ref, pickup: r.pickup, drop: r.destination, contract: r.contract.toUpperCase() || null});
  });
  return res;
}
function importsView() { return '<div><h1 id="h1">Import trips</h1><p class="muted">Add many trips from a spreadsheet. Rows are checked first, and nothing is added until you confirm.</p></div>' + flash() + importPanel(); }
function contractsView() {
  var h = '<div><h1 id="h1">Contracts</h1><p class="muted">These settings drive every calculation. The demo does not restrict who can change them. A real system must.</p></div>';
  if (S.msg) h += '<div class="msg ok" role="status"><span aria-hidden="true">✓</span><span>' + esc(S.msg) + '</span></div>';
  h += '<section class="card stack" aria-labelledby="rt"><h2 id="rt">Contract rates</h2><div class="msg warn"><span aria-hidden="true">!</span><span>These rates are unconfirmed. Confirm with the owner whether they are revenue, driver pay or both.</span></div><div class="two">';
  ['A', 'B'].forEach(function (k) { h += '<div class="stack tight"><h3>Contract ' + k + '</h3><div class="field"><label for="f' + k + '">Flat fee ($)</label><input id="f' + k + '" type="number" step="0.01" min="0" value="' + S.rates[k].f.toFixed(2) + '" data-rate="' + k + 'f"></div><div class="field"><label for="m' + k + '">Per mile ($)</label><input id="m' + k + '" type="number" step="0.01" min="0" value="' + S.rates[k].m.toFixed(2) + '" data-rate="' + k + 'm"></div></div>'; });
  h += '</div></section><section class="card stack" aria-labelledby="as"><h2 id="as">Job assignment</h2><fieldset class="field"><legend class="sr">Assignment method</legend><label class="choice" for="mClaim"><input type="radio" name="mode" id="mClaim" value="claim" ' + (S.mode === 'claim' ? 'checked' : '') + '> Drivers can take open jobs</label><label class="choice" for="mAssign"><input type="radio" name="mode" id="mAssign" value="assign" ' + (S.mode === 'assign' ? 'checked' : '') + '> The office assigns every job</label></fieldset></section>';
  h += '<section class="card stack" aria-labelledby="mt"><h2 id="mt">Mileage check</h2><div class="field"><label for="tol">Flag a trip when odometer and map estimate differ by more than (%)</label><input id="tol" type="number" min="1" max="50" value="' + S.tol + '"><p class="help">Flagging only holds the trip for review. It never changes the amount on its own.</p></div></section>';
  h += '<section class="card stack"><h2>Waiting time</h2><p>Recorded but not charged. Add a rule here once the contracts confirm whether waiting is paid.</p></section>';
  return h;
}
function adminShell() {
  if (!S.ob.admin.done) return wizard();
  var V = [['overview', 'Overview'], ['trips', 'Trips'], ['drivers', 'Drivers'], ['contracts', 'Contracts'], ['imports', 'Import trips'], ['help', 'Help']], t = S.aTrip ? byId(S.aTrip) : null, body;
  if (t) body = recordView(t); else body = S.aView === 'trips' ? tripsView() : S.aView === 'newtrip' ? newTripView() : S.aView === 'drivers' ? driversView() : S.aView === 'imports' ? importsView() : S.aView === 'contracts' ? contractsView() : S.aView === 'help' ? officeHelp() : overview();
  return '<div class="adm"><nav aria-label="Office">' + V.map(function (v) { return '<button type="button" data-a="nav" data-view="' + v[0] + '" ' + (S.aView === v[0] || (v[0] === 'trips' && S.aView === 'newtrip') ? 'aria-current="page"' : '') + '>' + v[1] + '</button>'; }).join('') + '</nav><main id="main">' + body + '</main></div>';
}

/* ================= onboarding, drivers and help ================= */
var OB_KEY = 'dozcare.ob.v1', LOGO = 'logo.jpg', ORG = 'Doz and CoCare LLC';
function obDefault() { return {driver: {done: false, step: 0, signedIn: false, contact: '', phase: 'contact'}, admin: {done: false, step: 0, orgOk: false, wfOk: false, contractsOk: false, tripAdded: false}}; }
function loadOb() { try { var v = JSON.parse(localStorage.getItem(OB_KEY)); if (v && v.driver && v.admin) return v; } catch (e) {} return obDefault(); }
function saveOb() { try { localStorage.setItem(OB_KEY, JSON.stringify(S.ob)); } catch (e) {} }
function pill(t, cls, icon) { return '<span class="badge b-' + cls + '"><i aria-hidden="true">' + icon + '</i>' + esc(t) + '</span>'; }
function validContact(c) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) || c.replace(/\D/g, '').length >= 10; }
function normContact(c) { return c.indexOf('@') > -1 ? c.trim().toLowerCase() : c.replace(/\D/g, ''); }
function fld(id, label, help, type, ph) { return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" autocomplete="off"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (S.fieldErr[id] ? ' aria-invalid="true" aria-describedby="' + id + 'E"' : '') + '>' + (help ? '<p class="help">' + help + '</p>' : '') + fieldErr(id) + '</div>'; }
function flash() { var h = ''; if (S.err) h += '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(S.err) + '</span></div>'; if (S.msg) h += '<div class="msg ok"><span aria-hidden="true">✓</span><span>' + esc(S.msg) + '</span></div>'; return h; }
function essentialsOk() { var a = S.ob.admin; return a.orgOk && a.wfOk && a.contractsOk; }
var CONTACT_NOTE = 'Contact details for your office have not been set up in this app yet. Ask your office for the right phone number.';
var FAQ = {
  driver: [
    ['I cannot sign in', 'Check that you entered the phone number or email your office gave you. If it still does not work, ask your office to resend your invitation. You do not need to create an account yourself.'],
    ['The passenger is not ready', 'Tap Start recording waiting time (at pickup) or Pause and record waiting (during the trip). Tap the button again when you are ready to go. The wait is recorded for you.'],
    ['I made a mistake with the odometer', 'If you have not submitted yet, correct the number. If you have submitted, use Report a problem with this trip and tell the office what the correct number is.'],
    ['Someone else took the job first', 'That can happen when two drivers tap at nearly the same time. The list refreshes so you can pick another job.'],
    ['It says my entry was not saved', 'Your entry is kept on the screen. Check your signal and tap the same button again.']],
  office: [
    ['How do I assign a driver?', 'Open the trip from Trips, choose a driver under Trip summary and tap Save driver. Only drivers who have signed in can be chosen.'],
    ['What does Needs review mean?', 'The trip has missing or conflicting information, for example no contract or odometer miles that differ from the map estimate. Open the trip to see exactly why.'],
    ['Why is Approve for billing greyed out?', 'The trip must be complete and have no open items. The page tells you what is left to resolve.'],
    ['Some rows failed to import', 'They stay in the box with the reason for each. Fix them there and tap Check rows again. Rows that were fine are not affected.'],
    ['I entered a wrong contract rate', 'Go to Contracts, correct the figure and save. Trips not yet approved use the new rate.']]
};
function faqHtml(role) { return '<div class="stack tight">' + FAQ[role].map(function (q) { return '<details class="card"><summary style="font-weight:600;min-height:32px;cursor:pointer">' + esc(q[0]) + '</summary><p style="margin-top:8px">' + esc(q[1]) + '</p></details>'; }).join('') + '</div>'; }
function helpBlocks(role, extra) {
  return '<section class="stack tight"><h2>Common questions</h2>' + faqHtml(role) + '</section><section class="stack tight"><h2>If something goes wrong</h2><div class="card stack tight"><p><b>No connection:</b> the app keeps what you typed. Check your signal and tap the button again.</p><p><b>Login expired:</b> sign in again, then repeat the action.</p><p><b>Still stuck:</b> ' + (role === 'driver' ? 'ask your office.' : 'check the question list above.') + '</p></div></section><section class="stack tight"><h2>Contact</h2><div class="msg info"><span aria-hidden="true">i</span><span>' + CONTACT_NOTE + '</span></div></section>';
}
/* ---- driver onboarding ---- */
function drvStage() { var o = S.ob.driver; if (S.role !== 'driver') return 'app'; if (S.tourReplay) return 'tour'; if (!o.done) return ['welcome', 'signin', 'confirm', 'tour'][o.step] || 'tour'; return o.signedIn ? 'app' : 'signin'; }
function obShell(body, bar) { return '<div class="drv"><main id="main">' + body + '</main><div class="actionbar"><div class="in">' + bar + '</div></div></div>'; }
function oBtn(label, d, cls, extra) { return '<button type="button" class="btn ' + (cls || 'primary') + ' block" data-a="obD" data-do="' + d + '" ' + (extra || '') + '>' + label + '</button>'; }
function welcomeView() { return obShell('<div class="hero"><img src="' + LOGO + '" alt="Doz and Co Care LLC"><h1 id="h1">Welcome to Doz and CoCare</h1><p class="muted">Your trips, instructions and trip records are all in one place.</p></div>', oBtn('Get started', 'start')); }
function signinView() {
  var o = S.ob.driver, code = o.phase === 'code', h = '<div><h1 id="h1">' + (code ? 'Enter your code' : 'Sign in') + '</h1><p class="muted" style="margin-top:8px">' + (code ? 'We sent a 6-digit code to ' + esc(o.contact) + '.' : 'Your office has already set up your account. Enter the phone number or email they gave you and we will send you a sign-in code.') + '</p></div>' + flash();
  h += code ? fld('siK', 'Sign-in code', 'Type the 6 digits from the message.', 'text', '6 digits') : fld('siC', 'Phone number or email', 'Use the one your office has on file for you.', 'text', 'For example 555 010 0123');
  h += code ? '<button type="button" class="btn quiet" style="align-self:flex-start" data-a="obD" data-do="other">Use a different phone or email</button>' : '<details class="card"><summary style="font-weight:600;min-height:32px;cursor:pointer">I cannot sign in</summary><p style="margin-top:8px">Ask your office to resend your invitation or to check the phone number or email they have for you. You do not need to create an account. ' + CONTACT_NOTE + '</p></details>';
  h += '<p class="muted small">Demonstration: any phone number or email works, and the code is 123456. Nothing is actually sent.</p>';
  return obShell(h, oBtn(code ? 'Sign in' : 'Send sign-in code', code ? 'verify' : 'send'));
}
function confirmView() {
  var d = drvById(DID), h = '<div><h1 id="h1">Is this you?</h1><p class="muted" style="margin-top:8px">This is what your office has on file. You do not need to type anything.</p></div><div class="card"><dl class="kv"><dt>Name</dt><dd>' + esc(d.name) + '</dd><dt>Driver ID</dt><dd>' + esc(d.id) + '</dd><dt>Organisation</dt><dd>' + ORG + '</dd></dl></div>';
  if (S.wrongInfo) h += '<div class="msg info"><span aria-hidden="true">i</span><span>Tell your office so they can correct it. You can keep going in the meantime.</span></div>';
  return obShell(h, oBtn('This is correct', 'confirm') + oBtn('Something is not right', 'wrong', 'quiet'));
}
function slides() {
  var s = [
    {t: 'Find your trips', x: 'Trips assigned to you are on Home and under My trips. The next one is always shown first.', v: '<div class="mtabs"><span>Home</span><span class="on">My trips</span><span>History</span></div>'},
    {t: 'See where to go', x: 'Open a trip to see the pickup time, the pickup address and the destination.', v: '<b class="num">9:30 AM</b><div class="route"><span class="dot"></span><div>Example pickup address</div><span class="dot d"></span><div>Example destination</div></div>'}];
  if (S.mode === 'claim') s.push({t: 'Take an open job', x: 'Under Available you can take jobs that fit your schedule. If someone else takes it first, the app tells you and refreshes the list.', v: '<div class="mbtn navy">Take this trip</div>'});
  s.push({t: 'Arrive and start', x: 'Tap when you reach the pickup. Then enter your odometer reading and tap Start trip.', v: '<div class="mbtn">I have arrived at pickup</div><div class="mbtn" style="margin-top:8px">Start trip</div>'},
    {t: 'Record waiting', x: 'If the passenger is not ready, record the waiting time. Tap again when you can go. The app keeps the time for you.', v: '<div class="mwait"><b class="num">02:14</b>Waiting</div><div class="mbtn" style="margin-top:8px">Resume trip</div>'},
    {t: 'Finish the trip', x: 'At the destination tap End trip, enter your odometer reading and submit. You will see a message when it is saved.', v: '<div class="mbtn">Submit trip</div><div class="mok">✓ Trip submitted. It is saved.</div>'});
  return s;
}
function tourView() {
  var sl = slides(), i = Math.min(S.tourIdx || 0, sl.length - 1), c = sl[i], last = i === sl.length - 1;
  var h = '<div><p class="muted small">How the app works · ' + (i + 1) + ' of ' + sl.length + '</p><h1 id="h1">' + c.t + '</h1></div><div class="mini" aria-hidden="true"><span class="ex">Example</span>' + c.v + '</div><p>' + c.x + '</p><div class="dots" aria-hidden="true">' + sl.map(function (x, k) { return '<span class="' + (k === i ? 'on' : '') + '"></span>'; }).join('') + '</div>';
  return obShell(h, oBtn(last ? 'Finish' : 'Next', last ? 'finishTour' : 'next') + '<div class="row" style="justify-content:space-between">' + (i ? '<button type="button" class="btn quiet" data-a="obD" data-do="prev">Back</button>' : '<span></span>') + '<button type="button" class="btn quiet" data-a="obD" data-do="skipTour">' + (S.tourReplay ? 'Close' : 'Skip for now') + '</button></div>');
}
function driverHelp() {
  var d = drvById(DID);
  return '<h1 id="h1">Help</h1><section class="stack tight"><h2>How to use the app</h2><div class="card stack"><p>A short walk through the main steps.</p><button type="button" class="btn navy" data-a="obD" data-do="replay">Show me how the app works</button></div></section><section class="stack tight"><h2>Your account</h2><div class="card stack"><dl class="kv"><dt>Name</dt><dd>' + esc(d.name) + '</dd><dt>Driver ID</dt><dd>' + esc(d.id) + '</dd></dl><button type="button" class="btn second" data-a="obD" data-do="signout">Sign out</button></div></section>' + helpBlocks('driver');
}
/* ---- drivers (office) ---- */
function drvById(id) { for (var i = 0; i < S.drivers.length; i++) if (S.drivers[i].id === id) return S.drivers[i]; return {id: id, name: 'Unassigned', contact: '', status: ''}; }
function driversPanel() {
  var h = '', L = S.drivers;
  if (!L.length) h += '<div class="card empty"><h2>No drivers have been added yet</h2><p class="muted">Add a driver to start assigning trips.</p></div>';
  else h += '<div class="stack tight">' + L.map(function (d) { return '<div class="card row"><div style="min-width:0"><b>' + esc(d.name) + '</b> <span class="muted small">' + d.id + '</span><div class="muted small" style="overflow-wrap:anywhere">' + esc(d.contact) + '</div></div><div class="row">' + (d.status === 'Active' ? pill('Active', 'ok', '✓') : pill('Invited, not signed in yet', 'warn', '◷')) + (d.status === 'Invited' ? '<button type="button" class="btn second sm" data-a="resendInv" data-id="' + d.id + '">Resend invitation</button>' : '') + '</div></div>'; }).join('') + '</div>';
  h += '<section class="card stack" aria-labelledby="ad"><h2 id="ad">Add driver</h2>' + fld('dn', 'Full name', '', 'text') + fld('dc', 'Phone number or email', 'The driver uses this to sign in. We check it is not already used.', 'text') + btn('Add driver', 'addDriver', 'navy') + '</section>';
  h += '<details class="card" id="drvimp"' + (S.drvImp.result ? ' open' : '') + '><summary style="font-weight:600;min-height:32px;cursor:pointer">Import a list of drivers</summary><div class="stack" style="margin-top:12px"><div class="field"><label for="drvcsv">Rows</label><textarea id="drvcsv" style="font-family:var(--mono);font-size:14px">' + esc(S.drvImp.text) + '</textarea><p class="help">One driver per line: name,phone or email. The first line must be: name,contact</p></div><button type="button" class="btn second" data-a="checkDrv">Check list</button>';
  var r = S.drvImp.result;
  if (r) { if (r.fatal) h += '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(r.fatal) + '</span></div>'; else h += '<p><b>' + r.good.length + '</b> ready to add, <b>' + r.bad.length + '</b> need fixing, <b>' + r.dup.length + '</b> already exist.</p>' + (r.good.length ? '<ul style="margin:0;padding-left:20px">' + r.good.map(function (g) { return '<li>' + esc(g.name) + ' · ' + esc(g.contact) + '</li>'; }).join('') + '</ul>' : '') + r.bad.concat(r.dup).map(function (b) { return '<div class="msg warn"><span aria-hidden="true">!</span><span>Line ' + b.n + ': ' + esc(b.why) + '</span></div>'; }).join('') + (r.good.length ? btn('Add ' + r.good.length + ' driver' + (r.good.length === 1 ? '' : 's'), 'doDrv', 'primary') : ''); }
  return h + '</div></details>';
}
function driversView() { return '<div><h1 id="h1">Drivers</h1><p class="muted">People who can sign in and drive. Invited drivers show as active once they sign in.</p></div>' + flash() + driversPanel(); }
function parseDrivers(text) {
  var lines = text.split(/\r?\n/).map(function (l, i) { return {n: i + 1, s: l}; }).filter(function (l) { return l.s.trim(); }), res = {good: [], bad: [], dup: [], fatal: ''};
  if (!lines.length) { res.fatal = 'The box is empty. Add one driver per line.'; return res; }
  if (lines[0].s.replace(/\s/g, '').toLowerCase() !== 'name,contact') { res.fatal = 'The first line must be: name,contact'; return res; }
  var seen = {};
  lines.slice(1).forEach(function (l) {
    var c = l.s.split(','), name = (c[0] || '').trim(), con = (c.slice(1).join(',') || '').trim();
    if (!name) return res.bad.push({n: l.n, why: 'The name is missing', raw: l.s});
    if (!validContact(con)) return res.bad.push({n: l.n, why: 'Enter a phone number (10 digits or more) or an email for ' + name, raw: l.s});
    var k = normContact(con), ex = S.drivers.filter(function (d) { return normContact(d.contact) === k; })[0];
    if (ex) return res.dup.push({n: l.n, why: name + ' uses the same phone or email as ' + ex.name + ', who is already a driver', raw: l.s});
    if (seen[k]) return res.dup.push({n: l.n, why: name + ' appears twice in this list', raw: l.s});
    seen[k] = 1; res.good.push({name: name, contact: con});
  });
  return res;
}
/* ---- trips: create one ---- */
function newTripView() {
  return '<div class="crumbs"><button type="button" data-a="backTrips">Trips</button> / Add a trip</div><div><h1 id="h1">Add a trip</h1><p class="muted">Use this for a single trip. To add many at once, use Import trips.</p></div>' + flash() + tripForm();
}
function tripForm() {
  return '<div class="card stack">' + fld('ctd', 'Date', 'Format: 2026-10-15', 'text', '2026-10-15') + fld('ctt', 'Pickup time', '24-hour time, for example 14:30', 'text', '14:30') + fld('ctp', 'Passenger reference', 'Use the reference, not the name. For example P-123', 'text') + fld('ctk', 'Pickup address', '', 'text') + fld('ctz', 'Destination', '', 'text') +
    '<div class="field"><label for="ctc">Contract</label><select id="ctc"><option value="">Not sure yet</option><option value="A">Contract A</option><option value="B">Contract B</option></select><p class="help">You can set this later, but the amount cannot be calculated without it.</p></div>' + btn('Add trip', 'createTrip', 'navy') + '</div>';
}
/* ---- help (office) ---- */
function officeHelp() {
  return '<h1 id="h1">Help</h1><section class="stack tight"><h2>How to use this app</h2><div class="card stack"><p>Run the short setup again, or look at what each section is for.</p><div class="row" style="justify-content:flex-start"><button type="button" class="btn navy" data-a="obA" data-do="rerun">Run setup again</button><button type="button" class="btn second" data-a="obA" data-do="tour">What each section is for</button></div></div></section>' + helpBlocks('office');
}
/* ---- office setup wizard ---- */
var WSTEPS = ['Welcome', 'Organisation', 'Contracts', 'Drivers', 'Trips', 'Review', 'Tour'];
function aBtn(label, d, cls, extra) { return '<button type="button" class="btn ' + (cls || 'primary') + ' block" data-a="obA" data-do="' + d + '" ' + (extra || '') + (S.busy ? ' disabled' : '') + '>' + label + '</button>'; }
function setupExample(k) { var r = S.rates[k]; return '20 miles: ' + money(r.f) + ' + 20 × ' + money(r.m) + ' = ' + money(r.f + 20 * r.m); }
function wizard() {
  var a = S.ob.admin, st = a.step, h = '', bar = '', title = '';
  var prog = '<div><p class="muted small">Setup · ' + (st === 0 ? 'Start' : st < 6 ? 'Step ' + st + ' of 5' : 'Last step') + '</p><div class="steps" aria-hidden="true">' + [1, 2, 3, 4, 5].map(function (i) { return '<span class="' + (i < st || st === 6 ? 'd' : i === st ? 'c' : '') + '"></span>'; }).join('') + '</div></div>';
  if (st === 0) {
    h = '<div class="hero"><img src="' + LOGO + '" alt="Doz and Co Care LLC"><h1 id="h1">Let’s get Doz and CoCare ready</h1><p class="muted">We’ll help you set up your contracts, drivers and trips. There are five short steps. You can stop and come back at any time.</p></div><ol class="card" style="margin:0;padding:16px 16px 16px 36px"><li>Check your organisation and how jobs are assigned</li><li>Check your contract rates</li><li>Add your drivers</li><li>Add your first trips</li><li>Review the checklist</li></ol>';
    bar = aBtn('Start setup', 'next') + aBtn('I will do this later', 'later', 'quiet');
  } else if (st === 1) {
    h = prog + '<h1 id="h1">Your organisation</h1>' + flash() + '<div class="card"><dl class="kv"><dt>Organisation</dt><dd>' + ORG + '</dd></dl><p class="help muted small" style="margin-top:8px">We already have this. Nothing to type.</p></div><fieldset class="field card"><legend>How are jobs given to drivers?</legend><div class="stack tight"><label class="choice" for="mClaim"><input type="radio" name="mode" id="mClaim" value="claim" ' + (S.mode === 'claim' ? 'checked' : '') + '> Drivers can take open jobs</label><label class="choice" for="mAssign"><input type="radio" name="mode" id="mAssign" value="assign" ' + (S.mode === 'assign' ? 'checked' : '') + '> The office assigns every job</label></div><p class="help">You can change this later under Contracts.</p></fieldset>';
    bar = btn('Confirm and continue', 'wOrg') + aBtn('Back', 'prev', 'quiet');
  } else if (st === 2) {
    h = prog + '<h1 id="h1">Your contracts</h1><div class="msg warn"><span aria-hidden="true">!</span><span>These figures must match your signed contracts. The numbers shown are examples supplied earlier and have not been verified.</span></div>' + flash() + '<div class="stack">';
    ['A', 'B'].forEach(function (k) { h += '<div class="card stack tight"><h2>Contract ' + k + '</h2><div class="field"><label for="f' + k + '">Flat fee ($)</label><input id="f' + k + '" type="number" inputmode="decimal" step="0.01" min="0" value="' + S.rates[k].f.toFixed(2) + '" data-rate="' + k + 'f"><p class="help">Enter the amount specified in the contract.</p></div><div class="field"><label for="m' + k + '">Rate per mile ($)</label><input id="m' + k + '" type="number" inputmode="decimal" step="0.01" min="0" value="' + S.rates[k].m.toFixed(2) + '" data-rate="' + k + 'm"></div><p class="msg info" style="margin:0"><span>Example, ' + setupExample(k) + '</span></p></div>'; });
    h += '</div><label class="choice" for="cok"><input type="checkbox" id="cok"' + (a.contractsOk ? ' checked' : '') + '> I have checked these figures against the signed contracts</label>' + fieldErr('cok');
    bar = btn('Save contracts', 'wCon') + aBtn('Back', 'prev', 'quiet');
  } else if (st === 3) {
    h = prog + '<h1 id="h1">Your drivers</h1><p class="muted">Add drivers one at a time, or import a list. Each driver gets an invitation to sign in.</p>' + flash() + driversPanel();
    bar = aBtn('Continue', 'next') + '<div class="row" style="justify-content:space-between"><button type="button" class="btn quiet" data-a="obA" data-do="prev">Back</button><button type="button" class="btn quiet" data-a="obA" data-do="next">Skip for now</button></div>';
  } else if (st === 4) {
    if (S.wizSub === 'create') h = prog + '<h1 id="h1">Add a trip</h1>' + flash() + tripForm();
    else if (S.wizSub === 'import') h = prog + '<h1 id="h1">Import trips</h1>' + flash() + importPanel();
    else h = prog + '<h1 id="h1">Your first trips</h1>' + flash() + '<div class="stack"><div class="card stack"><h2>Import trips</h2><p>Add many trips at once from a spreadsheet.</p><button type="button" class="btn navy" data-a="obA" data-do="sub" data-sub="import">Import trips</button></div><div class="card stack"><h2>Create a trip</h2><p>Add one trip by typing it in.</p><button type="button" class="btn navy" data-a="obA" data-do="sub" data-sub="create">Create a trip</button></div></div>';
    bar = S.wizSub ? aBtn('Back to the two options', 'sub', 'second', 'data-sub=""') : aBtn('Continue', 'next') + '<div class="row" style="justify-content:space-between"><button type="button" class="btn quiet" data-a="obA" data-do="prev">Back</button><button type="button" class="btn quiet" data-a="obA" data-do="next">Skip for now</button></div>';
    if (S.wizSub) bar += aBtn('Continue', 'next', 'quiet');
  } else if (st === 5) {
    var act = S.drivers.filter(function (d) { return d.status === 'Active'; }).length, items = [[a.orgOk, 'Organisation configured', 1, true], [a.wfOk, 'Trip workflow configured', 1, true], [a.contractsOk, 'Contracts reviewed', 2, true], [S.drivers.length > 0, 'Drivers added (' + S.drivers.length + ', ' + act + ' signed in)', 3, false], [a.tripAdded, 'First trip created or imported', 4, false]], miss = items.filter(function (i) { return !i[0] && i[3]; });
    h = prog + '<h1 id="h1">Review your setup</h1>' + (miss.length ? '<div class="msg warn"><span aria-hidden="true">!</span><span>Before you process real trips, finish: ' + miss.map(function (m) { return m[1].toLowerCase(); }).join(', ') + '.</span></div>' : '<div class="msg ok"><span aria-hidden="true">✓</span><span>The essential setup is done.</span></div>') + '<ul class="card" style="list-style:none;margin:0;padding:0 16px">' + items.map(function (i) { return '<li class="row" style="padding:12px 0;border-bottom:1px solid var(--line)"><span>' + (i[0] ? pill('Done', 'ok', '✓') : pill('Not done', 'warn', '!')) + ' ' + esc(i[1]) + (i[3] ? ' <span class="muted small">(essential)</span>' : '') + '</span>' + (i[0] ? '' : '<button type="button" class="btn quiet" data-a="obA" data-do="go" data-step="' + i[2] + '">Do this</button>') + '</li>'; }).join('') + '</ul>';
    bar = aBtn('Finish setup', 'next') + aBtn('Back', 'prev', 'quiet');
  } else {
    h = '<div><h1 id="h1">You are all set</h1><p class="muted">Here is what each part of the app is for.</p></div>' + tourList();
    bar = aBtn('Go to Overview', 'finish') ;
  }
  return '<div class="wiz"><main id="main" class="stack">' + h + '</main><div class="actionbar"><div class="in">' + bar + '</div></div></div>';
}
function tourList() { return '<ul class="card stack tight" style="list-style:none;margin:0;padding:16px">' + [['Overview', 'What needs your attention today.'], ['Trips', 'Every trip, with filters and the full record.'], ['Drivers', 'Add drivers and see who has signed in.'], ['Contracts', 'Rates and rules used in every calculation.'], ['Import trips', 'Add many trips from a spreadsheet, checked first.'], ['Help', 'Questions, fixes, and this setup again.']].map(function (x) { return '<li><b>' + x[0] + '</b><div class="muted">' + x[1] + '</div></li>'; }).join('') + '</ul>'; }
function setupBanner() { if (essentialsOk()) return ''; var a = S.ob.admin, miss = []; if (!a.orgOk || !a.wfOk) miss.push('organisation and job assignment'); if (!a.contractsOk) miss.push('contract rates'); return '<div class="msg warn"><span aria-hidden="true">!</span><div class="stack tight"><span><b>Setup is not finished.</b> Still to check: ' + miss.join(' and ') + '. Do this before processing real trips.</span><button type="button" class="btn second sm" style="align-self:flex-start" data-a="obA" data-do="resume">Continue setup</button></div></div>'; }
function importPanel() {
  var r = S.imp.result, h = '<div class="card stack"><p class="muted small">Not sure how the spreadsheet should look? Start from the template.</p><div class="row" style="justify-content:flex-start"><button type="button" class="btn second sm" data-a="tplUse">Use the example</button><button type="button" class="btn second sm" data-a="tplCopy">Copy template</button><button type="button" class="btn second sm" data-a="tplDownload">Download template</button></div><div class="field"><label for="impfile">CSV file (optional)</label><input id="impfile" type="file" accept=".csv,text/csv"></div><div class="field"><label for="imptext">Rows</label><textarea id="imptext" style="min-height:200px;font-family:var(--mono);font-size:14px">' + esc(S.imp.text) + '</textarea><p class="help">Columns: date, time, passenger_ref, pickup, destination, contract. Date like 2026-10-15, time like 09:30, passenger reference like P-123, contract A, B or blank. Nothing is added until you confirm.</p></div>' + btn('Check rows', 'checkImp', 'navy') + '</div>';
  if (r) {
    if (r.fatal) return h + '<div class="msg err" role="alert"><span aria-hidden="true">⚠</span><span>' + esc(r.fatal) + '</span></div>';
    h += '<section class="stack" aria-labelledby="ir"><h2 id="ir">Check result</h2><div class="tiles t4"><div class="tile"><span class="l">Ready to import</span><b>' + r.good.length + '</b></div><div class="tile"><span class="l">Rejected</span><b>' + r.bad.length + '</b><span class="def">Fix and check again</span></div><div class="tile"><span class="l">Already in the system</span><b>' + r.dup.length + '</b><span class="def">Skipped as duplicates</span></div><div class="tile"><span class="l">Need a contract</span><b>' + r.attn + '</b><span class="def">Imported with no contract</span></div></div>';
    if (r.good.length) h += '<div class="card stack tight"><h3>Preview: these trips will be added</h3><div class="tablewrap"><table><thead><tr><th>Date</th><th>Time</th><th>Passenger</th><th>Route</th><th>Contract</th></tr></thead><tbody>' + r.good.slice(0, 10).map(function (g) { return '<tr><td class="num">' + g.date + '</td><td class="num">' + clock(g.time) + '</td><td class="num">' + esc(g.pax) + '</td><td>' + esc(g.pickup) + ' → ' + esc(g.drop) + '</td><td>' + (g.contract || '<span class="muted">None</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' + (r.good.length > 10 ? '<p class="muted small">and ' + (r.good.length - 10) + ' more</p>' : '') + '</div>';
    if (r.bad.length || r.dup.length) h += '<div class="card tablewrap" style="padding:0"><table><thead><tr><th>Line</th><th>Problem</th><th>Row as pasted</th></tr></thead><tbody>' + r.bad.map(function (b) { return '<tr><td class="num">' + b.n + '</td><td>' + pill('Rejected', 'warn', '!') + ' ' + esc(b.why) + '</td><td class="num small">' + esc(b.raw) + '</td></tr>'; }).join('') + r.dup.map(function (b) { return '<tr><td class="num">' + b.n + '</td><td>' + pill('Duplicate', 'neutral', '=') + ' Same trip is already scheduled</td><td class="num small">' + esc(b.raw) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="muted small">Edit the rows above and press Check rows again. You do not need to start over.</p>';
    h += btn('Import ' + r.good.length + ' valid row' + (r.good.length === 1 ? '' : 's'), 'doImp', 'primary', r.good.length ? '' : 'disabled') + '</section>';
  }
  return h;
}
var TEMPLATE = 'date,time,passenger_ref,pickup,destination,contract\n2026-10-15,09:30,P-123,100 Example St,200 Sample Ave,A';

function obDriver(d) {
  var o = S.ob.driver;
  switch (d) {
    case 'start': o.step = 1; break;
    case 'send': { var c = ($('siC').value || '').trim(); if (!validContact(c)) { S.fieldErr = {siC: 'Enter the phone number (at least 10 digits) or email your office gave you.'}; render(); $('siC').focus(); announce(S.fieldErr.siC); return; } S.fieldErr = {}; o.contact = c; o.phase = 'code'; break; }
    case 'other': o.phase = 'contact'; S.fieldErr = {}; break;
    case 'verify': { var k = ($('siK').value || '').replace(/\s/g, ''); if (k !== '123456') { S.fieldErr = {siK: 'That code is not right. Check the message and try again, or go back to send a new one.'}; render(); $('siK').focus(); announce(S.fieldErr.siK); return; } S.fieldErr = {}; o.signedIn = true; o.phase = 'contact'; if (!o.done) o.step = 2; break; }
    case 'confirm': o.step = 3; S.wrongInfo = false; S.tourIdx = 0; break;
    case 'wrong': S.wrongInfo = true; break;
    case 'next': S.tourIdx = (S.tourIdx || 0) + 1; break;
    case 'prev': S.tourIdx = Math.max(0, (S.tourIdx || 0) - 1); break;
    case 'skipTour': case 'finishTour': if (S.tourReplay) { S.tourReplay = false; S.dTab = 'help'; } else { o.done = true; o.signedIn = true; o.step = 4; S.dTab = 'home'; } S.tourIdx = 0; break;
    case 'replay': S.tourReplay = true; S.tourIdx = 0; break;
    case 'signout': o.signedIn = false; o.phase = 'contact'; S.dTab = 'home'; S.dTrip = null; break;
    default: return;
  }
  saveOb(); S.err = null; S.msg = ''; render();
}
function obAdmin(d, el) {
  var a = S.ob.admin;
  switch (d) {
    case 'next': a.step = Math.min(6, a.step + 1); S.wizSub = ''; break;
    case 'prev': a.step = Math.max(0, a.step - 1); S.wizSub = ''; break;
    case 'go': a.step = +el.dataset.step; S.wizSub = ''; break;
    case 'later': a.done = true; break;
    case 'resume': a.done = false; a.step = (!a.orgOk || !a.wfOk) ? 1 : 2; break;
    case 'rerun': a.done = false; a.step = 0; break;
    case 'tour': a.done = false; a.step = 6; break;
    case 'finish': a.done = true; S.aView = 'overview'; break;
    case 'sub': S.wizSub = el.dataset.sub || ''; break;
    default: return;
  }
  saveOb(); S.err = null; S.msg = ''; S.fieldErr = {}; render();
}

/* ================= render ================= */
function grab() { var o = {}; document.querySelectorAll('#app input[id],#app select[id],#app textarea[id]').forEach(function (e) { if (e.type === 'file') return; o[e.id] = e.type === 'radio' || e.type === 'checkbox' ? e.checked : e.value; }); return o; }
function render() {
  var vals = grab(), act = document.activeElement, ae = act && act.id, aa = act && act.dataset && act.dataset.a, tr = S.dTrip && byId(S.dTrip), key = [S.role, S.dTab, S.dTrip, tr ? tr.phase + !!tr.wait : '', S.aView, S.aTrip, S.ob.driver.step, S.ob.driver.phase, S.ob.driver.signedIn, S.tourIdx, S.tourReplay, S.ob.admin.step, S.ob.admin.done, S.wizSub].join('|');
  $('roleDriver').setAttribute('aria-pressed', S.role === 'driver'); $('roleOffice').setAttribute('aria-pressed', S.role === 'office');
  $('app').innerHTML = S.role === 'driver' ? driverShell() : adminShell();
  var same = key === S.lastKey;
  if (same && !S.noRestore) { Object.keys(vals).forEach(function (id) { var e = $(id); if (!e) return; if (e.type === 'radio' || e.type === 'checkbox') e.checked = vals[id]; else e.value = vals[id]; }); if (ae && $(ae)) $(ae).focus(); else if (aa) { var re = document.querySelector('#app [data-a="' + aa + '"]'); if (re) re.focus(); } }
  else if (same) { var h0 = $('h1'); if (h0) { h0.tabIndex = -1; h0.focus(); } }
  else { S.lastKey = key; var h1 = $('h1'); if (h1) { h1.tabIndex = -1; h1.focus(); } window.scrollTo(0, 0); }
  S.noRestore = false;
  if (S.role === 'office' && S.aView === 'trips' && !S.aTrip) renderRows();
}
function go(patch) { Object.assign(S, patch); S.err = null; S.msg = ''; S.fieldErr = {}; render(); }

/* ================= actions ================= */
function num(id) { var v = parseFloat($(id) && $(id).value); return isNaN(v) ? null : v; }
function A(name, el) {
  var t = S.dTrip ? byId(S.dTrip) : null, ot = S.aTrip ? byId(S.aTrip) : null, who = drvName(DID);
  if (S.busy) return;
  switch (name) {
    case 'tab': return go({dTab: el.dataset.tab, dTrip: null});
    case 'openTrip': if (S.role === 'driver') return go({dTrip: el.dataset.id, dFrom: el.dataset.from || 'home'}); return go({aTrip: el.dataset.id});
    case 'back': return go({dTrip: null, dTab: S.dFrom === 'trips' ? 'trips' : S.dFrom === 'history' ? 'history' : 'home'});
    case 'home': return go({dTrip: null, dTab: 'home'});
    case 'refresh': S.msg = 'List refreshed.'; S.err = null; render(); announce('List refreshed'); return;
    case 'claim': {
      var c = byId(el.dataset.id);
      save(function () {
        if (S.race) { S.race = false; c.driver = 'D3'; log(c, 'Assigned to Marcus', 'Took the trip first', 'Marcus'); }
        if (c.driver) { S.claimLog.push({trip: c.id, driver: DID, t: now()}); S.err = c.id + ' was just taken by another driver. We have refreshed the list so you can see what is still open.'; return ''; }
        c.driver = DID; log(c, 'Claimed', 'Driver took the trip from the open list', who); c.lastMsg = 'Trip claimed successfully. You took it at ' + clock(now()) + '.'; S.dTrip = c.id; S.dFrom = 'trips'; return '';
      }); return;
    }
    case 'arrive': save(function () { t.phase = 'arrived'; log(t, 'Arrived at pickup', t.pickup, who); t.lastMsg = 'Arrival recorded at ' + clock(now()) + '.'; return ''; }); return;
    case 'pickC': S.fieldErr = {}; render(); return;
    case 'start': {
      var err = {}, o = num('odoS'), ch = document.querySelector('input[name=dc]:checked');
      if (!t.contract && !ch) err.dc = 'Choose a contract, or choose “I am not sure”.';
      if (o == null || o <= 0) err.odoS = 'Enter the odometer reading from the dashboard.';
      if (Object.keys(err).length) { S.fieldErr = err; render(); var f = $(err.dc ? 'cA' : 'odoS'); if (f) f.focus(); announce(err.dc || err.odoS); return; }
      S.fieldErr = {};
      save(function () {
        if (!t.contract && ch.value !== 'U') { t.contract = ch.value; t.contractBy = 'driver'; t.contractOk = false; log(t, 'Contract selected by driver', 'Contract ' + ch.value + ' (needs office confirmation)', who); }
        else if (!t.contract) log(t, 'Driver was not sure of the contract', 'Office must assign one', who);
        t.odoS = o; t.phase = 'inTrip'; t.tripStart = now(); t.moving = 0; log(t, 'Trip started', 'Odometer ' + o.toFixed(1), who); t.lastMsg = 'Trip started at ' + clock(now()) + '.'; return '';
      }); return;
    }
    case 'wait': save(function () { var w = $('why'); t.wait = {s: now(), why: w ? w.value : 'Other'}; log(t, 'Stopped to wait', t.wait.why, who, 'wait'); t.lastMsg = 'Waiting started at ' + clock(now()) + '.'; return ''; }); return;
    case 'resume': save(function () { var d = now() - t.wait.s; t.waits.push({s: t.wait.s, e: now(), why: t.wait.why}); t.wait = null; log(t, t.phase === 'inTrip' ? 'Resumed trip' : 'Passenger ready', 'Waited ' + dur(d), who, 'wait'); t.lastMsg = (t.phase === 'inTrip' ? 'Trip resumed' : 'Ready to start') + ' at ' + clock(now()) + '. Waited ' + dur(d) + '.'; return ''; }); return;
    case 'end': save(function () { t.phase = 'ending'; log(t, 'Reached destination', 'Route distance ' + (t.mi * t.progress).toFixed(1) + ' mi', who); t.lastMsg = ''; return ''; }); return;
    case 'submit': {
      var e = num('odoE'); S.fieldErr = {};
      if (e == null) S.fieldErr = {odoE: 'Enter the odometer reading from the dashboard.'};
      else if (e < t.odoS) S.fieldErr = {odoE: 'This is lower than the starting reading (' + t.odoS.toFixed(1) + '). Check the number and try again.'};
      else if (e === t.odoS) S.fieldErr = {odoE: 'This is the same as the starting reading. Check the number and try again.'};
      if (S.fieldErr.odoE) { render(); $('odoE').focus(); announce(S.fieldErr.odoE); return; }
      S.fieldErr = {};
      save(function () { t.odoE = e; t.mapMi = Math.round(t.mi * Math.min(1, t.progress) * 10) / 10; t.tripEnd = now(); t.phase = 'done'; log(t, 'Trip submitted', 'Odometer ' + e.toFixed(1) + ' (' + mi(odoMiles(t)) + ')', who); t.lastMsg = 'Trip submitted at ' + clock(now()) + '. It is saved and sent to the office.'; return ''; }); return;
    }
    case 'report': {
      var p = $('prob') && $('prob').value.trim();
      if (!p) { S.err = 'Write a short note about what happened, then send it.'; render(); return; }
      save(function () { t.problem = p; t.problemOpen = true; log(t, 'Problem reported', p, who); t.lastMsg = 'Your report was sent to the office at ' + clock(now()) + '.'; $('prob').value = ''; return ''; }); return;
    }
    case 'obD': return obDriver(el.dataset.do);
    case 'obA': return obAdmin(el.dataset.do, el);
    case 'wOrg': save(function () { S.ob.admin.orgOk = true; S.ob.admin.wfOk = true; S.ob.admin.step = 2; saveOb(); return 'Organisation and job assignment saved.'; }); return;
    case 'wCon': {
      var bad = ['A', 'B'].some(function (k) { return !(S.rates[k].f > 0 && S.rates[k].m > 0); });
      if (bad) { S.err = 'Enter a flat fee and a rate per mile for both contracts.'; render(); return; }
      if (!$('cok').checked) { S.err = null; S.fieldErr = {cok: 'Tick the box once you have checked the figures against the signed contracts.'}; render(); $('cok').focus(); return; }
      S.fieldErr = {}; save(function () { S.ob.admin.contractsOk = true; S.ob.admin.step = 3; saveOb(); return 'Contracts saved.'; }); return;
    }
    case 'addDriver': {
      var n = $('dn').value.trim(), c2 = $('dc').value.trim(), er = {}, ex;
      if (!n) er.dn = 'Enter the driver’s full name.';
      else if ((ex = DRIVERS.filter(function (d) { return d.name.toLowerCase() === n.toLowerCase(); })[0])) er.dn = 'A driver named ' + ex.name + ' already exists. If this is a different person, add a middle initial.';
      if (!validContact(c2)) er.dc = 'Enter a phone number (10 digits or more) or an email.';
      else if ((ex = DRIVERS.filter(function (d) { return normContact(d.contact) === normContact(c2); })[0])) er.dc = 'This phone or email is already used by ' + ex.name + '.';
      if (Object.keys(er).length) { S.fieldErr = er; render(); $(er.dn ? 'dn' : 'dc').focus(); announce(er.dn || er.dc); return; }
      S.fieldErr = {};
      save(function () { var mx = 0; DRIVERS.forEach(function (d) { mx = Math.max(mx, parseInt(d.id.slice(1), 10) || 0); }); DRIVERS.push({id: 'D' + (mx + 1), name: n, contact: c2, status: 'Invited'}); S.noRestore = true; return 'Driver added. ' + n + ' can now sign in with ' + c2 + '. This demo does not send messages.'; }); return;
    }
    case 'resendInv': save(function () { return 'Invitation ready for ' + drvName(el.dataset.id) + '. This demo does not send messages.'; }); return;
    case 'checkDrv': S.drvImp.text = $('drvcsv').value; S.drvImp.result = parseDrivers(S.drvImp.text); S.msg = ''; render(); return;
    case 'doDrv': { var rd = S.drvImp.result; save(function () { var mx = 0; DRIVERS.forEach(function (d) { mx = Math.max(mx, parseInt(d.id.slice(1), 10) || 0); }); rd.good.forEach(function (g, i) { DRIVERS.push({id: 'D' + (mx + 1 + i), name: g.name, contact: g.contact, status: 'Invited'}); }); S.drvImp = {text: 'name,contact' + rd.bad.concat(rd.dup).map(function (b) { return '\n' + b.raw; }).join(''), result: null}; S.noRestore = true; return rd.good.length + ' driver' + (rd.good.length === 1 ? '' : 's') + ' added.' + (rd.bad.length + rd.dup.length ? ' ' + (rd.bad.length + rd.dup.length) + ' line(s) still need fixing in the box.' : ''); }); return; }
    case 'createTrip': {
      var g = function (id) { return ($(id).value || '').trim(); }, er2 = {}, tm2 = /^(\d{1,2}):(\d{2})$/.exec(g('ctt'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(g('ctd'))) er2.ctd = 'Use the format 2026-10-15.';
      if (!tm2 || +tm2[1] > 23 || +tm2[2] > 59) er2.ctt = 'Enter a real 24-hour time such as 09:30.';
      if (!/^P-\d+$/.test(g('ctp'))) er2.ctp = 'Use a reference like P-123, not the passenger’s name.';
      if (!g('ctk')) er2.ctk = 'Enter the pickup address.';
      if (!g('ctz')) er2.ctz = 'Enter the destination.';
      if (Object.keys(er2).length) { S.fieldErr = er2; render(); var ff = ['ctd', 'ctt', 'ctp', 'ctk', 'ctz'].filter(function (k) { return er2[k]; })[0]; $(ff).focus(); announce(er2[ff]); return; }
      var tmin = +tm2[1] * 3600 + +tm2[2] * 60, key2 = [g('ctd'), tmin, g('ctp'), g('ctk'), g('ctz')].join('|');
      if (S.trips.some(function (x) { return [x.date, x.time, x.pax, x.pickup, x.drop].join('|') === key2; })) { S.fieldErr = {}; S.err = 'This trip is already scheduled: same date, time, passenger and addresses. Nothing was added.'; render(); return; }
      S.fieldErr = {}; var cv2 = $('ctc').value, vals2 = {d: g('ctd'), t: tmin, p: g('ctp'), k: g('ctk'), z: g('ctz')};
      save(function () { var nt = mkTrip({id: nextTripId(), date: vals2.d, time: vals2.t, pax: vals2.p, pickup: vals2.k, drop: vals2.z, pts: PATHS[S.tripSeq % PATHS.length], contract: cv2 || null}); log(nt, 'Created', 'Added by hand', 'Office'); S.trips.push(nt); S.ob.admin.tripAdded = true; saveOb(); S.noRestore = true;
        if (!S.ob.admin.done) { S.wizSub = ''; return 'Trip added. ' + nt.id + ' is on the schedule.'; }
        S.aTrip = nt.id; S.aView = 'trips'; return 'Trip added. ' + nt.id + ' is on the schedule. Assign a driver below.'; }); return;
    }
    case 'tplUse': S.imp.text = TEMPLATE; S.imp.result = null; S.msg = 'Example rows added to the box. Edit them, then press Check rows.'; S.noRestore = true; render(); return;
    case 'tplCopy': if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(TEMPLATE).then(function () { S.msg = 'Template copied. Paste it into a spreadsheet.'; render(); announce(S.msg); }, function () { S.msg = 'Could not copy. Use the example rows instead.'; render(); }); else { S.msg = 'Copying is not available here. Use the example rows instead.'; render(); } return;
    case 'tplDownload': { try { var bl = new Blob([TEMPLATE + '\n'], {type: 'text/csv'}), ln = document.createElement('a'); ln.href = URL.createObjectURL(bl); ln.download = 'trip-import-template.csv'; document.body.appendChild(ln); ln.click(); ln.remove(); S.msg = 'Template download started. If your device did not save it, use Copy template instead.'; } catch (e2) { S.msg = 'Could not download here. Use Copy template instead.'; } render(); return; }
    case 'role': return;
    /* office */
    case 'nav': return go({aView: el.dataset.view, aTrip: null});
    case 'tile': { var f2 = {q: '', driver: '', contract: '', status: el.dataset.status || '', date: 'all'}; if (el.dataset.contract) f2.contract = el.dataset.contract; return go({aView: 'trips', aTrip: null, f: f2}); }
    case 'backTrips': return go({aTrip: null, aView: 'trips'});
    case 'clearF': S.f = {q: '', driver: '', contract: '', status: '', date: 'all'}; render(); return;
    case 'assign': { var v = $('asg').value; save(function () { ot.driver = v || null; log(ot, v ? 'Assigned to ' + drvName(v) : 'Driver removed', '', 'Office'); return v ? 'Driver saved. ' + ot.id + ' is assigned to ' + drvName(v) + '.' : 'Driver removed from ' + ot.id + '.'; }); return; }
    case 'setContract': { var cv = $('ctr').value; save(function () { ot.contract = cv || null; ot.contractBy = cv ? 'office' : null; ot.contractOk = true; log(ot, cv ? 'Contract set to ' + cv : 'Contract cleared', '', 'Office'); return cv ? 'Contract saved. ' + ot.id + ' is now under Contract ' + cv + '.' : 'Contract cleared.'; }); return; }
    case 'confirmC': save(function () { ot.contractOk = true; log(ot, 'Contract confirmed', 'Contract ' + ot.contract, 'Office'); return 'Contract confirmed.'; }); return;
    case 'handled': save(function () { ot.problemOpen = false; log(ot, 'Problem marked as handled', '', 'Office'); return 'Marked as handled.'; }); return;
    case 'resolveMi': {
      var basis = $('basis').value, note = $('note').value.trim(), val = basis === 'odo' ? odoMiles(ot) : basis === 'map' ? ot.mapMi : num('cust');
      if (!note) { S.fieldErr = {note: 'Write a reason so there is a record of the decision.'}; render(); $('note').focus(); return; }
      if (val == null || val <= 0) { S.err = 'Enter the other distance in miles.'; render(); return; }
      S.fieldErr = {}; save(function () { ot.resolved = {miles: val, basis: basis === 'odo' ? 'odometer' : basis === 'map' ? 'map estimate' : 'entered value', note: note}; log(ot, 'Mileage resolved', mi(val) + ' approved. ' + note, 'Office'); return 'Distance approved: ' + mi(val) + '.'; }); return;
    }
    case 'approve': save(function () { ot.approved = true; log(ot, 'Approved for billing', money(calc(ot).total), 'Office'); return ot.id + ' approved for billing.'; }); return;
    case 'checkImp': S.imp.text = $('imptext').value; S.imp.result = parseImport(S.imp.text); S.imp.last = S.imp.result.fatal ? S.imp.last : {rejected: S.imp.result.bad.length}; S.msg = ''; render(); announce(S.imp.result.fatal || (S.imp.result.good.length + ' ready, ' + S.imp.result.bad.length + ' rejected, ' + S.imp.result.dup.length + ' duplicates')); return;
    case 'doImp': {
      var r = S.imp.result, n = S.trips.length;
      save(function () { r.good.forEach(function (g, i) { var t2 = mkTrip({id: nextTripId(), date: g.date, time: g.time, pax: g.pax, pickup: g.pickup, drop: g.drop, pts: PATHS[(n + i) % PATHS.length], contract: g.contract}); log(t2, 'Imported', 'From CSV', 'Office'); S.trips.push(t2); }); var k = r.good.length, nc = r.good.filter(function (g) { return !g.contract; }).length; S.ob.admin.tripAdded = true; saveOb(); S.imp.result = null; S.imp.last = {rejected: r.bad.length}; S.imp.text = r.bad.length ? r.header + '\n' + r.bad.map(function (b) { return b.raw; }).join('\n') : ''; S.noRestore = true; return 'Import completed: ' + k + ' trip' + (k === 1 ? '' : 's') + ' added' + (nc ? ', ' + nc + ' need a contract' : '') + (r.bad.length ? '. ' + r.bad.length + ' rejected row' + (r.bad.length === 1 ? ' is' : 's are') + ' still in the box for you to fix.' : '.'); }); return;
    }
  }
}
document.addEventListener('click', function (e) {
  var rb = e.target.closest('[data-role]'); if (rb) { go({role: rb.dataset.role, dTrip: null, aTrip: null}); return; }
  var d = e.target.closest('[data-demo]'); if (d) { var k = d.dataset.demo; if (k === 'ob-reset') { S.ob = obDefault(); saveOb(); S.tourIdx = 0; S.wizSub = ''; S.tourReplay = false; render(); announce('Onboarding reset'); } else if (k === 'reset') init(); else if (k === 'race') { S.race = true; announce('The next claim will be lost'); } else { S.fail = k === 'fail-auth' ? 'auth' : 'net'; announce('The next save will fail'); } return; }
  var el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  if (el.tagName === 'TR' && e.target.closest('button')) return;
  A(el.dataset.a, el);
});
document.addEventListener('change', function (e) {
  var el = e.target;
  if (el.dataset && el.dataset.a === 'pickC') return A('pickC', el);
  if (el.name === 'mode') { S.mode = el.value; if (S.mode === 'assign' && S.dTab === 'avail') S.dTab = 'home'; S.msg = S.mode === 'claim' ? 'Drivers can now take open jobs.' : 'The office now assigns every job.'; render(); announce(S.msg); return; }
  if (el.dataset && el.dataset.rate) { var k = el.dataset.rate, v = parseFloat(el.value); if (!isNaN(v) && v >= 0) { S.rates[k[0]][k[1]] = v; if (!S.ob.admin.done) { S.ob.admin.contractsOk = false; saveOb(); } S.msg = 'Contract ' + k[0] + ' rate saved.'; render(); announce(S.msg); } return; }
  if (el.id === 'tol') { var tv = parseFloat(el.value); if (tv >= 1 && tv <= 50) { S.tol = tv; S.msg = 'Mileage limit saved.'; render(); announce(S.msg); } return; }
  if (el.id === 'fd' || el.id === 'fc' || el.id === 'fs' || el.id === 'fdt') { S.f.driver = $('fd').value; S.f.contract = $('fc').value; S.f.status = $('fs').value; S.f.date = $('fdt').value; renderRows(); return; }
  if (el.id === 'impfile' && el.files[0]) { var fr = new FileReader(); fr.onload = function () { S.imp.text = String(fr.result); S.imp.result = null; render(); announce('File loaded. Press Check rows.'); }; fr.readAsText(el.files[0]); }
  if (el.id === 'speed') setSpeed(+el.value);
});
document.addEventListener('input', function (e) { if (e.target.id === 'fq') { S.f.q = e.target.value; renderRows(); } });

/* ================= live timers ================= */
var last = 0;
setInterval(function () {
  var n = now(), d = n - last; last = n; if (!S || !S.dTrip || S.role !== 'driver') return;
  var t = byId(S.dTrip); if (!t) return;
  var set = function (id, v) { var el = $(id); if (el) el.textContent = v; };
  if (t.phase === 'inTrip' && !t.wait && d < 3600) {
    t.moving += d; t.progress = Math.min(1, t.progress + d * (MPH / 3600) / t.mi);
    if (t.progress >= 1 && !t.atDrop) { t.atDrop = true; render(); return; }
    var dyn = $('mapdyn'); if (dyn) dyn.innerHTML = mapDyn(t);
  }
  if (t.wait) set('wT', dur(n - t.wait.s));
  if (t.phase === 'inTrip') { set('sT', dur(n - t.tripStart)); set('sM', dur(t.moving)); set('sW', dur(waitTotal(t))); set('sG', (t.mi * t.progress).toFixed(1)); }
}, 250);

window.__app = {state: function () { return S; }, now: now};
init();
last = now();
})();
