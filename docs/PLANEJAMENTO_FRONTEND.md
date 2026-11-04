# Planejamento da base do frontend

Consulta ao Moodle autenticado em 04/11/2026. Este documento registra o planejamento original. A base navegável foi implementada para revisão; consulte o [PRD da tarefa](specs/E1-planejamento-base-prd.md) para o escopo entregue, contratos e pendências atuais.

## Fontes oficiais

- [Trabalhos do semestre](https://campusvirtual.unifal-mg.edu.br/moodle/course/section.php?id=30335).
- Materiais baixados sem alterações em `materiais/`: enunciado, slides, registro original, `Seed_Data_Guide.pdf` e `seed.json`.
- Enunciado atualizado em 16/10/2026; ele prevalece sobre este planejamento.
- Os cinco downloads funcionaram. O bloqueio de obtenção dos arquivos registrado no Trello pode ser reavaliado; o guia atual chama-se `Seed_Data_Guide.pdf`.
- JSON conferido: 27 países, 101 autores, 135 temas, 143 livros e 143 leituras. O guia informa 132 temas, mas o arquivo recebido contém 135: preservar o JSON oficial. Há 115 leituras Read, 12 Paused e 16 Want to read; dois livros sem autores e 12 sem ano. Nenhuma referência entre as cinco coleções está quebrada.

## Escopo e prazos

Entrega 1: 20/11/2026, 23h59 de Brasília. FR-01 a FR-07 completos, persistência no navegador, README e repositório público. Sem vídeo. Entrega 2: 11/12/2026, 23h59; integração com Java 21+ e Spring Boot 4.x, persistência e vídeo de até 15 minutos.

HTML, CSS e JavaScript puros; fetch e JSON. Sem frameworks, Bootstrap, Tailwind, TypeScript, npm no frontend ou bundlers. Google Fonts e fontes de ícones são permitidos. Toda a interface e valores controlados em inglês dos EUA. Nomes e títulos permanecem no idioma original. Declarar IA no README e compreender o código produzido.

## Telas e fluxos propostos

| Área | Conteúdo e ações | Requisitos |
|---|---|---|
| Reading History | Título, autores, status, ano lido, nota; ordenação por coluna; adicionar, editar e excluir leitura | FR-03, FR-04, FR-05 |
| Books | Lista, cadastro, edição e detalhes; autores e temas existentes; criação de tema; primeira leitura opcional no mesmo Save | FR-02, FR-03 |
| Book details | Dados da obra e suas leituras; releitura cria outro registro; exclusão informa quantidade de leituras afetadas | FR-03 |
| Authors | Lista, cadastro, edição, exclusão; país fixo e datas; bloqueio de exclusão com nomes dos livros vinculados | FR-01 |
| Reset data | Ação global com confirmação e retorno aos dados oficiais | FR-07 |

Prever carregamento, erro com nova tentativa, lista vazia, sucesso e erro junto ao campo. Navegação por teclado, labels, foco e layout para celular. Não apresentar botões como funcionais antes da implementação. Wishlist dedicada, gráficos, login e busca são opcionais e ficam para depois do obrigatório.

## Modelo de dados oficial

Livro é uma obra; leitura é uma ocasião. Uma obra pode ter várias leituras, independentemente da correspondência inicial dos IDs no seed.

| Coleção | Campos |
|---|---|
| countries | id, name |
| authors | id, name, countryId, birthDate, deathDate |
| themes | id, name |
| books | id, title, authorIds, publicationYear, form, mode, content, themeIds |
| readings | id, bookId, status, yearRead, grade, recommendedBy, priority, notes |

Preservar IDs inteiros, referências por ID, números como números, datas YYYY-MM-DD, ausências `null` e coleções vazias `[]`. Nunca assumir que IDs são índices ou que bookId equivale ao ID de leitura.

Valores mínimos: form = Novel, Novella, Short Story, Short Story Collection, Play, Essay, Treatise, Diary, Graphic Novel; mode = Prose, Drama, Poetry, Sequential Art; content = Fiction, Non-fiction; status = Want to read, Reading, Paused, Read, Abandoned; priority = Low, Medium, High.

## Organização proposta

Manter o frontend autocontido em `frontend/`, usando módulos ES sem build:

- `index.html`: estrutura semântica e navegação.
- `css/styles.css`: estilos compartilhados, variáveis de cores, espaçamento e componentes; estilos específicos podem ser separados por área para reduzir conflitos.
- `js/app.js`: inicialização e navegação.
- `js/store.js`: único ponto de acesso a dados, primeiro com localStorage e depois fetch/API.
- `js/validation.js`: regras de domínio, sem manipulação do DOM.
- `js/ui.js`: renderização e comportamento compartilhados de formulários e mensagens.
- `js/strings.js`: textos compartilhados da interface em inglês.
- `js/constants.js`: valores controlados.
- `js/pages/authors.js`, `books.js`, `readings.js`: módulos por área.
- `data/seed.json`: cópia idêntica do arquivo oficial quando a carga inicial for implementada.

As telas chamam o store com await, sem acessar localStorage ou fetch de dados diretamente. Funções públicas do store são async: getAuthors, saveAuthor, deleteAuthor, getBooks, getBook, saveBook, deleteBook, getReadings, saveReading, deleteReading, getThemes, saveTheme, getCountries, resetData. Assinaturas e operação de livro com primeira leitura devem ser combinadas antes de distribuir a implementação; salvar os dois deve evitar registros parciais quando houver erro.

Erros seguem `{status, message, errors: [{field, message}]}`, compatível com a seção 7. Conflitos usam 409; não encontrado, 404; validação, 400. Em conflitos, errors é vazio. A apresentação dos erros fica na camada de interface.

Na primeira carga, ler o seed via fetch e salvar no armazenamento. Nas demais, preservar alterações. Usar chaves próprias da aplicação, IDs após o maior existente e confirmação para reset. Nunca usar localStorage.clear(). Não substituir dados existentes silenciosamente quando houver falha de leitura. Executar via servidor HTTP, como Live Server.

## Regras que influenciam os formulários

- Autor: nome obrigatório e único sem diferenciar caixa; país opcional da lista fixa; nascimento não futuro; falecimento posterior ao nascimento.
- Livro: apenas título é obrigatório. Ano opcional, inteiro, não futuro; negativos aceitos, zero inválido. Autores e temas podem ser vazios. Tema único sem diferenciar caixa.
- Read exige yearRead; Abandoned permite; demais statuses não permitem. Ano não futuro nem anterior à publicação.
- Grade opcional de 0 a 10, passo 0,5, somente em Read ou Abandoned.
- Priority somente em Want to read. Ao sair, limpar prioridade e preservar recommendedBy e notes.
- Confirmar antes de apagar ano/nota incompatíveis numa mudança de status; cancelar preserva o registro.
- Histórico começa por yearRead decrescente e ID crescente no empate; ausências ficam depois dos preenchidos em qualquer direção e aparecem como `-`.

## Ordem de execução e colaboração

1. Revisar este plano, os materiais oficiais e o mapa das telas.
2. Criar a estrutura de navegação, estilos compartilhados, mensagens e contratos do store.
3. Implementar carga inicial, persistência e validação compartilhadas.
4. Validar um fluxo completo: criar autor, criar livro com primeira leitura e recarregar a página.
5. Distribuir módulos por área; integrar e completar os demais fluxos.
6. Verificar FR-01 a FR-07, responsividade, execução em cópia limpa e README.

Sugestão a combinar: Ana conduz a base e o contrato comum; os outros dois integrantes assumem Authors e Books; Ana assume Reading History e integração. Leituras no formulário de livro usam componente compartilhado. Definir responsáveis e revisores antes de começar; todos entendem a aplicação inteira.

Cada tarefa usa branch própria e PR revisado por outro integrante. Combinar mudanças em store, validation, UI e estilos compartilhados. A base estará pronta para os colegas quando executar por HTTP, navegar pelas áreas, carregar o seed e oferecer contratos e componentes documentados; este documento sozinho não conclui o cartão de planejamento, que também pede telas/formulários.

## Validação e entrega

Conferir CRUD, vínculos de autores, exclusão em cascata, releituras, todos os statuses, cancelamento de confirmações, dados incompletos, ordenação, recarga e reset. Registrar FRs como implementados, parciais ou não implementados conforme evidência. README inclui integrantes/matrículas, execução e declaração de IA. Entrega por e-mail e tag delivery-1 antes do prazo; responsável pelo envio a combinar.

A revisão consultou o enunciado, guia do seed, estrutura dos dados, slides, registro de origem, cronograma e avisos recentes relacionados ao trabalho. Não equivale a assistir a todos os vídeos da disciplina. A leitura e organização deste plano tiveram auxílio do Codex; atualizar a declaração de IA do projeto conforme os arquivos efetivamente implementados.
