# Ações e rodadas — 0.26.0

Como mestre, abra um encontro no rastreador de combate, adicione os tokens e inicie o combate. Na ficha, **Combate → Ativar controle de ações no encontro aberto** habilita o controle para esse encontro após confirmação. O controle começa desligado; encontros existentes e fichas fora de encontros habilitados mantêm rolagens sem consumir reservas. É necessário um mestre conectado para processar usos de ações.

**Ações da rodada** mostra ataque, defesa, parcelas de movimento e reação disponíveis/gastas. A quantidade de parcelas vem da Velocidade efetiva, incluindo bônus de atributo já derivados na ficha. Ações de Cosmo têm apenas contador de registros, sem uma reserva numérica arbitrária; limites de CE e requisitos continuam pertencendo ao poder utilizado. Ataque e defesa têm os máximos derivados da ficha; usar uma não consome a outra. Quando a automação avançada está ligada, cada graduação de Combate acima de cinco acrescenta uma ação de ataque e uma de defesa. A memória de cálculo mostra a parcela; ajustes manuais são conservados. Confira ajustes antigos que já representavam esse benefício para evitar contá-lo duas vezes. Com automação avançada desligada, essa parcela continua manual.

## Turno do livro e rodada do Foundry

Nesta integração, **uma rodada do Foundry representa o turno coletivo de combate do livro**. Todos declaram e resolvem ações no mesmo ciclo. Mudar a vez de um combatente não repõe ações. Mudar o número da rodada repõe as reservas de todos os participantes, sem alterar PV, CE, excesso acumulado, armaduras, notas ou histórico. Reservas não utilizadas não acumulam.

Retroceder a rodada também abre um novo ciclo de reservas; não desfaz ações, dano ou pagamento anteriores. Desativar/reativar o controle abre reservas novas após confirmação. Faça isso conscientemente para corrigir o encontro. Uma ficha adicionada depois recebe suas reservas do ciclo atual. Ao encerrar/remover o encontro ou seu combatente, novas rolagens ficam fora do controle; registros e operações interrompidas são conservados.

Defesa e reação podem ocorrer fora da vez do personagem. Ataques/técnicas não são bloqueados pelo cursor de iniciativa, para permitir declarações e resolução simultânea; a mesa continua conferindo a sequência. Iniciativa, desempates por Velocidade/velocidade superada e simultaneidade permanecem conferidos pelo mestre; este marco não substitui essas regras por uma rolagem aleatória.

## Ataque, defesa e técnica

| Uso | Confirmação e gasto |
|---|---|
| Atacar alvo selecionado | Escolha habilidade, modificador e quantidade de ações de ataque, entre1 e as disponíveis. A quantidade escolhida entra na fórmula da rolagem. |
| Defender pelo cartão | Escolha modificador e quantidade de ações de defesa. Uma defesa do mesmo ataque pode ser registrada uma vez por ficha. A defesa resultante mantém o vínculo do dano ao ataque original. |
| Ativar técnica | Escolha todas as ações de ataque ou todas as ações de defesa. A reserva deve estar inteira, ainda sem gasto nesse ciclo; o sistema impede técnica entre ações já usadas. Gasto de ações, CE/PV e penalidade é salvo junto, inclusive quando o Asterismo falha. |
| Movimento Parcial | Registra uma parcela. Podem ser usados tantos movimentos parciais quanto a Velocidade efetiva permitir; metros são conferidos na mesa. |
| Movimento Total | Usa todas as parcelas de movimento da rodada; exige a reserva intacta. Depois de um parcial, total é recusado. Corrida/salto/telecinese e suas consequências seguem manuais. |
| Registrar Reação | Um uso por ciclo, sem rolar/aplicar poder ou cobrar CE. |
| Registrar Ação de Cosmo | Acrescenta um uso ao contador, sem cobrar CE ou reservar ataque/defesa/movimento. Escolha e execução do poder são separadas. |
| Preparar Cosmo Residual | Com controle ativo no mesmo encontro, segundo Asterismo registra uma parcela e um uso de Cosmo junto ao resultado/penalidade, inclusive se falhar; sem repetir CE da ativação. |

Resolva ataques/defesas pendentes antes de avançar a rodada. Um cartão de ataque produzido com controle não pode consumir defesas de outra rodada/encontro. Resistir a uma técnica continua sendo o teste do fluxo de resistência; não consome automaticamente defesa ou reação. Essas reservas não são cobradas outra vez pelo cartão de resistência.

Movimento parcial acompanha quantidade de ações, não metros medidos ou movimentação do token. Velocidade3 oferece3 parcelas; o livro386 permite repartir12m como3m+9m ou4m+4m+4m, sem impor4m por parcela. A mesa confere o total de metros. Movimento total fecha a disponibilidade mesmo se a Velocidade aumentar depois; ajuste explícito do mestre ou nova rodada pode reabrir. Corrida−4/salto−1, voo, levantar-se, telecinese, terreno e movimento reduzido permanecem manuais. Não aplicar esses modificadores só por clicar Movimento Total.

Registros antigos de Movimento inteiro, sem ruleVersion2, continuam fechando todo o movimento nesta rodada. A leitura não reescreve os dados; a próxima gravação conserva o fechamento. Solicitação antiga sem movementMode continua sendo total. Novos usos têm versão2, parcial/total explícitos e contador de Cosmo preservado por ataque/defesa/técnica/ajustes. Copiar ficha não herda gasto de outra identidade. Diários antes/depois antigos continuam recuperáveis sem converter ou consumir novas parcelas.

Ações de Cosmo são limitadas por CE/regras do poder (403), não por um número fixo de ações. O botão só registra um uso: não queima recursos, concede efeitos ou valida a capacidade de executar o poder. O limite de um milhão de registros por ciclo é técnico, não regra do livro. Não registre separadamente o Cosmo/Movimento que o segundo Asterismo já registra. Outras ações compostas, técnicas Movendo e manobras precisam de contratos próprios; não converter toda técnica em ação de Cosmo. Exceções por virtudes, duelos, bloqueios e múltiplos alvos não são concedidas automaticamente.

## Ajustes e interrupções

**Ajustar reservas · mestre** permite informar disponibilidade de cada reserva entre zero e o máximo da ficha, com notas opcionais. Registra antes/depois sem mudar os máximos ou conceder poderes. Movimento é disponibilidade de parcelas; o contador de Cosmo é conservado, não uma reserva editável. Para bônus que aumentam o máximo, ajuste os campos correspondentes da ficha após conferir a regra; gasto já realizado permanece. Para uma exceção de técnica entre ações, o mestre deve conferir a virtude e registrar o ajuste da reserva escolhida antes da nova confirmação.

O mestre responsável processa ações na mesma fila de técnicas, dano e evolução. Solicitações desatualizadas, repetidas ou feitas sem propriedade são recusadas. Fichas vinculadas com mais de um combatente no mesmo encontro, ou participantes de dois encontros habilitados, exigem resolver a ambiguidade; tokens/fichas independentes têm reservas próprias. Copiar uma ficha não transfere seu gasto para a identidade nova.

**Histórico de ações e ajustes** exibe os vinte registros mais recentes de cada grupo e conserva os demais. Técnicas registram seu consumo no histórico de ativações, junto com o pagamento. Dados/resultados privados ficam no ChatMessage; o histórico do Actor não guarda Roll ou cartão.

- Ação paga com falha de publicação: **Conferir gasto / recuperar cartão** republica o mesmo resultado, sem consumir ou rolar novamente, mesmo após mudanças posteriores nas reservas.
- Ação preparada/interrompida: bloqueia novas ações, técnicas e alterações automatizadas de dano/evolução até conferência. Se o estado coincide com o anterior, encerra sem gasto; se coincide com o posterior completo, reconhece o gasto e recupera o cartão.
- Reservas divergentes/cartão removido ou alterado: faça o reparo necessário e **Encerrar após revisão manual**, sem declaração ou justificativa obrigatória. Essa revisão conserva as reservas atuais e não cria resultado. O ajuste do mestre permanece disponível para o reparo.
- Registro interrompido copiado: recuperar recusa modificar a solicitação original. Revise e encerre somente o registro da cópia.

Não há desfazer genérico do uso de ações. Fila do cliente mestre não equivale a bloqueio global do servidor: edições diretas, macros e testes genéricos continuam fora da coordenação. Mudanças conhecidas durante a prévia/rolagem são conferidas antes do gasto. Validação real no Foundry13.350, com dois clientes e tokens vinculados/não vinculados, continua pendente.

Fontes: livro V49.1.1, pp.200,224,386–387,403–408,415–416,419,422. Autor: Dhoko de Libra; atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). A correspondência entre turno coletivo e rodada é a convenção explícita da integração; não exige aguardar a vez para defender/reagir. APIs: [Combat](https://foundryvtt.com/api/v13/classes/foundry.documents.Combat.html), [preUpdateDocument](https://foundryvtt.com/api/v13/functions/hookEvents.preUpdateDocument.html). Ver [roteiro de validação](validacao-foundry.md).


Na 0.18.1, as janelas do mestre para condições, efeitos, Controle, ajustes e recuperações não ocupam a fila enquanto aguardam sua decisão. Outros pagamentos podem prosseguir; a confirmação entra na fila para revalidar os dados e gravar. Se os dados conferidos mudarem, reabra a operação com a situação atual. A gravação continua coordenada no cliente do mestre, sem bloqueio global do servidor.
