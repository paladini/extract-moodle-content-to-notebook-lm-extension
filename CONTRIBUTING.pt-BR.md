# Contribuindo

Obrigado por contribuir.

Este projeto foi pensado para continuar simples, local-first e sem dependências desnecessárias. As contribuições devem preservar isso.

## Como rodar localmente

1. Faça um fork e clone o repositório.
2. Abra `chrome://extensions`.
3. Ative o modo desenvolvedor.
4. Carregue a pasta do projeto com Load unpacked.
5. Recarregue a extensão após mudanças para testar.

## Princípios do projeto

- Manter o projeto simples e sem build.
- Evitar seletores frágeis demais para Moodle.
- Preservar o funcionamento local, sem depender de backend.
- Melhorar o fluxo de exportação para NotebookLM.
- Tratar persistência e recuperação com cuidado.

## O que é uma boa contribuição

- Corrige um bug real com diff pequeno e claro.
- Melhora a captura em diferentes instalações do Moodle.
- Melhora a qualidade do Markdown exportado.
- Melhora backup, restore, snapshots ou mensagens de erro.
- Melhora a documentação para usuários e contribuidores.

## Antes de abrir PR

1. Teste em páginas reais do Moodle, se possível.
2. Verifique se a exportação continua correta.
3. Se mexer em persistência, teste backup, restore e limpeza.
4. Atualize a documentação se o comportamento mudou.

## Conduta

Seja respeitoso, objetivo e construtivo. Veja [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).