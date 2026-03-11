# Documento de Requisitos do Produto (PRD) - Extensão Moodle para NotebookLM

## Escopo e Funcionalidade Core
Extensão para navegadores baseados em Chromium voltada à captura assíncrona de conteúdo acadêmico. O software extrairá estruturas textuais e links de vídeo do Moodle, armazenando os dados localmente para posterior consolidação e exportação em formato Markdown (`.md`). 

## Especificações Técnicas
* **Permissões:** Manifest V3 (`storage`, `activeTab`, `scripting`).
* **Armazenamento Temporário:** `chrome.storage.local`.
* **Componentes:**
    * *Service Worker (`background.js`)*: Gerencia o ciclo de vida e estado global.
    * *Interface (`popup.html/js`)*: Controle booleano e gatilho de exportação.
    * *Extrator (`content.js`)*: Lógica de parse do DOM atuando no contexto da página.

## Execution Nodes (Tarefas Atômicas)
* [x] **Task 1: Bootstrap da Extensão.** Configurar o `manifest.json` aderente à V3, criar a árvore de diretórios e arquivos base.
* [x] **Task 2: Interface e Eventos UI.** Estruturar o `popup.html` com botões e listeners no `popup.js`.
* [x] **Task 3: Gerenciamento de Estado Global.** Capturar mensagens da UI e persistir estado `isCapturing` no `chrome.storage.local`.
* [x] **Task 4: Parse de DOM e Extração Semântica.** Em `content.js`, selecionar tags de conteúdo, formatar como Markdown e injetar no storage.
* [x] **Task 5: Agregação e Exportação de Arquivo.** Ler dados do storage, formatar como Blob `.md` e disparar download.
