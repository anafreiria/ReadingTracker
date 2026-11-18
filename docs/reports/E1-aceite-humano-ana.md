# Entrega 1 — Aceite humano de Ana

## Versão e condições

- Responsável pelo aceite: Ana, conforme indicação na conversa de 18/11/2026.
- Código da main servido: `1b63d8cbbcbb825043bdcb1112f7ec6f3f8219c7`.
- Origem: exportação limpa de `origin/main`, sem arquivos locais não versionados.
- Comando: `python3 -m http.server 8096 --bind 127.0.0.1 --directory frontend`.
- Endereço do aceite: http://127.0.0.1:8096/.
- Navegador, versão, sistema e tamanho da janela do teste humano: não informados.
- Situação: interface aprovada por Ana, com relato de teste manual geral em 18/11/2026.

O frontend do PR de documentação `d1d5a328` é idêntico ao desta main. O PR ainda não estava integrado no início do aceite. O servidor foi iniciado pelo assistente; isso não comprova que Ana executou as instruções sozinha em cópia limpa.

## Aprovação e relato de teste manual

Ana informou que, para ela, está tudo certo e solicitou o registro de sua aprovação da interface e de teste manual de toda a aplicação. Fica registrada a aprovação geral da interface pela responsável pelo aceite, conforme seu relato.

Não foram fornecidos resultados individuais para cada cenário, capturas, dificuldades, versões dos navegadores ou dimensões de tela. Portanto, este registro não comprova separadamente execução em dois navegadores, aparelho físico, zoom de 200% ou todos os casos de erro e cancelamento. Não foram relatados problemas nesta aprovação.

## Verificação automatizada independente

O assistente executou `node scripts/check-frontend.mjs` em exportação limpa do commit `d1d5a328be224617a329344637a043d861ef5caf`, cujo frontend é idêntico ao da main acima: **485 verificações aprovadas, 13 módulos JavaScript com sintaxe válida e código de saída 0**. O check Frontend checks do GitHub também passou nesse commit. Essa execução é evidência automatizada, separada do relato humano.

A documentação contém também as [evidências versionadas de FR-QA-01](FR-QA-01-revisao.md) e os [logs fornecidos no PR de documentação](fr-doc-01/summary.md).

## Registros específicos ainda não fornecidos

- Cenários e resultados discriminados por navegador, com versões.
- Execução das instruções do README por Ana em cópia limpa, sem intervenção do assistente.

## Limites

Ana participou da implementação; seu aceite como responsável não substitui o cenário exploratório com pessoa que não implementou previsto no planejamento de QA. Esse cenário permanece pendente de evidência própria. Não declarar teste em aparelho físico ou navegador não utilizado.
