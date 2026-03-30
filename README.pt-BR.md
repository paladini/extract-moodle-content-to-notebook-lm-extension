# Moodle Content Extractor for NotebookLM

Extensão para capturar conteúdo do Moodle e exportar em Markdown pronto para NotebookLM, revisões, resumos e cartões didáticos.

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

## O que esta extensão faz

Ao ativar o modo de captura, a extensão registra automaticamente o conteúdo das páginas do Moodle enquanto você navega em abas com acesso concedido por ação explícita do usuário, organiza tudo por curso e módulo e depois exporta em Markdown.

Isso facilita um fluxo de estudo com IA sem depender de copiar e colar manualmente cada página.

## Fluxo recomendado com NotebookLM

Este foi um fluxo prático que funcionou bem:

1. Criar um novo notebook no NotebookLM.
2. Fazer upload do plano de ensino da disciplina.
3. Fazer upload do arquivo Markdown gerado pela extensão.
4. Pedir ao Gemini dentro do NotebookLM para gerar cartões didáticos.

Se você for descrever isso em inglês, “plano de ensino” normalmente vira “course syllabus” ou apenas “syllabus”.

## Instalação

1. Clone o repositório.

```bash
git clone https://github.com/paladini/extract-moodle-content-to-notebook-lm-extension.git
cd extract-moodle-content-to-notebook-lm-extension
```

2. Abra `chrome://extensions`.
3. Ative o modo desenvolvedor.
4. Clique em Load unpacked.
5. Selecione a pasta do projeto.

## Uso

1. Abra o popup da extensão.
2. Informe a URL base do seu Moodle.
3. Clique em Start Capture.
4. Navegue pelas lições ou atividades do Moodle que quiser incluir.
5. Clique em Stop Capture quando terminar a coleta.
6. Exporte um curso específico ou todos os cursos.
7. Faça upload do Markdown no NotebookLM junto com o plano de ensino.

## Recursos principais

- Captura automática enquanto você navega pelas páginas do Moodle em abas com acesso de captura habilitado.
- Organização por curso e módulo.
- Exportação em Markdown por curso.
- Captura de vídeos e links de arquivos.
- Backup e restauração locais.
- Snapshots automáticos antes de ações destrutivas.
- Sem dependências e sem build.

## Segurança dos dados

- Escritas verificadas no armazenamento local.
- Fila serializada para reduzir perda por concorrência.
- Snapshot automático antes de limpar dados.
- Exportação e importação de backup em JSON.

## Privacidade e Permissões

A extensão usa **permissões mínimas e dinâmicas**:

- **`activeTab`** + **`scripting`**: Scripts são injetados dinamicamente após ação explícita do usuário. A extensão não usa content script estático em todas as páginas.
- **`storage`**: Armazenamento local no navegador para cursos e configurações capturados.
- **`downloads`**: Funcionalidade de exportação para arquivos Markdown e backup em JSON.

**Os dados são processados inteiramente no seu navegador.** Nenhuma comunicação com servidor externo ocorre. O conteúdo fica no armazenamento local do navegador e só é enviado para fora quando você exporta explicitamente.

Para mais detalhes, consulte [docs/permissions.html](docs/permissions.html).

## Contribuição

Leia [CONTRIBUTING.pt-BR.md](CONTRIBUTING.pt-BR.md) ou [CONTRIBUTING.md](CONTRIBUTING.md).

## Autor

Fernando Paladini

- GitHub: https://github.com/paladini
- E-mail: fnpaladini@gmail.com

## Licença

MIT. Veja [LICENSE](LICENSE).