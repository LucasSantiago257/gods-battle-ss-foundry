# Componentes assistidos — 0.15.0

Desde0.16.0, Brasas também possui acompanhamento periódico confirmado pelo mestre, em fluxo separado. Veja [efeitos com duração](efeitos-duracao.md); os quatro cálculos deste guia permanecem iguais.

Este primeiro grupo calcula quatro componentes de **técnicas personalizadas com primordial Dano** e composição salva no construtor. Não interpreta nomes escritos nos campos livres nem ativa efeitos de todas as técnicas do catálogo.

| Componente | Parte calculada | Conferência necessária |
|---|---|---|
| Esgotar · p.228 | Cada aumento escolhido acrescenta1ND e2CE ao custo desta ativação; atualiza dificuldade e pagamento. | Escolher a quantidade e conferir CE/queima de PV na prévia. |
| Essência Alvo · p.228 | +1ND quando confirmado na ativação. | Alvo marcado, Essência contrária conferida pelo jogador e notas opcionais. Não deduzir bondade/maldade de texto livre. |
| Terreno Favorável · p.230 | +1ND quando confirmado na ativação. | Ambiente especificado no parâmetro do componente no construtor e seleção do ambiente atual; notas opcionais. |
| Controle sobre o Espaço · pp.217–218 | +1,5/+3/+4,5m ao alcance base pelas graduações1/2/3. | Aquisição/graduação de Mestre, alcance base e distância na cena. Não mede geometria nem aplica penalidades automaticamente. |

## Como usar

1. Crie/conclua uma técnica personalizada com esses componentes, usando os Big Bangs/incrementos reais do compêndio. Para Terreno Favorável, informe o ambiente no campo **Parâmetro / escolha**.
2. Abra **Configurar** na técnica. Confira custo publicado/fixo, ND/Poder e alcance **base**, retirando dos parâmetros apenas bônus desses componentes que você já havia lançado manualmente, se necessário. Marque **Automatizar este grupo de componentes da composição salva** e salve a configuração.
3. Em **Ativar**, escolha os aumentos de Esgotar e confirme os contextos aplicáveis. Essência/Terreno não exigem justificativa; Essência exige um alvo marcado. A prévia calcula custo, dificuldade, dano normal/crítico e alcance.
4. Confira e confirme. O mestre recalcula a partir da cópia/composição salva, paga uma vez pela fila e publica as parcelas/referências no cartão. A rolagem de resistência e o dano continuam no fluxo existente.

Custo de slots e o +1Condensar por tipo de incremento já estão no custo fixo da composição; este grupo não os cobra novamente. A graduação de Espaço altera alcance, não multiplica a cobrança de Condensar. Somente a queima variável de Esgotar acrescenta CE nesta ativação. Não informe a mesma queima novamente em **CE adicional** ou **Elevar Cosmo**.

Esgotar soma ND antes do cálculo de dano. Essência/Terreno só entram quando conferidos; não são descobertos automaticamente. Sucesso crítico conserva o +1ND já implementado. O dano à armadura segue as faixas do fluxo existente após o ND final. Falha paga a CE autorizada e as ações do encontro, mas não causa dano/efeito; veja acoes.md e ativacoes.md.

## Preservação e limites

Opção inicialmente desligada, sem migração automática de fichas ou mudança dos parâmetros manuais. Desmarcar na configuração volta à aplicação manual; notas, IDs, recursos e histórico permanecem. Refazer a composição desliga a opção para uma nova conferência. Alterar composição/adesão durante prévia ou rolagem impede cobrar parâmetros novos sobre uma confirmação antiga.

Recuperar publicação usa o mesmo resultado e pagamento, sem repetir Esgotar, CE/PV ou ações. Registro mantém parâmetros/componentes/contexto sem copiar os dados privados de Roll para o Actor. Outros componentes são listados como manuais na ativação/cartão. A técnica pode conter esses componentes, mas este grupo não executa seus efeitos, estados ou testes de confirmação.

Primordiais mistos, Controle, Sustentada e Cosmo Residual continuam fora deste grupo. Não aplica duração/estado persistente, recuperação de CE, cura, movimentação de token, área, múltiplos alvos ou testes de chance. O uso de incrementos do personagem em todas as técnicas também exige conferência/aquisição; o construtor não concede Mestre. Não acrescentar componentes silenciosamente a cópias existentes.

## Cobertura e ambiguidades

Quatro componentes possuem cálculo assistido neste marco, entre59 entradas do pack de componentes (incluindo primordiais). Não significa que quatro poderes pessoais tenham sido automatizados; a matriz de358 entradas pessoais permanece separada.

Antes dos próximos grupos: Controle Atômico precisa esclarecer a relação entre cada0 e a tabela de graduação, além da CE extra por1; Controle sobre as Estrelas menciona perfurar defesas e bônus de PC, exigindo revisar resistência/dano; Guardar envolve tempo imóvel; Brasas/Dreno dependem de duração e cobrança recorrente; Movendo precisa representar movimento parcial/total sem presumir que sejam dois usos. Eles continuam manuais. Condições, confirmação percentual, sustentação e cura exigem operações/expiração próprias.

Fontes conferidas: pp.217–218,228,230 e regras gerais de composição/ativação. Autor: Dhoko de Libra. Atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). Testes locais e prévias não substituem validação em Foundry13.350 com mestre e jogadores.
