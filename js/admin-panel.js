/* ============================================================
   ADMIN-PANEL.JS — Painel de Leads
   ------------------------------------------------------------
   Mostra os participantes cadastrados. Combina:
   - Leads guardados no Google Sheets (se SHEET_WEBAPP_URL
     estiver configurada em js/google-sheets.js)
   - Backup local deste navegador (localStorage), usado como
     contingência enquanto o Sheets não está configurado, ou
     quando o envio remoto falhou no momento do cadastro.

   Requer que js/google-sheets.js seja carregado ANTES deste
   arquivo (ver ordem dos <script> em index.html).
   ============================================================ */

(function () {
  let currentLeads = [];   // cache da última lista renderizada
  let isLoading = false;

  function initAdminPanel() {
    const adminWrap     = document.getElementById("adminWrap");
    const closeBtn        = document.getElementById("adminCloseBtn");
    const searchInput        = document.getElementById("searchInput");
    const exportXlsBtn          = document.getElementById("exportXlsBtn");
    const exportCsvBtn             = document.getElementById("exportCsvBtn");
    const refreshBtn                  = document.getElementById("refreshLeadsBtn");
    const clearAllBtn                    = document.getElementById("clearAllBtn");

    if (!adminWrap) return;

    closeBtn.addEventListener("click", close);
    adminWrap.addEventListener("click", (e) => {
      if (e.target === adminWrap) close();
    });

    searchInput.addEventListener("input", () => renderTable(searchInput.value));
    refreshBtn.addEventListener("click", () => loadLeads(true));
    exportXlsBtn.addEventListener("click", exportExcel);
    exportCsvBtn.addEventListener("click", exportCSV);
    clearAllBtn.addEventListener("click", clearAll);

    function open() {
      adminWrap.classList.add("open");
      document.body.style.overflow = "hidden";
      loadLeads(false);
    }

    function close() {
      adminWrap.classList.remove("open");
      document.body.style.overflow = "";
    }

    /** Carrega leads do Sheets (se configurado) + backup local, e renderiza. */
    async function loadLeads(forceRefresh) {
      if (isLoading) return;
      isLoading = true;
      setStatus("loading");

      const localLeads = window.GoogleSheets.getLocalBackupLeads();
      const sheetsConfigured = window.GoogleSheets.isGoogleSheetsConfigured();

      if (!sheetsConfigured) {
        currentLeads = sortByDateDesc(localLeads);
        setStatus("not_configured");
        renderTable(searchInput.value);
        isLoading = false;
        return;
      }

      const result = await window.GoogleSheets.fetchLeadsFromGoogleSheets();

      if (result.ok) {
        currentLeads = sortByDateDesc(mergeLeads(result.leads, localLeads));
        setStatus("connected");
      } else {
        // Sheets configurado mas falhou agora — mostra ao menos o backup local
        currentLeads = sortByDateDesc(localLeads);
        setStatus("error");
      }

      renderTable(searchInput.value);
      isLoading = false;
    }

    /** Evita duplicar leads que já foram sincronizados nos dois lados. */
    function mergeLeads(remoteLeads, localLeads) {
      const remoteIds = new Set(remoteLeads.map((l) => l.id));
      const onlyLocal = localLeads.filter((l) => !remoteIds.has(l.id));
      return [...remoteLeads, ...onlyLocal];
    }

    function sortByDateDesc(leads) {
      return [...leads].sort((a, b) => {
        const dateA = new Date(a.dataCadastro || 0).getTime();
        const dateB = new Date(b.dataCadastro || 0).getTime();
        return dateB - dateA;
      });
    }

    function setStatus(state) {
      const el = document.getElementById("sheetsStatus");
      if (!el) return;

      const messages = {
        loading: { text: "Carregando leads…", cls: "warn" },
        not_configured: { text: "⚠️ Google Sheets não configurado — mostrando apenas backup local deste navegador.", cls: "warn" },
        connected: { text: "✅ Conectado ao Google Sheets — dados em tempo real.", cls: "ok" },
        error: { text: "⚠️ Não foi possível conectar ao Google Sheets agora — mostrando backup local.", cls: "warn" },
      };

      const info = messages[state];
      if (!info) { el.classList.remove("show"); return; }

      el.textContent = info.text;
      el.className = `sheets-status show ${info.cls}`;
    }

    function renderTable(query) {
      const normalizedQuery = (query || "").toLowerCase().trim();
      const filtered = normalizedQuery
        ? currentLeads.filter(
            (l) =>
              l.nomeCompleto.toLowerCase().includes(normalizedQuery) ||
              l.whatsapp.includes(normalizedQuery)
          )
        : currentLeads;

      const info = document.getElementById("leadsInfo");
      info.innerHTML = `<strong>${currentLeads.length}</strong> participante(s) no total${
        normalizedQuery ? ` · <strong>${filtered.length}</strong> encontrado(s)` : ""
      }`;

      const wrap = document.getElementById("tableWrap");

      if (!filtered.length) {
        wrap.innerHTML = `<div class="empty"><span>📋</span>${
          normalizedQuery ? "Nenhum resultado para esta busca." : "Nenhum participante cadastrado ainda."
        }</div>`;
        return;
      }

      const rows = filtered
        .map((lead, index) => {
          const endereco = formatAddress(lead);
          return `
            <tr>
              <td class="td-n">${index + 1}</td>
              <td><strong>${esc(lead.nomeCompleto)}</strong></td>
              <td class="td-wpp">${esc(lead.whatsapp)}</td>
              <td>${esc(lead.dataNascimento)}</td>
              <td>${esc(endereco)}</td>
              <td style="white-space:nowrap;color:var(--color-text-muted)">${esc(formatDate(lead.dataCadastro))}</td>
              <td><button class="btn-row-del" data-id="${esc(lead.id)}" title="Remover">✕</button></td>
            </tr>`;
        })
        .join("");

      wrap.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>#</th><th>Nome</th><th>WhatsApp</th><th>Nascimento</th><th>Endereço</th><th>Cadastrado em</th><th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

      wrap.querySelectorAll(".btn-row-del").forEach((btn) => {
        btn.addEventListener("click", () => deleteLead(btn.dataset.id));
      });
    }

    function deleteLead(id) {
      if (!confirm("Remover este participante da lista?")) return;

      // Remove do backup local (se existir lá). Se o lead só existe no
      // Google Sheets remoto, a remoção real deve ser feita na planilha —
      // aqui ocultamos apenas da visão atual para manter simplicidade e
      // evitar dar ao painel poder de escrita destrutiva na planilha.
      window.GoogleSheets.deleteLocalBackupLead(id);
      currentLeads = currentLeads.filter((l) => l.id !== id);
      renderTable(searchInput.value);
    }

    function clearAll() {
      if (!confirm("⚠️ Isso vai apagar o backup local deste navegador. Os dados já salvos na planilha do Google Sheets NÃO serão apagados. Continuar?")) {
        return;
      }
      window.GoogleSheets.clearLocalBackupLeads();
      loadLeads(true);
    }

    /* ---------- EXPORTAÇÃO ---------- */
    function leadsForExport() {
      return currentLeads.map((lead, index) => ({
        "#": index + 1,
        "Nome Completo": lead.nomeCompleto,
        WhatsApp: lead.whatsapp,
        "Data de Nascimento": lead.dataNascimento,
        Endereço: formatAddress(lead),
        "Cadastrado em": formatDate(lead.dataCadastro),
      }));
    }

    function stamp() {
      return new Date().toISOString().slice(0, 10).replace(/-/g, "");
    }

    function exportExcel() {
      const rows = leadsForExport();
      if (!rows.length) { alert("Nenhum participante para exportar."); return; }

      if (!window.XLSX) {
        alert("Não foi possível carregar a biblioteca de exportação. Verifique sua conexão e tente novamente.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 4 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 48 }, { wch: 22 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Participantes");
      XLSX.writeFile(wb, `leads_mais_esporte_${stamp()}.xlsx`);
    }

    function exportCSV() {
      const rows = leadsForExport();
      if (!rows.length) { alert("Nenhum participante para exportar."); return; }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(";"),
        ...rows.map((row) => headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(";")),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `leads_mais_esporte_${stamp()}.csv`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /* ---------- HELPERS ---------- */
    function formatAddress(lead) {
      const parts = [
        lead.logradouro && lead.numero ? `${lead.logradouro}, ${lead.numero}` : lead.logradouro,
        lead.complemento,
        lead.bairro,
        lead.cidade && lead.estado ? `${lead.cidade} - ${lead.estado}` : lead.cidade,
      ].filter(Boolean);
      return parts.length ? parts.join(", ") : "—";
    }

    function formatDate(isoString) {
      if (!isoString) return "—";
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleString("pt-BR");
    }

    function esc(value) {
      return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Exposto para o auth.js chamar após validar a senha
    window.AdminPanel = { open, close };
  }

  document.addEventListener("DOMContentLoaded", initAdminPanel);
})();
