# FR-QA-01 — Evidências da revisão de 18/11/2026

[PR #14](https://github.com/anafreiria/ReadingTracker/pull/14) · [Matriz e pendências de aceite](../specs/E1-testes-aceitação-e-regressão-final-do-frontend.md)

## Identificação e resultado

- Código/testes verificados: `63a68065cb98cda50dd4dfb537e1a532bda350f2`, descendente do commit de Otávio `1e15785b26eb8303bc6d5ce44b8782257c345d34` e da base `7181df9`.
- Comando: `node scripts/check-frontend.mjs`, a partir da raiz. Não exige npm/build para servir a aplicação; a ferramenta de teste exige Node 24+ e Chrome.
- Ambiente: Linux, Node `v24.21.0`, Chrome `157.0.8103.78`, perfil isolado, servidor local e portas temporárias. As mudanças posteriores deste commit de documentação não alteram código/testes.
- Resultado: **485 verificações aprovadas e 13 módulos JavaScript com sintaxe válida**, código de saída 0. Nenhuma exceção de aplicação não tratada reportada pelas suítes de navegador.
- Os arquivos abaixo são cópias versionadas da execução, sem depender da disponibilidade futura do diretório temporário. O seed permanece idêntico ao oficial.

| Suíte | Verificações | Log |
|---|---:|---|
| Data | 27 | [data](fr-qa-01/data.test.mjs.log) |
| Foundation | 10 | [foundation](fr-qa-01/foundation.test.mjs.log) |
| Smoke | 15 | [smoke](fr-qa-01/smoke.browser.test.mjs.log) |
| Accessibility | 85 | [accessibility](fr-qa-01/accessibility.browser.test.mjs.log) |
| Authors | 37 | [authors](fr-qa-01/authors.browser.test.mjs.log) |
| Books | 62 | [books](fr-qa-01/books.browser.test.mjs.log) |
| Mobile acceptance | 74 | [mobile](fr-qa-01/mobile-acceptance.browser.test.mjs.log) |
| Readings | 51 | [readings](fr-qa-01/readings.browser.test.mjs.log) |
| Status | 124 | [status](fr-qa-01/status.browser.test.mjs.log) |
| Total | **485** | |

[Resumo legível](fr-qa-01/summary.md), [resultado estruturado e sintaxe](fr-qa-01/summary.json), [versões](fr-qa-01/environment.json).

## Regressão do reset

A [execução original do GitHub](https://github.com/anafreiria/ReadingTracker/actions/runs/43656385856) falhou em `authors.browser.test.mjs:178`, aguardando `#announcement` conter `restored`. A revisão inicial do head original passou localmente; o diagnóstico encontrou a possibilidade de reabertura antes do evento `close`.

A correção mantém Reset/Add/ações da página bloqueados durante a confirmação. A suíte de autores agora verifica esse estado e, no mesmo turno JavaScript de Cancel, tenta clicar de novo em Reset. O diálogo deve permanecer fechado após a resolução, o foco deve voltar a Reset, os dados devem permanecer e a próxima confirmação deve restaurar o seed. As duas verificações novas e a asserção original de restauração passaram. O log de autores registra os passos; não se aumentou tempo de espera.

## Capturas da execução

As imagens mostram dados temporários do perfil de teste. São viewport/emulação no Chrome, sem aparelho físico.

- [Books, 1280px](fr-qa-01/books-1280.png): ações na listagem desktop.
- [Reading History, texto longo em 390px](fr-qa-01/readings-long-390.png): ações e quebra de conteúdo no mobile emulado.
- [Confirmação de limpeza, 390px](fr-qa-01/status-clearance-390.png): campos incompatíveis e consentimento visíveis.

## Aceite e limites

Esta evidência cobre a automação Linux/Chrome; os testes manuais Windows/Chrome/Edge são relatos originais de Otávio, com versões registradas no documento principal. Ainda faltam a discriminação dos cenários por navegador e o registro detalhado do teste humano de livro com primeira leitura, edição e releitura. A automação não substitui esses aceites. Sem certificação WCAG, leitor de tela, aparelho físico, Safari/iOS ou Firefox nesta revisão.

O Actions deve executar novamente no head publicado. Verificar o check **Frontend checks** do PR antes do merge; o resultado local acima não é declaração de aprovação remota. Não houve merge nem publicação da entrega.

## Encerramento posterior do aceite humano

Em 18/11/2026, Ana confirmou teste manual e validação geral da interface, determinando o encerramento da exigência interna de teste por outro integrante. O [registro do aceite](E1-aceite-humano-ana.md) preserva os limites do relato. As pendências de detalhamento descritas na revisão original são mantidas como contexto histórico; não impedem o aceite geral decidido por Ana. A execução final do CI é tratada em FR-REL-01.
