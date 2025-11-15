// notificationSystem.js - Gerenciador de notificações em tela
// Cria notificações toast/banner no topo da tela com auto-dismiss

const containerClass = "notification-container";
const notificationClass = "notification";

function ensureContainer() {
  let c = document.querySelector(`.${containerClass}`);
  if (!c) {
    c = document.createElement("div");
    c.className = containerClass;
    c.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      max-width: 400px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(c);
  }
  return c;
}

export function notify(message, type = "info", duration = 5000) {
  const container = ensureContainer();
  const el = document.createElement("div");
  el.className = notificationClass;

  // Cores por tipo
  const colors = {
    info: "#2b7a78",
    warning: "#ff9800",
    error: "#d32f2f",
    success: "#388e3c",
  };

  el.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    font-size: 14px;
    line-height: 1.4;
  `;

  el.textContent = message;
  container.appendChild(el);

  if (duration > 0) {
    setTimeout(() => {
      el.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return el;
}

export function clear() {
  const container = document.querySelector(`.${containerClass}`);
  if (container) container.innerHTML = "";
}

// Injetar estilos de animação
export function initStyles() {
  if (!document.querySelector("style[data-notification]")) {
    const style = document.createElement("style");
    style.setAttribute("data-notification", "true");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
