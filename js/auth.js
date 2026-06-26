/* ============================================================
   AUTH.JS — Acesso por senha ao Painel de Leads
   ------------------------------------------------------------
   O FORMULÁRIO É PÚBLICO. Esta senha protege apenas o painel
   administrativo (lista de leads), aberto pela engrenagem (FAB)
   no canto inferior direito da tela.

   COMO TROCAR A SENHA:
   Edite apenas a constante ACCESS_PASSWORD abaixo.
   ============================================================ */

// 🔑 SENHA DE ACESSO AO PAINEL — troque o valor entre aspas para alterar
const ACCESS_PASSWORD = "hato15";

// Tempo (em ms) que o acesso ao painel permanece liberado no navegador,
// sem precisar digitar a senha de novo. 0 = sempre pedir a senha.
const SESSION_DURATION_MS = 1000 * 60 * 60 * 4; // 4 horas

const SESSION_KEY = "maisEsporte_adminSession";

function initAuth() {
  const fab          = document.getElementById("adminFab");
  const pwOverlay     = document.getElementById("pwOverlay");
  const pwForm          = document.getElementById("pwForm");
  const pwInput           = document.getElementById("pwInput");
  const pwError              = document.getElementById("pwError");
  const pwCancelBtn             = document.getElementById("pwCancelBtn");

  if (!fab || !pwOverlay) return;

  fab.addEventListener("click", () => {
    if (hasValidSession()) {
      openAdminPanel();
    } else {
      openPasswordModal();
    }
  });

  pwForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const typed = pwInput.value.trim();

    if (typed === ACCESS_PASSWORD) {
      grantSession();
      closePasswordModal();
      openAdminPanel();
    } else {
      showError();
    }
  });

  pwCancelBtn.addEventListener("click", closePasswordModal);

  pwOverlay.addEventListener("click", (e) => {
    if (e.target === pwOverlay) closePasswordModal();
  });

  function openPasswordModal() {
    pwOverlay.classList.add("open");
    pwInput.value = "";
    pwError.classList.remove("show");
    setTimeout(() => pwInput.focus(), 120);
  }

  function closePasswordModal() {
    pwOverlay.classList.remove("open");
  }

  function showError() {
    pwError.classList.add("show");
    pwInput.classList.add("shake");
    pwInput.value = "";
    pwInput.focus();
    setTimeout(() => pwInput.classList.remove("shake"), 400);
  }

  function openAdminPanel() {
    if (window.AdminPanel) window.AdminPanel.open();
  }

  function grantSession() {
    if (SESSION_DURATION_MS > 0) {
      const expiry = Date.now() + SESSION_DURATION_MS;
      try {
        sessionStorage.setItem(SESSION_KEY, String(expiry));
      } catch (err) {
        /* sessionStorage pode falhar em modos privados — segue sem persistir */
      }
    }
  }

  function hasValidSession() {
    try {
      const expiry = sessionStorage.getItem(SESSION_KEY);
      return expiry && Date.now() < Number(expiry);
    } catch (err) {
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAuth);
