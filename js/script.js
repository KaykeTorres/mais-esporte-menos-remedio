/* ============================================================
   SCRIPT.JS — Orquestrador principal do formulário
   ============================================================ */

function initForm() {
  const V = window.Validations;

  const form          = document.getElementById("leadForm");
  const inputName       = document.getElementById("nomeCompleto");
  const inputPhone       = document.getElementById("whatsapp");
  const inputBirth         = document.getElementById("dataNascimento");
  const addressPanel         = document.getElementById("addressPanel");
  const inputStreet             = document.getElementById("logradouro");
  const inputNumber               = document.getElementById("numero");
  const inputComplement             = document.getElementById("complemento");
  const inputCEP                       = document.getElementById("cep");
  const inputNeighborhood                 = document.getElementById("bairro");
  const inputCity                           = document.getElementById("cidade");
  const inputState                            = document.getElementById("estado");
  const termsCheckbox                          = document.getElementById("termsCheckbox");
  const termsError                                = document.getElementById("termsError");
  const submitBtn                                   = document.getElementById("submitBtn");
  const successBox                                    = document.getElementById("successBox");
  const errorBanner                                     = document.getElementById("errorBanner");

  if (!form) return;

  /* ---------- MÁSCARAS EM TEMPO REAL ---------- */
  inputPhone.addEventListener("input", (e) => {
    e.target.value = V.maskPhoneBR(e.target.value);
  });

  inputBirth.addEventListener("input", (e) => {
    e.target.value = V.maskDate(e.target.value);
  });

  inputCEP.addEventListener("input", (e) => {
    e.target.value = V.maskCEP(e.target.value);
  });

  /* ---------- VALIDAÇÃO EM TEMPO REAL (on blur) ---------- */
  inputName.addEventListener("blur", () =>
    V.validateField(inputName, V.isValidName, "Informe nome e sobrenome.")
  );
  inputPhone.addEventListener("blur", () =>
    V.validateField(inputPhone, V.isValidPhoneBR, "Informe um WhatsApp válido.")
  );
  inputBirth.addEventListener("blur", () =>
    V.validateField(inputBirth, V.isValidDateBR, "Informe uma data válida (DD/MM/AAAA).")
  );

  [inputStreet, inputNumber, inputCEP, inputNeighborhood, inputCity, inputState].forEach((field) => {
    if (!field) return;
    field.addEventListener("blur", () => {
      const validator = field === inputCEP ? V.isValidCEP : V.isNotEmpty;
      const message = field === inputCEP ? "CEP inválido." : "Campo obrigatório.";
      V.validateField(field, validator, message);
      if (window.refreshAddressAccordionHeight) window.refreshAddressAccordionHeight();
    });
  });

  /* ---------- CHECKBOX DE TERMOS ---------- */
  termsCheckbox.addEventListener("change", () => {
    if (termsCheckbox.checked) termsError.classList.remove("show");
  });

  /* ---------- SUBMIT ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBanner.classList.remove("show");

    const addressIsOpen = addressPanel.classList.contains("open");

    const validations = [
      V.validateField(inputName, V.isValidName, "Informe nome e sobrenome."),
      V.validateField(inputPhone, V.isValidPhoneBR, "Informe um WhatsApp válido."),
      V.validateField(inputBirth, V.isValidDateBR, "Informe uma data válida (DD/MM/AAAA)."),
    ];

    // Campos de endereço só são obrigatórios se o accordion estiver aberto
    // (ou seja, se o usuário optou por preencher o endereço).
    if (addressIsOpen) {
      validations.push(
        V.validateField(inputStreet, V.isNotEmpty, "Campo obrigatório."),
        V.validateField(inputNumber, V.isNotEmpty, "Campo obrigatório."),
        V.validateField(inputCEP, V.isValidCEP, "CEP inválido."),
        V.validateField(inputNeighborhood, V.isNotEmpty, "Campo obrigatório."),
        V.validateField(inputCity, V.isNotEmpty, "Campo obrigatório."),
        V.validateField(inputState, V.isNotEmpty, "Campo obrigatório.")
        // Complemento é o único campo opcional — não validado.
      );
    }

    const termsAccepted = termsCheckbox.checked;
    termsError.classList.toggle("show", !termsAccepted);

    const allValid = validations.every(Boolean) && termsAccepted;

    if (!allValid) {
      // Rola a tela até o primeiro campo com erro, para facilitar a correção
      const firstError = form.querySelector(".field.err, .terms-error.show");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    await submitLead();
  });

  async function submitLead() {
    setLoading(true);

    const leadData = {
      nomeCompleto: inputName.value.trim(),
      whatsapp: inputPhone.value.trim(),
      dataNascimento: inputBirth.value.trim(),
      logradouro: inputStreet.value.trim(),
      numero: inputNumber.value.trim(),
      complemento: inputComplement.value.trim(),
      cep: inputCEP.value.trim(),
      bairro: inputNeighborhood.value.trim(),
      cidade: inputCity.value.trim(),
      estado: inputState.value.trim(),
    };

    try {
      const result = await window.GoogleSheets.sendLeadToGoogleSheets(leadData);
      setLoading(false);

      if (result.ok) {
        showSuccess();
        form.reset();
        resetFieldStates();
      } else {
        showError(result.message);
      }
    } catch (err) {
      setLoading(false);
      showError("Ocorreu um erro inesperado. Tente novamente.");
    }
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle("loading", isLoading);
    submitBtn.disabled = isLoading;
  }

  function showSuccess() {
    successBox.textContent = "Cadastro realizado com sucesso! Obrigado por participar.";
    successBox.classList.add("show");
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => successBox.classList.remove("show"), 6000);
  }

  function showError(message) {
    errorBanner.textContent = message || "Não foi possível enviar seu cadastro. Tente novamente.";
    errorBanner.classList.add("show");
  }

  function resetFieldStates() {
    form.querySelectorAll(".field.err").forEach((f) => f.classList.remove("err"));
    form.querySelectorAll("input.valid").forEach((f) => f.classList.remove("valid"));
  }
}

document.addEventListener("DOMContentLoaded", initForm);
