// Books/themes integration checks. Use a dedicated Chrome profile as in GUIA_FRONTEND.
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
const choose = values => evaluate(`Object.entries(${JSON.stringify(values)}).forEach(([key,ids])=>{for(const option of document.querySelector('[name="'+key+'"]').options)option.selected=ids.includes(Number(option.value))})`);
const themeButton = '#form-dialog section button';
const createTheme = async () => {
  await click(themeButton);
  await wait(`document.querySelector('#form-dialog form').getAttribute('aria-busy')!=='true'`);
};
try {
  await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
  await call('Runtime.enable');await call('Page.enable');
  await call('Page.navigate',{url:`${base}/#books`});
  await wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false' && !!document.querySelector('tbody')`);
  await evaluate(`localStorage.removeItem('reading-tracker:data:v1')`);await reload();
  await check(`document.querySelector('#page-title').textContent==='Your books' && ${data}.books.length===143`, 'official books and page title loaded');
  await add();
  await check(`document.activeElement.name==='title' && document.querySelector('[name=authorIds]').options.length===101 && document.querySelector('[name=themeIds]').options.length===135`, 'title focus and official selections');
  await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`document.activeElement.name==='title' && !!document.querySelector('#error-title').textContent && ${storage}===window.beforeWrite`, 'empty title has field feedback without write');
  await fill({title:'Minimal Book'});
  await evaluate(`window.originalSet=Storage.prototype.setItem;window.writes=0;Storage.prototype.setItem=function(...args){window.writes++;return window.originalSet.apply(this,args)};const form=document.querySelector('#form-dialog form');form.requestSubmit();form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));window.protected=document.querySelector('#close-dialog').disabled&&!document.querySelector('#form-dialog').dispatchEvent(new Event('cancel',{cancelable:true}))`);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`window.writes===1 && window.protected && ${data}.books.filter(b=>b.title==='Minimal Book').length===1 && ${data}.readings.length===143 && document.activeElement.id==='announcement'`, 'title-only creation, one write, duplicate-send protection and success focus');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);await reload();
  await check(`${data}.books.some(b=>b.title==='Minimal Book' && b.publicationYear===null && b.form===null && !b.authorIds.length && !b.themeIds.length)`, 'minimal optional values persist after reload');
  await open('View details:','Minimal Book');
  await check(`document.querySelector('.book-details').textContent.includes('-') && document.querySelector('#form-dialog').textContent.includes('No readings')`, 'minimal details and empty history render safely');await close();
  await add();await fill({title:'Full Book',publicationYear:'-429',form:'Novel',mode:'Prose',content:'Fiction'});await choose({authorIds:[1,2],themeIds:[1,2]});
  await createTheme();
  await check(`!!document.querySelector('#error-newTheme').textContent && document.querySelector('[name=title]').value==='Full Book'`, 'empty theme rejected without losing draft');
  const existingTheme = await evaluate(`${data}.themes[0].name`);await fill({newTheme:existingTheme.toUpperCase()});await createTheme();
  await check(`!!document.querySelector('#error-newTheme').textContent && document.querySelector('[name=themeIds]').selectedOptions.length===2`, 'case-insensitive theme duplicate preserves selections');
  await fill({newTheme:'New Browser Theme'});await submit();
  await check(`document.activeElement.name==='newTheme' && !${data}.books.some(b=>b.title==='Full Book')`, 'uncreated theme cannot be silently discarded by Save');
  await createTheme();
  await check(`document.querySelector('[name=themeIds]').selectedOptions.length===3 && document.querySelector('[name=authorIds]').selectedOptions.length===2 && document.querySelector('[name=title]').value==='Full Book' && document.querySelector('[name=publicationYear]').value==='-429' && document.querySelector('[name=newTheme]').value===''`, 'new theme selected while draft and existing selections survive');
  await submit();await reload();
  await check(`${data}.books.some(b=>b.title==='Full Book' && b.publicationYear===-429 && b.form==='Novel' && b.mode==='Prose' && b.content==='Fiction' && b.authorIds.length===2 && b.themeIds.length===3)`, 'negative year and all fields persist');
  await evaluate(`document.querySelector('[aria-label="View details: Full Book"]').click()`);await wait(`document.querySelector('.book-details')!==null`);
  await check(`document.querySelector('.book-details').textContent.includes('New Browser Theme') && document.querySelector('.book-details').textContent.includes('Prose') && document.querySelector('.book-details').textContent.includes('-429')`, 'details show themes, classifications and year');await close();
  await open('Edit','Full Book');
  await check(`document.querySelector('[name=authorIds]').selectedOptions.length===2 && document.querySelector('[name=themeIds]').selectedOptions.length===3 && !document.querySelector('#include-first-reading')`, 'edit preloads multi-selects and does not add another reading');
  const editId=await evaluate(`${data}.books.find(b=>b.title==='Full Book').id`);
  await fill({title:'Edited Full Book',publicationYear:'',form:'',mode:'',content:''});await choose({authorIds:[],themeIds:[]});await submit();await reload();
  await check(`${data}.books.some(b=>b.id===${editId} && b.title==='Edited Full Book' && b.publicationYear===null && b.form===null && b.mode===null && b.content===null && !b.authorIds.length && !b.themeIds.length)`, 'edit clears selections and optional fields, preserving ID after reload');
  await add();await fill({title:'Invalid Year Book'});await evaluate(`window.beforeWrite=${storage}`);
  for(const year of ['0','2999','1.5']){
    await fill({publicationYear:year});await submit();
    await check(`!!document.querySelector('#error-publicationYear').textContent && ${storage}===window.beforeWrite`, `publication ${year} rejected without writing`);
  }
  await fill({publicationYear:'',newTheme:'Independent Theme'});await createTheme();await close();
  await check(`${data}.themes.some(t=>t.name==='Independent Theme') && !${data}.books.some(b=>b.title==='Invalid Year Book')`, 'explicit theme creation survives canceling book, as disclosed');
  await add();await fill({title:'Wishlist Book'});await click('#include-first-reading');
  await fill({status:'Want to read',priority:'High',recommendedBy:'A friend',notes:'Keep these notes'});
  await evaluate(`window.originalSet=Storage.prototype.setItem;window.writes=0;Storage.prototype.setItem=function(...args){window.writes++;return window.originalSet.apply(this,args)}`);await submit();
  await check(`window.writes===1 && ${data}.readings.some(r=>r.bookId===${data}.books.find(b=>b.title==='Wishlist Book').id && r.status==='Want to read' && r.priority==='High' && r.notes==='Keep these notes')`, 'wishlist book and reading saved atomically in one write');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);await reload();
  await check(`${data}.readings.some(r=>r.recommendedBy==='A friend' && r.priority==='High')`, 'first reading survives reload');
  await add();await fill({title:'Read Book',publicationYear:'2000'});await click('#include-first-reading');await fill({status:'Read',grade:'8.5'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'Read requires year and leaves no partial book');
  await fill({yearRead:'1999'});await submit();
  await check(`!!document.querySelector('#error-yearRead').textContent && ${storage}===window.beforeWrite`, 'first reading cannot precede publication');
  await fill({yearRead:'2025',grade:'8.2'});await submit();
  await check(`!!document.querySelector('#error-grade').textContent && ${storage}===window.beforeWrite`, 'invalid grade leaves no partial book');
  await fill({grade:'8.5',priority:'High'});await submit();
  await check(`!!document.querySelector('#error-priority').textContent && ${storage}===window.beforeWrite`, 'Read rejects wishlist priority without partial writes');
  await fill({priority:''});await submit();await reload();
  await check(`${data}.readings.some(r=>r.bookId===${data}.books.find(b=>b.title==='Read Book').id && r.yearRead===2025 && r.grade===8.5)`, 'Read with year and grade persists');
  await open('Edit','Read Book');await fill({publicationYear:'2026'});await evaluate(`window.beforeWrite=${storage}`);await submit();
  await check(`!!document.querySelector('#error-publicationYear').textContent && ${storage}===window.beforeWrite`, 'editing publication cannot invalidate existing readings');await close();
  await add();await fill({title:'Disabled Reading Book'});await click('#include-first-reading');await fill({status:'Read',grade:'8.2'});await click('#include-first-reading');await submit();
  await check(`${data}.books.some(b=>b.title==='Disabled Reading Book') && !${data}.readings.some(r=>r.bookId===${data}.books.find(b=>b.title==='Disabled Reading Book').id)`, 'unchecked first reading ignores disabled invalid values');
  await add();await fill({title:'Quota Book',newTheme:'Quota Theme'});await evaluate(`window.beforeWrite=${storage};window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}`);await createTheme();
  await check(`document.querySelector('[name=newTheme]').value==='Quota Theme' && document.querySelector('[name=title]').value==='Quota Book' && ${storage}===window.beforeWrite`, 'theme quota failure retains entire draft');
  await fill({newTheme:''});await submit();
  await check(`document.querySelector('[name=title]').value==='Quota Book' && !document.querySelector('[type=submit]').disabled && ${storage}===window.beforeWrite`, 'book quota failure retains input and permits retry');
  await evaluate(`Storage.prototype.setItem=window.originalSet`);await submit();
  await check(`${data}.books.filter(b=>b.title==='Quota Book').length===1`, 'retry after quota failure saves once');
  await open('Delete','Wishlist Book');await evaluate(`window.beforeWrite=${storage}`);
  await check(`document.activeElement.textContent==='Cancel' && document.querySelector('.confirmation-message').textContent.includes('1 reading(s)')`, 'delete confirmation states current reading count and focuses Cancel');
  await click('#form-dialog form button[type=button]');await check(`${storage}===window.beforeWrite`, 'cancel cascade makes no write');
  await open('Delete','Wishlist Book');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(`!document.querySelector('#form-dialog').open`);
  await check(`${storage}===window.beforeWrite && document.activeElement.getAttribute('aria-label')==='Delete Wishlist Book'`, 'Escape cancels cascade and restores trigger focus');
  const deletedBook=await evaluate(`${data}.books.find(b=>b.title==='Wishlist Book').id`);const unrelated=await evaluate(`${data}.readings.filter(r=>r.bookId!==${deletedBook})`);await open('Delete','Wishlist Book');await submit();await reload();
  await check(`!${data}.books.some(b=>b.id===${deletedBook}) && !${data}.readings.some(r=>r.bookId===${deletedBook}) && JSON.stringify(${data}.readings)===JSON.stringify(${JSON.stringify(unrelated)})`, 'confirmed cascade persists and preserves all unrelated readings');
  await open('Delete','Minimal Book');await check(`document.querySelector('.confirmation-message').textContent.includes('0 reading(s)')`, 'zero-reading deletion count correct');await submit();
  await check(`!${data}.books.some(b=>b.title==='Minimal Book')`, 'deletion without readings succeeds');
  await add();await fill({title:'<img src=x onerror=alert(1)>'});await submit();
  await check(`document.querySelector('tbody').textContent.includes('<img src=x onerror=alert(1)>') && !document.querySelector('tbody img')`, 'book titles rendered as safe text');
  await add();await click('#include-first-reading');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await check(`document.querySelector('#form-dialog').contains(document.activeElement)`, 'keyboard focus remains inside dialog');
  const shotDir=process.env.SCREENSHOT_DIR || '/tmp/reading-tracker-fr02-shots';await mkdir(shotDir,{recursive:true});
  for(const width of [1280,390]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    await check(`document.documentElement.scrollWidth<=innerWidth && document.querySelector('#form-dialog').scrollWidth<=document.querySelector('#form-dialog').clientWidth`, `book form and page fit ${width}px`);
    await evaluate(`document.querySelector('#form-dialog').scrollTop=0`);
    const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(`${shotDir}/fr02-book-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  await close();
  // Real second tab: first tab retains the writer lock from the preceding saves.
  const other=await (await fetch(`${endpoint}/json/new?${encodeURIComponent(`${base}/#books`)}`,{method:'PUT'})).json();
  const second=new WebSocket(other.webSocketDebuggerUrl);await new Promise(r=>second.addEventListener('open',r,{once:true}));let otherId=0;
  const otherEval=expression=>new Promise((resolve,reject)=>{const id=++otherId;const listener=e=>{const m=JSON.parse(e.data);if(m.id!==id)return;second.removeEventListener('message',listener);m.result.exceptionDetails?reject(Error(m.result.exceptionDetails.text)):resolve(m.result.result.value)};second.addEventListener('message',listener);second.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}))});
  for(let n=0;n<100;n++){if(await otherEval(`document.querySelector('#preview-button')?.disabled===false`))break;await new Promise(r=>setTimeout(r,50))}
  await otherEval(`document.querySelector('#preview-button').click()`);for(let n=0;n<100;n++){if(await otherEval(`!!document.querySelector('[name=title]')`))break;await new Promise(r=>setTimeout(r,50))}
  await otherEval(`document.querySelector('[name=title]').value='Conflict Book';document.querySelector('#form-dialog form').requestSubmit()`);for(let n=0;n<100;n++){if(await otherEval(`document.querySelector('[data-form-message]')?.hidden===false`))break;await new Promise(r=>setTimeout(r,50))}
  assert.equal(await otherEval(`document.querySelector('[data-form-message]').textContent.includes('Another tab') && document.querySelector('[name=title]').value==='Conflict Book'`),true);checks++;console.log('PASS real second-tab conflict retains book draft');second.close();await fetch(`${endpoint}/json/close/${other.id}`);
  await evaluate(`location.hash='readings'`);await wait(`document.querySelector('[aria-current=page]').dataset.route==='readings'`);
  await check(`document.querySelectorAll('th[aria-sort]').length===5 && document.querySelector('tbody').textContent.includes('Read Book')`, 'new readings appear in sortable history');
  await click('#reset-data');await click('#form-dialog .button-danger');await wait(`document.querySelector('#announcement').textContent.includes('restored')`);
  await check(`${data}.books.length===143 && ${data}.readings.length===143 && ${data}.themes.length===135`, 'reset restores original books, readings and themes');
  assert.deepEqual(exceptions,[],'no uncaught browser exceptions');console.log(`PASS ${++checks} checks; no uncaught browser exceptions`);
} catch (error) {
  await captureBrowserFailure({call, evaluate, error, exceptions});
  throw error;
} finally { ws.close();await fetch(`${endpoint}/json/close/${tab.id}`); }
