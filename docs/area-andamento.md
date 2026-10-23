# Andamento por alvo da área — 0.60.0

Novos cartões de técnicas em área mostram o nome de cada alvo original, seu estado e Resistir/Ajustar resistência para quem pode usá-los. O mestre acompanha todos os defensores; cada jogador acompanha os que possui. Outros participantes veem só os nomes já publicados no cartão. Cartões antigos conservam seu conteúdo salvo; faça uma nova ativação para usar o acompanhamento.

| Estado | Significado |
|---|---|
| Aguardando resistência | Não há resultado legível e coerente para este defensor. |
| Dano pendente | Há resistência publicada; o dano ainda não consta como aplicado no registro. |
| Aplicado / Desfeito | O journal existente do defensor registra a aplicação ou seu desfazimento. |
| Conferir aplicação | Há uma operação preparada/interrompida; use a recuperação já disponível. |
| Conferir resultado / registro | Os dados encontrados exigem conferência. |
| Alvo indisponível | A ficha não foi encontrada com a identidade esperada. |

O resultado individual continua com Aplicar, Ajustar e Desfazer. O dono aplica na própria ficha e o mestre em qualquer defensor autorizado, com a mesma coordenação automática e proteção contra duplicidade. Não há aplicação em lote, pedido visível ao mestre ou aprovação humana adicional. Repetir resistência continua possível; múltiplos resultados não são escolhidos automaticamente. Um registro aplicado descreve a aplicação existente, não confirma os valores de uma resistência posterior.

O acompanhamento lê resultados legíveis e o journal por raiz/defensor, sem gravar estado, PV, CE, reservas ou condições. Resultados precisam apontar para a raiz, alvo e payload originais, ter autor mestre/dono e valores coerentes. Resultados privados/cegos inacessíveis não contam. Outros jogadores não consultam flags privadas do defensor. Mudanças de mensagens, fichas, tokens e usuários atualizam os cartões; respostas assíncronas antigas, perda de permissão e substituição/exclusão de documentos não restauram ações antigas.

Área permanece com custo/rolagem únicos, resistência e aplicação individuais. Distância por alvo combinada com divisão do dano, geometria e interação com Movendo conservam os limites manuais de [técnicas em área](tecnicas-area.md). Dano físico comum à armadura continua manual. Cálculo do dano fica em detalhes recolhidos; valores e estados permanecem visíveis. Nenhuma regra ou condição nova foi acrescentada.

## Ensaio curto

1. Em um grupo de exercício novo, use Lyra com Asterismo3 e marque dois defensores de donos diferentes. Ative uma técnica de Dano em área. Confira custo único e lista original.
2. Cada dono deve ver Resistir/Ajustar apenas em seu defensor; o mestre vê ambos, um observador só os nomes. Resistir usa o PC do cartão; Ajustar permite modificadores e cancelar não rola.
3. Após a resistência, confira Dano pendente. Aplique pelo cartão individual: só esse defensor muda para Aplicado. Desfaça e confira Desfeito; o outro alvo conserva seu estado e recursos.
4. Em resultados privados/cegos, confira que somente leitores autorizados têm a pendência. Excluir o resultado restaura a espera se não houver outro resultado legível ou journal. Revogar propriedade remove estado e ações desse jogador.
5. Confira nome longo, teclado e janela estreita. Excluir um alvo não transfere ações à seleção atual ou a uma cópia. Cartão editado/excluído não deve continuar com ações antigas.

A suíte usa módulos reais com fichas publicadas vinculadas/sintéticas para ativação, resistência, pagamento e aplicação/desfazer. O ensaio Edge usa o template e callbacks reais de resistência, dois donos, mestre/observador, teclado e440px. Mudanças de journal na parte visual são simuladas e cruzadas com o ensaio de módulos. Esses ensaios isolados não validam o core hospedado13.350 nem concorrência entre conexões reais; ambos permanecem pendentes.
