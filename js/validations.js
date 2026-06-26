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
};
