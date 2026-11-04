import { COLLECTIONS } from './constants.js';
import { TEXT } from './strings.js';

export class StoreError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.name = 'StoreError';
    this.status = status;
    this.errors = errors;
  }
}

// Structural guard for loading, not the domain validation planned for FR-06.
export function assertLibrary(data) {
  const invalid = () => { throw new StoreError(400, TEXT.invalidData); };
  if (!data || typeof data !== 'object') invalid();
  for (const key of COLLECTIONS) {
    if (!Array.isArray(data[key])) invalid();
    const ids = new Set();
    for (const item of data[key]) {
      if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || ids.has(item.id)) invalid();
      ids.add(item.id);
    }
  }
  const has = (collection, id) => data[collection].some(item => item.id === id);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (data.countries.some(c => !text(c.name)) || data.themes.some(t => !text(t.name))) invalid();
  if (data.authors.some(a => !text(a.name) || (a.countryId !== null && !has('countries', a.countryId)))) invalid();
  if (data.books.some(b => !text(b.title) || !Array.isArray(b.authorIds) || !Array.isArray(b.themeIds)
    || b.authorIds.some(id => !has('authors', id)) || b.themeIds.some(id => !has('themes', id)))) invalid();
  if (data.readings.some(r => !has('books', r.bookId) || !text(r.status))) invalid();
  return data;
}
