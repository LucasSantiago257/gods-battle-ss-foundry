# Recarga de Sustentada pelo dono — 0.67.0

Na ficha do pagador, abra **Combate → Efeitos com duração**. O mestre continua registrando a Sustentada inicial, com técnica, alvo, duração e perfil de recarga explicitamente escolhidos após a resolução na mesa. O registro conserva a fonte e a classe capturadas; editar/remover o Item não recalcula o efeito registrado.

## Pagar e encerrar

O dono do pagador e o mestre podem operar o registro. **Pagar 1 CE extra/atual · rodada R** mostra a origem do recurso e usa extra primeiro. **Ajustar recarga** abre a preferência explícita de CE extra, inicialmente desmarcada, e notas opcionais. A prévia mostra os saldos; sem CE livre suficiente a confirmação fica desativada. A reserva é preservada, não há excesso corporal/PV e CE ilimitada registra sem reduzir saldos.

A janela e o cancelamento não ocupam a fila nem gravam a ficha. O mestre responsável coordena automaticamente por mensagens privadas internas, sem pedido visível ou aprovação humana. O dono não precisa possuir nem abrir o alvo adversário oculto. A prévia usa o registro e combatente do pagador; o coordenador confere internamente o alvo/Actor/Combat reais antes do pagamento. Alvo removido ou substituído impede nova recarga.

A fase inicial não cobra recarga. O perfil **por rodada** cobre somente a rodada informada; o perfil **único até encerrar** não cobra novamente nesse registro. Avanço/retrocesso de combate não cobra sozinho. Lacunas aparecem como intervalo sem registro; uma recarga atual não cria cobranças retroativas nem prova que o efeito continuou durante o intervalo. Esses perfis e a rodada coletiva são convenções publicadas, não uma frequência universal afirmada pelo livro.

**Encerrar Sustentada** conserva pagamentos, CE e ajustes, inclusive sem fonte/alvo/encontro disponível. Não há reembolso ou Desfazer de recarga. Oposição segue seu [fluxo separado do mestre](oposicao-sustentada.md); pagar não vence o duelo nem prova ativação, aprisionamento, sucesso ou continuidade. Histórico de pagamentos/oposições e notas começam recolhidos. Nenhuma condição, dano, ação, manutenção automática ou calendário real é criado.

## Interrupções

A ficha do dono mostra a operação interrompida e **Conferir recarga**. Se recursos/registro/contexto forem compatíveis, **Concluir pelo registro** completa somente a parte ausente. Quando o pagamento já consta, apenas a conclusão do journal é corrigida, sem repetir CE; isso pode ocorrer mesmo sem alvo/encontro. Divergências oferecem **Encerrar operação**, preservando recursos e registro atuais. Interrupções continuam visíveis com mestre offline, para retomada quando houver coordenador.

Cada intenção usa a ID real da mensagem. Reenvio/resposta perdida retorna resumo histórico, sem regravar a ficha ou ressuscitar registro encerrado. Um único update autorizado reúne débito e pagamento no pagador; o alvo não recebe escrita. Somente caminhos próprios do registro são alterados: notas/oposições/ajustes tardios sobrevivem. Journals antigos de tipo sustainPayment mantêm o recuperador do mestre e não são convertidos em novo pagamento. Registro inicial, oposição e seus históricos permanecem separados.

A fila e as revalidações são do cliente coordenador; não constituem transação/CAS ou validação no servidor. Perda de OWNER remove controles e bloqueia callbacks. Observadores não recebem o contexto financeiro ou o nome privado do alvo.

## Ensaio curto

Use cópias de exercício, um mestre e um jogador dono somente do pagador; deixe o adversário inacessível ao jogador.

1. O mestre registra uma técnica Sustentada pronta e um alvo real do encontro. Confira prazo inicial e o perfil por rodada/único combinado pela mesa; não repita ativação/custo inicial.
2. Após a fase inicial, o jogador abre Ajustar e cancela por Escape: CE/histórico devem permanecer iguais. Depois paga uma recarga, conferindo atual/extra e reserva. Dois cliques e retrocesso não repetem o pagamento.
3. Avance mais uma rodada. No perfil por rodada, confira nova recarga; no único, nenhuma nova cobrança. Em intervalo sem registro, confira a lacuna e pague somente a atual, se o efeito ainda foi mantido pela mesa.
4. Encerre e confira CE/histórico preservados. Repita com token sintético, CE ilimitada e observador. Verifique que somente dono/mestre têm controles e que oposição continua separada.
5. Se houver interrupção real, use Conferir recarga e conclua a parte compatível ou encerre só a operação divergente. Não provoque falhas artificiais no mundo em uso.

Core hospedado13.350, troca de coordenador/reconexão e concorrência entre conexões reais continuam sem confirmação. Esse ensaio não exige resposta para o trabalho independente prosseguir.

## Cobertura e limites

1252 testes Linux completos sem falhas/exclusões: planos, runtime, mensagens, UI, hooks instalados e regressões legadas; roundtrip Items/Actors, check e pacotes. Ensaio Edge isolado com templates/callbacks/hooks/runtime reais,15 cenários,teclado440px e capturas inspecionadas; não substitui o core hospedado ou clientes simultâneos. Catálogos/IDs/cópias preservados.

Fontes205/225 e perfis publicados em [Sustentada](sustentada.md). Custos específicos/permanentes, múltiplos alvos, oposição integral e exceções de condições permanecem nos limites documentados; não são deduzidos por analogia da recarga genérica.
