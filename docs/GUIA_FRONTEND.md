# Guia para continuar o frontend

## Começar

1. Após o merge do PR da base, atualizar main e criar uma branch por tarefa. Nunca trabalhar ou publicar diretamente em main.
2. Ler também os [contratos implementados de dados e validação](CONTRATOS_DADOS.md). Abrir `frontend/index.html` pelo Live Server. Alternativa: `python3 -m http.server 8087 --directory frontend`, acessando http://localhost:8087.
3. Ler o [PRD](specs/E1-planejamento-base-prd.md) e a seção 4 do enunciado em `materiais/`.
4. Authors já oferece Add author, Edit e Delete. Os botões Preview de Books/Reading History consultam os campos previstos e não salvam dados.

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/authors-crud
```

## Onde trabalhar

| Arquivo | Responsabilidade |
|---|---|
| frontend/js/pages/authors.js | Listagem de autores e callbacks de edição/exclusão |
| frontend/js/pages/books.js | Livros, detalhes e histórico da obra |
| frontend/js/pages/readings.js | Histórico e ordenação; futuro fluxo de leituras |
| frontend/js/forms.js | Prévias de livros/leituras, a evoluir por área |
| frontend/js/forms/author-form.js | Formulário funcional de autores e confirmação de exclusão |
| frontend/js/ui.js | Elementos seguros, tabelas, diálogo e erros de campo |
| frontend/js/store.js | Leitura, CRUD, transações locais e reset; futuras chamadas à API |
| frontend/js/validation.js | Estrutura, erros e validações de domínio já implementadas |
| frontend/js/strings.js | Textos compartilhados em inglês |
| frontend/js/constants.js | Valores controlados e chave de armazenamento |
| frontend/css/styles.css | Tokens e estilos; coordenar alterações compartilhadas |

Uma tela chama funções async do store com await. Não acessar localStorage ou fetch de dados em páginas. Não salvar dados inválidos. Não inserir dados de registros com innerHTML. Usar addEventListener; sem onclick/style inline. Os métodos de escrita já estão implementados e testados; o contrato atual está em CONTRATOS_DADOS.md. O PRD inicial registra a fase anterior, na qual só havia leitura. Autores já têm formulário funcional; conectar livros e leituras ao store faz parte das próximas tarefas.

## Próximas tarefas sugeridas

- Ana: FR-01 — CRUD visual de autores implementado nesta branch; aguarda revisão do PR.
- Colega 2: FR-02 — livros, autores e temas selecionáveis, criação de tema e validações.
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

Para Books/Readings, reutilizar esse ciclo conceitual, field/showFieldErrors, callbacks e strings centralizadas. Não importar o helper interno de autores nem criar outra camada de persistência. A extração de helpers adicionais deve ocorrer quando houver necessidade concreta nas próximas telas. Coordenar mudanças em app.js/ui.js/CSS.

## Teste de integração em Chrome

Node 24+ e Chrome são ferramentas de teste, sem build nem dependências no produto. Em terminais separados, a partir da raiz:

```bash
python3 -m http.server 8087 --bind 127.0.0.1 --directory frontend
google-chrome --headless=new --disable-gpu --no-first-run --no-default-browser-check --remote-debugging-port=9337 --user-data-dir=/tmp/reading-tracker-fr01-chrome about:blank
node tests/authors.browser.test.mjs
```

Usar exclusivamente um perfil isolado de testes e fechar outras abas da aplicação nesse perfil. A suíte cria suas próprias abas e substitui a chave reading-tracker:data:v1 nessa origem, terminando com reset do seed. Nunca apontar para um perfil com dados pessoais. O teste usa o protocolo DevTools diretamente; nenhuma instalação npm é necessária. É possível configurar APP_URL e CHROME_DEBUG_PORT; SCREENSHOT_DIR permite guardar capturas opcionais. O restante da verificação continua sendo `node tests/foundation.test.mjs` e `node tests/data.test.mjs`.

## Mensagem pronta para compartilhar

> O Reading Tracker já tem CRUD visual de autores: Add author, Edit e Delete, validações, confirmação e proteção de autores vinculados. Acesso aos dados continua centralizado no store.js. Books e Reading History ainda têm formulários de prévia, mas seus contratos de escrita já existem. Leiam docs/GUIA_FRONTEND.md, docs/CONTRATOS_DADOS.md e docs/specs/E1-autores-crud-prd.md para seguir o padrão de callbacks, erros e atualização. Depois do merge, atualizem main e criem uma branch por tarefa. Vamos combinar os próximos responsáveis e as alterações nos arquivos compartilhados.
