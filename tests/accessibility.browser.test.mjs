// FR-UI-02 checks in an isolated Chrome profile. No certification or screen-reader claim.
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
  const result=await evaluate(expression);
  if(!result) console.log('Active element:',await evaluate('document.activeElement.outerHTML.slice(0,400)'));
  assert.equal(result, true, label);
  checks++;
  console.log(`PASS ${label}`);
};
const directory = process.env.SCREENSHOT_DIR || '/tmp/reading-tracker-fr-ui-02';
const storage = `localStorage.getItem('reading-tracker:data:v1')`;
const data = `JSON.parse(${storage})`;
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const frame = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
async function key(key, code, windowsVirtualKeyCode, modifiers = 0) {
  await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});
  await frame();
}
const escape = async () => { await key('Escape','Escape',27); await wait(`!document.querySelector('#form-dialog').open`); };
async function route(name) {
  await evaluate(`location.hash=${JSON.stringify(name)}`);
  await wait(`document.querySelector('[aria-current=page]')?.dataset.route===${JSON.stringify(name)} && document.querySelector('#content').getAttribute('aria-busy')==='false'`);
}
async function open() {
  await evaluate(`document.querySelector('#preview-button').focus()`);
  await key('Enter','Enter',13);
  await wait(`document.querySelector('#form-dialog').open`);
}
async function screenshot(name) {
  const shot=await call('Page.captureScreenshot',{format:'png'});
  await writeFile(`${directory}/${name}.png`,Buffer.from(shot.data,'base64'));
}
const ready = () => wait(`document.querySelector('#content')?.getAttribute('aria-busy')==='false'`);
const submit = async () => {
  await evaluate(`document.querySelector('#form-dialog form').requestSubmit()`);
  await wait(`!document.querySelector('#form-dialog').open || document.querySelector('#form-dialog form').getAttribute('aria-busy')!=='true'`);
};
let pausedSeed, interceptSeed = false;
const intercept = event => {
  const message=JSON.parse(event.data);
  if(message.method==='Fetch.requestPaused') {
    if(interceptSeed) pausedSeed=message.params.requestId;
    else call('Fetch.continueRequest',{requestId:message.params.requestId}).catch(()=>{});
  }
};
try {
  await mkdir(directory,{recursive:true});
  await call('Runtime.enable'); await call('Page.enable'); await call('Page.bringToFront');
  await call('Page.navigate',{url:`${base}/#authors`}); await ready();
  await evaluate(`import('./js/store.js').then(store=>store.resetData())`);
  await call('Page.reload'); await ready();
  // Standard sRGB relative luminance; record computed foreground/background pairs.
  await evaluate(`window.contrastPairs=[]; window.measureContrast=()=>{
    const rgb=c=>c.match(/[\\d.]+/g).slice(0,3).map(Number);
    const luminance=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const background=node=>{for(let e=node;e;e=e.parentElement){const c=getComputedStyle(e).backgroundColor;if(!c.endsWith(', 0)')&&c!=='transparent')return c;}return 'rgb(255, 255, 255)';};
    const measure=(fg,bg,minimum,kind)=>{const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);const entry={kind,fg,bg,ratio,minimum};if(!contrastPairs.some(p=>p.kind===kind&&p.fg===fg&&p.bg===bg))contrastPairs.push(entry);return ratio>=minimum;};
    const text=[...document.querySelectorAll('.muted,.description,.eyebrow,th,.badge,.feedback,button,label,.field-error,.site-header nav a')].filter(e=>e.getClientRects().length&&e.textContent.trim()&&!e.closest(':disabled'));
    const results=text.map(e=>{const s=getComputedStyle(e),large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);return measure(s.color,background(e),large?3:4.5,'text');});
    for(const e of document.querySelectorAll('.field input:not([type=checkbox]),.field select,.field textarea')) {if(!e.getClientRects().length)continue;const s=getComputedStyle(e);results.push(measure(s.borderTopColor,background(e),3,'control border'));}
    const focus=getComputedStyle(document.documentElement).getPropertyValue('--focus').trim();
    const sample=document.createElement('span');sample.style.color=focus;document.body.append(sample);const color=getComputedStyle(sample).color;sample.remove();
    results.push(measure(color,'rgb(255, 255, 255)',3,'focus'),measure(color,'rgb(248, 247, 243)',3,'focus'));
    return results.every(Boolean);
  }`);
  for(const width of [390,1280]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for(const name of ['authors','books','readings']) {
      await route(name);
      await check(`measureContrast()`,`${name}: measured text/focus contrast at ${width}px`);
      await check(`[...document.querySelectorAll('button:not(:disabled),nav a')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`,`${name}: action targets at least 44x44 at ${width}px`);
      await evaluate('scrollTo(0,0)'); await screenshot(`after-${name}-${width}`);
      await open();
      await check(`[...document.querySelectorAll('#form-dialog input,#form-dialog select,#form-dialog textarea')].every(e=>e.labels?.length>0) && [...document.querySelectorAll('#form-dialog button')].every(e=>e.textContent.trim()||e.getAttribute('aria-label'))`,`${name}: fields labelled and buttons named at ${width}px`);
      const ax = await call('Accessibility.getFullAXTree');
      const unnamed=ax.nodes.filter(n=>!n.ignored&&['button','textbox','combobox','checkbox'].includes(n.role?.value)&&!n.name?.value?.trim());
      assert.equal(unnamed.length,0,`${name}: AX controls have accessible names`);checks++;
      await check(`measureContrast()`,`${name}: form text and control borders meet contrast at ${width}px`);
      await check(`[...document.querySelectorAll('#form-dialog button,#form-dialog .checkbox-label')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44})`,`${name}: form action and checkbox label targets at ${width}px`);
      // Modal boundary in both directions: Close is first, submit is last.
      await evaluate(`document.querySelector('#close-dialog').focus()`);
      await key('Tab','Tab',9,8);
      await check(`document.activeElement.type==='submit'`,`${name}: Shift+Tab wraps inside modal`);
      await key('Tab','Tab',9);
      await check(`document.activeElement.id==='close-dialog' && document.activeElement.matches(':focus-visible')`,`${name}: Tab wraps to visible Close focus`);
      await check(`(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),s=getComputedStyle(e),pad=Math.max(0,parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset));for(let p=e.parentElement;p;p=p.parentElement){const st=getComputedStyle(p);if(['auto','scroll','hidden','clip'].includes(st.overflowY)){const b=p.getBoundingClientRect();if(r.top-pad<b.top||r.bottom+pad>b.bottom||r.left-pad<b.left||r.right+pad>b.right)return false;}}return r.top-pad>=0&&r.bottom+pad<=innerHeight})()`,`${name}: Close focus ring stays inside scroll clips at ${width}px`);
      await screenshot(`after-${name}-form-${width}`);
      await escape();
      await check(`document.activeElement.id==='preview-button'`,`${name}: Escape restores opener at ${width}px`);
    }
  }
  // Keyboard-only route activation, invalid submit, correction and success after persistence.
  await evaluate(`document.querySelector('[data-route=authors]').focus()`); await key('Enter','Enter',13);
  await wait(`document.querySelector('[aria-current=page]').dataset.route==='authors'`);
  await evaluate(`document.querySelector('#main').focus()`); await key('Tab','Tab',9);
  await check(`document.activeElement.id==='preview-button'`,'Tab from main reaches Add author');
  await key('Enter','Enter',13); await wait(`document.querySelector('#form-dialog').open`);
  await key('Enter','Enter',13);
  await wait(`document.querySelector('#error-name')?.textContent`);
  await check(`document.activeElement.name==='name' && document.activeElement.getAttribute('aria-invalid')==='true' && document.activeElement.getAttribute('aria-describedby').split(' ').includes('error-name') && document.querySelector('#error-name').textContent.includes('Name:')`,'invalid keyboard submit names and associates error; focuses field');
  await call('Input.insertText',{text:'Accessible keyboard author'}); await key('Enter','Enter',13);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`${data}.authors.some(a=>a.name==='Accessible keyboard author') && document.querySelector('#announcement .feedback-success')?.textContent.startsWith('Saved:')`,'keyboard correction persists before success feedback');
  // Reset cancellation must return focus to Reset, including native modal resolution.
  await evaluate(`document.querySelector('#reset-data').focus()`); await key('Enter','Enter',13);
  await wait(`document.querySelector('#form-dialog').open`); await key('Enter','Enter',13);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`document.activeElement.id==='reset-data' && ${data}.authors.some(a=>a.name==='Accessible keyboard author')`,'Cancel reset returns focus and preserves saved data');
  await route('books'); await open();
  await evaluate(`document.querySelector('[name=title]').value='Grouped field check';var c=document.querySelector('input[name=authorIds]');c.value='999999';c.checked=true`);
  await submit();
  await check(`document.querySelector('[data-field=authorIds]').getAttribute('aria-invalid')==='true' && document.querySelector('#error-authorIds').textContent.includes('Authors:') && [...document.querySelectorAll('input[name=authorIds]')].every(e=>e.getAttribute('aria-describedby').includes('error-authorIds')) && document.activeElement.closest('[data-field=authorIds]')!==null`,'group error names Authors, associates checkboxes and moves focus');
  await evaluate(`var c=document.querySelector('input[name=authorIds]');c.value='1';c.checked=false;document.querySelector('[name=title]').value='Retry accessible book';window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')}`);
  await submit();
  await check(`document.querySelector('[name=title]').value==='Retry accessible book' && document.querySelector('[data-form-message]').getAttribute('role')==='alert' && document.querySelector('[data-form-message]').textContent.startsWith('Unable to complete:') && !document.querySelector('#announcement').textContent.includes('Book added') && !document.querySelector('[type=submit]').disabled`,'quota failure preserves draft, permits retry and announces no false success');
  await evaluate(`Storage.prototype.setItem=window.originalSet;window.writes=0;Storage.prototype.setItem=function(...args){writes++;return originalSet.apply(this,args)};const f=document.querySelector('#form-dialog form');f.requestSubmit();f.requestSubmit();window.pendingVerified=document.querySelector('#dialog-progress').textContent.startsWith('Working:')&&f.getAttribute('aria-busy')==='true'&&!f.querySelector('.feedback-loading').hidden&&f.querySelector('.feedback-loading').textContent.startsWith('Working:')&&f.querySelector('[type=submit]').disabled`);
  await wait(`!document.querySelector('#form-dialog').open`);
  await check(`window.pendingVerified && window.writes===1 && ${data}.books.filter(b=>b.title==='Retry accessible book').length===1 && !!document.querySelector('#announcement .feedback-success')`,'retry shows pending feedback, prevents duplicate save and persists once');
  await evaluate('Storage.prototype.setItem=window.originalSet');
  await open();
  await evaluate(`document.querySelector('[name=title]').value='Long theme draft';document.querySelector('[name=newTheme]').value='LongTheme'.repeat(35)`);
  await click('#form-dialog section button');
  await wait(`document.querySelector('[name=newTheme]').value==='' && document.querySelector('#form-dialog form').getAttribute('aria-busy')!=='true'`);
  await check(`(()=>{const label=[...document.querySelectorAll('input[name=themeIds]')].at(-1).closest('label');return label.textContent==='LongTheme'.repeat(35)&&label.querySelector('input').checked&&label.scrollWidth<=label.clientWidth&&document.querySelector('[name=title]').value==='Long theme draft'})()`,'long theme wraps, stays selected and preserves book draft');
  await escape();
  // Sample the helper's four distinguishable kinds; all use text plus presentation/roles.
  await evaluate(`(async()=>{const ui=await import('./js/ui.js');window.samples=document.createElement('section');for(const kind of ['success','warning','error','loading'])samples.append(ui.feedback('Sample message',kind));for(const status of ['Read','Reading','Paused','Want to read','Abandoned'])samples.append(ui.badge(status));document.body.append(samples)})()`);
  await check(`new Set([...samples.querySelectorAll('.feedback')].map(e=>e.querySelector('strong').textContent)).size===4 && samples.querySelector('.feedback-error').getAttribute('role')==='alert' && [...samples.querySelectorAll('.feedback')].filter(e=>!e.classList.contains('feedback-error')).every(e=>e.getAttribute('role')==='status') && measureContrast() && document.querySelectorAll('#announcement [role]').length===0`,'feedback kinds have distinct text, live roles and measured contrast');
  const contrasts=await evaluate('contrastPairs'); await writeFile(`${directory}/contrast.json`,JSON.stringify(contrasts,null,2));
  await evaluate('samples.remove()');
  // A read failure cannot replace existing data. Retry restores the same snapshot.
  const persisted=await evaluate(storage);
  const injection=await call('Page.addScriptToEvaluateOnNewDocument',{source:`window.originalGet=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='reading-tracker:data:v1')throw new DOMException('Denied','SecurityError');return originalGet.call(this,key)}`});
  await call('Page.reload'); await wait(`document.querySelector('#content [role=alert]')`);
  await check(`document.querySelector('#content').textContent.includes('kept') && document.querySelector('#content button').textContent==='Try again' && window.originalGet.call(localStorage,'reading-tracker:data:v1')===${JSON.stringify(persisted)}`,'storage read failure offers retry and leaves existing bytes unchanged');
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
  await evaluate('Storage.prototype.getItem=window.originalGet'); await click('#content button'); await ready();
  await check(`${storage}===${JSON.stringify(persisted)} && !!document.querySelector('tbody')`,'read retry recovers without replacing saved data');
  // Empty views keep a meaningful Add action.
  await evaluate(`const d=JSON.parse(${storage});d.authors=[];d.books=[];d.readings=[];localStorage.setItem('reading-tracker:data:v1',JSON.stringify(d))`);
  await call('Page.reload'); await ready();
  for(const name of ['authors','books','readings']) {
    await route(name);
    await check(`document.querySelector('.empty-state').textContent.includes('Add button') && !document.querySelector('#preview-button').disabled`,`${name}: empty view explains Add action`);
  }
  // Hold the first-use seed request to examine loading, then fail and retry.
  await evaluate(`localStorage.removeItem('reading-tracker:data:v1')`);
  ws.addEventListener('message',intercept); interceptSeed=true;
  await call('Fetch.enable',{patterns:[{urlPattern:'*data/seed.json',requestStage:'Request'}]});
  await call('Page.reload');
  for(let n=0;n<100&&!pausedSeed;n++)await new Promise(r=>setTimeout(r,30));
  assert.ok(pausedSeed,'seed request paused');
  await check(`document.querySelector('#content').getAttribute('aria-busy')==='true' && document.querySelector('#content .feedback-loading').textContent.startsWith('Working:') && document.querySelector('#preview-button').disabled && document.querySelector('#loading-status').textContent.startsWith('Working:') && !document.querySelector('#content').contains(document.querySelector('#loading-status'))`,'loading state announces work and disables actions');
  await screenshot('loading-1280');
  await call('Fetch.failRequest',{requestId:pausedSeed,errorReason:'Failed'});
  await wait(`document.querySelector('#content [role=alert]')`);
  await check(`${storage}===null && document.querySelector('#content button').textContent==='Try again'`,'failed seed offers retry without writing an empty library');
  await screenshot('seed-error-1280');
  interceptSeed=false; await call('Fetch.disable'); ws.removeEventListener('message',intercept);
  await click('#content button'); await ready();
  await check(`${data}.books.length===143`,'seed retry restores official library');
  // Real Chrome browser zoom via its profile preference, in a privileged Settings tab.
  await call('Emulation.clearDeviceMetricsOverride');
  const {windowId}=await call('Browser.getWindowForTarget',{targetId:tab.id});
  await call('Browser.setWindowBounds',{windowId,bounds:{width:1280,height:1000}});
  await call('Page.navigate',{url:'chrome://settings/appearance'});
  await wait(`typeof chrome.settingsPrivate?.setDefaultZoom==='function'`);
  await evaluate(`new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(2,resolve))`);
  await call('Page.navigate',{url:`${base}/#books`}); await ready();
  await check(`devicePixelRatio>=1.99 && devicePixelRatio<=2.01 && innerWidth<=650`,'Chrome browser zoom is actually 200% (DPR and CSS viewport checked)');
  for(const name of ['books','authors','readings']) {
    await route(name);
    await check(`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('tbody tr:first-child button')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})`,`${name}: controls available at browser zoom 200%`);
    await open();
    await evaluate(`document.querySelector('#form-dialog [type=submit]').focus()`);
    await check(`(()=>{const d=document.querySelector('#form-dialog'),r=document.activeElement.getBoundingClientRect();return d.scrollWidth<=d.clientWidth&&r.top>=0&&r.bottom<=innerHeight})()`,`${name}: long form Save reachable at browser zoom 200%`);
    await screenshot(`zoom-200-${name}`); await escape();
  }
  await call('Page.navigate',{url:'chrome://settings/appearance'});
  await wait(`typeof chrome.settingsPrivate?.setDefaultZoom==='function'`);
  await evaluate(`new Promise(resolve=>chrome.settingsPrivate.setDefaultZoom(1,resolve))`);
  assert.deepEqual(exceptions,[],'no uncaught application exceptions');
  console.log(`PASS ${++checks} accessibility checks; no uncaught application exceptions`);
} catch(error) {
  await captureBrowserFailure({call,evaluate,error,exceptions}); throw error;
} finally { ws.close(); await fetch(`${endpoint}/json/close/${tab.id}`); }
