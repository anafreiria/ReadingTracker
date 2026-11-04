import { STORAGE_KEY } from './constants.js';
import { getLibrary, resetData } from './store.js';
import { TEXT } from './strings.js';
import { el, openDialog, confirmAction } from './ui.js';
import { previewForm } from './forms.js';
import { renderReadings } from './pages/readings.js';
import { renderBooks } from './pages/books.js';
import { renderAuthors } from './pages/authors.js';

const renderers = {readings: renderReadings, books: renderBooks, authors: renderAuthors};
const content = document.getElementById('content');
const preview = document.getElementById('preview-button');
const resetButton = document.getElementById('reset-data');
const announcement = document.getElementById('announcement');
resetButton.textContent = TEXT.reset.action;
let library;
let busy = false;
let refreshAfterDialog = false;
function announce(message, failed = false) {
  announcement.setAttribute('role', failed ? 'alert' : 'status');
  announcement.replaceChildren(el('p', {className: failed ? 'error-panel' : 'notice'}, message));
}
function setBusy(value) {
  busy = value;
  resetButton.disabled = value;
  preview.disabled = value || !library;
  content.setAttribute('aria-busy', String(value));
}
function route() {
  const key = location.hash.slice(1);
  return Object.hasOwn(renderers, key) ? key : 'readings';
}
function render() {
  const area = route(), page = TEXT.pages[area];
  document.title = `${page.title} · ${TEXT.appName}`;
  document.getElementById('page-title').textContent = page.title;
  document.getElementById('page-eyebrow').textContent = page.eyebrow;
  document.getElementById('page-description').textContent = page.description;
  preview.textContent = page.preview;
  preview.disabled = busy || !library;
  for (const link of document.querySelectorAll('[data-route]')) {
    if (link.dataset.route === area) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  if (!library) return;
  const summary = area === 'readings' ? el('div', {className: 'summary-grid'}, [
    ['Read', TEXT.summary.read], ['Paused', TEXT.summary.paused], ['Want to read', TEXT.summary.wishlist],
  ].map(([status, label]) => el('div', {className: 'summary-card'}, [el('span', {className: 'summary-value'}, library.readings.filter(reading => reading.status === status).length), el('span', {}, label)]))) : null;
  content.replaceChildren(...(summary ? [summary] : []), el('section', {className: 'collection-panel', 'aria-label': page.title}, [
    el('div', {className: 'panel-heading'}, [el('h2', {}, page.title), el('span', {className: 'muted'}, `${library[area].length} ${TEXT.counts[area]}`)]), renderers[area](library),
  ]));
}
async function load() {
  library = undefined;
  setBusy(true);
  content.replaceChildren(el('p', {className: 'notice', role: 'status'}, TEXT.loading));
  try { library = await getLibrary(); render(); }
  catch (error) {
    const retry = el('button', {type: 'button'}, TEXT.retry);
    retry.addEventListener('click', load);
    content.replaceChildren(el('section', {className: 'error-panel', role: 'alert'}, [el('h2', {}, TEXT.loadError), el('p', {}, error.message), retry]));
  } finally { setBusy(false); }
}
resetButton.addEventListener('click', async () => {
  if (busy) return;
  const confirmed = await confirmAction({
    title: TEXT.reset.title, message: TEXT.reset.message, confirmLabel: TEXT.reset.confirm,
  });
  if (!confirmed) return;
  setBusy(true);
  announce(TEXT.reset.pending);
  try {
    library = await resetData();
    render();
    announce(TEXT.reset.success);
    announcement.focus();
  } catch (error) {
    announce(error.message, true);
    announcement.focus();
  }
  finally { setBusy(false); }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  if (document.getElementById('form-dialog').open) {
    refreshAfterDialog = true;
    return;
  }
  load();
});
document.getElementById('form-dialog').addEventListener('close', () => {
  if (refreshAfterDialog) {
    refreshAfterDialog = false;
    load();
  }
});
preview.addEventListener('click', () => openDialog(TEXT.pages[route()].preview, previewForm(route(), library)));
document.getElementById('close-dialog').addEventListener('click', () => document.getElementById('form-dialog').close());
window.addEventListener('hashchange', () => {
  document.getElementById('form-dialog').close(); render(); document.getElementById('main').focus();
});
render();
load();
