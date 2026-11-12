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
- [Histórico em 1280px](../screenshots/fr-ui-01-readings-1280.png)
- [Formulário em 390px](../screenshots/fr-ui-01-form-390.png)

Implementado e verificado localmente; pendente revisão de outro integrante e integração via PR. As capturas documentam o resultado; não foi produzida comparação visual antes/depois nesta sessão.

## Revisão dos materiais e ajuste das ações — 12/11/2026

Conferidos os PDFs e seed de Instrucoes_site.zip: conteúdo idêntico aos arquivos versionados em materiais/. O seed do frontend também permanece idêntico ao JSON do ZIP. A revisão confrontou as seções 3–6 e 11 do enunciado com os módulos de interface, validação e armazenamento e com as suítes existentes.

| Exigência | Comportamento conferido |
| --- | --- |
| Stack e idioma | HTML/CSS/JavaScript puros, módulos ES, interface en-US, sem dependências de build no produto. Node e Chrome são ferramentas de teste. |
| FR-01 | CRUD de autores, nome único sem distinguir caixa, nacionalidade fixa/opcional, datas opcionais e validação; exclusão de autor vinculado informa livros. |
| FR-02 | Livro apenas com título, autores/temas existentes por IDs, múltiplas seleções e criação imediata de tema; anos negativos aceitos, zero/futuro rejeitados. |
| FR-03 | Leituras independentes para releitura, livro e primeira leitura em uma gravação, exclusão em cascata com confirmação e contagem. |
| FR-04 | Cinco status, ano obrigatório em Read, ano/nota somente em Read/Abandoned, nota 0–10 em passos de 0,5; prioridade removida ao sair da wishlist, notas/recomendação preservadas e limpeza de resultados confirmada. |
| FR-05 | Cinco colunas ordenáveis, ausentes mostrados como traço e ordenados por último; padrão ano decrescente e ID crescente. |
| FR-06 | Regras de domínio e erros associados aos campos nas operações examinadas; falhas não persistem candidatos inválidos. |
| FR-07 | Seed apenas no primeiro uso; alterações persistem após recarga; Reset confirmado restaura o original, incluindo campos intencionalmente ausentes. |

Não foi identificada divergência bloqueadora nos fluxos examinados. Os dados ausentes não foram enriquecidos automaticamente. A revisão não substitui aceite do colega, avaliação completa de acessibilidade ou a regressão final em dois navegadores.

Ajuste solicitado na revisão visual: ações em uma única linha no desktop, botões compactos e coluna dimensionada pelo conteúdo; quebra de linha somente nos cartões até 850px. Altura mínima de 44px mantida. Capturas atualizadas para refletir esse ajuste.

Verificação após o ajuste: `node scripts/check-frontend.mjs` aprovado novamente com 324 verificações e sintaxe, em Node v24.21.0/Chrome 156.0.8078.73 no Linux. Relatório local: /tmp/reading-tracker-check-NVa1tS. Matriz das três telas em 360/390/768/1280px aprovada; capturas desktop conferidas visualmente. Limites de emulação e revisão humana permanecem os descritos acima.

## Automação complementar após o merge do PR #11

Base: main `ba46922`; branch `test/fr-ui-01-acceptance`. Nova suíte: `tests/mobile-acceptance.browser.test.mjs`, descoberta automaticamente por `node scripts/check-frontend.mjs` e pelo workflow existente, sem mudar o produto ou introduzir dependências.

- Textos longos: títulos e nomes com centenas de caracteres, inclusive trechos sem espaços, além de notas com quebras de linha. Matriz das três listagens em 360/390/768/1280px; verifica largura da página/linha e posição das ações, consulta o registro correto e confere as quebras das notas.
- Ações: toques reais pelo protocolo DevTools em 360/390/768px e mouse em 1280px; cada alvo passa por verificação de hit testing. View em Books/Reading History; consulta na listagem e por Edit em Authors, que não tem View separado. Edição grava o registro esperado, cancelamento de exclusão preserva o armazenamento e confirmação remove o registro esperado nos três módulos.
- Seleção: tocar em dois autores e dois temas, desmarcar somente um de cada, salvar, recarregar e verificar arrays de IDs e valores recuperados em Edit.
- Teclado: partir do foco inicial do diálogo, usar Tab até autores/temas, Space para marcar/desmarcar, verificar foco visível e seleção nativa; Escape cancela sem alterar os dados.

A preparação usa o store em perfil isolado, com recarga para atualizar o snapshot da interface. Os testes não alteram seed.json nem dados do navegador da usuária. A execução termina restaurando o seed no perfil de teste. Não foi necessário alterar código funcional para os novos cenários.

Execução isolada: 74 verificações de aceite aprovadas em Chrome 156.0.8078.73/Node v24.21.0 no Linux. Relatório temporário: /tmp/reading-tracker-check-95hYmo. Os toques são emulação no Chrome; não foi testado aparelho físico, Safari/iOS, teclado virtual ou leitor de tela.

Capturas representativas:

- [Livro longo em 390px](../screenshots/fr-ui-01-acceptance-books-long-390.png)
- [Histórico longo em 390px](../screenshots/fr-ui-01-acceptance-readings-long-390.png)
- [Autor longo em 390px](../screenshots/fr-ui-01-acceptance-authors-long-390.png)
- [Checkboxes pelo teclado](../screenshots/fr-ui-01-acceptance-checkbox-keyboard-390.png)

Regressão completa integrada: `node scripts/check-frontend.mjs` aprovado com 398 verificações (27 dados, 10 foundation, 15 smoke, 35 autores, 62 livros, 74 aceite mobile, 51 leituras e 124 status), além da sintaxe. Relatório: /tmp/reading-tracker-check-Cp4lay. Não houve exceção não tratada nos cenários de navegador. O resultado é local; requer revisão e publicação desta branch para existir uma execução remota no Actions.
