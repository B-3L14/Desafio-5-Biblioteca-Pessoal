// openLibrary.js - funções para consumir Open Library API (https://openlibrary.org)
export async function searchBooks(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro na busca");
  return res.json();
}

export function coverUrl(cover_i) {
  return cover_i
    ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg`
    : "assets/img/placeholders/cover.png";
}

// Busca detalhes do work (para obter descrição). workKey pode vir no formato
// "/works/OL27448W" ou apenas "OL27448W".
export async function getWorkDescription(workKey) {
  if (!workKey) return null;
  const key = workKey.startsWith("/works/") ? workKey : `/works/${workKey}`;
  const url = `https://openlibrary.org${key}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const desc = data && data.description ? data.description : null;
    // description pode ser string ou objeto { value: '...' }
    if (!desc) return null;
    return typeof desc === "string" ? desc : desc.value || null;
  } catch (e) {
    return null;
  }
}
