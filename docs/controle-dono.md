# Nova resistência de Controle pelo alvo

Em **Combate → Efeitos com duração**, o dono do alvo pode usar **Nova resistência** em um Controle vinculado já registrado. O mestre ativo coordena automaticamente, por mensagens privadas e discretas. Não há solicitação visível ou aprovação humana, e o jogador não precisa acessar a ficha atacante.

A janela mostra rodada/prazo, custo, dificuldade, CE atual/reservada/extra e prévia da parada. O atributo começa pela natureza capturada; registros antigos sem natureza exigem escolha explícita. Modificador, vantagem, CE extra e a escolha de encerrar/manter o prazo em sucesso ficam em Ajustes; notas são opcionais e recolhidas. **Rolar público** declara a visibilidade do resultado. Cancelar ou pressionar Escape não envia intenção, rola dados ou cobra recursos.

## Custo, resultado e prazo

A tentativa genérica custa1 CE para Bronze/Prata ou2 CE para Ouro, inclusive em falha (p.208). Usa o Poder Cósmico capturado e parâmetros atuais do alvo, seguindo a política de resistência do mundo e parcelas assistidas existentes. CE extra é usada primeiro somente quando escolhida. A reserva é preservada; não há excesso corporal, queima de PV ou redução silenciosa do custo. Sem saldo atual disponível, a janela ainda permite escolher CE extra. CE ilimitada registra a tentativa sem reduzir recursos.

Em sucesso, **Encerrar este registro** encerra somente o Controle escolhido; **Manter o prazo** conserva a duração. Falha não reinicia/dobra o prazo ou cria penalidade/condição. A operação não consome ataque, defesa, movimento ou reação. O cartão público mostra resultado, dificuldade, pagamento e estado; dados e notas começam recolhidos. Não há cartão de dano zero.

Uma tentativa genérica por rodada posterior à ativação e dentro do prazo, no mesmo encontro/combatente, é a convenção operacional já publicada. Avançar a rodada não tenta ou cobra automaticamente; retroceder não repete uma rodada paga. Conferir a última rodada pelo acompanhamento manual pode concluir o prazo e impedir outra tentativa. O mestre conserva as ações genéricas de registrar rodada/encerrar o efeito. Registro inicial de Controle continua no fluxo explícito do mestre, após ativação e resistência originais; não há registro ao abrir/importar.

## Interrupções e preservação

**Conferir resistência → Concluir pelo registro** completa só a gravação ausente quando resultado e snapshots continuam compatíveis. Se o pagamento já ocorreu, conclui status/publicação do mesmo resultado. Não relança dados nem cobra outra vez. Uma falha antes de salvar o resultado encerra a operação sem novo dado ou gasto. Em divergência ou dados incompatíveis, a opção disponível é **Encerrar operação**, conservando CE e registro atuais. Isso não encerra o Controle nem reembolsa a tentativa.

A intenção usa a ID real da mensagem privada e o autor real. Papéis, comandos, snapshots e patches recebidos não são executados. O journal fica no alvo, com resultado salvo antes do débito e atualização conjunta da CE/tentativa/status. Resposta perdida retoma a mesma intenção; recibos antigos não reescrevem o estado atual da ficha. Nomes, notas, PV e recursos alheios ao cálculo não provocam falso conflito de CE. Alterações de perfil, CE, atributos, política do mundo, encontro ou rodada exigem atualizar a prévia.

O dado salvo é conferido antes do débito/publicação. A recuperação procura o mesmo cartão público se a confirmação foi perdida antes de salvar sua ID. Um cartão vinculado removido/alterado exige encerrar a operação, sem criar outro gasto. Recuperação pode publicar um resultado pago mesmo se a fonte, o encontro ou o registro foram removidos. Journals antigos de Controle continuam com o recuperador GM anterior; não são convertidos ou reembolsados retroativamente.

A apresentação usa o nome genérico Controle e o perfil do registro, sem consultar nome/descrição da fonte oculta. Dono e mestre recebem as ações autorizadas; observador não recebe o contexto financeiro. Perda de propriedade remove os controles e impede callbacks pendentes. Mestre offline é um aviso real; interrupção continua visível mesmo sem registro. Cópias e tokens sintéticos mantêm identidades próprias.

## Limites

O suporte expõe a tentativa genérica já publicada nas p.206–208, sem novos requisitos de aquisição/Asterismo ou condições. Estados específicos, resistência extra após dano, bônus cumulativos, falha crítica e demais exceções das p.394–395 permanecem manuais. Resultado resolvido fora deste fluxo pago continua sendo resolução manual: não deduzir custo/sucesso de recibo genérico nem repetir pagamento para registrar algo já resolvido. Fonte e prazo são capturados no registro; editar/remover a técnica não recalcula o efeito.

PV, PVA, reserva, máximos, excesso, ações e condições não são escritos. O limite de1000 rodadas/entradas é técnico. A coordenação ocorre no cliente do mestre, sem alegação de transação global ou validação no servidor. Testes isolados não comprovam o core hospedado13.350 ou concorrência entre conexões reais.

## Ensaio curto

1. Mestre: use cópias de exercício e um encontro iniciado. Ative uma técnica de Controle, resolva a resistência inicial e registre o prazo vinculado conforme [Controle](controle.md). O registro não paga uma nova tentativa. Use um único combatente por alvo.
2. Na rodada posterior, o dono abre Nova resistência. Confira custo/PC, escolha os ajustes e cancele por Escape: nenhum recurso muda. Reabra, confira a prévia e role público. A tentativa deve consumir apenas a CE informada, inclusive em falha, e impedir repetição nessa rodada.
3. Em um exercício novo, escolha CE extra e modificador fracionário, conferindo os saldos. Em sucesso, compare encerrar somente este registro ou manter o prazo. Estados manuais e condições ficam intactos. Dados/histórico devem mostrar o mesmo resultado salvo.
4. Repita em token sintético e confira que o Actor base permanece intacto. Um observador não vê os controles; perder propriedade deve removê-los. Não provoque falhas de gravação no mundo em uso. Se ocorrer uma interrupção real, use Conferir resistência em vez de pagar/rolar novamente.

Validação:1142 testes Linux completos, zero falhas/exclusões, roundtrip Items/Actors, check e pacotes.107 novos (19 planos,32 runtime,18 mensagens,20 UI,14 integração e4 de recuperação legada), com as38 regressões anteriores de Controle preservadas/adaptadas ao fluxo real. Doze cenários Edge isolados com templates, callbacks, hooks e runtime reais, teclado440px, privacidade, resposta perdida e recuperação; capturas inspecionadas e contraste da janela corrigido. O ensaio hospedado continua separado.
