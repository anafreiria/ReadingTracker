// Shared US English interface copy. Titles and author names come from the data.
export const TEXT = {
  appName: 'Reading Tracker', missing: '-', close: 'Close', retry: 'Try again',
  bookNotFound: 'Book not found', loading: 'Opening your library…', loadError: 'We couldn’t open your library.',
  storageError: 'Your saved library could not be read. Existing data has been kept. Check your browser storage settings and try again.',
  seedError: 'The initial library could not be loaded. Check your connection and try again.',
  invalidData: 'The library data has an unexpected format. Existing data has been kept.',
  previewNotice: 'Form preview — saving will be available in a future update.',
  saveUnavailable: 'Save unavailable in preview', empty: 'No records yet.',
  emptyHelp: 'Your records will appear here when you add them.',
  bookHistory: 'Reading history', noReadings: 'No readings for this book yet.',
  firstReading: 'Include a first reading', optional: 'Optional',
  formLegend: 'Book details', readingLegend: 'Reading details',
  labels: {
    title: 'Title', authors: 'Authors', authorIds: 'Authors', status: 'Status', yearRead: 'Year read', grade: 'Grade',
    name: 'Name', countryId: 'Nationality', birthDate: 'Birth date', deathDate: 'Death date',
    publicationYear: 'Publication year', form: 'Form', mode: 'Mode of expression', content: 'Content',
    themeIds: 'Themes', newTheme: 'New theme', bookId: 'Book', recommendedBy: 'Recommended by',
    priority: 'Priority', notes: 'Notes', books: 'Books', readings: 'Readings', viewHistory: 'View history',
  },
  pages: {
    readings: {eyebrow: 'THE READING JOURNAL', title: 'Reading History', description: 'Every chapter of your reading journey, all in one place.', preview: 'Preview reading form', empty: 'Your reading journey starts here.'},
    books: {eyebrow: 'THE COLLECTION', title: 'Your books', description: 'The stories you’ve discovered, and the ones still waiting.', preview: 'Preview book form', empty: 'Your bookshelf is ready for its first book.'},
    authors: {eyebrow: 'BEHIND THE STORIES', title: 'Your authors', description: 'Meet the voices behind your personal library.', preview: 'Preview author form', empty: 'No authors in your library yet.'},
  },
  counts: {readings: 'reading entries', books: 'books in your collection', authors: 'authors in your library'},
  summary: {read: 'Completed', paused: 'Paused', wishlist: 'Want to read'},
};
