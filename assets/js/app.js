// app.js - inicialização geral
document.addEventListener("DOMContentLoaded", () => {
  // Carregamento inicial (página index pode delegar a pages)
  console.log("Biblioteca Pessoal inicializada");
  // Inicializa controle simples de usuário (salva nome no localStorage)
  const userInput = document.getElementById("user-name");
  const saveBtn = document.getElementById("save-user");
  const currentSpan = document.getElementById("current-user");
  if (userInput && saveBtn && currentSpan) {
    const KEY = "biblioteca_pessoal_user";
    const load = () => {
      const v = localStorage.getItem(KEY);
      currentSpan.textContent = v
        ? `Usuário atual: ${v}`
        : "Nenhum usuário salvo";
      if (v) userInput.value = v;
    };
    load();
    saveBtn.addEventListener("click", () => {
      const name = (userInput.value || "").trim();
      if (!name) return alert("Digite um nome válido");
      localStorage.setItem(KEY, name);
      load();
      window.dispatchEvent(
        new CustomEvent("user:changed", { detail: { name } })
      );
    });
  }
});
