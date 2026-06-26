/* ============================================================
   GOOGLE-SHEETS.JS — Integração com Google Sheets (Apps Script)
   ------------------------------------------------------------
   COMO CONFIGURAR (veja o passo a passo completo no README.md):

   1. Crie uma planilha no Google Sheets.
   2. Vá em Extensões → Apps Script e cole o código do arquivo
      "apps-script.gs" (fornecido junto a este projeto).
   3. Publique como "Implantação" → "App da Web", com acesso
      "Qualquer pessoa" e execução "Eu" (sua conta).
   4. Copie a URL gerada (termina em /exec) e cole abaixo em
      SHEET_WEBAPP_URL.

   Enquanto SHEET_WEBAPP_URL não for configurada, o formulário
   continua funcionando normalmente, mas os dados ficam apenas
   guardados localmente (localStorage) como contingência, e o
   console mostrará um aviso amigável.
   ============================================================ */

// 🔗 Cole aqui a URL do seu Apps Script Web App (termina em /exec)
const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby-l8Fmde8k3n1zVD84dBUbO27yaRMNK0_nAIa4b3m4Ybb0-bJnHLXt5B1OjG00X3jV/exec";

const LOCAL_BACKUP_KEY = "maisEsporte_leadsBackup";

/**
 * Envia os dados do lead para o Google Sheets.
 * @param {Object} leadData - dados já validados do formulário
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function sendLeadToGoogleSheets(leadData) {
  const payload = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dataCadastro: new Date().toISOString(),
    nomeCompleto: leadData.nomeCompleto,
    whatsapp: leadData.whatsapp,
    dataNascimento: leadData.dataNascimento,
    logradouro: leadData.logradouro || "",
    numero: leadData.numero || "",
    complemento: leadData.complemento || "",
    cep: leadData.cep || "",
    bairro: leadData.bairro || "",
    cidade: leadData.cidade || "",
    estado: leadData.estado || "",
  };

  // Sempre guarda um backup local, mesmo que o envio remoto funcione.
  saveLocalBackup(payload);

  if (!SHEET_WEBAPP_URL) {
    console.warn(
      "[google-sheets.js] SHEET_WEBAPP_URL não configurada. " +
      "Os dados foram salvos apenas localmente (backup). " +
      "Veja o README.md para conectar ao Google Sheets."
    );
    return { ok: true, message: "Salvo localmente (Google Sheets não configurado ainda)." };
  }

  try {
    // mode: "no-cors" é necessário porque o Apps Script Web App não
    // devolve cabeçalhos CORS explícitos para todas as configurações.
    // Isso significa que não conseguimos LER a resposta, mas o POST
    // é processado normalmente do lado do Google.
    await fetch(SHEET_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    return { ok: true, message: "Dados enviados ao Google Sheets com sucesso." };
  } catch (err) {
    console.error("[google-sheets.js] Falha ao enviar para o Google Sheets:", err);
    return {
      ok: false,
      message: "Não foi possível conectar ao Google Sheets. Dados preservados localmente.",
    };
  }
}

function saveLocalBackup(payload) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]");
    existing.push(payload);
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn("[google-sheets.js] Não foi possível salvar backup local:", err);
  }
}

/** Usado pelo admin para recuperar os backups locais deste navegador */
function getLocalBackupLeads() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || "[]");
  } catch (err) {
    return [];
  }
}

function deleteLocalBackupLead(id) {
  try {
    const existing = getLocalBackupLeads();
    const filtered = existing.filter((lead) => lead.id !== id);
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("[google-sheets.js] Não foi possível remover backup local:", err);
  }
}

function clearLocalBackupLeads() {
  try {
    localStorage.removeItem(LOCAL_BACKUP_KEY);
  } catch (err) {
    console.warn("[google-sheets.js] Não foi possível limpar backup local:", err);
  }
}

/**
 * Busca os leads diretamente da planilha do Google Sheets (via Apps Script).
 * Requer que SHEET_WEBAPP_URL esteja configurada e que o apps-script.gs
 * tenha a função doGet() (já incluída no apps-script.gs deste projeto).
 * @returns {Promise<{ok: boolean, leads: Array, message?: string}>}
 */
async function fetchLeadsFromGoogleSheets() {
  if (!SHEET_WEBAPP_URL) {
    return { ok: false, leads: [], message: "not_configured" };
  }

  try {
    const response = await fetch(`${SHEET_WEBAPP_URL}?action=list`, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const leads = Array.isArray(data.leads) ? data.leads : [];
    return { ok: true, leads };
  } catch (err) {
    console.error("[google-sheets.js] Falha ao buscar leads do Google Sheets:", err);
    return { ok: false, leads: [], message: "fetch_error" };
  }
}

/** Indica, de forma simples, se a integração com o Sheets está configurada. */
function isGoogleSheetsConfigured() {
  return Boolean(SHEET_WEBAPP_URL);
}

window.GoogleSheets = {
  sendLeadToGoogleSheets,
  getLocalBackupLeads,
  deleteLocalBackupLead,
  clearLocalBackupLeads,
  fetchLeadsFromGoogleSheets,
  isGoogleSheetsConfigured,
};
