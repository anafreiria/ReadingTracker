import { VALUES } from './constants.js';
import { TEXT } from './strings.js';
import { el, field } from './ui.js';

function input(type = 'text', attributes = {}) { return el('input', {type, ...attributes}); }
function select(options, {multiple = false, optional = true} = {}) {
  return el('select', multiple ? {multiple: '', size: '5'} : {}, [
    ...(!multiple && optional ? [el('option', {value: ''}, TEXT.optional)] : []),
    ...options.map(option => typeof option === 'string' ? el('option', {value: option}, option) : el('option', {value: option.id}, option.name ?? option.title)),
  ]);
}
function readingFields(data, includeBook = true) {
  return [
    ...(includeBook ? [field('bookId', select(data.books, {optional: false}), {required: true})] : []),
    field('status', select(VALUES.statuses, {optional: false}), {required: true}),
    field('yearRead', input('number', {step: '1'})),
    field('grade', input('number', {min: '0', max: '10', step: '0.5'})),
    field('recommendedBy', input()), field('priority', select(VALUES.priorities)),
    field('notes', el('textarea', {rows: '3'})),
  ];
}
export function previewForm(area, data) {
  const form = el('form');
  form.addEventListener('submit', event => event.preventDefault());
  const grid = el('div', {className: 'form-grid'});
  if (area === 'authors') grid.append(
    field('name', input(), {required: true}), field('countryId', select(data.countries)),
    field('birthDate', input('date')), field('deathDate', input('date')),
  );
  if (area === 'books') {
    grid.append(field('title', input(), {required: true}),
      field('authorIds', select(data.authors, {multiple: true})),
      field('publicationYear', input('number', {step: '1'})),
      field('form', select(VALUES.forms)), field('mode', select(VALUES.modes)),
      field('content', select(VALUES.contents)), field('themeIds', select(data.themes, {multiple: true})),
      field('newTheme', input()));
  }
  if (area === 'readings') grid.append(...readingFields(data));
  form.append(el('p', {className: 'notice'}, TEXT.previewNotice), grid);
  if (area === 'books') {
    const checkbox = input('checkbox', {id: 'first-reading'});
    const firstReading = el('fieldset', {hidden: ''}, [el('legend', {}, TEXT.readingLegend), el('div', {className: 'form-grid'}, readingFields(data, false))]);
    firstReading.disabled = true;
    checkbox.addEventListener('change', () => { firstReading.hidden = !checkbox.checked; firstReading.disabled = !checkbox.checked; });
    form.append(el('label', {className: 'checkbox-label', for: 'first-reading'}, [checkbox, TEXT.firstReading]), firstReading);
  }
  form.append(el('button', {type: 'submit', disabled: ''}, TEXT.saveUnavailable));
  return form;
}
