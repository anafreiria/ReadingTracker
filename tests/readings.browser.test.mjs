// FR-03 readings integration checks. Use a dedicated Chrome profile as in GUIA_FRONTEND.
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
  await evaluate(`document.querySelector('#preview-button').focus()`);
  await click('#preview-button');
  await wait(`document.querySelector('#form-dialog').open`);
};
const reload = async () => {
  await call('Page.reload');
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy') === 'false' && !!document.querySelector('tbody')`);
};
const close = async () => {
  await click('#close-dialog');
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
};
const readAction = async (action, id, host = '#content') => {
  await evaluate(`(()=>{const button=document.querySelector(${JSON.stringify(`${host} [data-reading-action="${action}"][data-reading-id="${id}"]`)});button.focus();button.click()})()`);
  await wait(`document.querySelector('#form-dialog').open && ${action === 'view' ? "!!document.querySelector('.book-details')" : "!!document.querySelector('#form-dialog form')"}`);
};
const edit = async values => {
  await fill(values);
  await evaluate(`Object.keys(${JSON.stringify(values)}).forEach(name=>document.querySelector('[name="'+name+'"]').dispatchEvent(new Event('input',{bubbles:true})))`);
};
const hash = async route => {
  await evaluate(`location.hash=${JSON.stringify(route)}`);
  await wait(`document.querySelector('[aria-current=page]').dataset.route===${JSON.stringify(route)}`);
};
let extraTab, extraSocket;
try {
  await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Runtime.enable');await call('Page.enable');
  await call('Page.navigate',{url:`${base}/#readings`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false' && !!document.querySelector('tbody')`);
  await evaluate(`localStorage.removeItem('reading-tracker:data:v1')`);await reload();
  await check(`document.querySelector('#page-title').textContent==='Reading History' && document.querySelectorAll('th[aria-sort]').length===5 && ${data}.readings.length===143`, 'official history and its five sortable columns retained');
  const book=await evaluate(`(async()=>{const api=await import('./js/store.js');return api.saveBook({title:'Reading Browser Book',publicationYear:2000})})()`);
  await add();
  await check(`document.activeElement.name==='bookId' && !document.querySelector('[type=submit]').disabled && document.querySelector('[name=status]').options.length===5`, 'global Add reading focuses book and offers five official statuses');
  await fill({bookId:String(book.id),status:'Want to read',priority:'High',recommendedBy:'A friend',notes:'Original notes\n<img src=x onerror=alert(1)>'});
  await evaluate(`window.originalSet=Storage.prototype.setItem;window.writes=0;Storage.prototype.setItem=function(...args){window.writes++;return window.originalSet.apply(this,args)};const form=document.querySelector('#form-dialog form');form.requestSubmit();form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));window.protected=document.querySelector('#close-dialog').disabled&&!document.querySelector('#form-dialog').dispatchEvent(new Event('cancel',{cancelable:true}))`);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`window.writes===1 && window.protected && document.activeElement.id==='announcement'`, 'FR03-C1 create is persisted once and protects pending close/duplicate submit');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);
  const original=await evaluate(`${data}.readings.find(r=>r.bookId===${book.id})`);await reload();
  await check(`${data}.readings.some(r=>r.id===${original.id} && r.bookId===${book.id} && r.priority==='High' && r.recommendedBy==='A friend') && document.querySelector('tbody').textContent.includes('Reading Browser Book')`, 'FR03-C1 creation survives reload with numeric book reference');
  await readAction('view',original.id);
  await check(`document.querySelector('.book-details').textContent.includes(${JSON.stringify(original.notes)}) && document.querySelector('.book-details').textContent.includes('A friend') && document.querySelector('.book-details').textContent.includes('High') && !document.querySelector('#form-dialog img')`, 'FR03-C1 details include all optional text safely');await close();
  await hash('books');
  await evaluate(`(()=>{const button=document.querySelector('[aria-label="View history: Reading Browser Book"]');button.focus();button.click()})()`);
  await wait(`!!document.querySelector('#form-dialog [data-reading-action]')`);
  await check(`document.querySelectorAll('#form-dialog tbody tr').length===1`, 'FR03-C1 book history queries by bookId');
  await click('#form-dialog [aria-label="Add reading: Reading Browser Book"]');
  await wait(`!!document.querySelector('[name=bookId]')`);
  await check(`document.querySelector('[name=bookId]').value==='${book.id}' && document.querySelector('[name=notes]').value===''`, 'FR03-C3 Add reading from book history starts a new preselected record');
  await fill({status:'Read',yearRead:'2024',grade:'0',notes:'Re-read notes'});await submit();
  const reread=await evaluate(`${data}.readings.find(r=>r.bookId===${book.id} && r.id!==${original.id})`);
  assert.notEqual(reread.id,original.id);assert.notEqual(reread.id,book.id);
  await check(`${data}.readings.filter(r=>r.bookId===${book.id}).length===2 && JSON.stringify(${data}.readings.find(r=>r.id===${original.id}))===JSON.stringify(${JSON.stringify(original)})`, 'FR03-C3 re-read creates different ID and preserves original reading entirely');
  await hash('readings');await reload();
  await readAction('view',reread.id);
  await check(`[...document.querySelectorAll('.book-details dd')].some(node=>node.textContent==='0')`, 'grade zero is displayed as a value');await close();
  await readAction('edit',original.id);
  await check(`document.querySelector('[name=notes]').value===${JSON.stringify(original.notes)} && document.querySelector('[name=priority]').value==='High'`, 'FR03-C1 editing preloads current record by ID');
  await edit({status:'Reading'});await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${original.id} && r.status==='Reading' && r.priority===null && r.notes===${JSON.stringify(original.notes)} && r.recommendedBy==='A friend') && ${data}.readings.find(r=>r.id===${reread.id}).grade===0`, 'FR03-C1 edit preserves ID, other readings, notes and recommendation while clearing wishlist priority');
  await add();await fill({bookId:String(book.id),status:'Read'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`document.activeElement.name==='yearRead' && !!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'Read requires year with field feedback and no write');
  for(const year of ['2999','1999','2024.5']){
    await fill({yearRead:year});await submit();
    await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, `invalid year ${year} rejected without writing`);
  }
  await fill({yearRead:'2024'});
  for(const grade of ['10.5','-0.5','8.2']){
    await fill({grade});await submit();
    await check(`!!document.querySelector('#error-grade').textContent && ${storage}===window.beforeWrite`, `invalid grade ${grade} rejected without writing`);
  }
  await fill({status:'Want to read',grade:'8.5'});await submit();
  await check(`!!document.querySelector('#error-yearRead').textContent && !!document.querySelector('#error-grade').textContent && ${storage}===window.beforeWrite`, 'new wishlist rejects result fields without silently clearing them');
  await fill({status:'Reading',yearRead:'',grade:'',priority:'High'});await submit();
  await check(`!!document.querySelector('#error-priority').textContent && ${storage}===window.beforeWrite`, 'priority outside wishlist rejected');await close();
  await readAction('edit',reread.id);await edit({status:'Paused'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`!!document.querySelector('#error-confirmFieldClear').textContent && document.querySelector('[name=yearRead]').value==='2024' && document.querySelector('[name=grade]').value==='0' && ${storage}===window.beforeWrite`, 'incompatible edit requires explicit clearance including grade zero, preserving values');
  await check(`document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Year read') && document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Grade')`, 'clearance identifies the fields that will be removed');
  await click('[name=confirmFieldClear]');await edit({status:'Reading'});
  await check(`!document.querySelector('[name=confirmFieldClear]').checked`, 'changing status invalidates earlier clearance consent');
  await close();await check(`${storage}===window.beforeWrite`, 'canceling incompatible edit makes no write');
  await readAction('edit',reread.id);await edit({status:'Paused'});await click('[name=confirmFieldClear]');
  await evaluate(`window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}`);await submit();
  await check(`document.querySelector('#form-dialog').open && document.querySelector('[name=yearRead]').value==='2024' && document.querySelector('[name=grade]').value==='0' && !document.querySelector('[type=submit]').disabled && ${storage}===window.beforeWrite`, 'quota failure during confirmed edit retains record and draft without false success');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${reread.id} && r.status==='Paused' && r.yearRead===null && r.grade===null && r.notes==='Re-read notes')`, 'retry saves confirmed edit without losing notes');
  await readAction('edit',reread.id);await fill({notes:'Changed notes',recommendedBy:'New recommendation'});await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${reread.id} && r.notes==='Changed notes' && r.recommendedBy==='New recommendation')`, 'FR03-C1 optional edits persist after reload');
  await readAction('delete',reread.id);await evaluate(`window.beforeWrite=${storage}`);
  await check(`document.activeElement.textContent==='Cancel' && document.querySelector('.confirmation-message').textContent.includes('Reading Browser Book') && document.querySelector('.confirmation-message').textContent.includes('#${reread.id}')`, 'individual deletion identifies book and reading, initially focusing Cancel');
  await click('#form-dialog form button[type=button]');await check(`${storage}===window.beforeWrite`, 'cancel individual deletion makes no write');
  await readAction('delete',reread.id);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(`!document.querySelector('#form-dialog').open`);
  await check(`${storage}===window.beforeWrite && document.activeElement.dataset.readingId==='${reread.id}'`, 'Escape cancels individual deletion and restores trigger focus');
  const beforeOthers=await evaluate(`${data}.readings.filter(r=>r.id!==${reread.id})`);
  await readAction('delete',reread.id);await submit();await reload();
  await check(`!${data}.readings.some(r=>r.id===${reread.id}) && ${data}.books.some(b=>b.id===${book.id}) && JSON.stringify(${data}.readings)===JSON.stringify(${JSON.stringify(beforeOthers)})`, 'FR03-C1 individual delete persists while preserving book and all other readings');
  await hash('books');await evaluate(`document.querySelector('[aria-label="Add reading: Reading Browser Book"]').click()`);await wait(`!!document.querySelector('[name=bookId]')`);
  await fill({status:'Abandoned',grade:'0',notes:'Abandoned optional year'});await submit();
  await check(`${data}.readings.some(r=>r.bookId===${book.id} && r.status==='Abandoned' && r.yearRead===null && r.grade===0)`, 'Abandoned permits absent year and zero grade');
  await open('View details:','Reading Browser Book');await wait(`!!document.querySelector('.book-details')`);
  await check(`document.querySelectorAll('#form-dialog tbody tr').length===2 && document.querySelectorAll('#form-dialog [data-reading-action=edit]').length===2`, 'FR03-C3 book details expose multiple readings and per-reading actions');
  await readAction('edit',original.id,'#form-dialog');await close();
  await check(`document.activeElement.getAttribute('aria-label')==='View details: Reading Browser Book'`, 'canceling a reading reached through book details restores page trigger');
  await open('View details:','Reading Browser Book');
  await evaluate(`(async()=>{const api=await import('./js/store.js');await api.deleteReading(${original.id})})()`);
  await click('#form-dialog [data-reading-action="edit"][data-reading-id="'+original.id+'"]');
  await wait(`!!document.querySelector('[data-open-error]')`);
  await check(`document.querySelector('[data-open-error]').textContent.includes('Record not found') && document.activeElement.hasAttribute('data-open-error') && !document.querySelector('#form-dialog form')`, 'stale reading lookup displays and focuses 404 inside the open book dialog');await close();
  // Standalone creation failure + second-tab writer conflict.
  await hash('readings');await add();await fill({bookId:String(book.id),status:'Want to read',notes:'Pending draft'});
  await evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:'reading-tracker:data:v1'}))`);
  await check(`document.querySelector('[name=notes]').value==='Pending draft' && document.querySelector('#form-dialog').open`, 'storage event does not replace an open reading draft');await close();
  await wait(`document.querySelector('#content').getAttribute('aria-busy')==='false'`);
  extraTab=await (await fetch(`${endpoint}/json/new?about:blank`,{method:'PUT'})).json();extraSocket=new WebSocket(extraTab.webSocketDebuggerUrl);await new Promise(r=>extraSocket.addEventListener('open',r,{once:true}));let secondId=0;
  const secondCall=(method,params={})=>new Promise((resolve,reject)=>{const id=++secondId;const listener=e=>{const m=JSON.parse(e.data);if(m.id!==id)return;extraSocket.removeEventListener('message',listener);m.error?reject(Error(m.error.message)):resolve(m.result)};extraSocket.addEventListener('message',listener);extraSocket.send(JSON.stringify({id,method,params}))});
  const secondEval=async expression=>{const r=await secondCall('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
  await secondCall('Network.enable');await secondCall('Network.setCacheDisabled',{cacheDisabled:true});await secondCall('Page.navigate',{url:`${base}/#readings`});
  for(let n=0;n<100;n++){if(await secondEval(`document.querySelector('#preview-button')?.disabled===false`))break;await new Promise(r=>setTimeout(r,50))}
  await secondEval(`document.querySelector('#preview-button').click()`);for(let n=0;n<100;n++){if(await secondEval(`!!document.querySelector('[name=bookId]')`))break;await new Promise(r=>setTimeout(r,50))}
  await secondEval(`document.querySelector('[name=notes]').value='Other tab draft';document.querySelector('#form-dialog form').requestSubmit()`);for(let n=0;n<100;n++){if(await secondEval(`document.querySelector('[data-form-message]')?.hidden===false`))break;await new Promise(r=>setTimeout(r,50))}
  assert.equal(await secondEval(`document.querySelector('[data-form-message]').textContent.includes('Another tab') && document.querySelector('[name=notes]').value==='Other tab draft'`),true);checks++;console.log('PASS real second-tab conflict preserves reading draft');extraSocket.close();await fetch(`${endpoint}/json/close/${extraTab.id}`);extraTab=undefined;
  await add();await fill({bookId:String(book.id),notes:'Saved after refresh failure'});
  await evaluate(`window.originalGet=Storage.prototype.getItem;window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){const result=window.originalSet.apply(this,args);Storage.prototype.getItem=function(){throw Error('Read unavailable')};return result}`);await submit();
  await check(`!document.querySelector('#form-dialog').open && document.querySelector('#announcement').textContent.includes('change was saved') && document.activeElement.id==='announcement'`, 'refresh failure after save reports persisted change accurately');
  await evaluate(`Storage.prototype.getItem=window.originalGet;Storage.prototype.setItem=window.originalSet`);await reload();
  await check(`${data}.readings.filter(r=>r.notes==='Saved after refresh failure').length===1`, 'refresh failure does not duplicate persisted reading');
  await add();await fill({bookId:String(book.id),status:'Read',yearRead:'2025',grade:'8.5',notes:'Keyboard and mobile check'});
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await check(`document.querySelector('#form-dialog').contains(document.activeElement)`, 'keyboard focus stays inside reading dialog');
  const shotDir=process.env.SCREENSHOT_DIR||'/tmp/reading-tracker-fr03-shots';await mkdir(shotDir,{recursive:true});
  for(const width of [1280,390]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await check(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('#form-dialog').scrollWidth<=document.querySelector('#form-dialog').clientWidth`, `reading form fits ${width}px`);
    await evaluate(`document.querySelector('#form-dialog').scrollTop=0`);const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`${shotDir}/fr03-reading-${width}.png`,Buffer.from(shot.data,'base64'));
  }await close();
  await hash('books');const affected=await evaluate(`${data}.readings.filter(r=>r.bookId===${book.id}).length`);const unrelated=await evaluate(`${data}.readings.filter(r=>r.bookId!==${book.id})`);
  await open('Delete','Reading Browser Book');await evaluate(`window.beforeWrite=${storage}`);
  await check(`document.querySelector('.confirmation-message').textContent.includes('${affected} reading(s)')`, 'FR03-C4 book deletion counts all re-readings');await click('#form-dialog form button[type=button]');await check(`${storage}===window.beforeWrite`, 'FR03-C4 canceled cascade preserves every reading');
  await open('Delete','Reading Browser Book');await submit();await reload();
  await check(`!${data}.books.some(b=>b.id===${book.id}) && !${data}.readings.some(r=>r.bookId===${book.id}) && JSON.stringify(${data}.readings)===JSON.stringify(${JSON.stringify(unrelated)})`, 'FR03-C4 accepted cascade persists and preserves readings from other books');
  await add();await fill({title:'FR03 Combined Book'});await click('#include-first-reading');await fill({status:'Read'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'FR03-C2 invalid first reading leaves no partial book');await fill({yearRead:'2025',grade:'7.5'});
  await evaluate(`window.originalSet=Storage.prototype.setItem;window.writes=0;Storage.prototype.setItem=function(...args){window.writes++;return window.originalSet.apply(this,args)}`);await submit();
  await check(`window.writes===1 && ${data}.readings.some(r=>r.bookId===${data}.books.find(b=>b.title==='FR03 Combined Book').id && r.status==='Read' && r.grade===7.5)`, 'FR03-C2 book and optional first reading use one Save and one write');await evaluate(`Storage.prototype.setItem=window.originalSet`);
  await hash('readings');await reload();await check(`document.querySelector('tbody').textContent.includes('FR03 Combined Book')`, 'FR03-C2 combined reading appears in global history after reload');
  await evaluate(`(()=>{const library=${data};library.books=[];library.readings=[];localStorage.setItem('reading-tracker:data:v1',JSON.stringify(library))})()`);await call('Page.reload');await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false' && !document.querySelector('tbody')`);await add();
  await check(`document.querySelector('[type=submit]').disabled && document.querySelector('#form-dialog').textContent.includes('Add a book before')`, 'no-books state explains prerequisite and prevents invalid saving');await close();
  await click('#reset-data');await click('#form-dialog .button-danger');await wait(`document.querySelector('#announcement').textContent.includes('restored')`);
  await check(`${data}.books.length===143 && ${data}.readings.length===143`, 'reset restores official library after reading CRUD');
  assert.deepEqual(exceptions,[],'no uncaught browser exceptions');console.log(`PASS ${++checks} checks; no uncaught browser exceptions`);
} catch (error) {
  await captureBrowserFailure({call, evaluate, error, exceptions});
  throw error;
} finally {
  extraSocket?.close();if(extraTab)await fetch(`${endpoint}/json/close/${extraTab.id}`);
  ws.close();await fetch(`${endpoint}/json/close/${tab.id}`);
}
