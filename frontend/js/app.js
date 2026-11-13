import { STORAGE_KEY } from './constants.js';
import { getLibrary, getAuthor, getCountries, getBook, getReading, resetData } from './store.js';
import { TEXT } from './strings.js';
import { el, feedback, openDialog, confirmAction } from './ui.js';
import { readingForm, deleteReadingForm } from './forms/reading-form.js';
import { renderReadings, readingDetails } from './pages/readings.js';
import { bookForm, deleteBookForm } from './forms/book-form.js';
import { renderBooks, bookDetails, bookHistory } from './pages/books.js';
import { authorForm, deleteAuthorForm } from './forms/author-form.js';
import { renderAuthors } from './pages/authors.js';

const renderers = {readings: renderReadings, books: renderBooks, authors: renderAuthors};
const content = document.getElementById('content');
const preview = document.getElementById('preview-button');
const resetButton = document.getElementById('reset-data');
const announcement = document.getElementById('announcement');
const loadingStatus = document.getElementById('loading-status');
resetButton.textContent = TEXT.reset.action;
let library;
let busy = false;
let refreshAfterDialog = false;
let dialogBusy = false;
let dialogOpener;
const dialog = document.getElementById('form-dialog');
const closeDialog = document.getElementById('close-dialog');
function announce(message, failed = false, kind = failed ? 'error' : 'success') {
  announcement.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  announcement.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
  const notice = feedback(message, kind);
  notice.removeAttribute('role'); // The enclosing live region announces this message once.
  announcement.replaceChildren(notice);
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
  preview.textContent = area === 'authors' ? TEXT.authors.add : area === 'books' ? TEXT.books.add : TEXT.readings.add;
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
    el('div', {className: 'panel-heading'}, [el('h2', {}, page.title), el('span', {className: 'muted'}, `${library[area].length} ${TEXT.counts[area]}`)]), renderers[area](library, area === 'authors'
      ? {onEdit: id => openAuthor(id), onDelete: id => openAuthor(id, true)}
      : area === 'books' ? {onEdit: id => openBook(id), onDelete: id => openBook(id, 'delete'), onDetails: id => openBook(id, 'details'),
        onHistory: id => openBook(id, 'history'), onAddReading: bookId => openReading(undefined, 'edit', bookId)} : readingActions()),
  ]));
}
async function load() {
  library = undefined;
  setBusy(true);
  loadingStatus.textContent = `${TEXT.feedback.loading}: ${TEXT.loading}`;
  const pending = feedback(TEXT.loading, 'loading');
  pending.removeAttribute('role'); // loadingStatus is outside aria-busy and owns the announcement.
  content.replaceChildren(pending);
  try { library = await getLibrary(); render(); }
  catch (error) {
    const retry = el('button', {type: 'button'}, TEXT.retry);
    retry.addEventListener('click', load);
    content.replaceChildren(el('section', {className: 'error-panel', role: 'alert'}, [el('h2', {}, TEXT.loadError), el('p', {}, error.message), retry]));
  } finally { loadingStatus.textContent = ''; setBusy(false); }
}
function setDialogBusy(value) {
  dialogBusy = value;
  closeDialog.disabled = value;
  setBusy(value);
}
async function recordSaved(message) {
  setBusy(true);
  refreshAfterDialog = false;
  dialog.close('saved');
  try {
    library = await getLibrary();
    render();
    announce(message);
  } catch {
    announce(TEXT.authors.refreshFailed, true, 'warning');
  } finally {
    setBusy(false);
    announcement.focus();
  }
}
function showRecordDialog(title, body, opener, focusSelector) {
  if (!dialog.open) dialogOpener = opener;
  dialog.returnValue = '';
  openDialog(title, body);
  (focusSelector ? dialog.querySelector(focusSelector) : closeDialog).focus();
}
function readingActions() {
  return {onEdit: id => openReading(id), onDelete: id => openReading(id, 'delete'),
    onDetails: id => openReading(id, 'details'), onAdd: bookId => openReading(undefined, 'edit', bookId)};
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
      onSuccess: () => recordSaved(deleting ? TEXT.authors.deleted : author ? TEXT.authors.updated : TEXT.authors.created),
    };
    showRecordDialog(deleting ? TEXT.authors.deleteTitle : author ? TEXT.authors.editTitle : TEXT.authors.add,
      deleting ? deleteAuthorForm(options) : authorForm(options), opener, deleting ? 'form button' : '[name="name"]');
  } catch (error) {
    announce(error.message, true);
    announcement.focus();
  } finally { setBusy(false); }
}
async function openBook(id, mode = 'edit') {
  if (busy || dialog.open) return;
  const opener = document.activeElement;
  setBusy(true);
  try {
    const book = id === undefined ? null : await getBook(id);
    const data = await getLibrary();
    const deleting = mode === 'delete', details = mode === 'details', history = mode === 'history';
    const options = {book, authors: data.authors, themes: data.themes,
      readingCount: book ? data.readings.filter(reading => reading.bookId === book.id).length : 0,
      onBusy: setDialogBusy, onCancel: () => dialog.close(),
      onSuccess: () => recordSaved(deleting ? TEXT.books.deleted : book ? TEXT.books.updated : TEXT.books.created)};
    showRecordDialog(details || history ? book.title : deleting ? TEXT.books.deleteTitle : book ? TEXT.books.editTitle : TEXT.books.add,
      history ? bookHistory(book, data, readingActions()) : details ? bookDetails(book, data, readingActions())
        : deleting ? deleteBookForm(options) : bookForm(options), opener,
      details || history ? null : deleting ? 'form button' : '[name="title"]');
  } catch (error) {
    announce(error.message, true);
    announcement.focus();
  } finally { setBusy(false); }
}
async function openReading(id, mode = 'edit', bookId = null) {
  if (busy) return;
  const opener = document.activeElement;
  setBusy(true);
  try {
    const reading = id === undefined ? null : await getReading(id);
    const data = await getLibrary();
    const book = reading ? data.books.find(item => item.id === reading.bookId) : null;
    const deleting = mode === 'delete', details = mode === 'details';
    const options = {reading, book, bookId, books: data.books, onBusy: setDialogBusy, onCancel: () => dialog.close(),
      onSuccess: () => recordSaved(deleting ? TEXT.readings.deleted : reading ? TEXT.readings.updated : TEXT.readings.created)};
    showRecordDialog(details ? `${TEXT.readings.detailsTitle} #${reading.id}` : deleting ? TEXT.readings.deleteTitle
      : reading ? TEXT.readings.editTitle : TEXT.readings.add,
      details ? readingDetails(reading, data) : deleting ? deleteReadingForm(options) : readingForm(options),
      opener, details ? null : deleting ? 'form button' : '[name="bookId"]');
  } catch (error) {
    if (dialog.open) {
      const message = el('p', {'data-open-error': '', className: 'error-panel', role: 'alert', tabindex: '-1'}, error.message);
      document.getElementById('dialog-content').querySelector('[data-open-error]')?.remove();
      document.getElementById('dialog-content').prepend(message);
      message.focus();
    } else {
      announce(error.message, true);
      announcement.focus();
    }
  } finally { setBusy(false); }
}
// Keep Tab at the modal boundaries; native dialog still owns Escape and inert background.
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')]
    .filter(control => !control.matches(':disabled') && control.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
dialog.addEventListener('cancel', event => { if (dialogBusy) event.preventDefault(); });
resetButton.addEventListener('click', async () => {
  if (busy) return;
  dialogOpener = document.activeElement;
  const confirmed = await confirmAction({
    title: TEXT.reset.title, message: TEXT.reset.message, confirmLabel: TEXT.reset.confirm,
  });
  if (!confirmed) { setBusy(false); return; }
  setBusy(true);
  announce(TEXT.reset.pending, false, 'loading');
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
  if (dialog.returnValue !== 'saved' && dialogOpener?.isConnected && !dialogOpener.disabled) dialogOpener.focus();
  dialogOpener = undefined;
});
preview.addEventListener('click', () => {
  if (busy || !library) return;
  if (route() === 'authors') openAuthor();
  else if (route() === 'books') openBook();
  else openReading();
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
