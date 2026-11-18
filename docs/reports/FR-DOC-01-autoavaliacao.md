# FR-DOC-01 — Autoavaliação da Entrega 1

**Status:** autoavaliação revisada e aprovada pela equipe.
**Data da avaliação:** 18/11/2026.

## 1. Identificação da versão avaliada

- **Repositório:** ReadingTracker.
- **Branch:** `fr-doc-01`.
- **Commit candidato:** `4c186f8` — `docs: finaliza revisao documental da entrega 1`.
- **Execução:** `node scripts/check-frontend.mjs`.
- **Ambiente:** Linux, Node.js `v24.20.0`, Google Chrome `152.0.7977.82`.
- **Resultado:** execução completa, com 485 verificações aprovadas e nenhuma falha.
- **Estado do Git durante a execução:** branch sincronizada com `origin/fr-doc-01`, sem alterações locais.

## 2. Evidências automatizadas

Os logs e resumos da execução foram preservados em [`fr-doc-01/`](fr-doc-01/).

| Suíte | Resultado |
|---|---:|
| Sintaxe JavaScript | 13 módulos válidos |
| Data | 27 verificações |
| Foundation | 10 verificações |
| Smoke browser | 15 verificações |
| Accessibility | 85 verificações |
| Authors | 37 verificações |
| Books | 62 verificações |
| Mobile acceptance | 74 verificações |
| Readings | 51 verificações |
| Status | 124 verificações |
| **Total** | **485 aprovadas** |

Arquivos de referência:
- [Resumo legível](fr-doc-01/summary.md).
- [Resultado estruturado](fr-doc-01/summary.json).
- [Ambiente de execução](fr-doc-01/environment.json).

A execução automatizada não substitui a validação independente em cópia limpa por outro integrante.

## 3. Autoavaliação proposta

A rubrica oficial da Entrega 1 atribui 5,0 pontos ao frontend.

| Critério | Valor | Proposta | Justificativa resumida |
|---|---:|---:|---|
| FR-01 — Manage authors | 0,4 | 0,4 | CRUD, validações e bloqueio de exclusão de autor vinculado cobertos por testes. |
| FR-02 — Manage books | 0,5 | 0,5 | CRUD, seleção de autores/temas e regras de integridade cobertos por testes. |
| FR-03 — Manage readings | 0,5 | 0,5 | Criação, edição, exclusão, primeira leitura e histórico cobertos por testes. |
| FR-04 — Status workflow | 0,4 | 0,4 | Matriz de transições e persistência verificadas. |
| FR-05 — Reading log | 0,4 | 0,4 | Histórico, ordenação e apresentação de valores ausentes verificados. |
| FR-06 — Validation | 0,5 | 0,5 | Regras e mensagens de validação cobertas pelas suítes funcionais. |
| FR-07 — Seed data and reset | 0,3 | 0,3 | Seed oficial, persistência e restauração verificadas. |
| Code and interface quality | 1,0 | 1,0 | Organização modular, HTML semântico e verificações em diferentes larguras de tela. |
| README | 1,0 | 1,0 | Instruções de execução, checklist de requisitos e documentação revisados. |
| **Total acordado** | **5,0** | **5,0** | **Autoavaliação aprovada por toda a equipe.** |

## 4. Limitações e ressalvas

- Os testes de interface em larguras de 360, 390, 768 e 1280 pixels foram realizados em navegador, incluindo emulação; não representam testes em aparelhos físicos.
- Esta execução foi realizada localmente em Linux com Chrome.
- Não representa certificação WCAG nem validação com leitor de tela.
- Não foram realizados testes nesta execução em Safari/iOS ou Firefox.
- A execução local não substitui a validação independente em cópia limpa.
- A pontuação de 5,0/5,0 é a autoavaliação acordada pela equipe, não uma garantia da nota atribuída pelo professor.

## 5. Pendências para conclusão

- [ ] Outro integrante executa as instruções do README em cópia limpa do commit candidato e registra o resultado.
- [ ] Equipe confirma a visibilidade pública do repositório em sessão sem autenticação.
- [x] Equipe revisou e aprovou a autoavaliação e sua justificativa.
- [ ] Revisão final identifica o commit avaliado e registra as pendências restantes.

## 6. Revisão da equipe

- **Responsável pela elaboração:** Otávio de Oliveira.
- **Revisão:** concordância de toda a equipe do projeto.
- **Data da revisão:** 18/11/2026.
- **Resultado:** aprovada por toda a equipe.
- **Pontuação final acordada pela equipe:** 5,0/5,0.

A pontuação final de 5,0/5,0 foi revisada e acordada por toda a equipe. Ela representa a autoavaliação do grupo, não uma garantia da nota atribuída pelo professor.
