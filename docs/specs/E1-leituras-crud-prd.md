# PRD — E1 / FR-03: Leituras e cadastro em uma etapa

Data: 04/11/2026. Branch: `feat/e1-readings-crud`.
Status: implementado e verificado; aguardando revisão. PRD escrito antes da implementação. Continuidade autorizada pela equipe nesta sessão.
Base: main 11e272f, com PRs #4 (livros) e #5 (declaração de IA) mergeados.
Cartão: https://trello.com/c/znHiC8qX.

## 1. Problema e objetivo

O store oferece CRUD de leituras, e o cadastro de livro já cria uma primeira leitura atomicamente. Falta operar leituras de livros existentes, consultar seus dados completos, editar e excluir registros individuais. Entregar esses fluxos sem substituir leituras anteriores ao registrar uma releitura.

## 2. Fontes e critérios do cartão

Conferidos antes da implementação: enunciado oficial `materiais/Reading_Tracker_Web_Application.pdf`, seções 4–7; contratos em `docs/CONTRATOS_DADOS.md`; exportação local `BSpxAKlv - programacao-web-trabalho-2-reading-tracker (1).json`. Consulta direta ao Trello em 04/11/2026 retornou recurso sem acesso; a exportação é uma fotografia, não confirmação do estado atual dos responsáveis. Não modificar o quadro.

| Critério literal do cartão | Implementação prevista | Evidência de aceite |
|---|---|---|
| Adicionar, consultar, editar e excluir leituras de um livro | Add reading no histórico global e nas obras; detalhes completos; Edit e Delete por ID, confirmação individual | Teste de interface: criação, consulta, edição, cancelamento/exclusão e recarga |
| Criar livro e primeira leitura opcional com um único Save | Preservar saveBookWithReading no cadastro de livro | Reexecutar suíte de livros: uma gravação e nenhuma obra parcial em erro |
| Permitir várias leituras para o mesmo livro | Toda inclusão cria sem id; edição preserva id; livro referenciado por bookId | Criar releitura, comparar ID e conteúdo do registro antigo, recarregar e consultar histórico da obra |
| Ao excluir livro, confirmar e informar a quantidade de leituras excluídas | Preservar confirmação da obra e atualizar contagem com releituras | Testar cancelamento e confirmação com várias leituras, preservando as de outros livros |

## 3. Escopo e exclusões

- Substituir a última prévia por formulário funcional de leitura. Livro e status obrigatórios, selecionados de registros/valores existentes; permitir os opcionais oficiais.
- Ações acessíveis por leitura no histórico global e da obra, mantendo cinco colunas ordenáveis e ausências como '-'. Detalhes incluem livro, status, ano, nota, prioridade, recomendação e notas.
- Criar nova leitura de um livro já existente sem alterar histórico; editar por getReading(id) atual, mantendo seu ID; excluir somente aquela leitura após confirmação com livro e identificação da leitura.
- Validar via store: Read exige ano; Abandoned permite; demais não permitem ano/nota; nota 0–10, passo 0,5; prioridade apenas wishlist; ano não futuro nem anterior à publicação. Converter números conscientemente e proteger badInput.
- Como proteção necessária da edição, reutilizar prepareReadingTransition ao alterar status. Antes de limpar ano/nota, mostrar quais campos serão removidos e exigir confirmação explícita no próprio formulário; trocar o status/campos invalida a confirmação antiga. Não apagar os valores digitados antes de salvar. Cancelar/fechar sem salvar não grava. Ao sair da wishlist, limpar prioridade e preservar recomendação/notas.
- Reutilizar bindFormAction e snapshot central em app.js; falhas preservam campos; impedir duplo envio e Close/Escape durante escrita; foco no erro ou anúncio de sucesso. Storage events aguardam fechamento do diálogo.
- Livros sem leituras continuam permitindo Add reading; sem livros, explicar que é necessário cadastrar um livro e impedir salvar leitura sem referência.

Fora do escopo: backend, filtros, gráficos, login, mudanças de persistência/seed e redesenho amplo. FR-04 terá auditoria específica de seus cinco critérios em etapa própria; FR-06 permanece parcial até a revisão completa das validações da seção 4. Não declarar esses cartões concluídos apenas por este formulário.

## 4. Arquitetura e contratos

`forms/reading-form.js`: formulário de inclusão/edição e confirmação de exclusão, textos em strings.js. Reutilizar `form-action.js` sem nova fila ou armazenamento. Extrair campos compartilhados da primeira leitura somente se houver necessidade concreta, sem refatoração ampla.

`pages/readings.js`: manter ordenação pura e adicionar callbacks explícitos de detalhes/edição/exclusão. `pages/books.js`: encaminhar View history para app.js, que consulta dados atuais; detalhes/histórico da obra recebem ações de leituras e Add reading. Não confundir id de leitura com bookId, nem com índice.

`app.js`: abertura por ID, contexto opcional de livro, roteamento e atualização após sucesso. Um diálogo pode trocar do histórico da obra para uma leitura; preservar o botão original da página para restaurar foco ao cancelar. Não criar diálogos modais aninhados ou sobrescrever formulário aberto em evento storage.

Contratos async utilizados: getLibrary, getBook, getReading, saveReading, deleteReading; preparação pura de transição. saveBookWithReading/deleteBook permanecem nos fluxos existentes. Alteração de contrato não prevista.

## 5. Critérios adicionais de aceite

- [x] Quatro critérios do cartão atendidos com evidência separada na tabela acima.
- [x] Consulta apresenta todos os opcionais, inclusive nota zero e texto semelhante a HTML com segurança.
- [x] Criação/edição/exclusão persistem após recarga; edição não altera outras leituras nem livros.
- [x] Validações aparecem nos campos; erros de quota/409/404 preservam estado e não anunciam falso sucesso.
- [x] Releitura cria novo ID e preserva integralmente registro anterior.
- [x] Confirmação individual Cancel/Escape não escreve; aceite remove só o registro escolhido.
- [x] Mudança incompatível de status exige confirmação atual; falha/cancelamento não apagam campos ou dados persistidos.
- [x] Foco, teclado, 1280px/390px, estado sem livros e livro sem leituras verificados.
- [x] Regressões de autores, livros, histórico, cadastro combinado, cascata e reset aprovadas.
- [x] README/guia/declaração impessoal de IA atualizados; git diff --check e PR para revisão, sem merge automático.

## 6. Plano de verificação

Baseline: 10 testes foundation + 27 data aprovados nesta retomada. Executar novamente ao final, junto às suítes Chrome de autores/livros (35 e 44 verificações existentes), sequencialmente no perfil isolado. Criar suíte de leituras com cobertura dos critérios acima, comparação de dados antes/depois, falhas injetadas, segunda aba real, navegação, teclado, capturas e ausência de exceções não capturadas. Node/DevTools apenas como ferramenta de teste, sem dependências no frontend.

## 7. Riscos e limites

IDs de leituras e livros coincidem parcialmente no seed: testes devem usar releituras com IDs distintos. Uma confirmação antiga não pode autorizar limpeza de outros dados; recalcular campos e status antes de salvar. Não converter entrada numérica inválida em null. Preservar o texto impessoal de IA aprovado no PR #5 e as mudanças locais anteriores fora do commit. Não atribuir novas contribuições ou coautorias automaticamente.

## 8. Evidências finais

| Critério do cartão | Resultado verificado |
|---|---|
| Adicionar, consultar, editar e excluir leituras de um livro | Aprovado: testes FR03-C1 da nova suíte, incluindo opcionais, edição por ID, recarga e exclusão que preserva obra/demais leituras |
| Criar livro e primeira leitura opcional com um único Save | Aprovado: FR03-C2 confirma uma gravação, presença no histórico após recarga e nenhuma obra parcial em erro; regressão de livros também aprovada |
| Permitir várias leituras para o mesmo livro | Aprovado: FR03-C3 cria ID distinto do anterior e do livro, compara o registro anterior integralmente e consulta ambas no histórico da obra |
| Ao excluir livro, confirmar e informar a quantidade de leituras excluídas | Aprovado: FR03-C4 verifica contagem atual com releituras, cancelamento sem escrita e cascata preservando todas as leituras de outras obras |

- 10 testes foundation + 27 testes data aprovados antes e após a implementação.
- Chrome: 35 verificações de autores e 44 de livros aprovadas, com expectativa do último formulário atualizada de prévia para funcional.
- tests/readings.browser.test.mjs: 51 verificações aprovadas, sem exceções não capturadas. Além da matriz, cobre ano/nota/prioridade inválidos sem gravação, nota zero, Abandoned sem ano, confirmação atual de limpeza, cancelamento, quota/nova tentativa, 409 em segunda aba real, 404 dentro do diálogo, evento storage preservando rascunho e falha de atualização depois da escrita sem duplicação.
- Foco inicial, Tab, Escape, retorno ao botão original após navegar do histórico da obra para sua leitura e foco no resultado aprovados. Estado sem livros explica o pré-requisito e impede gravação. Histórico vazio por obra continua acessível e mantém Add reading (revisão do renderizador e regressão de detalhes de livro sem leituras na suíte de livros).
- Capturas revisadas visualmente: [1280px](../screenshots/fr03-reading-1280.png) e [390px](../screenshots/fr03-reading-390.png). Formulário com rolagem vertical interna no celular; sem overflow horizontal da página/diálogo. A tabela mantém rolagem própria.
- Prévia antiga removida de forms.js; todos os cadastros passam pelos mesmos contratos. Store, validation e seed preservados. Declaração de IA mantém texto impessoal aprovado no PR #5.
- git diff --check aprovado; PR preparado para revisão, sem merge automático.

Limites: testes em Chrome/Linux, sem Safari/Firefox ou leitor de tela. FR-04 e FR-06 permanecem parciais até auditorias dedicadas; a proteção de mudança de status deste formulário não substitui sua matriz completa de verificação. O acesso direto ao cartão não funcionou; critérios conferidos na exportação e no enunciado. Nenhuma alteração no Trello. Arquivos locais anteriores preservados fora do escopo do commit.
