# PRD — E1: Verificação contínua do frontend

Data: 04/11/2026. Branch: `ci/frontend-checks`.
Status: implementado e validado localmente; primeira execução remota no PR. PRD escrito antes da implementação. Base: main 02148b2 (FR-04 integrado).
Origem: pedido da equipe para detectar regressões automaticamente no GitHub conforme novos integrantes implementam funcionalidades.

## 1. Problema e objetivo

O projeto tem testes de base/dados e quatro suítes de interface, mas sua execução depende de iniciar servidor/Chrome manualmente. Criar um check automático por PR que confirme inicialização da aplicação, carregamento dos recursos e funcionamento dos fluxos existentes. Reutilizar as verificações já executadas; não acrescentar ferramentas npm ou build ao frontend.

## 2. Fontes e restrições

- README, docs/GUIA_FRONTEND.md e testes existentes: 37 testes de base/dados e 224 verificações de navegador nesta base.
- Enunciado em materiais/Reading_Tracker_Web_Application.pdf: frontend HTML/CSS/JS puros, sem pacotes/build no produto; ferramentas de teste permanecem separadas.
- Documentação oficial consultada: [checkout v6](https://github.com/actions/checkout/tree/v6), [setup-node v6](https://github.com/actions/setup-node/tree/v6) (Node 24 e package-manager-cache: false), [upload-artifact v4](https://github.com/actions/upload-artifact/tree/v4) e [inventário ubuntu-24.04](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) com Chrome pré-instalado. A resolução de fontes no perfil de teste usa o [mapeamento de hosts do Chromium](https://chromium.googlesource.com/chromium/src/+/main/net/dns/README.md).
- Este pedido é infraestrutura de verificação. Não conclui a auditoria de FR-06 nem substitui revisão humana.

## 3. Critérios de aceite

| ID | Critério do pedido | Implementação prevista | Verificação |
|---|---|---|---|
| CI-01 | Verificar automaticamente novas contribuições | Workflow em pull_request para main, push na main e workflow_dispatch; check com nome estável Frontend checks | Primeiro PR da configuração executado no GitHub; consultar conclusão |
| CI-02 | Confirmar que o frontend está rodando | Servidor HTTP local efêmero, Chrome isolado e smoke de inicialização/recursos, navegação e diálogos | Executar localmente o mesmo comando da CI; capturar estado inicial e testar três áreas |
| CI-03 | Detectar regressões funcionais | Sintaxe JS + descoberta dos testes *.test.mjs e *.browser.test.mjs; suítes sequenciais | Todos os testes existentes aprovados na nova execução automática |
| CI-04 | Falhar de verdade quando a aplicação quebra | Código de saída diferente de zero em falha/timeout; nenhuma etapa com continue-on-error | Cópia temporária com exceção de inicialização inserida: check falha e registra evidência, sem alterar o frontend real |
| CI-05 | Facilitar diagnóstico | Logs por etapa, resumo e capturas; upload de artefatos mesmo em falhas | Conferir arquivos em sucesso e no cenário negativo, além do artefato do GitHub |
| CI-06 | Preservar tecnologias e execução simples | Node 24/Chrome somente para teste; nenhuma dependência npm/build no produto | Sem package.json/lockfiles novos; execução normal pelo Live Server/Python preservada |

## 4. Escopo e arquitetura

`.github/workflows/frontend.yml`: runner ubuntu-24.04, checkout e Node 24, comando único, permissões contents:read, cancelamento de execução antiga do mesmo PR, timeout e artefatos com retenção curta. Usar pull_request, sem pull_request_target. Sem segredos, deploy, merge ou push automáticos. Sem filtro de caminhos que possa deixar um check obrigatório esperando execução.

`scripts/check-frontend.mjs`: inicia servidor estático local com Node nativo em porta livre; inicia Chrome headless com perfil temporário e porta de depuração livre; aguarda prontidão com limite de tempo; executa testes com timeout e encerra somente os processos que criou. Grava logs/resumo em pasta informada por FRONTEND_REPORT_DIR ou pasta temporária local. CHROME_BIN permite apontar o executável. Não reutilizar perfil/servidor pessoal, portas fixas ou localStorage de outra origem.

O comando padrão valida sintaxe e roda testes de dados e de navegador. `--smoke-only` valida sintaxe/inicialização para diagnóstico rápido e prova negativa em cópia isolada; a CI usa sempre o comando completo. Novos arquivos com os padrões de testes são descobertos automaticamente.

`tests/smoke.browser.test.mjs`: confirmação independente de que módulos/seed/CSS carregam via HTTP, três áreas exibem dados, formulários abrem/fecham e página cabe em desktop/celular, sem exceções nem recursos locais com HTTP de erro.

`tests/browser-diagnostics.mjs`: captura de falha reutilizada pelas suítes, preservando screenshot e erro antes de fechar a aba. Não modificar critérios/assertions existentes para obter verde.

## 5. Fluxo para a equipe

Abrir PR normalmente. O check Frontend checks roda e fornece logs/artefatos na aba Actions. Corrigir falhas e enviar novos commits para nova execução; execuções antigas do mesmo PR são canceladas. A revisão humana continua necessária. Documentar que uma regra de proteção da main pode exigir esse check antes do merge; configurar regras do repositório não faz parte desta alteração.

Reprodução local: Node 24+ e Chrome instalado; `node scripts/check-frontend.mjs` inicia e encerra sua própria infraestrutura. A aplicação continua executando com Live Server/Python sem Node. Não publicar os relatórios de teste no produto.

## 6. Plano de verificação

1. Revisar configuração conforme fontes oficiais e validar sintaxe dos scripts.
2. Rodar o comando completo na máquina local, em perfil/porta isolados dos serviços já existentes.
3. Injetar uma exceção de inicialização em cópia temporária de frontend/scripts/tests e rodar --smoke-only: exigir saída não zero e evidência da falha. Não modificar a árvore funcional real nem o seed.
4. Conferir encerramento de processos e logs/capturas/resumo nos dois cenários.
5. Atualizar README/guia/declaração impessoal de IA e git diff --check.
6. Enviar branch e abrir PR; acompanhar primeira execução real do GitHub. Se houver restrição externa de Actions, registrar o bloqueio real e não afirmar que rodou remotamente.

## 7. Riscos e limites

Checks reduzem regressões cobertas pelos testes; não garantem ausência de todo defeito visual ou funcional. O perfil de teste bloqueia a resolução de Google Fonts e usa as fontes locais de fallback: uma indisponibilidade externa de fontes não pode impedir a inicialização dos módulos e gerar falso negativo. Os arquivos locais continuam sendo servidos sem transformação. A disponibilidade e aparência das fontes remotas ficam fora do check. O Chrome do runner pode receber atualizações; a execução real do PR validará o ambiente escolhido. Safari/Firefox e leitor de tela ficam fora desta tarefa. Não mudar orçamento/plano de Actions, regras de proteção, configurações do repositório ou Trello. Preservar as alterações locais anteriores fora do commit.

## 8. Evidências finais

- `node scripts/check-frontend.mjs`: aprovado localmente no modo completo. 13 arquivos JS com sintaxe válida, 37 testes de base/dados, 15 verificações novas de inicialização e 224 verificações de regressão existentes (239 de navegador no total).
- Servidor e Chrome iniciados pelo comando em portas livres, diferentes dos serviços pessoais já existentes. Perfil criado em pasta temporária e removido ao encerrar. O processo terminou com código zero e gravou summary.json/summary.md, environment.json, logs por etapa, logs de servidor/Chrome e 14 capturas.
- Prova negativa em cópia temporária: inserir `throw new Error('CI startup regression probe')` em app.js preservou a sintaxe válida e fez o smoke falhar com código 1. failure.json registra a exceção e failure.png foi criado antes de fechar a aba. O resumo marcou falha; chamadas HTTP posteriores confirmaram que servidor e Chrome daquela execução já estavam encerrados. Frontend real não foi alterado.
- O primeiro ensaio com perfil limpo expôs espera por Google Fonts. O perfil automatizado agora impede resolução dessas fontes remotas, sem modificar arquivos servidos, e a execução completa passou com fallback local. A disponibilidade das fontes externas permanece fora do check.
- YAML analisado localmente, com eventos, nome do check, permissões e upload em always() conferidos. git diff --check aprovado. Nenhuma dependência npm/build instalada ou adicionada.
- Resultado remoto: consultar **Frontend checks** e seus artefatos no PR desta branch. A execução inicial será acompanhada após abrir o PR; qualquer restrição externa será comunicada, sem presumir aprovação do runner apenas pelos testes locais.

Limites mantidos: Chrome/Linux e fallback local; não há validação completa de estética ou leitores de tela. A regra de proteção da main não foi alterada. FR-06 continua parcial e a revisão humana permanece obrigatória no fluxo do grupo. Arquivos locais anteriores preservados fora deste commit.
