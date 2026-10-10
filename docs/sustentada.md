# Sustentada — duração e recarga assistidas

Disponível desde0.20.0. Na ficha do usuário, em Combate → Efeitos com duração → Registrar Sustentada no pagador, escolha uma técnica pronta com efeito Sustentada e um alvo do encontro. Registre uma ativação já resolvida na mesa: não repete Asterismo, resistência ou pagamento inicial. Técnica e participante são conferidos novamente antes de gravar. Uma técnica tem um registro pagador ativo, com um alvo; múltiplos alvos continuam manuais.

A rodada da ativação faz parte da duração inicial. Campo de duração vazio usa Bronze2, Prata3 ou Ouro4 rodadas (livro p.205); informe outra duração final quando a técnica ou a resistência a alterar. O registro pode ser feito durante essa fase ou na primeira rodada de manutenção. Flags anteriores, fichas antigas e catálogos conservam suas regras; não há migração automática de anotações para Sustentada.

## Frequência como perfil da mesa

A p.205 descreve recarga de1CE para continuar, sem detalhar sua frequência. O formulário oferece dois perfis explícitos de campanha: **1CE por rodada** ou **1CE uma vez até encerrar**. Isso registra a interpretação usada, não afirma que o livro estabeleça universalmente um deles. Técnicas com custos próprios, dias, depósitos permanentes e exceções usam seu fluxo manual. A p.225 exige vitória em oposição; pagar a recarga não vence o duelo.

Após o prazo inicial, Pagar recarga1CE confirma uma operação no usuário. Pode usar CE extra primeiro; conserva reserva, PV, ações e condições, sem queimar acima do limite do corpo. CE ilimitada registra a operação sem reduzir recursos. Custo é1CE neste perfil, distinto de nova resistência de Controle1/1/2CE e de dano em armadura1/2/3. No perfil por rodada, uma recarga cobre a rodada confirmada; na recarga única, não há nova cobrança nesse registro até seu encerramento.

Convenção operacional: rodada coletiva do encontro Foundry representa o turno rastreado. Avançar/voltar a vez ou rodada não cobra nem aplica efeito. Duplo clique e retrocesso não repetem recarga. Em lacuna, o mestre pode registrar a recarga atual sem cobrar retroativamente; o histórico guarda as rodadas sem registro. Isso não afirma que o efeito continuou durante a lacuna. Se cessou ou o alvo se libertou, use Encerrar Sustentada; conserve pagamentos anteriores. Sem CE livre, pagar é recusado e encerrar continua disponível.

## Recuperação e limites

Preparação bloqueia novos gastos pelo mesmo mecanismo de técnicas/ações/efeitos. Um único Actor.update reúne débito, pagamento no registro e conclusão da operação. Conferir efeito recupera registros anterior/posterior sem repetir cobrança ou restaurar recursos; valores divergentes ou cópias exigem revisão manual e permitem encerrar só a pendência. Notas são opcionais. Janela aberta fica fora da fila; confirmação revalida mestre, pagador, alvo, registro e rodada. Tokens independentes têm seus própriosUUIDs; troca de combatente/encontro interrompe assistência.

O registro fica somente no pagador. Não escreve no alvo nem copia rolagens privadas. Não há cartão público, oposição automática, dano recorrente ou aplicação/remoção de estado. Condições manuais, históricos de dano, ajustes e fontes congeladas são preservados; encerrar não restitui CE. A técnica pode ser editada depois do registro sem reescrever o histórico. Regras específicas de aprisionamento, danos por turno, dias ou depósitos não são deduzidas da descrição. A fila do mestre é do cliente, sem transação/CAS no servidor. Validação Foundry13.350 real permanece pendente.

Ver [auditoria de fontes e próximos contratos](sustentacao-residual-auditoria.md). Livro V49.1.1, atribuição em [ATTRIBUTION.md](../ATTRIBUTION.md), pp.205/225. Próximo marco: oposição com participantes e perfis de atributo/Cosmo/empate explicitados, seguido de Cosmo Residual.
