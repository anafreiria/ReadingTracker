# PRD -- E1: Validação e organização do código

Responsável: Otávio de Oliveira. Revisão e correções: Ana Flavia Freiria, com apoio de Codex. Branch: `feat/e1-validation-code-organization`

## Objetivo

Concluir a validação dos formulários e manter a organização do frontend, garantindo que entradas inválidas não sejam persistidas e que os erros sejam apresentados de forma clara. A implementação deve aproveitar os módulos e contratos existentes, sem duplicar regras de domínio nas páginas.

## Escopo

- Conferir as regras da seção 4 nos formulários de autores, livros e leituras.
- Validar campos obrigatórios, nomes únicos, datas reais, referências, anos, notas, status e prioridade conforme o domínio.
- Validar `yearRead` para que não seja futuro nem anterior ao ano de publicação do livro.
- Aceitar nota opcional entre 0 e 10, em incrementos de 0,5, somente nos status permitidos.
- Exibir erros junto aos respectivos campos e impedir gravação enquanto houver entrada inválida.
- Manter validação de domínio em `validation.js`, persistência em `store.js`, apresentação em `ui.js` e integração dos formulários nos módulos de `forms/`.
- Usar `addEventListener` para eventos; remover atributos `onclick`, estilos inline e blocos `<style>` do HTML.
- Preservar módulos ES e execução direta no navegador, sem dependência de build.

A auditoria reaproveita os validadores e formulários já presentes na main. As alterações funcionais deste PR são a detecção de Chrome por CHROME_BIN no Windows e o aviso de remoção de prioridade na edição de leituras. Não inclui backend.

## Critérios de aceite

- [x] Regras da seção 4 aplicadas aos formulários e alinhadas aos validadores do store.
- [x] Todo erro de campo é apresentado junto ao campo correspondente, com mensagem geral quando necessário.
- [x] Entradas inválidas não são salvas nem alteram o armazenamento.
- [x] `yearRead` não pode ser futuro ou anterior ao ano de publicação.
- [x] Nota aceita apenas valores de 0 a 10, em passos de 0,5, nos status previstos.
- [x] Campos incompatíveis com o status são tratados conforme o contrato, com confirmação quando houver limpeza de dados.
- [x] Formulários preservam os valores informados após erro para permitir correção.
- [x] Páginas não contêm regras de domínio duplicadas nem acesso direto ao `localStorage`.
- [x] Eventos usam `addEventListener`; HTML não contém `onclick`, estilos inline ou blocos `<style>`.
- [x] Formulários de autores, livros e leituras verificados em 1280px e viewport móvel emulada de 390px; limites registrados abaixo.
- [x] Cenários de validação existentes reexecutados; adicionada regressão do aviso de prioridade na matriz de 25 transições, cancelamento e retorno à wishlist.
- [x] README e declaração de uso de IA permanecem consistentes com a implementação.

## Organização e decisões

`validation.js` concentra as regras de domínio e retorna erros no formato usado pelo store: `{status, message, errors: [{field, message}]}`. Os formulários devem reaproveitar essas regras e apresentar os erros sem alterar o contrato.

`store.js` permanece responsável por validar e persistir os dados. As páginas cuidam da renderização e atualização da tela; os módulos de formulário cuidam da coleta dos valores, apresentação dos erros e chamada das operações do store.

Campos numéricos devem ser convertidos para números antes de chegar ao store. Campos opcionais seguem o formato do seed e dos contratos (`null` ou arrays vazios, conforme o campo). Mensagens e nomes de campos devem ser consistentes entre validação, formulários e documentação.

## Evidências e testes

A implementação foi revisada em relação aos validadores, formulários, persistência e organização do frontend. Os testes automatizados existentes foram executados por meio do script de verificação.

### Verificações realizadas

- `validation.js` concentra as regras de domínio para autores, livros e leituras.
- `store.js` mantém a responsabilidade de validar e persistir os dados.
- Os formulários apresentam mensagens junto aos campos e preservam os valores informados após falhas.
- Os testes verificam que entradas inválidas não alteram o armazenamento.
- Não foram encontrados atributos de eventos inline nos arquivos do frontend.
- Não foram encontrados blocos `<style>` nos arquivos HTML.
- A estilização está concentrada em `frontend/css/styles.css`.
- Os módulos JavaScript permanecem separados e utilizam eventos registrados com `addEventListener`.

### Testes automatizados

O script `scripts/check-frontend.mjs` é a verificação reproduzível desta revisão. A execução original tinha 276 verificações existentes; a correção acrescenta 30 verificações do aviso de prioridade, totalizando:

| Suíte | Verificações |
|---|---:|
| Data | 27 |
| Foundation | 10 |
| Smoke browser | 15 |
| Authors browser | 35 |
| Books browser | 44 |
| Readings browser | 51 |
| Status browser | 124 |
| **Total** | **306** |

Resultado em 09/11/2026: todas as 306 verificações aprovadas, sem exceções não tratadas reportadas pelas suítes de navegador. Sintaxe e `git diff --check` também aprovados. Os logs da execução local estão em `/tmp/reading-tracker-check-SGdTdL` (temporários); as capturas abaixo estão versionadas e o check do PR reproduz a suíte.

### Matriz dos critérios do cartão

| Critério | Implementação e evidência |
|---|---|
| Erros junto aos campos; entradas inválidas não persistidas | validation.js, store.js e ui.js; testes de autores, livros e leituras |
| Ano não futuro nem anterior à publicação | validateReading; data.test.mjs, readings.browser.test.mjs e status.browser.test.mjs |
| Nota opcional de 0 a 10 em passos de 0,5 | validateReading; testes de limites, nota zero e ausência de nota |
| Dados, renderização e validação separados; módulos ES | store.js, pages/, forms/, ui.js, validation.js e script type=module no HTML |
| addEventListener; sem eventos/estilos inline ou blocos style | Inspeção estática do frontend; estilos em css/styles.css |

### Correção após code review

Ao editar uma leitura e sair de Want to read, a prioridade já era removida pelo contrato de transição. Agora um aviso junto ao final dos campos informa essa remoção antes de salvar, mantendo o rascunho até a gravação e explicando a preservação de recomendação/notas. Retornar à wishlist oculta o aviso; cancelar mantém os dados persistidos. A confirmação de limpeza de ano/nota continua independente. Na criação, prioridade incompatível continua sendo rejeitada junto ao campo, sem limpeza silenciosa.

### Verificação responsiva e limites

Em 09/11/2026 foram examinadas capturas dos formulários de autores, livros e leituras em 1280px e 390px. As suítes exercitam CRUD, mensagens junto aos campos, persistência, cancelamento, teclado/foco e verificam ausência de overflow horizontal nas duas larguras. A regressão de prioridade também gera capturas nas duas larguras e verifica se o aviso pode ser visto dentro da tela.

Capturas desta revisão: [autores 390px](../screenshots/fr06-authors-390.png), [autores 1280px](../screenshots/fr06-authors-1280.png), [livros 390px](../screenshots/fr06-books-390.png), [livros 1280px](../screenshots/fr06-books-1280.png), [leituras 390px](../screenshots/fr06-readings-390.png), [leituras 1280px](../screenshots/fr06-readings-1280.png), [aviso de prioridade 390px](../screenshots/fr06-priority-390.png) e [aviso de prioridade 1280px](../screenshots/fr06-priority-1280.png).

A emulação responsiva do Chrome (equivalente ao modo de dispositivos do DevTools) é evidência de layout e navegação em viewport móvel, suficiente para registrar essa verificação com esse escopo explícito. Não comprova execução em aparelho físico, Safari/iOS, teclado virtual ou gestos reais. Essas verificações em dispositivos reais não foram realizadas. A correção de detecção do Chrome foi executada em Linux; Windows permanece sem execução nesta revisão.

## Próximas tarefas

Atualizar o PR #9 com as correções e evidências, aguardar revisão de outro integrante e integrar somente após essa revisão. Testes em dispositivos físicos podem complementar a evidência de emulação registrada.
