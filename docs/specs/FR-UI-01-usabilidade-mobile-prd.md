# PRD — FR-UI-01: Usabilidade mobile das listagens e formulários

Data: 12/11/2026. Responsável pela implementação: Ana Flavia Freiria, com assistência Codex. Revisor: a definir pela equipe.
Branch: `fr-ui-01`. Base: `ed780d3`, que integra o PR #9.
Cartão: https://trello.com/c/I4VleFAB.

## Problema e resultado esperado

As tabelas exigem deslocamento horizontal para alcançar ações no celular. A seleção múltipla nativa depende de convenções distintas por plataforma. Permitir consultar registros e operar formulários por toque ou teclado, preservando identidade visual e regras FR-01 a FR-07.

## Escopo e decisões

- Em até 850px, apresentar cada linha como cartão com rótulos visíveis e ações que quebram linha. Manter uma única tabela e os mesmos eventos/dados, evitando duplicação de controles. No desktop, conservar a apresentação tabular.
- Manter os cinco botões de ordenação do histórico no cabeçalho, disponíveis em telas estreitas; preservar aria-sort e retorno de foco, ano descendente/ID ascendente e ausentes por último.
- Autores e temas usam checkboxes nativos em fieldsets com legendas e listas de altura limitada. A seleção é explícita, sem modificadores. Clear selection permite remover todas; ausência de seleção continua válida. Não introduzir busca ou componente de seleção customizado.
- Novo tema entra selecionado; criação continua independente e o aviso de persistência ao cancelar permanece. Capturar grupos como arrays de IDs numéricos, mantendo includeFirstReading como booleano.
- Diálogos com rolagem vertical limitada à altura disponível; campos longos e detalhes quebram linha. Save/Cancel permanecem no fluxo e são alcançáveis pela rolagem e pelo teclado.
- Preservar validações, rascunhos em erro, confirmações de exclusão/reset/transição, proteção de submissão e aviso de remoção de prioridade do PR #9.

## Critérios de aceite

1. Reading History, Authors e Books sem rolagem horizontal da página em 360/390/768/1280px; ações de cada registro dentro da largura disponível.
2. Histórico ordenável pelas cinco colunas, com regras e foco preservados.
3. Selecionar dois autores e dois temas, remover seleções, limpar e salvar sem modificadores; seleções persistem após recarga e são recuperadas na edição.
4. Livro apenas com título continua válido; novo tema é selecionado sem perder o rascunho.
5. Formulários longos permitem alcançar Save/Cancel e corrigir erros sem perda dos campos.
6. Cancelamentos não alteram os dados. Foco e teclado permanecem utilizáveis.
7. Verificação completa verde, capturas e limitações registradas antes da revisão.

## Verificação

Executar `node scripts/check-frontend.mjs` com Node 24+ e Chrome, perfil isolado. A suíte de livros passa a interagir com checkboxes por clique, mantendo verificações de persistência, edição, tema, falha, cancelamento e segurança. Acrescentar matriz das três telas nas quatro larguras e capturas automáticas; ampliar larguras dos formulários.

Resultado em 12/11/2026: check completo aprovado, 324 verificações (27 dados, 10 foundation, 15 smoke, 35 autores, 62 livros, 51 leituras, 124 status), além das verificações de sintaxe. Node v24.21.0 e Chrome 156.0.8078.73 em Linux; base ed780d3 com alterações locais da branch fr-ui-01. Relatório da sessão: /tmp/reading-tracker-check-PF9Vgk. Nenhuma exceção não tratada nas suítes de navegador. A prova de foco após redimensionar parte do campo de título para simular nova navegação até Save; reaplicar foco ao mesmo botão já ativo não representa essa navegação. Capturas são emulação de viewport no Chrome, sem comprovação de aparelho físico, teclado virtual ou Safari/iOS. Regressão final em dois navegadores e aceite com colega pertencem ao cartão FR-QA-01.

## Fora do escopo

Busca, filtros, paginação, redesign, backend, dependências de build e auditoria completa de acessibilidade. Acabamento/contraste/zoom abrangentes pertencem à FR-UI-02. Não alterar seed, contratos do store nem requisitos oficiais.

## Evidências visuais

- [Histórico em 390px](../screenshots/fr-ui-01-readings-390.png)
- [Autores em 390px](../screenshots/fr-ui-01-authors-390.png)
- [Livros em 390px](../screenshots/fr-ui-01-books-390.png)
- [Livros em 1280px](../screenshots/fr-ui-01-books-1280.png)
- [Formulário em 390px](../screenshots/fr-ui-01-form-390.png)

Implementado e verificado localmente; pendente revisão de outro integrante e integração via PR. As capturas documentam o resultado; não foi produzida comparação visual antes/depois nesta sessão.
