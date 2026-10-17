# Distância e alcance — 0.39.0

Ativar uma técnica com um alvo marcado mostra uma medida informativa. Atualizar medida refaz a consulta após mover tokens; editar parâmetros também atualiza. Sem a opção de redução de ND descrita abaixo, a medida é apenas informativa e não muda custo, dano, dificuldade, reserva de ações ou o alvo original da ativação.

Convenção desta interface: distância entre centros dos tokens pelo caminho direto medido pela grade da cena, incluindo sua regra de diagonais. Exige cena pronta, tokens visíveis na mesma cena, escala positiva e unidade m/metros (também nomes em inglês). Apenas mesma elevação; diferenças pedem conferência manual. Não mede bordas, paredes, cobertura, linha de visão, áreas ou rotas desviando obstáculos. É uma convenção de representação, não uma regra adicional do livro.

A origem é o único token visível selecionado da ficha que ativa. Sem seleção dessa ficha, usa o único token visível dela na cena. Com várias instâncias, selecione somente a desejada. Fichas sintéticas são distinguidas por UUID. O alvo é o token marcado ao abrir a janela, mesmo se a seleção de alvos mudar depois. Token removido, oculto ou em outra cena torna a medida indisponível. Nenhuma indisponibilidade impede o fluxo manual de ativação.

Compara a distância ao alcance efetivo configurado, incluindo Controle sobre o Espaço quando automatizado. Alcance zero não presume classe nem significa alcance ilimitado: a interface pede configurar. O livro p.204 define alcance de Bronze3m, Prata4,5m, Ouro6m e redução por distância excedente em faixas de1,5m. Na prévia informativa, reduções são manuais. O grupo de Dano da 0.38.0 é descrito abaixo; PC recebe o grupo da 0.39.0 descrito abaixo; áreas continuam manuais. Texto e atribuição do livro permanecem nos compêndios; nenhum trecho ou imagem do PDF foi incluído aqui.

API consultada: [BaseGrid.measurePath v13](https://foundryvtt.com/api/v13/classes/foundry.grid.BaseGrid.html), resultado distance em unidades da cena: [GridMeasurePathResult](https://foundryvtt.com/api/v13/interfaces/foundry.grid.types.GridMeasurePathResult.html). A prévia informativa é local. A opção de Dano da 0.38.0 congela e revalida a geometria na fila, como descrito abaixo. Áreas e múltiplos alvos precisarão contrato próprio.

Validar em Foundry13.350: token vinculado/sintético, várias instâncias, seleção de origem, grade quadrada/hexagonal/sem grade, diagonais, metros/unidade diferente, elevação, token oculto/removido e movimento seguido de Atualizar medida. Testes locais com dublês não substituem essa validação.


## Redução de ND por distância — 0.38.0

Na ativação, **Calcular redução de ND por distância · Dano** inclui uma redução por cada faixa iniciada de 1,5 m além do alcance configurado (p.204). É um parâmetro da ativação; fica desligado por padrão para preservar cópias e ajustes anteriores. Não some novamente a mesma redução em outros ajustes manuais. O ND final, dano normal/crítico e transição das faixas de dano à armadura usam o valor reduzido; custo, dificuldade de Asterismo e PC não recebem essa redução em técnicas de Dano.

A prévia mostra a medida e os valores resultantes. Atualizar medida ou editar parâmetros recalcula a consulta; confirmar envia a geometria dessa prévia. O mestre recomputa distância com Scene.grid e TokenDocument.getCenterPoint, mesmo sem visualizar a cena, e confere origem/alvo, permissão, posições, dimensões, elevação, ocultação e configuração da grade após operações assíncronas, antes de gastar. Mudanças exigem uma nova prévia; nunca cobra silenciosamente um resultado recalculado. Token removido, actor trocado, cena removida ou permissão perdida recusam a medida automática.

O resultado é congelado no mesmo cartão e na recuperação; mover tokens após um pagamento registrado não cobra, mede ou rola outra vez. Coordenadas ficam na solicitação privada durante o processamento e não são copiadas para o histórico do Actor ou cartão final. O cartão apresenta somente distância, alcance e redução numérica.

Limites deste grupo: um alvo, mesma elevação, unidade em metros, alcance positivo e primordial Dano. Na 0.38.0, Controle/Sustentada ainda eram manuais; o grupo da 0.39.0 é descrito abaixo. Distância tridimensional continua manual. Se a redução deixaria o ND normal abaixo de 1, a opção automática pede resolução manual: não inventa piso, dano a ND zero ou anulação de técnica sem conferir as exceções. Tolerância de 1e-8 m remove apenas ruído numérico nas fronteiras de faixas. Paredes, cobertura, áreas e múltiplos alvos continuam manuais.

API adicional: [Scene.grid v13](https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html), [TokenDocument.getCenterPoint v13](https://foundryvtt.com/api/v13/classes/foundry.documents.TokenDocument.html). Implementação não exige que o mestre troque sua cena visualizada. Sem validação no servidor hospedado; testar com dois clientes e movimento concorrente antes de registrar compatibilidade verificada.


## PC de Controle/Sustentada — 0.39.0

A opção agora se chama **Calcular redução por distância · ND ou PC**. A mesma medição de um alvo pode reduzir o modificador positivo de PC em Controle ou Sustentada, por faixa iniciada de 1,5 m além do alcance (p.204). O resultado e a prévia indicam PC; Dano continua indicando ND. Custo e dificuldade de Asterismo não são reduzidos; Controle conserva sua duração base, e esses efeitos não recebem dano genérico.

Fontes conferidas: p.203, Elevar em Controle/Sustentada acrescenta PC; p.204, distância reduz o modificador positivo; p.206, PC é 10 + Modificador de Nível + modificadores positivos/negativos. Na ficha atual, a parcela além de 10 + Modificador de Nível reúne bônus de cada dez níveis, ajustes manuais de PC e Elevar desta ativação. Ajustes negativos entram no saldo dessa parcela; não são ignorados para fabricar bônus disponível.

Limite deliberado da automação: a redução só é executada se couber na parcela positiva disponível. Pode esgotá-la exatamente até 10 + Modificador de Nível. Se a exceder, pede resolução manual ou ajuste de Elevar, sem cobrar. Isso não declara que o livro impõe um piso universal de PC: a passagem de distância não esclarece explicitamente se ultrapassar essa parcela passa a produzir modificador negativo ou enfraquece outra parte da fórmula. Esse caso permanece manual, sem decidir pela mesa. Um PC já abaixo dessa base continua intacto quando não há distância excedente.

São preservados snapshot, origem/alvo, permissões, privacidade, validação de geometria antes de pagar e recuperação da 0.38.0. O cartão congela o PC reduzido usado na resistência; a resistência não subtrai a distância novamente. Recuperar resultado pago conserva esse PC mesmo após movimento dos tokens. PC-base do Actor, ajustes permanentes, regras de oposição/recarga e condições não são alterados. Alcance de componentes não suportados por Controle/Sustentada continua sendo configurado manualmente na cópia.

Próximos contratos: áreas e múltiplos alvos, com custo único e resolução por alvo; exceções de ND zero/negativo e de redução além da parcela positiva exigem conferência adicional. Core/servidor Foundry13.350 ainda não validado.
