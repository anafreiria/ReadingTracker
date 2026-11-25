export const COLLECTIONS = Object.freeze(['countries', 'authors', 'themes', 'books', 'readings']);
export const VALUES = Object.freeze({
  forms: Object.freeze(['Novel', 'Novella', 'Short Story', 'Short Story Collection', 'Play', 'Essay', 'Treatise', 'Diary', 'Graphic Novel']),
  modes: Object.freeze(['Prose', 'Drama', 'Poetry', 'Sequential Art']),
  contents: Object.freeze(['Fiction', 'Non-fiction']),
  statuses: Object.freeze(['Want to read', 'Reading', 'Paused', 'Read', 'Abandoned']),
  priorities: Object.freeze(['Low', 'Medium', 'High']),
});
export const STORAGE_KEY = 'reading-tracker:data:v1';
