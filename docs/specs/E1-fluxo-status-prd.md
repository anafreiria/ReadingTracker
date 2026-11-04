# PRD — E1 / FR-04: Fluxo de status

Data: 04/11/2026. Branch: `feat/e1-status-workflow`.
Status: auditado e implementado; aguardando revisão. PRD escrito antes das alterações. Base: main 47ba30c (PR #6 integrado).
Cartão: https://trello.com/c/kYaEvkZn.

## 1. Objetivo e estado inicial

FR-03 integrou o CRUD de leituras e a confirmação de limpeza. FR-04 continua parcial por faltar auditoria específica das combinações entre os cinco status. Validar todos os critérios do cartão, corrigir lacunas reais e tornar as regras do status selecionado claras na interface. Não reimplementar regras já presentes no store/validation.

## 2. Fontes e critérios literais

Fontes lidas antes das alterações: seção 4 (Reading) e FR-04 do enunciado oficial `materiais/Reading_Tracker_Web_Application.pdf`; `docs/CONTRATOS_DADOS.md`; código e PRD de FR-03; exportação local do Trello `BSpxAKlv - programacao-web-trabalho-2-reading-tracker (1).json`. A consulta direta ao cartão em 04/11/2026 retornou recurso sem acesso. A exportação informa critérios, mas não comprova atribuições/estado atuais. Não alterar o quadro.

| Critério literal do cartão | Comportamento auditado | Evidência planejada |
|---|---|---|
| Exigir yearRead em Read; permitir em Abandoned; limpar nos demais | Read exige ano válido; Abandoned aceita ano ou null; Want to read/Reading/Paused ficam sem ano após confirmação quando necessário | Matriz de 25 combinações, testes sem ano/ano inválido e recarga |
| Permitir grade somente em Read/Abandoned | Nota opcional 0–10, passo 0,5, incluindo zero; demais status sem nota | Matriz e rejeições sem escrita, limpeza com confirmação |
| Permitir priority (Low/Medium/High) somente em Want to read | Três prioridades aceitas na wishlist; ausente fora dela; entradas incompatíveis na criação rejeitadas | Três prioridades na UI, saída da wishlist e validação dos demais status |
| Ao sair da wishlist, manter recomendação/notas e limpar prioridade | Ao transicionar, persistir recomendação/notas e remover prioridade; ID/obra e outras leituras preservados | Matriz com todos os destinos e comparações de registros |
| Pedir confirmação antes de limpar ano/nota incompatíveis com novo status | Mostrar campos, preservar rascunho até Save, exigir autorização atual, aceitar nota zero como dado; Cancel/Escape não gravam | Testes de confirmação individual/conjunta, consentimento invalidado, quota e recarga |

## 3. Escopo

- Auditar 5 × 5 combinações de origem/destino no formulário de edição, incluindo mesmo status, em navegador real. Fixtures usam store para preparar cada origem; a transição deve ocorrer pela UI e persistir após recarga.
- Preservar prepareReadingTransition/saveReading, suas regras e proteção de edição em outra aba.
- Acrescentar orientação em inglês específica ao status selecionado, associada ao select e anunciada como status acessível. Sinalizar yearRead como obrigatório no DOM em Read; o store continua sendo a autoridade de validação.
- Anunciar também o aviso de limpeza; não apagar os campos antes da confirmação e persistência. Alterar status/ano/nota invalida consentimento anterior; cancelar ou falhar preserva tudo.
- Verificar Read sem ano, Abandoned com/sem resultados, nota zero, limites de ano/nota e prioridade, seleção de três prioridades, preservação dos dados e recuperação de falhas.
- Reexecutar testes de dados e regressões relevantes de autores/livros/leituras. Atualizar status de FR-04 somente com evidência dos cinco critérios.

Fora do escopo: backend, alterações no seed/persistência, automação de Trello, redesign, filtros, gráficos e conclusão de FR-06 sem sua revisão completa. Não exigir nota em Read ou ano em Abandoned.

## 4. Organização e decisões

`forms/reading-form.js`: manter confirmação no próprio formulário; associar orientação dinâmica ao select via aria-describedby, com role=status. Atualizar required do ano como indicação de acessibilidade, sem substituir a validação do store. Não desabilitar/limpar campos silenciosamente: preservá-los permite cancelar e corrigir erros.

`strings.js`: textos em inglês dos EUA para cada status. `tests/status.browser.test.mjs`: auditoria independente, sem npm/build, usando Node 24 e DevTools com perfil isolado. Seguir o mesmo contrato de testes existentes e executar as suítes sequencialmente por compartilharem origem e Web Lock.

Se a matriz revelar falha, registrar no PRD e corrigir o menor ponto responsável; mudanças em store/validation exigem teste de domínio apropriado. Não modificar contratos sem evidência da necessidade.

## 5. Critérios adicionais de aceite

- [x] Cinco critérios do cartão aprovados com evidências individuais.
- [x] 25 combinações de status pela UI aprovadas após recarga; ID/bookId e leituras não editadas preservados.
- [x] Orientação correta nos cinco status e associação acessível; ano obrigatório apenas em Read.
- [x] Confirmação inclui grade zero e casos de apenas ano, apenas nota ou ambos.
- [x] Consentimento antigo não autoriza limpeza após mudança de status/ano/nota; retornar ao status original permite manter os dados.
- [x] Cancel/Escape e falhas de gravação/conflito não perdem registro ou rascunho; nova tentativa funciona.
- [x] Read inválido rejeitado sem escrita; Abandoned sem ano/nota aceito; três prioridades da wishlist válidas.
- [x] Desktop 1280px/celular 390px e teclado/foco verificados; sem exceções não capturadas no Chrome.
- [x] Testes existentes aprovados; README/guia/declaração impessoal de IA atualizados e git diff --check aprovado.
- [x] Branch própria enviada e PR aberto para revisão, sem merge automático.

## 6. Plano de verificação

Baseline nesta etapa: 10 testes foundation + 27 data aprovados. Usar suíte de status para matriz e casos de fronteira, comparando armazenamento antes/depois de operações rejeitadas e registros completos após recarga. Confirmar recuperação de quota e proteção de outra aba. Capturar e revisar aviso de limpeza em desktop/celular e navegação de teclado. Rodar suítes anteriores (35 autores, 44 livros e 51 leituras) após as alterações, sem repetir quando não houver novas mudanças/falhas.

## 7. Riscos e limites

Uma nota zero não é ausência. A confirmação deve considerar campos persistidos mesmo se o usuário os apagar manualmente antes de trocar status. Os testes precisam diferenciar transição de edição para o mesmo status, pois novas entradas inválidas não devem ser simplesmente apagadas. Em Read, não preencher ano automaticamente. Nenhuma edição deve transformar uma releitura em sobrescrita do histórico.

Somente Chrome/Linux será verificado nesta sessão; não prometer compatibilidade testada em Safari/Firefox ou leitor de tela. Preservar arquivos locais anteriores fora do commit e declaração de IA impessoal aprovada. FR-06 permanece parcial até auditoria própria.

## 8. Evidências finais

| Critério do cartão | Evidência final |
|---|---|
| Exigir yearRead em Read; permitir em Abandoned; limpar nos demais | Aprovado: matriz persistida, Read sem ano/ano futuro/anterior à publicação/fracionário rejeitado sem escrita, Abandoned com/sem ano e limpeza confirmada nos demais |
| Permitir grade somente em Read/Abandoned | Aprovado: matriz com grade zero/8,5, Read sem nota aceito e nota zero rejeitada na criação nos três status incompatíveis |
| Permitir priority (Low/Medium/High) somente em Want to read | Aprovado: três prioridades pela UI e rejeição na criação dos outros quatro status; matriz verifica prioridade null fora da wishlist |
| Ao sair da wishlist, manter recomendação/notas e limpar prioridade | Aprovado: quatro saídas da wishlist após recarga preservam textos, ID/bookId e todas as outras leituras; prioridade removida |
| Pedir confirmação antes de limpar ano/nota incompatíveis com novo status | Aprovado: seis pares incompatíveis bloqueiam Save sem consentimento, incluindo zero; avisos de apenas ano/apenas nota/ambos, Cancel/Escape, consentimento invalidado, quota/nova tentativa e conflito em outra aba |

Matriz da UI: 20 mudanças + cinco salvamentos no mesmo status, todos persistidos e comparados semanticamente após recarga. As cinco origens/destinos são Want to read, Reading, Paused, Read e Abandoned. Comparar registros por conteúdo, sem depender da ordem das propriedades do JSON.

- tests/status.browser.test.mjs: 94 verificações aprovadas, com as 25 combinações, metadados required/aria-describedby, orientação dinâmica e os casos de fronteira da tabela; nenhuma exceção não capturada no Chrome.
- Baseline e execução final de foundation/data: 10 + 27 testes aprovados.
- Regressões de autores/livros/leituras: 35 + 44 + 51 verificações aprovadas, sem exceções não capturadas; 224 verificações no Chrome somando a auditoria específica de status.
- A auditoria não exigiu novas regras ou mudanças no store/validation. A implementação de FR-03 já cumpria a lógica; nesta etapa, a UI passou a explicar cada status, sinalizar ano obrigatório em Read e anunciar o aviso de limpeza.
- Capturas revisadas visualmente: [desktop](../screenshots/fr04-status-1280.png) e [390px](../screenshots/fr04-status-390.png), mostrando o aviso real com ano/nota ainda no rascunho, consentimento e erro junto ao campo; diálogo usa rolagem interna sem overflow horizontal.
- README, guia e declaração impessoal de IA atualizados. git diff --check aprovado. PR preparado para revisão, sem merge automático.

Limites: Chrome/Linux; Safari/Firefox e leitor de tela não exercitados. A associação e os anúncios acessíveis foram verificados no DOM, não em leitor de tela. FR-06 continua parcial até revisão específica de todas as validações/organização. A exportação do Trello foi a fonte do checklist, pois a consulta direta foi negada. Nenhuma escrita no quadro. Alterações locais anteriores e arquivos de contexto ficam fora do commit.
