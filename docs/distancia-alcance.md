# Distância e alcance — 0.37.0

Ativar uma técnica com um alvo marcado mostra uma medida informativa. Atualizar medida refaz a consulta após mover tokens; editar parâmetros também atualiza. A medida não muda custo, dano, dificuldade, reserva de ações ou o alvo original da ativação, e não fica registrada como prova no cartão.

Convenção desta interface: distância entre centros dos tokens pelo caminho direto medido pela grade da cena, incluindo sua regra de diagonais. Exige cena pronta, tokens visíveis na mesma cena, escala positiva e unidade m/metros (também nomes em inglês). Apenas mesma elevação; diferenças pedem conferência manual. Não mede bordas, paredes, cobertura, linha de visão, áreas ou rotas desviando obstáculos. É uma convenção de representação, não uma regra adicional do livro.

A origem é o único token visível selecionado da ficha que ativa. Sem seleção dessa ficha, usa o único token visível dela na cena. Com várias instâncias, selecione somente a desejada. Fichas sintéticas são distinguidas por UUID. O alvo é o token marcado ao abrir a janela, mesmo se a seleção de alvos mudar depois. Token removido, oculto ou em outra cena torna a medida indisponível. Nenhuma indisponibilidade impede o fluxo manual de ativação.

Compara a distância ao alcance efetivo configurado, incluindo Controle sobre o Espaço quando automatizado. Alcance zero não presume classe nem significa alcance ilimitado: a interface pede configurar. O livro p.204 define alcance de Bronze3m, Prata4,5m, Ouro6m e redução por distância excedente em faixas de1,5m. Essas reduções continuam manuais; esta entrega não altera ND/PC nem automatiza áreas. Texto e atribuição do livro permanecem nos compêndios; nenhum trecho ou imagem do PDF foi incluído aqui.

API consultada: [BaseGrid.measurePath v13](https://foundryvtt.com/api/v13/classes/foundry.grid.BaseGrid.html), resultado distance em unidades da cena: [GridMeasurePathResult](https://foundryvtt.com/api/v13/interfaces/foundry.grid.types.GridMeasurePathResult.html). O dado é somente uma prévia local, sem confiança mecânica pelo mestre. Antes de automatizar penalidades, congelar e revalidar geometria/origem/alvo e aplicar a redução uma vez na fila central, incluindo recuperação. Áreas e múltiplos alvos precisarão contrato próprio.

Validar em Foundry13.350: token vinculado/sintético, várias instâncias, seleção de origem, grade quadrada/hexagonal/sem grade, diagonais, metros/unidade diferente, elevação, token oculto/removido e movimento seguido de Atualizar medida. Testes locais com dublês não substituem essa validação.
