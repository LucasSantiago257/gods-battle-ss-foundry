# Cosmo Residual — preparação e resistência

Desde0.22.0, ficha do usuário → Combate → Efeitos com duração → Preparar Cosmo Residual · mestre. Este marco calcula e congela o segundo teste descrito nas pp.224–225. A ativação inicial e suas exigências específicas são resolvidas na mesa.

## Preparar

1. Crie uma técnica personalizada com primordial Cosmo Residual, conclua o rascunho; ou selecione Cosmo Residual em Configurar na cópia da técnica. Natureza precisa estar definida. Primordiais mistos exigem resolução específica e não entram neste fluxo. A ativação inicial dessa técnica continua manual; Ativar não duplica seu custo.
2. Registre na ficha alvo o efeito inicial por Controle ou anotação manual. Use dois cavaleiros distintos com um combatente por ficha no mesmo encontro aberto. O registro deve estar ativo durante a duração inicial; o turno seguinte à ativação também é admitido para duração de um turno. Se o registro contém origem de técnica, ela deve corresponder à técnica selecionada. Anotação sem origem recebe vínculo pela seleção concreta do mestre, sem dedução pelo nome.
3. No usuário, escolha técnica e efeito inicial. Informe a dificuldade final do segundo Asterismo, o Poder Cósmico final e, se necessário, bônus adicional. Notas são opcionais. A dificuldade começa vazia para não inventar a composição do exemplo do livro (13 = 9 + 4). PC sugerido vem da ficha; ajustes de técnica/ativação precisam entrar nesse campo final.
4. Rolar segundo Asterismo público cria um único resultado e registro na ficha do usuário. Uma preparação ativa por técnica/efeito inicial; uma tentativa por rodada coletiva, inclusive falha. Encerrar permite novo registro em rodada posterior se o efeito inicial ainda for válido. Retrocesso não repete resultados posteriores.

## Cálculo

Asterismo usa sua graduação (1–5 dados, um dado se sem treino), modificador da perícia, atributo da natureza da técnica ou associação explícita, bônus pessoal/efeitos, penalidade pendente e bônus informado. Condições assistidas ajustam dados/modificador uma vez. A rolagem usa a regra existente do maior d10, positivos por10 e negativos por1. Não soma nível ao Asterismo.

Sucesso exige resultado igual ou superior à dificuldade. Excesso = resultado − dificuldade; Residual = PC final + excesso. Exemplo do livro:22 −13 =9; PC41 +9 =50. A dificuldade fixa50 é preservada se nível, PC ou técnica mudarem depois. Igualdade no segundo Asterismo cria Residual sem excesso. Falha não cria Residual ativo. Falha abaixo da dificuldade−10 deixa penalidade−10 no próximo Asterismo; outros resultados limpam a penalidade pendente, seguindo o teste genérico existente. Registro e próxima penalidade são gravados juntos.

O alvo se liberta igualando ou superando o Residual. Desde0.23.0, [resistência assistida](resistencia-residual.md) usa dia da campanha e perfil cumulativo explícitos, com novas tentativas confirmadas após falha. Exigências específicas permanecem manuais. A p.225 combina “a cada novo teste” com “por dia”; nenhum contador automático por rodada/minutos reais ou interpretação silenciosa foi introduzido. O registro Residual não expira com o prazo inicial nem exige presença do usuário no encontro depois de criado; Encerrar Residual conserva o histórico e recursos.

## Custos, efeitos e recuperação

Este segundo teste não cobra novamente a ativação, não queima CE adicional e não representa depósito permanente. Na0.26.0, com controle de ações ativo no mesmo encontro, Ação de Cosmo + Movimento Parcial (p.224) registra um uso de Cosmo e uma parcela de movimento junto ao resultado e à penalidade. Movimento deve estar disponível; inclusive falha consome a parcela. Ataque/defesa e CE são conservados. Sem controle ativo, ações continuam conferidas na mesa. Não repetir esses registros pelos botões separados. Registros/diários antigos conservam o contrato anterior, sem cobranças retroativas. Rosa Diabólica/Pólen e outras técnicas com depósitos, preparo ou condições específicas exigem contrato próprio. Campo de bônus não cobra CE.

Somente o usuário recebe registro e próxima penalidade. Ficha alvo, anotação inicial, PV, armadura, CE/reserva/extra, ações e condições não são alterados. A ficha do alvo mantém a anotação histórica inicial; consulte o registro Residual no usuário para a continuidade e resistência. Não estenda a anotação inicial para simular dias; seus controles por rodada continuam próprios. Objetos, autouso, múltiplos alvos, exigências sem um efeito inicial registrado e execução por jogadores/privada continuam manuais.

O mestre responsável confirma fora da fila; gravações são serializadas e revalidam técnica, fichas, efeito inicial, rodada, permissões e recursos. Operação prepara um cartão privado do mestre, registra resultado/penalidade e publica o mesmo cartão explicitamente público. Nenhum resultado privado anterior é importado e nenhum botão/flag de dano é produzido.

Recuperar mesmo resultado não repete Roll/custo. Preparação incompleta com estado anterior é descartada; resultado completo anterior só é registrado se participantes, técnica, sistema e rodada conservarem o estado. Registro aplicado recupera somente publicação, preservando ajustes posteriores. Cópias, cartão/autoria alterados ou divergências conservam dados e podem encerrar apenas a pendência. Cartão privado órfão antes de salvarID não deve ser publicado manualmente. Fila do clienteGM não éCAS/transação do servidor. Foundry13.350 real ainda precisa de ensaio.

Fontes: livro V49.1.1 de Caio Carvalho Santiago, pp.224–225; [atribuição](../ATTRIBUTION.md), [auditoria](sustentacao-residual-auditoria.md). Sem PDF, imagens do livro ou dados pessoais no pacote.


## Recuperação do consumo de ações na0.26.0

Diário novo congela ações antes/depois e contexto do controle. Uma gravação aplica ações, resultado, próxima penalidade e status. Interrupção antes recupera o mesmo resultado e consumo somente se ações/contexto/fichas ainda coincidem; depois reconhece o resultado e republica sem novo consumo, mesmo após outra rodada. Estado divergente preserva ajustes e exige encerrar só a pendência. Legados sem actionRuleVersion2 conservam recuperação sem consumo novo. Confirmar no servidor13.350 com dois clientes antes de marcar compatibilidade verificada.
