import { TEXT } from '../strings.js';
import { el, display, emptyState, table } from '../ui.js';
export function renderAuthors(data, {onEdit, onDelete} = {}) {
  if (!data.authors.length) return emptyState(TEXT.pages.authors.empty);
  return table([
    {key: 'name', label: TEXT.labels.name},
    {key: 'countryId', label: TEXT.labels.countryId, render: author => display(data.countries.find(country => country.id === author.countryId)?.name)},
    {key: 'birthDate', label: TEXT.labels.birthDate},
    {key: 'deathDate', label: TEXT.labels.deathDate},
    {key: 'books', label: TEXT.labels.books, render: author => data.books.filter(book => book.authorIds.includes(author.id)).length},
    ...(onEdit && onDelete ? [{key: 'actions', label: TEXT.authors.actions, render: author => {
      const edit = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.authors.editLabel(author.name)}, TEXT.authors.edit);
      const remove = el('button', {type: 'button', className: 'button-secondary', 'aria-label': TEXT.authors.deleteLabel(author.name)}, TEXT.authors.remove);
      edit.addEventListener('click', () => onEdit(author.id));
      remove.addEventListener('click', () => onDelete(author.id));
      return el('div', {className: 'row-actions'}, [edit, remove]);
    }}] : []),
  ], data.authors);
}
