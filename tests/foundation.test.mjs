import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sortReadings } from '../frontend/js/pages/readings.js';
import { assertLibrary } from '../frontend/js/validation.js';
import { STORAGE_KEY } from '../frontend/js/constants.js';

const seed = JSON.parse(await readFile(new URL('../frontend/data/seed.json', import.meta.url)));
let storage, requests, requestFailure;
beforeEach(() => {
  storage = new Map(); requests = 0; requestFailure = false;
  globalThis.localStorage = {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)};
  globalThis.fetch = async () => {
    requests++;
    if (requestFailure) throw new Error('offline');
    return {ok: true, json: async () => structuredClone(seed)};
  };
});
const store = () => import(`../frontend/js/store.js?test=${crypto.randomUUID()}`);

test('official seed has complete reference integrity and remains unchanged', async () => {
  assert.equal(assertLibrary(seed), seed);
  assert.equal(seed.books.length, 143);
  assert.equal(seed.themes.length, 135);
  const original = await readFile(new URL('../materiais/seed.json', import.meta.url));
  assert.deepEqual(await readFile(new URL('../frontend/data/seed.json', import.meta.url)), original);
});
test('first use shares one fetch across consumers, persists the seed and returns isolated copies', async () => {
  const api = await store();
  const [books, authors] = await Promise.all([api.getBooks(), api.getAuthors()]);
  assert.equal(requests, 1); assert.equal(authors.length, 101);
  assert.deepEqual(JSON.parse(storage.get(STORAGE_KEY)), seed);
  books[0].title = 'Changed outside store';
  assert.notEqual((await api.getBooks())[0].title, books[0].title);
});
test('later visits keep stored changes and never fetch seed again', async () => {
  const changed = structuredClone(seed); changed.books[0].title = 'Saved title';
  storage.set(STORAGE_KEY, JSON.stringify(changed));
  const api = await store();
  assert.equal((await api.getBooks())[0].title, 'Saved title'); assert.equal(requests, 0);
});
test('malformed saved data is preserved instead of silently replaced', async () => {
  storage.set(STORAGE_KEY, '{broken');
  const api = await store();
  await assert.rejects(api.getBooks(), {status: 400});
  assert.equal(storage.get(STORAGE_KEY), '{broken'); assert.equal(requests, 0);
});
test('failed first load can be retried and does not write data', async () => {
  requestFailure = true; const api = await store();
  await assert.rejects(api.getBooks(), {status: 500}); assert.equal(storage.size, 0);
  requestFailure = false; assert.equal((await api.getBooks()).length, 143); assert.equal(requests, 2);
});
test('storage failure is visible and unrelated keys survive initialization', async () => {
  storage.set('other-app', 'keep'); const api = await store();
  await api.getLibrary(); assert.equal(storage.get('other-app'), 'keep');
  globalThis.localStorage.getItem = () => { throw new Error('denied'); };
  await assert.rejects((await store()).getLibrary(), {status: 500});
});
test('invalid references and duplicate IDs are rejected before use', () => {
  const bad = structuredClone(seed); bad.readings[0].bookId = 99999;
  assert.throws(() => assertLibrary(bad), {status: 400});
  const duplicate = structuredClone(seed); duplicate.books[1].id = duplicate.books[0].id;
  assert.throws(() => assertLibrary(duplicate), {status: 400});
});
test('book history follows bookId instead of matching reading IDs', async () => {
  const data = structuredClone(seed); data.readings[1].bookId = data.books[0].id;
  storage.set(STORAGE_KEY, JSON.stringify(data)); const api = await store();
  assert.equal((await api.getBookReadings(data.books[0].id)).length, 2);
  await assert.rejects(api.getBook(99999), {status: 404});
});
test('default history sorts newest first, missing last and ties by ID', () => {
  const rows = [{id: 4, yearRead: null}, {id: 3, yearRead: 2025}, {id: 2, yearRead: 2026}, {id: 1, yearRead: 2026}];
  assert.deepEqual(sortReadings(rows).map(r => r.id), [1, 2, 3, 4]);
  assert.deepEqual(sortReadings(rows, 'yearRead', 'asc').map(r => r.id), [3, 1, 2, 4]);
  assert.deepEqual(rows.map(r => r.id), [4, 3, 2, 1]);
});
test('text sorting ignores case and keeps blanks last in either direction', () => {
  const rows = [{id: 1, title: ''}, {id: 2, title: 'alpha'}, {id: 3, title: 'Beta'}, {id: 4, title: null}];
  assert.deepEqual(sortReadings(rows, 'title', 'asc').map(r => r.id), [2, 3, 1, 4]);
  assert.deepEqual(sortReadings(rows, 'title', 'desc').map(r => r.id), [3, 2, 1, 4]);
});
