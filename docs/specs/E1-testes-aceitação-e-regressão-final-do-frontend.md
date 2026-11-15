# PRD — FR-QA-01: Testes de aceitação e regressão final do frontend

Responsável: Otávio de Oliveira. Revisão: aguardando revisão de outro integrante da equipe. Branch: `fr-qa-01`. Pull Request: aberto no GitHub, aguardando revisão e aprovação.

## Objetivo

Executar os testes de aceitação e regressão final do frontend do ReadingTracker, verificando os fluxos principais da aplicação, a integridade dos dados, a persistência, a acessibilidade, a responsividade e o comportamento diante de falhas.

A revisão busca identificar problemas funcionais e limitações do ambiente de testes, reaproveitando a suíte automatizada existente e complementando-a com testes manuais exploratórios.

## Escopo

- Executar a suíte automatizada de verificação do frontend.
- Testar os fluxos de cadastro, edição e exclusão de autores, livros e leituras.
- Verificar associações entre livros, autores e temas.
- Verificar releituras, histórico e transições entre status.
- Testar confirmações de exclusão e restauração da biblioteca.
- Verificar persistência após recarregar a página e reabrir o navegador.
- Testar falhas de armazenamento, carregamento da seed e concorrência entre abas.
- Verificar responsividade em 360px, 390px, 768px e 1280px.
- Verificar navegação por teclado, foco visível e zoom de 200%.
- Executar testes manuais nos navegadores disponíveis.
- Investigar comportamentos inesperados e registrar pendências para revisão da equipe.

Não inclui implementação de backend.

## Critérios de aceite

- [x] Suíte automatizada de regressão executada com sucesso.
- [x] Fluxos de autores verificados.
- [x] Fluxos de livros verificados.
- [x] Fluxos de leituras e releituras verificados.
- [x] Transições de status e limpeza de campos incompatíveis verificadas.
- [x] Confirmações de exclusão e restauração verificadas.
- [x] Persistência após recarga e reabertura do navegador verificada.
- [x] Tratamento de falhas de armazenamento e carregamento verificado pela suíte automatizada.
- [x] Concorrência entre duas abas verificada.
- [x] Validação estrutural de coleções incompletas da seed verificada.
- [x] Responsividade verificada em 360px, 390px, 768px e 1280px.
- [x] Navegação por teclado, foco visível e zoom de 200% verificados.
- [x] Testes manuais realizados no Chrome e no Edge.
- [ ] Investigação do cadastro de livros com títulos duplicados concluída e resultado validado pela equipe.
- [x] Teste exploratório realizado por uma pessoa que não participou da implementação.
- [x] Versões dos navegadores registradas.
- [x] Relatório versionado na branch `fr-qa-01` e disponibilizado para revisão no GitHub por meio de Pull Request.

## Organização e decisões

A validação foi realizada sem alterar o escopo funcional do projeto. Foram utilizados os módulos, contratos e mecanismos de persistência existentes.

Os testes manuais foram complementados pela suíte automatizada, com atenção especial à integridade dos dados e à recuperação após falhas.

A releitura de um livro é representada por um novo registro de leitura associado ao mesmo livro. O cadastro de dois livros independentes com o mesmo título foi observado durante os testes e ficou encaminhado para investigação pela equipe. Esse comportamento não foi classificado como defeito confirmado neste relatório.

A verificação da seed considerou as cinco coleções obrigatórias: `countries`, `authors`, `themes`, `books` e `readings`. Coleções ausentes ou nulas foram rejeitadas. Uma coleção vazia foi aceita quando os relacionamentos permaneceram consistentes, conforme esperado pela validação estrutural.

## Evidências e testes

### Verificações realizadas

- Cadastro, edição e exclusão de autores.
- Bloqueio da exclusão de autor associado a livros.
- Rejeição de nomes duplicados de autores, sem distinção entre maiúsculas e minúsculas.
- Validação de datas de nascimento e falecimento.
- Cadastro de livros com campos mínimos e com informações completas.
- Cadastro de temas durante o preenchimento do formulário de livro.
- Edição de livro sem perda dos registros de leitura associados.
- Validação de ano de publicação, incluindo ano zero e ano futuro.
- Cadastro, edição e exclusão de leituras.
- Criação de releituras sem apagar o histórico anterior.
- Criação de livro e primeira leitura na mesma operação.
- Confirmações de exclusão de leituras e livros.
- Ordenação do histórico por ano, data, nota, título e status.
- Verificação do desempate da ordenação por ID.
- Alteração de status e remoção de prioridade.
- Confirmação e cancelamento de operações que limpam campos incompatíveis com o status.
- Persistência após recarregar a página e reabrir o navegador.
- Cancelamento e confirmação da restauração da biblioteca original.
- Recuperação após conflito de edição entre duas abas.
- Verificação de coleções ausentes, nulas e vazias na estrutura da seed.

### Testes automatizados

O script `scripts/check-frontend.mjs` foi utilizado como verificação reproduzível da regressão.

| **Suíte** | **Verificações** |
| --- | ---: |
| Data | 27 |
| Foundation | 10 |
| Smoke browser | 15 |
| Accessibility browser | 85 |
| Authors browser | 35 |
| Books browser | 62 |
| Mobile acceptance browser | 74 |
| Readings browser | 51 |
| Status browser | 124 |
| **Total** | **483** |

Resultado em 14/11/2026: todas as 483 verificações automatizadas aprovadas. Também foram aprovadas 13 verificações de sintaxe dos módulos JavaScript.

As suítes de navegador não reportaram exceções não tratadas durante a execução.

Os logs locais da execução estão em:

`C:\Users\Otavio\AppData\Local\Temp\reading-tracker-check-CI1AMs`

Os arquivos são temporários e não devem ser tratados como evidências versionadas no repositório.

### Matriz dos critérios do cartão

| **Critério** | **Implementação e evidência** |
| --- | --- |
| Fluxos de autores | Testes manuais de cadastro, edição, exclusão, duplicidade e validação de datas; suíte `authors.browser.test.mjs`. |
| Fluxos de livros | Testes de cadastro, edição, associações, ano de publicação e persistência; suíte `books.browser.test.mjs`. |
| Leituras e releituras | Criação, edição, exclusão e múltiplos registros de leitura para o mesmo livro; suíte `readings.browser.test.mjs`. |
| Transições de status | Testes de prioridade, ano de leitura, nota, confirmação e cancelamento; suíte `status.browser.test.mjs`. |
| Histórico | Ordenação por ano, data, nota, título e status, incluindo desempate por ID. |
| Exclusões e restauração | Confirmação e cancelamento de exclusões; cancelamento e execução de reset da biblioteca. |
| Persistência e recuperação | Testes automatizados de falhas de armazenamento, seed, quota e concorrência; verificações manuais após recarga e reabertura. |
| Responsividade | Testes manuais em 360px, 390px, 768px e 1280px; suíte `mobile-acceptance.browser.test.mjs`. |
| Acessibilidade | Navegação por teclado, foco visível e zoom de 200%; suíte `accessibility.browser.test.mjs`. |
| Seed incompleta | `assertLibrary` rejeitou coleções ausentes e nulas; coleção vazia foi aceita quando não havia referências inválidas. |
| Títulos duplicados | Dois livros com o mesmo título foram aceitos durante a exploração. Investigação encaminhada à equipe; resultado ainda não classificado como defeito confirmado. |
| Teste por pessoa não desenvolvedora | Teste exploratório realizado pela irmã do responsável, sem participação na implementação. A usuária conseguiu utilizar o sistema e concluir as tarefas propostas. |

### Verificação responsiva e acessibilidade

Foram examinadas as larguras de viewport de 360px, 390px, 768px e 1280px. A interface permaneceu utilizável durante a navegação e as operações manuais realizadas.

Também foram verificados:

- Navegação por teclado com foco visível.
- Acionamento de botões com Enter.
- Uso da interface com zoom de 200%.
- Ausência de problemas impeditivos de utilização nas larguras testadas.

Esses resultados correspondem a testes em navegador e emulação de viewport. Não comprovam execução em dispositivos físicos, Safari/iOS, teclado virtual ou gestos reais.

### Ambiente de testes

Sistema utilizado: Windows.

| **Navegador** | **Versão** |
| --- | --- |
| Google Chrome | 157.0.8103.52 |
| Microsoft Edge | 157.0.4341.46 |

Os testes manuais foram realizados nos dois navegadores. Firefox não foi testado porque não estava instalado no ambiente.

### Limitações e pendências

- A investigação sobre a aceitação de títulos duplicados foi encaminhada para outra pessoa da equipe e ainda aguarda conclusão.
- Firefox não foi testado por indisponibilidade no ambiente.
- Não foram realizados testes em dispositivos móveis físicos.
- Os logs automatizados permanecem em diretório temporário local; não estão versionados no repositório.
- O Pull Request está aberto e aguarda revisão e aprovação de outro integrante da equipe.

## Próximas tarefas

- Aguardar a revisão do Pull Request por outro integrante da equipe.
- Concluir a investigação sobre a aceitação de títulos duplicados e registrar a conclusão após validação da equipe.
- Incorporar eventuais correções solicitadas durante a revisão.
- Após aprovação, integrar o Pull Request à branch `main`.

A branch `fr-qa-01` já foi publicada no GitHub e o Pull Request está aberto. A integração na branch `main` permanece pendente de revisão e aprovação.