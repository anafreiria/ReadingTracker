// FR-04 status workflow audit, with all 25 source/destination pairs. Use a dedicated Chrome profile as in GUIA_FRONTEND.
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
const statuses=['Want to read','Reading','Paused','Read','Abandoned'];
const resultStatuses=['Read','Abandoned'];
let extraTab, extraSocket;
try {
  await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Runtime.enable');await call('Page.enable');await call('Page.navigate',{url:`${base}/#readings`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false' && !!document.querySelector('tbody')`);
  await evaluate(`localStorage.removeItem('reading-tracker:data:v1')`);await reload();
  const book=await evaluate(`(async()=>{const api=await import('./js/store.js');return api.saveBook({title:'Status Audit Book',publicationYear:2000})})()`);
  const fixture=async (status, overrides={})=>evaluate(`(async()=>{const api=await import('./js/store.js');return api.saveReading(${JSON.stringify({bookId:book.id,status,
    yearRead:resultStatuses.includes(status)?2024:null,grade:status==='Read'?0:status==='Abandoned'?8.5:null,
    priority:status==='Want to read'?'High':null,recommendedBy:'Keep recommendation',notes:'Keep notes\nSecond line',...overrides})})})()`);
  const pairs=[];
  for(const from of statuses)for(const to of statuses)pairs.push({from,to,reading:await fixture(from,{notes:`${from} -> ${to}`})});
  await reload();
  for(const {from,to,reading} of pairs){
    const before=await evaluate(storage);
    const others=await evaluate(`${data}.readings.filter(r=>r.id!==${reading.id})`);
    await readAction('edit',reading.id);
    await edit({status:to});
    if(to==='Read')await edit({yearRead:String(reading.yearRead??2025),grade:String(reading.grade??8.5)});
    if(to==='Want to read')await edit({priority:'Low'});
    await check(`document.querySelector('[name=yearRead]').required===${to==='Read'} && document.querySelector('[name=status]').getAttribute('aria-describedby').includes('reading-status-help') && document.querySelector('#reading-status-help').textContent.length>20 && document.querySelector('#reading-status-help').getAttribute('role')==='status'`, `FR04-C1 guidance and required-year metadata: ${from} -> ${to}`);
    const clearing=resultStatuses.includes(from)&&!resultStatuses.includes(to);
    if(clearing){
      await submit();
      await check(`!!document.querySelector('#error-confirmFieldClear').textContent && ${storage}===${JSON.stringify(before)} && document.querySelector('[name=yearRead]').value==='2024' && document.querySelector('[name=grade]').value==='${reading.grade}'`, `FR04-C5 ${from} -> ${to} rejects missing consent without clearing draft`);
      await click('[name=confirmFieldClear]');
    }
    await submit();await wait(`!document.querySelector('#form-dialog').open`);await reload();
    const expected={...reading,status:to,
      yearRead:to==='Read'?(reading.yearRead??2025):to==='Abandoned'?reading.yearRead:null,
      grade:to==='Read'?(reading.grade??8.5):to==='Abandoned'?reading.grade:null,
      priority:to==='Want to read'?'Low':null};
    assert.deepEqual(await evaluate(`${data}.readings.find(r=>r.id===${reading.id})`),expected,`${from} -> ${to}`);
    await check(`JSON.stringify(${data}.readings.filter(r=>r.id!==${reading.id}))===JSON.stringify(${JSON.stringify(others)}) && ${data}.books.some(b=>b.id===${book.id})`, `FR04 matrix persisted ${from} -> ${to}, preserving ID/book/notes/recommendation and other readings`);
  }
  // Requirement boundaries are also checked independently of the successful matrix.
  const abandoned=await fixture('Abandoned',{yearRead:null,grade:null});await reload();await readAction('edit',abandoned.id);await edit({status:'Read'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`document.querySelector('[name=yearRead]').required && !!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'FR04-C1 Abandoned without a year cannot move to Read without entering one');
  await edit({yearRead:'2999'});await submit();await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'FR04-C1 future completion year rejected without write');
  await edit({yearRead:'1999'});await submit();await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'FR04-C1 completion before publication rejected without write');
  await edit({yearRead:'2024.5'});await submit();await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'FR04-C1 fractional completion year rejected without write');
  await edit({yearRead:'2025',grade:''});await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${abandoned.id} && r.status==='Read' && r.yearRead===2025 && r.grade===null)`, 'FR04-C1/C2 Read needs year but grade remains optional');
  const optional=await fixture('Reading');await reload();await readAction('edit',optional.id);await edit({status:'Abandoned'});await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${optional.id} && r.status==='Abandoned' && r.yearRead===null && r.grade===null)`, 'FR04-C1/C2 Abandoned accepts both optional result fields absent');
  for(const priority of ['Low','Medium','High']){
    await add();await fill({bookId:String(book.id),priority});await submit();
    await check(`${data}.readings.some(r=>r.bookId===${book.id} && r.status==='Want to read' && r.priority==='${priority}')`, `FR04-C3 wishlist accepts ${priority}`);
  }
  for(const status of statuses.filter(item=>item!=='Want to read')){
    await add();await edit({bookId:String(book.id),status,yearRead:status==='Read'?'2025':'',priority:'High'});await evaluate(`window.beforeWrite=${storage}`);await submit();
    await check(`!!document.querySelector('#error-priority').textContent && ${storage}===window.beforeWrite`, `FR04-C3 new ${status} rejects wishlist priority without write`);await close();
  }
  for(const status of statuses.filter(item=>!resultStatuses.includes(item))){
    await add();await edit({bookId:String(book.id),status,grade:'0'});await evaluate(`window.beforeWrite=${storage}`);await submit();
    await check(`!!document.querySelector('#error-grade').textContent && ${storage}===window.beforeWrite`, `FR04-C2 new ${status} rejects grade zero rather than treating it as absent`);
    await edit({grade:'',yearRead:'2024'});await submit();
    await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, `FR04-C1 new ${status} rejects year rather than silently dropping it`);await close();
  }
  const justYear=await fixture('Abandoned',{grade:null});await reload();await readAction('edit',justYear.id);await edit({status:'Paused'});
  await check(`document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Year read') && !document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Grade')`, 'FR04-C5 only year is listed when only year will be removed');
  await evaluate(`window.beforeWrite=${storage}`);await click('#form-dialog form button[type=button]');await check(`${storage}===window.beforeWrite`, 'FR04-C5 Cancel preserves year without writing');
  const justGrade=await fixture('Abandoned',{yearRead:null,grade:0});await reload();await readAction('edit',justGrade.id);await edit({status:'Reading'});
  await check(`document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Grade') && !document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Year read')`, 'FR04-C5 only grade zero is listed when year was absent');
  await evaluate(`window.beforeWrite=${storage}`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(`!document.querySelector('#form-dialog').open`);
  await check(`${storage}===window.beforeWrite && document.activeElement.dataset.readingId==='${justGrade.id}'`, 'FR04-C5 Escape preserves zero grade and restores trigger focus');
  const original=await fixture('Read');await reload();await readAction('edit',original.id);await edit({yearRead:'',grade:'',status:'Paused'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`!!document.querySelector('#error-confirmFieldClear').textContent && document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Year read') && document.querySelector('[aria-label="Confirm data removal"]').textContent.includes('Grade') && ${storage}===window.beforeWrite`, 'FR04-C5 manually emptying fields does not bypass consent for persisted result fields');await close();
  await readAction('edit',original.id);await edit({status:'Paused'});await click('[name=confirmFieldClear]');await edit({grade:'8.5'});
  await check(`!document.querySelector('[name=confirmFieldClear]').checked`, 'FR04-C5 editing grade invalidates consent');await click('[name=confirmFieldClear]');await edit({yearRead:'2023'});
  await check(`!document.querySelector('[name=confirmFieldClear]').checked`, 'FR04-C5 editing year invalidates consent');await click('[name=confirmFieldClear]');await edit({status:'Reading'});
  await check(`!document.querySelector('[name=confirmFieldClear]').checked`, 'FR04-C5 changing target status invalidates consent');await edit({status:'Read',yearRead:'2024',grade:'0'});
  await check(`document.querySelector('[aria-label="Confirm data removal"]').hidden && !document.querySelector('[name=confirmFieldClear]').checked`, 'FR04-C5 returning to original status hides obsolete consent without clearing fields');await submit();await reload();
  await check(`Object.entries(${JSON.stringify(original)}).every(([key,value])=>${data}.readings.find(r=>r.id===${original.id})[key]===value)`, 'FR04-C5 returning to Read retains the complete original reading');
  await readAction('edit',original.id);await edit({status:'Paused'});await evaluate(`window.beforeWrite=${storage};window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}`);await click('[name=confirmFieldClear]');await submit();
  await check(`document.querySelector('#form-dialog').open && document.querySelector('[name=confirmFieldClear]').checked && document.querySelector('[name=yearRead]').value==='2024' && document.querySelector('[name=grade]').value==='0' && ${storage}===window.beforeWrite && !document.querySelector('[type=submit]').disabled`, 'FR04-C5 quota failure preserves original data, values and current consent for retry');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);await submit();await reload();
  await check(`${data}.readings.some(r=>r.id===${original.id} && r.status==='Paused' && r.yearRead===null && r.grade===null && r.recommendedBy==='Keep recommendation' && r.notes===${JSON.stringify(original.notes)})`, 'FR04-C4/C5 successful retry removes results and preserves recommendation/notes');
  // Capture the actual clearance warning, with keyboard focus on its consent control.
  const capture=await fixture('Read');await reload();await readAction('edit',capture.id);await edit({status:'Reading'});await submit();
  await check(`document.activeElement.name==='confirmFieldClear' && document.querySelector('[aria-label="Confirm data removal"] [role=status]')!==null`, 'FR04-C5 missing consent focuses its field and warning is announced');
  const shotDir=process.env.SCREENSHOT_DIR||'/tmp/reading-tracker-fr04-shots';await mkdir(shotDir,{recursive:true});
  for(const width of [1280,390]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await evaluate(`document.querySelector('[name=confirmFieldClear]').scrollIntoView({block:'center'})`);
    await check(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('#form-dialog').scrollWidth<=document.querySelector('#form-dialog').clientWidth`, `FR04 clearance fits ${width}px`);
    const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`${shotDir}/fr04-status-${width}.png`,Buffer.from(shot.data,'base64'));
  }await close();
  // Acquire the writer lock in this page, then verify the confirmed edit in another real tab.
  await evaluate(`(async()=>{const api=await import('./js/store.js');await api.saveReading({id:${capture.id},notes:${JSON.stringify(capture.notes)}})})()`);
  extraTab=await (await fetch(`${endpoint}/json/new?about:blank`,{method:'PUT'})).json();extraSocket=new WebSocket(extraTab.webSocketDebuggerUrl);await new Promise(r=>extraSocket.addEventListener('open',r,{once:true}));let secondId=0;
  const secondCall=(method,params={})=>new Promise((resolve,reject)=>{const id=++secondId;const listener=e=>{const m=JSON.parse(e.data);if(m.id!==id)return;extraSocket.removeEventListener('message',listener);m.error?reject(Error(m.error.message)):resolve(m.result)};extraSocket.addEventListener('message',listener);extraSocket.send(JSON.stringify({id,method,params}))});
  const secondEval=async expression=>{const r=await secondCall('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
  await secondCall('Network.enable');await secondCall('Network.setCacheDisabled',{cacheDisabled:true});await secondCall('Page.navigate',{url:`${base}/#readings`});
  for(let n=0;n<100;n++){if(await secondEval(`document.querySelector('#preview-button')?.disabled===false`))break;await new Promise(r=>setTimeout(r,50))}
  await secondEval(`document.querySelector('[data-reading-id="${capture.id}"][data-reading-action=edit]').click()`);for(let n=0;n<100;n++){if(await secondEval(`!!document.querySelector('[name=status]')`))break;await new Promise(r=>setTimeout(r,50))}
  const beforeConflict=await evaluate(storage);
  await secondEval(`const status=document.querySelector('[name=status]');status.value='Paused';status.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[name=confirmFieldClear]').click();document.querySelector('#form-dialog form').requestSubmit()`);
  for(let n=0;n<100;n++){if(await secondEval(`document.querySelector('[data-form-message]')?.hidden===false`))break;await new Promise(r=>setTimeout(r,50))}
  assert.equal(await secondEval(`document.querySelector('[data-form-message]').textContent.includes('Another tab') && document.querySelector('[name=yearRead]').value==='2024' && document.querySelector('[name=grade]').value==='0' && document.querySelector('[name=confirmFieldClear]').checked`),true);checks++;console.log('PASS FR04-C5 real writer conflict preserves confirmed status draft');
  await check(`${storage}===${JSON.stringify(beforeConflict)}`, 'FR04-C5 conflicting confirmed edit makes no write');extraSocket.close();await fetch(`${endpoint}/json/close/${extraTab.id}`);extraTab=undefined;
  await click('#reset-data');await click('#form-dialog .button-danger');await wait(`document.querySelector('#announcement').textContent.includes('restored')`);
  await check(`${data}.books.length===143 && ${data}.readings.length===143`, 'reset restores the seed after the status matrix');
  assert.deepEqual(exceptions,[],'no uncaught browser exceptions');console.log(`PASS ${++checks} checks; 25 persisted status pairs; no uncaught browser exceptions`);
} catch (error) {
  await captureBrowserFailure({call, evaluate, error, exceptions});
  throw error;
} finally {
  extraSocket?.close();if(extraTab)await fetch(`${endpoint}/json/close/${extraTab.id}`);
  ws.close();await fetch(`${endpoint}/json/close/${tab.id}`);
}
