import { STORAGE_KEY } from './constants.js';
import { getLibrary, getAuthor, getCountries, resetData } from './store.js';
import { TEXT } from './strings.js';
import { el, openDialog, confirmAction } from './ui.js';
import { previewForm } from './forms.js';
import { renderReadings } from './pages/readings.js';
import { renderBooks } from './pages/books.js';
import { authorForm, deleteAuthorForm } from './forms/author-form.js';
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
let dialogBusy = false;
const dialog = document.getElementById('form-dialog');
const closeDialog = document.getElementById('close-dialog');
function announce(message, failed = false) {
  announcement.setAttribute('role', failed ? 'alert' : 'status');
  announcement.replaceChildren(el('p', {className: failed ? 'error-panel' : 'notice'}, message));
}
function setBusy(value) {
  busy = value;
  resetButton.disabled = value;
  preview.disabled = value || !library;
  content.setAttribute('aria-busy', String(value));
  for (const button of content.querySelectorAll('button')) button.disabled = value;
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
  preview.textContent = area === 'authors' ? TEXT.authors.add : page.preview;
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
    el('div', {className: 'panel-heading'}, [el('h2', {}, page.title), el('span', {className: 'muted'}, `${library[area].length} ${TEXT.counts[area]}`)]), renderers[area](library, {onEdit: id => openAuthor(id), onDelete: id => openAuthor(id, true)}),
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
function setDialogBusy(value) {
  dialogBusy = value;
  closeDialog.disabled = value;
  setBusy(value);
}
async function authorSaved(message) {
  setBusy(true);
  refreshAfterDialog = false;
  dialog.close('saved');
  try {
    library = await getLibrary();
    render();
    announce(message);
  } catch {
    announce(TEXT.authors.refreshFailed, true);
  } finally {
    setBusy(false);
    announcement.focus();
  }
}
async function openAuthor(id, deleting = false) {
  if (busy || dialog.open) return;
  const opener = document.activeElement;
  setBusy(true);
  try {
    const author = id === undefined ? null : await getAuthor(id);
    const countries = deleting ? [] : await getCountries();
    const options = {
      author, countries, onBusy: setDialogBusy,
      onCancel: () => dialog.close(),
      onSuccess: () => authorSaved(deleting ? TEXT.authors.deleted : author ? TEXT.authors.updated : TEXT.authors.created),
    };
    dialog.returnValue = '';
    openDialog(deleting ? TEXT.authors.deleteTitle : author ? TEXT.authors.editTitle : TEXT.authors.add,
      deleting ? deleteAuthorForm(options) : authorForm(options));
    dialog.querySelector(deleting ? 'form button' : '[name="name"]').focus();
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'saved' && opener?.isConnected && !opener.disabled) opener.focus();
    }, {once: true});
  } catch (error) {
    announce(error.message, true);
    announcement.focus();
  } finally { setBusy(false); }
}
dialog.addEventListener('cancel', event => { if (dialogBusy) event.preventDefault(); });
resetButton.addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  const confirmed = await confirmAction({
    title: TEXT.reset.title, message: TEXT.reset.message, confirmLabel: TEXT.reset.confirm,
  });
  if (!confirmed) { setBusy(false); return; }
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
preview.addEventListener('click', () => {
  if (busy || !library) return;
  if (route() === 'authors') openAuthor();
  else openDialog(TEXT.pages[route()].preview, previewForm(route(), library));
});
closeDialog.addEventListener('click', () => { if (!dialogBusy) dialog.close(); });
window.addEventListener('hashchange', () => {
  if (!dialogBusy) dialog.close();
  render();
  if (busy) setBusy(true);
  if (!dialog.open) document.getElementById('main').focus();
});
render();
load();
