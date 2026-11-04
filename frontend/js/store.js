import { STORAGE_KEY } from './constants.js';
import { TEXT } from './strings.js';
import { assertLibrary, StoreError } from './validation.js';

let pending;
async function load() {
  let saved;
  try { saved = localStorage.getItem(STORAGE_KEY); }
  catch { throw new StoreError(500, TEXT.storageError); }
  if (saved !== null) {
    let data;
    try { data = JSON.parse(saved); }
    catch { throw new StoreError(400, TEXT.storageError); }
    return assertLibrary(data);
  }
  let data;
  try {
    const response = await fetch(new URL('../data/seed.json', import.meta.url));
    if (!response.ok) throw new Error('Seed request failed');
    data = await response.json();
  } catch { throw new StoreError(500, TEXT.seedError); }
  assertLibrary(data);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { throw new StoreError(500, TEXT.storageError); }
  return data;
}

async function snapshot() {
  // Share the first request across concurrent consumers; allow retry after failure.
  if (!pending) pending = load().catch(error => { pending = undefined; throw error; });
  return structuredClone(await pending);
}

// Public read contract. Pages never access localStorage or fetch directly.
export async function getLibrary() { return snapshot(); }
export async function getAuthors() { return (await snapshot()).authors; }
export async function getBooks() { return (await snapshot()).books; }
export async function getReadings() { return (await snapshot()).readings; }
export async function getThemes() { return (await snapshot()).themes; }
export async function getCountries() { return (await snapshot()).countries; }
export async function getBook(id) {
  const book = (await getBooks()).find(item => item.id === id);
  if (!book) throw new StoreError(404, TEXT.bookNotFound);
  return book;
}
export async function getBookReadings(bookId) {
  await getBook(bookId);
  return (await getReadings()).filter(reading => reading.bookId === bookId);
}
