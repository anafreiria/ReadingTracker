import { COLLECTIONS, VALUES } from './constants.js';
import { TEXT } from './strings.js';

export class StoreError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.name = 'StoreError';
    this.status = status;
    this.errors = errors;
  }

  toJSON() {
    return {status: this.status, message: this.message, errors: this.errors};
  }
}

// Structural guard runs before domain checks so malformed storage produces a recoverable error.
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


const M = TEXT.validation;
const absent = value => value === null || value === undefined || value === '';
const normalizedName = value => value.trim().toLocaleLowerCase('en-US');

export function assertRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new StoreError(400, M.failed, [{field: 'record', message: M.record}]);
  }
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function checker() {
  const errors = [];
  const add = (field, message) => errors.push({field, message});
  return {
    add,
    finish(value) { if (errors.length) throw new StoreError(400, M.failed, errors); return value; },
    text(field, value, required = false) {
      if (absent(value)) { if (required) add(field, M.required); return null; }
      if (typeof value !== 'string') { add(field, M.text); return null; }
      const result = value.trim();
      if (!result && required) add(field, M.required);
      return result || null;
    },
    integer(field, value) {
      if (absent(value)) return null;
      if (!Number.isSafeInteger(value)) { add(field, M.integer); return null; }
      return value;
    },
    choice(field, value, choices, required = false) {
      if (absent(value)) { if (required) add(field, M.required); return null; }
      if (!choices.includes(value)) { add(field, M.selection); return null; }
      return value;
    },
    reference(field, value, records, required = false) {
      if (absent(value)) { if (required) add(field, M.required); return null; }
      if (!Number.isSafeInteger(value) || !records.some(record => record.id === value)) add(field, M.reference);
      return value;
    },
    references(field, value, records) {
      if (value === undefined || value === null) return [];
      if (!Array.isArray(value)) { add(field, M.list); return []; }
      if (new Set(value).size !== value.length || value.some(id => !Number.isSafeInteger(id) || !records.some(record => record.id === id))) add(field, M.list);
      return [...value];
    },
    date(field, value) {
      if (absent(value)) return null;
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) { add(field, M.date); return null; }
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value.startsWith('0000')) {
        add(field, M.date); return null;
      }
      return value;
    },
  };
}

function identity(input, check) {
  if (input.id === undefined) return {};
  if (!Number.isSafeInteger(input.id) || input.id < 1) check.add('id', M.id);
  return {id: input.id};
}

export function validateAuthor(input, data, {today = localToday()} = {}) {
  assertRecord(input);
  const check = checker();
  const author = {
    ...identity(input, check), name: check.text('name', input.name, true),
    countryId: check.reference('countryId', input.countryId, data.countries),
    birthDate: check.date('birthDate', input.birthDate), deathDate: check.date('deathDate', input.deathDate),
  };
  if (author.birthDate && author.birthDate > today) check.add('birthDate', M.futureBirth);
  if (author.deathDate && author.birthDate && author.deathDate <= author.birthDate) check.add('deathDate', M.death);
  check.finish(author);
  if (data.authors.some(other => other.id !== author.id && normalizedName(other.name) === normalizedName(author.name))) {
    throw new StoreError(409, M.duplicateAuthor);
  }
  return author;
}

export function validateTheme(input, data) {
  assertRecord(input);
  const check = checker();
  const theme = {...identity(input, check), name: check.text('name', input.name, true)};
  check.finish(theme);
  if (data.themes.some(other => other.id !== theme.id && normalizedName(other.name) === normalizedName(theme.name))) {
    throw new StoreError(409, M.duplicateTheme);
  }
  return theme;
}

export function validateBook(input, data, {year = new Date().getFullYear()} = {}) {
  assertRecord(input);
  const check = checker();
  const book = {
    ...identity(input, check), title: check.text('title', input.title, true),
    authorIds: check.references('authorIds', input.authorIds, data.authors),
    publicationYear: check.integer('publicationYear', input.publicationYear),
    form: check.choice('form', input.form, VALUES.forms), mode: check.choice('mode', input.mode, VALUES.modes),
    content: check.choice('content', input.content, VALUES.contents),
    themeIds: check.references('themeIds', input.themeIds, data.themes),
  };
  if (book.publicationYear !== null && (book.publicationYear === 0 || book.publicationYear > year)) check.add('publicationYear', M.publication);
  if (book.id && book.publicationYear !== null && data.readings.some(reading => reading.bookId === book.id && reading.yearRead !== null && reading.yearRead < book.publicationYear)) check.add('publicationYear', M.existingReadings);
  return check.finish(book);
}

export function validateReading(input, data, {year = new Date().getFullYear()} = {}) {
  assertRecord(input);
  const check = checker();
  const reading = {
    ...identity(input, check), bookId: check.reference('bookId', input.bookId, data.books, true),
    status: check.choice('status', input.status, VALUES.statuses, true),
    yearRead: check.integer('yearRead', input.yearRead), grade: absent(input.grade) ? null : input.grade,
    recommendedBy: check.text('recommendedBy', input.recommendedBy),
    priority: check.choice('priority', input.priority, VALUES.priorities), notes: check.text('notes', input.notes),
  };
  const allowsResult = ['Read', 'Abandoned'].includes(reading.status);
  if (reading.status === 'Read' && reading.yearRead === null) check.add('yearRead', M.requiredYear);
  if (!allowsResult && reading.yearRead !== null) check.add('yearRead', M.noYear);
  const book = data.books.find(item => item.id === reading.bookId);
  if (reading.yearRead !== null && (reading.yearRead > year || (book?.publicationYear !== null && book?.publicationYear !== undefined && reading.yearRead < book.publicationYear))) check.add('yearRead', M.yearRead);
  if (reading.grade !== null) {
    if (!allowsResult) check.add('grade', M.noGrade);
    if (typeof reading.grade !== 'number' || !Number.isFinite(reading.grade) || reading.grade < 0 || reading.grade > 10 || !Number.isInteger(reading.grade * 2)) check.add('grade', M.grade);
  }
  if (reading.status !== 'Want to read' && reading.priority !== null) check.add('priority', M.priority);
  return check.finish(reading);
}

// No persistence or dialog: callers inspect clearedFields and ask the user before saving.
export function prepareReadingTransition(input, status) {
  assertRecord(input);
  if (!VALUES.statuses.includes(status)) throw new StoreError(400, M.failed, [{field: 'status', message: M.selection}]);
  const reading = {...input, status};
  const clearedFields = [];
  if (status !== 'Want to read') reading.priority = null;
  if (!['Read', 'Abandoned'].includes(status)) {
    for (const field of ['yearRead', 'grade']) {
      if (!absent(reading[field])) clearedFields.push(field);
      reading[field] = null;
    }
  }
  return {reading, clearedFields};
}

export function validateLibrary(data) {
  assertLibrary(data);
  for (const author of data.authors) validateAuthor(author, data);
  for (const theme of data.themes) validateTheme(theme, data);
  for (const book of data.books) validateBook(book, data);
  for (const reading of data.readings) validateReading(reading, data);
  return data;
}
