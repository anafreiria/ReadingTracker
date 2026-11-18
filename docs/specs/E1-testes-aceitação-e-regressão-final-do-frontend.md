# FR-QA-01 — Testes de aceitação e regressão final do frontend

Responsável pela execução original: Otávio de Oliveira. Correções de revisão: Ana/Codex, em commits adicionais, preservando a autoria original. Branch: `fr-qa-01`. [PR #14](https://github.com/anafreiria/ReadingTracker/pull/14). Critérios: cartão FR-QA-01 da exportação do Trello fornecida em 18/11/2026; o JSON local não faz parte do PR.

## Resultado e escopo

A revisão cobre FR-01 a FR-07 e os critérios do cartão, após a integração de FR-06 e FR-UI-01/02 na base `7181df9`. Backend e FR-DOC-01 ficam fora deste PR. O aceite final continua condicionado à evidência humana abaixo e ao check verde do GitHub no head publicado. Não criar tag de entrega antes dessa decisão.

O commit original revisado é `1e15785b26eb8303bc6d5ce44b8782257c345d34`. Em cópia isolada desse commit, a revisão de 18/11 aprovou 483 verificações e 13 checagens de sintaxe. Esse resultado local não apaga a [falha do Actions original](https://github.com/anafreiria/ReadingTracker/actions/runs/43656385856): timeout ao aguardar a mensagem de reset em `authors.browser.test.mjs:178`.

## Correção do reset

O teste cancelava o reset e tentava reabri-lo imediatamente. O botão continuava habilitado enquanto `confirmAction` aguardava o evento `close`, que é enfileirado pelo navegador. Reabrir o diálogo antes desse evento podia fazer duas confirmações compartilharem o fechamento e o `returnValue`, sem executar a restauração esperada. A falha original não se repetiu na primeira execução local, mas a sequência vulnerável foi identificada no código.

O commit `63a6806` bloqueia ações da página desde a abertura da confirmação até sua resolução. Cancel libera as ações e devolve o foco a Reset data; confirmar continua exigindo baixar e validar o seed antes de gravar. Duas verificações novas asseguram o bloqueio e tentam reabrir o reset no mesmo turno JavaScript de Cancel, antes de processar `close`. Não se aumentou timeout nem se removeu a asserção da restauração.

## Duplicidade e histórico

Conforme a seção 4 do [enunciado oficial](../../materiais/Reading_Tracker_Web_Application.pdf), nomes de autores e temas são únicos sem diferenciar caixa. O título do livro é obrigatório, mas não tem restrição de unicidade. Portanto, aceitar dois livros com o mesmo título não constitui defeito frente ao enunciado. “Duplicata rejeitada” no critério de livros/temas se aplica ao tema; IDs repetidos nas seleções também são rejeitados. A suíte `books.browser.test.mjs` verifica rejeição de tema existente com caixa alterada, preservando as seleções; `data.test.mjs` verifica nomes e referências duplicadas. A investigação de títulos fica concluída nesta revisão, sem introduzir regra adicional.

As cinco ordenações de FR-05 são **título, autores, status, ano lido e nota**, em ambos os sentidos. O padrão é ano decrescente com desempate por ID crescente; ausentes ficam por último. A versão original do relatório dizia “data” no lugar de autores; a descrição foi corrigida conforme o código e o enunciado.

## Matriz dos critérios

A matriz abaixo referencia o commit de correção `63a6806` e a execução Linux/Chrome descrita no [relatório de revisão](../reports/FR-QA-01-revisao.md). As referências às suítes indicam cenários automatizados, sem substituir os aceites manuais pendentes.

| Critério do cartão | Cenários e evidência | Resultado da revisão |
|---|---|---|
| Autores | `authors.browser.test.mjs`: CRUD, duplicata sem diferenciar caixa, datas e bloqueio de autor vinculado com títulos dos livros | Coberto pela suíte |
| Livros/temas | `books.browser.test.mjs` e `data.test.mjs`: título mínimo, cadastro completo, seleção múltipla, tema novo/duplicado, ano negativo, zero/futuro e edição que invalidaria leitura | Coberto; duplicidade de títulos esclarecida acima |
| Leituras | `readings.browser.test.mjs`: CRUD por ID, releituras independentes e livro/primeira leitura em gravação única, inclusive falhas | Coberto pela suíte |
| Status | `status.browser.test.mjs`: 25 pares, domínio de ano/nota/prioridade, preservação de textos e aviso de prioridade | Coberto pela suíte |
| Confirmações | Suítes authors/books/readings/status: Cancel/Escape/confirmar, limpeza de campos, cascata com contagem e preservação de outros registros; nova regressão do reset | Coberto pela suíte |
| Histórico | `foundation.test.mjs`, smoke e suítes de interface: cinco colunas ordenáveis, ausentes ao final, padrão ano desc/ID asc; seed oficial com campos opcionais ausentes | Coberto; seed incompleto não significa coleções obrigatórias ausentes |
| Persistência | Foundation/data e suítes de formulário: seed somente no primeiro uso, CRUD após recarga, reset exato e outras chaves preservadas | Coberto pela suíte; reabertura completa do navegador é relato original |
| Falhas | Data/foundation e suítes de interface: quota, falha de seed, segunda aba, rascunhos preservados, retry sem duplicar | Coberto pela suíte |
| Responsividade/acessibilidade | Books/mobile/accessibility: 360/390/768/1280px, textos longos, ações, rolagem, Tab/Space/Escape, foco e zoom real de 200% | Chrome com emulação de viewport; capturas no relatório |
| Dois navegadores | Otávio relata testes manuais em Chrome e Edge no Windows, com versões abaixo | Relato preservado; falta discriminar cenários/resultados de cada navegador |
| Pessoa que não implementou | Otávio relata exploração pela irmã, sem participação na implementação | Pendente detalhar livro com primeira leitura, edição, releitura e dificuldades; não inferir esses passos do relato genérico |
| Check completo e evidências | Relatório automático e capturas versionados nesta revisão; Actions do head publicado deve ficar verde | Ver resultado local no relatório e resultado remoto no PR; aceite final pendente |

## Execuções e rastreabilidade

- Execução original informada por Otávio: 14/11/2026, Windows, Chrome `157.0.8103.52`, Edge `157.0.4341.46`; 483 verificações e 13 checagens de sintaxe. O caminho temporário local informado não permite auditoria compartilhada e não é tratado como evidência anexada.
- Otávio relata CRUD, associações, releituras, status, reset, persistência após recarga/reabertura e exploração nos dois navegadores. A revisão não repetiu Windows/Edge e não atribui a eles resultados da automação Linux.
- Revisão de 18/11/2026: Node `v24.21.0`, Chrome `157.0.8103.78`, Linux, perfil isolado e portas temporárias, comando `node scripts/check-frontend.mjs`. Execução de correção detalhada em [FR-QA-01-revisao.md](../reports/FR-QA-01-revisao.md), com logs, resumo e capturas versionados.
- `assertLibrary` rejeita coleções obrigatórias ausentes/nulas e referências inválidas. Coleção vazia é válida quando não quebra referências. O seed oficial com campos opcionais ausentes permanece íntegro; não foi completado com dados inventados.

## Aceite humano e limites

- [x] Corrigir a descrição das cinco ordenações.
- [x] Concluir a análise de títulos duplicados segundo o enunciado.
- [x] Corrigir a janela de reabertura do reset e acrescentar regressão específica.
- [x] Registrar o aceite manual geral de Ana em 18/11/2026; o detalhamento por navegador permanece um limite documental, sem atribuir resultados não informados.
- [x] Critério interno de teste por outra pessoa encerrado por determinação de Ana em 18/11/2026: substituído pelo seu aceite manual geral, conforme [registro](../reports/E1-aceite-humano-ana.md). Não se declara execução por outro integrante.
- [x] PR #14 integrado após revisão; PR #15 com check verde em `26e4962` e integração por Ana. A nova validação do ambiente de CI pertence ao fechamento FR-REL-01.

Não houve teste em aparelho físico, Safari/iOS, Firefox ou leitor de tela nesta revisão. Chrome e Edge satisfazem a exigência de dois navegadores disponíveis; Firefox não é obrigatório no cartão. Emulação de viewport/toque e verificações de DOM/teclado/contraste não equivalem a certificação de acessibilidade nem a teste em dispositivo físico. A exigência interna de aceite por outra pessoa foi substituída por decisão expressa de Ana; a automação continua identificada separadamente.

## Uso de IA

ChatGPT/Codex apoiou esta revisão na leitura dos critérios e enunciado, diagnóstico do reset, correção em `frontend/js/app.js`, regressões em `tests/authors.browser.test.mjs`, execução dos testes e atualização deste documento, README e relatório/evidências em `docs/reports/`. A equipe mantém a responsabilidade pela revisão humana e pelo aceite. Nenhuma alteração no seed, biblioteca adicional ou dependência de build foi introduzida.
