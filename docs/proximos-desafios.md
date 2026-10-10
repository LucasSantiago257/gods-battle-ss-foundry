# Próximos desafios — após 0.26.0

Prioridade atual definida por Lucas: gameplay. Já existem fichas, catálogos para arrastar, criação/evolução assistidas, personagens de exercício, ataque/defesa, resistência, dano confirmado com desfazer, configuração/prévia de técnicas, composição personalizada e pagamento central compartilhado com dano/evolução. Isso permite exercitar o fluxo básico; não significa automação integral do livro ou validação do servidor.

## Sequência recomendada

| Ordem | Desafio | Impacto/dependência | Critério de conclusão |
|---|---|---|---|
| Entregue · validar | Pagamento de CE/PV em fila central (0.13.0) | Compartilhada com dano/evolução; confirmações desatualizadas recusadas e recuperação do mesmo resultado. Base para ações e efeitos recorrentes. | Testar no servidor com dois clientes, privacidade, troca de mestre e reconexão. Ver ativacoes.md. |
| Entregue · validar | Reservas de ações por rodada (0.14.0) | Ataque/defesa por quantidade, técnicas com reserva inteira, Movimento/Reação registrados, ajustes/reparo do mestre e fila comum. | Testar encontros, rodadas, tokens, concorrência e recuperação no servidor. Iniciativa/simultaneidade e manobras especiais continuam manuais. Ver acoes.md. |
| 3 · alto · parcial | Efeitos executáveis de Big Bangs/incrementos | 0.15.0 calcula quatro componentes;0.16.0 acompanha duração e Brasas com dano periódico confirmado, sem cobrança ao avançar rodada. 0.18.0 calcula e registra duração de Controle vinculada à resistência pública; 0.19.0 adiciona nova resistência genérica paga pelo mestre, com encerramento e recuperação; exceções de estados manuais. Ver componentes-automaticos.md, efeitos-duracao.md e controle.md. | Parâmetros estruturados, confirmação própria, duração/alvo/efeito rastreáveis; contribuições futuras removidas na expiração; componentes manuais sinalizados. Reproduzir exemplos do livro. |
| 4 · alto · parcial | Distância, área, múltiplos alvos e condições | Alcance registrado; penalidade/geometria manuais. Fluxo genérico admite um alvo.0.17 aplica parcelas opcionais de Cansado/membros debilitados com encerramento reversível; demais estados e bloqueios manuais. Ver condicoes-assistidas.md. | Medir conforme cena/token; prévia da penalidade; resistência por alvo; impedir aplicação em alvo trocado; duração/remoção e efeitos explícitos das condições. |
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

Próximo grupo: estados que bloqueiam ações, em contrato explícito separado das caixas antigas. Paralisado395–396 deve permitir Cosmo e impedir luta/movimento, sem confundir toda técnica com ataque; Movendo299 e outras ações compostas ainda exigem representação própria. Atordoado depende do agregado por turno/limiar70%PV/CD fracionária e prazo de uma rodada. Surpreso depende de iniciativa/ação atual. Jogador/privado, distância/áreas/multialvos, marcas/Fadas/sobrevivênciaAtaúde, armaduras/artefatos e auditoriafinal permanecem pendentes. Catálogos intactos; Foundry13.350 real pendente.
