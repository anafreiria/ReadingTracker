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

- [ ] Regras da seção 4 aplicadas aos formulários e alinhadas aos validadores do store.
- [ ] Todo erro de campo é apresentado junto ao campo correspondente, com mensagem geral quando necessário.
- [ ] Entradas inválidas não são salvas nem alteram o armazenamento.
- [ ] `yearRead` não pode ser futuro ou anterior ao ano de publicação.
- [ ] Nota aceita apenas valores de 0 a 10, em passos de 0,5, nos status previstos.
- [ ] Campos incompatíveis com o status são tratados conforme o contrato, com confirmação quando houver limpeza de dados.
- [ ] Formulários preservam os valores informados após erro para permitir correção.
- [ ] Páginas não contêm regras de domínio duplicadas nem acesso direto ao `localStorage`.
- [ ] Eventos usam `addEventListener`; HTML não contém `onclick`, estilos inline ou blocos `<style>`.
- [ ] Fluxos de autores, livros e leituras são verificados em desktop e celular.
- [ ] Testes existentes continuam passando e novos cenários de validação são cobertos.
- [ ] README e declaração de uso de IA permanecem consistentes com a implementação.

## Organização e decisões

`validation.js` concentra as regras de domínio e retorna erros no formato usado pelo store: `{status, message, errors: [{field, message}]}`. Os formulários devem reaproveitar essas regras e apresentar os erros sem alterar o contrato.

`store.js` permanece responsável por validar e persistir os dados. As páginas cuidam da renderização e atualização da tela; os módulos de formulário cuidam da coleta dos valores, apresentação dos erros e chamada das operações do store.

Campos numéricos devem ser convertidos para números antes de chegar ao store. Campos opcionais seguem o formato do seed e dos contratos (`null` ou arrays vazios, conforme o campo). Mensagens e nomes de campos devem ser consistentes entre validação, formulários e documentação.

## Evidências e testes

Os testes e verificações abaixo estão previstos para a implementação. Registrar os resultados efetivamente obtidos, os cenários manuais verificados e eventuais limitações antes de concluir a tarefa.

Comandos de teste:

```bash
node tests/foundation.test.mjs
node tests/data.test.mjs
node tests/authors.browser.test.mjs
node tests/books.browser.test.mjs
node tests/readings.browser.test.mjs
node tests/status.browser.test.mjs
node tests/smoke.browser.test.mjs
node scripts/check-frontend.mjs
```

Auditoria estática inicial:

```bash
grep -RniE ' on[a-z]+=| style=|<style' frontend --include='*.html' --include='*.js'
```

Os resultados da auditoria devem ser revisados manualmente para distinguir ocorrências reais de atributos inline de strings, exemplos ou testes.

| Área | Cenários |
|---|---|
| Autores | Campos obrigatórios, nome duplicado sem diferença entre maiúsculas/minúsculas, nacionalidade e datas |
| Livros | Título, ano de publicação, autores e temas válidos, referências inexistentes |
| Leituras | Livro existente, status, ano de leitura, nota, prioridade e campos incompatíveis |
| Formulários | Erros próximos aos campos, valores preservados após falha e nenhuma gravação inválida |
| Organização | Eventos sem atributos inline, módulos separados e ausência de acesso direto ao armazenamento nas páginas |
| Interface | Navegação por teclado, diálogos, viewport desktop e celular |

A FR-06 não deve ser considerada concluída apenas pela existência dos módulos: os formulários precisam estar conectados aos validadores e impedir gravações inválidas.

## Próximas tarefas

- Revisar as regras da seção 4 com os contratos existentes.
- Implementar as correções necessárias nos formulários e na apresentação de erros.
- Executar testes automatizados e regressão das telas.
- Atualizar README caso alguma decisão ou limitação tenha mudado.
- Abrir PR para `main` e aguardar revisão; não fazer commits diretamente na `main`.
