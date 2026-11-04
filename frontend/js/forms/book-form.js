import { saveBook, saveBookWithReading, saveTheme, deleteBook } from '../store.js';
import { StoreError } from '../validation.js';
import { VALUES } from '../constants.js';
import { TEXT } from '../strings.js';
import { el, field } from '../ui.js';
import { bindFormAction } from './form-action.js';

function select(options, {multiple = false, optional = true, value = null} = {}) {
  const control = el('select', multiple ? {multiple: '', size: '5'} : {}, [
    ...(!multiple && optional ? [el('option', {value: ''}, TEXT.optional)] : []),
    ...options.map(item => typeof item === 'string' ? el('option', {value: item}, item)
      : el('option', {value: item.id}, item.name)),
  ]);
  if (multiple) for (const option of control.options) option.selected = (value ?? []).includes(Number(option.value));
  else if (value !== null) control.value = value;
  return control;
}
const input = (type = 'text', attributes = {}) => el('input', {type, ...attributes});
const number = value => value === undefined || value === '' ? null : Number(value);
function multipleField(name, control) {
  const clear = el('button', {type: 'button', className: 'button-link'}, TEXT.books.clearSelection);
  clear.addEventListener('click', () => { for (const option of control.options) option.selected = false; control.focus(); });
  const host = field(name, control);
  host.append(clear);
  return host;
}
export function bookForm({book = null, authors, themes, onBusy, onSuccess, onCancel}) {
  const form = el('form', {novalidate: ''});
  const title = input(); title.value = book?.title ?? '';
  const year = input('number', {step: '1'}); year.value = book?.publicationYear ?? '';
  const authorsControl = select(authors, {multiple: true, value: book?.authorIds});
  const themesControl = select(themes, {multiple: true, value: book?.themeIds});
  const newTheme = input();
  const createTheme = el('button', {type: 'button', className: 'button-secondary'}, TEXT.books.createTheme);
  const themeStatus = el('p', {role: 'status', className: 'muted'});
  const themeSection = el('section', {'aria-label': TEXT.labels.newTheme}, [field('newTheme', newTheme),
    el('p', {className: 'muted'}, TEXT.books.themeHelp), createTheme, themeStatus]);
  form.append(el('p', {className: 'notice'}, TEXT.books.help),
    el('p', {className: 'muted'}, TEXT.books.selectionHelp), el('div', {className: 'form-grid'}, [
      field('title', title, {required: true}), field('publicationYear', year),
      multipleField('authorIds', authorsControl), multipleField('themeIds', themesControl),
      field('form', select(VALUES.forms, {value: book?.form})),
      field('mode', select(VALUES.modes, {value: book?.mode})),
      field('content', select(VALUES.contents, {value: book?.content})),
    ]), themeSection);
  if (!book) {
    const include = input('checkbox', {id: 'include-first-reading', name: 'includeFirstReading'});
    const first = el('fieldset', {disabled: '', hidden: ''}, [el('legend', {}, TEXT.readingLegend),
      el('p', {className: 'muted'}, TEXT.books.firstReadingHelp), el('div', {className: 'form-grid'}, [
        field('status', select(VALUES.statuses, {optional: false}), {required: true}),
        field('yearRead', input('number', {step: '1'})), field('grade', input('number', {min: '0', max: '10', step: '0.5'})),
        field('priority', select(VALUES.priorities)), field('recommendedBy', input()), field('notes', el('textarea', {rows: '3'})),
      ])]);
    include.addEventListener('change', () => { first.hidden = !include.checked; first.disabled = !include.checked; });
    form.append(el('label', {className: 'checkbox-label', for: include.id}, [include, TEXT.firstReading]), first);
  }
  const submit = el('button', {type: 'submit'}, TEXT.books.save);
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  cancel.addEventListener('click', onCancel);
  form.append(el('div', {className: 'dialog-actions'}, [cancel, submit]));
  bindFormAction(form, createTheme, {event: 'click', onBusy,
    label: TEXT.books.createTheme, pending: TEXT.books.creatingTheme,
    operation: values => saveTheme({name: values.newTheme}),
    errorFields: error => error.message === TEXT.validation.duplicateTheme
      ? [{field: 'newTheme', message: error.message}]
      : error.errors?.map(item => ({...item, field: item.field === 'name' ? 'newTheme' : item.field})),
    onSuccess: theme => {
      const option = el('option', {value: theme.id}, theme.name);
      option.selected = true;
      themesControl.append(option);
      newTheme.value = '';
      themeStatus.textContent = TEXT.books.themeCreated;
      newTheme.focus();
    },
  });
  newTheme.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); createTheme.click(); }
  });
  bindFormAction(form, submit, {onBusy, onSuccess, label: TEXT.books.save, pending: TEXT.books.saving,
    operation: values => {
      if (values.newTheme.trim()) throw new StoreError(400, TEXT.validation.failed,
        [{field: 'newTheme', message: TEXT.books.uncreatedTheme}]);
      const payload = {title: values.title, authorIds: values.authorIds, themeIds: values.themeIds,
        publicationYear: number(values.publicationYear), form: values.form || null,
        mode: values.mode || null, content: values.content || null};
      if (book) return saveBook({...payload, id: book.id});
      return saveBookWithReading(payload, values.includeFirstReading ? {
        status: values.status, yearRead: number(values.yearRead), grade: number(values.grade),
        priority: values.priority || null, recommendedBy: values.recommendedBy || null, notes: values.notes || null,
      } : null);
    },
  });
  return form;
}
export function deleteBookForm({book, readingCount, onBusy, onSuccess, onCancel}) {
  const form = el('form');
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  const submit = el('button', {type: 'submit', className: 'button-danger'}, TEXT.authors.remove);
  cancel.addEventListener('click', onCancel);
  form.append(el('p', {className: 'confirmation-message'}, TEXT.books.deleteMessage(book.title, readingCount)),
    el('div', {className: 'dialog-actions'}, [cancel, submit]));
  bindFormAction(form, submit, {onBusy, onSuccess, label: TEXT.authors.remove, pending: TEXT.books.deleting,
    operation: () => deleteBook(book.id)});
  return form;
}
