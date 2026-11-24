# Roteiro de desenvolvimento do backend — Reading Tracker (Entrega 2)

Prazo: **11/12/2026, 23h59 (Brasília)** · Valor: 5,0 pontos · Tag: `delivery-2`

Fontes usadas neste roteiro: o enunciado `materiais/Reading_Tracker_Web_Application.pdf` (atualizado em 16/10/2026), os slides, o `Seed_Data_Guide.pdf`, o `seed.json` oficial, o log original `How_Books_Read_Currently_Tracked.pdf` e o código atual de `frontend/`. Nenhum backend existente é reaproveitado: o projeto Spring Boot é criado do zero.

---

## Sumário

1. [Objetivo e critérios de avaliação](#1-objetivo-e-critérios-de-avaliação)
2. [Restrições técnicas](#2-restrições-técnicas)
3. [O que o frontend espera do backend](#3-o-que-o-frontend-espera-do-backend)
4. [Arquitetura proposta](#4-arquitetura-proposta)
5. [Contrato da API](#5-contrato-da-api)
6. [Regras de validação no servidor](#6-regras-de-validação-no-servidor)
7. [Carga do seed e reset](#7-carga-do-seed-e-reset)
8. [Roteiro na ordem de execução](#8-roteiro-na-ordem-de-execução)
9. [Fluxo Git](#9-fluxo-git)
10. [Checklist final da Entrega 2](#10-checklist-final-da-entrega-2)

---

## 1. Objetivo e critérios de avaliação

Criar uma API REST em Spring Boot com persistência em banco, carregar o seed no primeiro início e trocar o `localStorage` do frontend da Entrega 1 por chamadas à API, mantendo FR-01 a FR-07 funcionando.

| Critério | O que é avaliado | Pontos |
|---|---|---|
| REST API | Endpoints mínimos, JSON, métodos e códigos HTTP corretos | 1,5 |
| Persistência | Dados sobrevivem ao reinício; seed só na primeira execução; um único comando | 1,0 |
| Integração com o frontend | Todas as funções da Entrega 1 via API, inclusive Reset; sem `localStorage` para dados | 1,0 |
| Validação e erros no servidor | Regras da seção 4 no servidor; 400 com mensagens por campo exibidas na interface | 0,5 |
| Arquitetura em camadas | Controllers, services e repositories com responsabilidades claras | 0,5 |
| README e vídeo | Endpoints, checklist atualizado, vídeo de até 15 min | 0,5 |

Penalidades que precisamos evitar:

- Projeto que não sobe com o comando do README: **no máximo 50%** da entrega.
- Biblioteca proibida: perde os critérios que dependem dela.
- Integrante que não sabe explicar o código: **perde 40%** da entrega. Todos precisam entender todas as camadas.

## 2. Restrições técnicas

| Camada | Obrigatório | Permitido | Proibido |
|---|---|---|---|
| Backend | Java 21+, Spring Boot 4.x, Maven (com wrapper), REST com JSON | Spring Web, Spring Data JPA, Bean Validation, Lombok, driver do banco (H2 e console), DevTools, starter de testes | Thymeleaf, JSP, qualquer biblioteca não aprovada por e-mail |
| Persistência | Dados sobrevivem ao reinício | H2 em arquivo (recomendado) | Dados só em memória |
| Frontend | HTML, CSS e JS puros; `fetch` | — | Frameworks, TypeScript, npm, bundlers |

Pontos específicos do Spring Boot 4:

- Jackson 3: `ObjectMapper` vem de `tools.jackson.databind`, **não** de `com.fasterxml.jackson.databind`. As anotações (`@JsonIgnore` etc.) continuam em `com.fasterxml.jackson.annotation`.
- Console H2 é um módulo separado: dependência `spring-boot-h2console` + `spring.h2.console.enabled=true`.
- Execução: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`). Commitar `mvnw`, `mvnw.cmd` e `.mvn/`.
- Frontend servido pelo próprio Spring em `src/main/resources/static`, aberto em `http://localhost:8080`, com URLs relativas (`/api/books`).

**Decisão:** não usar Lombok. Entidades com getters/setters simples e DTOs como `record` deixam o código mais fácil de explicar no vídeo e na arguição.

## 3. O que o frontend espera do backend

O frontend já isola todo o acesso a dados em `frontend/js/store.js`. Na Entrega 2 só esse arquivo é reescrito; os formulários, as páginas, `validation.js` e `strings.js` continuam iguais. Por isso a API precisa respeitar o que o código atual já usa.

### 3.1 Funções do `store.js` e o endpoint correspondente

| Função atual | Chamada na Entrega 2 | Retorno esperado pela interface |
|---|---|---|
| `getLibrary()` | `GET` em `/api/countries`, `/api/authors`, `/api/themes`, `/api/books`, `/api/readings` em paralelo | `{countries, authors, themes, books, readings}` |
| `getAuthors()`, `getBooks()`, `getReadings()`, `getThemes()`, `getCountries()` | `GET /api/<coleção>` | Array no formato do seed |
| `getAuthor(id)`, `getBook(id)` | `GET /api/authors/{id}`, `GET /api/books/{id}` | Um registro; 404 se não existir |
| `getReading(id)` | `GET /api/readings/{id}` (endpoint extra) | Um registro; 404 se não existir |
| `getBookReadings(bookId)` | `GET /api/books/{bookId}/readings` | Leituras do livro; 404 se o livro não existir |
| `saveAuthor(a)` | `POST /api/authors` (sem id) ou `PUT /api/authors/{id}` | Autor salvo |
| `saveBook(b)` | `PUT /api/books/{id}` (edição) | Livro salvo |
| `saveBookWithReading(b, r)` | `POST /api/books` com `firstReading` opcional, depois `GET /api/books/{id}/readings` | `{book, reading}` (`reading` é `null` se não houver) |
| `saveTheme({name})` | `POST /api/themes` | Tema criado |
| `saveReading(r)` | `POST /api/books/{bookId}/readings` (sem id) ou `PUT /api/readings/{id}` | Leitura salva |
| `deleteAuthor(id)` | `DELETE /api/authors/{id}` | Nada (204) |
| `deleteBook(id)` | `DELETE /api/books/{id}` | Nada (204); a interface já mostra a contagem antes |
| `deleteReading(id)` | `DELETE /api/readings/{id}` | Nada (204) |
| `resetData()` | `POST /api/reset` (204), depois `getLibrary()` | A biblioteca restaurada |

### 3.2 Formato de erro

O frontend lança e exibe `StoreError {status, message, errors}`. A API devolve exatamente esse corpo:

```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "yearRead", "message": "Year read is required when status is Read." }
  ]
}
```

404 e 409 usam o mesmo formato, com `errors: []`.

### 3.3 Nomes de campo e mensagens precisam ser idênticos

- `ui.js` mostra cada erro ao lado do campo pelo nome (`field`). Os nomes válidos são os do seed: `name`, `countryId`, `birthDate`, `deathDate`, `title`, `authorIds`, `publicationYear`, `form`, `mode`, `content`, `themeIds`, `bookId`, `status`, `yearRead`, `grade`, `recommendedBy`, `priority`, `notes`.
- `author-form.js` só coloca o erro de nome duplicado no campo **Name** se `status === 409` **e** a mensagem for exatamente `An author with this name already exists.`
- `book-form.js` só coloca o erro de tema duplicado no campo **New theme** se a mensagem for exatamente `A theme with this name already exists.`

Por isso o backend tem uma classe `ValidationMessages` com as mesmas frases de `TEXT.validation` em `frontend/js/strings.js`:

| Chave | Texto |
|---|---|
| failed | `Validation failed` |
| required | `This field is required.` |
| text | `Enter text for this field.` |
| integer | `Enter a whole number.` |
| number | `Enter a number.` |
| reference | `Choose an existing record.` |
| selection | `Choose a value from the list.` |
| list | `Choose a list of existing records without duplicates.` |
| date | `Enter a valid date in YYYY-MM-DD format.` |
| futureBirth | `Birth date cannot be in the future.` |
| death | `Death date must be after birth date.` |
| publication | `Publication year cannot be zero or in the future.` |
| existingReadings | `Publication year cannot be later than the year of an existing reading.` |
| yearRead | `Year read cannot be in the future or before publication.` |
| requiredYear | `Year read is required when status is Read.` |
| noYear | `Year read is only allowed when status is Read or Abandoned.` |
| grade | `Grade must be between 0 and 10 in steps of 0.5.` |
| noGrade | `Grade is only allowed when status is Read or Abandoned.` |
| priority | `Priority is only allowed when status is Want to read.` |
| id | `Use a positive integer ID.` |
| duplicateAuthor | `An author with this name already exists.` |
| duplicateTheme | `A theme with this name already exists.` |
| notFound | `Record not found.` |
| createOnly | `This operation only creates new records; omit the ID.` |
| linkedAuthor | `Author is linked to {n} book(s): {título1}, {título2}` |

### 3.4 Outros comportamentos do frontend que o backend respeita

- Os formulários enviam **o registro completo**, com `null` nos opcionais vazios e `[]` nas listas vazias. O `PUT` substitui o registro inteiro.
- Números chegam como números (`grade: 8.5`, `publicationYear: -429`); datas como texto `YYYY-MM-DD`.
- A confirmação de limpeza de ano/nota (FR-04) acontece na interface. O servidor só valida o estado final: se receber `status: "Paused"` com `yearRead` preenchido, responde 400.
- A ordenação do histórico (FR-05) é feita no frontend. A API devolve as listas ordenadas por ID crescente.
- O frontend nunca usa IDs fixos; depois de um reset os IDs mudam e isso é esperado.

## 4. Arquitetura proposta

### 4.1 Estrutura do repositório

O projeto Maven fica na **raiz** do repositório, para que `./mvnw spring-boot:run` rode da pasta do projeto.

```text
ReadingTracker/
├── pom.xml
├── mvnw, mvnw.cmd, .mvn/
├── .gitignore                      # target/, data/, IDE
├── src/
│   ├── main/
│   │   ├── java/br/edu/unifal/readingtracker/
│   │   │   ├── ReadingTrackerApplication.java
│   │   │   ├── config/            # Clock, ValidationMessages
│   │   │   ├── controller/        # HTTP apenas
│   │   │   ├── service/           # regras, transações, validação
│   │   │   ├── repository/        # JpaRepository por entidade
│   │   │   ├── model/             # @Entity e enums
│   │   │   ├── dto/               # records no formato do seed.json
│   │   │   ├── mapper/            # entidade <-> DTO
│   │   │   ├── exception/         # ApiException, ApiError, handler global
│   │   │   └── seed/              # SeedData, SeedLoader, SeedRunner
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── seed.json          # cópia de materiais/seed.json
│   │       └── static/            # frontend (movido de frontend/)
│   └── test/
│       ├── java/br/edu/unifal/readingtracker/...
│       └── resources/application.properties   # H2 em memória
├── materiais/                      # enunciado e seed original
├── tests/, scripts/                # testes do frontend
└── data/                           # gerado pelo H2, fora do Git
```

### 4.2 Camadas e responsabilidades

```text
Navegador (static/) ──fetch──> Controller ──> Service ──> Repository ──> H2 (data/)
                                   │             │
                                   │             └─ Validator + ValidationMessages
                                   └─ Mapper (DTO <-> entidade)
                     GlobalExceptionHandler converte ApiException em {status, message, errors}
```

| Camada | Faz | Não faz |
|---|---|---|
| Controller | Mapeia rota e método HTTP, recebe/devolve DTO, escolhe 200/201/204 | Regra de negócio, acesso ao banco |
| Service | Valida todas as regras da seção 4, busca e grava pelos repositories, abre transação, lança `ApiException` | Conhecer HTTP (`ResponseEntity`, status) |
| Repository | Consultas JPA | Regras |
| Mapper | Converte entidade em DTO no formato do seed e vice-versa | Validação |
| Exception handler | Único ponto que transforma exceções em resposta JSON | — |

Com `spring.jpa.open-in-view=false`, os services de leitura usam `@Transactional(readOnly = true)` e fazem o mapeamento para DTO **dentro** da transação, evitando `LazyInitializationException`.

### 4.3 Modelo de dados

```text
Country 1 ──── N Author
Author  N ──── N Book      (tabela book_authors, com coluna de ordem)
Theme   N ──── N Book      (tabela book_themes, com coluna de ordem)
Book    1 ──── N Reading
```

| Entidade | Campos | Observações |
|---|---|---|
| `Country` | `id`, `name` | Somente leitura pela API |
| `Theme` | `id`, `name` | Nome único ignorando maiúsculas |
| `Author` | `id`, `name`, `country` (N:1, opcional), `birthDate`, `deathDate` (`LocalDate`) | Nome único ignorando maiúsculas |
| `Book` | `id`, `title`, `authors` (`List`, `@ManyToMany`, `@OrderColumn`), `publicationYear` (`Integer`), `form`, `mode`, `content` (enums), `themes` (`List`, `@ManyToMany`, `@OrderColumn`) | `@OrderColumn` preserva a ordem dos `authorIds` (ex.: Levitsky, Ziblatt) |
| `Reading` | `id`, `book` (N:1, obrigatório), `status`, `yearRead` (`Integer`), `grade` (`Double`), `recommendedBy`, `priority`, `notes` (texto longo) | Várias leituras por livro |

IDs: `@GeneratedValue(strategy = GenerationType.IDENTITY)`. Os IDs do seed **não** são copiados.

### 4.4 Valores controlados

Enums com o texto oficial e um `AttributeConverter` que grava o texto no banco:

| Enum | Valores (exatamente como no JSON) |
|---|---|
| `BookForm` | Novel, Novella, Short Story, Short Story Collection, Play, Essay, Treatise, Diary, Graphic Novel |
| `ExpressionMode` | Prose, Drama, Poetry, Sequential Art |
| `ContentType` | Fiction, Non-fiction |
| `ReadingStatus` | Want to read, Reading, Paused, Read, Abandoned |
| `Priority` | Low, Medium, High |

Cada enum tem `label()` e `fromLabel(String)`. Os DTOs carregam **String**; o service converte e, se o valor não existir, gera o erro de campo `Choose a value from the list.` Isso dá mensagens por campo, em vez de uma falha genérica de leitura do JSON.

### 4.5 DTOs (mesmo formato do seed)

```java
record CountryDto(Long id, String name) {}
record ThemeDto(Long id, String name) {}
record AuthorDto(Long id, String name, Long countryId, String birthDate, String deathDate) {}
record BookDto(Long id, String title, List<Long> authorIds, Integer publicationYear,
               String form, String mode, String content, List<Long> themeIds) {}
record ReadingDto(Long id, Long bookId, String status, Integer yearRead, Double grade,
                  String recommendedBy, String priority, String notes) {}
record BookCreateRequest(/* campos de BookDto */ ..., ReadingDto firstReading) {}
record ApiError(int status, String message, List<FieldErrorDto> errors) {}
record FieldErrorDto(String field, String message) {}
```

Datas trafegam como `String` no DTO e são convertidas no service, para que uma data inválida gere erro no campo `birthDate`/`deathDate`.

### 4.6 Validação e erros

- Toda regra fica nos services, em classes validadoras (`AuthorValidator`, `BookValidator`, `ReadingValidator`, `ThemeValidator`) que acumulam erros e lançam `ApiException.badRequest(errors)` com **todos** os campos inválidos de uma vez.
- Unicidade e vínculos: `ApiException.conflict(message)` (409, `errors: []`).
- Registro inexistente: `ApiException.notFound()` (404, `Record not found.`).
- `GlobalExceptionHandler` (`@RestControllerAdvice`) trata:
  - `ApiException` → status e corpo próprios;
  - JSON malformado ou tipo errado (`HttpMessageNotReadableException`) → 400 `Validation failed` com o campo, quando for possível identificá-lo;
  - ID não numérico na URL → 400 com `field: "id"`;
  - rota `/api/...` inexistente → 404 no mesmo formato;
  - método não suportado → 405;
  - qualquer outra exceção → 500 com mensagem genérica, sem stack trace.
- "Ano atual" e "hoje" vêm de um bean `Clock` com fuso `America/Sao_Paulo`, para que os testes possam fixar a data.

## 5. Contrato da API

| Método | Caminho | Sucesso | Erros |
|---|---|---|---|
| GET | `/api/countries` | 200 lista | — |
| GET | `/api/themes` | 200 lista | — |
| POST | `/api/themes` | 201 tema, com `Location` | 400, 409 (nome duplicado) |
| GET | `/api/themes/{id}` | 200 tema (extra: destino do `Location`) | 400, 404 |
| GET | `/api/authors` | 200 lista | — |
| POST | `/api/authors` | 201 autor | 400, 409 (nome duplicado) |
| GET | `/api/authors/{id}` | 200 autor | 404 |
| PUT | `/api/authors/{id}` | 200 autor | 400, 404, 409 |
| DELETE | `/api/authors/{id}` | 204 | 404, 409 (vinculado a livros) |
| GET | `/api/books` | 200 lista | — |
| POST | `/api/books` | 201 livro (com `firstReading` opcional) | 400 |
| GET | `/api/books/{id}` | 200 livro | 404 |
| PUT | `/api/books/{id}` | 200 livro | 400, 404 |
| DELETE | `/api/books/{id}` | 204 (apaga também as leituras) | 404 |
| GET | `/api/books/{id}/readings` | 200 lista | 404 |
| POST | `/api/books/{id}/readings` | 201 leitura | 400, 404 |
| GET | `/api/readings` | 200 lista | — |
| GET | `/api/readings/{id}` | 200 leitura (extra) | 404 |
| PUT | `/api/readings/{id}` | 200 leitura | 400, 404 |
| DELETE | `/api/readings/{id}` | 204 | 404 |
| POST | `/api/reset` | 204 | 500 |

Decisões de contrato:

1. **Livro + primeira leitura numa única gravação (FR-03).** `POST /api/books` aceita um campo opcional `firstReading`. Livro e leitura são gravados na mesma transação: se qualquer um for inválido, nada é salvo. Os erros da leitura usam os nomes de campo normais (`status`, `yearRead`, `grade`...), que são os nomes usados na seção "first reading" do formulário de livro. A resposta 201 é o livro; o `store.js` busca a leitura em seguida.
2. **`PUT` envia o registro completo.** Campos omitidos são tratados como `null`/`[]`. `id` no corpo, se enviado, precisa ser igual ao da URL.
3. **`POST /api/books/{id}/readings`:** o livro vem da URL. Se o corpo trouxer `bookId` diferente, 400 em `bookId`. Em `PUT /api/readings/{id}` o `bookId` do corpo é obrigatório e pode apontar para outro livro existente.
4. **`POST` com `id` no corpo:** 400 em `id` com `This operation only creates new records; omit the ID.`
5. **Reset:** 204 sem corpo; o frontend recarrega a biblioteca.
6. Listas sempre ordenadas por `id` crescente.

Exemplo — criar livro para a wishlist com uma única requisição:

```http
POST /api/books
Content-Type: application/json

{
  "title": "Rites of Passage", "authorIds": [64], "publicationYear": null,
  "form": null, "mode": null, "content": null, "themeIds": [],
  "firstReading": { "status": "Want to read", "priority": "High", "recommendedBy": "Teco",
                    "yearRead": null, "grade": null, "notes": null }
}
```

```http
HTTP/1.1 201 Created
Location: /api/books/144

{ "id": 144, "title": "Rites of Passage", "authorIds": [64], "publicationYear": null,
  "form": null, "mode": null, "content": null, "themeIds": [] }
```

Exemplo — excluir autor vinculado:

```http
DELETE /api/authors/4

HTTP/1.1 409 Conflict
{ "status": 409, "message": "Author is linked to 6 book(s): Noites Brancas, The Brothers Karamazov, The Dream of a Ridiculous Man, The House of the Dead, The Crocodile, The Idiot", "errors": [] }
```

## 6. Regras de validação no servidor

Todas as regras do enunciado (seção 4), verificadas de novo no servidor:

**Author**

| Campo | Regra | Mensagem |
|---|---|---|
| name | Obrigatório, texto aparado | required |
| name | Único ignorando maiúsculas (exceto o próprio registro) | 409 duplicateAuthor |
| countryId | Se informado, país existente | reference |
| birthDate | Data real `YYYY-MM-DD`; não futura | date / futureBirth |
| deathDate | Data real; se houver nascimento, posterior a ele | date / death |

**Theme**

| Campo | Regra | Mensagem |
|---|---|---|
| name | Obrigatório | required |
| name | Único ignorando maiúsculas | 409 duplicateTheme |

**Book**

| Campo | Regra | Mensagem |
|---|---|---|
| title | Obrigatório | required |
| authorIds | Lista (pode ser vazia) de autores existentes, sem repetição | list |
| publicationYear | Inteiro, diferente de 0, não maior que o ano atual; negativo = a.C. | publication |
| publicationYear | Ao editar, não pode ser maior que o `yearRead` de uma leitura existente do livro | existingReadings |
| form, mode, content | Opcionais; se informados, valor da lista | selection |
| themeIds | Lista de temas existentes, sem repetição | list |

**Reading**

| Campo | Regra | Mensagem |
|---|---|---|
| bookId | Obrigatório, livro existente | required / reference |
| status | Obrigatório, valor da lista | required / selection |
| yearRead | Obrigatório se Read | requiredYear |
| yearRead | Só permitido se Read ou Abandoned | noYear |
| yearRead | Não futuro e não anterior ao ano de publicação do livro | yearRead |
| grade | Só permitido se Read ou Abandoned | noGrade |
| grade | De 0 a 10, em passos de 0,5 (`grade * 2` inteiro) | grade |
| priority | Só permitido se Want to read; valor da lista | priority / selection |
| recommendedBy, notes | Texto livre opcional | text |

**Exclusões**

- Autor vinculado a qualquer livro: 409 listando os títulos.
- Livro: apaga as leituras na mesma transação.
- Países não podem ser criados, alterados nem excluídos (não existem esses endpoints).

Requisito transversal: **todos os registros do `seed.json` passam nessas regras.** Um teste automatizado garante isso.

## 7. Carga do seed e reset

- Arquivo: `src/main/resources/seed.json`, cópia idêntica de `materiais/seed.json`.
- Conteúdo real do arquivo: 27 países, 101 autores, **135 temas** (o guia diz 132; vale o arquivo), 143 livros e 143 leituras (115 Read, 12 Paused, 16 Want to read).
- `SeedLoader.load()`:
  1. Lê o JSON com o `ObjectMapper` do Jackson 3 (`tools.jackson.databind`) em records `SeedData`.
  2. Insere na ordem **países → temas → autores → livros → leituras**.
  3. Mantém um `Map<Long, Entidade>` por coleção (ID do seed → entidade salva) para resolver `countryId`, `authorIds`, `themeIds` e `bookId`.
  4. Roda numa única transação.
- `SeedLoader.clear()`: apaga na ordem inversa (leituras → livros → autores → temas → países).
- `SeedRunner` (`CommandLineRunner`): chama `load()` **somente se** não houver países no banco.
- `POST /api/reset` → `ResetService`: `clear()` + `load()` na mesma transação. Se algo falhar, nada muda.
- Depois do reset, os IDs são novos e maiores. É o comportamento esperado; para recomeçar do 1, parar a aplicação e apagar `data/`.

Configuração (`application.properties`):

```properties
spring.application.name=readingtracker
spring.datasource.url=jdbc:h2:file:./data/readingtracker
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.h2.console.enabled=true
```

Testes (`src/test/resources/application.properties`): `jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1` e `ddl-auto=create-drop`.

## 8. Roteiro na ordem de execução

### Visão geral e dependências

```text
E1 setup ──┬── E2 erros ──┐
           └── E3 modelo ─┴── E4 seed ── E5 países/temas ── E6 autores ── E7 livros ── E8 leituras ── E9 livro+1ª leitura ── E10 reset
           └── E11 frontend em static (pode correr em paralelo a partir de E1)
                                                                                    E10 + E11 ── E12 store.js via API ── E13 testes/CI ── E14 README, vídeo, entrega
```

| Etapa | Branch | Depende de | Período sugerido |
|---|---|---|---|
| E1 | `feature/backend-setup` | — | 24–25/11 |
| E2 | `feature/api-error-handling` | E1 | 25–26/11 |
| E3 | `feature/domain-model` | E1 | 25–27/11 |
| E4 | `feature/seed-loader` | E3 | 27–28/11 |
| E5 | `feature/countries-themes-api` | E2, E4 | 28–29/11 |
| E6 | `feature/authors-api` | E5 | 29/11–01/12 |
| E7 | `feature/books-api` | E6 | 01–02/12 |
| E8 | `feature/readings-api` | E7 | 02–03/12 |
| E9 | `feature/book-first-reading` | E8 | 03/12 |
| E10 | `feature/reset-api` | E4, E9 | 04/12 |
| E11 | `feature/frontend-static` | E1 | 26/11–04/12 |
| E12 | `feature/store-api-integration` | E10, E11 | 04–06/12 |
| E13 | `feature/tests-ci` | E12 | 06–07/12 |
| E14 | `docs/delivery-2` | E13 | 08–10/12 |

Folga reservada: 10–11/12 para correções, tag e e-mail.

---

### E1 — Projeto Spring Boot e persistência em arquivo

- **Branch:** `feature/backend-setup`
- **Finalidade:** criar o esqueleto que sobe com um único comando e já grava em arquivo.
- **Requisitos:** seção 3 (stack), seção 7 (Running the project; Persistence, passos 1 e 2), critério "Persistência".
- **Arquivos:**
  - Gerar em start.spring.io: Maven, Java 21, Spring Boot 4.x estável mais recente, group `br.edu.unifal`, artifact `readingtracker`, dependências Spring Web, Spring Data JPA, H2 Database, Validation; acrescentar `spring-boot-h2console`.
  - `pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn/wrapper/maven-wrapper.properties`.
  - `ReadingTrackerApplication.java`.
  - `src/main/resources/application.properties` (seção 7).
  - `src/test/resources/application.properties` (H2 em memória).
  - `.gitignore`: `target/`, `/data/`, `.idea/`, `.vscode/`.
  - Pacotes vazios de `config`, `controller`, `service`, `repository`, `model`, `dto`, `mapper`, `exception`, `seed`.
- **Commits sugeridos:**
  - `build: cria projeto Spring Boot 4 com Maven Wrapper`
  - `config: configura H2 em arquivo e console`
  - `test: adiciona perfil de teste com H2 em memória`
- **Pronto quando:**
  - `./mvnw spring-boot:run` sobe sem erros em `http://localhost:8080`.
  - A pasta `data/` é criada e o `git status` não a mostra.
  - `http://localhost:8080/h2-console` conecta com `jdbc:h2:file:./data/readingtracker`, usuário `sa`, senha vazia.
  - `./mvnw test` passa (teste de contexto).
  - Funciona com `mvnw.cmd` no Windows (conferir com quem usa Windows).

### E2 — Formato único de erro

- **Branch:** `feature/api-error-handling`
- **Finalidade:** todas as falhas devolvem `{status, message, errors}` com os textos do frontend.
- **Requisitos:** seção 7 (Status codes, Validation), critério "Validação e erros"; FR-18 (opcional) parcialmente.
- **Arquivos:**
  - `exception/ApiError.java`, `exception/FieldErrorDto.java`
  - `exception/ApiException.java` (fábricas `badRequest(List)`, `notFound()`, `conflict(String)`)
  - `exception/ValidationErrors.java` (acumulador: `add(field, message)`, `throwIfAny()`)
  - `exception/GlobalExceptionHandler.java`
  - `config/ValidationMessages.java` (tabela da seção 3.3)
  - `config/ClockConfig.java` (`Clock` em `America/Sao_Paulo`)
- **Commits sugeridos:**
  - `feat(api): adiciona formato padrão de erro da API`
  - `feat(api): centraliza tratamento de exceções`
  - `feat(api): adiciona mensagens de validação iguais às do frontend`
- **Pronto quando:** testes com MockMvc (controller de teste) confirmam o corpo de 400 com vários campos, 404 e 409 com `errors: []`, JSON malformado → 400, rota inexistente em `/api` → 404 JSON, exceção inesperada → 500 sem stack trace.

### E3 — Entidades, enums e repositories

- **Branch:** `feature/domain-model`
- **Finalidade:** representar o domínio no banco.
- **Requisitos:** seção 4 (Domain model), seção 7 (Layers, passo 3), critério "Arquitetura em camadas".
- **Arquivos:**
  - `model/Country`, `Theme`, `Author`, `Book`, `Reading`
  - `model/BookForm`, `ExpressionMode`, `ContentType`, `ReadingStatus`, `Priority` + `model/converter/*Converter` (`AttributeConverter`)
  - `repository/CountryRepository`, `ThemeRepository`, `AuthorRepository`, `BookRepository`, `ReadingRepository`, com consultas como:
    - `existsByNameIgnoreCaseAndIdNot` (autor e tema)
    - `findByAuthors_IdOrderByIdAsc` (livros de um autor)
    - `findByBook_IdOrderByIdAsc`, `deleteByBook_Id` (leituras)
    - `findAllByOrderByIdAsc`
- **Commits sugeridos:**
  - `feat(model): adiciona entidades e relacionamentos`
  - `feat(model): adiciona enums de valores controlados`
  - `feat(repository): adiciona repositories JPA`
- **Pronto quando:** teste `@DataJpaTest` grava e relê um livro com dois autores em ordem, temas e duas leituras; os enums gravam e leem o texto oficial (`Want to read`, `Short Story Collection`).

### E4 — Carga do seed no primeiro início

- **Branch:** `feature/seed-loader`
- **Finalidade:** banco vazio recebe o seed oficial; banco com dados nunca é recarregado.
- **Requisitos:** FR-07, seção 7 (Persistence, passo 4), seção 11, critério "Persistência".
- **Arquivos:**
  - `src/main/resources/seed.json`
  - `seed/SeedData.java` (records das cinco coleções)
  - `seed/SeedLoader.java` (`load()`, `clear()`)
  - `seed/SeedRunner.java` (`CommandLineRunner`)
- **Commits sugeridos:**
  - `feat(seed): adiciona seed oficial aos recursos`
  - `feat(seed): importa seed preservando relacionamentos`
  - `feat(seed): carrega seed apenas com banco vazio`
- **Pronto quando:**
  - Teste: contagens 27 / 101 / 135 / 143 / 143 e 115 Read, 12 Paused, 16 Want to read.
  - Teste: "Como as Democracias Morrem" tem dois autores na ordem do seed; "Édipo Rei" tem ano -429; um livro sem autores tem lista vazia.
  - Teste: rodar o runner de novo não duplica nada.
  - Manual: subir, parar, subir de novo → contagens iguais.

### E5 — Países e temas

- **Branch:** `feature/countries-themes-api`
- **Finalidade:** listas usadas pelos formulários e criação de tema no formulário de livro.
- **Requisitos:** FR-02 (criar tema na hora), seção 4 (Themes and countries), seção 7 (endpoints).
- **Arquivos:** `dto/CountryDto`, `ThemeDto`; `mapper/CountryMapper`, `ThemeMapper`; `service/CountryService`, `ThemeService`, `ThemeValidator`; `controller/CountryController`, `ThemeController`. Extra: `GET /api/themes/{id}`, para o `Location` do 201 apontar para um recurso existente.
- **Commits sugeridos:**
  - `feat(api): lista países`
  - `feat(api): lista e cria temas com validação`
- **Pronto quando:** `GET /api/countries` → 200 com 27; `POST /api/themes` → 201 com `Location`; nome vazio → 400 em `name`; `"gothic"` → 409 `A theme with this name already exists.`; `POST/PUT/DELETE /api/countries` → 405 (não existe rota `/api/countries/{id}`, então `PUT/DELETE /api/countries/1` → 404); tema criado continua após reiniciar.

### E6 — Autores

- **Branch:** `feature/authors-api`
- **Finalidade:** CRUD completo de autores.
- **Requisitos:** FR-01, FR-06, seção 7.
- **Arquivos:** `dto/AuthorDto`; `mapper/AuthorMapper`; `service/AuthorService`, `AuthorValidator`; `controller/AuthorController`.
- **Commits sugeridos:**
  - `feat(api): adiciona consulta e criação de autores`
  - `feat(api): adiciona edição de autores`
  - `feat(api): bloqueia exclusão de autor vinculado a livros`
- **Pronto quando:** testes cobrem criação mínima (só nome), nome duplicado em outra caixa (409), país inexistente, data inválida (`2025-02-30`), nascimento futuro, falecimento antes do nascimento, falecimento sem nascimento (aceito), editar mantendo o próprio nome (aceito), 404, excluir sem vínculo (204), excluir Dostoevsky (409 com os títulos).

### E7 — Livros

- **Branch:** `feature/books-api`
- **Finalidade:** CRUD de livros com autores e temas selecionados de registros existentes.
- **Requisitos:** FR-02, FR-03 (exclusão em cascata), FR-06, seção 7.
- **Arquivos:** `dto/BookDto`; `mapper/BookMapper`; `service/BookService`, `BookValidator`; `controller/BookController`.
- **Commits sugeridos:**
  - `feat(api): adiciona consulta e criação de livros`
  - `feat(api): adiciona edição de livros com regras de ano`
  - `feat(api): exclui livro com suas leituras`
- **Pronto quando:** testes cobrem livro só com título, ano -429 (aceito), ano 0 e ano futuro (400), `authorIds` repetidos ou inexistentes (400 em `authorIds`), valor de `form` fora da lista (400), editar ano para depois de uma leitura existente (400 `existingReadings`), excluir livro com 2 leituras (204, leituras sumiram), 404.

### E8 — Leituras

- **Branch:** `feature/readings-api`
- **Finalidade:** histórico, wishlist e fluxo de status no servidor.
- **Requisitos:** FR-03, FR-04, FR-05 (fonte de dados do histórico), FR-06, seção 7.
- **Arquivos:** `dto/ReadingDto`; `mapper/ReadingMapper`; `service/ReadingService`, `ReadingValidator`; `controller/ReadingController` (`/api/readings`, `/api/readings/{id}`) e rota `/api/books/{id}/readings` em `BookReadingController` ou no `BookController`.
- **Commits sugeridos:**
  - `feat(api): lista leituras gerais e por livro`
  - `feat(api): adiciona leitura a um livro`
  - `feat(api): edita e exclui leituras com regras de status`
- **Pronto quando:**
  - Testes das **25 combinações** de status (de/para) verificando ano, nota e prioridade.
  - Read sem ano → 400 `requiredYear`; Paused com ano → 400 `noYear`; nota 7.3 → 400 `grade`; prioridade com Reading → 400 `priority`; ano antes da publicação → 400 `yearRead`.
  - Abandoned sem ano (aceito); Abandoned com nota (aceito).
  - Releitura: segundo `POST` para o mesmo livro cria outro registro e mantém o anterior.

### E9 — Livro com primeira leitura em uma gravação

- **Branch:** `feature/book-first-reading`
- **Finalidade:** permitir adicionar à wishlist ou registrar um livro lido com um único Save.
- **Requisitos:** FR-03 (one-step wishlist entry).
- **Arquivos:** `dto/BookCreateRequest`; ajustes em `BookService.create` (transação única, reutilizando `ReadingValidator`) e `BookController`.
- **Commits sugeridos:**
  - `feat(api): cria livro e primeira leitura na mesma transação`
- **Pronto quando:** `POST` com `firstReading` válido cria os dois (livro + leitura com o `bookId` novo); `firstReading` inválido → 400 com os campos da leitura e **nenhum** livro criado; `firstReading` com `id` → 400; sem `firstReading` continua funcionando.

### E10 — Reset

- **Branch:** `feature/reset-api`
- **Finalidade:** apagar tudo e recarregar o seed.
- **Requisitos:** FR-07, seção 7 (`POST /api/reset`; nota sobre IDs).
- **Arquivos:** `service/ResetService`, `controller/ResetController`; reuso de `SeedLoader.clear()` e `load()`.
- **Commits sugeridos:**
  - `feat(api): restaura dados iniciais pelo endpoint de reset`
- **Pronto quando:** após criar e apagar registros, `POST /api/reset` → 204 e as contagens voltam às do seed; os IDs novos são maiores que os anteriores; nenhum registro criado pelo usuário sobrevive.

### E11 — Frontend servido pelo Spring Boot

- **Branch:** `feature/frontend-static`
- **Finalidade:** uma única cópia do frontend, servida em `http://localhost:8080`.
- **Requisitos:** seção 6 (pasta única copiada para `static`), seção 7 (Serve the frontend from Spring Boot).
- **Arquivos:** `git mv frontend/* src/main/resources/static/`; atualizar caminhos em `tests/*.mjs`, `scripts/check-frontend.mjs` e `.github/workflows/frontend.yml`. Nenhuma mudança de comportamento (ainda com `localStorage`).
- **Commits sugeridos:**
  - `refactor: move frontend para resources/static`
  - `test: atualiza caminhos dos testes do frontend`
- **Pronto quando:** `./mvnw spring-boot:run` abre a aplicação completa em `localhost:8080`; os testes atuais do frontend continuam passando; não existe mais a pasta `frontend/`.
- **Combinar com a frente de frontend**, pois mexe nos arquivos dela.

### E12 — `store.js` usando a API

- **Branch:** `feature/store-api-integration`
- **Finalidade:** trocar `localStorage` por `fetch`, reescrevendo só `store.js`.
- **Requisitos:** seção 6 ("rewrite only this module"), seção 7 (URLs relativas), critério "Integração com o frontend".
- **Arquivos:** `src/main/resources/static/js/store.js` (reescrita com a tabela da seção 3.1); remover `static/data/seed.json` e, se ficar sem uso, `STORAGE_KEY` de `constants.js`.
- **Pontos de atenção:**
  - Um helper `request(method, url, body)` que envia JSON, devolve `null` em 204 e, em resposta não 2xx, lança `new StoreError(body.status, body.message, body.errors)`; falha de rede → `StoreError(500, ...)`.
  - Manter as mesmas funções exportadas e os mesmos retornos.
  - `saveReading(input, options)` ignora `options.confirmFieldClear` (a confirmação continua na interface).
  - Sem `localStorage`, sem Web Locks, sem IDs fixos.
- **Commits sugeridos:**
  - `feat(frontend): conecta store à API REST`
  - `chore(frontend): remove seed e chave do armazenamento local`
- **Pronto quando, testando no navegador:**
  - FR-01: criar, editar, excluir autor; excluir autor vinculado mostra os títulos.
  - FR-02: criar, editar, excluir livro; criar tema no formulário; tema duplicado aparece no campo New theme.
  - FR-03: livro + primeira leitura num Save; adicionar, editar, excluir leitura; excluir livro informa quantas leituras.
  - FR-04: mudanças de status com confirmação; Read pede ano.
  - FR-05: histórico com "-" e ordenação.
  - FR-06: erro do servidor aparece ao lado do campo (testar desligando a validação do navegador ou via `curl`).
  - FR-07: Reset funciona; parar e subir a aplicação mantém os dados.
  - DevTools → Application → Local Storage sem dados da aplicação.

### E13 — Testes automatizados e CI

- **Branch:** `feature/tests-ci`
- **Finalidade:** garantir que a integração não quebre.
- **Arquivos:**
  - Testes Java de integração (`@SpringBootTest` + MockMvc) completos por recurso, incluindo "todo registro do seed passa nas validações do servidor".
  - Adaptar `scripts/check-frontend.mjs` para subir o Spring Boot com uma pasta de dados temporária e rodar os testes de navegador contra `localhost:8080`; substituir os testes que simulavam `localStorage`.
  - Workflow do GitHub Actions com Java 21 rodando `./mvnw verify` e os testes de navegador, disparado em PRs para `hml` e para `main` (hoje o `frontend.yml` só roda em PRs para `main`).
- **Commits sugeridos:**
  - `test(api): cobre regras de validação e códigos HTTP`
  - `test: executa testes de navegador contra a API`
  - `ci: adiciona build do backend ao workflow`
- **Pronto quando:** `./mvnw verify` e o CI passam em um PR.

### E14 — README, vídeo e entrega

- **Branch:** `docs/delivery-2` (documentação, por isso sem o prefixo `feature/`)
- **Finalidade:** cumprir a seção 8 e o critério "README e vídeo".
- **Arquivos e tarefas:**
  - README:
    - Como executar, passo a passo, com a versão exata do Java (ex.: OpenJDK 21.0.x) e `./mvnw spring-boot:run` / `mvnw.cmd spring-boot:run`.
    - Como zerar os IDs (parar, apagar `data/`, subir de novo) e como abrir o console H2.
    - Tabela de endpoints (seção 5) com **um exemplo real de requisição e resposta** para autores, livros e leituras.
    - Checklist FR-01 a FR-07 marcado para a Entrega 2; opcionais tentados (ex.: FR-18).
    - Declaração de uso de IA atualizada (ferramenta, finalidade, partes afetadas), incluindo o backend.
    - Equipe (sem mudanças) e link do vídeo.
  - Vídeo (máx. 15 min, acessível sem login):
    1. Demonstrar FR-01 a FR-07 na aplicação.
    2. Mostrar persistência: criar registro, parar, subir, registro continua.
    3. Mostrar o código: controllers, services, repositories, configuração do banco (`application.properties`, entidades, seed) e chamadas `fetch` do `store.js`.
- **Commits sugeridos:**
  - `docs: documenta execução e endpoints da entrega 2`
  - `docs: atualiza checklist e uso de IA`
  - `docs: adiciona link do vídeo`
- **Pronto quando:** alguém que nunca rodou o projeto consegue, só com o README, clonar e subir a aplicação com Java 21 instalado.

## 9. Fluxo Git

Branches do repositório:

| Branch | Papel |
|---|---|
| `main` | Versão entregue. Fica no estado da Entrega 1 (tag `delivery-1`) até a Entrega 2 estar pronta. |
| `hml` | Homologação: recebe todas as etapas do backend. É a base de todas as branches e PRs desta entrega. |
| `feature/<nome>`, `docs/<nome>` | Uma por etapa, criada a partir da `hml`. |

Fluxo de cada etapa:

1. Antes de cada etapa: `git switch hml && git pull`.
2. Criar a branch da etapa a partir da `hml`: `git switch -c feature/<nome>`.
3. Commits pequenos e descritivos (Conventional Commits), cada integrante com seu próprio nome/e-mail configurado.
4. `git push -u origin feature/<nome>` e abrir PR **com base `hml`**, descrevendo o que mudou e como foi testado:
   ```bash
   gh pr create --base hml --head feature/<nome>
   ```
   No GitHub, conferir no topo do PR: `base: hml ← compare: feature/<nome>`. A base padrão do repositório é a `main`; trocar para `hml` antes de criar o PR.
5. Outro integrante revisa; só fazer merge com testes passando. Usar **"Create a merge commit"** (não *squash*), para manter os commits de cada etapa.
6. Nunca commitar nem abrir PR de etapa direto na `main` ou na `hml`.
7. Branches que dependem de outra só começam depois do merge da anterior na `hml` (ou partem dela, com o PR apontando para ela, e são rebaseadas após o merge).

Entrega (só quando todas as etapas estiverem na `hml` e testadas):

1. Abrir um PR `hml → main`, revisado pela equipe, e integrá-lo com merge commit.
2. Criar a tag no commit da `main` que será avaliado:

```bash
git switch main && git pull
git tag delivery-2
git push origin delivery-2
```

E-mail para **pagliares@bcc.unifal-mg.edu.br**, assunto `Reading Tracker – Delivery 2 – [nomes]`, com link do repositório, autoavaliação (0,0–5,0) e link do vídeo, copiando todos os integrantes.

## 10. Checklist final da Entrega 2

- [ ] `./mvnw spring-boot:run` sobe tudo com apenas Java 21+ instalado; wrapper commitado.
- [ ] Frontend em `src/main/resources/static`, aberto em `http://localhost:8080`, URLs relativas.
- [ ] Todos os endpoints mínimos da seção 7 implementados, com 200/201/204/400/404/409 corretos.
- [ ] Erros sempre no formato `{status, message, errors}`; 404 e 409 com `errors: []`.
- [ ] Todas as regras da seção 4 verificadas no servidor; mensagens aparecem ao lado dos campos.
- [ ] Controllers sem regras de negócio; services com regras; repositories com acesso a dados.
- [ ] H2 em arquivo; `data/` no `.gitignore`; dados persistem após reinício.
- [ ] Seed carregado só com banco vazio; IDs gerados pelo banco; ordem países → temas → autores → livros → leituras.
- [ ] `POST /api/reset` reutiliza o carregador do seed.
- [ ] Nenhum dado da aplicação em `localStorage`; nenhum ID fixo no frontend.
- [ ] FR-01 a FR-07 funcionando pela interface.
- [ ] README com execução, versão do Java, endpoints, exemplos, checklist, uso de IA e link do vídeo.
- [ ] Vídeo de até 15 min, sem login, com demonstração e explicação do código.
- [ ] Tag `delivery-2` enviada e e-mail enviado até 11/12/2026, 23h59.
