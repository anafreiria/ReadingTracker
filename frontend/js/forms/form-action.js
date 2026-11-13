import { TEXT } from '../strings.js';
import { el, feedback, showFieldErrors } from '../ui.js';

const activeForms = new WeakSet();
export function formValues(form) {
  const values = Object.fromEntries([...form.elements].filter(control => control.name && !control.matches(':disabled'))
    .map(control => [control.name, control.multiple ? [...control.selectedOptions].map(option => Number(option.value))
      : control.type === 'checkbox' ? control.checked : control.value]));
  for (const name of ['authorIds', 'themeIds']) {
    if (form.querySelector('.multiple-field')) {
      values[name] = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(control => Number(control.value));
    }
  }
  return values;
}

// Share pending/error behavior, while each form owns its payload and store call.
export function bindFormAction(form, button, {onBusy, onSuccess, operation, pending, label,
  event = 'submit', errorFields = error => error.errors}) {
  let message = form.querySelector('[data-form-message]');
  if (!message) {
    message = el('p', {'data-form-message': '', className: 'feedback feedback-error', role: 'alert', tabindex: '-1', hidden: ''});
    form.prepend(message);
  }
  const progress = el('p', {className: 'feedback feedback-loading', 'aria-hidden': 'true', hidden: ''});
  form.prepend(progress);
  const target = event === 'submit' ? form : button;
  target.addEventListener(event, async eventObject => {
    eventObject.preventDefault();
    if (activeForms.has(form)) return;
    showFieldErrors(form);
    message.hidden = true;
    const invalid = [...form.querySelectorAll('input')].filter(control => !control.matches(':disabled') && control.validity.badInput)
      .map(control => ({field: control.name, message: control.type === 'date' ? TEXT.validation.date : TEXT.validation.number}));
    if (invalid.length) { showFieldErrors(form, invalid); return; }
    const values = formValues(form);
    const controls = [...form.elements].map(control => [control, control.disabled]);
    activeForms.add(form);
    onBusy(true);
    for (const [control] of controls) control.disabled = true;
    form.setAttribute('aria-busy', 'true');
    button.textContent = pending;
    progress.textContent = `${TEXT.feedback.loading}: ${pending}`;
    progress.hidden = false;
    const liveProgress = document.getElementById('dialog-progress');
    if (liveProgress) liveProgress.textContent = progress.textContent;
    let succeeded = false, result;
    try {
      result = await operation(values);
      succeeded = true;
    } catch (error) {
      message.replaceChildren(...feedback(error.message, 'error').childNodes);
      message.hidden = false;
      for (const [control, disabled] of controls) control.disabled = disabled;
      showFieldErrors(form, errorFields(error));
      if (!form.querySelector('[aria-invalid="true"]')) message.focus();
    } finally {
      progress.hidden = true;
      if (liveProgress) liveProgress.textContent = '';
      activeForms.delete(form);
      for (const [control, disabled] of controls) control.disabled = disabled;
      form.setAttribute('aria-busy', 'false');
      button.textContent = label;
      onBusy(false);
    }
    if (succeeded) await onSuccess(result);
  });
}
