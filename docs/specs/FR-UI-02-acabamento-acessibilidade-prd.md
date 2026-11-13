# PRD — FR-UI-02: Acabamento visual, feedback e acessibilidade

Data: 12/11/2026. Branch: `fr-ui-02`. Responsável: Ana Flavia Freiria, com assistência Codex. Revisor: a definir.
Cartão: https://trello.com/c/UU4ipLiF. Base inicial: main após PR #11; atualizada para `1932d15`, merge do PR #12, antes da regressão final.

## Objetivo e limites

Melhorar legibilidade, orientação e operação por teclado/toque, preservando identidade visual e os requisitos FR-01 a FR-07. Referências: enunciado do professor, seções 3–6 e 11; guia de seed; contratos de dados; critérios do cartão. HTML/CSS/JavaScript puros, idioma en-US, módulos ES e seed oficial intacto. Sem frameworks, dependências de build, enriquecimento automático de dados ou mudanças de domínio.

## Inventário e problemas a verificar

- Texto secundário, contornos dos campos, foco, badges, botões e links precisam de medições de contraste registradas.
- Sort, links de ação e checkboxes precisam de alvos de toque de 44x44px; manter controles nativos e não alterar a disposição desktop aprovada.
- Campos simples têm rótulos/erros; os novos grupos de autores/temas precisam de associação explícita de erros e tratamento do grupo pelo helper.
- Mensagens de sucesso, aviso, carregamento e erro precisam de conteúdo e apresentação distintos e regiões dinâmicas apropriadas, sem anunciar sucesso antes de salvar.
- Revisar retorno de foco em cancelamentos, inclusive Reset, foco nos grupos e estados vazio/carregamento/erro, sem apagar dados nem perder rascunhos.
- Conferir textos longos e zoom de 200%, incluindo rolagem interna de formulários e contornos de foco.

## Implementação prevista

1. Consolidar tokens de foco/contorno e estilos de feedback; ajustar somente contrastes necessários e dimensões/alinhamentos dos controles.
2. Tornar os grupos de seleção identificáveis e seus erros associados aos checkboxes; preservar o formato de arrays de IDs e a seleção opcional.
3. Explicitar campos obrigatórios/opcionais e contexto das mensagens. Preservar rascunhos e estados disabled em falhas e duplicação de submissão.
4. Corrigir os problemas de foco e de estados encontrados; preservar o diálogo nativo e os eventos existentes.
5. Acrescentar testes de navegador para os critérios abaixo, com relatórios de contraste e capturas antes/depois. Reexecutar a regressão completa integrada ao PR #12.

## Aceite e evidências exigidas

| Critério | Verificação |
| --- | --- |
| 1. Nomes, rótulos e erros | Inspeção de controles nos três formulários e grupos; aria-describedby/aria-invalid, erro com nome do campo e foco. |
| 2. Teclado e retorno de foco | Navegação, abertura, correção/cancelamento, Tab/Shift+Tab no modal e retorno ao acionador. |
| 3. Foco disponível | Contornos visíveis e não cortados nos alvos examinados; sem armadilhas fora do modal. |
| 4. Contraste | Texto normal >=4,5:1, grande >=3:1, contornos/indicadores necessários >=3:1; registrar pares medidos. |
| 5. Zoom | Zoom de 200% em Chrome, três telas e formulários; controles e mensagens disponíveis, sem sobreposição. |
| 6. Toque | Alvos de ações >=44x44 CSS px, incluindo Close e ações de registros. |
| 7. Feedback | Conteúdo distinguível além da cor, roles/status/alert apropriados. |
| 8. Save | Impedir duplicação; erro preserva valores e permite retry; sucesso somente após persistência. |
| 9. Estados | Vazio orienta cadastro; carregamento e erro orientam próximo passo; Retry não apaga dados existentes. |
| 10. Textos e ausentes | Títulos/autores/temas/notas longos, quebras preservadas, ausência representada por traço. |
| 11. Regressão | Check completo verde, ausência de exceções nos fluxos examinados e capturas antes/depois. |

## Limitações

Testes automatizados não representam certificação WCAG nem teste com leitor de tela. Declarar navegador, SO e método de zoom/emulação; não alegar aparelho físico, teclado virtual ou Safari/iOS sem executar. Revisão de colega e regressão final em dois navegadores pertencem ao aceite da equipe/FR-QA-01. Resultados e eventuais pendências serão registrados após execução.

## Implementação e verificação

Mantidas a paleta verde/papel, tipografia e disposição das ações desktop da FR-UI-01. Alterados texto secundário, contorno de campos, foco, alvos de toque e apresentação de mensagens. Obrigatoriedade explícita nos rótulos e atualização do ano em Read; erros incluem o nome do campo. Grupos de autores/temas têm erro comum associado aos checkboxes e foco no grupo ao falhar.

Feedback de sucesso/aviso/erro/carregamento tem prefixos e estilos distintos. O progresso de carregamento e Save possui regiões de status fora dos contêineres aria-busy; a mensagem visual durante Save fica oculta apenas para a árvore assistiva para evitar duplicação. Preservados rascunhos, confirmação, retry e exclusão de submissões concorrentes. Cancelar Reset retorna foco ao seu acionador. O diálogo nativo mantém Escape e o fundo inerte; um handler de Tab cobre somente as duas extremidades do modal.

A suíte `tests/accessibility.browser.test.mjs` acrescenta 85 verificações: nomes na árvore de acessibilidade do Chrome, rótulos, erros dos grupos, contraste calculado a partir de estilos computados, alvos de toque, teclado/contornos, foco, recuperação de falhas de leitura/seed/quota, estados vazios e zoom. O tema longo é criado pela interface, permanece selecionado e não perde o rascunho do livro. A regressão de títulos/autores/notas longos e de seleções usa também os 74 testes já integrados pelo PR #12.

Zoom: o teste usa `chrome.settingsPrivate.setDefaultZoom(2)` apenas na página interna de configurações do perfil isolado de teste, sem qualquer acesso a essa API no produto. Confere DPR 2 e viewport CSS reduzido em janela de 1280px; examina as três telas e alcance de Save nos formulários. Restaura o zoom 100% antes de encerrar. Isso é zoom do navegador, não ampliação por CSS ou pinch zoom.

### Contraste

Cálculo de luminância relativa sRGB; pares computados registrados em [FR-UI-02-contrast.json](../reports/FR-UI-02-contrast.json). Os números abaixo são exemplos medidos; controles inativos são excluídos da verificação de texto ativo.

| Combinação | Antes | Depois | Mínimo |
| --- | --- | --- | --- |
| Texto secundário / papel | 4,48:1 | 5,61:1 | 4,5:1 |
| Texto secundário / branco | — | 6,02:1 | 4,5:1 |
| Contorno do campo / branco | 1,80:1 | 3,64:1 | 3:1 |
| Foco / branco | — | 6,51:1 | 3:1 |
| Foco / papel | — | 6,08:1 | 3:1 |
| Texto de erro / fundo de erro | — | 6,38:1 | 4,5:1 |

Foram medidos também botões, cabeçalhos e os cinco badges de status. Esses testes cobrem os pares registrados e os fluxos examinados; não equivalem a uma auditoria completa de acessibilidade.

### Capturas

- Livros 390px: [antes](../screenshots/fr-ui-02-before-books-390.png) e [depois](../screenshots/fr-ui-02-after-books-390.png).
- Histórico 1280px: [antes](../screenshots/fr-ui-02-before-readings-1280.png) e [depois](../screenshots/fr-ui-02-after-readings-1280.png).
- [Formulário de livro](../screenshots/fr-ui-02-after-books-form-390.png) e [formulário de autor](../screenshots/fr-ui-02-after-authors-form-390.png).
- [Livro com zoom real de 200%](../screenshots/fr-ui-02-zoom-200-books.png).
- [Falha ao carregar com retry](../screenshots/fr-ui-02-seed-error-1280.png).

Ambiente: Linux, Node v24.21.0 e Chrome 156.0.8078.73. Capturas iniciais em /tmp/reading-tracker-check-UidabG; regressão final aprovada em /tmp/reading-tracker-check-6ffPAb, com 483 verificações e sintaxe (incluindo 85 novas). [Relatório por suíte](../reports/FR-UI-02-verificacao.md). Revisão de outro integrante ainda necessária.
