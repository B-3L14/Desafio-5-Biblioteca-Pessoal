// storage.js - CRUD usando localStorage com regras de status e empréstimos
import { uid } from "../utils/helpers.js";

const KEY = "biblioteca_pessoal_books";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAll() {
  return read();
}

export function getById(id) {
  return read().find((b) => b.id === id) || null;
}

// adiciona um livro à estante. book é um objeto vindo da API; aqui normalizamos campos
export function save(book) {
  const books = read();
  const now = new Date().toISOString();
  const item = {
    id: book.id || uid(),
    title: book.title || "Sem título",
    authors: book.authors || book.author_name || [],
    cover_i: book.cover_i || null,
    description:
      book.description || book.first_sentence || "Descrição não disponível",
    // salvamos o nome de quem pegou o livro (se fornecido)
    borrower: book.borrower || book.borrowerName || null,
    readingStatus: book.readingStatus || "Lendo",
    loanStatus: book.loanStatus || "Emprestado",
    loanDate: book.loanDate || now,
    addedAt: now,
    raw: book,
  };
  books.push(item);
  write(books);
  return item;
}

export function remove(id) {
  const books = read().filter((b) => b.id !== id);
  write(books);
}

// Atualiza parcialmente um livro
export function update(id, patch) {
  const books = read();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const current = books[idx];
  // Se já está como Devolvido, leitura não pode ser alterada
  if (current.loanStatus === "Devolvido" && patch.readingStatus) {
    // ignorar alteração de leitura
    delete patch.readingStatus;
  }
  const updated = Object.assign({}, current, patch);
  books[idx] = updated;
  write(books);
  return updated;
}

// Define o status de empréstimo aplicando regras adicionais
export function setLoanStatus(id, status) {
  const books = read();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const book = books[idx];
  const oldLoan = book.loanStatus;
  book.loanStatus = status;
  // regras: se virar Devolvido, ajustar readingStatus conforme solicitado
  if (status === "Devolvido") {
    if (book.readingStatus === "Lendo")
      book.readingStatus = "Leitura Interrompida";
    else if (book.readingStatus === "Lido" || book.readingStatus === "Relendo")
      book.readingStatus = "Lido";
  }
  // se marcar Emprestado agora sem loanDate, definir loanDate
  if (status === "Emprestado" && !book.loanDate)
    book.loanDate = new Date().toISOString();
  // escrever de volta
  books[idx] = book;
  write(books);
  return book;
}

// Verifica empréstimos vencidos (mais de 7 dias desde loanDate) e atualiza para 'Em atraso'
export function checkOverdues() {
  const books = read();
  const now = new Date();
  let changed = false;
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    if (b.loanStatus === "Emprestado" && b.loanDate) {
      const loanTime = new Date(b.loanDate);
      const diff = now - loanTime; // ms
      const days = diff / (1000 * 60 * 60 * 24);
      if (days > 7) {
        b.loanStatus = "Em atraso";
        changed = true;
      }
    }
  }
  if (changed) write(books);
  return changed;
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

// Renova um empréstimo (reseta a data de devolução para 7 dias a partir de agora)
// Bloqueia se já estiver vencido (Em atraso)
export function renew(id) {
  const books = read();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return { success: false, message: "Livro não encontrado" };

  const book = books[idx];

  // Se status é "Em atraso", não permitir renovar
  if (book.loanStatus === "Em atraso") {
    return {
      success: false,
      message: `Não é possível renovar. O livro "${book.title}" está vencido (${book.loanStatus}). Por favor, devolva ou contate o administrador.`,
    };
  }
  // Caso o livro esteja marcado como "Devolvido", ao renovar devemos
  // reverter o livro para o estado de quando foi adicionado pela primeira vez:
  // - loanStatus = 'Emprestado'
  // - loanDate = agora (data de início do empréstimo)
  // - addedAt = agora
  // - readingStatus = 'Lendo' (padrão)
  // - borrower = usuário atual se disponível
  const now = new Date();

  if (book.loanStatus === "Devolvido") {
    book.loanStatus = "Emprestado";
    book.loanDate = now.toISOString();
    book.addedAt = now.toISOString();
    book.readingStatus = book.readingStatus || "Lendo";
    try {
      const user = localStorage.getItem("biblioteca_pessoal_user");
      if (user) book.borrower = user;
    } catch (e) {
      // localStorage pode falhar em ambientes restritos; ignorar nesse caso
    }
    // salvar e retornar
    books[idx] = book;
    write(books);
    return {
      success: true,
      message: `Livro "${book.title}" renovado e reativado como novo empréstimo.`,
      book: book,
    };
  }

  // Se estiver Emprestado, aplicar renovação tradicional (acrescentar prazo)
  if (book.loanStatus === "Emprestado") {
    const newDate = new Date(now);
    newDate.setDate(newDate.getDate() + (book.maxDaysAllowed || 7));
    book.loanDate = newDate.toISOString();
    books[idx] = book;
    write(books);
    return {
      success: true,
      message: `Empréstimo renovado com sucesso! Novo prazo: ${newDate.toLocaleDateString()}`,
      book: book,
    };
  }

  // Para outros status (ex.: null ou inesperados), não permitir renovação
  return {
    success: false,
    message: `Não é possível renovar. O livro não está em um estado renovável (status atual: ${book.loanStatus}).`,
  };
}

// Calcula quantos dias faltam até vencer (negativo = vencido)
// Verifica também se está em simulação de vencimento (sessionStorage)
export function daysUntilOverdue(loanDate, bookId) {
  // Verificar se está em simulação de vencimento
  if (bookId) {
    const overdueLoanIds = JSON.parse(
      sessionStorage.getItem("overdue_loan_ids") || "[]"
    );
    if (overdueLoanIds.includes(bookId)) {
      return -1; // retorna -1 para indicar vencido (simulado)
    }
  }

  if (!loanDate) return null;
  const loan = new Date(loanDate);
  const dueDate = new Date(loan);
  dueDate.setDate(dueDate.getDate() + 7); // 7 dias de prazo
  const now = new Date();
  const diff = dueDate - now; // ms
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
