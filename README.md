# +Esporte −Remédio · Landing Page de Cadastro

Landing page premium para captação de leads. **O formulário é público** —
qualquer visitante pode se cadastrar sem senha. O acesso à lista de
participantes (painel de leads) é protegido por senha e fica escondido
atrás de uma pequena engrenagem (⚙) no canto inferior direito da tela.

---

## 📁 Estrutura do projeto

```
project/
├── index.html                 → Página única: formulário + painel admin
├── apps-script.gs              → Código para colar no Google Apps Script
│
├── css/
│   ├── style.css                → Arquivo mestre (só imports, não editar direto)
│   ├── variables.css             → Design System: cores, fontes, espaçamentos
│   ├── global.css                 → Reset e estilos base (body, header, footer)
│   ├── form.css                     → Formulário, accordion, botão, termos
│   ├── admin-modal.css                → Engrenagem (FAB) + modal de senha
│   ├── admin-panel.css                  → Painel de leads (tabela, busca, exportar)
│   ├── animations.css                     → Keyframes e classes de animação
│   └── responsive.css                       → Ajustes por tamanho de tela
│
├── js/
│   ├── validations.js            → Máscaras (WhatsApp, CEP, data) e validações
│   ├── accordion.js                → Abre/fecha o bloco de endereço
│   ├── google-sheets.js              → Envia e lê os dados do Google Sheets
│   ├── animations.js                   → Scroll reveal e microinterações
│   ├── script.js                         → Valida e envia o formulário de cadastro
│   ├── auth.js                             → Lógica da senha (protege o painel)
│   └── admin-panel.js                        → Tabela de leads, busca, exportação
│
└── img/
    └── logo-mascote.png            → Logo oficial do projeto
```

> Não existe mais uma pasta `/admin` separada. Tudo roda dentro do
> `index.html`, em modais que só aparecem quando necessário.

---

## 🔐 Como funciona o acesso ao painel de leads

1. O visitante comum só vê o formulário — nunca vê nem sabe que existe
   um painel administrativo.
2. No canto inferior direito, há um pequeno botão discreto (engrenagem ⚙).
3. Ao clicar, abre um modal pedindo a senha ("Área Restrita").
4. Com a senha certa, abre o **Painel de Leads**: tabela com todos os
   participantes, busca por nome/WhatsApp, exportação em Excel/CSV e
   exclusão de registros.

## 🔑 Como alterar a senha do painel

Abra `js/auth.js` e edite:

```js
const ACCESS_PASSWORD = "esporte2026";
```

Troque `"esporte2026"` pela senha que quiser, entre aspas, e salve.

Por padrão, depois de acertar a senha uma vez, o navegador não pede de
novo por 4 horas (enquanto a aba continuar aberta). Para mudar:

```js
const SESSION_DURATION_MS = 1000 * 60 * 60 * 4; // 4 horas
```

Use `0` para exigir a senha sempre que a engrenagem for clicada.

---

## 📊 Como conectar ao Google Sheets (passo a passo)

### 1. Criar a planilha
- Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova.
- Na primeira linha (cabeçalhos), digite, uma em cada coluna (A até L):
  ```
  ID | Data Cadastro | Nome Completo | WhatsApp | Data Nascimento | Logradouro | Número | Complemento | CEP | Bairro | Cidade | Estado
  ```

### 2. Colar o Apps Script
- Na planilha, vá em **Extensões → Apps Script**.
- Apague o código padrão que aparecer.
- Abra o arquivo `apps-script.gs` (está na raiz deste projeto) e cole todo
  o conteúdo dele no editor do Apps Script. Salve (`Ctrl+S`).

### 3. Publicar como App da Web
- Clique em **Implantar → Nova implantação**.
- No ícone de engrenagem, escolha **App da Web**.
- Configure:
  - **Executar como:** Eu (sua conta)
  - **Quem pode acessar:** Qualquer pessoa
- Clique em **Implantar** e autorize o acesso solicitado.
- Copie a URL gerada — ela termina em `/exec`.

### 4. Colar a URL no projeto
- Abra `js/google-sheets.js` e cole a URL na linha:
  ```js
  const SHEET_WEBAPP_URL = "";
  ```
  Exemplo:
  ```js
  const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
  ```
- Salve. A partir de agora:
  - Os cadastros do formulário vão direto para a planilha.
  - O painel de leads (engrenagem) passa a **ler em tempo real** os dados
    da própria planilha, além do backup local deste navegador.

> **Enquanto a URL não for configurada**, tudo continua funcionando: o
> formulário mostra "cadastro realizado com sucesso" normalmente, e o
> painel de leads mostra um aviso de que está em modo local, exibindo
> apenas os cadastros feitos neste mesmo navegador.

### Atualizou o código do Apps Script depois de publicar?
Sempre que editar `apps-script.gs` na própria planilha, é preciso:
**Implantar → Gerenciar implantações → ícone de lápis → Nova versão**,
ou a URL publicada continuará usando o código antigo.

---

## 🎨 Como alterar as cores

Tudo está centralizado em `css/variables.css`:

```css
--color-bg:    #0c1a78;   /* azul navy de fundo */
--color-gold:  #FFD12A;   /* dourado dos destaques e botões */
--color-success: #22C55E; /* verde de sucesso */
--color-error:   #F87171; /* vermelho de erro */
```

Troque o valor hexadecimal e a cor muda em **todo o site automaticamente**
(formulário, modal de senha e painel de leads usam as mesmas variáveis).

---

## ✏️ Como alterar textos

| O que mudar | Onde |
|---|---|
| Título do formulário | `index.html` → `<h1 id="formTitle">` |
| Texto de apoio (subtítulo) | `index.html` → `<p class="card-sub">` |
| Texto do termo LGPD | `index.html` → dentro de `.terms-box label` |
| Texto do botão principal | `index.html` → `<span class="btn-label">` |
| Mensagem de sucesso | `js/script.js` → função `showSuccess()` |
| Texto do modal de senha | `index.html` → dentro de `.pw-box` |
| Título do painel de leads | `index.html` → `<h2>📋 PAINEL DE LEADS</h2>` |

---

## ➕ Como adicionar novos campos ao formulário

1. **HTML** (`index.html`): copie um bloco `<div class="field">...</div>`
   existente, troque o `id`, `name` e `placeholder`.
2. **Validação** (`js/script.js`): adicione uma linha de validação dentro
   do array `validations`, usando os validadores de `js/validations.js`
   (ou crie um novo lá).
3. **Envio** (`js/script.js`): adicione o novo campo dentro do objeto
   `leadData` em `submitLead()`.
4. **Google Sheets**:
   - Adicione uma nova coluna no cabeçalho da planilha.
   - Em `apps-script.gs`, adicione o campo em `sheet.appendRow([...])`
     (em `doPost`) **e** em `listLeads()` (em `doGet`), para que apareça
     no painel também.
   - Em `js/google-sheets.js`, adicione o campo no objeto `payload`.
5. **Painel de leads** (`js/admin-panel.js`): se quiser exibir o novo
   campo na tabela ou na exportação, adicione-o em `renderTable()` e em
   `leadsForExport()`.

---

## 🚀 Como publicar o projeto

Qualquer serviço de hospedagem de site estático funciona:

- **Netlify**: arraste a pasta do projeto em [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: `vercel deploy` na pasta do projeto (via CLI) ou importe pelo site
- **GitHub Pages**: suba os arquivos para um repositório e ative o Pages

Não há necessidade de servidor backend próprio — tudo funciona com
arquivos estáticos + Google Apps Script.

---

## ✅ Checklist antes de divulgar

- [ ] Troquei a senha em `js/auth.js`
- [ ] Configurei `SHEET_WEBAPP_URL` em `js/google-sheets.js`
- [ ] Testei um cadastro de ponta a ponta
- [ ] Confirmei que o lead apareceu na planilha do Google Sheets
- [ ] Cliquei na engrenagem, digitei a senha e vi o lead aparecer no painel
- [ ] Testei exportar Excel e CSV
- [ ] Testei em um celular real (não só no navegador do computador)
