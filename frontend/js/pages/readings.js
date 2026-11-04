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
export function readingsTable(data, readings = data.readings, {onEdit, onDelete, onDetails} = {}) {
  if (!readings.length) return emptyState(TEXT.noReadings);
  const host = el('div');
  let sortKey = 'yearRead', direction = 'desc';
  const columns = ['title', 'authors', 'status', 'yearRead', 'grade'].map(key => ({key, label: TEXT.labels[key], sortable: true,
    render: row => key === 'status' ? badge(row.status) : display(row[key])}));
  if (onEdit && onDelete && onDetails) columns.push({key: 'actions', label: TEXT.authors.actions, render: row => {
    const actions = [[TEXT.readings.view, 'view', onDetails], [TEXT.authors.edit, 'edit', onEdit], [TEXT.authors.remove, 'delete', onDelete]];
    return el('div', {className: 'row-actions'}, actions.map(([label, action, callback]) => {
      const button = el('button', {type: 'button', className: 'button-secondary', 'data-reading-action': action,
        'data-reading-id': row.id, 'aria-label': TEXT.readings.actionLabel(label, row.id, row.title)}, label);
      button.addEventListener('click', () => callback(row.id));
      return button;
    }));
  }});
  const render = () => host.replaceChildren(table(columns, sortReadings(readingRows(data, readings), sortKey, direction), {sortKey, direction, onSort: key => {
    direction = key === sortKey && direction === 'asc' ? 'desc' : 'asc'; sortKey = key; render();
    // Restore keyboard focus after replacing the table.
    host.querySelectorAll('.sort-button')[['title', 'authors', 'status', 'yearRead', 'grade'].indexOf(key)].focus();
  }}));
  render(); return host;
}
export function renderReadings(data, actions = {}) {
  return data.readings.length ? readingsTable(data, data.readings, actions) : emptyState(TEXT.pages.readings.empty);
}

export function readingDetails(reading, data) {
  const book = data.books.find(item => item.id === reading.bookId);
  const details = el('dl', {className: 'book-details'});
  const values = {bookId: book?.title, status: reading.status, yearRead: reading.yearRead, grade: reading.grade,
    priority: reading.priority, recommendedBy: reading.recommendedBy, notes: reading.notes};
  for (const [name, value] of Object.entries(values)) details.append(el('dt', {}, TEXT.labels[name]), el('dd', {}, display(value)));
  return details;
}
