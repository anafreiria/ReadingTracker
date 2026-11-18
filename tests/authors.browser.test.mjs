// Browser integration checks, using Chrome DevTools Protocol and Node 24 only.
// Start the HTTP server and a dedicated Chrome profile as documented in GUIA_FRONTEND.
// This test replaces ONLY this application's storage key in its dedicated test tab.
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
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const storage = `localStorage.getItem('reading-tracker:data:v1')`;
const data = `JSON.parse(${storage})`;
const submit = async () => {
  await evaluate(`document.querySelector('#form-dialog form').requestSubmit()`);
  await wait(`!document.querySelector('#form-dialog').open || document.querySelector('#form-dialog form').getAttribute('aria-busy') !== 'true'`);
};
const fill = values => evaluate(`Object.entries(${JSON.stringify(values)}).forEach(([key,value]) => {document.querySelector('[name="'+key+'"]').value = value})`);
const open = async (action, name) => {
  await evaluate(`(()=>{const button=[...document.querySelectorAll('tbody button')].find(button => button.getAttribute('aria-label') === ${JSON.stringify(`${action} ${name}`)});button.focus();button.click()})()`);
  await wait(`document.querySelector('#form-dialog').open`);
};
const add = async () => {
  await click('#preview-button');
  await wait(`document.querySelector('#form-dialog').open`);
};
const reload = async () => {
  await call('Page.reload');
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy') === 'false' && !!document.querySelector('tbody')`);
};
try {
  await call('Network.enable');
  await call('Network.setCacheDisabled', {cacheDisabled: true});
  await call('Runtime.enable');
  await call('Page.enable');
  await call('Page.navigate', {url: `${base}/#authors`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy') === 'false' && !!document.querySelector('tbody')`);
  await evaluate(`localStorage.removeItem('reading-tracker:data:v1')`);
  await reload();
  await check(`${data}.authors.length === 101`, 'official seed is displayed');
  await add();
  await check(`document.activeElement.name === 'name' && document.querySelector('[name=countryId]').options.length === 28`, 'name focus and official optional countries');
  await evaluate(`window.beforeWrite = ${storage}`);
  await fill({name: '   '}); await submit();
  await check(`document.activeElement.name === 'name' && !!document.querySelector('#error-name').textContent && ${storage} === window.beforeWrite`, 'empty name has field feedback without writing');
  await fill({name: 'Browser Test Author', birthDate: '2999-01-01'}); await submit();
  await check(`document.activeElement.name === 'birthDate' && !!document.querySelector('#error-birthDate').textContent && ${storage} === window.beforeWrite`, 'future birth rejected');
  await fill({birthDate: '1980-01-01', deathDate: '1979-01-01'}); await submit();
  await check(`!!document.querySelector('#error-deathDate').textContent && ${storage} === window.beforeWrite`, 'death before birth rejected');
  await fill({countryId: '1', deathDate: '2020-01-01'});
  await evaluate(`window.writeCount=0; window.originalSet=Storage.prototype.setItem; Storage.prototype.setItem=function(...args){window.writeCount++;return window.originalSet.apply(this,args)};
    const form=document.querySelector('#form-dialog form');form.requestSubmit();form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    window.pendingProtected = document.querySelector('#close-dialog').disabled && !document.querySelector('#form-dialog').dispatchEvent(new Event('cancel',{cancelable:true}));`);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`window.pendingProtected && window.writeCount === 1 && ${data}.authors.length === 102 && document.activeElement.id === 'announcement'`, 'duplicate submission writes once; pending close protected; success focused');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);
  await reload();
  await check(`${data}.authors.some(a=>a.name==='Browser Test Author' && a.countryId===1 && a.birthDate==='1980-01-01' && a.deathDate==='2020-01-01') && document.querySelector('tbody').textContent.includes('Browser Test Author')`, 'creation with all fields survives reload');
  await open('Edit','Browser Test Author');
  await check(`document.querySelector('[name=name]').value === 'Browser Test Author' && document.querySelector('[name=birthDate]').value==='1980-01-01'`, 'editing preloads current values');
  await fill({name:'Browser Edited Author',countryId:'',birthDate:'',deathDate:''}); await submit(); await reload();
  await check(`${data}.authors.some(a=>a.id===102 && a.name==='Browser Edited Author' && a.countryId===null && a.birthDate===null && a.deathDate===null)`, 'edit clears optional fields, preserving ID after reload');
  await open('Edit','Browser Edited Author'); await submit();
  await check(`!document.querySelector('#form-dialog').open`, 'unchanged author name may be saved');
  await add(); await fill({name:'  bRoWsEr EdItEd AuThOr  '});
  await evaluate(`window.beforeWrite=${storage}`); await submit();
  await check(`!!document.querySelector('#error-name').textContent && document.querySelector('[name=name]').value==='  bRoWsEr EdItEd AuThOr  ' && ${storage}===window.beforeWrite`, 'case-insensitive duplicate preserves input and storage');
  await fill({name:'Quota Test'});
  await evaluate(`window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}`);
  await submit();
  await check(`document.querySelector('#form-dialog').open && document.querySelector('[name=name]').value==='Quota Test' && !document.querySelector('[type=submit]').disabled && ${storage}===window.beforeWrite && !!document.querySelector('#form-dialog [role=alert]').textContent`, 'quota failure retains values and permits retry');
  await evaluate(`Storage.prototype.setItem=window.originalSet`); await submit();
  await check(`${data}.authors.some(a=>a.name==='Quota Test')`, 'retry after quota failure succeeds');
  await add();await fill({name:'Death Only Author',deathDate:'2020-01-01'});await submit();
  await check(`${data}.authors.some(a=>a.name==='Death Only Author' && a.birthDate===null && a.deathDate==='2020-01-01')`, 'death without birth is allowed');
  await add();await fill({name:'Refresh Failure Author'});
  await evaluate(`window.originalGet=Storage.prototype.getItem;window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){const result=window.originalSet.apply(this,args);Storage.prototype.getItem=function(){throw Error('Read unavailable')};return result}`);
  await submit();
  await check(`!document.querySelector('#form-dialog').open && document.querySelector('#announcement').textContent.includes('change was saved') && document.activeElement.id==='announcement'`, 'refresh failure reports saved change without false save failure');
  await evaluate(`Storage.prototype.getItem=window.originalGet;Storage.prototype.setItem=window.originalSet`);await reload();
  await check(`${data}.authors.filter(a=>a.name==='Refresh Failure Author').length===1`, 'saved change after refresh failure persists exactly once');
  await add();await fill({name:'Unsubmitted Draft'});
  await evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:'reading-tracker:data:v1'}))`);
  await check(`document.querySelector('[name=name]').value==='Unsubmitted Draft' && document.querySelector('#form-dialog').open`, 'storage refresh does not replace an open draft');
  await click('#close-dialog');
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  await wait(`document.querySelector('#content').getAttribute('aria-busy')==='false'`);
  await evaluate(`(async()=>{const api=await import('./js/store.js');const author=(await api.getAuthors()).find(a=>a.name==='Quota Test');await api.deleteAuthor(author.id)})()`);
  await evaluate(`(()=>{const button=[...document.querySelectorAll('tbody button')].find(b=>b.getAttribute('aria-label')==='Edit Quota Test');button.focus();button.click()})()`);
  await wait(`document.querySelector('#announcement').textContent.includes('Record not found')`);
  await check(`!document.querySelector('#form-dialog').open && !${data}.authors.some(a=>a.name==='Quota Test')`, 'stale row lookup failure reports error without opening stale data');
  await open('Delete','Browser Edited Author');
  await check(`document.activeElement.textContent==='Cancel'`, 'deletion initially focuses Cancel');
  await click('#form-dialog form button[type=button]');
  await check(`${data}.authors.some(a=>a.name==='Browser Edited Author') && !document.querySelector('#form-dialog').open`, 'cancel deletion keeps record');
  await open('Delete','Browser Edited Author');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`${data}.authors.some(a=>a.name==='Browser Edited Author') && document.activeElement.getAttribute('aria-label')==='Delete Browser Edited Author'`, 'Escape cancels deletion and restores trigger focus');
  await open('Delete','Browser Edited Author'); await submit(); await reload();
  await check(`!${data}.authors.some(a=>a.name==='Browser Edited Author') && !document.querySelector('tbody').textContent.includes('Browser Edited Author')`, 'accepted deletion survives reload');
  const linked = await evaluate(`(()=>{const library=${data};const book=library.books.find(b=>b.authorIds.length);return {author:library.authors.find(a=>a.id===book.authorIds[0]),book}})()`);
  await open('Delete',linked.author.name); await evaluate(`window.beforeWrite=${storage}`); await submit();
  await check(`document.querySelector('#form-dialog').open && document.querySelector('#form-dialog [role=alert]').textContent.includes(${JSON.stringify(linked.book.title)}) && ${storage}===window.beforeWrite`, 'linked author cannot be deleted and message names books');
  await click('#close-dialog');
  await open('Edit',linked.author.name); await fill({name:linked.author.name+' (edited)'}); await submit();
  await check(`${data}.books.find(b=>b.id===${linked.book.id}).authorIds.includes(${linked.author.id})`, 'editing linked author preserves book references');
  // A second real page must fail to write while the first owns the Web Lock.
  const other = await (await fetch(`${endpoint}/json/new?${encodeURIComponent(`${base}/#authors`)}`,{method:'PUT'})).json();
  const otherWs=new WebSocket(other.webSocketDebuggerUrl);await new Promise(r=>otherWs.addEventListener('open',r,{once:true}));
  let otherId=0;const otherEval=expression=>new Promise((resolve,reject)=>{const id=++otherId;const listener=e=>{const m=JSON.parse(e.data);if(m.id!==id)return;otherWs.removeEventListener('message',listener);m.result.exceptionDetails?reject(Error(m.result.exceptionDetails.text)):resolve(m.result.result.value)};otherWs.addEventListener('message',listener);otherWs.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}))});
  for(let n=0;n<100;n++){if(await otherEval(`document.querySelector('#preview-button')?.disabled===false`))break;await new Promise(r=>setTimeout(r,50))}
  await otherEval(`document.querySelector('#preview-button').click()`);
  for(let n=0;n<100;n++){if(await otherEval(`document.querySelector('[name=name]')!==null`))break;await new Promise(r=>setTimeout(r,50))}
  await otherEval(`document.querySelector('[name=name]').value='Other Tab Author';document.querySelector('#form-dialog form').requestSubmit()`);
  for(let n=0;n<100;n++){if(await otherEval(`document.querySelector('#form-dialog [role=alert]')?.hidden===false`))break;await new Promise(r=>setTimeout(r,50))}
  assert.equal(await otherEval(`document.querySelector('#form-dialog [role=alert]').textContent.includes('Another tab') && document.querySelector('[name=name]').value==='Other Tab Author' && !document.querySelector('#error-name').textContent`),true);checks++;console.log('PASS second real tab preserves values and distinguishes writer conflict from duplicate name');
  otherWs.close();await fetch(`${endpoint}/json/close/${other.id}`);
  await add();await fill({name:'<img src=x onerror=alert(1)>'});await submit();
  await check(`document.querySelector('tbody').textContent.includes('<img src=x onerror=alert(1)>') && !document.querySelector('tbody img')`, 'user text is rendered safely');
  await add();
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await check(`document.activeElement.name==='countryId'`, 'keyboard Tab reaches nationality');
  for (const width of [1280,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await check(`document.documentElement.scrollWidth<=window.innerWidth && document.querySelector('#form-dialog').scrollWidth<=document.querySelector('#form-dialog').clientWidth`, `dialog and page fit ${width}px`);
    if(process.env.SCREENSHOT_DIR){await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`${process.env.SCREENSHOT_DIR}/fr01-author-${width}.png`,Buffer.from(shot.data,'base64'));}
  }
  await click('#close-dialog');
  for(const route of ['readings']){
    await evaluate(`location.hash=${JSON.stringify(route)}`);await wait(`document.querySelector('[aria-current=page]').dataset.route===${JSON.stringify(route)}`);
    await click('#preview-button');await wait(`!!document.querySelector('[name=bookId]')`);await check(`document.querySelector('#form-dialog').open && !document.querySelector('[type=submit]').disabled`, `${route} now offers a functional form`);await click('#close-dialog');
  }
  await evaluate(`location.hash='books'`);await wait(`document.querySelector('[aria-current=page]').dataset.route==='books'`);
  await click('#preview-button');await wait(`!!document.querySelector('[name=title]')`);
  await check(`!document.querySelector('[type=submit]').disabled && document.activeElement.name==='title'`, 'books now offers a functional form');await click('#close-dialog');
  await evaluate(`location.hash='readings'`);await wait(`document.querySelector('[aria-current=page]').dataset.route==='readings'`);
  await check(`document.querySelectorAll('th[aria-sort]').length===5`, 'reading history retains five sortable columns');
  await click('#reset-data');
  await check(`document.querySelector('#reset-data').disabled && document.querySelector('#preview-button').disabled`, 'reset confirmation blocks a second page action until close resolves');
  await evaluate(`document.querySelector('#form-dialog .dialog-actions button[type=button]').click();document.querySelector('#reset-data').click()`);
  await wait(`!document.querySelector('#reset-data').disabled`);
  await check(`!document.querySelector('#form-dialog').open && document.activeElement.id==='reset-data'`, 'immediate reset retry after Cancel cannot reopen a pending confirmation; focus returns');
  await check(`${data}.authors.length>101`, 'cancel reset preserves edits');
  await click('#reset-data');await click('#form-dialog .button-danger');await wait(`document.querySelector('#announcement').textContent.includes('restored')`);
  await check(`${data}.authors.length===101 && ${data}.books.length===143`, 'confirmed reset restores seed');
  assert.deepEqual(exceptions,[],'no uncaught browser exceptions');
  console.log(`PASS ${++checks} checks; no uncaught browser exceptions`);
} catch (error) {
  await captureBrowserFailure({call, evaluate, error, exceptions});
  throw error;
} finally {
  ws.close();
  await fetch(`${endpoint}/json/close/${tab.id}`);
}
