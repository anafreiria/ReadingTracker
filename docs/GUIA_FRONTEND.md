# Guia para continuar o frontend

## Começar

1. Após o merge do PR da base, atualizar main e criar uma branch por tarefa. Nunca trabalhar ou publicar diretamente em main.
2. Abrir `frontend/index.html` pelo Live Server. Alternativa: `python3 -m http.server 8087 --directory frontend`, acessando http://localhost:8087.
3. Ler o [PRD](specs/E1-planejamento-base-prd.md) e a seção 4 do enunciado em `materiais/`.
4. Usar os botões Preview para consultar os campos previstos. Eles não salvam dados.

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/authors-crud
```

## Onde trabalhar

| Arquivo | Responsabilidade |
|---|---|
| frontend/js/pages/authors.js | Listagem de autores e futura conexão ao CRUD |
| frontend/js/pages/books.js | Livros, detalhes e histórico da obra |
| frontend/js/pages/readings.js | Histórico e ordenação; futuro fluxo de leituras |
| frontend/js/forms.js | Prévias dos formulários, a evoluir por área |
| frontend/js/ui.js | Elementos seguros, tabelas, diálogo e erros de campo |
| frontend/js/store.js | Toda leitura/persistência e futuras chamadas à API |
| frontend/js/validation.js | Estrutura e erros; adicionar validações de domínio |
| frontend/js/strings.js | Textos compartilhados em inglês |
| frontend/js/constants.js | Valores controlados e chave de armazenamento |
| frontend/css/styles.css | Tokens e estilos; coordenar alterações compartilhadas |

Uma tela chama funções async do store com await. Não acessar localStorage ou fetch de dados em páginas. Não salvar dados inválidos. Não inserir dados de registros com innerHTML. Usar addEventListener; sem onclick/style inline. Os métodos de escrita propostos no PRD ainda precisam ser implementados.

## Próximas tarefas sugeridas

- Colega 1: FR-01 — autores, validações, países, datas e exclusão vinculada.
- Colega 2: FR-02 — livros, autores e temas selecionáveis, criação de tema e validações.
- Ana: coordenação dos contratos comuns e FR-03/FR-04 — leituras, primeira leitura e transições.
- Equipe: finalizar FR-06/FR-07, reset, revisão da ordenação, responsividade e testes de aceitação.

Definir nomes e revisores no Trello antes de começar. Os cartões de dados/validação são compartilhados: combinar quem altera quais exports antes de editar. Não abrir três implementações independentes de persistência. Separar formulários por área quando necessário, preservando componentes comuns e os contratos documentados.

## Verificar e pedir revisão

- Exercitar o fluxo alterado no navegador, em celular e desktop; recarregar para verificar persistência.
- Rodar `node tests/foundation.test.mjs` se Node estiver disponível; nenhum pacote é necessário.
- Atualizar o checklist real do README e a declaração de IA.
- Enviar a branch e abrir PR com comportamento alterado e evidência de verificação. Outro integrante revisa antes do merge.

## Mensagem pronta para compartilhar

> Preparei a base do Reading Tracker: navegação entre Reading History, Books e Authors, dados oficiais, histórico por livro, tabela ordenável e prévias dos formulários. Tudo usa HTML/CSS/JS puros, com módulos separados e acesso a dados concentrado no store.js. As prévias ainda não salvam; os CRUDs continuam nos cartões próprios. Leiam docs/GUIA_FRONTEND.md e o PRD em docs/specs/E1-planejamento-base-prd.md. Depois do merge, cada um atualiza main, cria uma branch da sua tarefa e abre PR para revisão. Vamos combinar a divisão de autores/livros/leituras e alterações nos arquivos compartilhados antes de começar.
