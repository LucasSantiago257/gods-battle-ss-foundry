# Quebrar Armadura Sustentada — 0.58.0

A composição personalizada, o registro no alvo e a aplicação por rodada usam o mesmo vínculo canônico. A forma Sustentada tem acompanhamento próprio no painel; a forma instantânea continua manual.

## Fonte e alcance

A p.229 separa a forma instantânea, que acrescenta um Nível de Dano à armadura, da forma Sustentada, que lista1/2/3 de dano por turno para Bronze/Prata/Ouro. A recorrência também aparece no Enforcamento do Urso, pp.257–258. O perfil trata somente essa parcela fixa de armadura. A conversão instantânea entre faixas da tabela202 continua manual; não foi inferida.

Primeiro perfil: técnica personalizada concluída com primordial Sustentada e um Big Bang Quebrar Armadura canônico da composição salva. Nome livre e Item solto não habilitam o efeito. Dano corporal, ND, bônus de dano e manutenção de CE são fluxos distintos. Técnicas com primordiais mistos e cópias do catálogo continuam manuais neste perfil; isto inclui os demais efeitos específicos do Enforcamento do Urso.

A leitura proposta para a linha Sustentada é dano direto aos PV da armadura, sem convertê-lo em +ND por rodada. O mestre registra um prazo finito e a primeira parcela nesta/próxima rodada após resolver ativação, resistência e duração. Esses campos operacionais não estabelecem um início universal nem mantêm a oposição automaticamente. Ao cessar a sustentação, o mestre encerra o registro. Extensões permanecem no acompanhamento próprio; pagar CE não vence oposição nem adiciona parcelas de dano.

## Vínculo e integridade

O registro aponta para o Item de armadura equipado no alvo. Troca, remoção, armadura morta ou falta de PV válidos pausam a aplicação; não se transfere a parcela à próxima vestimenta. Cópias e tokens independentes preservam identidade própria. A parcela padrão segue a classe; Ajustar permite usar valor final ou dispensa com notas opcionais, sem justificativa ou caixa de aceite.

As regras puras calculam próxima rodada, valor anterior/posterior e snapshot do Item/registro, sem escrever PV corporais, CE, ações, condições ou armadura. A assinatura inclui os Items de armadura: a assinatura antiga de efeitos contém somente Actor e não detectaria reparo/edição de um Item durante o diálogo.

A operação do mestre responsável prepara journal antes de alterar Item+Actor e usa a fila compartilhada com os outros recursos. Recuperação distingue nenhum débito, débito com registro concluído e débito já feito com registro ainda anterior; nesse último caso completa somente o registro, sem repetir ou reverter dano. Edições posteriores ou substituição do Item exigem conferência preservando recursos. Avançar rodadas não aplica dano. Se os valores atuais forem idênticos ao snapshot anterior, a operação é encerrada sem débito; não é possível distinguir uma reversão manual exata desse mesmo estado. A recuperação nunca reaplica automaticamente. Encerrar operação e efeito conserva os PV atuais e impede reaplicar a parcela divergente pelo painel.

Este conjunto não altera ataque físico comum. Lucas decidiu que exceções físicas à armadura continuam como lançamento manual do mestre. Não acrescenta condições, interpretações de imunidade ou poderes por nome. Catálogos, UUIDs e cópias existentes são preservados.

Fonte: A Batalha dos Deuses V49.1.1, pp.229 e257–258; tabela202 como limite não implementado. Autor: Dhoko de Libra, CC BY-NC-SA4.0; [atribuição](../ATTRIBUTION.md). Testes isolados não comprovam execução no Foundry hospedado13.350.

## Ensaio curto

1. Em um grupo de treino novo, crie na Lyra uma técnica Bronze/Mental com primordial Sustentada e Quebrar Armadura do seletor. Conclua: custo3CE e dificuldade13. A indicação no construtor aponta para o registro separado. Não habilite o grupo numérico de Dano.
2. Marque Doran e ative a técnica. Resolva resistência, oposição e duração pelo fluxo aplicável à mesa; ativar não registra parcelas no alvo nem interpreta os demais Big Bangs.
3. Como mestre responsável, no alvo em **Combate → Efeitos com duração → Quebrar Armadura**, escolha a técnica,2rodadas e primeira parcela nesta rodada. A fonte precisa estar concluída; o alvo precisa de uma armadura equipada e um combatente único no encontro iniciado. O botão aparece quando há uma fonte apta.
4. Confira armadura, PV atuais e prazo. **Aplicar1PV de armadura** registra somente a parcela indicada. Sem novo custo/rolagem ou dano corporal. Um botão antigo é recusado; não resolve outra parcela atrasada.
5. Na rodada seguinte, **Ajustar** permite0,5PV ou dispensar a parcela, com notas vazias. O valor anterior/posterior fica no Histórico. Trocar ou remover a armadura pausa; não se transfere dano. Encerre o registro se a Sustentada cessar antes do prazo.
6. Em interrupção real, use a recuperação em Combate. **Concluir pelo registro** pode completar só as flags se o Item já foi debitado. Reparo/edição divergente é preservado; **Encerrar operação e efeito** encerra o acompanhamento local sem alterar PV. Não simule falhas de gravação no mundo da sessão; os testes automatizados cobrem essas janelas.

O registro finito de parcelas e o acompanhamento de manutenção/oposição da Sustentada continuam separados. Não há recarga, extensão ou encerramento cruzado automático. O primeiro perfil não automatiza o restante de Enforcamento do Urso nem novas condições.
