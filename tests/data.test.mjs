import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STORAGE_KEY } from '../frontend/js/constants.js';
import {
  validateLibrary, validateAuthor, validateBook, validateReading, validateTheme, prepareReadingTransition,
} from '../frontend/js/validation.js';

const seed = JSON.parse(await readFile(new URL('../frontend/data/seed.json', import.meta.url)));
let storage, writes, fetches, failWrite, failFetch, fetched;
beforeEach(() => {
  // Each test represents an independent browser page; do not retain Node native locks.
  Object.defineProperty(globalThis.navigator, 'locks', {configurable: true, value: undefined});
  storage = new Map([[STORAGE_KEY, JSON.stringify(seed)], ['another-app', 'untouched']]);
  writes = 0; fetches = 0; failWrite = false; failFetch = false; fetched = structuredClone(seed);
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { if (failWrite) throw new Error('Quota exceeded'); writes++; storage.set(key, value); },
  };
  globalThis.fetch = async () => {
    fetches++;
    if (failFetch) throw new Error('offline');
    return {ok: true, json: async () => structuredClone(fetched)};
  };
});
const store = () => import(`../frontend/js/store.js?case=${crypto.randomUUID()}`);
const fieldError = field => error => error.status === 400 && error.errors.some(item => item.field === field);
const createReading = overrides => ({bookId: seed.books[0].id, status: 'Read', yearRead: 2026, grade: 0, ...overrides});

test('all official records satisfy domain rules', () => assert.equal(validateLibrary(seed), seed));
test('author dates must be real, nonfuture at birth and strictly ordered', () => {
  for (const birthDate of ['2025-02-29', '2024-13-01', '0000-01-01', '2026-02-30', 'tomorrow']) {
    assert.throws(() => validateAuthor({name: 'New', birthDate}, seed), fieldError('birthDate'));
  }
  assert.throws(() => validateAuthor({name: 'New', birthDate: '2026-01-02'}, seed, {today: '2026-01-01'}), fieldError('birthDate'));
  assert.throws(() => validateAuthor({name: 'New', birthDate: '2000-01-01', deathDate: '2000-01-01'}, seed), fieldError('deathDate'));
  assert.equal(validateAuthor({name: 'New', birthDate: '2024-02-29'}, seed).birthDate, '2024-02-29');
  assert.equal(validateAuthor({name: 'New', deathDate: '2000-01-01'}, seed).birthDate, null);
});
test('author names and theme names are trimmed and unique without case sensitivity', () => {
  assert.throws(() => validateAuthor({name: ` ${seed.authors[0].name.toUpperCase()} `}, seed), {status: 409, errors: []});
  assert.throws(() => validateTheme({name: ` ${seed.themes[0].name.toUpperCase()} `}, seed), {status: 409, errors: []});
  assert.equal(validateAuthor({...seed.authors[0], name: ` ${seed.authors[0].name} `}, seed).name, seed.authors[0].name);
  assert.equal(validateTheme({name: '  New theme  '}, seed).name, 'New theme');
  assert.throws(() => validateAuthor({name: '  '}, seed), fieldError('name'));
});
test('book can contain only a title; IDs and years remain numeric', () => {
  const book = validateBook({title: '  Minimal  '}, seed);
  assert.deepEqual(book, {title: 'Minimal', authorIds: [], publicationYear: null, form: null, mode: null, content: null, themeIds: []});
  assert.equal(validateBook({title: 'Ancient', publicationYear: -429}, seed).publicationYear, -429);
  for (const publicationYear of [0, 9999, 1.5, '2020', NaN, Infinity]) {
    assert.throws(() => validateBook({title: 'Invalid year', publicationYear}, seed), fieldError('publicationYear'));
  }
});
test('foreign IDs, duplicate selections and uncontrolled values are rejected', () => {
  assert.throws(() => validateAuthor({name: 'New', countryId: 99999}, seed), fieldError('countryId'));
  assert.throws(() => validateAuthor({name: 9}, seed), fieldError('name'));
  for (const input of [null, [], 'bad']) assert.throws(() => validateBook(input, seed), {status: 400});
  for (const [field, value] of [['authorIds', [9999]], ['authorIds', [1, 1]], ['themeIds', [1, 1]], ['themeIds', ['1']], ['form', 'Romance'], ['mode', 'Prosa'], ['content', 'Ficção']]) {
    assert.throws(() => validateBook({title: 'Invalid', [field]: value}, seed), fieldError(field));
  }
});
test('reading status, dates, grade and priority enforce allowed combinations', () => {
  assert.throws(() => validateReading(createReading({yearRead: null}), seed), fieldError('yearRead'));
  for (const yearRead of [9999, 1900, 2024.5, '2026']) {
    assert.throws(() => validateReading(createReading({bookId: seed.books.find(b => b.publicationYear === 2021).id, yearRead}), seed), fieldError('yearRead'));
  }
  for (const grade of [-0.5, 10.5, 7.1, '7', NaN, Infinity]) {
    assert.throws(() => validateReading(createReading({grade}), seed), fieldError('grade'));
  }
  assert.equal(validateReading(createReading({grade: 10}), seed).grade, 10);
  assert.equal(validateReading(createReading({status: 'Abandoned', yearRead: null}), seed).grade, 0);
  for (const status of ['Want to read', 'Reading', 'Paused']) {
    assert.throws(() => validateReading(createReading({status}), seed), fieldError('yearRead'));
    assert.throws(() => validateReading(createReading({status, yearRead: null}), seed), fieldError('grade'));
  }
  assert.throws(() => validateReading(createReading({priority: 'High'}), seed), fieldError('priority'));
  assert.throws(() => validateReading(createReading({bookId: 99999}), seed), fieldError('bookId'));
  assert.throws(() => validateReading(createReading({status: 'Unknown'}), seed), fieldError('status'));
});
test('transition planning is pure, handles zero grade and preserves notes', () => {
  const original = createReading({notes: 'Keep', recommendedBy: 'A friend'});
  const result = prepareReadingTransition(original, 'Paused');
  assert.deepEqual(result.clearedFields, ['yearRead', 'grade']);
  assert.equal(result.reading.grade, null); assert.equal(result.reading.notes, 'Keep');
  assert.equal(original.grade, 0); assert.equal(result.reading.recommendedBy, 'A friend');
  const wishlist = prepareReadingTransition({status: 'Want to read', priority: 'High', notes: 'Keep'}, 'Reading');
  assert.equal(wishlist.reading.priority, null); assert.equal(wishlist.reading.notes, 'Keep');
  assert.deepEqual(wishlist.clearedFields, []);
});
test('author CRUD uses highest ID, supports partial edits and survives module reload', async () => {
  const data = structuredClone(seed); data.authors.push({id: 500, name: 'Gap', countryId: null, birthDate: null, deathDate: null});
  storage.set(STORAGE_KEY, JSON.stringify(data));
  const api = await store(); const created = await api.saveAuthor({name: '  New author  '});
  assert.equal(created.id, 501); assert.equal(created.name, 'New author');
  assert.equal((await api.saveAuthor({id: created.id, countryId: 1})).name, 'New author');
  assert.equal((await (await store()).getAuthor(created.id)).countryId, 1);
  await api.deleteAuthor(created.id); await assert.rejects(api.getAuthor(created.id), {status: 404, errors: []});
});
test('linked author conflict names books and makes no write', async () => {
  const api = await store(); const book = seed.books.find(b => b.authorIds.length);
  const before = storage.get(STORAGE_KEY);
  await assert.rejects(api.deleteAuthor(book.authorIds[0]), error => error.status === 409 && error.message.includes(book.title) && error.errors.length === 0);
  assert.equal(storage.get(STORAGE_KEY), before); assert.equal(writes, 0);
});
test('book, theme and reading writes preserve optional values and independent copies', async () => {
  const api = await store(); const theme = await api.saveTheme({name: 'New theme'});
  assert.equal(theme.id, 136);
  const input = {title: 'Test book', authorIds: [1], themeIds: [theme.id]};
  const book = await api.saveBook(input); input.authorIds.push(2); book.authorIds.push(3);
  assert.deepEqual((await api.getBook(book.id)).authorIds, [1]);
  await api.saveBook({id: book.id, publicationYear: -429});
  const reading = await api.saveReading({bookId: book.id, status: 'Abandoned', grade: 0});
  assert.equal(reading.yearRead, null); assert.equal(reading.grade, 0);
  assert.equal((await api.saveReading({id: reading.id, notes: '  Note  '})).notes, 'Note');
  await api.deleteReading(reading.id); assert.equal((await api.getBookReadings(book.id)).length, 0);
});
test('failed combined creation leaves no book, reading or consumed ID', async () => {
  const api = await store(); const before = storage.get(STORAGE_KEY);
  await assert.rejects(api.saveBookWithReading({title: 'Atomic'}, {status: 'Read'}), fieldError('yearRead'));
  assert.equal(storage.get(STORAGE_KEY), before); assert.equal(writes, 0);
  const result = await api.saveBookWithReading({title: 'Atomic'}, {status: 'Read', yearRead: 2026, grade: 8.5});
  assert.equal(result.book.id, 144); assert.equal(result.reading.id, 144);
  assert.equal(result.reading.bookId, result.book.id); assert.equal(writes, 1);
});
test('combined creation accepts no first reading and binds reading to the newly created book', async () => {
  const api = await store(); const only = await api.saveBookWithReading({title: 'Only'});
  assert.equal(only.reading, null);
  const result = await api.saveBookWithReading({title: 'Wishlist'}, {bookId: 99999, status: 'Want to read', priority: 'High'});
  assert.equal(result.reading.bookId, result.book.id);
});
test('book deletion atomically removes all readings of that work', async () => {
  const api = await store();
  const result = await api.saveBookWithReading({title: 'Multiple'}, {status: 'Read', yearRead: 2026});
  await api.saveReading({bookId: result.book.id, status: 'Want to read'});
  const before = writes;
  assert.deepEqual(await api.deleteBook(result.book.id), {deletedReadings: 2});
  assert.equal(writes, before + 1);
  assert.equal((await api.getReadings()).some(r => r.bookId === result.book.id), false);
  await assert.rejects(api.getBook(result.book.id), {status: 404});
});
test('editing book year cannot invalidate an existing reading', async () => {
  const api = await store();
  const {book} = await api.saveBookWithReading({title: 'Old reading'}, {status: 'Read', yearRead: 2020});
  const before = storage.get(STORAGE_KEY);
  await assert.rejects(api.saveBook({id: book.id, publicationYear: 2021}), fieldError('publicationYear'));
  assert.equal(storage.get(STORAGE_KEY), before);
});
test('status-only edit preserves recommendation/notes and clears wishlist priority', async () => {
  const api = await store(); const reading = await api.saveReading({bookId: 1, status: 'Want to read', priority: 'High', recommendedBy: 'Friend', notes: 'Keep'});
  const result = await api.saveReading({id: reading.id, status: 'Reading'});
  assert.equal(result.priority, null); assert.equal(result.notes, 'Keep'); assert.equal(result.recommendedBy, 'Friend');
});
test('incompatible transition requires explicit confirmation even if caller pre-clears fields', async () => {
  const api = await store(); const reading = await api.saveReading(createReading({notes: 'Keep'}));
  const before = storage.get(STORAGE_KEY);
  await assert.rejects(api.saveReading({id: reading.id, status: 'Paused', grade: null, yearRead: null}), {status: 409, errors: []});
  assert.equal(storage.get(STORAGE_KEY), before);
  const result = await api.saveReading({id: reading.id, status: 'Paused'}, {confirmFieldClear: true});
  assert.equal(result.yearRead, null); assert.equal(result.grade, null); assert.equal(result.notes, 'Keep');
});
test('moving to Read still requires a year and re-reading creates a new record', async () => {
  const api = await store(); const old = await api.saveReading({bookId: 1, status: 'Want to read'});
  await assert.rejects(api.saveReading({id: old.id, status: 'Read'}), fieldError('yearRead'));
  await api.saveReading({id: old.id, status: 'Read', yearRead: 2025});
  const again = await api.saveReading({bookId: 1, status: 'Read', yearRead: 2026});
  assert.notEqual(again.id, old.id); assert.equal((await api.getReading(old.id)).yearRead, 2025);
});
test('invalid IDs, missing records and duplicate names never write', async () => {
  const api = await store();
  for (const id of [0, -1, 1.5, '1', null]) await assert.rejects(api.getBook(id), fieldError('id'));
  await assert.rejects(api.saveBook({id: 99999, title: 'Missing'}), {status: 404, errors: []});
  await assert.rejects(api.saveAuthor({name: seed.authors[0].name}), {status: 409});
  await assert.rejects(api.saveTheme({id: 1, name: 'No update'}), fieldError('id'));
  await assert.rejects(api.deleteReading(99999), {status: 404});
  await assert.rejects(api.saveBookWithReading({id: 1, title: 'No update'}), fieldError('id'));
  assert.equal(writes, 0);
});
test('quota failure leaves persisted data and subsequent reads unchanged', async () => {
  const api = await store(); const before = storage.get(STORAGE_KEY); failWrite = true;
  await assert.rejects(api.saveAuthor({name: 'Quota'}), {status: 500});
  assert.equal(storage.get(STORAGE_KEY), before); assert.equal((await api.getAuthors()).length, 101);
  failWrite = false; assert.equal((await api.saveAuthor({name: 'Quota'})).id, 102);
});
test('concurrent operations in one tab do not lose records or reuse IDs', async () => {
  const api = await store();
  const records = await Promise.all(Array.from({length: 6}, (_, i) => api.saveAuthor({name: `Concurrent ${i}`})));
  assert.equal(new Set(records.map(r => r.id)).size, 6); assert.equal((await api.getAuthors()).length, 107);
});
test('every operation rereads external changes instead of overwriting an old snapshot', async () => {
  const api = await store(); await api.getLibrary();
  const external = structuredClone(seed); external.books[0].title = 'Another tab';
  storage.set(STORAGE_KEY, JSON.stringify(external));
  await api.saveAuthor({name: 'After external change'});
  assert.equal((await api.getBooks())[0].title, 'Another tab');
});
test('reset restores exactly the official seed without removing unrelated keys', async () => {
  const api = await store(); await api.saveBook({title: 'Changed'});
  assert.equal(fetches, 0); const before = writes;
  assert.deepEqual(await api.resetData(), seed); assert.equal(writes, before + 1);
  assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)), seed); assert.equal(storage.get('another-app'), 'untouched');
  assert.equal(fetches, 1);
});
test('failed fetch, malformed seed and quota errors during reset preserve all prior data', async () => {
  const api = await store(); await api.saveBook({title: 'Must survive'}); const before = storage.get(STORAGE_KEY);
  failFetch = true; await assert.rejects(api.resetData(), {status: 500});
  failFetch = false; fetched = {books: []}; await assert.rejects(api.resetData(), {status: 400});
  fetched = structuredClone(seed); fetched.readings[0].grade = 10.5;
  await assert.rejects(api.resetData(), fieldError('grade'));
  fetched = structuredClone(seed); failWrite = true; await assert.rejects(api.resetData(), {status: 500});
  assert.equal(storage.get(STORAGE_KEY), before); assert.equal(storage.get('another-app'), 'untouched');
});
test('explicit reset can recover malformed existing storage', async () => {
  storage.set(STORAGE_KEY, '{broken'); const api = await store();
  await assert.rejects(api.getLibrary(), {status: 400});
  await api.resetData(); assert.equal((await api.getBooks()).length, 143);
});

test('native writer lock rejects a second editing tab without changing its data', async () => {
  const held = new Set();
  Object.defineProperty(globalThis.navigator, 'locks', {configurable: true, value: {
    request(name, options, callback) {
      if (held.has(name)) return Promise.resolve(callback(null));
      held.add(name);
      return Promise.resolve(callback({name}));
    },
  }});
  try {
    const first = await store(), second = await store();
    await first.saveAuthor({name: 'Owner tab'});
    const before = storage.get(STORAGE_KEY);
    await assert.rejects(second.saveAuthor({name: 'Other tab'}), {status: 409, errors: []});
    assert.equal(storage.get(STORAGE_KEY), before);
    await first.saveAuthor({name: 'Owner tab again'});
    assert.equal((await first.getAuthors()).length, 103);
  } finally { delete globalThis.navigator.locks; }
});

test('validation errors serialize in the future API format', async () => {
  const api = await store();
  try { await api.saveBook({title: ''}); assert.fail('Invalid book must fail'); }
  catch (error) {
    const serialized = JSON.parse(JSON.stringify(error));
    assert.deepEqual(Object.keys(serialized), ['status', 'message', 'errors']);
    assert.equal(serialized.status, 400);
    assert.equal(serialized.errors[0].field, 'title');
  }
});

test('safe integer ID exhaustion fails without writing', async () => {
  const data = structuredClone(seed);
  data.themes.push({id: Number.MAX_SAFE_INTEGER, name: 'Last ID'});
  storage.set(STORAGE_KEY, JSON.stringify(data)); const before = storage.get(STORAGE_KEY);
  const api = await store();
  await assert.rejects(api.saveTheme({name: 'Overflow'}), {status: 409});
  assert.equal(storage.get(STORAGE_KEY), before); assert.equal(writes, 0);
});
