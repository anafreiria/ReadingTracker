import { TEXT } from './strings.js';

// Build data-driven content with textContent; never inject book or author names as HTML.
export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of [children].flat()) {
    if (child !== null && child !== undefined) node.append(child instanceof Node ? child : String(child));
  }
  return node;
}
export function display(value) { return value === null || value === undefined || value === '' ? TEXT.missing : String(value); }
export function authorNames(book, authors) {
  return book.authorIds.map(id => authors.find(author => author.id === id)?.name).filter(Boolean).join(', ');
}
export function badge(status) {
  const styles = {'Read': 'complete', 'Paused': 'paused', 'Want to read': 'wishlist', 'Reading': 'active', 'Abandoned': 'abandoned'};
  return el('span', {className: `badge ${styles[status] || ''}`}, status);
}
export function emptyState(title) {
  return el('div', {className: 'empty-state'}, [el('h2', {}, title || TEXT.empty), el('p', {}, TEXT.emptyHelp)]);
}
export function table(columns, rows, {sortKey, direction = 'asc', onSort} = {}) {
  const head = el('tr');
  for (const column of columns) {
    const th = el('th', {scope: 'col'});
    if (column.sortable && onSort) {
      th.setAttribute('aria-sort', sortKey === column.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
      const button = el('button', {type: 'button', className: 'sort-button'}, [column.label, el('span', {'aria-hidden': 'true'}, sortKey === column.key ? (direction === 'asc' ? ' ↑' : ' ↓') : ' ↕')]);
      button.addEventListener('click', () => onSort(column.key)); th.append(button);
    } else th.textContent = column.label;
    head.append(th);
  }
  const body = el('tbody');
  for (const row of rows) {
    const tr = el('tr');
    for (const column of columns) tr.append(el('td', {'data-label': column.label}, column.render ? column.render(row) : display(row[column.key])));
    body.append(tr);
  }
  return el('div', {className: 'table-scroll', tabindex: '0', role: 'region', 'aria-label': TEXT.appName}, el('table', {role: 'table'}, [el('caption', {className: 'sr-only'}, TEXT.appName), el('thead', {}, head), body]));
}
export function openDialog(title, content) {
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-content').replaceChildren(content);
  document.getElementById('form-dialog').showModal();
}
export function field(name, control, {label = TEXT.labels[name], required = false} = {}) {
  control.id = `field-${name}`;
  control.name = name;
  control.required = required;
  const error = el('span', {id: `error-${name}`, className: 'field-error', 'aria-live': 'polite'});
  control.setAttribute('aria-describedby', error.id);
  return el('div', {className: 'field'}, [el('label', {for: control.id}, label), control, error]);
}
export function showFieldErrors(form, errors = []) {
  for (const control of form.elements) control.removeAttribute('aria-invalid');
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const error of errors) {
    const control = form.elements.namedItem(error.field);
    if (!control?.setAttribute) continue;
    control.setAttribute('aria-invalid', 'true');
    const message = document.getElementById(`error-${error.field}`);
    if (message) message.textContent = error.message;
  }
  form.querySelector('[aria-invalid="true"]')?.focus();
}

export function confirmAction({title, message, confirmLabel}) {
  const dialog = document.getElementById('form-dialog');
  const cancel = el('button', {type: 'button', className: 'button-secondary'}, TEXT.cancel);
  const confirm = el('button', {type: 'button', className: 'button-danger'}, confirmLabel);
  const content = el('div', {}, [
    el('p', {className: 'confirmation-message'}, message),
    el('div', {className: 'dialog-actions'}, [cancel, confirm]),
  ]);
  return new Promise(resolve => {
    dialog.returnValue = 'cancel';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), {once: true});
    cancel.addEventListener('click', () => dialog.close('cancel'));
    confirm.addEventListener('click', () => dialog.close('confirm'));
    openDialog(title, content);
    cancel.focus();
  });
}
