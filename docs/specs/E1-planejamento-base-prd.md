# PRD — E1: Planejar telas e modelo de dados

> Registro do escopo do PR #1, já integrado. Para o contrato atual de escrita, validação e restauração, consulte [CONTRATOS_DADOS.md](../CONTRATOS_DADOS.md) e o [PRD da etapa seguinte](E1-dados-validacao-reset-prd.md).

Status: escopo do PR #1 integrado à main; registro histórico da base inicial.
Responsável: Ana Flavia Freiria. Revisor: outro integrante, a definir.
Cartão: https://trello.com/c/Qy6FDeuO
Branch: `feat/e1-frontend-foundation`.
Fontes e contexto: [planejamento detalhado](../PLANEJAMENTO_FRONTEND.md), enunciado oficial em `materiais/Reading_Tracker_Web_Application.pdf` e `frontend/data/seed.json`.

## Problema e resultado esperado

O repositório tinha documentação e arquivos vazios. Três integrantes precisam desenvolver o frontend em paralelo sem criar modelos incompatíveis, duplicar componentes ou misturar dados com renderização.

Esta tarefa entrega uma base executável por HTTP, com navegação, modelo oficial, exemplos de formulários e convenções claras. Ao abrir a aplicação, a equipe consegue explorar as coleções reais, observar campos incompletos, consultar leituras por livro e identificar o módulo de cada próxima tarefa.

## Escopo desta tarefa

- HTML semântico, CSS responsivo e módulos ES, sem pacotes de frontend ou build.
- Navegação por hash entre Reading History, Books e Authors, preservando o histórico do navegador.
- Listagens reais e histórico de leituras por livro em diálogo.
- Formulários de referência para autores, livros e leituras. Seletores usam dados oficiais; livro inclui seção opcional de primeira leitura. Save fica desabilitado e a prévia é identificada explicitamente.
- Constantes e textos compartilhados em inglês dos EUA.
- Leitura assíncrona no store, carga inicial via fetch e cópia no localStorage. Erros preservam dados existentes e permitem nova tentativa.
- Histórico ordenável para validar o componente de tabela e o modelo livro/leitura.
- Estados de carregamento, vazio e falha; helpers de campos e erros para os próximos formulários.
- Documentação para execução, contratos, colaboração e transferência aos colegas.

Não inclui criação, edição ou exclusão de registros, regras completas de domínio, confirmação de transições de status, reset, busca, wishlist dedicada, gráficos ou backend. A carga inicial antecipa parte do cartão FR-07 para que esta base trabalhe com dados reais; isso não conclui aquele cartão.

## Experiência e telas

| Área | Fluxo nesta base | Continuação |
|---|---|---|
| Reading History | Abre por padrão; ordena título, autores, status, ano e nota | CRUD e fluxo de status |
| Books | Lista obras; View history abre leituras por bookId | CRUD, temas, primeira leitura atômica e exclusão em cascata |
| Authors | Lista nome, nacionalidade, datas e quantidade de obras | CRUD e bloqueio de exclusão vinculada |
| Form previews | Abrem em diálogo; Close ou Escape fecham; nada é salvo | Conectar ao store após validação de domínio |

Uma leitura é uma ocasião; uma obra pode ter várias. A wishlist corresponde a uma leitura Want to read. A mesma obra não precisa ser duplicada para releitura.

No celular, a navegação se reorganiza e as tabelas rolam horizontalmente dentro do painel. O foco da navegação vai ao conteúdo; diálogos usam o comportamento modal nativo. Dados são inseridos com textContent, sem interpolação HTML.

## Contrato de dados implementado

Todas as funções exportadas de `store.js` são async e retornam cópias independentes:

| Função | Resultado |
|---|---|
| getLibrary() | Objeto com as cinco coleções para montar as telas |
| getAuthors(), getBooks(), getReadings(), getThemes(), getCountries() | Coleção correspondente |
| getBook(id) | Livro ou StoreError 404 |
| getBookReadings(bookId) | Leituras filtradas pela referência; valida existência do livro |

IDs são inteiros e passados como números. Os campos seguem exatamente o seed, sem converter referências em objetos aninhados. A chave de armazenamento é `reading-tracker:data:v1`. Apenas o store acessa localStorage ou fetch de dados. A primeira inicialização compartilha uma única carga entre consumidores concorrentes; erros liberam nova tentativa. Não há sincronização de alterações entre abas nesta base.

`assertLibrary` é uma proteção estrutural de coleções, IDs e referências. Não representa FR-06 e não substitui a validação de cada regra da seção 4. `StoreError` expõe status, message e errors; o helper `showFieldErrors` apresenta erros de campo. Não incluir regras de negócio nos renderizadores.

## Contratos propostos para as próximas tarefas

Os métodos abaixo ainda não existem; não chamar até serem implementados e verificados:

- `saveAuthor(author)`, `saveBook(book)`, `saveReading(reading)`, `saveTheme(theme)`: sem id cria; com id atualiza, exceto temas, que só precisam de criação. Retornam o registro salvo.
- `deleteAuthor(id)`, `deleteBook(id)`, `deleteReading(id)`: exclusão após confirmação na UI; o store reforça vínculos e consistência. Exclusão de livro remove suas leituras numa única persistência.
- `saveBookWithReading(book, readingOrNull)`: cria livro com primeira leitura opcional; validar ambos antes de persistir. Erros não podem deixar livro ou leitura parcial. Combinar a futura integração HTTP com o backend.
- `resetData()`: restaurar o seed após confirmação na UI; só alterar as chaves da aplicação.

Novos IDs são calculados a partir do maior de cada coleção, nunca do tamanho. Após mutações, o store deve atualizar sua cópia interna e persistir antes de retornar; as telas recarregam os dados via store. Falhas de gravação devem preservar o estado anterior.

Conflitos 409 e ausências 404 usam errors vazio; entradas inválidas retornam 400 e errors com field/message. A implementação dos cadastros deve alinhar os nomes dos campos com o seed, como authorIds e themeIds.

## Critérios de aceitação desta tarefa

- [x] Telas e formulários de referência das três áreas, com limites visíveis de prévia.
- [x] Navegação e histórico por livro sem depender de igualdade entre IDs de livros e leituras.
- [x] Seletores oficiais de países, autores, temas e valores controlados.
- [x] Textos compartilhados e estados vazios.
- [x] Seed oficial preservado; carregamento HTTP e manutenção de dados salvos na próxima visita.
- [x] Nenhuma escrita de cadastro feita pelos formulários de referência.
- [x] Estrutura documentada para desenvolvimento paralelo.
- [x] Verificação em desktop e viewport de celular, navegação, ordenação, diálogos, falha e nova tentativa.
- [x] Testes de integridade, isolamento de cópias, persistência e ausência de sobrescrita em erros.

## Verificação executada

`node tests/foundation.test.mjs`: 10 testes aprovados, sem dependências. Node é apenas uma ferramenta opcional de verificação; o frontend executa no navegador sem Node ou npm.

Chrome local: três rotas e suas contagens (143 livros, 101 autores, 143 leituras), ordenação, leituras por livro, prévias, seletor de primeira leitura, fechamento com Escape, 1440px e 390px sem overflow da página, erro de armazenamento malformado, nova tentativa, estado vazio e renderização de texto com caracteres HTML sem execução. Não houve exceções JavaScript durante essa verificação.

A verificação não certifica FR-01 a FR-04 ou FR-06 completos, pois seus fluxos de escrita ainda não existem.

Prévia verificada: [desktop](../screenshots/e1-desktop.png) e [celular](../screenshots/e1-mobile.png).

## Entrega e colaboração

Abrir PR para main e aguardar revisão de outro integrante. Nunca fazer commits diretos em main. Não criar tag delivery-1 nesta tarefa. O cartão de planejamento pode ser concluído após revisão e aceite da base; os cartões funcionais continuam separados.

[A orientação aos colegas](../GUIA_FRONTEND.md) contém arquivos, próximos passos e um texto pronto para compartilhar. A atribuição individual das próximas tarefas é sugestão, a confirmar com a equipe.
