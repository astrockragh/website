/* ------------------------------------------------------------------
   Hero reel timing — regression test.

   Guards the fix for the bug where, on a slow connection, the caption and
   the progress bar ran ahead of the picture and the error accumulated across
   clips. Everything the reel shows must be driven by real playback.

   The media layer is stubbed, so this is deterministic and touches no
   network: play() resolves but produces no frames until the test says so,
   which is how a slow connection is reproduced exactly.

   Run:  node tests/reel_timing/run.mjs
   Needs:  npm i -D playwright  &&  npx playwright install chromium
------------------------------------------------------------------ */
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('playwright not installed — npm i -D playwright'); process.exit(2); }

// Use whatever browser this machine has; Playwright's own is the default.
let exe;
for (const root of ['/opt/pw-browsers', process.env.PLAYWRIGHT_BROWSERS_PATH].filter(Boolean)) {
  if (!existsSync(root)) continue;
  for (const d of readdirSync(root).filter(d => d.startsWith('chromium-'))) {
    for (const c of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      if (existsSync(path.join(root, d, c))) exe = path.join(root, d, c);
    }
  }
}

const b = await chromium.launch(exe ? { executablePath: exe } : {});
const PAGE = 'file://' + path.join(HERE, 'harness.html');
const p = await b.newPage();
const warns = [];
p.on('console', m => { if (m.type() !== 'info') warns.push(m.text()); });
await p.goto(PAGE);   // fast link

const S = () => p.evaluate(() => window.__state());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pass = [], fail = [];
const ck = (name, cond, got) => (cond ? pass : fail).push(`${name}${cond?'':'  <-- got '+JSON.stringify(got)}`);

// --- 1. nothing starts before the first frames arrive -------------------
await sleep(600);
let s = await S();
ck('clock does NOT start before first frames', s.play !== 'running', s);
ck('bar still on clip 1', s.cur === 0, s);

// --- 2. frames arrive -> clock runs ------------------------------------
await p.evaluate(() => window.__frames(document.querySelectorAll('video')[0]));
await sleep(200);
s = await S();
ck('clock runs once frames arrive', s.play === 'running', s);
ck('duration published to CSS', s.dur === '3s', s);

// --- 3. mid-clip stall freezes the bar ---------------------------------
await p.evaluate(() => window.__stall(document.querySelectorAll('video')[0]));
await sleep(150);
s = await S();
ck('stall pauses the bar', s.play === 'paused', s);

// --- 4. a long stall must NOT advance early; recovery resumes ----------
await sleep(1500);
s = await S();
ck('no advance while stalled', s.cur === 0, s);
await p.evaluate(() => window.__frames(document.querySelectorAll('video')[0]));
await sleep(150);
s = await S();
ck('recovery resumes the bar', s.play === 'running', s);

// --- 5. the stall time is NOT counted against the clip -----------------
// 3000ms clip: ~800ms ran before the stall, ~1650ms stalled. If the stall
// counted, we would already have advanced. Check we are still on clip 1.
s = await S();
ck('stalled time not charged to the clip', s.cur === 0, s);

// --- 6. it does eventually advance, and waits for the next clip's frames
await sleep(3400);
s = await S();
ck('advance in flight: bar HOLDS on clip 1 until clip 2 paints', s.cur === 0 && s.play !== 'running', s);
ck('clip 2 clock waits for ITS frames', s.play !== 'running', s);
await p.evaluate(() => window.__frames(document.querySelectorAll('video')[1]));
await sleep(700);   // caption swap is on a 420ms fade
s = await S();
ck('caption follows the picture', s.cap === 'BBB', s);
ck('clip 2 clock running', s.play === 'running', s);
ck('bar moves to clip 2 only once it paints', s.cur === 1, s);

// --- 7. deadlock guard: a clip that never recovers still advances ------
await p.evaluate(() => window.__stall(document.querySelectorAll('video')[1]));
const before = (await S()).cur;
await sleep(8600);                      // STALLMAX is 8000
s = await S();
ck('permanent stall still advances (no deadlock)', s.cur !== before, {before, ...s});


// --- 8. a slow link stays on stills entirely -----------------------------
{
  const q = await b.newPage();
  const info = [];
  q.on('console', m => info.push(m.text()));
  await q.goto(PAGE + '?net=slow');
  await sleep(400);
  const playCalls = await q.evaluate(() =>
    [...document.querySelectorAll('video')].reduce((n,v)=>n+(v.__playCalled||0),0));
  ck('slow link: never calls play()', playCalls === 0, { playCalls });
  ck('slow link: reports poster mode', info.some(l=>/POSTER MODE/.test(l)), info);
  const st = await q.evaluate(()=>window.__state());
  ck('slow link: slideshow still runs', st.play === 'running', st);
  await q.close();
}

console.log('PASS  ' + pass.length + '\n  ' + pass.join('\n  '));
if (fail.length) console.log('\nFAIL  ' + fail.length + '\n  ' + fail.join('\n  '));
if (warns.length) console.log('\nconsole warnings:\n  ' + warns.join('\n  '));
await b.close();
process.exit(fail.length ? 1 : 0);
