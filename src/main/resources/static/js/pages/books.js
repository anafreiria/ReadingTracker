import { TEXT } from '../strings.js';
import { authorNames, display, el, emptyState, table } from '../ui.js';
import { readingsTable } from './readings.js';
export function renderBooks(data, {onEdit, onDelete, onDetails, onHistory, onAddReading} = {}) {
  if (!data.books.length) return emptyState(TEXT.pages.books.empty);
  return table([
    {key: 'title', label: TEXT.labels.title},
    {key: 'authors', label: TEXT.labels.authors, render: book => display(authorNames(book, data.authors))},
    {key: 'publicationYear', label: TEXT.labels.publicationYear},
    {key: 'form', label: TEXT.labels.form},
    {key: 'readings', label: TEXT.labels.readings, render: book => {
      const button = el('button', {type: 'button', className: 'button-link', 'aria-label': `${TEXT.labels.viewHistory}: ${book.title}`}, TEXT.labels.viewHistory);
      button.addEventListener('click', () => onHistory(book.id));
      return button;
    }},
    ...(onEdit && onDelete ? [{key: 'actions', label: TEXT.authors.actions, render: book => {
      const edit = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.books.editLabel(book.title)}, TEXT.authors.edit);
      const remove = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.books.deleteLabel(book.title)}, TEXT.authors.remove);
      const details = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.books.detailsLabel(book.title)}, TEXT.books.details);
      edit.addEventListener('click', () => onEdit(book.id));
      remove.addEventListener('click', () => onDelete(book.id));
      details.addEventListener('click', () => onDetails(book.id));
      const addReading = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.readings.addLabel(book.title)}, TEXT.readings.add);
      addReading.addEventListener('click', () => onAddReading(book.id));
      return el('div', {className: 'row-actions'}, [details, addReading, edit, remove]);
    }}] : []),
  ], data.books);
}

export function bookDetails(book, data, readingActions) {
  const details = el('dl', {className: 'book-details'});
  const values = {title: book.title, authors: authorNames(book, data.authors), publicationYear: book.publicationYear,
    form: book.form, mode: book.mode, content: book.content,
    themeIds: book.themeIds.map(id => data.themes.find(theme => theme.id === id)?.name).filter(Boolean).join(', ')};
  for (const [name, value] of Object.entries(values)) details.append(el('dt', {}, TEXT.labels[name]), el('dd', {}, display(value)));
  return el('div', {}, [details, bookHistory(book, data, readingActions)]);
}

export function bookHistory(book, data, actions = {}) {
  const add = el('button', {type: 'button', 'aria-label': TEXT.readings.addLabel(book.title)}, TEXT.readings.add);
  add.addEventListener('click', () => actions.onAdd(book.id));
  return el('section', {'aria-label': TEXT.bookHistory}, [el('div', {className: 'panel-heading'}, [el('h3', {}, TEXT.bookHistory), add]),
    readingsTable(data, data.readings.filter(reading => reading.bookId === book.id), actions)]);
}
