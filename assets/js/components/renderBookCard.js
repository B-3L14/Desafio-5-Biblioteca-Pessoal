// renderBookCard.js - renderiza cartão de livro para resultados
import { coverUrl } from "../api/openLibrary.js";
import { save, getById } from "../services/storage.js";

export function renderBookCard(book) {
  const el = document.createElement("div");
  el.className = "book-card";

  // Extrair descrição (pode estar em diferentes campos)
  const description =
    book.description || book.first_sentence || "Sem descrição disponível";
  // Limitar a descrição a 150 caracteres + "..."
  const shortDesc =
    typeof description === "string"
      ? description.length > 150
        ? description.substring(0, 150) + "..."
        : description
      : "Sem descrição disponível";

  el.innerHTML = `
    <img class="book-cover" src="${coverUrl(book.cover_i)}" alt="Capa">
    <div style="flex: 1;">
      <h3>${book.title}</h3>
      <p><strong>Autores:</strong> ${(
        book.authors ||
        book.author_name || ["Desconhecido"]
      ).join(", ")}</p>
      <p><strong>Descrição:</strong> ${shortDesc}</p>
      <button class="button add">Adicionar</button>
    </div>
  `;

  // gerar um id estável para o livro (preferir work key / edition / isbn)
  let stableId =
    book.key ||
    (book.edition_key && book.edition_key[0]) ||
    book.cover_edition_key ||
    (book.isbn && book.isbn[0]) ||
    null;

  // Padronizar stableId removendo prefixos como '/works/' para consistência
  if (stableId && typeof stableId === "string") {
    stableId = stableId.replace(/^\/works\//, "");
  }

  // evento adicionar: cria item na estante com loanStatus = 'Emprestado'
  const btn = el.querySelector(".add");

  // Se já existe na estante, desabilitar o botão
  try {
    if (stableId && getById(stableId)) {
      btn.textContent = "Adicionado";
      btn.disabled = true;
    }
  } catch (e) {
    // ignore
  }
  btn.addEventListener("click", () => {
    // obter usuário atual do localStorage (definido no index)
    const borrower = localStorage.getItem("biblioteca_pessoal_user") || null;
    if (!borrower) {
      return alert(
        'Defina seu nome na página inicial antes de adicionar livros (campo "Seu nome").'
      );
    }
    // normalizar authors para campo 'authors' e usar stableId como id se disponível
    const item = {
      id: stableId || undefined,
      title: book.title,
      authors: book.authors || book.author_name || [],
      cover_i: book.cover_i || null,
      description:
        typeof book.description === "string"
          ? book.description
          : book.first_sentence || "Descrição não disponível",
      // salvar o nome de quem pegou
      borrower: borrower,
      // readingStatus default assumido como 'Lendo'
      readingStatus: "Lendo",
      loanStatus: "Emprestado",
      loanDate: new Date().toISOString(),
      raw: book,
    };
    const saved = save(item);
    btn.textContent = "Adicionado";
    btn.disabled = true;
    // notificar lista para atualizar
    window.dispatchEvent(
      new CustomEvent("shelf:changed", {
        detail: { action: "add", item: saved },
      })
    );
  });
  return el;
}
