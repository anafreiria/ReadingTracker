// FR-UI-01 acceptance scenarios. Dedicated tab/profile only; fixtures never change seed.json.
import assert from 'node:assert/strict';
import { captureBrowserFailure } from './browser-diagnostics.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const port = process.env.CHROME_DEBUG_PORT || '9337';
const base = process.env.APP_URL || 'http://127.0.0.1:8087';
const endpoint = `http://127.0.0.1:${port}`;
const tab = await (await fetch(`${endpoint}/json/new?about:blank`, {method: 'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once: true}));
let sequence = 0;
const pending = new Map(), exceptions = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  if (!message.id) return;
  pending.get(message.id)?.(message);
  pending.delete(message.id);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, result => result.error ? reject(result.error) : resolve(result.result));
  ws.send(JSON.stringify({id, method, params}));
});
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const wait = async expression => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
};
let checks = 0;
const check = async (expression, label) => {
  assert.equal(await evaluate(expression), true, label);
  checks++;
  console.log(`PASS ${label}`);
};
const storage = `localStorage.getItem('reading-tracker:data:v1')`;
const data = `JSON.parse(${storage})`;
const directory = process.env.SCREENSHOT_DIR || '/tmp/reading-tracker-mobile-acceptance';
let touch = false;
const frame = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
async function viewport(width) {
  touch = width <= 768;
  await call('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:touch});
  await call('Emulation.setTouchEmulationEnabled', {enabled:touch});
  await frame();
}
async function route(name) {
  await evaluate(`location.hash=${JSON.stringify(name)}`);
  await wait(`document.querySelector('[aria-current=page]')?.dataset.route===${JSON.stringify(name)} && document.querySelector('#content').getAttribute('aria-busy')==='false'`);
}
// Real browser input: scroll into view, reject hidden/covered targets, then tap/click.
async function activate(selector) {
  const point = await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});
    if(!element)throw Error('Missing target: '+${JSON.stringify(selector)});
    element.scrollIntoView({block:'center',inline:'nearest'});
    const r=element.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    const hit=document.elementFromPoint(x,y);
    if(!r.width||!r.height||x<0||x>innerWidth||y<0||y>innerHeight||!(hit===element||element.contains(hit)))throw Error('Target clipped or covered: '+${JSON.stringify(selector)});
    return {x,y};})()`);
  if (touch) {
    await call('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[point]});
    await call('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
  } else {
    await call('Input.dispatchMouseEvent', {type:'mousePressed',...point,button:'left',clickCount:1});
    await call('Input.dispatchMouseEvent', {type:'mouseReleased',...point,button:'left',clickCount:1});
  }
  await frame();
}
async function key(key, code, windowsVirtualKeyCode, modifiers = 0) {
  await call('Input.dispatchKeyEvent', {type:'keyDown',key,code,windowsVirtualKeyCode,modifiers});
  await call('Input.dispatchKeyEvent', {type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});
  await frame();
}
const tabKey = () => key('Tab','Tab',9);
const space = () => key(' ','Space',32);
async function saved() { await wait(`!document.querySelector('#form-dialog').open && document.querySelector('#content').getAttribute('aria-busy')==='false'`); }
async function close() { await activate('#close-dialog'); await saved(); }
async function screenshot(name) {
  const shot = await call('Page.captureScreenshot', {format:'png'});
  await writeFile(`${directory}/${name}.png`, Buffer.from(shot.data,'base64'));
}
async function action(routeName, record, label) {
  const selector = routeName === 'readings'
    ? `[data-reading-id="${record.id}"][data-reading-action="${label.toLowerCase()}"]`
    : `button[aria-label=${JSON.stringify(`${label==='View'?'View details:':label} ${routeName==='books'?record.title:record.name}`)}]`;
  await activate(selector);
  await wait(`document.querySelector('#form-dialog').open`);
}
try {
  await mkdir(directory, {recursive:true});
  await call('Runtime.enable'); await call('Page.enable');
  await call('Page.navigate', {url:`${base}/#books`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false'`);
  await evaluate(`(async()=>{window.store=await import('./js/store.js'); await store.resetData()})()`);
  // Long unbroken titles/names plus multiline notes exercise wrapping, not only the official seed.
  for (const width of [360,390,768,1280]) {
    await viewport(width);
    const fixture = await evaluate(`(async()=>{
      window.store=await import('./js/store.js');
      const name='Acceptance ${width} '+ 'LongAuthor'.repeat(22);
      const author=await store.saveAuthor({name});
      const linked=await store.saveAuthor({name:name+' linked'});
      const book=await store.saveBook({title:'Acceptance ${width} '+ 'LongTitle'.repeat(25),authorIds:[linked.id]});
      const reading=await store.saveReading({bookId:book.id,status:'Want to read',notes:'First line\\nSecond line '+ 'LongNote'.repeat(40)});
      return {author,book,reading};})()`);
    await call('Page.reload');
    await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false'`);
    for (const name of ['readings','books','authors']) {
      await route(name);
      const text = name==='authors'?fixture.author.name:fixture.book.title;
      await evaluate(`window.acceptanceRow=[...document.querySelectorAll('tbody tr')].find(row=>row.textContent.includes(${JSON.stringify(text)})); acceptanceRow.scrollIntoView({block:'start'});`);
      await check(`document.documentElement.scrollWidth<=innerWidth && acceptanceRow.scrollWidth<=acceptanceRow.clientWidth && [...acceptanceRow.querySelectorAll('button')].every(button=>{const r=button.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth})`, `${name}: long content keeps actions within ${width}px`);
      await screenshot(`${name}-long-${width}`);
      const record = name==='authors'?fixture.author:name==='books'?fixture.book:fixture.reading;
      if (name!=='authors') {
        await action(name,record,'View');
        await check(`document.querySelector('.book-details').textContent.includes(${JSON.stringify(fixture.book.title)}) && document.querySelector('#form-dialog').scrollWidth<=document.querySelector('#form-dialog').clientWidth`, `${name}: View opens correct long record at ${width}px`);
        if (name==='readings') await check(`document.querySelector('.book-details').textContent.includes('First line\\nSecond line')`, `reading notes preserve line breaks at ${width}px`);
        await close();
      }
      // Authors has no separate View action: its table displays the author, and Edit opens its full fields.
      await action(name,record,'Edit');
      const field = name==='authors'?'birthDate':name==='books'?'publicationYear':'recommendedBy';
      const value = name==='authors'?'1900-01-01':name==='books'?'1901':`Touch ${width}`;
      await evaluate(`document.querySelector('[name=${field}]').value=${JSON.stringify(value)}`);
      await activate('#form-dialog [type=submit]'); await saved();
      await check(`${data}.${name}.some(item=>item.id===${record.id} && item.${field}===${JSON.stringify(name==='books'?1901:value)})`, `${name}: Edit saves correct record at ${width}px`);
      await action(name,record,'Delete');
      const before = await evaluate(storage);
      await activate('#form-dialog .dialog-actions .button-secondary'); await saved();
      await check(`${storage}===${JSON.stringify(before)}`, `${name}: Delete cancel preserves data at ${width}px`);
      await action(name,record,'Delete');
      await activate('#form-dialog [type=submit]'); await saved();
      await check(`!${data}.${name}.some(item=>item.id===${record.id})`, `${name}: Delete confirms correct record at ${width}px`);
    }
  }
  // Exercise two selections, removal of just one, save, reload and edit preloading using actual taps.
  await viewport(390); await route('books'); await activate('#preview-button');
  await evaluate(`document.querySelector('[name=title]').value='Touch selection acceptance'`);
  for (const name of ['authorIds','themeIds']) {
    await activate(`input[name=${name}][value="1"]`); await activate(`input[name=${name}][value="2"]`);
    await check(`document.querySelectorAll('input[name=${name}]:checked').length===2`, `${name}: two selections by touch without modifiers`);
    await activate(`input[name=${name}][value="1"]`);
    await check(`document.querySelectorAll('input[name=${name}]:checked').length===1 && document.querySelector('input[name=${name}][value="2"]').checked`, `${name}: removing one retains the other`);
  }
  await activate('#form-dialog [type=submit]'); await saved();
  await call('Page.reload'); await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false'`);
  await check(`${data}.books.some(book=>book.title==='Touch selection acceptance' && JSON.stringify(book.authorIds)==='[2]' && JSON.stringify(book.themeIds)==='[2]')`, 'single remaining author/theme persist after reload');
  await activate('button[aria-label="Edit Touch selection acceptance"]');
  await check(`['authorIds','themeIds'].every(name=>document.querySelectorAll('input[name='+name+']:checked').length===1 && document.querySelector('input[name='+name+'][value="2"]').checked)`, 'edit preloads exactly the remaining selections');
  await close();
  // Keyboard-only traversal begins at the native dialog's initial focus, then Tab and Space.
  await activate('#preview-button');
  await check(`document.activeElement.name==='title'`, 'new book starts keyboard traversal on title');
  await tabKey(); await tabKey();
  await check(`document.activeElement.name==='authorIds' && document.activeElement.value==='1' && document.activeElement.matches(':focus-visible') && getComputedStyle(document.activeElement).outlineStyle!=='none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2`, 'Tab reaches first author with a visible focus outline');
  await space(); await tabKey(); await space();
  await check(`document.querySelectorAll('input[name=authorIds]:checked').length===2 && document.activeElement.value==='2'`, 'Space selects two authors using keyboard');
  // Tab through the remaining native author checkboxes and Clear selection to the themes.
  for (let attempt=0;attempt<160;attempt++) {
    if (await evaluate(`document.activeElement.name==='themeIds'`)) break;
    await tabKey();
  }
  await check(`document.activeElement.name==='themeIds' && document.activeElement.value==='1' && document.activeElement.matches(':focus-visible')`, 'keyboard reaches theme group without escaping dialog');
  await space(); await tabKey(); await space();
  await check(`document.querySelectorAll('input[name=themeIds]:checked').length===2`, 'Space selects two themes using keyboard');
  await space();
  await check(`!document.activeElement.checked && document.querySelectorAll('input[name=themeIds]:checked').length===1 && document.querySelector('input[name=themeIds][value="1"]').checked`, 'Space removes only the focused theme; native check mark identifies selection');
  await screenshot('checkbox-keyboard-390');
  const beforeCancel = await evaluate(storage);
  await key('Escape','Escape',27); await saved();
  await check(`${storage}===${JSON.stringify(beforeCancel)}`, 'Escape cancels keyboard selection draft without saving');
  await evaluate(`import('./js/store.js').then(store=>store.resetData())`);
  assert.deepEqual(exceptions,[], 'no uncaught browser exceptions');
  console.log(`PASS ${++checks} mobile acceptance checks; no uncaught browser exceptions`);
} catch (error) {
  await captureBrowserFailure({call,evaluate,error,exceptions}); throw error;
} finally { ws.close(); await fetch(`${endpoint}/json/close/${tab.id}`); }
