// search.js - lógica da página de busca
import { searchBooks, getWorkDescription } from "../api/openLibrary.js";
import { renderBookCard } from "../components/renderBookCard.js";

export function initSearch(root) {
  root.innerHTML = `
    <div class="search-header">
      <input id="q" placeholder="Buscar por título, autor, ISBN"> 
      <button id="btnSearch" class="button">Buscar</button>
    </div>
    <div id="results"></div>
  `;
  const q = root.querySelector("#q");
  const btn = root.querySelector("#btnSearch");
  const results = root.querySelector("#results");

  btn.addEventListener("click", async () => {
    const term = q.value.trim();
    if (!term) {
      results.innerHTML = '<p style="color:red;">Digite algo para buscar!</p>';
      return;
    }
    results.innerHTML = "<p>Carregando...</p>";
    try {
      const data = await searchBooks(term);
      results.innerHTML = "";
      if (!data.docs || data.docs.length === 0) {
        results.innerHTML = "<p>Nenhum livro encontrado.</p>";
        return;
      }
      // Vamos pegar os 10 primeiros e buscar a descrição do work para cada um
      const items = data.docs.slice(0, 10);

      // Extrai workKey de diferentes possíveis campos
      const extractWorkKey = (doc) => {
        if (doc.key && String(doc.key).startsWith("/works/")) return doc.key;
        if (doc.work_key && Array.isArray(doc.work_key) && doc.work_key.length)
          return doc.work_key[0];
        // Algumas versões podem expor 'key' sem /works/ prefix; deixar como fallback
        if (doc.key) return doc.key;
        return null;
      };

      // Buscar descrições em paralelo
      const descPromises = items.map((it) => {
        const wk = extractWorkKey(it);
        if (!wk) return Promise.resolve(null);
        return getWorkDescription(wk).catch(() => null);
      });

      const descriptions = await Promise.all(descPromises);

      items.forEach((book, idx) => {
        const desc = descriptions[idx];
        // normalizar descrição no objeto para o renderizador
        book.description =
          desc ||
          book.description ||
          book.first_sentence ||
          "Descrição não disponível";
        // normalizar autores para campo 'authors' usado pelo renderBookCard
        book.authors = book.author_name || book.authors || [];
        results.appendChild(renderBookCard(book));
      });
    } catch (error) {
      results.innerHTML = `<p style="color:red;">Erro na busca: ${error.message}</p>`;
    }
  });

  // permitir buscar ao pressionar Enter
  q.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btn.click();
  });
}
