# Reading Tracker

Aplicação web para gerenciar autores, livros e leituras, desenvolvida para o Trabalho #2 da disciplina **Programação Web (DCE701), UNIFAL-MG, 2026/2**.

O projeto será construído em duas etapas: frontend em HTML, CSS e JavaScript puros com armazenamento no navegador; depois, integração com uma API REST em Java e Spring Boot e persistência em banco de dados.

> **Estado atual:** frontend com dados oficiais, CRUD visual de autores, livros e leituras, criação de temas e Reset data. É possível registrar releituras sem alterar o histórico anterior, cadastrar livro com primeira leitura em um Save e excluir obra/leituras com confirmação. A edição de leitura protege a remoção de ano/nota em mudanças de status. O fluxo de status foi auditado nas 25 combinações de origem/destino, com confirmação antes de remover ano/nota. A FR-06 foi auditada com testes automatizados e inspeção visual de capturas. Os formulários foram verificados em desktop (1280px) e viewport móvel emulada (390px); testes em aparelho físico não foram realizados. A revisão geral da entrega continua pendente. Backend ainda não implementado.

## Equipe

| Integrante | Matrícula |
|---|---|
| Ana Flavia Freiria | 2024.1.08.001 |
| Aurelio Junior | 2024.2.08.008 |
| Otávio de Oliveira | 2025.1.08.034 |
| Pedro Luccas | 2022.2.08.009 |
| Raissa Peret | 2024.1.08.021 |


A composição da equipe deve ser mantida entre as duas entregas. Cada integrante deve contribuir com commits e compreender o código apresentado.

### Divisão de responsabilidades

| Frente | Integrantes | Responsabilidades principais |
|---|---|---|
| Frontend | Aurelio Junior, Ana Flavia Freiria e Otávio de Oliveira | Telas, HTML/CSS/JavaScript, validações no navegador, localStorage na entrega 1 e integração com a API na entrega 2 |
| Backend | Pedro Luccas e Raissa Peret | API Spring Boot, regras e validações no servidor, banco persistente, importação do seed e restauração |

Integração, testes de aceitação, documentação, declaração de uso de IA, revisão e preparação das entregas são responsabilidades compartilhadas. Durante a primeira etapa, Pedro e Raissa também preparam o backend e apoiam a revisão e os testes do frontend. A divisão interna das tarefas de cada frente será registrada no Trello.

## Repositório e planejamento

- [Repositório público](https://github.com/anafreiria/ReadingTracker)
- [Quadro de tarefas no Trello](https://trello.com/b/BSpxAKlv)
- [Roteiro de desenvolvimento](docs/ROTEIRO_DESENVOLVIMENTO.md)
- [PRD da base E1](docs/specs/E1-planejamento-base-prd.md)
- [Guia para os colegas do frontend](docs/GUIA_FRONTEND.md)
- [Contratos implementados de dados e validação](docs/CONTRATOS_DADOS.md)
- [PRD de dados, validação e reset](docs/specs/E1-dados-validacao-reset-prd.md)
- [PRD do CRUD visual de autores](docs/specs/E1-autores-crud-prd.md)
- [PRD de livros e temas](docs/specs/E1-livros-crud-prd.md)
- [PRD de leituras e matriz dos critérios de FR-03](docs/specs/E1-leituras-crud-prd.md)
- [PRD do fluxo de status e matriz dos critérios de FR-04](docs/specs/E1-fluxo-status-prd.md)
- [PRD da verificação contínua do frontend](docs/specs/E1-ci-frontend-prd.md)
- [PRD de validação e organização do código](docs/specs/E1-validação_e_organização_do_código.md)
- [Enunciados no Moodle](https://campusvirtual.unifal-mg.edu.br/moodle/course/section.php?id=30335)

## Fluxo de colaboração e commits

1. Antes de começar uma tarefa, atualizar a cópia local de main e criar uma branch a partir dela.
2. Criar uma branch por tarefa, com nome descritivo, como feat/authors-page, feat/books-page, feat/readings-page, feat/backend-setup ou feat/authors-api. Não manter uma branch permanente por integrante.
3. Cada integrante faz seus próprios commits, com seu nome e e-mail configurados no Git. Cada commit deve representar uma mudança coerente; arquivos relacionados podem ficar juntos, sem exigir um commit por arquivo.
4. Enviar a branch ao GitHub e abrir um pull request para main, descrevendo a mudança e como foi verificada.
5. Outro integrante revisa o pull request antes da integração. Resolver os comentários e confirmar que a aplicação continua funcionando antes de fazer o merge.
6. Integrar as tarefas em main exclusivamente por pull request revisado. Nunca fazer commits ou push direto em main. Depois do merge, atualizar main local antes de iniciar outra tarefa.

Coordenar alterações em arquivos compartilhados, especialmente store.js, validation.js, ui.js e styles.css, e registrar responsáveis e revisores no Trello. A autoria dos commits deve refletir quem realizou cada contribuição.

A atualização dos integrantes, das responsabilidades e deste fluxo no README e no roteiro de desenvolvimento pertence ao mesmo commit de documentação, por exemplo: docs: atualiza equipe e fluxo de colaboração. Alterações de funcionalidades devem ficar em commits separados dessa atualização.

## Entregas

| Etapa | Prazo no horário de Brasília | Escopo | Valor |
|---|---|---|---|
| Entrega 1 | **20/11/2026 às 23h59** | Frontend completo, FR-01 a FR-07 e localStorage | 5,0 |
| Entrega 2 | **11/12/2026 às 23h59** | API REST, persistência e frontend integrado | 5,0 |

## Tecnologias

| Camada | Tecnologia prevista |
|---|---|
| Frontend | HTML, CSS e JavaScript puros; módulos ES; Fetch API e JSON |
| Dados da entrega 1 | localStorage com importação inicial de seed.json |
| Backend da entrega 2 | Java 21 ou superior e Spring Boot 4.x |
| Build do backend | Maven com wrapper (escolha proposta para o projeto) |
| Persistência | Spring Data JPA e H2 em arquivo (caminho recomendado pelo enunciado) |

A interface e os valores controlados serão em **inglês dos Estados Unidos**. Os nomes de autores e títulos de livros permanecem no idioma original.

Não usar React, Vue, Angular, Svelte, jQuery, Bootstrap, Tailwind, TypeScript, Vite, Webpack ou pacotes npm/build tools para construir o frontend. Não usar Thymeleaf/JSP para renderização no servidor. Bibliotecas adicionais dependem das permissões do enunciado ou de aprovação registrada do professor.

## Estrutura da base do frontend

```text
frontend/
├── index.html
├── css/styles.css
├── data/seed.json
└── js/
    ├── app.js
    ├── constants.js
    ├── strings.js
    ├── forms/author-form.js
    ├── forms/book-form.js
    ├── forms/reading-form.js
    ├── forms/form-action.js
    ├── store.js
    ├── validation.js
    ├── ui.js
    └── pages/
        ├── authors.js
        ├── books.js
        └── readings.js
```

Navegação por hash em uma página, usando módulos ES. `store.js` concentra dados em funções async e retorna cópias independentes; páginas não acessam localStorage diretamente. `validation.js` verifica a estrutura e as regras de domínio da seção 4. O store oferece leitura e escrita com erros padronizados; veja os contratos em docs/CONTRATOS_DADOS.md. Os formulários de autores, livros e leituras estão conectados aos mesmos contratos; livros também permitem primeira leitura opcional. A implementação antiga de prévias foi removida.

## Como executar a entrega 1

1. Clonar `https://github.com/anafreiria/ReadingTracker.git` e abrir a pasta no VS Code.
2. Abrir `frontend/index.html` com **Open with Live Server**.
3. Acessar a URL HTTP indicada pela extensão. Não abrir por `file://`.

Alternativa com Python 3, a partir da raiz:

```bash
python3 -m http.server 8087 --directory frontend
```

Abrir http://localhost:8087. Não há instalação npm, build ou backend para esta etapa. Usar navegador moderno com suporte a módulos ES e dialog.

No primeiro acesso, o seed oficial é carregado e salvo na chave `reading-tracker:data:v1`. Nas próximas visitas, a base lê o que já está salvo. Um erro no armazenamento é apresentado sem substituir silenciosamente os dados. A ação **Reset data**, no rodapé, pede confirmação e restaura o seed somente depois de baixá-lo e validá-lo. Cancelar mantém os dados; falhas também preservam o estado anterior. Em Authors, Add author cadastra registros e as ações Edit/Delete permitem mantê-los. Nome é obrigatório; nacionalidade e datas são opcionais. Em Books, Add book permite título apenas ou dados completos, seleção de autores/temas e primeira leitura opcional. Create theme salva o tema imediatamente, mesmo se cancelar o livro. View details mostra dados completos e histórico; Delete informa a quantidade de leituras removidas. Em Reading History, Add reading registra uma nova leitura de um livro existente; View, Edit e Delete atuam sobre uma leitura específica. Para uma releitura, use Add reading: o registro anterior é preservado. Essas ações também aparecem no histórico e nos detalhes de cada obra. A exclusão individual mantém o livro e suas demais leituras. Ao editar para um status que não permite ano/nota, uma confirmação no formulário identifica os campos removidos; os valores permanecem até confirmar e salvar. A orientação junto ao formulário explica as regras do status escolhido; Year read é sinalizado como obrigatório apenas em Read.

Materiais oficiais baixados do Moodle em 04/11/2026 estão em `materiais/`; `frontend/data/seed.json` é uma cópia idêntica. O guia atual é `Seed_Data_Guide.pdf`. O JSON tem 135 temas, embora o guia cite 132; mantivemos o arquivo oficial sem alterações.

## Verificação da base

Com Node 24+ disponível, executar `node tests/foundation.test.mjs` e `node tests/data.test.mjs` (37 testes no total, sem dependências). Node é opcional para os testes; não é usado para construir ou executar o frontend.

Verificado também no Chrome: navegação, contagens oficiais, ordenação, histórico por livro, formulários, Escape, tela de 390px, falha e nova tentativa, estados vazios e tratamento seguro de texto. O CRUD de autores/livros, temas, cadastro combinado e exclusão em cascata também foram verificados na interface; o CRUD de leituras também foi verificado, incluindo releituras e exclusão individual. Também foram verificados confirmação/cancelamento do reset, falha de rede, proteção de edição em outra aba e passagem da edição após recarga.

Os testes de interface estão em `tests/authors.browser.test.mjs` (35 verificações), `tests/books.browser.test.mjs` (44 verificações), `tests/readings.browser.test.mjs` (51 verificações) e `tests/status.browser.test.mjs` (124 verificações, incluindo 25 combinações persistidas de status e avisos de remoção de prioridade), sem dependências externas. Veja os comandos e o uso de um perfil isolado no [guia do frontend](docs/GUIA_FRONTEND.md). Inclui criação/edição/exclusão e recarga, validações, quota, conflito real entre abas, foco/teclado, 390px/1280px e regressões de navegação/reset.

## Verificação automática no GitHub

O workflow [Frontend](.github/workflows/frontend.yml) executa o check **Frontend checks** em cada PR para main e a cada push na main. Também pode ser iniciado pela aba Actions após a integração do workflow. Ele verifica a sintaxe JavaScript, inicia um servidor HTTP e um Chrome temporários, confirma a inicialização/navegação dos três módulos e executa todos os testes de dados e interface existentes. Novos testes em `tests/*.test.mjs` e `tests/*.browser.test.mjs` são descobertos automaticamente; as suítes de navegador rodam sequencialmente para respeitar a política de uma aba editora.

O check fica vermelho se algum teste falhar ou exceder seu limite de tempo. A aba Actions mostra o resumo e o artefato `frontend-checks-...`, com logs e capturas, mantido por sete dias. Em falhas de navegador, a captura é feita antes de fechar a aba quando a conexão permite. Novos commits no mesmo PR cancelam a execução antiga e iniciam outra. A revisão humana continua fazendo parte do fluxo; uma regra de proteção da main pode exigir **Frontend checks** antes do merge.

Para reproduzir a mesma verificação localmente, com Node 24+ e Chrome instalados:

```bash
node scripts/check-frontend.mjs
```

O comando inicia e encerra seus próprios serviços, com portas livres e perfil isolado. A pasta dos relatórios é mostrada no terminal; `FRONTEND_REPORT_DIR` permite escolher a pasta-base e `CHROME_BIN` indicar o executável. `node scripts/check-frontend.mjs --smoke-only` faz uma verificação rápida de sintaxe/inicialização; o GitHub sempre executa a verificação completa. O navegador de teste usa fontes locais de fallback para não depender da disponibilidade de Google Fonts. Nenhuma instalação npm, build ou alteração no modo normal de executar a aplicação é necessária. Veja os [detalhes e limites](docs/specs/E1-ci-frontend-prd.md).

## Como executar a entrega 2

**Planejado, ainda não verificado.** Após implementar o backend e versionar o Maven Wrapper:

1. Ter Java 21 ou superior instalado e conferir `java -version`.
2. Na raiz do repositório, executar:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

3. Abrir `http://localhost:8080`.

Registrar aqui, antes da entrega, a versão exata do Java utilizada. O banco H2 deve estar em arquivo, preservar dados após reinícios e ter sua pasta gerada ignorada pelo Git. Não será necessário instalar Maven separadamente quando o wrapper estiver completo.

## Requisitos obrigatórios

Atualizar cada célula para **Implementado**, **Parcialmente implementado** ou **Não implementado**, conforme verificação real. Os status abaixo refletem a verificação desta etapa, distinguindo contratos de dados e integração visual.

| ID | Requisito | Entrega 1 | Entrega 2 |
|---|---|---|---|
| FR-01 | CRUD de autores e bloqueio de exclusão de autor vinculado | Implementado | Não implementado |
| FR-02 | CRUD de livros, seleção de autores e temas e criação de tema | Implementado | Não implementado |
| FR-03 | CRUD de leituras, cadastro combinado e exclusão em cascata confirmada | Implementado | Não implementado |
| FR-04 | Fluxo de status e compatibilidade de ano, nota e prioridade | Implementado | Não implementado |
| FR-05 | Histórico ordenável e tratamento de valores ausentes | Implementado | Não implementado |
| FR-06 | Validações da seção 4 e mensagens junto aos campos | Implementado | Não implementado |
| FR-07 | Seed no primeiro uso, preservação de alterações e Reset data | Implementado | Não implementado |

FR-01 tem CRUD visual completo, persistência, validação e bloqueio de exclusão vinculada. FR-02 tem CRUD visual completo e criação de temas. FR-03 tem CRUD visual de leituras, consulta completa, releituras independentes, cadastro combinado e exclusão em cascata confirmada com contagem. FR-04 tem os cinco critérios auditados nas 25 combinações entre status: ano obrigatório em Read e opcional em Abandoned, nota apenas em Read/Abandoned, prioridade apenas na wishlist, preservação de recomendação/notas e confirmação antes da limpeza. Cancelamento, consentimento invalidado, quota e conflito entre abas também foram verificados. FR-06 tem validações de domínio para autores, livros e leituras, mensagens de erro junto aos campos e bloqueio de persistência de dados inválidos. As regras de ano de leitura, nota, status e prioridade são verificadas, incluindo a preservação dos dados quando uma alteração incompatível é cancelada. A organização do código mantém validação, persistência e apresentação em módulos separados. Os testes automatizados cobrem entradas inválidas e os principais fluxos dos formulários. FR-07 está implementado e testado, incluindo restauração com confirmação.

Os exercícios FR-08 a FR-18 são opcionais e não pontuados; nenhum está declarado como implementado neste momento.

## API da entrega 2

**Contrato previsto, ainda não implementado.** Atualizar a tabela se os caminhos forem alterados.

| Métodos | Caminho | Finalidade |
|---|---|---|
| GET, POST | /api/authors | Listar e criar autores |
| GET, PUT, DELETE | /api/authors/{id} | Consultar, atualizar e excluir autor |
| GET, POST | /api/books | Listar e criar livros |
| GET, PUT, DELETE | /api/books/{id} | Consultar, atualizar e excluir livro |
| GET, POST | /api/books/{id}/readings | Listar e adicionar leituras de um livro |
| GET | /api/readings | Listar todas as leituras |
| PUT, DELETE | /api/readings/{id} | Atualizar e excluir leitura |
| GET, POST | /api/themes | Listar e criar temas |
| GET | /api/countries | Listar os países fixos |
| POST | /api/reset | Restaurar o seed |

**Pendente para a entrega 2:** acrescentar exemplos reais de requisição e resposta para autores, livros e leituras. Registrar códigos HTTP, erros de validação e exemplos com os IDs efetivamente retornados pela API.

## Uso de inteligência artificial

A IA neste trabalho é usada para apoiar a análise dos requisitos, a documentação e a implementação das ideias e soluções definidas pela equipe. O ChatGPT/Codex atua como assistente e agente de programação, auxiliando na geração e adaptação de código, na preparação de testes automatizados e na investigação de falhas. As ferramentas e partes afetadas são declaradas abaixo, conforme a seção 10 do [enunciado oficial](materiais/Reading_Tracker_Web_Application.pdf).

Antes da implementação de funcionalidades, o escopo, os fluxos, os critérios de aceite e o plano de verificação são documentados em PRDs. Os testes automatizados de dados e de interface ajudam a verificar o comportamento esperado e a identificar regressões; seus resultados e limites são registrados na documentação da tarefa.

O código, a documentação e os resultados dos testes passam por revisão humana antes do envio das alterações para revisão do grupo. O scrum master revisa os pull requests antes do merge na main. A assistência de IA e os testes automatizados apoiam esse processo; a equipe mantém a responsabilidade pelas decisões, pela qualidade e pela compreensão de tudo o que é entregue.

| Ferramenta | Finalidade já utilizada | Partes afetadas |
|---|---|---|
| ChatGPT / Codex | Leitura dos requisitos, planejamento e PRD; geração da base de navegação, estilos, leitura/escrita de dados, validações, restauração, formulários de referência, CRUD visual de autores/livros/leituras, temas, primeira leitura, releituras, confirmação de limpeza, orientação de status, aviso de remoção de prioridade, auditoria de FR-06 e das 25 combinações de status, exclusões, testes de integração em navegador, automação de verificação no GitHub Actions e diagnóstico de falhas; documentação de colaboração | README.md, docs/, frontend/ (exceto seed oficial), tests/, scripts/, .github/workflows/ |

Para editar, usar uma única aba. Em navegadores com Web Locks, outra aba recebe conflito 409 sem gravar; fechar a aba que estava editando e recarregar a nova antes de continuar. Sem Web Locks, a fila protege somente operações da mesma aba.

Os arquivos oficiais em materiais/ e o seed foram obtidos do Moodle, sem geração por IA. A equipe deve revisar, compreender e conseguir explicar todo o código entregue. Atualizar esta seção conforme novas contribuições.

## Submissão e vídeo

Enviar para **pagliares@bcc.unifal-mg.edu.br**, com todos os demais integrantes em cópia:

- Entrega 1: assunto `Reading Tracker – Delivery 1 – [nomes dos estudantes]`; incluir GitHub e autoavaliação de 0 a 5.
- Entrega 2: assunto `Reading Tracker – Delivery 2 – [nomes dos estudantes]`; incluir GitHub, autoavaliação de 0 a 5 e vídeo de até 15 minutos acessível sem login.

**Vídeo da entrega 2:** link pendente. Adicionar aqui antes do envio. Demonstrar primeiro a aplicação e a persistência após reinício; depois explicar as principais partes do código.

Marcar e enviar ao GitHub as tags `delivery-1` e `delivery-2` nos commits a serem avaliados, dentro dos respectivos prazos. Não criar as tags finais antecipadamente. Fazer commits descritivos durante todo o trabalho.

## Referência

Enunciado **Reading Tracker Web Application**, atualizado em **16/10/2026**, disponibilizado no Moodle da disciplina. O roteiro de desenvolvimento diferencia exigências oficiais de sugestões de organização.

