# Brasas pelo dono do alvo

Em **Combate → Efeitos com duração**, o dono do alvo pode resolver as parcelas de Brasas já registradas: **Aplicar**, **Ajustar**, **Dispensar rodada**, **Desfazer última parcela** e **Encerrar Brasas**. O mestre ativo coordena automaticamente as gravações por mensagens privadas e discretas; não há solicitação visível ou aprovação humana. O alvo não precisa possuir ou consultar a ficha atacante.

O registro continua sendo uma ação explícita do mestre em **Adicionar efeito**, após conferir ativação, resistência, dano inicial, duração e primeira parcela. Abrir a ficha, importar uma técnica ou avançar a rodada não registra nem aplica dano. A técnica personalizada deve conter Dano e Brasas canônico na composição; escrever o nome não habilita o cálculo. A classe capturada determina a sugestão: Bronze 5, Prata 10 ou Ouro 15 PV por turno (p.225). Editar/remover a fonte posteriormente não recalcula o registro existente.

## Resolver parcelas

**Aplicar N PV · rodada R** registra uma parcela pendente, em ordem. **Ajustar** abre o dano corporal e a prévia de PV antes/depois; aceita zero e frações. Zero pode representar uma parcela já resolvida manualmente. Um campo vazio não vira zero. **Dispensar rodada R** conclui explicitamente essa parcela sem retirar PV. Notas são opcionais e começam recolhidas; imunidades, reduções e exceções da mesa continuam sendo escolhas explícitas.

A próxima rodada, o fim e a quantidade de parcelas pendentes ficam visíveis. Avançar muitas rodadas não cobra tudo: cada parcela continua pendente até ser aplicada ou dispensada. Voltar o encontro não recria rodadas consumidas. A época de ações amarra uma intenção à rodada exibida; não redefine a duração de Brasas a cada rodada.

**Desfazer última parcela** restaura somente os PV da última aplicação nova com recursos e registro intactos, inclusive uma parcela zero ou dispensada. A rodada volta a ficar pendente. O botão continua na área principal quando a última parcela conclui o prazo e permanece disponível mesmo sem a fonte ou o encontro. Alterar PV/perfil/parcelas depois invalida a inversão; não há cadeia arbitrária de reembolsos. Parcelas do resolvedor antigo não recebem Desfazer retroativo.

**Encerrar Brasas** é uma ação direta que conserva PV, parcelas, notas e histórico, sem dispensar ou cobrar rodadas pendentes. Encerrar retira a disponibilidade de Desfazer. Também funciona com fonte/encontro removidos. O histórico permanece recolhido e uma inversão arquiva o tick atual, inclusive suas notas posteriores; não restaura um registro inteiro antigo.

## Interrupção e identidade

**Brasas interrompidas → Conferir Brasas** fica disponível ao dono ou mestre. **Concluir pelo registro** completa somente a gravação ausente quando os snapshots ainda são compatíveis. Se a parcela já foi gravada, conclui apenas o status, sem repetir dano ou reembolso. Em divergência, a única ação é **Encerrar operação**, preservando PV e registro atuais. Cancelar não envia pedido nem ocupa a fila.

A ID da mensagem real identifica uma intenção, inclusive depois de resposta perdida ou retomada. Autor e propriedade são revalidados; comandos, papéis, patches e snapshots recebidos não são executados. O journal financeiro fica somente no alvo. Recibos antigos são históricos e não reescrevem a ficha atual. Nomes/notas não provocam falso conflito matemático; alterações de identidade, PV, perfil ou rodada exigem atualizar a prévia. Cópias e tokens sintéticos conservam identidades próprias e não podem executar o registro de outra ficha.

A ficha mostra somente Brasas, classe, valores, prazo e ações autorizadas, sem consultar a fonte oculta. Observadores não recebem os controles/contexto financeiro de Brasas. Perda de propriedade remove os controles; mestre offline é um aviso real, inclusive para interrupções sem registro. Journals genéricos antigos continuam com seu recuperador anterior, sem converter uma aplicação histórica em reembolso novo.

## Limites e cobertura

A operação altera somente PV corporais do alvo e seu registro/histórico. CE, reserva, máximos, PVA, ações e condições ficam intactos. Não dobra o dano pela ausência de armadura, acrescenta resistência, transfere recursos, infere acúmulo ou automatiza morte. Acúmulo, sucesso inicial, duração e exceções permanecem conferidos pela mesa. O limite de 1000 rodadas é técnico, não uma regra do livro.

O conjunto inclui 97 testes focados novos de planos/runtime/mensagens/UI/integração, os 33 testes anteriores de efeitos preservados e suíte Linux completa de 1035 testes, sem falhas ou exclusões. Quatorze cenários de Edge isolado exercitam templates, handlers, hooks e runtime reais, teclado em 440px, alvos vinculados/sintéticos, privacidade, resposta perdida e recuperação. As capturas foram inspecionadas. Isso não comprova core hospedado 13.350 nem concorrência entre conexões reais; a coordenação continua no cliente do mestre.

## Ensaio curto

1. Mestre: use fichas de exercício e um encontro iniciado, com um único combatente por alvo. Componha uma técnica de Dano com Brasas; resolva ativação/resistência inicial separadamente. Em Adicionar efeito, registre duas rodadas e primeira parcela nesta rodada. Confira que o registro não modifica PV/CE. Use apenas cópias de treino.
2. Jogador dono do alvo: abra Combate → Efeitos com duração e aplique a parcela. Confira uma única diferença em PV e o histórico. Use Desfazer antes de editar os recursos: a rodada volta a ficar pendente. O atacante pode estar sem acesso para o jogador.
3. Abra Ajustar, confira a prévia e cancele por Escape: nenhum recurso muda. Reabra e informe uma fração ou zero já resolvido, sem justificativa obrigatória. Aplique. Na próxima rodada, use Dispensar. A última parcela concluída mantém Desfazer evidente enquanto válido.
4. Encerre e confira o histórico, sem novas alterações em PV/CE/PVA. Repita em token sintético e confira que o Actor base permanece intacto. Um observador não recebe os controles; testar perda de propriedade deve removê-los.
5. Recuperação e falhas artificiais estão nos testes automatizados; não interrompa gravações de um mundo em uso. Se houver interrupção real, use Conferir Brasas, sem repetir manualmente a perda. O ensaio hospedado com mestre e jogadores continua separado.
