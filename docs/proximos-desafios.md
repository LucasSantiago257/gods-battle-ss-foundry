# Próximos desafios — após 0.30.0

## Diretriz atual — versões maiores para a one-shot (21/10/2026)

Agrupar as próximas entregas em marcos equivalentes a três ou quatro versões recentes, com foco em um combate completo e utilizável na sessão. O marco integrado0.57.0 reúne fluxo ataque/defesa/resistência/dano; construção e uso de técnicas com cálculos claros; alvos e acompanhamento de efeitos; ensaio reproduzível com fichas de exercício. O ensaio hospedado continua pendente. Esta diretriz complementa a prioridade de gameplay e substitui releases de pequenas melhorias isoladas.

Trabalhar o conjunto ao longo das execuções na mesma branch/PR, publicar quando integrado e verificado. Reservar patches antecipados para falhas que bloqueiem uso ou comprometam dados/recursos. Ampliar catálogos e exceções não essenciais sai do caminho crítico da one-shot. Novas condições continuam adiadas; regras ambíguas não serão presumidas. Compatibilidade no core hospedado13.350 segue pendente e não pode ser confirmada apenas por testes locais.


Consulta atual: [cobertura de componentes na0.58.0](componentes-automaticos.md). As seções datadas registram marcos históricos; a contagem antiga de quatro componentes não é a cobertura atual. Prioridades de Lucas permanecem gameplay e poderes independentes de novas condições.

## Prioridade vigente — decisão de Lucas em 14/10/2026

Lucas priorizou os pontos 2, 3, 4, 5 e 6 do mapa `work/mapa-sistema-0.30.0.md`, excluindo o foco em condições. Esta decisão substitui a recomendação anterior de concluir Atordoado primeiro e a ordem histórica abaixo.

1. Simplificar ataque → defesa/resistência → dano: cartão com alvo, resultado e valor calculado, aplicação direta, Ajustar e Desfazer separados; ações rápidas com ajustes opcionais.
2. No ponto 3, trabalhar apenas o painel e a duração de efeitos: ativos separados do histórico, prazos claros e menos conferências sem decisão útil. Adiar novos gatilhos, resistências, bloqueios e recuperação de condições, inclusive Atordoado, Paralisado e Surpreso.
3. Ampliar Big Bangs/incrementos executáveis e melhorar construção/configuração das técnicas, começando pelos cálculos e efeitos que não dependam de novas condições.
4. Implementar distância, áreas e múltiplos alvos, com prévia e resolução individual, sem repetir custos/dano.
5. Completar exceções de poderes avançados de Sustentada/Residual, Marcas, Fadas e Ataúde, preservando regras e adiando a automação de condições associadas.

Preservar as condições já entregues e suas proteções. Validar cada marco com testes adequados; validação no servidor continua transversal e não foi presumida. Não retomar Atordoado apenas por ser o próximo passo nas seções históricas.

Prioridade atual definida por Lucas: gameplay. Já existem fichas, catálogos para arrastar, criação/evolução assistidas, personagens de exercício, ataque/defesa, resistência, dano confirmado com desfazer, configuração/prévia de técnicas, composição personalizada e pagamento central compartilhado com dano/evolução. Isso permite exercitar o fluxo básico; não significa automação integral do livro ou validação do servidor.

## Sequência recomendada

| Ordem | Desafio | Impacto/dependência | Critério de conclusão |
|---|---|---|---|
| Entregue · validar | Pagamento de CE/PV em fila central (0.13.0) | Compartilhada com dano/evolução; confirmações desatualizadas recusadas e recuperação do mesmo resultado. Base para ações e efeitos recorrentes. | Testar no servidor com dois clientes, privacidade, troca de mestre e reconexão. Ver ativacoes.md. |
| Entregue · validar | Reservas de ações por rodada (0.14.0) | Ataque/defesa por quantidade, técnicas com reserva inteira, Movimento/Reação registrados, ajustes/reparo do mestre e fila comum. | Testar encontros, rodadas, tokens, concorrência e recuperação no servidor. Iniciativa/simultaneidade e manobras especiais continuam manuais. Ver acoes.md. |
| 3 · alto · parcial | Efeitos executáveis de Big Bangs/incrementos | 0.15.0 calcula quatro componentes;0.16.0 acompanha duração e Brasas com dano periódico confirmado, sem cobrança ao avançar rodada. 0.18.0 calcula e registra duração de Controle vinculada à resistência pública; 0.19.0 adiciona nova resistência genérica paga pelo mestre, com encerramento e recuperação; exceções de estados manuais. Ver componentes-automaticos.md, efeitos-duracao.md e controle.md. | Parâmetros estruturados, confirmação própria, duração/alvo/efeito rastreáveis; contribuições futuras removidas na expiração; componentes manuais sinalizados. Reproduzir exemplos do livro. |
| 4 · alto · parcial | Distância, área, múltiplos alvos e condições | Alcance registrado; penalidade/geometria manuais. Fluxo genérico admite um alvo.0.17 aplica parcelas opcionais de Cansado/membros debilitados e0.25 Desorientado.0.27 registra Paralisado e bloqueia movimento/ataque/defesa monitorados; resistência/duração seguem manuais. Ver condicoes-assistidas.md. | Medir conforme cena/token; prévia da penalidade; resistência por alvo; impedir aplicação em alvo trocado; duração/remoção e efeitos explícitos das condições. Classificar ações de técnicas fora do controle de reservas antes de aplicar exceções de Paralisado. |
| 5 · alto · parcial | Sustentação, Cosmo Residual, bloqueios e duelos | 0.20.0 registra fase inicial e recarga1CE no usuário, por perfil explícito por rodada/único, com histórico e recuperação. 0.21.0 resolve oposição genérica pública por atributo/Cosmo ativo/passivo com recuperação do mesmo resultado. CE adicional, manobra completa, mistos e Residual manuais. Ver sustentada.md e oposicao-sustentada.md. | Estado persistente, custos periódicos confirmados, interrupção sem cobrança indevida, duelos com participantes/permissões/referências. Resolver ambiguidades antes de codificar. |
| 6 · médio | Recuperação e evolução horizontal | Subir de nível conserva recursos atuais; não cura. Descanso, armaduras, promoção, aprendizagem/desenvolvimento e trocas de virtudes exigem revisão. | Comparação, tempo/custo, limites e confirmação; conservar ajustes manuais; registrar aprendizado/promoção sem ganhos retroativos não conferidos. |
| 7 · médio | Poderes pessoais, armaduras/artefatos e fichas específicas | Há866 Items do livro; catálogo não implica cobertura integral. Das358 entradas pessoais,13 automatizadas,12 parciais,333 manuais. Armaduras/artefatos específicos e criaturas/divindades precisam de auditoria/implementação. | Matriz por página/regra, IDs/proveniência estáveis, efeitos testados em combinação sem duplicar benefícios; fichas próprias após mapear suas regras. |

Recomendação: validar pagamento/ações/Controle; novas resistências genéricas de Controle com pagamento e encerramento foram entregues na0.19.0. Registro/recarga genéricos de Sustentada entregues na0.20.0. Oposição genérica por perfis entregue na0.21.0. Próximo grupo mecânico é Residual e suas condições/dias/depósitos, depois exceções de estados com seus gatilhos explícitos. Implementar pequenos grupos de3 que tornem as técnicas mais úteis na mesa.4 e5 ficam mais simples com essas bases. Iniciativa/simultaneidade, alocação de movimento parcial e consumo de manobras especiais precisam de um próximo passo específico, com conferência das fontes. Os catálogos seguem disponíveis e preservados enquanto gameplay avança.

## Validação transversal

Testes locais não substituem o core do Foundry. Ensaiar em mundo de teste13.350 com mestre e dois jogadores: atualizar pelo manifesto, reabrir fichas antigas, arrastar compêndios, salvar campos do construtor, ativar/resistir, rolagens privadas/cegas, aplicar/desfazer e recuperar operações. Conferir atores e tokens vinculados/não vinculados, mestre ativo e reconexão. Só então registrar compatibilidade verificada. Usar [fichas de exercício](fichas-teste.md) e [roteiro](validacao-foundry.md).

A fila central cobre técnicas, dano e evolução desde0.13.0. Confirmar concorrência no servidor; edição direta/macros e testes genéricos continuam fora da coordenação central. Operações preparadas exigem recuperação explícita.

## Decisões de campanha pendentes

Resistência mantém duas interpretações documentadas/configuráveis. Também pendem a Virtude Extra do Artista e detalhes de criação/companhia do Domador. Ambiguidades adicionais devem ser registradas com página e consequência; não inferir bônus, promoção ou requisitos ausentes. Efeitos manuais continuam acessíveis enquanto essas decisões aguardam.



## Atrito da fila corrigido na 0.18.1

Decisões humanas de condições/efeitos/Controle/ajustes/recuperação passam a ocorrer fora da fila. A gravação permanece serializada e revalidada. Corrige U01 do mapa de atritos da0.18.0; não muda a sequência de novas regras nem implementa todos os ajustes de UX sugeridos. Nova resistência paga de Controle/encerramento entregue na0.19.0, com exceções do livro conferidas e mantidas manuais; próximo grupo é sustentação/oposição.


Auditoria de fontes para Sustentada/Residual concluída na0.19.1: ver [regras, exceções e contratos](sustentacao-residual-auditoria.md). A resistência desses efeitos não gera aplicação de dano. Registro/recarga1CE com frequência escolhida foram entregues na0.20.0; oposição genérica pública entregue na0.21.0; segundo Asterismo/valor fixo de Residual entregue na0.22.0; resistências diárias, depósitos e exceções permanecem manuais. Recarga1CE é distinta do dano à armadura1/2/3; dupla resistência/oposição, empate, dias e depósitos precisam dos perfis descritos antes de automatizar.


## Após0.22.0: Residual registrado, dias e depósitos pendentes

[Segundo Asterismo e PC fixo](cosmo-residual.md) publicados com vínculo ao efeito inicial e recuperação. Próximo contrato: resistência ao valor fixo, dias da campanha e perfil explícito para bônus cumulativo/tentativas (ambiguidade p.225), sem usar rodada como dia. Depois, depósitos permanentes e devolução ao encerrar apenas para técnicas com valores/regras próprios, como Rosa Diabólica/Pólen281–282. Objetos e múltiplos alvos precisam representação própria. Ação de Cosmo + Movimento Parcial224 não está representada pela reserva inteira atual; permanece manual. Exceções de Sustentada, condições/ações específicas, execução por jogador/privada, armaduras/artefatos e auditoria final dos catálogos continuam pendentes.


## Após0.23.0: resistência ao Residual entregue; depósitos específicos pendentes

[Resistência ao valor fixo](resistencia-residual.md) calcula teste e cumulativo com perfis explícitos; dias da campanha informados, sem calendário real/rodadas. Sucesso encerra registro sem alterar alvo, condições ou depósitos. Próximo contrato: depósitos deCE e devolução, exclusivamente conforme cada técnica (Rosa Diabólica/Pólen281–282), distinguindo custo consumido, reserva e redução permanente de máximo. Conferir cancelamento, encerramento, sucessos, múltiplos depósitos/objetos e recuperação antes de automatizar. Ações de Cosmo/Movimento Parcial, objetos/múltiplos alvos, exceções de Sustentada/estados/ações, jogador/privado, armaduras/artefatos/auditoria final e15UX propostos continuam pendentes.


## Após0.24.0: depósitos específicos entregues; próximos contratos

[Depósitos/devolução de CE](depositos-ce.md) para Rosa/Pólen, Ataúde e Eir: quantidade e evento congelados, saldo/capacidade escolhidos, objetos independentes, diário e retorno único. CE permanente não tem semântica universal inferida; preparo, ativação e estados seguem separados. Próximo grupo: exceções concretas de Controle/Sustentada/Residual e contribuições reversíveis de estados, começando por mapear gatilhos do livro (sem automatizar morte/ilusão sem contrato). Ações Cosmo/Movimento Parcial e manobras completas ainda precisam representação própria. Marcas/Fadas com custos permanentes, sobrevivência em Ataúde, objetos da cena/múltiplos alvos, execução por jogador/privada, armaduras/artefatos e auditoria final de cobertura continuam pendentes. Validar13.350 no servidor com dois clientes antes de afirmar compatibilidade verificada.


## Após0.25.0: Desorientado parcial e ajuste de condições

Sentidos perdidos passam a aplicar modificador/perda de dados conferidos; campo final explícito resolve outra interpretação da falha crítica. Ajustar condição evita encerrar/recriar Cansado/membros/sentidos e conserva histórico/recursos. [Contrato](condicoes-assistidas.md). Resistências próprias e gatilhos/duração/progressão de cada técnica seguem separados. Próximo grupo concreto: Atordoado/Paralisado/Surpreso e reserva de Ação de Cosmo/Movimento Parcial, com representação própria antes de bloquear ações ou inferir execução de técnicas. Auditar dano acumulado por turno/limiar70% e duração de uma rodada, sem automatizar morte ou dano ilusório por equivalente. Privado/jogador, distância/áreas/multialvos, marcas/Fadas/sobrevivênciaAtaúde, armaduras/artefatos/auditoriafinalcatálogo permanecem pendentes.


## Após0.26.0: Movimento Parcial/Total e Ação de Cosmo

Parcelas de movimento iguais à Velocidade efetiva, total intacto e contador de Cosmo sem reserva arbitrária estão representados. Segundo Asterismo de Residual registra parcela+Cosmo atomicamente com resultado/penalidade; não cobra CE outra vez, nem reservas de luta. Legados/cópias/ajustes/recuperação preservados. Metros/penalidades de corrida/salto e execução de outros poderes continuam manuais. [Contrato de ações](acoes.md).

Paralisado pp.395–396 entregue parcialmente na0.27.0: bloqueia ataque, defesa e movimento, mantém Cosmo/Reação, com remoção manual após resistência/efeito. Técnicas selecionadas como Ataque/Defesa e Residual também respeitam o bloqueio; fora do controle, categoria especial de técnica continua manual. Próximo grupo é Atordoado, que depende de dano agregado por turno/limiar70%PV/CD fracionária e prazo de uma rodada, seguido de Surpreso com iniciativa/ação atual. Movendo299 e outras ações compostas ainda exigem representação própria. Jogador/privado, distância/áreas/multialvos, marcas/Fadas/sobrevivênciaAtaúde, armaduras/artefatos e auditoriafinal permanecem pendentes. Catálogos intactos; Foundry13.350 real pendente.

## Após0.27.0: Paralisado parcial

As validações do estado ocorrem no fluxo de rolagem/gravação e antes de consumir parcelas; registros de Paralisado são próprios da ficha. Resistência, gatilho, CD, custos de novas tentativas e duração até efeito/recuperação não são simulados. Reações permanecem permitidas por não estarem classificadas como luta ou movimento neste contrato. Técnicas executadas sem controle ativo de ações ainda não carregam classe de ação, então não se infere bloqueio nem exceção. Próximo contrato: Atordoado com acúmulo de dano por turno; conferir arredondamento para CD10 + dano/10 e significado operacional de perder uma rodada antes da implementação.

## Auditoria do próximo marco — Atordoado (fonte conferida em 2026-10-11)

A regra geral está em p.396. O gatilho usa dano recebido acima de 70% dos PV totais em um turno; exatamente 70% não ultrapassa o limiar. Ao gatilho, o alvo faz TAP de Vigor para evitar Atordoado; CD = 10 + 1/10 do dano. Falhar aplica o estado, que toma uma rodada completa para se recuperar. A técnica Big Bang Atordoar é outro gatilho (chance definida por técnica) e não deve ser confundida com este limiar geral. O estado decorrente de elevar dano acima do Vigor na tabela p.419 é uma regra diferente.

Contrato de implementação proposto, mantendo as convenções já documentadas em `action-rules.mjs`: acumular somente dano corporal efetivamente aplicado ao PV (após mitigação de armadura) ao longo da rodada coletiva do Foundry, comparar estritamente `sum > maximumHealth * 0.70`, e emitir no máximo uma resistência por ator/combate/rodada. O primeiro cruzamento é o que dispara o teste; CD conserva o valor matemático sem arredondamento (`10 + sum / 10`), pois a fonte não especifica arredondamento. Um registro de dano por combate/rodada deve integrar o journal de aplicar/desfazer para evitar duplicação em recuperação e para reabrir corretamente após undo.

Convenção operacional proposta para “uma rodada inteira”: se falhar, bloquear todas as ações do cavaleiro até que passe sua próxima ativação completa no rastreador, incluindo movimento, luta, Cosmo e reação; então expirar o bloqueio. A fonte não define a relação com ordem de iniciativa nem o que ocorre sem combate; manter ativação/iniciativa ausente como manual. O próximo código precisa marcar o intervalo por combatant/epoch e testar os casos em que o dano ocorre antes ou depois da ativação do alvo. Não introduzir arredondamento, imunidade, resistência repetida ou efeito colateral de armadura sem fonte. Teste de Vigor deve poder ocorrer mesmo sob o bloqueio; nunca consumir ação para a resistência.


## Após 0.30.0 — gatilho e CD de Atordoado acompanhados

0.29.0 associa dano corporal aplicado ao encontro/rodada registrado no cartão, soma dano persistido ainda aplicado, retira parcelas desfeitas e exibe o cruzamento estrito de70% dos PV totais. A 0.30.0 mostra a CD `10 + dano/10` sem arredondamento. O alvo precisa participar de um único encontro iniciado; cartas sem contexto compatível continuam manuais. Próximo passo: resolver uma TAP Vigor uma única vez no primeiro cruzamento, com operação recuperável e sem nova rolagem por replay; falha deve registrar Atordoado no alvo. Depois, expirar o bloqueio na ativação completa correta; testar dano antes/depois da vez do alvo e ausência de iniciativa. Não misturar Big Bang Atordoar nem a tabela de dano por elevar Vigor.


## Após0.37.0: prévia de distância em um alvo

[Medida informativa](distancia-alcance.md) entre centros pela grade, origem inequívoca e unidade em metros, com comparação ao alcance efetivo e atualização explícita. Não altera cálculos. Próximo contrato tático: congelar/revalidar geometria na fila e aplicar redução de ND/PC uma vez conforme p.204, antes de áreas e múltiplos alvos. Elevação, paredes/cobertura, formas e alcance zero continuam manuais. Novas condições permanecem adiadas.


## Após0.38.0: redução de ND por distância em Dano

[Opção de distância na ativação](distancia-alcance.md) reduz ND por faixa iniciada de1,5m além do alcance configurado, com geometria congelada da prévia e revalidação na fila central, pagamento único e recuperação do resultado original. Mesma elevação, um alvo, metros e ND normal final pelo menos1; não inventa semântica de NDzero. Controle/Sustentada (modificador positivo do PC), piso/exceções, áreas e múltiplos alvos são os próximos contratos táticos. Novas condições seguem adiadas.


## Após0.39.0: distância em Controle/Sustentada

A [redução por distância](distancia-alcance.md) agora desconta PC de Controle/Sustentada dentro da parcela positiva além de10+Modificador de Nível, incluindo Elevar. Snapshot e recuperação compartilhados com Dano; nenhuma nova condição. Exceder essa parcela permanece manual, sem inferir piso universal ou bônus negativo. Próximo marco tático: áreas/múltiplos alvos com custo único e resolução individual; depois exceções de poderes conforme prioridades.


## Após0.40.0: manobra de área com múltiplos alvos

[Área](tecnicas-area.md) em Dano com Asterismo3: alvos marcados, custo e Asterismo únicos, dificuldade conforme exemplo p.210, dano corporal dividido, reservas de ataque+defesa, resistência/aplicação/desfazer por defensor e recuperação do cartão congelado. Formas/orientação/cobertura, alcance e redução por distância individual permanecem manuais. Próximo marco tático: prévia geométrica e distância por alvo, sem repetir custos; áreas especiais/cooperativas e exceções conforme fontes. Novas condições seguem adiadas.


## Após0.41.0: distâncias por alvo e atualização da área

A [tabela de área](tecnicas-area.md) mostra distância/situação de cada alvo e atualiza posições dos mesmos tokens, sem fechar a janela. Medição informativa, preservando custo, parcelas, identidade, fila e recuperação. Próximo contrato: geometria (cone/raio/orientação/inclusão) e combinação de distância com divisão de dano conforme pp.204/210, sem adotar ordem de cálculo silenciosa. Novas condições adiadas.


## Geometria de referência — 0.42.0

Na janela de área, abra **Forma de referência (opcional)** e escolha círculo ou cone. O desenho usa o alcance efetivo como raio/comprimento e representa os centros dos tokens originais, numerados conforme a tabela; U marca a origem. Direção 0° aponta à direita e 90° abaixo. A abertura inicial de 90° é parâmetro visual ajustável, não regra extraída do livro. Círculo é uma referência disponível à mesa, não uma interpretação obrigatória da palavra “raio” da p.204. O livro cita formas e alcance, mas não se adotou um ângulo obrigatório.

A referência é plana, euclidiana, em metros e na mesma elevação. A tabela continua medindo pela grade/diagonais do Foundry e pode diferir do desenho. “Centro dentro/fora da referência” não decide acerto, interseção com bordas de tokens, paredes, cobertura ou linha de visão. Não há seleção automática, filtro do grupo, template persistente na cena, alteração de CE/ações/DC/dano ou inclusão de coordenadas novas no cartão/ficha. Para mudar o grupo, reabra a ativação.

**Atualizar prévia da área** conserva os mesmos UUIDs e atualiza posições, distâncias e referência. Origem ambígua, unidade/escala/alcance inválidos, parâmetros visuais incompletos ou cena indisponível deixam o desenho manual sem bloquear por si só a ativação. Tokens ocultos/externos/trocados não são desenhados; elevação diferente não é classificada como fora. Erro de atualização remove o desenho anterior. Validações já existentes de alvos, movimento, permissão e cobrança única continuam valendo.

A combinação da redução individual de distância (p.204) com a divisão de dano (p.210) continua manual, sem inventar ordem de cálculo. Próximos contratos: distância por alvo com fórmula explícita; ampliar componentes executáveis e exceções de poderes sem novas condições. Validar no core hospedado13.350 seleção da origem, tokens sintéticos, atualização/movimento e permissões. A prévia Edge isolada não confirma compatibilidade do servidor.


## Após0.43.0 — Enfraquecer na resistência da ativação

O grupo4 automatiza a graduação efetiva do atributo-chave de Enfraquecer (p.227) na resistência contra a própria ativação de Dano; combina parcelas com Destruição, sem novo estado. Cópias antigas preservadas até salvar Configurar; cartão congela atributo/graduação, mestre revalida, recuperação não recobra. Ver [componentes automáticos](componentes-automaticos.md). O efeito em outros testes contra o PC do mesmo usuário continua manual: duração/escopo entre técnicas não foram inventados.

Sete componentes possuem cálculo neste grupo (Esgotar, Essência Alvo, Terreno Favorável, Espaço, Estrelas, Destruição e Enfraquecer); Brasas tem fluxo periódico próprio. Isso não altera a matriz separada de poderes pessoais nem implica cobertura integral do livro. Próximos contratos: ampliar componentes/exceções independentes de novas condições; distância por alvo em área depende de fórmula explícita que combine pp.204/210. Preservar prévia geométrica apenas informativa e os fluxos publicados. Validar a resistência real em13.350 com mestre/jogadores, cópias antigas, tokens sintéticos e recuperação.


## Prazos visíveis e pendências primeiro — 0.44.0

O painel Efeitos com duração mostra a quantidade de rodadas por conferir e de recargas de Sustentada pendentes. Registros com pendências ficam antes dos demais ativos; o histórico continua recolhido e preservado. O resumo de cada registro traz o prazo mesmo fechado. Detalhes com ação disponível de rodada, recarga ou oposição abrem diretamente, conservando os mesmos botões e permissões.

Brasas e anotações manuais mostram próxima rodada, fim do prazo e parcelas restantes, incluindo as atrasadas. Uma parcela aplicada ou dispensada sai da contagem; retroceder o encontro não recria parcelas já registradas. Passar do prazo sem resolver mantém as rodadas pendentes, sem expirar/aplicar/dispensar automaticamente. “Rodadas pendentes” conta parcelas de registros, não rodadas únicas do encontro.

Sustentada distingue prazo inicial (incluindo a rodada atual), manutenção coberta, recarga atual pendente e perfil de recarga única já pago. Lacunas são indicadas sem somar cobrança retroativa. A contagem de recargas é de registros pendentes, não promessa de gasto automático; pagamento, recursos disponíveis, recuperação e estado alterado continuam sendo validados pelo fluxo existente. Residual continua usando dias da campanha, sem converter rodadas em dias.

Cena/combatente indisponível, registro inválido ou cópia de outra ficha mostram prazo para conferência, sem fabricar contagens. Jogadores podem ver os prazos dos registros já disponíveis na ficha, mas continuam sem ações de mestre. Essa leitura não grava flags, recursos, dano, condições ou prazos novos; não resolve automaticamente nenhuma parcela. O painel não implementa condições ou novas mecânicas de poderes. Validar também no core hospedado13.350, que não foi presumido nesta entrega.


## Suporte de execução no construtor — 0.45.0

O resumo da composição informa quantos componentes escolhidos possuem cálculo disponível em Ativar, quantos usam rodadas assistidas e quantos permanecem manuais. Cada componente mostra essa indicação mesmo fechado e explica o passo seguinte ao abrir sua referência. A informação acompanha IDs/chaves canônicos e o primordial escolhido; nomes livres não anunciam automação.

Os sete componentes do grupo de Dano são identificados como cálculo disponível após concluir e habilitar em Configurar: Esgotar, Essência Alvo, Terreno Favorável, Espaço, Estrelas, Destruição e Enfraquecer. A indicação cobre somente as parcelas já implementadas e suas opções; não afirma execução integral de cada texto. Enfraquecer mantém a extensão a outros ataques manual. Brasas é identificado como fluxo separado no painel Efeitos com duração, após ativação/resistência; o construtor não promete criar esse registro automaticamente.

Outros primordiais e composições mistas não anunciam o grupo automático de Dano. Custos/slots continuam calculados, enquanto efeitos específicos manuais permanecem disponíveis nas referências. A prévia de dano do construtor é a base da composição; as escolhas contextuais do grupo entram na ativação. Ler o suporte não altera fichas, recursos, rascunho, adesão aos componentes ou histórico salvo. Não adiciona novas regras, condições ou componentes executáveis.

Próximos contratos mecânicos exigem distinguir custos, dano, duração e alcance nas fontes. A leitura atual não inferiu como repetir/cobrar Sacrifício em falha, como combinar divisão de dano de área com distância individual ou como converter o “+1ND na Armadura” de Quebrar Armadura entre faixas de proteção. Esses pontos permanecem manuais até contrato explícito; não foram implementados por suposição. Foundry hospedado13.350 continua sem validação.


## Aplicar parcela e Ajustar separados — 0.46.0

No registro válido de Brasas, o mestre responsável pode usar **Aplicar N PV · rodada R** para aplicar diretamente a parcela exibida, sem abrir outro diálogo. Anotações manuais oferecem **Registrar rodada R**, sem dano. **Ajustar rodada R** conserva a janela anterior para dano final diferente, dispensa da rodada e notas opcionais. A ação direta registra uma única parcela, incluindo quando está atrasada; não resolve todas as pendências do painel.

O botão carrega a rodada e uma assinatura da prévia. Se ficha, PV, registro, encontro ou rodada mudarem, a aplicação é recusada até atualizar a ficha. Dois cliques simultâneos ou um botão antigo não aplicam a próxima parcela atrasada. O mestre responsável recalcula a parcela do registro; valores externos não substituem seu dano na ação direta. Registros inválidos, cópias, falta de propriedade ou mestre secundário não recebem esse atalho. Permissões e operação interrompida continuam sendo conferidas no processamento.

A aplicação usa a mesma fila, journal preparado e gravação conjunta de PV/rodada/conclusão do fluxo anterior. Falha ou resposta perdida continua sendo recuperada pelo registro, sem repetir PV. Não cobra CE, não altera armadura/ações/condições e não aplica nada ao avançar o combate. Cabe ao mestre usar Ajustar quando houver imunidade, redução ou dispensa. A ação concreta substitui o diálogo de conferência do valor padrão; não exige justificativa ou aceite.

Não altera a regra de Brasas, sua classificação ou duração; apenas agiliza um cálculo já publicado. Fonte da parcela: p.225; atribuição preservada no catálogo. Validação no core hospedado13.350 continua pendente, principalmente concorrência, reconexão e fichas sintéticas.


## Recarga direta e Ajustar separados — 0.47.0

O painel de Sustentada oferece **Pagar 1 CE extra/atual · rodada R**, mostrando de qual reserva será retirada a recarga. A ação direta usa CE extra primeiro; sem ela, usa somente CE atual livre, preservando a reserva. Com CE ilimitada, o botão indica **Registrar recarga ilimitada** e conserva os saldos. **Ajustar recarga** mantém o diálogo existente para escolher outra preferência de CE extra e notas opcionais. A preferência do diálogo anterior não foi alterada.

O atalho só aparece ao mestre responsável, com pagador/alvo próprios, saldo e registro válidos e sem operação bloqueada. Rodada e assinatura da prévia incluem o pagador, o alvo e o registro. Qualquer mudança antes ou durante o processamento exige atualizar a ficha; um botão antigo ou cliques simultâneos não pagam a próxima rodada. Valores e preferência recebidos de fora não substituem o custo fixo/preferência explícita dessa ação direta.

Mantém o contrato já publicado de Sustentada: nenhuma cobrança ao avançar o combate, 1CE somente na rodada atual, lacunas registradas sem retroatividade, perfil único sem nova cobrança posterior e recarga sem vencer oposição. Alvo, PV, armadura, ações e condições permanecem no fluxo anterior. A fila, journal preparado e recuperação impedem repetir débito após falha ou resposta perdida. Não usa sobrecarga de PV para recarga sem CE livre.

Essa entrega reduz passos de um pagamento já existente; não implementa novos poderes ou condições nem muda a interpretação de manutenção escolhida pela mesa. Fontes e convenções seguem [Sustentada](sustentada.md). Validar concorrência, reconexão e fichas sintéticas no core hospedado13.350, ainda não confirmado.


## Defesa física direta — 0.48.0

O cartão de ataque físico oferece **Defender com 1 ação · rodada R · sem bônus**, sem abrir um diálogo. A graduação de Esquiva/Bloqueio, modificador de nível e condições já existentes continuam entrando no cálculo. É uma escolha explícita de uma única ação da reserva de defesa, permitida fora da vez do defensor; não usa toda a reserva nem muda a regra de combate. **Ajustar defesa** conserva o diálogo anterior, com quantidade escolhida e modificador situacional. Fora de controle ativo, continua disponível esse fluxo anterior.

A prévia exige propriedade, graduação válida, reserva disponível, encontro/rodada compatíveis e nenhuma solicitação pendente ou defesa já registrada para o ataque. Se ficha, ataque ou rodada mudarem após renderizar, o primeiro clique não rola nem envia solicitação; o botão atualiza sua prévia. O processamento responsável continua conferindo autoria, visibilidade, alvo, condições, quantidade, permissões e assinatura. Não muda CE, armadura ou regras de condições. Uma resposta perdida usa a recuperação existente sem novos dados ou gasto duplicado.

A ação direta conserva o vínculo entre ataque original, resultado da defesa e Aplicar/Ajustar/Desfazer dano. A quantidade escolhida no diálogo ajustável mantém o comportamento anterior; não foi substituída por uma escolha automática. Cartões antigos já publicados mantêm o botão antigo até serem recriados, enquanto o novo cartão inclui o atalho. Nenhuma alteração de dados persistidos exige migração. Validação no core hospedado13.350 segue pendente.


## Consulta de efeitos e histórico — 0.49.0

O painel permite buscar por nome do efeito, técnica de origem, alvo e referência de página. Termos separados por espaços são combinados; maiúsculas e acentos não fazem diferença. A seleção separa todos, ativos/pendentes, registros com parcelas ou recargas pendentes e histórico. A contagem mostra quantos registros correspondem, enquanto os totais gerais de rodadas/recargas continuam visíveis. Limpar filtros restaura a visão completa. O histórico abre quando a busca encontra registros nele ou ao escolher Histórico.

Preferências ficam somente na instância da ficha e são reaplicadas ao renderizar após atualização de PV, CE ou rodadas; fechar e reabrir uma nova ficha volta ao padrão. Nenhum dado de busca vai ao Actor, Item, chat ou mundo. Campos de consulta não disparam submitOnChange da ficha, nem Enter envia o formulário. Filtrar não seleciona, encerra, paga, aplica dano ou muda permissões e regras. Registros ocultos por filtro continuam existindo; totais exibidos nos títulos são os totais gerais. “Com parcelas/recargas pendentes” usa os prazos já calculados e não promete reunir novas resistências, oposições ou condições.

Não implementa novos gatilhos ou mecânicas de condições. Próximos contratos de poderes e auditoria de cobertura continuam pendentes; ambiguidades anteriores foram preservadas. A verificação em navegador isolado não substitui o core hospedado13.350.


## Big Bang Movendo na ativação — 0.50.0

Técnicas personalizadas com composição salva contendo o Big Bang Movendo podem usar **Configurar → Ações na ativação → Movendo Parcial / Total**. É um parâmetro concreto escolhido conforme a técnica, independente do grupo de cálculos de Dano. Não se infere o modo pelo nome, classe ou texto livre. O componente é conferido por UUID/chave canônicos, tipo, graduação única e composição sem primordial extra; importar o Big Bang solto não habilita a exceção. Cópias existentes mantêm a reserva de luta padrão até a escolha explícita. Recriar a composição desliga Movendo para nova configuração.

Na ativação, o mestre confere novamente a composição e o modo salvo. Parcial consome uma parcela de movimento; Total exige a reserva de movimento intacta e consome todas as parcelas calculadas pela Velocidade efetiva. Conserva as reservas de ataque/defesa e o contador de Ação de Cosmo. O consumo é gravado junto ao pagamento de CE e à penalidade de Asterismo, inclusive se o teste falhar. Não acrescenta CE além do custo já composto, não concede deslocamento extra e não move o token. Fora de controle ativo, o movimento fica conferido na mesa sem alterar reservas; bloqueios já existentes continuam respeitados.

O cartão mostra modo, parcelas consumidas e rodada. Estado ou modo alterados antes de gravar interrompem sem gasto; recuperação de publicação perdida reapresenta o mesmo resultado sem repetir movimento, CE ou dados. Área com Movendo permanece manual: não foi inferida precedência entre a exceção de movimento e todas as reservas de luta exigidas pela manobra de área. O fluxo cobre ativação simples de Dano, Controle e Sustentada; Cosmo Residual e composições mistas permanecem manuais. Outros efeitos dos poderes, condições e reações continuam com seus contratos atuais.

Fonte: Big Bang Movendo, p.229; o livro também distingue usos parciais (Teletransporte, p.299) e totais em técnicas específicas. Não foi inventada regra geral de modo por classe. Catálogo/atribuição de Dhoko de Libra, licença CC BY-NC-SA4.0, preservados. Validação no core hospedado13.350 segue pendente.


## Movendo em cópias do catálogo — 0.51.0

A configuração de ações da0.50.0 agora reconhece cinco referências já publicadas do livro: Lança Dourada oferece Total (p.272), Teletransporte oferece Parcial (p.299), Velocidade mental oferece Parcial (pp.238–239), Velocidade física oferece Parcial (pp.256–257) e Velocidade (Ar) oferece Parcial (pp.334–335). A lista depende da chave de origem conhecida e da referência canônica única de Movendo. Nome, descrição livre ou Big Bang importado separadamente não habilitam o modo. Duplicata do componente, referência removida, origem desconhecida, técnica marcada manualOnly ou mais de um primordial citado mantêm a aplicação manual. Nenhum modo é deduzido pela classe.

Cada cópia mantém Reserva de luta padrão até configurar explicitamente o modo impresso. O menu de uma técnica do livro oferece somente Padrão e esse modo; composições personalizadas continuam podendo escolher Parcial ou Total conforme sua regra. Não reimporta nem substitui técnicas, não muda IDs/catálogos e não soma o custo de Movendo novamente. Asterismo, CE, parâmetros manuais e requisitos já existentes continuam os da cópia configurada. Origem/referências entram na assinatura usada na configuração e ativação; mudanças antes ou durante o teste impedem gastar com a referência anterior.

A execução utiliza a mesma gravação conjunta de CE/movimento, histórico e recuperação da0.50.0. Total exige reserva intacta; Parcial consome uma parcela; ataque/defesa permanecem disponíveis. Não teletransporta tokens, altera classificação de velocidade, executa Apoiar/Certeiro/Relâmpago ou cria condições. Esses efeitos continuam manuais. Área, Residual e mistura de primordiais seguem com os limites anteriores. Cópias sem parâmetros de combate compatíveis ainda precisam de configuração ou aplicação manual. Atribuição do catálogo preservada: Dhoko de Libra, CC BY-NC-SA4.0. Foundry hospedado13.350 não validado.


## Cartões conforme o resultado — 0.52.0

O resumo da ativação passa a usar o rótulo validado dos componentes congelados no ataque. Enfraquecer deixa de aparecer incorretamente sob o título fixo de Destruição; quando ambos estão presentes, o resumo lista ambos, sua soma e páginas. Graduação zero continua aparecendo como zero, sem inventar penalidade. O cálculo da resistência, custo e estado do alvo não mudam.

O rodapé de uma ativação falha não pede uma resistência inexistente. Em sucesso, Dano aponta para Aplicar/Ajustar/Desfazer no resultado da resistência; Controle aponta para o registro de duração e nova tentativa na ficha; Sustentada aponta para o painel de recarga/oposição. Sustentada não promete aplicação de dano por esses botões. São instruções para os fluxos existentes, sem nova condição, efeito, pagamento ou conferência obrigatória.

Descrição/referência continuam no cartão, agora em seção recolhível para manter resultado, CE, ações e botões próximos. Campos seguem escapados pelo template. A mudança vale para cartões criados nesta versão. Recuperação reapublica o HTML originalmente preparado; mensagens antigas não são reescritas. Dados e metadados de resultado, visibilidade, fila e recuperação preservados. Guias de cobertura corrigidos na main após0.51.0 entram neste pacote. Core hospedado13.350 permanece sem validação.


## Estado atual na resistência — 0.53.0

A resistência antes conferia condições e uma cópia do ataque, mas podia usar atributos antigos quando a ficha mudava na janela ou calcular dano com uma armadura alterada depois do dado. Agora compara a assinatura da ficha do defensor e das armaduras antes de rolar, após a rolagem e antes de publicar o resultado preparado. Mudanças recusam a publicação sem restaurar a ficha, aplicar dano ou cobrar recursos. Se o dado já foi rolado, a mensagem informa a mudança; nenhum resultado antigo é publicado silenciosamente. Edição de um Item de técnica que não altera o sistema do defensor ou armaduras não invalida a resistência por si só.

O botão também confere o ataque que estava renderizado antes e depois da busca do alvo. Se uma mensagem registrada for removida ou seu ataque for substituído, o botão antigo não rola. Quando o original está disponível na coleção, a resistência compara o payload com ele; em área usa a parcela canônica do defensor, preservando alvo, grupo e dano. Alteração, remoção ou perda de visibilidade durante a resolução impedem publicar. Testes avulsos sem uma origem disponível preservam seu comportamento anterior, com a conferência local do defensor/armadura.

Não muda fórmulas, dificuldades, custos, dano, condições ou permissões, nem cria trava permanente ou confirmação adicional. Atualizar o cartão e usar Resistir/Ajustar novamente utiliza os dados atuais. A publicação continua com a visibilidade escolhida e sem gravar o snapshot da ficha em flags ou chat. Não afirma coordenação transacional com todas as macros ou validação no core hospedado13.350; reconexão, tokens sintéticos e concorrência entre clientes ainda precisam do ensaio real.


## Seleção de componentes — 0.54.0

A prévia do seletor agora mostra apoio e limites antes de adicionar o componente. Usa as mesmas referências canônicas e classificações da composição final, considerando o primordial e primordiais adicionais. Não presume automação pelo nome, não habilita cálculos nem altera custos. A decisão fica visível antes de preencher o rascunho; a escolha continua livre. Matrizes e limites de regras permanecem em [componentes automáticos](componentes-automaticos.md).


## Artefatos importáveis — 0.55.0

Auditada a seção607–614:19objetos+3espadas/armaduras lendárias,22Items novos no compêndio Artefatos; total888Items/10catálogos de Items, além das3fichas de teste. Nível equivalente preservado até45, campo identificado como referência. Texto de Selamento inclui a tabela612 sem atribuí-la à Máscara Rangda. Sem efeitos automáticos, equipamentos, condições, cobranças, Lenda ou quebras de limite. Detalhes em [compêndios](compendios.md). Preservadas as866entradas/UUIDs anteriores. Ainda pendem auditoria global das armaduras e demais referências dispersas; a entrega deste catálogo não conclui os marcos de gameplay nem a auditoria total. Core hospedado13.350 pendente.


## Ações disponíveis no painel de efeitos — 0.55.1

Aplicar, Ajustar, Encerrar e recarga compartilham a verificação de disponibilidade do mestre responsável, propriedade da ficha e operações interrompidas. Corrige botões de Ajustar/Encerrar que apareciam para mestres secundários ou com operação pendente e só seriam recusados após o clique. Leitura dos registros/prazos permanece disponível; permissões e validações no processamento são preservadas. Não altera condições, regras, custos, rodadas ou catálogos.


## Ficha e cartões mais limpos — 0.56.0

Lucas confirmou funcionamento do combate básico no servidor e pediu limpeza da interface. Atacar agora é uma ação permanente acima das abas; Técnicas preservam organização e ativação existentes. Retirados parágrafos genéricos de regras, dicas soltas dos campos e rodapés repetidos dos cartões. Contas de rolagem, ajustes de combate, marcações de estado e ferramentas do mestre ficam recolhidos; avisos condicionais de erro, operações interrompidas e efeitos reais permanecem.

O dono aplica dano em si e o mestre em qualquer defensor autorizado pelo cartão, sem aprovação humana ou mensagem visível de solicitação. A coordenação automática pelo mestre ativo, journal, permissões, origem, cobrança única e recuperação permanecem. Estado discreto Pendente/Aplicado/Desfeito acompanha alterações da ficha e bloqueia reaplicação; observadores não recebem ações. Desfazer continua protegido contra mudanças posteriores. Pedidos de versões anteriores permanecem recuperáveis.

Regra física conferida nas pp.417–418: dano corporal desconta PA; não há perda geral de PV da armadura nesse cálculo. Lucas decidiu explicitamente que dano físico excepcional à armadura fica a cargo do mestre; não introduzir regra geral nem aplicar a habilidade específica da p.65 a todos. Nenhuma regra de dano foi alterada. A confirmação do combate básico não valida automaticamente esta nova interface, concorrência ou todas as funções no core13.350. Validação de navegador isolado e testes não substitui esse ensaio.


## Marco integrado da one-shot — 0.57.0

Entrega reunida no PR69, sem releases intermediárias por execução. Atacar abre com a habilidade treinada de maior graduação; Ativar começa por uma reserva de ataque/defesa inteira disponível e mostra as indisponíveis desabilitadas. Seleção e execução compartilham o mesmo plano de ações. Mantidos Atacar no topo e a organização de Técnicas. O painel evita repetir estado e prazo no título dos registros válidos; erros, pausas e registros de outra ficha continuam visíveis.

Novo grupo de treino cria três cópias privadas em pasta própria sem restaurar fichas anteriores. Lyra nova inclui exemplos de Controle e Sustentada para prazo/recarga, sem bônus ou condições fictícias. Importar grupo de teste conserva sua semântica e não acrescenta itens a fichas antigas.

O [ensaio para mestre e jogadores](fichas-teste.md) reúne ataque/defesa, dono/mestre aplicando dano, Ajustar/Desfazer, composição personalizada com Esgotar do catálogo, configuração, prévia de custo/dificuldade/dano/distância, resistência, duração, recarga e recuperação. Testes integrados incluem Actor vinculado/sintético, dois proprietários e observador, área com dois alvos e publicação perdida sem repetir dados/CE/ações. Edge isolado conferiu seleção de reserva intacta, atualização da prévia, medida atualizada, painel com prazo/recarga, busca/histórico e ficha440px, sem escrever no Actor.

As888entradas Item e seus UUIDs são preservados. Nenhuma regra nova de armadura física, condição, área/Movendo ou poder ambíguo. Não há migração nem restauração de recursos. O marco de implementação e ensaio isolado não confirma o core hospedado13.350: combate básico foi confirmado por Lucas, mas o percurso desta entrega e duas conexões reais ainda precisam ser conferidos.

### Depois deste marco

1. Registrar eventuais problemas encontrados no ensaio hospedado e corrigir bloqueios de uso/integridade; continuar trabalho independente sem exigir resposta para avançar.
2. Auditar os parâmetros necessários às técnicas escolhidas para a mesa e as lacunas inequívocas de componentes, mantendo exceções sem contrato como manuais. Não ampliar catálogo ou inventar regras apenas para aumentar uma versão.
3. As prioridades autorizadas de distância/área e exceções de Sustentada/Residual, Marcas, Fadas e Ataúde permanecem no roteiro. Trabalhar somente partes independentes de novas condições e ambiguidades, em próximo conjunto coerente.
4. Auditoria global de armaduras/referências e catálogos adicionais continua pendente, fora do caminho crítico do ensaio. Quantidade de entradas não equivale a automação integral do livro.

## 0.58.0 — Quebrar Armadura Sustentada integrado

O conjunto une composição descobrível, vínculo a um Item específico, aplicação/Ajustar/dispensa, prazos/histórico e journal/recuperação entre Item e Actor. Somente Sustentada canônica concluída sem primordial misto: Bronze1, Prata2, Ouro3PV de armadura por rodada, sem ND/bônus corporal. Mestre escolhe prazo finito e início; registro não surge na ativação nem amplia duração por manutenção/oposição. Veja [contrato e ensaio](armadura-recorrente.md).

Troca/remoção/armadura morta, cópia, prévia antiga e edição posterior são preservadas. A janela após débito do Item pode completar apenas o registro; nunca repete dano ou restaura recursos. Encerramento manual também encerra o efeito para impedir reaplicar parcela divergente. PA e capacidade derivadas podem mudar ao perder a armadura; nenhum PV corporal, CE atual, reserva, ação ou condição é gravado pela operação.

Dez referências de componentes têm algum apoio: os sete cálculos do grupo de Dano, Movendo, Brasas e o perfil Sustentado de Quebrar Armadura. Isto não automatiza os demais trechos do componente ou técnicas mistas. Forma instantânea +1ND entre faixas permanece manual; dano físico comum à armadura continua manual conforme decisão de Lucas. Catálogos e UUIDs preservados, sem migração.

Próximos passos: ensaio no core13.350 e concorrência entre conexões reais; ampliar apenas contratos inequívocos independentes de condições. Distância individual em área, Sacrifício/Estocar/Novamente e exceções de Marcas/Fadas/Ataúde mantêm as lacunas registradas; não presumir fórmulas ou gatilhos. Auditoria final dos catálogos/armaduras/artefatos segue após o caminho crítico da sessão. A organização de Técnicas e Atacar no topo continuam preservadas.

## 0.59.0 — Ativação legível integrada

O conjunto do PR71 reúne valores no topo por tipo de técnica, grupos opcionais de ajustes/componentes/CE, medidas e lista de área compactas e avisos reais fora dos grupos. Cálculos e explicações gerais deixaram o caminho comum; não há requisito de leitura ou justificativa. Abrir/fechar um grupo conserva os parâmetros enviados; o fluxo comum usa os mesmos defaults. Lista de Técnicas e Atacar no topo preservados.

Ensaio integrado usa o formulário real no Edge e seu callback de envio, seguido da coordenação do pagamento nos módulos com fichas de exercício. Cobre Dano, Controle, Sustentada, Esgotar, Movendo Parcial, dois alvos, CE/ND inválidos, medição manual, atualização/ocultação de área, teclado e440px. Prévia/cancelamento não gravam recursos; ativação cobra uma vez e respeita reservas. Nomes longos são escapados e quebram linha. Os helpers/capturas são artefatos de trabalho e não entram no pacote.

Esta entrega não acrescenta regra ou condição, não resolve distância individual de área e não valida o core hospedado13.350. Próximos passos continuam ensaio hospedado/conexões reais e próximos contratos inequívocos de gameplay; lacunas e auditorias registradas permanecem. Ver [ativação](ativacao-direta.md) e [ensaio](fichas-teste.md). Preservar versões maiores, fontes dos catálogos e cópias anteriores.

## 0.60.0 — Andamento individual da área

Conjunto iniciado no PR72 une leitura de origem/journal e privacidade, estados por alvo original, visibilidade de ações por dono/mestre, atualização em chat/ficha/token/usuário e proteção contra respostas assíncronas antigas. O caminho de dano individual, custos, dados, reservas e condições permanece o publicado. Cálculo fica recolhido e valores/estados visíveis. Cartões antigos preservam conteúdo salvo; novas ativações usam o acompanhamento.

Ensaio cruza ativação/resistência/aplicação/desfazer reais dos módulos com fichas vinculadas/sintéticas e dois donos; Edge usa template/callbacks reais para Resistir/Ajustar, mestre/observador, teclado e440px. Não comprova core hospedado13.350 ou conexões simultâneas. Estes seguem pendentes, assim como distância individual de área/Movendo, contratos ambíguos de componentes e exceções, auditorias finais de catálogos/armaduras/artefatos. Novas condições fora do foco. Ver [andamento e ensaio](area-andamento.md).

## 0.60.1 — Falso conflito no pagamento de técnicas

Lucas relatou melhora no uso e erro “O pagamento mudou” ao elevar Cosmo. Questionado sobre outros bloqueios, indicou que no geral era esse. A correção elimina comparação de formato interno e mantém a autorização pelos valores reais; não acrescenta modo livre genérico nem novas restrições. Trata-se da exceção de patch para falha que bloqueia uso, preservando a diretriz de marcos maiores para funcionalidades.

Teste anterior à correção reproduziu a mensagem após expansão de chaves, sem mudar custo/ficha. Regressões cobrem transporte novo/legado, CE/PV, duplicidade e recuperação; o formulário com Elevar3 conserva5CE/dificuldade15 e pagamento único. Core hospedado13.350 e concorrência real seguem pendentes. Demais contratos, ambiguidades e auditorias do roteiro continuam como registrados; ver [pagamento](ativacoes.md).
