# Estado e próximas prioridades

## Marcos 0.6–0.9

1. Cálculos: PV cresce a partir do nível 2, contribuição de Vigor separada, bônus divinos, memória de cálculo e máximos manuais preservados. Resistência mantém duas interpretações configuráveis.
2. Efeitos pessoais: motor de contribuições derivadas e cobertura das 358 entradas; 13 automatizadas, 12 parciais, 333 manuais. Pré-requisitos geram aviso e suspensão de efeitos, com exceção explícita. Fichas anteriores mantêm adesão manual.
3. Combate: ataque/defesa comuns, dano confirmado, fila por mestre ativo, journal, desfazer e recuperação explícita de operações interrompidas. Críticos específicos de luta, manobras avançadas e condições permanecem manuais. Consumo básico de ações foi entregue em0.14.0.
4. Criação: assistente de nível 1 em seis etapas, rascunho persistente, benefício do estilo uma vez, importação sem substituir cópias, orçamentos, limites e registro de exceções. Schema 3 conserva fichas anteriores em edição normal.

Validação local: 204 testes, round-trip de 866 Items e três Atores com itens embutidos, templates/JavaScript e empacotamento. A prévia de fichas é conferida no Edge. Esses testes usam um contrato mínimo da API; execução no servidor Foundry 13.350 continua pendente. Ver roteiro validacao-foundry.md.

0.9.2 inclui fichas de exercício de combate e importação preservando cópias existentes; instruções em fichas-teste.md.

0.10.0 inclui evolução assistida 1–30, com escolhas e distribuição em rascunho, pontos não gastos em saldo, conferência de marcos, fila do mestre, preservação e histórico. Ver evolucao.md. Promoções e efeitos ainda manuais permanecem explicitados.

## Trabalho restante

Prioridade humana atual: gameplay. 0.11.0 entrega configuração assistida de técnicas, modo ND/Poder por status, prévia dinâmica de custo/dificuldade/dano, condensação e resistência do alvo marcado. Próximos marcos: ações/turnos e consumo; distância/condições; efeitos específicos de componentes; bloqueio/duelo de técnicas. Conferir fontes/ambiguidades antes de automatizar. Catálogos ficam subordinados a esses marcos enquanto esta prioridade vigorar.

- Validar a atualização real, incluindo dois clientes, permissões, migração e solicitações processadas pelo mestre. Não preencher compatibility.verified antecipadamente.
- Ampliar efeitos pessoais e requisitos estruturados, revisando cada regra e suas combinações; consultar cobertura-automacao.md antes de escolher novos itens.
- Automatizar bônus contextuais, ações, críticos e condições; ampliar o combate para manobras, duração e sustentação.
- Ampliar efeitos/confirmatórios da composição estruturada de técnicas e implementar recuperação; ampliar evolução horizontal e efeitos dos marcos que exigem revisão manual.
- Resolver com a campanha as divergências de resistência, a Virtude Extra do Artista e os detalhes de criação/companhia do Domador. Não inferir bônus ausentes.
- Completar catálogo de artefatos, armaduras específicas e fichas próprias de criaturas/divindades, preservando prioridade das regras de cavaleiros.

Preservar IDs/proveniência dos compêndios e todas as cópias editadas do mundo. Nunca distribuir PDF, imagens, marcas d'água ou informações pessoais do exemplar.

0.12.0 entrega composição personalizada com rascunho, seleção de componentes, graduações, slots/custos, revisão e histórico. Ver tecnicas-personalizadas.md. O mapa atualizado e priorizado está em proximos-desafios.md: ações/turnos, efeitos de componentes, distância/condições e sustentação/duelos. Pagamento central foi entregue em0.13.0, sujeito à validação real.


0.13.0 entrega pagamento central de técnicas, fila compartilhada com dano/evolução, resultado persistente na solicitação, deduplicação e recuperação sem nova cobrança/rolagem. Ver ativacoes.md. Ações básicas/rodadas entregues em0.14.0; validar concorrência/privacidade/reconexão no Foundry real.



0.14.0 entrega reservas por rodada, quantidades confirmadas no ataque/defesa, gasto inteiro na técnica junto com CE, Movimento/Reação registrados, ajustes justificados e recuperação idempotente. Convenção explícita: rodada=turno coletivo; vez não repõe e não bloqueia defesa/reação. Ver acoes.md. Próximo marco: primeiro grupo de Big Bangs/incrementos com efeitos executáveis inequívocos; iniciar por auditoria das regras e cobertura. Iniciativa/simultaneidade, manobras, movimento parcial/total, medição, condições e efeitos de reação ainda manuais.

0.15.0 entrega o primeiro grupo de quatro componentes assistidos por composição salva, com revisão opcional, parâmetros contextuais, custo variável, ND/alcance e auditoria no cartão. Ver componentes-automaticos.md. Não altera a cobertura pessoal358 nem distribui imagens/PDF. Próximo passo: efeitos persistentes com aplicação/revisão/expiração, após esclarecer duração/sustentação e economia de movimentos; Controle Atômico e Controle sobre as Estrelas têm pontos de interpretação documentados.

0.16.0 entrega acompanhamento persistente com origem/alvo/duração e primeiro efeito periódico: Brasas, aplicado por confirmação do mestre, com ajustes, dispensa, conclusão/encerramento e journal recuperável. Outros estados ficam anotados, sem mudar condições/bônus manuais. Cinco componentes têm alguma assistência entre59; não altera a cobertura pessoal358. Ver efeitos-duracao.md. Próximas etapas: contribuições de condições reversíveis e Controle com parâmetros/testes estruturados; Sustentada/Residual/Dreno aguardam oposição, tempo, custo e destino de recursos definidos. Não interpretar duração pelo texto; convenção explícita para primeira rodada e conferência de atrasos.
