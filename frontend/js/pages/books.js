import { TEXT } from '../strings.js';
import { authorNames, display, el, emptyState, openDialog, table } from '../ui.js';
import { readingsTable } from './readings.js';
export function renderBooks(data) {
  if (!data.books.length) return emptyState(TEXT.pages.books.empty);
  return table([
    {key: 'title', label: TEXT.labels.title},
    {key: 'authors', label: TEXT.labels.authors, render: book => display(authorNames(book, data.authors))},
    {key: 'publicationYear', label: TEXT.labels.publicationYear},
    {key: 'form', label: TEXT.labels.form},
    {key: 'readings', label: TEXT.labels.readings, render: book => {
      const button = el('button', {type: 'button', className: 'button-link', 'aria-label': `${TEXT.labels.viewHistory}: ${book.title}`}, TEXT.labels.viewHistory);
      button.addEventListener('click', () => openDialog(book.title, readingsTable(data, data.readings.filter(reading => reading.bookId === book.id))));
      return button;
    }},
  ], data.books);
}
