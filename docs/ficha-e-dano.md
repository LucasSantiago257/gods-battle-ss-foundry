# Ficha e dano — 0.56.0

**Atacar** fica abaixo dos recursos, antes das abas. Marque um alvo na cena, clique e escolha a habilidade de luta e a quantidade de ações. **Técnicas** mantém a lista e os controles de Configurar/Ativar.

A aba Combate reúne ações da rodada, totais, resistências e efeitos. Habilidades de luta, ajustes, marcações de estado e ferramentas do mestre ficam em seções que podem ser abertas. Evolução fica em História e evolução. Valores e avisos de situação permanecem; os textos gerais de regras e dicas repetidas saíram da ficha. Referências completas continuam nos itens e na documentação.

## Cartões

O cartão destaca resultado, acertos e dano. **Detalhes da rolagem** abre a conta. **Aplicar dano** usa o valor calculado, **Ajustar** permite informar outro valor, **Desfazer** restaura a última aplicação quando os recursos ainda coincidem com o registro.

O proprietário do defensor pode aplicar dano na própria ficha; o mestre pode aplicar nos defensores. Observadores não veem esses controles. Não existe etapa de aprovação do mestre: com o mestre conectado, o clique é processado automaticamente. A coordenação central continua necessária para serializar alterações concorrentes; sua mensagem interna não aparece no chat.

**Pendente** indica que o dano ainda não foi aplicado. **Aplicando…**, **Aplicado**, **Desfeito** ou **Conferir aplicação** refletem o processamento e o registro da ficha. Aplicar/Ajustar ficam bloqueados durante processamento ou após aplicação. Mudanças posteriores impedem Desfazer; operações interrompidas continuam no histórico da ficha para recuperação.

Não reescreve mensagens antigas nem cópias dos personagens. Novos cartões recebem a apresentação compacta; cartões anteriores continuam usando a proteção contra duplicidade e permissões.

## Dano físico e armadura

As pp.417–418 descrevem acertos × máximo(0, nível de ataque + bônus − PA) para os PV corporais. Não foi inferida perda geral de PV da armadura. A habilidade específica de Santo da p.65 não é aplicada a todos. Por decisão de Lucas, exceções de dano físico à armadura são lançadas pelo mestre nos PV da armadura. Técnicas mantêm seu cálculo próprio de dano à armadura.

Lucas confirmou o combate básico em seu servidor; a interface0.56.0 e o fluxo completo com múltiplos clientes ainda precisam de ensaio no Foundry13.350. Testes automatizados e Edge isolado não equivalem a essa validação.
