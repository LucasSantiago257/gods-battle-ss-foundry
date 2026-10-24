# Pagamento central de técnicas — 0.13.0

É necessário um **mestre conectado** para ativar técnicas. O jogador continua usando **Ativar**, conferindo a prévia e autorizando queima de PV quando houver excesso. O sistema envia uma solicitação privada; o mestre responsável a processa automaticamente e atualiza **o mesmo cartão** com a rolagem e o pagamento. Não exige uma segunda aprovação do mestre a cada ativação.

O mestre verifica autor, propriedade da ficha, técnica, alvo, parâmetros e o pagamento exato autorizado. Recalcula os valores e faz a rolagem no seu cliente. A prévia do jogador não rola nem gasta. O cartão final mantém o autor solicitante e a visibilidade escolhida por ele: público, privado, cego ou somente para si. No modo cego, a notificação ao jogador informa processamento/pagamento, sem revelar o resultado dos dados.

## Concorrência e preservação

Ativações, aplicação/desfazer de dano e confirmação de evolução usam a mesma fila do mestre ativo. Duas solicitações sobre o mesmo estado da ficha não descontam valores antigos duas vezes: a primeira altera o estado/registro; a seguinte exige nova conferência. Isso também vale com CE ilimitada, quando o marcador da ativação invalida a confirmação anterior. Cliques repetidos no mesmo cliente e solicitações pendentes são bloqueados antes de enviar outra ativação.

CE atual, extra, reserva, excesso acumulado e PV seguem as regras existentes. Falha de Asterismo ainda paga CE; falha crítica registra a penalidade para o próximo teste. A gravação do pagamento reúne CE/PV, penalidade e registro no Actor. Não altera técnica, notas, proveniência, armadura, XP ou máximos. Sem mestre ativo, nenhum pagamento/rolagem de técnica é processado.

O controle cobre os fluxos implementados pelo sistema. Edição direta dos recursos, macros e testes genéricos não são transações do servidor. Não há bloqueio global de edição ou garantia contra alterações externas no instante de uma gravação. Dados alterados durante prévia/conferência/rolagem são verificados antes da cobrança; as pendências exigem revisão. A validação real com dois clientes ainda precisa ser executada no Foundry13.350.

## Interrupção e recuperação

Na aba **Combate → Histórico de ativações de técnicas**, consulte os últimos vinte registros exibidos. O sistema conserva o histórico completo para auditoria. Dados privados da rolagem ficam no ChatMessage, sem copiar dados/resultado para o histórico do Actor.

- **Paga e publicada:** pagamento registrado e cartão disponível. Reprocessar a mesma solicitação não cobra nem rola novamente.
- **Paga · conferir cartão:** recursos foram gastos, mas a publicação falhou. **Conferir pagamento / recuperar cartão** publica o resultado já armazenado no mesmo documento, preservando recursos alterados depois. A retomada ao abrir o mundo ou mudar o mestre também tenta essa publicação.
- **Interrompida · conferir pagamento:** não há repetição automática. Novas ativações, dano e evolução dessa ficha aguardam conferência. Se os recursos ainda forem os anteriores, a recuperação encerra sem cobrar; se coincidirem com o estado posterior completo, reconhece o pagamento e recupera o cartão. Não restaura valores silenciosamente.
- **Recursos diferentes / cartão removido ou alterado:** confira e repare manualmente. **Encerrar após reparo manual** permite notas opcionais, registra a revisão e encerra a solicitação. Não restaura CE/PV, não rola e não publica um resultado novo.

Somente o mestre responsável pode recuperar/liberar. Cancelar a conferência conserva o registro. Troca de mestre e reconexão não repetem uma ativação preparada; dados já pagos continuam pagos. Não repetir a técnica apenas porque o cartão demorou ou não apareceu: confira o registro primeiro. Não há desfazer automático de ativação paga; reparos de pagamento são revisados manualmente.

## Validação

Ver [o roteiro do Foundry](validacao-foundry.md). Testes locais verificam concorrência, assinatura/alteração dos dados, proprietário/autoria, CE extra/reservada/ilimitada, queima de PV, privacidade, falhas antes/depois da gravação, recuperação e troca de mestre. São testes de contrato; não confirmam execução no servidor.

APIs oficiais utilizadas: [ChatMessage e applyRollMode](https://foundryvtt.com/api/v13/classes/foundry.documents.ChatMessage.html), [Roll.toJSON/fromData](https://foundryvtt.com/api/v13/classes/foundry.dice.Roll.html). Fórmulas e referências do livro continuam no [guia de técnicas](tecnicas.md); esta entrega altera coordenação/persistência, sem acrescentar regras de jogo.

Ao duplicar/exportar uma ficha que contenha registro interrompido, a recuperação não altera o cartão da original. O mestre deve conferir e encerrar manualmente somente o registro da cópia antes de novas ativações; seus recursos são preservados.

Desde0.14.0, em encontro com controle habilitado, a técnica paga também toda a reserva intacta escolhida de ataque ou defesa, na mesma gravação do Actor. Falha também consome. O registro inclui reserva/quantidade/rodada; recuperação não repete esse gasto. Fora de encontro habilitado não há consumo de ações. Ver acoes.md.


Na 0.18.1, as janelas do mestre para condições, efeitos, Controle, ajustes e recuperações não ocupam a fila enquanto aguardam sua decisão. Outros pagamentos podem prosseguir; a confirmação entra na fila para revalidar os dados e gravar. Se os dados conferidos mudarem, reabra a operação com a situação atual. A gravação continua coordenada no cliente do mestre, sem bloqueio global do servidor.

## Correção0.60.1 — valores estáveis no transporte

O relato de Elevar Cosmo com “O pagamento mudou” foi reproduzido sem mudança de custo ou ficha: expandir as chaves internas de `expectedPayment.updates` já causava uma diferença na comparação antiga. Novas solicitações enviam apenas custo, parcelas de CE atual/extra, excesso, dano corporal autorizado e indicação de CE ilimitada, com versão explícita. São os valores relevantes para a autorização; comandos internos de gravação não viajam nesse contrato.

A coordenação recalcula o pagamento e produz seus próprios comandos de atualização. Solicitações antigas com `updates` planos ou expandidos são compatíveis pelos mesmos valores; esse campo legado nunca é uma fonte de gravação. Alterações reais de custo, distribuição ou PV continuam sendo recusadas antes de rolar/gastar. Propriedade, fila, estado atual, autorização de queima de PV, recuperação e cobrança única permanecem.

Após atualizar o sistema e recarregar os clientes, reabra a ativação que falhou antes de cobrar. Não repita uma ativação já paga: os registros e a recuperação existentes continuam válidos. Não há migração nem alteração de técnica, recurso ou catálogo ao instalar a correção.

Ensaio: técnica de2CE com Elevar3 mostra5CE e dificuldade15. Após confirmar, gasta5CE uma vez e publica o resultado; duplicar o processamento não cobra nem rola de novo. Os testes também cobrem CE extra/reservada/ilimitada, queima de PV, solicitações antigas, valores divergentes e publicação interrompida. O percurso do formulário até a coordenação usa fichas publicadas; a transformação de formato é simulada explicitamente no transporte. Isso não substitui a confirmação no core hospedado13.350/conexões reais.
