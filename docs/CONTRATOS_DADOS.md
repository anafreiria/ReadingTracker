# Contratos da camada de dados — Entrega 1

Implementados em `frontend/js/store.js` e verificados com o seed oficial. Todos os exports do store são async: usar await. As páginas não acessam localStorage ou fetch de dados.

## Leitura

| Método | Retorno |
|---|---|
| getLibrary() | As cinco coleções na forma do seed |
| getAuthors(), getBooks(), getReadings(), getThemes(), getCountries() | Array de registros |
| getAuthor(id), getBook(id), getReading(id) | Um registro; 404 se não existir |
| getBookReadings(bookId) | Leituras do livro; 404 se o livro não existir |

IDs devem ser números inteiros positivos. Leituras e retornos de gravação são cópias independentes; alterar o objeto retornado não salva nada. Países são somente leitura.

## Escrita

| Método | Retorno e comportamento |
|---|---|
| saveAuthor(author) | Autor salvo; sem id cria, com id atualiza |
| saveBook(book) | Livro salvo; mesmo contrato |
| saveReading(reading, options?) | Leitura salva; mesmo contrato e regras de transição abaixo |
| saveTheme({name}) | Novo tema; não há edição de tema nesta etapa |
| saveBookWithReading(book, readingOrNull = null) | `{book, reading}`; cria ambos em uma gravação, ou somente livro se leitura for null |
| deleteAuthor(id) | Sem retorno; 409 se houver livros vinculados, citando seus títulos |
| deleteBook(id) | `{deletedReadings}`; exclui livro e todas as suas leituras numa gravação |
| deleteReading(id) | Sem retorno |
| resetData() | Seed restaurado; confirmação deve ocorrer na UI antes da chamada |

Atualizações podem enviar somente id e campos alterados. Campos omitidos são preservados. Para apagar um campo opcional, enviar null; arrays vazios removem seleções. Criação usa null e arrays vazios para opcionais omitidos. Strings de texto são aparadas. Não há conversão implícita de números: o formulário deve converter valores numéricos de inputs/selects antes de chamar o store. Ano inválido não deve ser convertido em null para esconder o erro.

Use `Number(input.value)` para um input numérico preenchido e válido; vazio vira null. Para multiselect, mapear as opções selecionadas para IDs numéricos. Verificar o validity do input antes da conversão: entradas inválidas podem resultar em NaN ou valor vazio. As regras de domínio também são reforçadas pelo store.

Em saveBookWithReading, ambos os objetos devem estar sem id. O bookId da leitura é atribuído ao livro recém-criado. Se qualquer validação ou gravação falhar, nenhum dos dois é adicionado. Novos IDs vêm do maior ID atual da coleção mais um; não usar índices ou tamanho do array.

```js
const {book, reading} = await saveBookWithReading(
  {title: 'My next book', authorIds: [], themeIds: []},
  {status: 'Want to read', priority: 'High', recommendedBy: 'A friend'},
);
// reading.bookId === book.id
```

Este método garante uma transação no armazenamento local. O contrato equivalente da API para criação conjunta deve ser combinado com o backend antes da Entrega 2.

## Validação e erros

Validadores puros em `validation.js`: `validateAuthor`, `validateBook`, `validateReading` e `validateTheme`, cada um recebendo `(input, library)` e retornando um registro normalizado ou lançando StoreError. `validateLibrary` verifica todo o conjunto. Podem ser usados antes do store para antecipar feedback; a checagem no store continua obrigatória.

- 400: entrada inválida, com lista errors de field/message.
- 404: registro ausente, errors vazio.
- 409: nome duplicado, autor vinculado, confirmação de limpeza ausente ou edição em outra aba; errors vazio.
- 500: falha ao carregar ou persistir; dados anteriores preservados.

```js
try {
  await saveAuthor(values);
} catch (error) {
  showFieldErrors(form, error.errors);
  // Exibir também error.message em mensagem do formulário. Conflitos podem ter errors vazio.
}
```

`StoreError.toJSON()` produz `{status, message, errors}`. Regras: nomes únicos sem diferenciar caixa, datas reais e ordenadas, ano de publicação não futuro nem zero, referências existentes, seleções sem duplicatas, valores controlados, ano lido compatível, nota de 0 a 10 em passo 0,5 e prioridade somente na wishlist. Alterar publicação não pode invalidar anos das leituras existentes. Datas opcionais permanecem null; falecimento sem nascimento informado é permitido pelo enunciado, que não exige os dois juntos.

## Transição de status e releitura

`prepareReadingTransition(reading, nextStatus)` é uma função pura em validation.js; retorna `{reading, clearedFields}`. Preserva notas/recomendação, limpa prioridade fora de Want to read e prepara a remoção de ano/nota quando incompatíveis.

```js
const transition = prepareReadingTransition(currentReading, nextStatus);
if (transition.clearedFields.length) {
  const confirmed = await confirmAction({
    title: strings.statusChangeTitle,
    message: strings.statusChangeMessage,
    confirmLabel: strings.confirm,
  });
  if (!confirmed) return;
}
await saveReading(transition.reading, {
  confirmFieldClear: transition.clearedFields.length > 0,
});
```

As strings desse exemplo devem ser definidas pela tarefa da tela em strings.js; os nomes acima ilustram a mensagem, não são exports existentes. A confirmação deve dizer quais informações serão removidas. O store exige confirmação mesmo se o chamador já enviou null nos campos antigos. Passar confirmFieldClear só após autorização do usuário; o store não abre diálogos. Mudar para Read continua exigindo yearRead; a tela deve pedir esse ano antes de salvar. Para releitura, omitir id e criar outra leitura; não reutilizar o registro antigo.

## Exclusão e restauração

A UI deve confirmar exclusões. Antes de deleteBook, consultar as leituras e informar a quantidade afetada. Cancelar significa não chamar o método. Não atualizar a listagem com sucesso até a operação terminar. O botão Reset data já usa esse padrão, incluindo foco em Cancel, fechamento com Escape, mensagens e bloqueio durante a operação.

Reset baixa e valida o seed antes de substituir uma única chave: `reading-tracker:data:v1`. Não usa clear() nem apaga primeiro para só depois buscar dados. Falhas de rede, JSON, domínio ou quota deixam o valor anterior intacto. As próximas visitas nunca reimportam o seed por conta própria. O arquivo fonte permanece inalterado.

## Concorrência e abas

A fila do store serializa operações da mesma aba, evitando IDs repetidos e perda de gravações concorrentes. Cada operação relê o armazenamento, sem manter uma cópia gravável antiga em memória.

Em navegadores com Web Locks, a primeira aba que precisa gravar mantém um bloqueio nativo de edição até fechar ou recarregar. Outra aba pode consultar, mas tentativas de escrita retornam 409 com orientação para fechar a aba que estava editando e recarregar antes de tentar novamente. As listagens também acompanham o evento storage. Se um diálogo estiver aberto, a atualização é adiada até seu fechamento, preservando os campos exibidos. A carga inicial do seed pode adquirir o bloqueio, pois é uma gravação.

Não prometer edição simultânea em várias abas: localStorage não oferece uma transação entre elas. Sem suporte a Web Locks, a fila protege somente a mesma aba; usar uma única aba para editar. Alterações diretas pelo console ou por outros códigos que não usam o store não são cobertas pelo bloqueio. Na Entrega 2, a coordenação será responsabilidade do backend.
