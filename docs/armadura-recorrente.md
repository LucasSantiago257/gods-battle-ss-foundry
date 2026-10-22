# Quebrar Armadura Sustentada — conjunto em preparação

Base estável0.57.0. Este documento descreve o próximo contrato; **ainda não há ação ou execução disponível no sistema publicado**. A etapa inicial contém somente regras puras e testes. A operação, o painel e a recuperação real entre documentos precisam ser integrados antes de uma nova release.

## Fonte e alcance

A p.229 separa a forma instantânea, que acrescenta um Nível de Dano à armadura, da forma Sustentada, que lista1/2/3 de dano por turno para Bronze/Prata/Ouro. A recorrência também aparece no Enforcamento do Urso, pp.257–258. O perfil em preparação trata somente essa parcela fixa de armadura. A conversão instantânea entre faixas da tabela202 continua manual; não foi inferida.

Primeiro perfil: técnica personalizada concluída com primordial Sustentada e um Big Bang Quebrar Armadura canônico da composição salva. Nome livre e Item solto não habilitam o efeito. Dano corporal, ND, bônus de dano e manutenção de CE são fluxos distintos. Técnicas com primordiais mistos e cópias do catálogo continuam manuais neste perfil; isto inclui os demais efeitos específicos do Enforcamento do Urso.

A leitura proposta para a linha Sustentada é dano direto aos PV da armadura, sem convertê-lo em +ND por rodada. O mestre registra um prazo finito e a primeira parcela nesta/próxima rodada após resolver ativação, resistência e duração. Esses campos operacionais não estabelecem um início universal nem mantêm a oposição automaticamente. Ao cessar a sustentação, o mestre encerra o registro. Extensões permanecem no acompanhamento próprio; pagar CE não vence oposição nem adiciona parcelas de dano.

## Vínculo e integridade

O registro aponta para o Item de armadura equipado no alvo. Troca, remoção, armadura morta ou falta de PV válidos pausam a aplicação; não se transfere a parcela à próxima vestimenta. Cópias e tokens independentes preservam identidade própria. A parcela padrão segue a classe; Ajustar poderá usar valor final ou dispensa com notas opcionais, sem justificativa ou caixa de aceite.

As regras puras calculam próxima rodada, valor anterior/posterior e snapshot do Item/registro, sem escrever PV corporais, CE, ações, condições ou armadura. A assinatura inclui os Items de armadura: a assinatura antiga de efeitos contém somente Actor e não detectaria reparo/edição de um Item durante o diálogo.

A operação futura precisa preparar journal antes de alterar Item+Actor. Recuperação distingue nenhum débito, débito com registro concluído e débito já feito com registro ainda anterior; nesse último caso completa somente o registro, sem repetir ou reverter dano. Edições posteriores ou substituição do Item exigem conferência preservando recursos. Avançar rodadas não aplica dano; interface, fila e testes de falhas reais ainda estão pendentes.

Este conjunto não altera ataque físico comum. Lucas decidiu que exceções físicas à armadura continuam como lançamento manual do mestre. Não acrescenta condições, interpretações de imunidade ou poderes por nome. Catálogos, UUIDs e cópias existentes são preservados.

Fonte: A Batalha dos Deuses V49.1.1, pp.229 e257–258; tabela202 como limite não implementado. Autor: Dhoko de Libra, CC BY-NC-SA4.0; [atribuição](../ATTRIBUTION.md). Testes isolados não comprovam execução no Foundry hospedado13.350.
