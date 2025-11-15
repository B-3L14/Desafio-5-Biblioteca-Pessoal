// renderShelfItem.js - renderiza item da estante com controles de status
import {
  update,
  remove,
  setLoanStatus,
  renew,
  daysUntilOverdue,
} from "../services/storage.js";
import { notify } from "./notificationSystem.js";

export function renderShelfItem(book) {
  const el = document.createElement("div");
  el.className = "book-card";

  const loanDate = book.loanDate
    ? new Date(book.loanDate).toLocaleDateString()
    : "-";

  const daysLeft = daysUntilOverdue(book.loanDate, book.id);
  let statusColor = "#333";
  if (daysLeft !== null) {
    if (daysLeft < 0) statusColor = "#d32f2f"; // vermelho = vencido
    else if (daysLeft <= 1) statusColor = "#ff9800"; // laranja = aviso
  }

  el.innerHTML = `
    <img class="book-cover" src="${
      book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "../assets/img/placeholders/cover.png"
    }" alt="Capa">
    <div style="flex:1">
      <h4>${book.title}</h4>
      <p>${(book.authors || []).join(", ")}</p>
      <p><strong>Leitor:</strong> ${book.borrower || "—"}</p>
      <label>Leitura: 
        <select class="reading-select">
          <option value="Lendo">Lendo</option>
          <option value="Lido">Lido</option>
          <option value="Relendo">Relendo</option>
          <option value="Leitura Interrompida">Leitura Interrompida</option>
        </select>
      </label>
      <p>Empréstimo: <strong class="loan-status" style="color:${statusColor}">${
    book.loanStatus || "—"
  }</strong> (data: ${loanDate})
      ${
        daysLeft !== null
          ? `<span style="font-size:12px;color:${statusColor}"> - ${
              daysLeft > 0 ? daysLeft + " dias restantes" : "VENCIDO"
            }</span>`
          : ""
      }</p>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
        <button class="button return">Marcar Devolvido</button>
        <button class="button renew">Renovar</button>
        <button class="button remove">Remover</button>
      </div>
    </div>
  `;

  const readingSelect = el.querySelector(".reading-select");
  const loanStatusEl = el.querySelector(".loan-status");
  const btnReturn = el.querySelector(".return");
  const btnRenew = el.querySelector(".renew");
  const btnRemove = el.querySelector(".remove");

  // set current reading status
  readingSelect.value = book.readingStatus || "Lendo";

  // disable reading select if loan is Devolvido
  if (book.loanStatus === "Devolvido") {
    readingSelect.disabled = true;
    btnReturn.disabled = true;
  }

  readingSelect.addEventListener("change", (e) => {
    const newStatus = e.target.value;
    // don't allow change if Devolvido (extra guard)
    if (book.loanStatus === "Devolvido") {
      readingSelect.value = book.readingStatus;
      return;
    }
    const updated = update(book.id, { readingStatus: newStatus });
    if (updated) {
      book.readingStatus = updated.readingStatus;
      window.dispatchEvent(
        new CustomEvent("shelf:changed", {
          detail: { action: "update", item: updated },
        })
      );
    }
  });

  btnReturn.addEventListener("click", () => {
    // set loan status to Devolvido and apply reading rules in storage
    const updated = setLoanStatus(book.id, "Devolvido");
    if (updated) {
      loanStatusEl.textContent = updated.loanStatus;
      readingSelect.value = updated.readingStatus;
      readingSelect.disabled = true;
      btnReturn.disabled = true;
      btnRenew.disabled = true;
      // Limpar simulação de vencimento do sessionStorage
      const overdueLoanIds = JSON.parse(
        sessionStorage.getItem("overdue_loan_ids") || "[]"
      );
      const index = overdueLoanIds.indexOf(book.id);
      if (index > -1) {
        overdueLoanIds.splice(index, 1);
        sessionStorage.setItem(
          "overdue_loan_ids",
          JSON.stringify(overdueLoanIds)
        );
      }
      window.dispatchEvent(
        new CustomEvent("shelf:changed", {
          detail: { action: "update", item: updated },
        })
      );
      notify("Livro marcado como devolvido!", "success", 5000);
    }
  });

  btnRenew.addEventListener("click", () => {
    const result = renew(book.id);
    if (result.success) {
      notify(result.message, "success", 5000);
      // atualizar estado local do livro com os dados retornados
      book.loanDate = result.book.loanDate;
      book.loanStatus = result.book.loanStatus;
      book.readingStatus = result.book.readingStatus;

      // se foi reativado (empregado como novo empréstimo), habilitar controles
      if (book.loanStatus === "Emprestado") {
        readingSelect.disabled = false;
        btnReturn.disabled = false;
      }

      // atualizar a data/estado exibidos
      const newDate = book.loanDate
        ? new Date(book.loanDate).toLocaleDateString()
        : "-";
      const p = el.querySelector("p:nth-of-type(3)");
      if (p) {
        const newDays = daysUntilOverdue(book.loanDate, book.id);
        let color = "#333";
        if (newDays < 1) color = "#d32f2f";
        else if (newDays === 1) color = "#ff9800";
        p.innerHTML = `Empréstimo: <strong class="loan-status" style="color:${color}">${
          book.loanStatus
        }</strong> (data: ${newDate})
        <span style="font-size:12px;color:${color}"> - ${
          newDays > 0 ? newDays + " dias restantes" : "VENCIDO"
        }</span>`;
      }

      // atualizar select de leitura para o valor retornado
      readingSelect.value = book.readingStatus || "Lendo";

      window.dispatchEvent(
        new CustomEvent("shelf:changed", {
          detail: { action: "update", item: result.book },
        })
      );
    } else {
      notify(result.message, "error", 8000);
    }
  });

  btnRemove.addEventListener("click", () => {
    const ok = window.confirm(`Remover "${book.title}" da estante?`);
    if (!ok) return;
    remove(book.id);
    window.dispatchEvent(
      new CustomEvent("shelf:changed", {
        detail: { action: "remove", id: book.id },
      })
    );
    notify("Livro removido da estante!", "info", 4000);
  });

  return el;
}
