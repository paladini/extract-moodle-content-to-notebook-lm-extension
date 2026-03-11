## Status: v2.0 — Refatoração Completa ✅

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
