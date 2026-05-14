# TODO — Digitalização do PDF da Gigi

Itens encontrados durante a transcrição de `docs/lista-bdsm-pastel-2.pdf` que precisam de confirmação ou decisão. Idealmente revisar visualmente com a Gigi antes de considerar as respostas dela como definitivas.

## Marcações ambíguas ou conflitantes

### 1. Bondage → "Mental"
- **No PDF**: linha existe na tabela, mas **nenhuma coluna marcada**.
- **Tratamento atual**: pergunta criada em `QUESTIONNAIRE`, mas **sem resposta** da Gigi em `GIGI_ANSWERS`. Vai aparecer como "não respondido".
- **Ação**: pedir à Gigi para preencher.

### 2. Fetiches → "Médico"
- **No PDF**: marcado **simultaneamente em "Limite Rígido" e em "Amar"** — conflito direto.
- **Decisão registrada**: tratar como `limite_rigido` (mais conservador, respeita o consentimento se foi marcado como limite).
- **Ação**: confirmar com a Gigi qual era a intenção real.

### 3. Sadismo & Masoquismo → "Marca"
- **No PDF**: marcação na coluna "Aproveitar" foi feita com a letra **"z"** em vez de "x".
- **Decisão registrada**: tratar como `aproveitar` (assumindo erro de digitação).
- **Ação**: confirmar.

### 4. Sadismo & Masoquismo → "Ventosaterapia / Sucção"
- **No PDF**: marcação na coluna "Aproveitar" foi feita com a letra **"c"** em vez de "x".
- **Decisão registrada**: tratar como `aproveitar` (assumindo erro de digitação).
- **Ação**: confirmar.

## Campos de cabeçalho não preenchidos no PDF

### 5. Cabeçalho → "Limitação física/mental"
- **No PDF**: contém o texto `Ex: Joelho ruim, problemas de abandono` — formato típico de placeholder de template (começa com "Ex:").
- **Tratamento atual**: salvo como `null` em `GIGI_PROFILE.limitations`.
- **Ação**: pedir à Gigi para preencher se for o caso, ou confirmar que está vazio mesmo.

### 6. Cabeçalho → "Nível"
- **No PDF**: campo vazio.
- **Tratamento atual**: não há coluna correspondente no modelo `User`. Ignorado.
- **Ação**: definir o que significa este campo, ou descartar de vez.

### 7. Cabeçalho → "Data"
- **No PDF**: campo vazio.
- **Tratamento atual**: não há coluna correspondente no modelo `User`. Ignorado (a data fica registrada por `createdAt`).

## Categoria estrutural sem itens

### 8. Categoria "Notas Adicionais"
- **No PDF**: existe como uma seção mas tem apenas linhas em branco — sem atividades específicas.
- **Tratamento atual**: listada em `CATEGORIES` para preservar a estrutura, mas **nenhuma `Question` é criada** sob ela (não há atividade para perguntar).
- **Ação possível (futura)**: transformar em campo de texto livre por usuário, ou remover da lista de categorias.

## Limitação geral

A transcrição inicial foi feita lendo o PDF programaticamente. Em uma lista de ~250 itens, marcações próximas à borda entre duas colunas podem ter sido interpretadas incorretamente. **Recomendação forte**: pedir à Gigi para revisar a página `/questionario/gigi` quando estiver pronta e marcar qualquer item que ela queira corrigir.
