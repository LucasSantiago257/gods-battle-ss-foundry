# Próximos desafios — após 0.30.0

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
