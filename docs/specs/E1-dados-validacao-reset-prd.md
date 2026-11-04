# PRD — E1: Dados compartilhados, validação e restauração

Responsável: Ana Flavia Freiria. Branch: `feat/e1-data-validation-reset`.
Status: implementação concluída; revisão e merge pendentes. Continuação do PR #1; cartão principal: FR-07, https://trello.com/c/za4IQ9js.
Fontes: seção 4 e seções 5–7 do enunciado oficial em `materiais/Reading_Tracker_Web_Application.pdf`.

## Objetivo

Entregar contratos de dados testados para os três integrantes conectarem seus formulários à mesma implementação. A base anterior só consultava registros; esta etapa adiciona escrita consistente, validação de domínio e uma ação de restauração disponível na interface.

## Escopo

- Store assíncrono com criação, atualização e exclusão de autores, livros e leituras; criação de temas; países fixos.
- IDs inteiros novos após o maior ID de cada coleção e preservação dos formatos do seed.
- Validações da seção 4 com erros `{status, message, errors: [{field, message}]}`; conflitos 409 e ausências 404.
- Livro e primeira leitura criados em uma única gravação. Falhas não deixam dados parciais.
- Bloqueio da exclusão de autor vinculado; exclusão de livro remove suas leituras.
- Transições de status preparadas por função pura, preservando recomendação/notas e exigindo confirmação explícita antes de limpar ano/nota incompatíveis.
- Reset data com confirmação, falha recuperável e substituição somente da chave da aplicação após receber e validar o seed.
- Testes das regras e atualização do guia para os colegas.

Os formulários de cadastro continuam como prévias; conectar CRUD e erros aos campos pertence aos cartões de cada tela. FR-06 e FR-04 não serão declarados completos antes dessa integração.

## Critérios de aceite

- [x] Todo o seed oficial é aceito pelos validadores.
- [x] Criar, editar e excluir preserva dados após recarga; erros não alteram o armazenamento.
- [x] IDs funcionam com lacunas; valores opcionais usam null ou arrays vazios.
- [x] Nomes únicos, datas reais, anos, referências, classificações, notas e prioridade seguem a seção 4.
- [x] Autor vinculado não é excluído e a mensagem lista os livros.
- [x] Livro com primeira leitura e exclusão em cascata usam uma gravação cada.
- [x] Mudança incompatível de status exige confirmação; cancelamento não altera o registro.
- [x] Reset confirmado restaura exatamente o seed e mantém outras chaves; cancelamento preserva tudo.
- [x] Falhas de fetch, JSON, validação e quota preservam o estado anterior.
- [x] Operações concorrentes na mesma aba não perdem atualizações; alterações em outra aba são relidas; com Web Locks, uma segunda aba de edição é rejeitada sem perda de dados.
- [x] Interface de reset verificada em desktop, celular e teclado.
- [x] README, contratos e declaração de IA atualizados; PR aberto para revisão, sem push direto na main.

## Contratos e decisões finais

Os métodos, exemplos de criação conjunta e transição de status estão em [CONTRATOS_DADOS.md](../CONTRATOS_DADOS.md). Operações de escrita atualizam por id ou criam sem id; atualizações aceitam campos parciais. Campos numéricos já devem chegar como números. Países não têm método de escrita e temas só precisam de criação.

Reset substitui uma única chave após buscar e validar o arquivo oficial; nunca limpa todo o armazenamento. A operação retorna os dados restaurados para atualizar a tela. O diálogo oferece Cancel, Escape e confirmação explícita; o resultado recebe foco e anúncio acessível.

A fila protege concorrência na mesma aba. A investigação com duas abas levou à decisão de manter uma única aba editora com Web Locks, em vez de prometer transações entre abas de localStorage. Tentativas na segunda aba retornam 409; fechar a editora e recarregar a outra permite continuar. Na ausência da API, a fila protege apenas a mesma aba. A limitação e o uso esperado constam no README e no contrato.

## Evidências

- 10 testes da base e 27 testes da camada de dados: 37 no total, sem dependências.
- Seed oficial preservado e integralmente aceito pelos validadores.
- Chrome local: regressão de navegação/listas/histórico/formulários, reset com Cancel e Escape sem alterações, confirmação restaurando dados, outras chaves preservadas, falha de fetch sem perda de edições, diálogo em 390px, conflito de escrita em outra aba, atualização por storage event e passagem de edição após recarga.
- [Captura do diálogo no celular](../screenshots/fr07-reset-mobile.png).

Os testes de contrato exercitam CRUD, IDs com lacunas/limite, cópias independentes, erros serializados, falhas de quota, concorrência, campos obrigatórios, datas reais, listas, referências, anos negativos, notas, status, bloqueio de autor, cascata e atomicidade. As telas de cadastro permanecem sem Save; FR-04 e FR-06 continuam parciais até a integração visual.

## Próximas tarefas

Após revisão e merge, cada integrante cria sua branch de tela a partir da main atualizada. Conectar autores, livros e leituras aos contratos; exibir erros junto aos campos e mensagens gerais para 409; confirmar exclusões e limpezas; atualizar a tela somente após sucesso. Não reimplementar persistência nas páginas.
