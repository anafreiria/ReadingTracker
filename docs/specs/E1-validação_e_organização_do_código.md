# PRD -- E1: Validação e organização do código

Responsável: Otávio de Oliveira. Branch: `feat/e1-validation-code-organization`

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

A tarefa não reimplementa persistência, CRUD ou regras já cobertas pelos contratos do store. Não inclui backend.

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
- [ ] Fluxos de autores, livros e leituras são verificados em desktop e celular.
- [x] Testes existentes continuam passando e novos cenários de validação são cobertos.
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

O script `scripts/check-frontend.mjs` foi executado com sucesso, contemplando:

| Suíte | Verificações |
|---|---:|
| Data | 27 |
| Foundation | 10 |
| Smoke browser | 15 |
| Authors browser | 35 |
| Books browser | 44 |
| Readings browser | 51 |
| Status browser | 94 |
| **Total** | **276** |

### Limitações da verificação

A execução automatizada não substitui a revisão visual dos fluxos em diferentes tamanhos de tela. A verificação manual de desktop e celular deve ser registrada separadamente antes da conclusão da tarefa.

## Próximas tarefas

Concluir a verificação manual dos fluxos de autores, livros e leituras em desktop e celular.
Revisar README e documentação para manter os registros consistentes.
Abrir PR para main e aguardar revisão; não fazer commits diretamente na main.
