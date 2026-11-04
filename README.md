# Reading Tracker

Aplicação web para gerenciar autores, livros e leituras, desenvolvida para o Trabalho #2 da disciplina **Programação Web (DCE701), UNIFAL-MG, 2026/2**.

O projeto será construído em duas etapas: frontend em HTML, CSS e JavaScript puros com armazenamento no navegador; depois, integração com uma API REST em Java e Spring Boot e persistência em banco de dados.

> **Estado atual:** base navegável do frontend com dados oficiais, histórico ordenável e prévias de formulários. Os formulários ainda são prévias. O store já oferece CRUD, validações e criação conjunta de livro/leitura; Reset data está disponível na interface. Conectar os cadastros e os fluxos de status às telas permanece pendente. Backend ainda não implementado.

## Equipe

| Integrante | Matrícula |
|---|---|
| Ana Flavia Freiria | 2024.1.08.001 |
| Aurelio Junior | A informar |
| Otávio de Oliveira | 2025.1.08.034 |
| Pedro Luccas | 2022.2.08.009 |
| Raissa Peret | A informar |


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
    ├── forms.js
    ├── store.js
    ├── validation.js
    ├── ui.js
    └── pages/
        ├── authors.js
        ├── books.js
        └── readings.js
```

Navegação por hash em uma página, usando módulos ES. `store.js` concentra dados em funções async e retorna cópias independentes; páginas não acessam localStorage diretamente. `validation.js` verifica a estrutura e as regras de domínio da seção 4. O store oferece leitura e escrita com erros padronizados; veja os contratos em docs/CONTRATOS_DADOS.md. Os formulários ainda precisam ser conectados a essas operações.

## Como executar a entrega 1

1. Clonar `https://github.com/anafreiria/ReadingTracker.git` e abrir a pasta no VS Code.
2. Abrir `frontend/index.html` com **Open with Live Server**.
3. Acessar a URL HTTP indicada pela extensão. Não abrir por `file://`.

Alternativa com Python 3, a partir da raiz:

```bash
python3 -m http.server 8087 --directory frontend
```

Abrir http://localhost:8087. Não há instalação npm, build ou backend para esta etapa. Usar navegador moderno com suporte a módulos ES e dialog.

No primeiro acesso, o seed oficial é carregado e salvo na chave `reading-tracker:data:v1`. Nas próximas visitas, a base lê o que já está salvo. Um erro no armazenamento é apresentado sem substituir silenciosamente os dados. A ação **Reset data**, no rodapé, pede confirmação e restaura o seed somente depois de baixá-lo e validá-lo. Cancelar mantém os dados; falhas também preservam o estado anterior. Os formulários são prévias identificadas, com Save desabilitado.

Materiais oficiais baixados do Moodle em 04/11/2026 estão em `materiais/`; `frontend/data/seed.json` é uma cópia idêntica. O guia atual é `Seed_Data_Guide.pdf`. O JSON tem 135 temas, embora o guia cite 132; mantivemos o arquivo oficial sem alterações.

## Verificação da base

Com Node 24+ disponível, executar `node tests/foundation.test.mjs` e `node tests/data.test.mjs` (37 testes no total, sem dependências). Node é opcional para os testes; não é usado para construir ou executar o frontend.

Verificado também no Chrome: navegação, contagens oficiais, ordenação, histórico por livro, prévias, Escape, tela de 390px, falha e nova tentativa, estados vazios e tratamento seguro de texto. A camada de CRUD foi testada por contrato; as telas ainda não oferecem escrita. Também foram verificados confirmação/cancelamento do reset, falha de rede, proteção de edição em outra aba e passagem da edição após recarga.

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
| FR-01 | CRUD de autores e bloqueio de exclusão de autor vinculado | Parcialmente implementado | Não implementado |
| FR-02 | CRUD de livros, seleção de autores e temas e criação de tema | Parcialmente implementado | Não implementado |
| FR-03 | CRUD de leituras, cadastro combinado e exclusão em cascata confirmada | Parcialmente implementado | Não implementado |
| FR-04 | Fluxo de status e compatibilidade de ano, nota e prioridade | Parcialmente implementado | Não implementado |
| FR-05 | Histórico ordenável e tratamento de valores ausentes | Implementado | Não implementado |
| FR-06 | Validações da seção 4 e mensagens junto aos campos | Parcialmente implementado | Não implementado |
| FR-07 | Seed no primeiro uso, preservação de alterações e Reset data | Implementado | Não implementado |

FR-01 a FR-03 têm consulta e prévias na interface; suas operações de escrita estão implementadas no store, aguardando integração com as telas. FR-04 tem preparação/validação das transições e exigência de confirmação no store, sem fluxo visual completo. FR-06 tem validação de domínio e helper de mensagens, mas precisa ser aplicado aos formulários reais. FR-07 está implementado e testado, incluindo restauração com confirmação.

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

| Ferramenta | Finalidade já utilizada | Partes afetadas |
|---|---|---|
| ChatGPT / Codex | Leitura dos requisitos, planejamento e PRD; geração da base de navegação, estilos, leitura/escrita de dados, validações, restauração, formulários de referência e testes; documentação de colaboração | README.md, docs/, frontend/ (exceto seed oficial), tests/ |

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

