/* ============================================================
   ACCORDION.JS — Abre/fecha a seção de endereço suavemente
   ============================================================ */

function initAddressAccordion() {
  const toggleBtn = document.getElementById("toggleAddressBtn");
  const panel     = document.getElementById("addressPanel");

  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.contains("open");

    if (isOpen) {
      collapse();
    } else {
      expand();
    }
  });

  function expand() {
    panel.classList.add("open");
    panel.style.maxHeight = panel.scrollHeight + "px";
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.querySelector(".toggle-text").textContent = "Ocultar endereço";

    // Recalcula a altura quando as transições internas terminam
    // (ex.: ao corrigir erros que mudam a altura do bloco)
    panel.addEventListener("transitionend", syncHeightOnce, { once: true });
  }

  function collapse() {
    panel.style.maxHeight = panel.scrollHeight + "px"; // garante valor atual antes de animar para 0
    requestAnimationFrame(() => {
      panel.style.maxHeight = "0px";
    });
    panel.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.querySelector(".toggle-text").textContent = "Adicionar Endereço";
  }

  function syncHeightOnce() {
    if (panel.classList.contains("open")) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  }

  // Permite que outros scripts (ex.: validations) re-sincronizem a altura
  // quando mensagens de erro aparecem/desaparecem dentro do painel.
  window.refreshAddressAccordionHeight = function () {
    if (panel.classList.contains("open")) {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  };
}

document.addEventListener("DOMContentLoaded", initAddressAccordion);
