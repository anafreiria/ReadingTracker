import { STORAGE_KEY } from './constants.js';
import { TEXT } from './strings.js';
import {
  StoreError, assertRecord, validateLibrary, validateAuthor, validateBook,
  validateReading, validateTheme, prepareReadingTransition,
} from './validation.js';

// Each operation rereads storage; the queue protects concurrent callers in this tab.
let queue = Promise.resolve();
function exclusive(operation) {
  const result = queue.then(operation);
  queue = result.catch(() => {});
  return result;
}

// Coordination pattern: https://github.com/w3c/web-locks/blob/main/EXPLAINER.md
// localStorage does not provide cross-tab transactions. Keep one editing tab
// for this module's lifetime instead of allowing stale tabs to overwrite changes.
// Browsers release this native lock when the page is closed or reloaded.
let writerReady;
async function ensureWriter() {
  if (!globalThis.navigator?.locks?.request) return; // Same-tab queue fallback.
  if (!writerReady) {
    writerReady = new Promise((resolve, reject) => {
      navigator.locks.request(`${STORAGE_KEY}:writer`, {ifAvailable: true}, lock => {
        if (!lock) { resolve(false); return; }
        resolve(true);
        return new Promise(() => {});
      }).catch(reject);
    });
  }
  let acquired;
  try { acquired = await writerReady; }
  catch { writerReady = undefined; throw new StoreError(500, TEXT.storageError); }
  if (!acquired) {
    writerReady = undefined;
    throw new StoreError(409, TEXT.validation.otherEditor);
  }
}

function persist(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { throw new StoreError(500, TEXT.storageError); }
}

async function fetchSeed() {
  let data;
  try {
    const response = await fetch(new URL('../data/seed.json', import.meta.url));
    if (!response.ok) throw new Error('Seed request failed');
    data = await response.json();
  } catch { throw new StoreError(500, TEXT.seedError); }
  return validateLibrary(data);
}

async function loadLibrary() {
  let saved;
  try { saved = localStorage.getItem(STORAGE_KEY); }
  catch { throw new StoreError(500, TEXT.storageError); }
  if (saved !== null) {
    let data;
    try { data = JSON.parse(saved); }
    catch { throw new StoreError(400, TEXT.storageError); }
    return validateLibrary(data);
  }
  await ensureWriter();
  const data = await fetchSeed();
  persist(data);
  return data;
}

function validId(id) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new StoreError(400, TEXT.validation.failed, [{field: 'id', message: TEXT.validation.id}]);
  }
}

function existing(records, id) {
  validId(id);
  const record = records.find(item => item.id === id);
  if (!record) throw new StoreError(404, TEXT.validation.notFound);
  return record;
}

function nextId(records) {
  const id = records.reduce((max, record) => Math.max(max, record.id), 0) + 1;
  if (!Number.isSafeInteger(id)) throw new StoreError(409, TEXT.validation.idLimit);
  return id;
}

function inputCopy(input) {
  assertRecord(input);
  try { return structuredClone(input); }
  catch { throw new StoreError(400, TEXT.validation.failed, [{field: 'record', message: TEXT.validation.record}]); }
}

// The candidate and returned record are detached from storage. A failure before
// setItem changes nothing; a quota failure leaves the previous value intact.
function mutate(operation) {
  return exclusive(async () => {
    await ensureWriter();
    const data = await loadLibrary();
    const result = operation(data);
    persist(data);
    return structuredClone(result);
  });
}

function save(data, collection, input, validate) {
  const previous = input.id === undefined ? null : existing(data[collection], input.id);
  const record = validate(previous ? {...previous, ...input} : input, data);
  if (previous) data[collection][data[collection].indexOf(previous)] = record;
  else { record.id = nextId(data[collection]); data[collection].push(record); }
  return record;
}

// Public reads always return independent records in the official seed shape.
export async function getLibrary() { return exclusive(async () => structuredClone(await loadLibrary())); }
export async function getAuthors() { return (await getLibrary()).authors; }
export async function getBooks() { return (await getLibrary()).books; }
export async function getReadings() { return (await getLibrary()).readings; }
export async function getThemes() { return (await getLibrary()).themes; }
export async function getCountries() { return (await getLibrary()).countries; }
export async function getAuthor(id) { return existing(await getAuthors(), id); }
export async function getBook(id) { return existing(await getBooks(), id); }
export async function getReading(id) { return existing(await getReadings(), id); }
export async function getBookReadings(bookId) {
  const data = await getLibrary();
  existing(data.books, bookId);
  return data.readings.filter(reading => reading.bookId === bookId);
}

export async function saveAuthor(input) {
  const value = inputCopy(input);
  return mutate(data => save(data, 'authors', value, validateAuthor));
}
export async function saveBook(input) {
  const value = inputCopy(input);
  return mutate(data => save(data, 'books', value, validateBook));
}
export async function saveTheme(input) {
  const value = inputCopy(input);
  if (value.id !== undefined) throw new StoreError(400, TEXT.validation.failed, [{field: 'id', message: TEXT.validation.createOnly}]);
  return mutate(data => save(data, 'themes', value, validateTheme));
}

export async function saveReading(input, {confirmFieldClear = false} = {}) {
  const value = inputCopy(input);
  return mutate(data => {
    const previous = value.id === undefined ? null : existing(data.readings, value.id);
    let candidate = previous ? {...previous, ...value} : value;
    if (previous && candidate.status !== previous.status) {
      const transition = prepareReadingTransition(candidate, candidate.status);
      const oldTransition = prepareReadingTransition(previous, candidate.status);
      if ((transition.clearedFields.length || oldTransition.clearedFields.length) && confirmFieldClear !== true) {
        throw new StoreError(409, TEXT.validation.confirmClear);
      }
      candidate = transition.reading;
    }
    return save(data, 'readings', candidate, validateReading);
  });
}

export async function saveBookWithReading(bookInput, readingInput = null) {
  const bookValue = inputCopy(bookInput);
  const readingValue = readingInput === null ? null : inputCopy(readingInput);
  if (bookValue.id !== undefined || readingValue?.id !== undefined) {
    throw new StoreError(400, TEXT.validation.failed, [{field: 'id', message: TEXT.validation.createOnly}]);
  }
  return mutate(data => {
    const book = save(data, 'books', bookValue, validateBook);
    const reading = readingValue === null ? null
      : save(data, 'readings', {...readingValue, bookId: book.id}, validateReading);
    return {book, reading};
  });
}

export async function deleteAuthor(id) {
  return mutate(data => {
    const author = existing(data.authors, id);
    const linked = data.books.filter(book => book.authorIds.includes(id));
    if (linked.length) throw new StoreError(409, TEXT.validation.linkedAuthor(linked.map(book => book.title)));
    data.authors.splice(data.authors.indexOf(author), 1);
  });
}

// UI must confirm and display the current number of readings before calling.
export async function deleteBook(id) {
  return mutate(data => {
    existing(data.books, id);
    const deletedReadings = data.readings.filter(reading => reading.bookId === id).length;
    data.books = data.books.filter(book => book.id !== id);
    data.readings = data.readings.filter(reading => reading.bookId !== id);
    return {deletedReadings};
  });
}

export async function deleteReading(id) {
  return mutate(data => {
    existing(data.readings, id);
    data.readings = data.readings.filter(reading => reading.id !== id);
  });
}

// Confirmation belongs to the UI. Never clear storage before a successful fetch.
export async function resetData() {
  return exclusive(async () => {
    await ensureWriter();
    const seed = await fetchSeed();
    persist(seed);
    return structuredClone(seed);
  });
}
