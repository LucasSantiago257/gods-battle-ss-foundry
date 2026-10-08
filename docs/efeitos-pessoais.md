# Efeitos pessoais dos itens

Na Visão geral, Automatizar bônus conferidos habilita cálculos derivados. Revise bônus manuais antes de ativar em uma ficha existente. Nas cópias de habilidades/virtudes, Aplicar os efeitos conferidos permite desligar o benefício sem remover o item. Melhoria exige marcar sua ativação depois de conferir a ação necessária; custos, duração e uso por turno permanecem manuais.

Cada Item mostra sua cobertura e pendências. A aba Poderes explica as contribuições usadas ou suprimidas. Aquisição é permitida mesmo com requisitos pendentes; os efeitos ficam suspensos até corrigir a condição ou marcar Aceitar exceção. Nível de aquisição registra restrições que se aplicam somente no momento de escolher uma virtude.

Aumento de Atributo permite escolher dois pontos, inclusive no mesmo atributo. Esses pontos alteram a graduação efetiva e seus cálculos, conservando a graduação básica editável. Benefícios que precisam de opções adicionais não são aplicados silenciosamente.

As regras numéricas são dados revisados em module/book-rules.mjs, identificados pelas chaves estáveis do catálogo. Não há avaliação de código ou expressão fornecida pelo livro. Importar cópias preserva notas e origem. A automação é computada a cada preparação; nunca grava seu bônus por cima da base. Não são criados ActiveEffects duplicados.

Modificadores de testes do mesmo tipo não acumulam (p.379); o sistema mostra o maior benefício e a pior penalidade de cada grupo. Aquisições explicitamente repetíveis seguem a exceção da descrição. Bônus fixos e por nível da mesma entrada são somados. Gigante e sua habilidade natural compartilham a mesma identidade, evitando duplicação.

Cobertura inicial: 13 entradas automatizadas, 12 parcialmente automatizadas e 333 manuais entre as 358 virtudes/habilidades/dádivas. O inventário completo está em cobertura-automacao.md. Campos narrativos, combinações especiais, efeitos em terceiros e poderes avançados continuam no texto para aplicação manual. Esta classificação não declara automação integral do livro.

API: game.godsBattle.explainPassives(actor) retorna totais e memória de contribuições, sem modificar documentos.
