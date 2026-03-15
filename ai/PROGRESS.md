## Status: v3.0 — Extração de Questionários + Agrupamento de Lições ✅

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
