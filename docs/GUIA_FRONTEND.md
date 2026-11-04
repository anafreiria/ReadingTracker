# Guia para continuar o frontend

## Começar

1. Após o merge do PR da base, atualizar main e criar uma branch por tarefa. Nunca trabalhar ou publicar diretamente em main.
2. Ler também os [contratos implementados de dados e validação](CONTRATOS_DADOS.md). Abrir `frontend/index.html` pelo Live Server. Alternativa: `python3 -m http.server 8087 --directory frontend`, acessando http://localhost:8087.
3. Ler o [PRD](specs/E1-planejamento-base-prd.md) e a seção 4 do enunciado em `materiais/`.
4. Authors e Books oferecem cadastro, edição e exclusão. Books inclui temas, detalhes e primeira leitura opcional. Somente Reading History mantém Preview, sem salvar.

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/readings-crud
```

## Onde trabalhar

| Arquivo | Responsabilidade |
|---|---|
| frontend/js/pages/authors.js | Listagem de autores e callbacks de edição/exclusão |
| frontend/js/pages/books.js | Livros, detalhes e histórico da obra |
| frontend/js/pages/readings.js | Histórico e ordenação; futuro fluxo de leituras |
| frontend/js/forms.js | Prévia de leituras, próxima área a evoluir |
| frontend/js/forms/book-form.js | Cadastro/edição de livro, temas, primeira leitura e exclusão em cascata |
| frontend/js/forms/form-action.js | Ciclo compartilhado de envio, bloqueio e apresentação de erros |
| frontend/js/forms/author-form.js | Formulário funcional de autores e confirmação de exclusão |
| frontend/js/ui.js | Elementos seguros, tabelas, diálogo e erros de campo |
| frontend/js/store.js | Leitura, CRUD, transações locais e reset; futuras chamadas à API |
| frontend/js/validation.js | Estrutura, erros e validações de domínio já implementadas |
| frontend/js/strings.js | Textos compartilhados em inglês |
| frontend/js/constants.js | Valores controlados e chave de armazenamento |
| frontend/css/styles.css | Tokens e estilos; coordenar alterações compartilhadas |

Uma tela chama funções async do store com await. Não acessar localStorage ou fetch de dados em páginas. Não salvar dados inválidos. Não inserir dados de registros com innerHTML. Usar addEventListener; sem onclick/style inline. Os métodos de escrita já estão implementados e testados; o contrato atual está em CONTRATOS_DADOS.md. O PRD inicial registra a fase anterior, na qual só havia leitura. Autores e livros já têm formulário funcional; conectar o CRUD próprio de leituras e as transições de status faz parte das próximas tarefas.

## Próximas tarefas sugeridas

- FR-01 — autores integrado à main no PR #3, conforme confirmação de Ana.
- FR-02 — livros/temas implementados nesta branch; aguarda revisão do PR.
- Ana: coordenação dos contratos comuns e FR-03/FR-04 — leituras, primeira leitura e transições.
- Equipe: conectar erros/validações aos formulários, confirmar exclusões e transições, revisar ordenação, responsividade e testes de aceitação. FR-07 já está implementado, incluindo reset; preservá-lo nas integrações.

Ana informou a atribuição de FR-01 a ela no Trello. Combinar responsáveis pelos demais cartões; a divisão acima é sugestão, não atribuição automática. Os cartões de dados/validação são compartilhados: combinar quem altera quais exports antes de editar. Não abrir três implementações independentes de persistência. Separar formulários por área quando necessário, preservando componentes comuns e os contratos documentados.

## Verificar e pedir revisão

- Exercitar o fluxo alterado no navegador, em celular e desktop; recarregar para verificar persistência.
- Rodar `node tests/foundation.test.mjs` e `node tests/data.test.mjs` se Node 24+ estiver disponível; nenhum pacote é necessário.
- Atualizar o checklist real do README e a declaração de IA.
- Enviar a branch e abrir PR com comportamento alterado e evidência de verificação. Outro integrante revisa antes do merge.

## Padrão implementado para formulários

`authorForm({author, countries, onBusy, onSuccess, onCancel})` retorna um formulário DOM. `author` ausente significa criação; na edição, app.js consulta getAuthor(id) antes de abrir o diálogo. `deleteAuthorForm` usa o mesmo ciclo de gravação e recebe o registro a excluir. A UI não duplica as regras de domínio: converte countryId para número e opcionais vazios para null, aguarda saveAuthor/deleteAuthor e mostra os erros do store.

`onBusy` protege envio, Close e Escape durante a gravação. `onSuccess` pede a app.js uma nova leitura do snapshot, fecha o diálogo e anuncia o resultado com foco. Falha de gravação preserva campos; falha posterior ao salvar informa explicitamente que o registro já foi salvo. A mensagem específica de nome duplicado também aparece no campo name; outros conflitos 409 ficam na mensagem geral. Eventos storage aguardam o fechamento do formulário. Não reutilizar dados antigos da linha para preencher edição.

`bindFormAction(form, button, options)` em forms/form-action.js agora concentra o ciclo usado por autores, livros e criação de tema. Por padrão trata submit; a criação de tema usa event: 'click'. `operation(values)` chama o store, `errorFields` adapta apenas erros específicos e `onSuccess(result)` atualiza a UI. formValues coleta números de IDs dos multiselects, checkboxes e valores de controles habilitados; cada formulário converte os demais números. O helper protege entradas com badInput e preserva disabled, inclusive da seção opcional de primeira leitura.

bookForm recebe book opcional, authors/themes atuais e os mesmos callbacks. Edição usa saveBook; criação usa saveBookWithReading, com leitura null quando desmarcada. Não criar livro e leitura em chamadas separadas. deleteBookForm recebe quantidade atual de leituras e confirma a cascata. bookDetails apresenta todas as propriedades e histórico.

Create theme é uma gravação explícita e independente, informada na interface. O tema é salvo imediatamente, selecionado e permanece se cancelar o livro. Se houver texto ainda não criado em New theme, Save book pede para criar ou limpar o campo. Os valores digitados e seleções sobrevivem às falhas.

Para Readings, reutilizar o helper, field/showFieldErrors, callbacks e strings centralizadas. Acrescentar consulta e edição por ID, releituras, exclusão individual e confirmação de limpeza nas transições; não criar outra persistência. Coordenar mudanças em app.js/ui.js/CSS.

## Teste de integração em Chrome

Node 24+ e Chrome são ferramentas de teste, sem build nem dependências no produto. Em terminais separados, a partir da raiz:

```bash
python3 -m http.server 8087 --bind 127.0.0.1 --directory frontend
google-chrome --headless=new --disable-gpu --no-first-run --no-default-browser-check --remote-debugging-port=9337 --user-data-dir=/tmp/reading-tracker-fr01-chrome about:blank
node tests/authors.browser.test.mjs
node tests/books.browser.test.mjs
```

Usar exclusivamente um perfil isolado de testes e fechar outras abas da aplicação nesse perfil. Executar as suítes de navegador sequencialmente, pois usam a mesma origem e proteção de edição. Cada suíte cria suas próprias abas e substitui a chave reading-tracker:data:v1 nessa origem, terminando com reset do seed. Nunca apontar para um perfil com dados pessoais. O teste usa o protocolo DevTools diretamente; nenhuma instalação npm é necessária. É possível configurar APP_URL e CHROME_DEBUG_PORT; SCREENSHOT_DIR permite escolher a pasta de capturas. A suíte de livros usa /tmp/reading-tracker-fr02-shots por padrão. O restante da verificação continua sendo `node tests/foundation.test.mjs` e `node tests/data.test.mjs`.

## Mensagem pronta para compartilhar

> O Reading Tracker já tem CRUD visual de autores e livros, temas, primeira leitura opcional e exclusão em cascata com confirmação. Acesso aos dados continua centralizado no store.js. A próxima tarefa sugerida é completar FR-03/FR-04: releituras, edição/exclusão individual de leituras e transições. Leiam docs/GUIA_FRONTEND.md, docs/CONTRATOS_DADOS.md e docs/specs/E1-livros-crud-prd.md. O ciclo comum dos formulários está em forms/form-action.js. Depois do merge, atualizem main e criem uma branch por tarefa; combinem responsáveis e mudanças nos arquivos compartilhados.
