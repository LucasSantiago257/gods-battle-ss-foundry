# Depósitos de Cosmo Energia em objetos

Desde 0.24.0, ficha do usuário → Combate → Depósitos de Cosmo Energia → Depositar CE em objeto · mestre. Arraste uma cópia da origem do compêndio para a ficha, escolha a origem, identifique o objeto e selecione o tratamento de CE permanente da mesa. O registro cuida do saldo e da devolução; ativação, requisitos, preparo, Asterismo, alvo, condições e ações são conferidos separadamente.

| Origem | Depósito | Evento para devolver | Fonte |
|---|---|---|---|
| Rosa Diabólica Real Polén | 5 CE | Técnica cessou | 281–282 |
| Gelo Eterno / Ataúde de Gelo | 1 CE por ataúde | Ataúde se quebrou | 357–358 |
| Benção de Eir | 5 CE, opção para conservar o fruto por dias | Fruta consumida | 553 |

São contratos específicos com quantidade e evento congelados; não se infere depósito de qualquer técnica Residual. Rosa exige preparo de pelo menos um dia e custo de ativação 9 CE, resolvidos separadamente. Ataúde não pode ser usado em combate; criação/ativação 5 CE e sobrevivência da vítima por 1 CE/dia não se confundem com o depósito de 1 CE do criador. Consumir Eir também envolve cura e estados, ainda resolvidos separadamente. O painel não declara esses requisitos cumpridos nem executa a técnica.

## Saldo e capacidade: escolha mecânica da campanha

As páginas específicas descrevem quantidades e devolução, mas não formalizam a interação de CE permanente com máximo, recuperação (445–446), extra e armaduras ilimitadas. Por isso não existe perfil silenciosamente escolhido nem alteração no atributo Cosmo. O mestre seleciona um dos dois tratamentos para cada depósito:

- **Somente CE atual:** debita o saldo, conserva o máximo. Recuperação manual posterior pode repor esse saldo; o depósito continua registrado e sua devolução soma a quantidade ao saldo vigente. Esta é uma convenção da mesa, não a definição universal de permanente.
- **CE atual e máximo enquanto depositado:** debita o saldo e subtrai a mesma quantidade do máximo derivado enquanto ativo. Devolver soma ao saldo vigente e retira apenas essa parcela da capacidade. Também é uma convenção declarada; não representa perda permanente de atributo.

Exemplo: atual12, máximo15, reserva2; Rosa deposita5. Atual7; máximo10 no perfil de capacidade ou15 no perfil só saldo. Se, antes da devolução, atual foi ajustado para4, devolver resulta9; não restaura12 nem o estado antigo. No perfil de capacidade, ajustes/evolução/armadura continuam compondo o máximo; se a capacidade base cair abaixo dos depósitos, o máximo fica0 até que capacidade/devolução resolvam o saldo. Nenhuma CE atual é cortada por mudança de máximo.

Só CE atual livre financia o depósito. Reserva manual, extra, PV e sobrecarga não são alterados. CE ilimitada exige resolução manual para novos depósitos. Valores de depósito são fixos; saldo finito inteiro e limites técnicos são validados. Devolução aceita saldo inteiro negativo ajustado (até−100000), soma a parcela uma vez e conserva esse ajuste; limite técnico superior1000000. Não limita silenciosamente o resultado ao máximo. A devolução libera capacidade somente no perfil apropriado. Notas são opcionais, sem justificativas, declarações de revisão ou caixas de aceite.

## Objetos, continuidade e recuperação

Cada jardim, ataúde ou fruto tem registro independente no usuário, identificado por uma descrição curta. Mesmo contrato/objeto ativo não pode ser depositado novamente; caixa/letra e espaços exteriores são normalizados para detectar duplicação. Esta identificação é uma convenção operacional, não verificação física da cena: nomes distintos não provam objetos distintos. O mestre conserva a identidade real na mesa. Perfis não são trocados após depósito. Referências e fonte são congeladas; retirar o Item depois não impede devolver um depósito próprio. Nenhum Actor alvo é escrito.

O evento é uma ação concreta no botão: Técnica cessou, Ataúde se quebrou ou Fruta consumida → devolver CE. O registro retornado conserva histórico e não aceita novo crédito. Rodadas, tempo real, testes de Residual, fim de combate e Encerrar Residual não devolvem CE automaticamente. O objeto pode persistir independentemente de uma vítima; não se presume cessação do jardim inteiro porque um alvo resistiu. Destruição, expiração e cura específicas ainda exigem essa resolução na mesa.

Fila central do mestre responsável, diálogos fora da fila e revalidação de identidade, fonte, estado, recursos, permissões e usuário impedem dois cliques da mesma prévia de debitar/devolver duas vezes. Cada operação prepara diário anterior/posterior; um único Actor.update reúne saldo, objeto e status aplicado. Interrupção antes da aplicação bloqueia novos gastos e permite conferir o registro: estado anterior descarta a tentativa sem repetir débito/crédito; posterior reconhece aplicação. Divergência permite encerrar só a pendência, conservando ajustes para correção manual. Resposta perdida após gravação conserva status aplicado; não repetir a ação sem consultar o painel. Não cria cartão de rolagem ou transação entre Actors. Fila no cliente não substitui CAS do servidor.

Cópias de fichas conservam os dados copiados, mas não herdam a identidade financeira: registros com UUID da ficha original não reduzem seu máximo nem permitem crédito automático. O saldo copiado permanece como estava. Conferir manualmente o que a cópia representa; não devolver automaticamente só para reconstruir dados. Registros inconsistentes são sinalizados e recusam novos depósitos/devoluções; não são normalizados silenciosamente.

Marcas Protetor/Assassino125/130 e Fadas Infernais298/305 também mencionam CE permanente enquanto ativas, mas não têm o mesmo texto explícito de retorno usado aqui; permanecem para contrato próprio. Eir diz Cosmo permanente, sem detalhar CE/atributo no especial: o painel trata o depósito como CE por convenção explícita de campanha; o termo deve continuar na auditoria. Perda irreversível de Cosmo/atributo102/464/637/643 é outro contrato e não foi automatizada. Ações Cosmo/Movimento Parcial, preparo temporal, objetos da cena, múltiplos alvos e estados específicos permanecem no roteiro.

20 novos testes; conferência do core Foundry13.350 e dois clientes ainda pendente. Fonte: livro V49.1.1 de Caio Carvalho Santiago; [atribuição](../ATTRIBUTION.md). Compêndios, IDs, fichas e ajustes conservados. Nenhum PDF ou imagem do livro no pacote.
