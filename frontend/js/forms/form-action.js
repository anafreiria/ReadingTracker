import { TEXT } from '../strings.js';
import { el, showFieldErrors } from '../ui.js';

const activeForms = new WeakSet();
export function formValues(form) {
  return Object.fromEntries([...form.elements].filter(control => control.name && !control.matches(':disabled'))
    .map(control => [control.name, control.multiple ? [...control.selectedOptions].map(option => Number(option.value))
      : control.type === 'checkbox' ? control.checked : control.value]));
}

// Share pending/error behavior, while each form owns its payload and store call.
export function bindFormAction(form, button, {onBusy, onSuccess, operation, pending, label,
  event = 'submit', errorFields = error => error.errors}) {
  let message = form.querySelector('[data-form-message]');
  if (!message) {
    message = el('p', {'data-form-message': '', className: 'error-panel', role: 'alert', tabindex: '-1', hidden: ''});
    form.prepend(message);
  }
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
    let succeeded = false, result;
    try {
      result = await operation(values);
      succeeded = true;
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
      for (const [control, disabled] of controls) control.disabled = disabled;
      showFieldErrors(form, errorFields(error));
      if (!form.querySelector('[aria-invalid="true"]')) message.focus();
    } finally {
      activeForms.delete(form);
      for (const [control, disabled] of controls) control.disabled = disabled;
      form.setAttribute('aria-busy', 'false');
      button.textContent = label;
      onBusy(false);
    }
    if (succeeded) await onSuccess(result);
  });
}
