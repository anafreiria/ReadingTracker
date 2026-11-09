import { saveReading, deleteReading } from '../store.js';
import { prepareReadingTransition, StoreError } from '../validation.js';
import { VALUES } from '../constants.js';
import { TEXT } from '../strings.js';
import { el, field } from '../ui.js';
import { bindFormAction, formValues } from './form-action.js';

const input = (type = 'text', attributes = {}) => el('input', {type, ...attributes});
const number = value => value === '' ? null : Number(value);
function select(options, {optional = true} = {}) {
  return el('select', {}, [
    ...(optional ? [el('option', {value: ''}, TEXT.optional)] : []),
    ...options.map(item => typeof item === 'string' ? el('option', {value: item}, item)
      : el('option', {value: item.id}, item.title)),
  ]);
}
export function readingForm({reading = null, bookId = null, books, onBusy, onSuccess, onCancel}) {
  const form = el('form', {novalidate: ''});
  const book = select(books, {optional: false});
  const status = select(VALUES.statuses, {optional: false});
  const year = input('number', {step: '1'}), grade = input('number', {min: '0', max: '10', step: '0.5'});
  const priority = select(VALUES.priorities), recommendation = input(), notes = el('textarea', {rows: '4'});
  book.value = reading?.bookId ?? bookId ?? books[0]?.id ?? '';
  status.value = reading?.status ?? 'Want to read';
  year.value = reading?.yearRead ?? '';
  grade.value = reading?.grade ?? '';
  priority.value = reading?.priority ?? '';
  recommendation.value = reading?.recommendedBy ?? '';
  notes.value = reading?.notes ?? '';
  const confirmation = input('checkbox');
  const choice = field('confirmFieldClear', confirmation, {label: TEXT.readings.confirmClear});
  const choiceLabel = choice.querySelector('label');
  choiceLabel.className = 'checkbox-label';
  choiceLabel.prepend(confirmation);
  const warning = el('p', {className: 'notice', role: 'status'});
  const priorityWarning = el('p', {id: 'reading-priority-warning', className: 'notice', role: 'status', hidden: ''});
  const statusHelp = el('p', {id: 'reading-status-help', className: 'muted', role: 'status'});
  const clearance = el('section', {hidden: '', 'aria-label': TEXT.readings.clearTitle}, [warning, choice]);
  form.append(el('p', {className: 'notice'}, TEXT.readings.help),
    ...(!books.length ? [el('p', {role: 'status'}, [TEXT.readings.noBooks, el('a', {href: '#books'}, TEXT.pages.books.title)])] : []),
    el('div', {className: 'form-grid'}, [field('bookId', book, {required: true}), field('status', status, {required: true}),
      field('yearRead', year), field('grade', grade), field('priority', priority), field('recommendedBy', recommendation), field('notes', notes)]), priorityWarning, clearance);
  priority.setAttribute('aria-describedby', 'error-priority reading-priority-warning');
  form.querySelector('[name="status"]').setAttribute('aria-describedby', 'error-status reading-status-help');
  form.querySelector('.form-grid').before(statusHelp);
  const submit = el('button', {type: 'submit'}, TEXT.readings.save);
  submit.disabled = !books.length;
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  cancel.addEventListener('click', onCancel);
  form.append(el('div', {className: 'dialog-actions'}, [cancel, submit]));
  const payload = values => ({...(reading ? {id: reading.id} : {}), bookId: Number(values.bookId),
    status: values.status, yearRead: number(values.yearRead), grade: number(values.grade),
    priority: values.priority || null, recommendedBy: values.recommendedBy || null, notes: values.notes || null});
  let signature = '';
  function transition(draft) {
    if (!reading || draft.status === reading.status) return {reading: draft, clearedFields: []};
    const planned = prepareReadingTransition(draft, draft.status);
    const previous = prepareReadingTransition(reading, draft.status);
    return {...planned, clearedFields: [...new Set([...previous.clearedFields, ...planned.clearedFields])]};
  }
  function showClearance(draft) {
    statusHelp.textContent = TEXT.readings.statusHelp[draft.status];
    year.required = draft.status === 'Read';
    const planned = transition(draft);
    priorityWarning.hidden = !reading || draft.status === reading.status || draft.status === 'Want to read'
      || !(reading.priority || draft.priority);
    priorityWarning.textContent = priorityWarning.hidden ? '' : TEXT.readings.priorityRemoval(draft.status);
    const nextSignature = JSON.stringify([draft.status, planned.clearedFields, draft.yearRead, draft.grade]);
    if (signature !== nextSignature) confirmation.checked = false;
    signature = nextSignature;
    clearance.hidden = !planned.clearedFields.length;
    warning.textContent = TEXT.readings.clearMessage(draft.status, planned.clearedFields.map(name => TEXT.labels[name]));
    return planned;
  }
  for (const control of [status, year, grade, priority]) control.addEventListener('input', () => showClearance(payload(formValues(form))));
  showClearance(payload(formValues(form)));
  bindFormAction(form, submit, {onBusy, onSuccess, label: TEXT.readings.save, pending: TEXT.readings.saving,
    operation: values => {
      const draft = payload(values);
      const planned = showClearance(draft);
      if (planned.clearedFields.length && !confirmation.checked) {
        throw new StoreError(400, TEXT.validation.failed, [{field: 'confirmFieldClear', message: TEXT.readings.confirmRequired}]);
      }
      return saveReading(planned.reading, {confirmFieldClear: planned.clearedFields.length > 0 && confirmation.checked});
    },
  });
  return form;
}
export function deleteReadingForm({reading, book, onBusy, onSuccess, onCancel}) {
  const form = el('form');
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  const submit = el('button', {type: 'submit', className: 'button-danger'}, TEXT.authors.remove);
  cancel.addEventListener('click', onCancel);
  form.append(el('p', {className: 'confirmation-message'}, TEXT.readings.deleteMessage(reading.id, book.title)),
    el('div', {className: 'dialog-actions'}, [cancel, submit]));
  bindFormAction(form, submit, {onBusy, onSuccess, label: TEXT.authors.remove, pending: TEXT.readings.deleting,
    operation: () => deleteReading(reading.id)});
  return form;
}
