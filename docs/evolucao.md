# Evolução assistida — subir de nível

O botão **Subir de nível · evolução assistida** abre um rascunho na própria ficha. O assistente avança um nível por vez, do nível 1 até o 30. Conclua a criação primeiro; fichas antigas e as fichas de teste continuam disponíveis na edição normal. Use o ator do mundo, na aba Atores, para evoluir.

## Planejar e confirmar

1. Antes de abrir o rascunho, confira XP, estilo, especialização, atributos, perícias e recursos atuais. Alterações na ficha durante o planejamento exigem descartar e recomeçar; editar apenas as escolhas do rascunho mantém o progresso.
2. Escolha habilidade/dádiva, especialização no nível 5 ou Melhoria pelo compêndio. A seleção usa estilo, nível disponível e tipo de poder. Especializações extras Protetor, Assassino e Telecinético usam suas dádivas posteriores. Leia a referência que se abre e confirme requisitos/escolhas.
3. Distribua graduações de atributos, perícias e luta nas áreas expansíveis. Os campos representam **acréscimos**, não os valores finais. Pontos não gastos ficam em saldo, disponível em evoluções seguintes; nenhum benefício de níveis anteriores é concedido retroativamente.
4. Nos marcos pertinentes, selecione a nova virtude ou técnica e confira a proposta de estágio de Sentido. Acima do nível 20, escolha a evolução Aesir, Ouro, Juiz, Marina, Dríade ou Berserker; isso não promove status nem equipa armaduras.
5. Confira a comparação antes/depois e os ganhos que permanecem manuais. Pendências são informativas e notas são opcionais; não há aceite de exceções. XP insuficiente não provoca promoção silenciosa.
6. **Confirmar evolução** apresenta o resumo e envia solicitação privada ao mestre ativo. Após aplicação, a ficha registra os ganhos em **História e evolução → Histórico de evolução assistida**. As cópias de conteúdo só são criadas nesse momento.

Fechar/recarregar conserva o rascunho. **Descartar rascunho** não altera nível, pontos ou itens. PV/CE atuais, recursos da armadura, XP e ajustes manuais são preservados ao evoluir; crescimento de máximos não cura nem repõe CE. Técnicas novas precisam ser configuradas/revisadas na cópia antes da ativação. Cópias existentes com a mesma origem são conservadas, sem sobrescrever notas ou reimportar benefícios. Melhoria aumenta a graduação da cópia existente, até cinco aquisições.

## Ganhos conferidos

| Ganho | Regra aplicada / referência |
| --- | --- |
| PV e CE máximos, ações, modificador de nível e efeitos pessoais cobertos | Recalcular o nível segundo as fórmulas existentes, preservando máximos manuais e recursos atuais (pp.58–124). PV de estilo cresce a partir do nível 2, conforme decisão da campanha. |
| Perícias | Sentidos efetivos atuais, **antes de distribuir os novos ganhos**, mais a parcela do estilo: Santo/Guardião/Asgardiano +1, Sábio/Domador +2, Artista +3. Rotas épicas usam suas tabelas; mínimo um ponto (pp.184–185,550–582). |
| Atributos | Dois pontos nos níveis 5/10/15/20/25/30. Aumentar de graduação efetiva 5 ou maior custa dois pontos por graduação; limite de personagem 10 (p.155). |
| Habilidades de luta | Duas graduações nos mesmos marcos de cinco níveis, com limite de cinco por habilidade (p.408). |
| Virtudes | Uma nos níveis múltiplos de quatro (p.161). Trocas de virtudes são revisadas manualmente. |
| Habilidades/Dádivas e Melhoria | Seleção por tipo, origem e nível desbloqueado; Melhoria pode substituir a escolha e possui limite de cinco aquisições (pp.55–56). Especialização extra substitui a do estilo no nível 5 e fornece dádivas posteriores (p.125). |
| Técnicas | Escolha de Prata no nível 11; Ouro nos níveis 21/30 conforme tabela geral. Requisitos e parâmetros específicos precisam de configuração na cópia (pp.55,198–202). |
| Sentidos | Propõe os marcos da p.473 e preserva estágio superior obtido anteriormente. Confere atributo-chave 7 e 6º Sentido Pleno para o 7º; aplica ordinal/estágio, iniciativa e nível de ataque sem reduzir valores superiores (p.475). Demais bônus ficam na lista de revisão. |
| Evoluções 21–30 | Acrescenta uma ação de ataque/defesa e uma capacidade de CE por avanço assistido, conforme tabelas épicas (pp.550–582). Ajustes anteriores de personagens já acima do nível 20 precisam de conferência; não há reposição retroativa. |
| XP | Mostra o requisito da tabela da p.507. Não gasta XP nem decide merecimento, promoção ou experiência por sessão. |

As concessões textuais, efeitos contextuais, crescimento de especializações, bônus adicionais dos Sentidos, Determinação/Orgulho, reescrita de virtudes, evolução da besta e promoções de status/armadura exigem revisão. O assistente indica esses pontos; não declara automação integral. Ganhos manuais já lançados devem ser conferidos antes de confirmar.

## Registro e falhas

Um mestre ativo processa as solicitações em fila, conferindo autoria, propriedade do ator e se os dados/escolhas ainda coincidem com a confirmação. Repetir a solicitação não concede o mesmo nível novamente. O registro conserva comparação, conteúdo adquirido, saldos e pendências.

Se uma gravação falhar antes de aplicar o nível, o sistema tenta remover somente as novas cópias que não foram editadas e reverter graduações de Melhoria que ainda coincidam com a operação. Itens anteriores, notas, recursos e alterações posteriores são preservados. Uma operação interrompida permanece bloqueada para revisão do mestre: confira **Última operação de evolução**, nível, pontos e itens; repare manualmente se necessário. **Liberar após revisão manual** confirma essa conferência, sem restaurar ou excluir dados automaticamente, e permite abrir outro rascunho. Não há desfazer genérico da evolução concluída.

As solicitações privadas pendentes são retomadas ao iniciar o mundo ou atualizar os usuários. É necessário mestre ativo; personagens e tokens não são criados pelo assistente. API: `game.godsBattle.beginLevelUp(actor)` e `game.godsBattle.requestLevelUp(actor)`.

## Exercício com as fichas de teste

Antes de abrir o rascunho de Aster, registre 10 XP em História e evolução. Abra o assistente 1 → 2, escolha uma dádiva ou Melhoria Santo, distribua até três pontos de perícia (Sentidos 2 +1) e confirme a leitura. Confira PV máximos 23 → 36, capacidade de CE 6 → 7 e ações 1 → 2, mantendo os recursos atuais. Confirme como mestre; reabrir não deve repetir a concessão. Depois teste o nível 4 (virtude) e o 5 (atributos, luta, especialização e Sentido), sempre um nível por vez.

Testes locais usam contrato mínimo da API e verificam regras, preservação, concorrência e falhas. Execução com mestre e jogador no Foundry 13 build 350 continua pendente.
