# PRD — E1 / FR-01: Cadastro visual de autores

Responsável: Ana Flavia Freiria. Data: 04/11/2026.
Branch: `feat/e1-authors-crud`. Status: implementado e verificado; aguardando revisão. PRD escrito antes da implementação.
Cartão atribuído a Ana, conforme informado por ela: https://trello.com/c/tq7eP4Ik.

## 1. Problema e objetivo

A aplicação lista os autores oficiais e já oferece contratos de escrita testados, mas o formulário é uma prévia sem salvamento. Entregar criação, consulta, edição e exclusão pela interface, com persistência e feedback acessível. Este fluxo servirá de referência aos colegas que conectarão Books e Readings.

## 2. Fontes e precedência

- Enunciado oficial `materiais/Reading_Tracker_Web_Application.pdf`, seção 4 (Author), FR-01 e FR-06, seções 5–7.
- `docs/CONTRATOS_DADOS.md`, contratos implementados, e `docs/GUIA_FRONTEND.md`.
- `README.md` e passagem local `PROXIMO_AGENTE.md`; a passagem não cria requisitos oficiais.
- Informações atuais de Ana prevalecem sobre a exportação local do Trello. Não alterar o quadro nesta tarefa.

## 3. Escopo e limites

Entregar Add author, edição com campos preenchidos, listagem atualizada e exclusão confirmada. Nome é obrigatório e único sem distinguir caixa. Nacionalidade é opcional e usa exclusivamente os países do seed. Datas são opcionais e reais; nascimento não futuro; falecimento estritamente posterior ao nascimento quando ambos existem. Falecimento sem nascimento é permitido.

Manter HTML/CSS/JavaScript puros, módulos ES, interface em inglês dos EUA e textos compartilhados em strings.js. Reutilizar os estilos e helpers existentes; preservar navegação, histórico, reset e prévias de livros/leituras. Não alterar o seed.

Fora do escopo: CRUD visual de livros/leituras, novas regras de domínio, países editáveis, backend, filtros, redesign e funcionalidades opcionais. FR-06 permanece parcial até todos os formulários serem conectados.

## 4. Fluxos e comportamento esperado

1. **Criar:** Add author abre diálogo vazio, com nome em foco. Save aguarda o store; sucesso fecha o diálogo, atualiza a lista na rota atual e anuncia o resultado. Cancel, Close e Escape descartam apenas os campos não salvos.
2. **Editar:** ação por linha abre dados atuais pelo ID, incluindo campos opcionais. Save preserva ID e relações; apagar um opcional envia null. Erro de consulta informa a falha sem abrir dados antigos.
3. **Excluir:** ação por linha pede confirmação com o nome; Cancel recebe foco. Cancel/Close/Escape não chamam o store. Confirmação aguarda exclusão. Autor vinculado permanece e a mensagem informa os livros relacionados.
4. **Falhar e tentar novamente:** validação apresenta mensagens junto aos campos e foco no primeiro inválido; conflitos/falhas apresentam mensagem geral. Nome duplicado recebe também erro de campo, distinguindo conflito de outra aba. Manter valores digitados e permitir nova tentativa.
5. **Operação em andamento:** bloquear envio duplicado e mudanças durante gravação, incluindo fechamento do diálogo; reabilitar após falha. Sucesso somente depois da persistência, nunca de forma otimista.
6. **Atualizar:** app.js continua dono do snapshot; callbacks explícitos pedem atualização após escrita. Eventos storage não substituem um formulário aberto. Se a atualização da lista falhar após escrita, informar que a gravação ocorreu e que a listagem precisa ser recarregada.

## 5. Organização e contratos

- `js/forms/author-form.js`: formulário específico, montagem dos valores e apresentação de erros; regras de domínio continuam em validation.js/store.js.
- `js/pages/authors.js`: ações por linha e chamadas explícitas aos callbacks.
- `js/app.js`: abertura dos fluxos, consulta atual por ID, exclusão e atualização centralizada do snapshot; sem segunda persistência.
- `js/ui.js`: reaproveitar field/showFieldErrors/confirmAction e ajustar helpers somente quando necessário para foco e operações pendentes.
- `js/strings.js` e CSS: textos e pequenos estilos dos controles reais.

Contratos: getAuthor(id), getCountries(), saveAuthor(values), deleteAuthor(id), getLibrary(). Todos async. Nacionalidade selecionada vira número; vazio e datas apagadas viram null. Erros seguem status/message/errors. Nenhuma página ou formulário acessará localStorage/fetch diretamente. Escritas não contornam Web Locks.

## 6. Critérios de aceite

- [x] Criar com nome apenas e com todos os campos; listar os valores e preservar após recarga.
- [x] Editar e limpar opcionais preservando ID e vínculos; nome inalterado pode ser salvo.
- [x] Nome vazio/duplicado e datas inválidas rejeitados sem escrita; feedback junto aos campos.
- [x] Países oficiais, sem cadastro livre, e nenhuma obrigatoriedade extra.
- [x] Exclusão cancelada não grava; exclusão aceita persiste após recarga.
- [x] Autor vinculado não é excluído e títulos dos livros aparecem na mensagem.
- [x] Falha de quota e conflito entre abas preservam valores, não anunciam sucesso e permitem recuperação.
- [x] Duplo envio grava uma vez; controles voltam após erro.
- [x] Teclado, Escape, foco, textos seguros e layout desktop/390px verificados.
- [x] Histórico, navegação, reset e outras prévias preservados; suítes anteriores aprovadas.
- [x] README, guia dos colegas e declaração de IA atualizados; PR preparado sem merge.

## 7. Plano de verificação

Baseline antes de editar: 10 testes de foundation + 27 de data aprovados em 04/11/2026. Rodar novamente após alterações e executar git diff --check.

Adicionar verificação de interface em navegador real, sem dependências no produto: criação, edição, recarga, campos opcionais, duplicidade sem distinguir caixa, datas, exclusão cancelada/aceita, autor vinculado, falha de persistência, conflito de aba, duplo envio e teclado. Comparar armazenamento antes/depois de operações rejeitadas. Usar perfil de teste isolado e a mesma origem HTTP. Inspecionar console, largura de 390px e screenshots atuais. Registrar limitações reais em vez de declarar uma verificação não executada.

## 8. Riscos e decisões

Conflito 409 pode significar duplicidade ou outra aba: somente a mensagem conhecida de duplicidade será associada a name. O store mantém a validação final. A listagem pode remover o botão que abriu o diálogo após sucesso; encaminhar foco para o anúncio do resultado. Não sobrescrever alterações locais anteriores, incluir exportação do Trello no PR ou fazer merge automático.

## 9. Evidências e pendências

- `node tests/foundation.test.mjs`: 10 testes aprovados.
- `node tests/data.test.mjs`: 27 testes aprovados, incluindo datas reais e CRUD de domínio.
- `node tests/authors.browser.test.mjs`: 35 verificações aprovadas no Chrome headless, sem exceções não capturadas. O teste fica versionado e usa Node/DevTools, sem pacotes npm.
- Criar, editar, limpar opcionais, manter nome inalterado, excluir e recarregar: aprovados. Falecimento sem nascimento também foi aceito.
- Nome vazio/duplicado e datas incompatíveis: mensagens junto aos campos, sem gravação. ID e vínculos preservados ao editar autor relacionado a livros.
- Quota simulada: dados e campos preservados, nova tentativa concluída. Erro de leitura após escrita: aviso explícito de que a mudança foi salva, persistência confirmada após recarga, sem duplicação.
- Segunda aba real: conflito Web Locks preserva o formulário e não aparece como duplicidade de nome. Evento storage com formulário aberto preserva rascunho. Consulta de linha cujo registro foi removido informa 404 sem abrir dados antigos.
- Duplo submit: uma gravação; Close e Escape protegidos durante operação. Cancel/Escape da exclusão preservam registro, com retorno do foco ao botão; sucesso leva foco ao anúncio. Tab alcança nacionalidade.
- Texto semelhante a HTML aparece como texto, sem elemento injetado. Navegação, cinco colunas ordenáveis, prévias de livros/leituras e reset com cancelamento/confirmação preservados.
- Revisão visual das capturas [1280px](../screenshots/fr01-author-1280.png) e [390px](../screenshots/fr01-author-390.png), sem overflow no diálogo/página. A tabela mantém rolagem horizontal própria no celular.
- `git diff --check`: aprovado.

A regressão do reset identificou uma janela de reabertura antes do processamento do fechamento. O botão e as ações da página agora ficam bloqueados durante a confirmação, até o resultado ser processado. A suíte final confirmou cancelamento e restauração.

Limites: execução automatizada em Chrome no Linux; não foi verificado Safari/Firefox nem leitor de tela. Nenhuma promessa de edição simultânea: permanece a política de uma aba editora. Livros, leituras e FR-06 completo continuam pendentes. O quadro do Trello não foi alterado. Alterações locais anteriores e arquivos de passagem/exportação foram preservados fora do escopo do commit.
