/* ============================================================
   VALIDATIONS.JS — Máscaras e validações de campos
   ============================================================ */

/* ---------- MÁSCARAS ---------- */

/** Aplica máscara de celular brasileiro: (11) 99999-9999 */
function maskPhoneBR(value) {
  let digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Aplica máscara de CEP brasileiro: 00000-000 */
function maskCEP(value) {
  let digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Aplica máscara de data: DD/MM/AAAA */
function maskDate(value) {
  let digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/* ---------- VALIDADORES ---------- */

function isValidName(value) {
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.includes(" ");
}

function isValidPhoneBR(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function isValidDateBR(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd), month = Number(mm), year = Number(yyyy);

  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  const date = new Date(year, month - 1, day);
  const today = new Date();
  if (date > today) return false;          // não permite data futura
  if (year < 1900) return false;

  return true;
}

function isValidCEP(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 8;
}

function isNotEmpty(value) {
  return value.trim().length > 0;
}

/* ---------- MOTOR DE VALIDAÇÃO DE CAMPO ÚNICO ---------- */

/**
 * Valida um campo e atualiza visualmente (classe .err / .valid / mensagem).
 * @param {HTMLInputElement|HTMLSelectElement} input
 * @param {Function} validatorFn   função que recebe o valor e retorna boolean
 * @param {string} errorMessage    mensagem exibida quando inválido
 * @returns {boolean} se o campo é válido
 */
function validateField(input, validatorFn, errorMessage) {
  const fieldWrap = input.closest(".field");
  const errorEl = fieldWrap ? fieldWrap.querySelector(".field-err") : null;
  const isValid = validatorFn(input.value);

  if (fieldWrap) fieldWrap.classList.toggle("err", !isValid);
  input.classList.toggle("valid", isValid && input.value.trim() !== "");
  if (errorEl && !isValid) errorEl.textContent = errorMessage;

  return isValid;
}

/* ---------- BUSCA DE CEP (ViaCEP) ---------- */

/**
 * Busca o endereço pelo CEP usando a API pública do ViaCEP.
 * Preenche automaticamente: logradouro, bairro, cidade e estado.
 * @param {string} cepValue   valor do campo CEP (pode ter máscara)
 */
async function fetchAddressByCEP(cepValue) {
  const digits = cepValue.replace(/\D/g, "");
  if (digits.length !== 8) return;

  const cepInput    = document.getElementById("cep");
  const loading     = document.getElementById("cepLoading");
  const logradouro  = document.getElementById("logradouro");
  const bairro      = document.getElementById("bairro");
  const cidade      = document.getElementById("cidade");
  const estado      = document.getElementById("estado");

  // Mostra indicador de carregamento
  if (loading) { loading.style.display = "block"; }
  const checkEl = cepInput ? cepInput.nextElementSibling : null;
  if (checkEl && checkEl.classList.contains("check")) checkEl.style.opacity = "0";

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!resp.ok) throw new Error("Erro na resposta");

    const data = await resp.json();

    if (data.erro) {
      // CEP não encontrado
      const fieldWrap = cepInput ? cepInput.closest(".field") : null;
      if (fieldWrap) fieldWrap.classList.add("err");
      const errEl = fieldWrap ? fieldWrap.querySelector(".field-err") : null;
      if (errEl) errEl.textContent = "CEP não encontrado.";
      return;
    }

    // Preenche os campos automaticamente
    function fillField(input, value) {
      if (!input) return;
      input.value = value || "";
      if (value) {
        input.classList.add("valid");
        const wrap = input.closest(".field");
        if (wrap) wrap.classList.remove("err");
      }
    }

    fillField(logradouro, data.logradouro);
    fillField(bairro,     data.bairro);
    fillField(cidade,     data.localidade);

    // Seleciona o estado no <select>
    if (estado && data.uf) {
      estado.value = data.uf;
      if (estado.value) {
        estado.classList.add("valid");
        const wrap = estado.closest(".field");
        if (wrap) wrap.classList.remove("err");
      }
    }

    // Marca CEP como válido
    if (cepInput) {
      cepInput.classList.add("valid");
      const wrap = cepInput.closest(".field");
      if (wrap) wrap.classList.remove("err");
    }

    // Foca no campo Número para o usuário completar
    const numeroInput = document.getElementById("numero");
    if (numeroInput) setTimeout(() => numeroInput.focus(), 100);

    // Atualiza altura do accordion (se estiver aberto)
    if (window.refreshAddressAccordionHeight) window.refreshAddressAccordionHeight();

  } catch (err) {
    console.warn("[validations.js] Não foi possível buscar o CEP:", err);
  } finally {
    if (loading) loading.style.display = "none";
  }
}

/**
 * Inicializa o listener de auto-preenchimento no campo CEP.
 * Chamado automaticamente ao carregar o DOM.
 */
function initCEPAutoFill() {
  const cepInput = document.getElementById("cep");
  if (!cepInput) return;

  cepInput.addEventListener("input", (e) => {
    e.target.value = maskCEP(e.target.value);
    const digits = e.target.value.replace(/\D/g, "");
    // Dispara a busca assim que os 8 dígitos estiverem completos
    if (digits.length === 8) {
      fetchAddressByCEP(e.target.value);
    }
  });

  // Também busca ao sair do campo (blur), caso o usuário cole um CEP
  cepInput.addEventListener("blur", (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 8) {
      fetchAddressByCEP(e.target.value);
    }
  });
}

document.addEventListener("DOMContentLoaded", initCEPAutoFill);

/* Exposto globalmente para uso em script.js e accordion.js */
window.Validations = {
  maskPhoneBR,
  maskCEP,
  maskDate,
  isValidName,
  isValidPhoneBR,
  isValidDateBR,
  isValidCEP,
  isNotEmpty,
  validateField,
  fetchAddressByCEP,
};
