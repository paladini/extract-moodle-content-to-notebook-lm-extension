## Status: v4.0 — Quality Audit: Bug Fixes, UX, Content Extraction, Robustness ✅

### v1.0 — Bootstrap inicial (Tasks 1–5) ✅
- Implementação inicial da extensão com captura básica e exportação simples.

### v2.0 — Refatoração: Cursos, Módulos e Open-Source ✅

**Problema resolvido:** Captura restrita ao Moodle + organização por curso/módulo + qualidade open-source.

#### Mudanças em `content.js`
- Detecção de Moodle via sinais no DOM (body classes, `#region-main`, breadcrumb, footer) — mínimo 2 sinais para confirmar.
- Filtro por URL-base configurável pelo usuário (campo no popup).
- Extração de curso via breadcrumb (nome do `title` attr do link `/course/view.php?id=X`, fallback para `textContent`).
- Extração de módulo: nome via último item do breadcrumb (atividade atual), tipo via URL (`/mod/<type>/`).
- Conteúdo extraído: headings, parágrafos, listas, vídeos (H3), recursos/arquivos (H3).
- Validado contra página real do Moodle UDESC (lesson view com breadcrumb de 5 níveis).

#### Mudanças em `background.js`
- Storage reorganizado: `courses → { [courseId]: { name, modules: { [url]: { moduleName, moduleType, content, capturedAt } } } }`.
- Mensagens: `setMoodleBaseUrl`, `toggleCapture`, `contentCaptured`, `exportCourse`, `exportAll`, `clearCourse`, `clearAll`.
- Export gera Markdown otimizado para NotebookLM: H1=curso, H2=módulo, H3=vídeos/recursos.
- Slug do nome do curso como nome do arquivo.
- Deduplicação por URL dentro de cada curso.

#### Mudanças em `popup.html` + `popup.js`
- Campo de input para URL-base do Moodle (persistido).
- Status bar com dot animado (pulse) quando capturando.
- Lista de cursos capturados com contagem de módulos.
- Botões por curso: Exportar / Limpar.
- Botões globais: Exportar Todos / Limpar Tudo.
- Botão de captura desabilitado até URL ser configurada.

#### Arquivos open-source criados
- `README.md` — Descrição, features, instalação, uso, formato de export, stack, estrutura.
- `CONTRIBUTING.md` — Como contribuir, guidelines, reporting issues, PRs.
- `LICENSE` — MIT.
- `.gitignore` — OS files, IDE, node_modules, build artifacts.

### v3.0 — Extração de Questionários + Agrupamento de Lições ✅

**Problemas resolvidos:**
1. Lições do Moodle com múltiplas sub-páginas inflavam a contagem de módulos (ex: 12 em vez de 2).
2. Questionários/quizzes dentro de lições não eram extraídos de forma estruturada.

#### Mudanças em `content.js`
- `normalizeModuleUrl(url)`: Remove `pageid` de URLs de `/mod/lesson/` para agrupar sub-páginas como um único módulo.
- `extractQuizContent()`: Extrai conteúdo de questionários Moodle (lesson multichoice):
  - Pergunta: texto de `#id_pageheadercontainer .contents .no-overflow`.
  - Opções: cada `.answeroption` com checkbox/radio + label.
  - Marca respostas selecionadas com `[x]` (via `data-initial-value` ou `:checked`).
  - Detecta tipo (múltiplas respostas vs resposta única).
  - Extrai pontuação da página de fim de lição (`.generalbox`).
  - Extrai feedback/resposta correta se disponível (`.response`, `.feedback`, `.correctanswer`).
- `capture()`: Combina `extractContent()` + `extractQuizContent()`, envia `normalizedUrl` no payload.

#### Mudanças em `background.js`
- Deduplicação usa `normalizedUrl` como chave (agrupa sub-páginas de lições).
- Quando módulo já existe, faz **append** do conteúdo (separado por `---`) em vez de ignorar.
- `_capturedUrls` array rastreia URLs exatas já capturadas para evitar duplicatas reais.

### v3.1 — Fix qualidade de conteúdo e contagem de módulos ✅

**Problemas resolvidos:**
1. Conteúdo capturado incluía lixo do sidebar/drawer, "Duração" repetido, whitespace excessivo.
2. Páginas de visão geral do curso (`/course/section.php`, `/course/view.php`) capturadas como módulos.
3. Root selector `querySelector('[role="main"], #region-main, ...')` retornava `#region-main` (wrapper ruidoso) em vez de `[role="main"]` (conteúdo limpo).

#### Mudanças em `content.js`
- `isCourseOverviewPage()`: Ignora páginas de listagem de atividades do curso.
- `findContentRoot()`: Seleção por prioridade — prefere `[role="main"]` sobre `#region-main`.
- `NOISE_SELECTORS`: Lista de seletores de elementos ruidosos removidos antes da extração (`.courseindex`, `.activity-header`, `.activity-navigation`, `.completion-info`, `.drawer`, etc.).
- `getCleanRoot()`: Clona o root e remove elementos ruidosos.
- `cleanLines()`: Pós-processamento — normaliza whitespace, remove linhas curtas, deduplica consecutivas.
- `extractContent()` usa `getCleanRoot()` e `cleanLines()`.
- Removido `.activity-description` do seletor de parágrafos (era fonte de "Duração" duplicado).

### v4.0 — Quality Audit: Bug Fixes, UX, Content Extraction, Robustness ✅

**Professional audit covering bugs, missing flows, UX gaps, and content extraction holes.**

#### Phase 1 — Bug Fixes
- **XSS fix**: `escapeHtml()` in `popup.js` — course names from Moodle are now escaped before `innerHTML`.
- **Operator precedence fix** (`content.js:214`): Added missing parentheses in quiz answer detection logic.
- **Unclean root fix**: `extractQuizContent()` now uses `getCleanRoot()` instead of `findContentRoot()` to exclude noise.
- **Double computation fix**: `countModules()` no longer called twice on the same line.

#### Phase 2 — UX Feedback & Validation (`popup.html` + `popup.js`)
- **Toast notification system**: Success/error/info toasts for all user actions (save URL, export, clear, capture start/stop).
- **URL validation**: Enforces protocol (`https://` auto-prepended), validates hostname, shows inline error/success messages.
- **Enter key support**: Press Enter in URL input to save.
- **Confirmation dialogs**: "Clear Course" and "Clear All" require user confirmation before deleting data.
- **Capture hint text**: Shows "Set your Moodle URL above to enable capture" when button is disabled.
- **Extension badge**: Shows module count on toolbar icon while capturing, clears when stopped.
- **Storage quota warning**: Shows warning bar when storage usage exceeds 80% of the 10 MB limit.

#### Phase 3 — Content Extraction Improvements (`content.js`)
- **Tables → Markdown tables**: `<table>` elements extracted with proper `|` column separators and header dividers.
- **Blockquotes**: `<blockquote>` extracted as Markdown `>` lines.
- **Code blocks**: `<pre>` and `<code>` extracted as fenced code blocks (` ``` `).
- **Image alt-text**: `<img>` with meaningful `alt` attributes extracted as `![alt](src)`.

#### Phase 4 — Robustness & Edge Cases
- **Blob URL exports** (`background.js`): Replaced `data:` URLs with `Blob` URLs — no size limit on export.
- **Download error handling**: `downloadMarkdown()` returns Promise, catches errors, sends feedback to popup.
- **Badge updates from background**: `updateBadgeFromStorage()` called on every content capture.
- **sendResponse guaranteed**: Export handlers wrapped in try/catch ensuring response on all paths.
- **SPA navigation detection** (`content.js`): Monkey-patches `history.pushState` and `history.replaceState`, listens for `popstate` — captures content on AJAX navigation.
- **Script injection error handling**: Shows toast when content script can't be injected into current tab.

#### Phase 5 — Polish
- **Content preview panel** (`popup.html` + `popup.js`): "Preview" button per course toggles expandable panel showing truncated module content before export.
