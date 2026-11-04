# PRD — E1 / FR-02: Livros e temas na interface

Responsável: Ana Flavia Freiria. Data: 04/11/2026.
Branch: `feat/e1-books-crud`. Status: implementado e verificado; aguardando revisão. PRD escrito antes da implementação.
Cartão: https://trello.com/c/0UQxi7ci. A continuidade foi autorizada por Ana; não alterar atribuições no Trello.

## 1. Problema e objetivo

FR-01 foi integrado à main no merge 6086d38. Books lista obras e histórico, mas o cadastro é uma prévia. Entregar CRUD visual de livros e criação de temas a partir do formulário, reutilizando o padrão de autores. A primeira leitura opcional será conectada à transação existente para manter o formulário coerente com FR-03; isso não conclui todo o CRUD de leituras nem FR-04.

## 2. Fontes

Enunciado oficial `materiais/Reading_Tracker_Web_Application.pdf`, seções 4–7, especialmente Book, FR-02 e cadastro combinado/exclusão em cascata de FR-03. Contratos implementados em `docs/CONTRATOS_DADOS.md`; README, guia do frontend e PRD de autores. Restrições: HTML/CSS/JS puros, módulos ES, textos em inglês dos EUA, sem dependências/build no produto, seed oficial preservado.

## 3. Escopo

- Add book e Edit com título obrigatório; autores/temas existentes selecionáveis, permitindo nenhum ou vários. Ano e classificações opcionais.
- Ano inteiro, não futuro, diferente de zero, aceitando negativos. Edição não pode invalidar ano das leituras existentes. Regras continuam no store/validation.
- Criação explícita de tema no próprio formulário: nome obrigatório/único sem distinguir caixa; novo tema fica selecionado, mantendo seleções e demais campos. Criar tema é uma gravação independente, informada na UI: cancelar o livro não remove o tema já criado. Texto de tema ainda não criado não pode ser descartado silenciosamente ao salvar livro.
- Detalhes completos da obra, incluindo autores, temas, classificações e seu histórico. Preservar View history e ordenação.
- Excluir livro com confirmação contendo título e quantidade atual de leituras que serão removidas. Cancel/Close/Escape preservam todos os dados. Sucesso remove livro/leituras e atualiza snapshot central.
- Na criação, seção opcional da primeira leitura, com status, ano, nota, prioridade, recomendação e notas. Um Save chama saveBookWithReading: nenhum registro parcial em erro. Na edição do livro, leituras existentes permanecem intactas; seu CRUD visual é outra tarefa.
- Erros junto aos campos e mensagem geral; valores preservados após erro de validação/quota/conflito. Bloquear ações e fechamento durante operação, evitar duplo envio, sucesso somente depois de await.

## 4. Organização e contratos

Extrair o ciclo de operação pendente hoje interno a author-form.js para helper compartilhado em forms/form-action.js, pois livros/temas agora precisam do mesmo comportamento. Preservar estados disabled dos controles, capturar multiselect como IDs e checkboxes como booleanos; nenhum acesso direto a localStorage/fetch fora do store. Regressão completa de autores obrigatória.

book-form.js monta edição/criação, primeira leitura e tema. pages/books.js recebe callbacks de ações. app.js continua dono do snapshot, consulta dados atuais por ID antes de editar/excluir/detalhar e atualiza após sucesso. Usar getLibrary/getBook/getBookReadings/saveBook/saveBookWithReading/saveTheme/deleteBook. Sem mudanças de contrato ou de regras previstas.

A criação de temas usa botão explícito; Enter nesse campo aciona a criação. A seção de primeira leitura desmarcada fica desabilitada e não participa da gravação/validação. Não limpar silenciosamente dados ao trocar status: o store valida a combinação e a pessoa corrige os campos; transições de leituras já persistidas ficam para FR-04.

## 5. Fluxos e acessibilidade

Abrir Add book com foco em Title; Edit preenche todos os campos e usa o ID atual. Detalhes mostram ausências como '-'. Após cancelar, foco retorna à ação de origem; após salvar/excluir, foco vai ao anúncio. Confirmação inicia em Cancel. Durante gravação, proteger Close/Escape e desabilitar ações; falhas reabilitam controles e focam o primeiro erro ou a mensagem geral. Storage events não substituem formulário aberto. Falha de atualização após persistência informa que a alteração foi salva e pede recarga.

## 6. Critérios de aceite

- [x] Criar livro com título apenas e com todos os opcionais; consultar, editar, limpar seleções/opcionais e recarregar, preservando ID.
- [x] Apenas registros existentes são selecionáveis; vários autores/temas e listas vazias funcionam.
- [x] Tema criado fica selecionado sem apagar o rascunho; vazio/duplicado rejeitados; tema digitado não criado exige ação explícita.
- [x] Título vazio e anos zero/futuro/fracionário/incompatível com leituras são rejeitados sem escrita; ano negativo aceito.
- [x] Detalhes mostram todos os campos e histórico correto por bookId, com ausências seguras.
- [x] Exclusão confirma quantidade; cancelamento preserva registros; confirmação remove somente a obra e suas leituras, persistindo após recarga.
- [x] Livro + primeira leitura são criados numa gravação; wishlist e Read funcionam, dados incompatíveis rejeitados sem obra parcial.
- [x] Quota/conflito não apagam formulário ou mostram falso sucesso; duplo envio grava uma vez.
- [x] Teclado/Escape/foco, texto seguro e layout 1280px/390px verificados.
- [x] 37 testes de base/dados, suíte de autores e novas verificações de livros aprovados; reset/histórico/navegação preservados.
- [x] README/guia/declaração de IA atualizados; PR para revisão, sem merge automático.

## 7. Plano de testes e limites

Executar baseline e final com testes existentes; acrescentar suíte Chrome/DevTools sem dependências, usando perfil isolado, mesma origem HTTP e somente chave da aplicação. Cobrir CRUD/recarga, multiseleção, temas/duplicidade, ano, cadastro combinado atômico, cascata e cancelamento, falhas, foco e telas. Guardar screenshots novos quando úteis e executar git diff --check.

Não iniciar backend, filtros, gráficos, login ou CRUD completo de leituras/transições. Não declarar FR-03/FR-04/FR-06 completos. Preservar mudanças locais anteriores, exportação do Trello e passagem temporária fora do commit. A coautoria adicionada ao commit de autores não será automaticamente atribuída a novas tarefas.

## 8. Evidências

- Baseline: 10 testes foundation + 27 testes data aprovados. Execução final: os mesmos 37 aprovados, sem alteração em store/validation/seed.
- Regressão Chrome de autores: 35 verificações aprovadas após a extração do helper e atualização da expectativa de Books (agora funcional).
- Nova suíte tests/books.browser.test.mjs: 44 verificações aprovadas, sem exceções não capturadas. Inclui multiseleção, tema vazio/duplicado, preservação de rascunho, tema explícito independente, título apenas, opcionais, ano negativo/zero/futuro/fracionário, edição/recarga, detalhes, cadastro combinado, ano/nota/prioridade incompatíveis sem registro parcial, fieldset desmarcado, quota de tema/livro e nova tentativa, duplo envio, bloqueio de fechamento, contagem/cancelamento/Escape/cascata, referências preservadas, conflito em segunda aba real, texto seguro, teclado e reset.
- A criação de wishlist usou uma única gravação. A exclusão persistiu após recarga e preservou integralmente leituras de outras obras.
- Capturas revisadas visualmente: [desktop 1280px](../screenshots/fr02-book-1280.png) e [celular 390px](../screenshots/fr02-book-390.png). Formulário usa rolagem vertical interna; página/diálogo sem overflow horizontal, tabela com rolagem própria.
- Testes desabilitam cache via DevTools para carregar os módulos da versão atual. Nenhum cache ou dependência foi acrescentado ao produto.
- git diff --check aprovado; README, guia dos colegas e declaração de IA atualizados. PR preparado para revisão, sem merge automático.

Limites: Chrome/Linux; Safari/Firefox e leitor de tela não exercitados. Ainda não há CRUD individual de leituras nem fluxo visual de transições: FR-03/FR-04/FR-06 permanecem parciais. Seleção múltipla usa controles nativos, com dica de teclado e botão para limpar. Criação de tema é independente do salvamento do livro, explicitamente informada; cancelar livro não desfaz tema confirmado. Nenhuma alteração no Trello. Arquivos locais anteriores preservados fora do escopo do commit.
