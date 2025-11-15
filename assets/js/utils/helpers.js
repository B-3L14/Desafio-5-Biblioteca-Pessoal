// helpers.js - utilitários simples
export function formatAuthors(arr) {
  return (arr || []).join(", ");
}
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
