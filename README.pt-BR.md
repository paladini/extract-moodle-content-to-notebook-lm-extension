# Moodle Content Extractor for NotebookLM

Extensão para capturar conteúdo do Moodle e exportar em Markdown pronto para NotebookLM, revisões, resumos e cartões didáticos.

[English](README.md) | [Português (Brasil)](README.pt-BR.md)

## O que esta extensão faz

Enquanto você navega pelo Moodle, a extensão captura o conteúdo das páginas, organiza tudo por curso e módulo e depois exporta em Markdown.

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
4. Navegue normalmente pelas páginas da disciplina.
5. Clique em Stop Capture quando terminar.
6. Exporte um curso específico ou todos os cursos.
7. Faça upload do Markdown no NotebookLM junto com o plano de ensino.

## Recursos principais

- Captura automática em segundo plano.
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

## Contribuição

Leia [CONTRIBUTING.pt-BR.md](CONTRIBUTING.pt-BR.md) ou [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

MIT. Veja [LICENSE](LICENSE).