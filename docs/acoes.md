# Ações e rodadas — 0.14.0

Como mestre, abra um encontro no rastreador de combate, adicione os tokens e inicie o combate. Na ficha, **Combate → Ativar controle de ações no encontro aberto** habilita o controle para esse encontro após confirmação. O controle começa desligado; encontros existentes e fichas fora de encontros habilitados mantêm rolagens sem consumir reservas. É necessário um mestre conectado para processar usos de ações.

**Ações da rodada** mostra ataque, defesa, movimento e reação disponíveis/gastas. Ataque e defesa têm os máximos derivados da ficha; usar uma não consome a outra. Quando a automação avançada está ligada, cada graduação de Combate acima de cinco acrescenta uma ação de ataque e uma de defesa. A memória de cálculo mostra a parcela; ajustes manuais são conservados. Confira ajustes antigos que já representavam esse benefício para evitar contá-lo duas vezes. Com automação avançada desligada, essa parcela continua manual.

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
| Registrar Movimento / Reação | Registra um uso com descrição, sem rolar/aplicar poderes ou cobrar CE. Uma declaração de movimento e uma reação são acompanhadas por ciclo. |

Resolva ataques/defesas pendentes antes de avançar a rodada. Um cartão de ataque produzido com controle não pode consumir defesas de outra rodada/encontro. Resistir a uma técnica continua sendo o teste do fluxo de resistência; não consome automaticamente defesa ou reação. Essas reservas não são cobradas outra vez pelo cartão de resistência.

Movimento é um registro da declaração, não uma medição da cena ou aplicação de movimento parcial/total. Corrida, ataque à distância e manobras que consomem movimento exigem registrar o uso correspondente e conferir consequências. Habilidades/Dádivas de reação exigem escolher o poder e conferir requisitos/efeitos separadamente. Ações de Cosmo continuam limitadas pelos recursos/regras próprios; não foi criado um número arbitrário de ações de Cosmo. Exceções por virtudes, duelos, bloqueios e múltiplos alvos não são concedidas automaticamente.

## Ajustes e interrupções

**Ajustar reservas · mestre** permite informar disponibilidade de cada reserva entre zero e o máximo da ficha, com justificativa. Registra antes/depois sem mudar os máximos ou conceder poderes. Para bônus que aumentam o máximo, ajuste os campos correspondentes da ficha após conferir a regra; gasto já realizado permanece. Para uma exceção de técnica entre ações, o mestre deve conferir a virtude e registrar o ajuste da reserva escolhida antes da nova confirmação.

O mestre responsável processa ações na mesma fila de técnicas, dano e evolução. Solicitações desatualizadas, repetidas ou feitas sem propriedade são recusadas. Fichas vinculadas com mais de um combatente no mesmo encontro, ou participantes de dois encontros habilitados, exigem resolver a ambiguidade; tokens/fichas independentes têm reservas próprias. Copiar uma ficha não transfere seu gasto para a identidade nova.

**Histórico de ações e ajustes** exibe os vinte registros mais recentes de cada grupo e conserva os demais. Técnicas registram seu consumo no histórico de ativações, junto com o pagamento. Dados/resultados privados ficam no ChatMessage; o histórico do Actor não guarda Roll ou cartão.

- Ação paga com falha de publicação: **Conferir gasto / recuperar cartão** republica o mesmo resultado, sem consumir ou rolar novamente, mesmo após mudanças posteriores nas reservas.
- Ação preparada/interrompida: bloqueia novas ações, técnicas e alterações automatizadas de dano/evolução até conferência. Se o estado coincide com o anterior, encerra sem gasto; se coincide com o posterior completo, reconhece o gasto e recupera o cartão.
- Reservas divergentes/cartão removido ou alterado: faça o reparo necessário e **Encerrar após revisão manual**, com confirmação e justificativa. Essa revisão conserva as reservas atuais e não cria resultado. O ajuste do mestre permanece disponível para o reparo.
- Registro interrompido copiado: recuperar recusa modificar a solicitação original. Revise e encerre somente o registro da cópia.

Não há desfazer genérico do uso de ações. Fila do cliente mestre não equivale a bloqueio global do servidor: edições diretas, macros e testes genéricos continuam fora da coordenação. Mudanças conhecidas durante a prévia/rolagem são conferidas antes do gasto. Validação real no Foundry13.350, com dois clientes e tokens vinculados/não vinculados, continua pendente.

Fontes: livro V49.1.1, pp.200,403–408,415–416,419,422. Autor: Dhoko de Libra; atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). A correspondência entre turno coletivo e rodada é a convenção explícita da integração; não exige aguardar a vez para defender/reagir. APIs: [Combat](https://foundryvtt.com/api/v13/classes/foundry.documents.Combat.html), [preUpdateDocument](https://foundryvtt.com/api/v13/functions/hookEvents.preUpdateDocument.html). Ver [roteiro de validação](validacao-foundry.md).
