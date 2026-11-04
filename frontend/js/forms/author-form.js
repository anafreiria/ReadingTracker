import { saveAuthor, deleteAuthor } from '../store.js';
import { TEXT } from '../strings.js';
import { el, field, showFieldErrors } from '../ui.js';

// The caller owns the library snapshot and refreshes it after persistence.
// Lock the dialog while awaiting a write so Escape/Close cannot hide its result.
function pendingForm(form, submit, {onBusy, onSuccess, operation, pending, label}) {
  const message = el('p', {className: 'error-panel', role: 'alert', tabindex: '-1', hidden: ''});
  form.prepend(message);
  let saving = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving) return;
    showFieldErrors(form);
    message.hidden = true;
    // Date inputs can expose an empty value for an unfinished/invalid date.
    // Do not silently turn that browser badInput into an absent optional value.
    const invalidDates = [...form.querySelectorAll('input[type="date"]')]
      .filter(control => control.validity.badInput)
      .map(control => ({field: control.name, message: TEXT.validation.date}));
    if (invalidDates.length) {
      showFieldErrors(form, invalidDates);
      return;
    }
    saving = true;
    onBusy(true);
    const controls = [...form.elements];
    const values = Object.fromEntries(controls.filter(control => control.name).map(control => [control.name, control.value]));
    for (const control of controls) control.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = pending;
    let succeeded = false;
    try {
      await operation(values);
      succeeded = true;
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
      const errors = error.status === 409 && error.message === TEXT.validation.duplicateAuthor
        ? [{field: 'name', message: error.message}] : error.errors;
      // Restore controls before focusing a field with an error.
      for (const control of controls) control.disabled = false;
      showFieldErrors(form, errors);
      if (!form.querySelector('[aria-invalid="true"]')) message.focus();
    } finally {
      saving = false;
      for (const control of controls) control.disabled = false;
      form.setAttribute('aria-busy', 'false');
      submit.textContent = label;
      onBusy(false);
    }
    if (succeeded) await onSuccess();
  });
}

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
  pendingForm(form, submit, {onBusy, onSuccess, label: TEXT.authors.save, pending: TEXT.authors.saving,
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
  pendingForm(form, submit, {onBusy, onSuccess, label: TEXT.authors.remove, pending: TEXT.authors.deleting,
    operation: () => deleteAuthor(author.id)});
  return form;
}
