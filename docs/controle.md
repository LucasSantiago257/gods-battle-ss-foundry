# Controle: duração e nova resistência paga

Na 0.18.0, técnicas configuradas com efeito **Controle** exibem duração base na prévia e no cartão: Bronze 2, Prata 3 e Ouro 4 rodadas, incluindo a rodada da ativação (livro, p.205). A duração usa a classe configurada da técnica; subir nível/status ou usar Apoiar não redefine essa classe. No construtor, configuração ou edição da cópia, **Duração de Controle** igual a 0 usa a tabela; um inteiro de 1 a 500 substitui a base. É uma escolha explícita para particularidades da técnica/campanha, sem interpretar texto livre.

A resistência usa o Poder Cósmico do cartão. Resultado igual ou maior resiste ao efeito; falha aplica a duração base; resultado estritamente menor que PC − 10 dobra a duração (p.206–207). O crítico do Asterismo não dobra esse prazo. O cartão informa a nova resistência nas rodadas seguintes: 1 CE para Bronze/Prata, 2 CE para Ouro (p.208); na 0.19.0 o mestre pode processar essa tentativa genérica pela ficha com pagamento único e recuperação. Não há aplicação de dano zero para Controle.

## Usar na mesa

1. Inicie um encontro com exatamente um combatente da ficha alvo. Marque esse alvo e ative uma técnica de Controle.
2. Faça a resistência pelo cartão. Para vincular o resultado à ficha, ambos os cartões precisam ser públicos.
3. Na resistência falha, o mestre responsável usa **Registrar duração de Controle**. A janela mostra duração base/final e rodada inicial. Pode ajustar a duração final de 1 a 1000 rodadas; descrição e notas são opcionais.
4. Na ficha alvo, **Combate → Efeitos com duração**, confira cada rodada. Nas rodadas posteriores, ainda dentro do prazo, use **Nova resistência de Controle · mestre**, ou encerre por decisão da mesa. Essa operação acompanha o prazo; não causa dano, não marca estados e não bloqueia ações.

O prazo começa na rodada registrada da ativação. Registrar depois não concede rodadas extras: as antigas aparecem pendentes e são resolvidas individualmente. Avançar ou retroceder o encontro não resolve/reaplica nada automaticamente. A última conferência conclui o prazo. Encerrar não cura, devolve CE ou desfaz estados marcados manualmente.

## Preservação e limites

O vínculo exige ativação paga/publicada, autoria com permissão, alvo original e resistência correspondente. A duração histórica fica congelada; editar/remover a técnica depois não reescreve o resultado. A mesma ativação não pode gerar outro registro na mesma ficha, mesmo encerrado/expirado. Uma nova ativação tem identidade própria; avaliar acúmulo na mesa. Duplicatas de ficha/tokens não reutilizam o registro original.

Cartões antigos sem os novos metadados, resultados privados/cegos/self, encontro ausente/trocado, combatente substituído ou rodada anterior à ativação usam **Registrar efeito · mestre** na ficha, com parâmetros escolhidos manualmente. Não copiar detalhes privados para descrições visíveis sem decidir isso na mesa. A ligação automática nunca importa resultados privados para o Actor.

Estados como Dominado, Medo e Desorientado, limitações de ações, resistência após sofrer dano e suas exceções (p.394–395) permanecem manuais. A referência genérica de novas tentativas não substitui essas regras. Sustentação, Cosmo Residual, oposição e seus custos periódicos ficam para próximos marcos.

Rodada do Foundry representa o turno coletivo nesta integração. Classe configurada como fonte da tabela é uma convenção explícita diante de Apoiar/evolução; ajustar a duração quando necessário. Limites de 500/1000 são guardas técnicas, não limites do livro. Fila no cliente do mestre, sem transação global no servidor. Testes locais e prévias não substituem validação no Foundry 13.350.


Na 0.18.1, as janelas do mestre para condições, efeitos, Controle, ajustes e recuperações não ocupam a fila enquanto aguardam sua decisão. Outros pagamentos podem prosseguir; a confirmação entra na fila para revalidar os dados e gravar. Se os dados conferidos mudarem, reabra a operação com a situação atual. A gravação continua coordenada no cliente do mestre, sem bloqueio global do servidor.


## Nova resistência paga — 0.19.0

O mestre responsável abre a tentativa no registro ativo de Controle vinculado. A janela informa custo e Poder Cósmico original; usa o atributo de resistência da natureza congelada (p.206) nos novos registros. Registros anteriores sem natureza exigem escolher o atributo, sem migração. Modificador, vantagem/desvantagem e CE extra são escolhas mecânicas. Notas são opcionais e não há declaração de aceite.

**Rolar público e gastar CE** executa o teste em nome do alvo e publica no chat e histórico da ficha. Usa a política de resistência do mundo, bônus atuais e condições assistidas. Este fluxo é público por escolha explícita da ação; testes privados/cegos continuam pelo fluxo manual, sem vincular seus detalhes à ficha. A tentativa não consome reserva de ataque/defesa/movimento/reação: é a resistência genérica como ação livre, conferida pelo mestre; exceções de estados exigem o fluxo específico/manual.

O custo é1CE para Bronze/Prata ou2CE para Ouro (p.208), tanto em sucesso quanto falha. CE extra é usada primeiro somente se escolhida; CE reservada é preservada. Sem CE disponível, não rola nem prepara. Não permite ultrapassar o limite do corpo/queimar PV nesta tentativa. CE ilimitada conserva os recursos e registra a tentativa para impedir repetição.

Ao resistir (total >= PC original), a escolha **Encerrar este registro de Controle** encerra somente o registro em um único update junto do pagamento e resultado; **Registrar resultado e manter o prazo** permite conferir separadamente particularidades da técnica. Falhar conserva o prazo original: não reinicia/dobra a duração. Marcas de estados, parcelas de condições assistidas, dano e outros registros permanecem conferidos separadamente. A resistência extra após dano de Dominado, bônus cumulativo de+10, restrição na falha crítica, medo/desvantagem/afastamento/custo para+2 e demais regras das p.394–395 não são inferidas do nome/descrição.

Convenção explícita: uma tentativa genérica por registro em cada rodada posterior à ativação e ainda dentro do prazo, no mesmo encontro/combatente. Rodada representa turno coletivo; este fluxo não confere automaticamente a vez/início de turno. Retroceder não repete tentativas pagas em rodada igual ou posterior. Tentativas especiais adicionais e outras convenções permanecem manuais. A conferência da última rodada já expira o registro e impede nova tentativa.

O histórico usa o journal de efeitos e a fila comum de pagamentos; a janela fica fora da fila. Ficha, origem, condições, recursos, permissões e rodada são revalidados após cada espera antes do débito. Estado desatualizado é recusado. Enquanto a preparação estiver interrompida, outros gastos exigem recuperação. Se o pagamento completou mas o cartão não publicou, **Conferir efeito / recuperar cartão · mestre** publica o mesmo resultado, sem cobrar ou rolar novamente. Uma nova tentativa do mesmo Controle aguarda essa publicação. Valores anteriores encerram uma preparação sem gasto; valores divergentes/cópias exigem revisão, ou **Encerrar sem alterar recursos** após o ajuste manual necessário. A recuperação conserva PV, CE, condições e ajustes atuais; não restaura nenhum recurso.

Se a criação do cartão falhar antes de seu ID ser salvo no journal, pode restar um cartão privado de preparação sem vínculo; ele não deve ser publicado manualmente. Recuperar o journal reconhece os valores anteriores e encerra sem gasto. Fila no cliente do mestre, sem promessa de transação global no servidor. Validação real Foundry13.350 pendente.
