// shelf.js - lógica da estante pessoal
import {
  getAll,
  remove,
  checkOverdues,
  daysUntilOverdue,
} from "../services/storage.js";
import { renderShelfItem } from "../components/renderShelfItem.js";
import { notify, initStyles } from "../components/notificationSystem.js";

export function initShelf(root) {
  // Inicializar estilos de notificação
  initStyles();

  // Limpar sessionStorage de simulação de vencimento ao carregar a página
  sessionStorage.removeItem("overdue_loan_ids");

  root.innerHTML = `
    <div class="shelf-header">
      <h2>Minha Estante</h2>
      <button id="export-csv" class="button">Exportar CSV</button>
    </div>
    <div id="shelf-list"></div>
  `;
  const list = root.querySelector("#shelf-list");
  const btnExport = root.querySelector("#export-csv");

  // exportar estante como CSV
  function exportShelfToCSV() {
    const books = getAll();
    if (!books || !books.length) {
      notify("Nenhum livro para exportar.", "info", 4000);
      return;
    }

    // Cabeçalhos CSV
    const headers = [
      "id",
      "title",
      "authors",
      "borrower",
      "readingStatus",
      "loanStatus",
      "loanDate",
      "addedAt",
      "description",
    ];

    const escape = (value) => {
      if (value === null || value === undefined) return "";
      const s = String(value).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = [headers.join(",")];
    books.forEach((b) => {
      const row = [
        escape(b.id),
        escape(b.title),
        // authors array -> string
        escape((b.authors || []).join("; ")),
        escape(b.borrower || ""),
        escape(b.readingStatus || ""),
        escape(b.loanStatus || ""),
        escape(b.loanDate || ""),
        escape(b.addedAt || ""),
        escape(b.description || ""),
      ];
      rows.push(row.join(","));
    });

    // UTF-8 BOM to help Excel detect encoding
    const csvContent = `\uFEFF${rows.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    const filename = `estante_export_${now
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(`Estante exportada: ${filename}`, "success", 4000);
  }

  if (btnExport) btnExport.addEventListener("click", exportShelfToCSV);

  function refresh() {
    // antes de listar, verificar empréstimos vencidos e aplicar mudanças
    checkOverdues();
    list.innerHTML = "";
    const books = getAll();
    if (!books.length) {
      list.innerHTML = "<p>Estante vazia. Adicione livros pela busca.</p>";
      return;
    }

    // Gerar notificações de aviso para empréstimos
    books.forEach((b) => {
      const userName = b.borrower || "Usuário";

      // Se o livro está como 'Em atraso', exibir imediatamente notificação de vencido
      if (b.loanStatus === "Em atraso") {
        notify(
          `${userName} seu livro "${b.title}" está VENCIDO! Por favor, devolva imediatamente.`,
          "error",
          0 // não descartar automaticamente
        );
        return;
      }

      // Se o livro ainda está emprestado, verificar dias restantes
      if (b.loanStatus === "Emprestado" && b.loanDate) {
        const daysLeft = daysUntilOverdue(b.loanDate, b.id);

        if (daysLeft <= 0) {
          // Já vencido (ainda marcado como Emprestado)
          notify(
            `${userName} seu livro "${b.title}" está VENCIDO! Por favor, devolva imediatamente.`,
            "error",
            0
          );
        } else if (daysLeft === 1) {
          // 1 dia para vencer
          notify(
            `${userName} seu livro "${b.title}" está a 1 dia do vencimento. Por favor, devolva ou renove!`,
            "warning",
            8000
          );
        }
      }
    });

    books.forEach((b) => list.appendChild(renderShelfItem(b)));
  }

  // ouvinte para atualizações vindas de componentes (add/update/remove)
  const onChange = (e) => {
    refresh();
  };
  window.addEventListener("shelf:changed", onChange);

  // Checagem periódica de emprestimos vencidos (a cada 1 minuto neste demo)
  const intervalId = setInterval(() => {
    const changed = checkOverdues();
    if (changed) refresh();
  }, 60 * 1000);

  // limpar listeners se necessário (não usado aqui, mas boa prática)
  // retornar função de cleanup
  refresh();
  return () => {
    window.removeEventListener("shelf:changed", onChange);
    clearInterval(intervalId);
  };
}
