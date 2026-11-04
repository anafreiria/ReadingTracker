# Guia para continuar o frontend

## Começar

1. Após o merge do PR da base, atualizar main e criar uma branch por tarefa. Nunca trabalhar ou publicar diretamente em main.
2. Ler também os [contratos implementados de dados e validação](CONTRATOS_DADOS.md). Abrir `frontend/index.html` pelo Live Server. Alternativa: `python3 -m http.server 8087 --directory frontend`, acessando http://localhost:8087.
3. Ler o [PRD](specs/E1-planejamento-base-prd.md) e a seção 4 do enunciado em `materiais/`.
4. Authors, Books e Reading History oferecem cadastro, consulta, edição e exclusão. Books inclui temas, detalhes e primeira leitura opcional; o histórico da obra permite registrar releituras e manter suas leituras individuais.

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
| frontend/js/forms/reading-form.js | Cadastro, edição, confirmação de limpeza e exclusão individual de leituras |
| frontend/js/forms/book-form.js | Cadastro/edição de livro, temas, primeira leitura e exclusão em cascata |
| frontend/js/forms/form-action.js | Ciclo compartilhado de envio, bloqueio e apresentação de erros |
| frontend/js/forms/author-form.js | Formulário funcional de autores e confirmação de exclusão |
| frontend/js/ui.js | Elementos seguros, tabelas, diálogo e erros de campo |
| frontend/js/store.js | Leitura, CRUD, transações locais e reset; futuras chamadas à API |
| frontend/js/validation.js | Estrutura, erros e validações de domínio já implementadas |
| frontend/js/strings.js | Textos compartilhados em inglês |
| frontend/js/constants.js | Valores controlados e chave de armazenamento |
| frontend/css/styles.css | Tokens e estilos; coordenar alterações compartilhadas |

Uma tela chama funções async do store com await. Não acessar localStorage ou fetch de dados em páginas. Não salvar dados inválidos. Não inserir dados de registros com innerHTML. Usar addEventListener; sem onclick/style inline. Os métodos de escrita já estão implementados e testados; o contrato atual está em CONTRATOS_DADOS.md. O PRD inicial registra a fase anterior, na qual só havia leitura. Autores, livros e leituras já têm formulário funcional; o CRUD próprio de leituras também está conectado. FR-04 foi auditado nas 25 combinações entre status. A próxima etapa é auditar FR-06 antes da revisão final.

## Próximas tarefas sugeridas

- FR-01 — autores integrado à main no PR #3, conforme confirmação de Ana.
- FR-02 — livros/temas integrado à main no PR #4.
- FR-03 — leituras/releituras integrado à main no PR #6, com matriz dos quatro critérios no PRD.
- FR-04 — cinco critérios e 25 combinações de status auditados nesta branch; aguarda revisão do PR.
- Próxima etapa sugerida: revisão completa de FR-06 (validação e organização), seguida de testes e revisão final da entrega.
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

readingForm recebe reading opcional, bookId opcional para contexto da obra, books atuais e os mesmos callbacks. Sem id, saveReading cria uma nova ocasião de leitura; com id, atualiza aquela ocasião. Os detalhes mostram também prioridade, recomendação e notas. deleteReadingForm confirma e remove somente o registro, mantendo livro e outras leituras.

Ao alterar status na edição, prepareReadingTransition prepara os dados; uma confirmação no próprio formulário lista ano/nota removidos, inclusive nota zero. Não passar confirmFieldClear sem ação explícita. A confirmação é invalidada quando status/ano/nota mudam e não apaga o rascunho antes da persistência. A auditoria dedicada de FR-04 está registrada em docs/specs/E1-fluxo-status-prd.md e tests/status.browser.test.mjs. Inclui 25 combinações (20 mudanças e cinco salvamentos no mesmo status), consentimento, cancelamento e falhas. A orientação dinâmica associada ao select explica as regras atuais, e required sinaliza o ano apenas em Read. Essa indicação não substitui os validadores do store.

app.js recebe callbacks das tabelas global e por obra e consulta o ID atual antes de editar/excluir. showRecordDialog troca o conteúdo do mesmo diálogo e preserva o botão original da página para retorno de foco; não abre modais aninhados. Se a consulta falhar enquanto o histórico da obra está aberto, o alerta fica dentro do diálogo. Após sucesso, recordSaved relê o snapshot, fecha e anuncia com foco. forms.js, que continha as prévias antigas, foi removido.

Reutilizar esses padrões nas revisões, sem criar outra persistência. Coordenar mudanças em app.js/ui.js/CSS.

## Check automático e reprodução local

Cada PR para main executa **Frontend checks**, configurado em `.github/workflows/frontend.yml`. O mesmo comando pode ser rodado com Node 24+ e Chrome instalados:

```bash
node scripts/check-frontend.mjs
```

O script abre seu próprio servidor estático e Chrome com portas/perfil temporários, verifica sintaxe, roda testes de dados, confirma a inicialização e executa as suítes de navegador sequencialmente. Não é necessário iniciar Python nem reaproveitar a janela do usuário. Novos arquivos `tests/*.test.mjs` entram na descoberta; `*.browser.test.mjs` são tratados como testes de navegador. Não adicionar dependências de build ao frontend para integrar novos testes.

O terminal informa a pasta de relatórios. Configure FRONTEND_REPORT_DIR para escolher a pasta-base e CHROME_BIN para indicar o executável, se necessário. O modo --smoke-only serve para diagnóstico rápido; a CI sempre roda todos os testes. O perfil da automação bloqueia Google Fonts e usa fallback local; os arquivos do produto são servidos sem transformação.

No GitHub, abra o check do PR para ler logs, resumo e baixar o artefato frontend-checks-... (retenção de sete dias). Falhas de navegador preservam erro e screenshot, quando o navegador responde, antes do fechamento da aba. Corrija a causa e envie novo commit; não enfraqueça assertions para conseguir verde. O check complementa a revisão do scrum master. A proteção da main pode exigir o nome estável Frontend checks antes do merge; essa configuração do repositório é independente do workflow.

## Teste de integração em Chrome

Node 24+ e Chrome são ferramentas de teste, sem build nem dependências no produto. Em terminais separados, a partir da raiz:

```bash
python3 -m http.server 8087 --bind 127.0.0.1 --directory frontend
google-chrome --headless=new --disable-gpu --no-first-run --no-default-browser-check --remote-debugging-port=9337 --user-data-dir=/tmp/reading-tracker-fr01-chrome about:blank
node tests/authors.browser.test.mjs
node tests/books.browser.test.mjs
node tests/readings.browser.test.mjs
node tests/status.browser.test.mjs
```

Usar exclusivamente um perfil isolado de testes e fechar outras abas da aplicação nesse perfil. Executar as suítes de navegador sequencialmente, pois usam a mesma origem e proteção de edição. Cada suíte cria suas próprias abas e substitui a chave reading-tracker:data:v1 nessa origem, terminando com reset do seed. Nunca apontar para um perfil com dados pessoais. O teste usa o protocolo DevTools diretamente; nenhuma instalação npm é necessária. É possível configurar APP_URL e CHROME_DEBUG_PORT; SCREENSHOT_DIR permite escolher a pasta de capturas. As suítes de livros, leituras e status usam /tmp/reading-tracker-fr02-shots, /tmp/reading-tracker-fr03-shots e /tmp/reading-tracker-fr04-shots por padrão. O restante da verificação continua sendo `node tests/foundation.test.mjs` e `node tests/data.test.mjs`.

## Mensagem pronta para compartilhar

> O Reading Tracker já tem CRUD de autores/livros/leituras, temas, primeira leitura opcional, releituras e exclusões confirmadas. O fluxo de status foi auditado nos cinco critérios do cartão e nas 25 combinações, com confirmação de limpeza, preservação de notas/recomendação e recuperação de falhas. Leiam docs/specs/E1-fluxo-status-prd.md e docs/GUIA_FRONTEND.md. A próxima etapa é auditar FR-06 e revisar a entrega. Depois do merge, atualizem main e criem uma branch por tarefa, combinando responsáveis e alterações compartilhadas.
