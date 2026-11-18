# Reading Tracker

Aplicação web para gerenciar autores, livros e histórico de leituras. Trabalho #2 de **Programação Web — DCE701, UNIFAL-MG, 2026/2**.

**Entrega 1:** frontend implementado em HTML, CSS e JavaScript puros, com persistência no navegador. **Entrega 2:** API REST com Java/Spring Boot e banco de dados, ainda em desenvolvimento e fora desta versão.

[Executar o projeto](#como-executar-a-entrega-1) · [Requisitos](#requisitos-obrigatórios) · [Testes e aceite](#testes-e-aceite) · [Processo SDD e uso de IA](#processo-sdd-e-uso-de-inteligência-artificial)

## Como executar a entrega 1

É necessário um navegador atualizado com armazenamento local permitido e **uma** das opções de servidor abaixo. A aplicação não exige Node.js, npm, build, Java ou backend nesta etapa.

### 1. Obter o código

Com Git:

```bash
git clone --branch main https://github.com/anafreiria/ReadingTracker.git
cd ReadingTracker
```

Sem Git: no GitHub, selecione **main → Code → Download ZIP**, extraia o arquivo e abra a pasta extraída.

### 2. Iniciar um servidor HTTP

**Opção A — VS Code com Live Server**

1. Instale a extensão **Live Server**, de Ritwick Dey.
2. Abra a pasta do projeto no VS Code.
3. Clique com o botão direito em `frontend/index.html` e selecione **Open with Live Server**.
4. Use a página HTTP aberta pela extensão e mantenha o VS Code/Live Server em execução.

**Opção B — Python 3**

Na raiz do projeto:

```bash
python3 -m http.server 8087 --directory frontend
```

No Windows, com Python 3 instalado, você também pode usar:

```powershell
py -3 -m http.server 8087 --directory frontend
```

Abra **http://localhost:8087**. Mantenha o terminal aberto; `Ctrl+C` encerra o servidor. Se a porta estiver ocupada, troque `8087` por outra porta livre no comando e na URL.

### 3. Conferir o funcionamento

- Navegue entre **Reading History**, **Books** e **Authors**. A base inicial contém 143 leituras, 143 livros e 101 autores.
- Crie um registro e atualize a página: a alteração deve permanecer salva.
- **Reset data**, no rodapé, pede confirmação e restaura a base oficial, removendo as alterações da aplicação naquele endereço.

O seed é carregado no primeiro uso e as visitas seguintes usam os dados do `localStorage`. Use sempre o mesmo endereço, porta e perfil do navegador: `localhost`, `127.0.0.1` e portas diferentes têm armazenamentos independentes. Uma janela anônima não conserva os dados após encerrar a sessão.

**Se a página não carregar:** confira se o servidor continua ativo e se a URL está correta. Não abra o HTML por duplo clique ou `file://`, pois os módulos e o seed precisam de HTTP. Em erro de carregamento dos dados, confira o servidor e use **Retry**.

## Funcionalidades

| Área | O que permite fazer |
|---|---|
| Authors | Cadastrar, consultar, editar e excluir autores; bloquear exclusão de autor vinculado a livros |
| Books | Gerenciar livros, selecionar autores/temas, criar temas e consultar detalhes e histórico |
| Readings | Cadastrar e editar leituras, registrar releituras independentes e excluir registros |
| Status | Aplicar as regras de ano, nota e prioridade, com confirmação antes da remoção de ano/nota em transições incompatíveis |
| Reading History | Ordenar por título, autores, status, ano e nota; manter valores ausentes ao final |
| Persistência | Salvar alterações no navegador e restaurar os dados oficiais mediante confirmação |

O livro pode ser salvo apenas com título ou junto com sua primeira leitura em um único **Save**. **Create theme** salva o tema imediatamente, mesmo se o cadastro do livro for cancelado. Excluir um livro exige confirmação e informa quantas leituras serão removidas. Para registrar uma releitura, use **Add reading**: a leitura anterior é preservada.

A interface e os valores controlados estão em inglês dos Estados Unidos. Títulos e nomes de autores permanecem no idioma original.

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
| Frontend | Ana Flavia Freiria e Otávio de Oliveira | Telas, HTML/CSS/JavaScript, validações no navegador, localStorage na entrega 1 e integração com a API na entrega 2 |
| Backend | Aurelio Junior, Pedro Luccas e Raissa Peret | API Spring Boot, regras e validações no servidor, banco persistente, importação do seed e restauração |

Integração, testes de aceitação, documentação, declaração de uso de IA, revisão e preparação das entregas são responsabilidades compartilhadas. Durante a primeira etapa, Aurelio, Pedro e Raissa também preparam o backend e apoiam a revisão e os testes do frontend. A divisão interna das tarefas de cada frente será registrada no Trello.

## Requisitos obrigatórios

O checklist registra a implementação das funcionalidades. Os limites da validação estão em [Testes e aceite](#testes-e-aceite).

| ID | Requisito | Entrega 1 | Entrega 2 |
|---|---|---|---|
| FR-01 | CRUD de autores e bloqueio de exclusão de autor vinculado | Implementado | Não implementado |
| FR-02 | CRUD de livros, seleção de autores e temas e criação de tema | Implementado | Não implementado |
| FR-03 | CRUD de leituras, cadastro combinado e exclusão em cascata confirmada | Implementado | Não implementado |
| FR-04 | Fluxo de status e compatibilidade de ano, nota e prioridade | Implementado | Não implementado |
| FR-05 | Histórico ordenável e tratamento de valores ausentes | Implementado | Não implementado |
| FR-06 | Validações da seção 4 e mensagens junto aos campos | Implementado | Não implementado |
| FR-07 | Seed no primeiro uso, preservação de alterações e Reset data | Implementado | Não implementado |

Os exercícios FR-08 a FR-18 são opcionais e não pontuados; nenhum é declarado como implementado.

## Organização e tecnologias

```text
frontend/
├── index.html          # Entrada e navegação
├── css/styles.css      # Estilos e responsividade
├── data/seed.json      # Dados oficiais
└── js/
    ├── app.js          # Inicialização
    ├── store.js        # Acesso assíncrono e persistência
    ├── validation.js   # Regras de domínio
    ├── ui.js           # Componentes compartilhados
    ├── constants.js
    ├── strings.js      # Textos da interface
    ├── forms/          # Formulários
    └── pages/          # Autores, livros e histórico
```

JavaScript usa módulos ES, Fetch API e JSON. As páginas acessam os dados pelas funções assíncronas de `store.js`; a validação e a apresentação ficam em módulos separados. Não há frameworks ou dependências de build no frontend. O [guia do frontend](docs/GUIA_FRONTEND.md) e os [contratos de dados](docs/CONTRATOS_DADOS.md) detalham a implementação.

Os materiais oficiais estão em `materiais/`. A cópia em `frontend/data/seed.json` é idêntica ao seed fornecido. O JSON contém 135 temas, embora o guia cite 132; o arquivo oficial foi preservado.

Para edição, use uma única aba. Com Web Locks, uma segunda aba recebe conflito sem gravar; feche a aba editora e recarregue a outra para continuar. Sem Web Locks, a fila protege somente operações da mesma aba.

## Testes e aceite

A regressão documentada aprovou **485 verificações automatizadas e a sintaxe de 13 módulos JavaScript**. Cobre dados, CRUD, validações, persistência, restauração, 25 combinações de status, responsividade, teclado, foco, contraste e zoom de 200%.

Para executar a automação, são necessários **Node.js 24+ e Chrome**:

```bash
node scripts/check-frontend.mjs
```

O comando inicia e encerra servidor e navegador temporários, com perfil isolado, e informa a pasta dos relatórios. Não exige instalação npm. `CHROME_BIN` permite indicar o executável do Chrome. Esses requisitos são exclusivos dos testes, não da execução da aplicação.

O workflow [Frontend](.github/workflows/frontend.yml) executa **Frontend checks** em PRs para `main` e pushes na `main`. As evidências e os ambientes de execução estão nos [resultados de QA](docs/reports/FR-QA-01-revisao.md) e nos [logs de documentação](docs/reports/fr-doc-01/summary.md).

**Aceite humano:** Ana aprovou a interface e relatou teste manual geral em 18/11/2026. O [registro do aceite](docs/reports/E1-aceite-humano-ana.md) documenta o relato e a versão utilizada.

**Limites:** a automação usou Linux/Chrome e viewports de 360, 390, 768 e 1280 pixels, incluindo emulação. Não representa teste em aparelho físico, certificação WCAG ou validação com leitor de tela, Safari/iOS ou Firefox. O aceite manual geral foi encerrado por Ana, que substituiu a exigência interna de teste por outro integrante por sua própria validação. O detalhamento individual por navegador não foi coletado e permanece um limite das evidências na [matriz de aceite](docs/specs/E1-testes-aceitação-e-regressão-final-do-frontend.md).

## Processo SDD e uso de inteligência artificial

**Ana Flavia Freiria e Otávio de Oliveira adotaram SDD (Spec-Driven Development), com a especificação estruturada antes da implementação.** Conforme o processo adotado pela dupla:

1. As issues e os cartões do backlog, junto com o enunciado e a documentação do trabalho, orientaram a elaboração de um **PRD** com escopo, regras, critérios de aceite e plano de validação.
2. A implementação seguiu o PRD, a organização do projeto e as restrições de tecnologia do enunciado, com apoio de IA na geração e adaptação de código.
3. As alterações foram verificadas com testes automatizados e validação humana, com resultados e limitações registrados na documentação.
4. O trabalho foi enviado em branches por tarefa e apresentado em **pull requests**. Ana realizou o **code review antes da aprovação e integração na main**, conferindo os requisitos, o código e as evidências de validação e solicitando correções quando necessárias.

**A IA foi utilizada na implementação**, além de apoiar a especificação, a documentação, os testes e a investigação de falhas. Seu uso foi documentado e submetido à revisão humana. A equipe mantém a responsabilidade pelas decisões, pela validação e pela compreensão do código entregue, conforme a seção 10 do [enunciado oficial](materiais/Reading_Tracker_Web_Application.pdf).

| Ferramenta | Finalidade | Partes afetadas |
|---|---|---|
| ChatGPT / Codex | Análise de requisitos e PRDs; geração e adaptação do frontend; validações e persistência; testes automatizados e CI; diagnóstico e correção de falhas; revisão assistida e documentação | `frontend/` (exceto seed oficial), `tests/`, `scripts/`, `.github/workflows/`, `README.md` e `docs/` |

Os enunciados e o seed foram obtidos do Moodle. A equipe revisa e deve conseguir explicar o código produzido com assistência de IA. As evidências do processo estão nos [PRDs](docs/specs/), no histórico de commits e nos [pull requests](https://github.com/anafreiria/ReadingTracker/pulls).

## Entregas e autoavaliação

| Etapa | Prazo — horário de Brasília | Escopo | Valor |
|---|---|---|---|
| Entrega 1 | **20/11/2026 às 23h59** | Frontend, FR-01 a FR-07 e localStorage | 5,0 |
| Entrega 2 | **11/12/2026 às 23h59** | API REST, persistência e frontend integrado | 5,0 |

A autoavaliação acordada pela equipe para a Entrega 1 é **5,0/5,0**, com [justificativa por critério e pendências](docs/reports/FR-DOC-01-autoavaliacao.md). É uma estimativa da equipe; a nota cabe ao professor.

A submissão exige repositório GitHub público e tag `delivery-1` no commit avaliado, enviada antes do prazo. Um integrante envia o link do repositório e a autoavaliação para **pagliares@bcc.unifal-mg.edu.br**, com os demais em cópia e assunto `Reading Tracker – Delivery 1 – [nomes dos estudantes]`. **A Entrega 1 não exige vídeo.**

A Entrega 2 prevê Java 21+, Spring Boot 4.x, API REST e persistência em banco, além de vídeo de até 15 minutos acessível sem login e tag `delivery-2`. As instruções de execução dessa etapa serão incluídas quando a integração estiver implementada e verificada. O planejamento está no [roteiro de desenvolvimento](docs/ROTEIRO_DESENVOLVIMENTO.md).

## Documentação

- [Enunciado oficial — Reading Tracker Web Application](materiais/Reading_Tracker_Web_Application.pdf), atualizado em 16/10/2026.
- [Repositório](https://github.com/anafreiria/ReadingTracker) e [quadro de tarefas](https://trello.com/b/VOzz4fDx).
- [Guia de desenvolvimento do frontend](docs/GUIA_FRONTEND.md).
- [Contratos de dados e validação](docs/CONTRATOS_DADOS.md).
- [Especificações e critérios de aceite](docs/specs/).
- [Relatórios e evidências](docs/reports/).
