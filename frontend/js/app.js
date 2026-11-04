import { getLibrary } from './store.js';
import { TEXT } from './strings.js';
import { el, openDialog } from './ui.js';
import { previewForm } from './forms.js';
import { renderReadings } from './pages/readings.js';
import { renderBooks } from './pages/books.js';
import { renderAuthors } from './pages/authors.js';

const renderers = {readings: renderReadings, books: renderBooks, authors: renderAuthors};
const content = document.getElementById('content');
const preview = document.getElementById('preview-button');
let library;
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
  preview.disabled = !library;
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
  content.setAttribute('aria-busy', 'true');
  content.replaceChildren(el('p', {className: 'notice', role: 'status'}, TEXT.loading));
  try { library = await getLibrary(); render(); }
  catch (error) {
    const retry = el('button', {type: 'button'}, TEXT.retry);
    retry.addEventListener('click', load);
    content.replaceChildren(el('section', {className: 'error-panel', role: 'alert'}, [el('h2', {}, TEXT.loadError), el('p', {}, error.message), retry]));
  } finally { content.setAttribute('aria-busy', 'false'); }
}
preview.addEventListener('click', () => openDialog(TEXT.pages[route()].preview, previewForm(route(), library)));
document.getElementById('close-dialog').addEventListener('click', () => document.getElementById('form-dialog').close());
window.addEventListener('hashchange', () => {
  document.getElementById('form-dialog').close(); render(); document.getElementById('main').focus();
});
render();
load();
