// gratuity-calculator-bd -- headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js
// Exits non-zero on any failed assertion; fails on page console errors.
// ?asof=2026-11-09 pins "today" for saved-scenario dates.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9353;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?asof=2026-11-09';
let failures = 0;
let count = 0;
const pageErrors = [];
function check(name, cond, extra) {
  count++;
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const CHROME_BIN = process.env.CHROME_BIN ||
    require('os').homedir() + '/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell';
  const chrome = spawn(CHROME_BIN, [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/gcbd-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push('exception: ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push('console.error: ' + JSON.stringify(msg.params.args).slice(0, 300));
    }
  };
  function send(method, params) {
    return new Promise((res) => {
      const id = ++seq;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
  }
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };
  const T = '\u09f3'; // taka sign
  const BN = (s) => s.replace(/[0-9]/g, (d) => '\u09e6\u09e7\u09e8\u09e9\u09ea\u09eb\u09ec\u09ed\u09ee\u09ef'[+d]);
  const setDefaults = `document.getElementById('basicInput').value='50000'; document.getElementById('yearsInput').value='10'; document.getElementById('monthsInput').value='0'; document.getElementById('multiplierInput').value='1'; document.getElementById('fractionalInput').checked=false; document.getElementById('incInput').value='0';`;

  check('page title contains Gratuity', (await ev('document.title'))?.includes('Gratuity'));
  check('3 tabs render', (await ev(`document.querySelectorAll('.tab').length`)) === 3);
  check('calc tab visible by default', (await ev(`document.getElementById('tab-calc').hidden`)) === false);
  check('disclaimer renders', (await ev(`document.getElementById('disclaimer').textContent.length`)) > 40);
  check('disclaimer names check-with-employer', (await ev(`document.getElementById('disclaimer').textContent`)).includes('Check the real rules'));

  // Default calc: 50000 x 10y x 1 -> 500,000.00 (matches unit tests).
  check('default gratuity ' + T + '500,000.00', (await ev(`document.getElementById('resGratuity').textContent`)) === T + '500,000.00');
  check('eligible badge visible', (await ev(`document.getElementById('eligBadge').hidden`)) === false);
  check('eligible badge says Eligible', (await ev(`document.getElementById('eligBadge').textContent`)).includes('Eligible'));
  check('completed years 10', (await ev(`document.getElementById('resCompleted').textContent`)) === '10');
  check('total service 10 years', (await ev(`document.getElementById('resService').textContent`)) === '10 years');
  check('5-year projection stat hidden when eligible', (await ev(`document.getElementById('proj5Stat').hidden`)) === true);
  check('breakdown has 10 rows', (await ev(`document.querySelectorAll('#breakdownBody tr').length`)) === 10);
  check('year-5 cumulative ' + T + '250,000.00', (await ev(`document.querySelectorAll('#breakdownBody tr')[4].textContent`)).includes(T + '250,000.00'));
  check('projection has 3 rows', (await ev(`document.querySelectorAll('#projBody tr').length`)) === 3);
  check('projection +1y ' + T + '550,000.00', (await ev(`document.querySelectorAll('#projBody tr')[0].textContent`)).includes(T + '550,000.00'));
  check('projection +5y ' + T + '750,000.00', (await ev(`document.querySelectorAll('#projBody tr')[2].textContent`)).includes(T + '750,000.00'));

  // Increment 5%: +1y -> 577,500.00; +3y -> 752,456.25.
  await ev(`document.getElementById('incInput').value='5'; document.getElementById('calcBtn').click()`);
  check('inc 5% projection +1y ' + T + '577,500.00', (await ev(`document.querySelectorAll('#projBody tr')[0].textContent`)).includes(T + '577,500.00'));
  check('inc 5% projection +3y ' + T + '752,456.25', (await ev(`document.querySelectorAll('#projBody tr')[1].textContent`)).includes(T + '752,456.25'));
  await ev(`document.getElementById('incInput').value='0'; document.getElementById('calcBtn').click()`);

  // Fractional year: 10y 6m completed-only 500,000; fractional 525,000 + partial row.
  await ev(`document.getElementById('monthsInput').value='6'; document.getElementById('calcBtn').click()`);
  check('10y6m completed-only ' + T + '500,000.00', (await ev(`document.getElementById('resGratuity').textContent`)) === T + '500,000.00');
  check('10y6m completed-only 10 rows', (await ev(`document.querySelectorAll('#breakdownBody tr').length`)) === 10);
  await ev(`document.getElementById('fractionalInput').checked=true; document.getElementById('calcBtn').click()`);
  check('10y6m fractional ' + T + '525,000.00', (await ev(`document.getElementById('resGratuity').textContent`)) === T + '525,000.00');
  check('10y6m fractional 11 rows (partial row)', (await ev(`document.querySelectorAll('#breakdownBody tr').length`)) === 11);
  check('partial row accrual ' + T + '25,000.00', (await ev(`document.querySelectorAll('#breakdownBody tr')[10].textContent`)).includes(T + '25,000.00'));
  await ev(setDefaults + ` document.getElementById('calcBtn').click()`);

  // Multiplier 1.5 -> 750,000.00.
  await ev(`document.getElementById('multiplierInput').value='1.5'; document.getElementById('calcBtn').click()`);
  check('multiplier 1.5 -> ' + T + '750,000.00', (await ev(`document.getElementById('resGratuity').textContent`)) === T + '750,000.00');
  await ev(setDefaults + ` document.getElementById('calcBtn').click()`);

  // Under 5 years: 40000 x 3y -> not eligible, projected 200,000.00 at 5y.
  await ev(`document.getElementById('basicInput').value='40000'; document.getElementById('yearsInput').value='3'; document.getElementById('calcBtn').click()`);
  check('3y gratuity ' + T + '120,000.00', (await ev(`document.getElementById('resGratuity').textContent`)) === T + '120,000.00');
  check('not-eligible badge shows', (await ev(`document.getElementById('eligBadge').textContent`)).includes('Not yet eligible'));
  check('5-year projection stat visible', (await ev(`document.getElementById('proj5Stat').hidden`)) === false);
  check('projected at 5y ' + T + '200,000.00', (await ev(`document.getElementById('resProj5').textContent`)) === T + '200,000.00');
  await ev(setDefaults + ` document.getElementById('calcBtn').click()`);

  // Validation: zero basic shows inline error and hides results.
  await ev(`document.getElementById('basicInput').value='0';`);
  await ev(`document.getElementById('calcBtn').click()`);
  check('zero basic shows error', (await ev(`document.getElementById('err-basic').hidden`)) === false);
  check('results hidden after invalid calc', (await ev(`document.getElementById('results').hidden`)) === true);
  await ev(setDefaults + ` document.getElementById('calcBtn').click()`);
  check('valid calc restores results', (await ev(`document.getElementById('results').hidden`)) === false);

  // Scenarios: save + reload persistence + delete.
  await ev(`window.__gcbd.eraseAll()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='My 10y plan'; document.getElementById('saveBtn').click();`);
  check('saved message shows', (await ev(`document.getElementById('savedMsg').hidden`)) === false);
  await ev(`document.getElementById('tabbtn-scenarios').click()`);
  check('scenario row label My 10y plan', (await ev(`document.getElementById('histList').textContent`)).includes('My 10y plan'));
  check('scenario row amount ' + T + '500,000.00', (await ev(`document.getElementById('histList').textContent`)).includes(T + '500,000.00'));
  check('scenario empty state hidden', (await ev(`document.getElementById('histEmpty').hidden`)) === true);
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  await ev(`document.getElementById('tabbtn-scenarios').click()`);
  check('saved scenario persists after reload', (await ev(`document.getElementById('histList').textContent`)).includes('My 10y plan'));
  await ev(`document.querySelector('#histList .del').click()`);
  check('delete removes row', (await ev(`document.querySelectorAll('#histList li').length`)) === 0);
  check('empty state returns after delete', (await ev(`document.getElementById('histEmpty').hidden`)) === false);

  // Export / import round-trip + malformed import rejected, data intact.
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='Roundtrip'; document.getElementById('saveBtn').click();`);
  const payload = await ev(`window.__gcbd.exportPayload()`);
  check('export payload is gratuity-calculator-bd v1', payload.includes('"app": "gratuity-calculator-bd"') && payload.includes('"version": 1'), payload);
  check('export payload carries saved scenario', payload.includes('Roundtrip'));
  await ev(`window.__gcbd.eraseAll()`);
  check('eraseAll clears history', (await ev(`window.__gcbd.exportPayload()`)).includes('"history": []'));
  const imp = await ev(`JSON.stringify(window.__gcbd.importPayload(${JSON.stringify(payload)}))`);
  check('import valid payload ok', imp.includes('"ok":true'), imp);
  check('import restores saved scenario', (await ev(`JSON.stringify(window.__gcbd.exportPayload())`)).includes('Roundtrip'));
  const badImp = await ev(`JSON.stringify(window.__gcbd.importPayload('{"app":"bus-fare-bd","version":1}'))`);
  check('import wrong app rejected', badImp.includes('"ok":false'));
  check('invalid import leaves data intact', (await ev(`JSON.stringify(window.__gcbd.exportPayload())`)).includes('Roundtrip'));
  const badJson = await ev(`JSON.stringify(window.__gcbd.importPayload('{not json'))`);
  check('malformed JSON rejected', badJson.includes('"ok":false'));
  await ev(`window.__gcbd.eraseAll()`);

  // Data tab: typed-DELETE erase via UI; wrong word rejected.
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('calcBtn').click()`);
  await ev(`document.getElementById('saveName').value='EraseTest'; document.getElementById('saveBtn').click();`);
  await ev(`document.getElementById('tabbtn-data').click()`);
  await ev(`document.getElementById('eraseInput').value='delete'; document.getElementById('eraseBtn').click();`);
  check('wrong erase word rejected', (await ev(`document.getElementById('eraseWrong').hidden`)) === false);
  check('wrong erase keeps data', (await ev(`JSON.stringify(window.__gcbd.exportPayload())`)).includes('EraseTest'));
  await ev(`document.getElementById('eraseInput').value='DELETE'; document.getElementById('eraseBtn').click();`);
  check('DELETE erases data', (await ev(`window.__gcbd.exportPayload()`)).includes('"history": []'));
  check('erase success message shows', (await ev(`document.getElementById('erasedMsg').hidden`)) === false);

  // Language toggle: Bengali title + digits, persists after reload.
  await ev(`document.getElementById('tabbtn-calc').click()`);
  await ev(`document.getElementById('langBtn').click()`);
  check('BN toggle: title in Bengali', /[\u0980-\u09ff]/.test(await ev(`document.getElementById('title').textContent`)) && (await ev(`document.getElementById('title').textContent`)) !== 'Gratuity Calculator');
  check('BN toggle: tab label in Bengali', (await ev(`document.getElementById('tabbtn-calc').textContent`)) === '\u0995\u09cd\u09af\u09be\u09b2\u0995\u09c1\u09b2\u09c7\u099f\u09b0');
  await ev(`document.getElementById('calcBtn').click()`);
  check('BN toggle: total in Bengali digits', (await ev(`document.getElementById('resGratuity').textContent`)) === T + BN('500,000.00'));
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  check('BN toggle persists after reload', (await ev(`window.__gcbd.state.lang`)) === 'bn');
  await ev(`document.getElementById('langBtn').click()`);
  check('back to EN', (await ev(`window.__gcbd.state.lang`)) === 'en');

  // Mobile 390px: no horizontal overflow on calc + scenarios + data tabs.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: FILE });
  await wait(1200);
  const overflow = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (calc)', overflow <= 0, 'overflow=' + overflow);
  await ev(`document.getElementById('tabbtn-scenarios').click()`);
  const overflow2 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (scenarios)', overflow2 <= 0, 'overflow=' + overflow2);
  await ev(`document.getElementById('tabbtn-data').click()`);
  const overflow3 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  check('390px no horizontal overflow (data)', overflow3 <= 0, 'overflow=' + overflow3);

  // Zero network requests: app is fully offline (only file:// loads).
  const reqs = await ev(`performance.getEntriesByType('resource').map(r => r.name).filter(n => !n.startsWith('file://')).length`);
  check('zero non-file network requests', reqs === 0, 'non-file=' + reqs);

  check('no console/page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  chrome.kill();
  console.log('\n' + count + ' checks, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); try { chrome.kill(); } catch (_) {} process.exit(2); });
