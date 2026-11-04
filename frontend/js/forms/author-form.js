import { saveAuthor, deleteAuthor } from '../store.js';
import { TEXT } from '../strings.js';
import { el, field } from '../ui.js';

import { bindFormAction } from './form-action.js';

export function authorForm({author = null, countries, onBusy, onSuccess, onCancel}) {
  const form = el('form', {novalidate: ''});
  const name = el('input', {type: 'text', autocomplete: 'off'});
  const country = el('select', {}, [el('option', {value: ''}, TEXT.optional),
    ...countries.map(item => el('option', {value: item.id}, item.name))]);
  const birth = el('input', {type: 'date'});
  const death = el('input', {type: 'date'});
  name.value = author?.name ?? '';
  country.value = author?.countryId ?? '';
  birth.value = author?.birthDate ?? '';
  death.value = author?.deathDate ?? '';
  const submit = el('button', {type: 'submit'}, TEXT.authors.save);
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  cancel.addEventListener('click', onCancel);
  form.append(el('p', {className: 'notice'}, TEXT.authors.help),
    el('div', {className: 'form-grid'}, [field('name', name, {required: true}), field('countryId', country),
      field('birthDate', birth), field('deathDate', death)]),
    el('div', {className: 'dialog-actions'}, [cancel, submit]));
  bindFormAction(form, submit, {onBusy, onSuccess,
    errorFields: error => error.status === 409 && error.message === TEXT.validation.duplicateAuthor
      ? [{field: 'name', message: error.message}] : error.errors,
    label: TEXT.authors.save, pending: TEXT.authors.saving,
    operation: values => saveAuthor({
      ...(author ? {id: author.id} : {}), name: values.name,
      countryId: values.countryId === '' ? null : Number(values.countryId),
      birthDate: values.birthDate || null, deathDate: values.deathDate || null,
    }),
  });
  return form;
}

export function deleteAuthorForm({author, onBusy, onSuccess, onCancel}) {
  const form = el('form');
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  const submit = el('button', {type: 'submit', className: 'button-danger'}, TEXT.authors.remove);
  cancel.addEventListener('click', onCancel);
  form.append(el('p', {className: 'confirmation-message'}, TEXT.authors.deleteMessage(author.name)),
    el('div', {className: 'dialog-actions'}, [cancel, submit]));
  bindFormAction(form, submit, {onBusy, onSuccess, label: TEXT.authors.remove, pending: TEXT.authors.deleting,
    operation: () => deleteAuthor(author.id)});
  return form;
}
