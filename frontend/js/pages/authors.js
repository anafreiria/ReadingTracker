import { TEXT } from '../strings.js';
import { display, emptyState, table } from '../ui.js';
export function renderAuthors(data) {
  if (!data.authors.length) return emptyState(TEXT.pages.authors.empty);
  return table([
    {key: 'name', label: TEXT.labels.name},
    {key: 'countryId', label: TEXT.labels.countryId, render: author => display(data.countries.find(country => country.id === author.countryId)?.name)},
    {key: 'birthDate', label: TEXT.labels.birthDate},
    {key: 'deathDate', label: TEXT.labels.deathDate},
    {key: 'books', label: TEXT.labels.books, render: author => data.books.filter(book => book.authorIds.includes(author.id)).length},
  ], data.authors);
}
