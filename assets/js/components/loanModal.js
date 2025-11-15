// loanModal.js - controle de modal para empréstimo
export function openLoanModal(book) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<div class="content"><h3>Emprestar: ${book.title}</h3><p>Nome do amigo: <input id="friend"/></p><button id="ok" class="button">Confirmar</button> <button id="close">Fechar</button></div>`;
  modal.querySelector("#close").addEventListener("click", () => modal.remove());
  modal.querySelector("#ok").addEventListener("click", () => {
    // lógica mínima - em produção salvar histórico
    modal.remove();
    alert("Empréstimo registrado (exemplo)");
  });
  document.body.appendChild(modal);
}
