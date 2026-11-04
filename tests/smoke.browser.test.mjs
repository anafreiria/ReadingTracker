// Startup check against the HTTP server/isolated Chrome provided by check-frontend.mjs.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { captureBrowserFailure } from './browser-diagnostics.mjs';

const base = process.env.APP_URL || 'http://127.0.0.1:8087';
const endpoint = `http://127.0.0.1:${process.env.CHROME_DEBUG_PORT || '9337'}`;
const tab = await (await fetch(`${endpoint}/json/new?about:blank`, {method: 'PUT', signal: AbortSignal.timeout(5000)})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(Error('Chrome connection timed out.')), 5000);
  ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, {once: true});
  ws.addEventListener('error', () => { clearTimeout(timer); reject(Error('Chrome connection failed.')); }, {once: true});
});
const pending = new Map(), exceptions = [], resourceErrors = [];
let sequence = 0, checks = 0;
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') {
    const details = message.params.exceptionDetails;
    exceptions.push(details.exception?.description || details.text);
  }
  if (message.method === 'Network.responseReceived') {
    const {response} = message.params;
    if (response.url.startsWith(`${new URL(base).origin}/`) && response.status >= 400 && new URL(response.url).pathname !== '/favicon.ico') {
      resourceErrors.push(`${response.status} ${response.url}`);
    }
  }
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`${method} timed out.`)); }, 8000);
  pending.set(id, message => { clearTimeout(timer); message.error ? reject(Error(message.error.message)) : resolve(message.result); });
  ws.send(JSON.stringify({id, method, params}));
});
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const wait = async expression => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (exceptions.length || resourceErrors.length) throw Error([...exceptions, ...resourceErrors].join('\n'));
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error(`Application did not become ready: ${expression}`);
};
const check = async (expression, label) => {
  assert.equal(await evaluate(expression), true, label);
  console.log(`PASS ${label}`); checks++;
};
try {
  const html = await fetch(base, {signal: AbortSignal.timeout(5000)});
  assert.equal(html.status, 200, 'frontend index returns HTTP 200');
  assert.match(html.headers.get('content-type'), /text\/html/);
  const seed = await fetch(`${base}/data/seed.json`, {signal: AbortSignal.timeout(5000)});
  assert.equal(seed.status, 200, 'official seed returns HTTP 200');
  assert.equal((await seed.json()).books.length, 143);
  console.log('PASS HTTP index and seed'); checks++;
  await call('Runtime.enable');await call('Network.enable');await call('Network.setCacheDisabled', {cacheDisabled: true});await call('Page.enable');
  await call('Page.navigate', {url: `${base}/#readings`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false' && !!document.querySelector('tbody')`);
  await check(`document.documentElement.lang==='en-US' && [...document.styleSheets].some(sheet=>sheet.href?.endsWith('/css/styles.css'))`, 'application modules initialize with US English and local stylesheet');
  for (const [route, title, count] of [['readings','Reading History',143],['books','Your books',143],['authors','Your authors',101]]) {
    await evaluate(`location.hash=${JSON.stringify(route)}`);
    await wait(`document.querySelector('[aria-current=page]')?.dataset.route===${JSON.stringify(route)}`);
    await check(`document.querySelector('#page-title').textContent===${JSON.stringify(title)} && document.querySelectorAll('#content tbody tr').length===${count} && !document.querySelector('#content [role=alert]')`, `${route} route loads official records`);
    await evaluate(`document.querySelector('#preview-button').click()`);
    await wait(`document.querySelector('#form-dialog').open && !!document.querySelector('#form-dialog form')`);
    await check(`!document.querySelector('#form-dialog [type=submit]').disabled`, `${route} form opens and can be used`);
    await call('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent', {type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await wait(`!document.querySelector('#form-dialog').open`);
    for (const width of [1280,390]) {
      await call('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width===390});
      await evaluate('scrollTo(0,0)');
      await check('document.documentElement.scrollWidth<=innerWidth', `${route} page fits ${width}px`);
      if (process.env.SCREENSHOT_DIR) {
        await mkdir(process.env.SCREENSHOT_DIR, {recursive:true});
        const shot = await call('Page.captureScreenshot', {format:'png'});
        await writeFile(join(process.env.SCREENSHOT_DIR, `smoke-${route}-${width}.png`), Buffer.from(shot.data,'base64'));
      }
    }
  }
  assert.deepEqual(exceptions, [], 'no uncaught browser exceptions');
  assert.deepEqual(resourceErrors, [], 'no failed local resources');
  console.log(`PASS ${++checks} smoke checks; no uncaught exceptions or failed local resources`);
} catch (error) {
  await captureBrowserFailure({call, evaluate, error, exceptions: [...exceptions, ...resourceErrors]});
  throw error;
} finally {
  ws.close();
  await fetch(`${endpoint}/json/close/${tab.id}`, {signal: AbortSignal.timeout(5000)});
}
