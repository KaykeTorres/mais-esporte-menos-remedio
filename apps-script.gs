/* ============================================================
   APPS-SCRIPT.GS
   ------------------------------------------------------------
   Este código NÃO faz parte do projeto web. Ele deve ser colado
   dentro do editor do Google Apps Script, vinculado à sua
   planilha do Google Sheets.

   PASSO A PASSO — veja também o README.md do projeto:

   1. Crie uma planilha em https://sheets.google.com
   2. Na primeira linha, crie estes cabeçalhos (colunas A até L):
      ID | Data Cadastro | Nome Completo | WhatsApp | Data Nascimento |
      Logradouro | Número | Complemento | CEP | Bairro | Cidade | Estado

   3. No menu da planilha, vá em: Extensões → Apps Script
   4. Apague o conteúdo padrão (function myFunction(){}) e cole
      todo o código abaixo.
   5. Clique em "Implantar" → "Nova implantação".
   6. Em "Tipo", selecione "App da Web".
   7. Configure:
        Executar como: Eu (seu e-mail)
        Quem pode acessar: Qualquer pessoa
   8. Clique em "Implantar" e autorize as permissões solicitadas.
   9. Copie a URL gerada (termina em /exec).
   10. Cole essa URL na constante SHEET_WEBAPP_URL, dentro do
       arquivo js/google-sheets.js do projeto web.

   IMPORTANTE: sempre que editar este código depois de já ter
   implantado, use "Implantar → Gerenciar implantações → editar
   (ícone de lápis) → Nova versão" para que as mudanças entrem
   em vigor na URL já publicada.
   ============================================================ */

/** Recebe os dados enviados pelo formulário e grava na planilha. */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.id || ("srv_" + new Date().getTime()),
      data.dataCadastro || new Date().toISOString(),
      data.nomeCompleto || "",
      data.whatsapp || "",
      data.dataNascimento || "",
      data.logradouro || "",
      data.numero || "",
      data.complemento || "",
      data.cep || "",
      data.bairro || "",
      data.cidade || "",
      data.estado || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Usado pelo painel de leads (engrenagem do site) para LER os dados.
 * Chamado como: SUA_URL_DO_SCRIPT?action=list
 */
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;

  if (action === "list") {
    return listLeads();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", message: "Apps Script está funcionando." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listLeads() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var leads = [];

    // Pula a primeira linha (cabeçalho)
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (!r[2]) continue; // pula linhas sem nome (vazias)

      leads.push({
        id: String(r[0] || ("row_" + i)),
        dataCadastro: r[1] ? new Date(r[1]).toISOString() : "",
        nomeCompleto: r[2] || "",
        whatsapp: r[3] || "",
        dataNascimento: r[4] || "",
        logradouro: r[5] || "",
        numero: r[6] || "",
        complemento: r[7] || "",
        cep: r[8] || "",
        bairro: r[9] || "",
        cidade: r[10] || "",
        estado: r[11] || ""
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", leads: leads }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString(), leads: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
