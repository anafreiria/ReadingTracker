import { TEXT } from '../strings.js';
import { authorNames, badge, display, el, emptyState, table } from '../ui.js';

export function readingRows(data, readings = data.readings) {
  return readings.map(reading => {
    const book = data.books.find(item => item.id === reading.bookId);
    return {...reading, title: book?.title ?? null, authors: book ? authorNames(book, data.authors) : null};
  });
}
export function sortReadings(rows, key = 'yearRead', direction = 'desc') {
  const missing = value => value === null || value === undefined || value === '';
  return [...rows].sort((a, b) => {
    const left = a[key], right = b[key];
    if (missing(left) || missing(right)) return (Number(missing(left)) - Number(missing(right))) || a.id - b.id;
    const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'en-US', {sensitivity: 'base'});
    return order * (direction === 'asc' ? 1 : -1) || a.id - b.id;
  });
}
export function readingsTable(data, readings = data.readings) {
  if (!readings.length) return emptyState(TEXT.noReadings);
  const host = el('div');
  let sortKey = 'yearRead', direction = 'desc';
  const render = () => host.replaceChildren(table(['title', 'authors', 'status', 'yearRead', 'grade'].map(key => ({key, label: TEXT.labels[key], sortable: true, render: row => key === 'status' ? badge(row.status) : display(row[key])})), sortReadings(readingRows(data, readings), sortKey, direction), {sortKey, direction, onSort: key => {
    direction = key === sortKey && direction === 'asc' ? 'desc' : 'asc'; sortKey = key; render();
    // Restore keyboard focus after replacing the table.
    host.querySelectorAll('.sort-button')[['title', 'authors', 'status', 'yearRead', 'grade'].indexOf(key)].focus();
  }}));
  render(); return host;
}
export function renderReadings(data) {
  return data.readings.length ? readingsTable(data) : emptyState(TEXT.pages.readings.empty);
}
