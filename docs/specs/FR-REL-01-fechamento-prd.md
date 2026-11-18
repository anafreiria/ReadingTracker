# FR-REL-01 — Fechamento da Entrega 1

## Problema e escopo

O commit final `55b31a6` falhou no Actions porque o runner não encontrou Chrome. Os 37 testes de dados/fundação passaram, mas as suítes de navegador não chegaram a executar. A preparação do navegador precisa ser explícita para que o check não dependa da imagem do runner.

Este fechamento instala Chrome apenas no CI, executa a suíte existente sem reduzir critérios e registra as evidências da publicação. Não muda o frontend nem seus requisitos de execução.

## Critérios de aceite

- O workflow prepara Chrome e passa o caminho absoluto em CHROME_BIN.
- O PR e a main executam a suíte completa com resultado verde.
- O produto e o seed permanecem idênticos à versão já avaliada.
- A tag delivery-1 aponta para o commit final verificado; registrar SHA anterior e novo ao atualizar a tag antes da submissão.
- Repositório, README e seed acessíveis sem login.
- Autoavaliação 5,0/5,0 e uso de IA/SDD mantidos; registrar limites de aceite sem inventar testes humanos.
- Ana é responsável pela conferência do comprovante, por indicação expressa na conversa; essa designação substitui, para esta entrega, a previsão de segundo integrante no cartão de publicação. A conferência só é concluída após sua resposta.
- Preparar envio ao professor com todos os colegas em cópia; enviar somente com destinatários confirmados e registrar o comprovante.

## Verificação

O próprio Actions é a validação da mudança no workflow. Conferir logs de instalação, versão/caminho do Chrome e resultados de todas as suítes no PR e no commit de merge. Não mascarar falhas com continue-on-error nem ignorar suítes.

## Limites humanos

A aprovação geral de Ana já foi registrada. Não há evidência detalhada suficiente para fechar os itens de dois navegadores, exploração por pessoa que não implementou e execução independente por outro integrante. Esses itens são critérios internos adicionais; devem permanecer pendentes ou receber dispensa explícita da responsável, sem alterar o que foi efetivamente testado.

## Fonte e IA

Configuração conforme https://github.com/browser-actions/setup-chrome (saída chrome-path). Codex apoiou o diagnóstico, a alteração de CI e a documentação deste fechamento; a aplicação e o seed não são alterados.
