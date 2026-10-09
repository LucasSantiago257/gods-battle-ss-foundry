# Próximos desafios — após 0.15.0

Prioridade atual definida por Lucas: gameplay. Já existem fichas, catálogos para arrastar, criação/evolução assistidas, personagens de exercício, ataque/defesa, resistência, dano confirmado com desfazer, configuração/prévia de técnicas, composição personalizada e pagamento central compartilhado com dano/evolução. Isso permite exercitar o fluxo básico; não significa automação integral do livro ou validação do servidor.

## Sequência recomendada

| Ordem | Desafio | Impacto/dependência | Critério de conclusão |
|---|---|---|---|
| Entregue · validar | Pagamento de CE/PV em fila central (0.13.0) | Compartilhada com dano/evolução; confirmações desatualizadas recusadas e recuperação do mesmo resultado. Base para ações e efeitos recorrentes. | Testar no servidor com dois clientes, privacidade, troca de mestre e reconexão. Ver ativacoes.md. |
| Entregue · validar | Reservas de ações por rodada (0.14.0) | Ataque/defesa por quantidade, técnicas com reserva inteira, Movimento/Reação registrados, ajustes/reparo do mestre e fila comum. | Testar encontros, rodadas, tokens, concorrência e recuperação no servidor. Iniciativa/simultaneidade e manobras especiais continuam manuais. Ver acoes.md. |
| 3 · alto · parcial | Efeitos executáveis de Big Bangs/incrementos | 0.15.0 calcula quatro componentes de Dano por adesão explícita; os demais e efeitos persistentes ainda manuais. Ver componentes-automaticos.md. | Parâmetros estruturados, confirmação própria, duração/alvo/efeito rastreáveis; expiração remove contribuições; componentes manuais sinalizados. Reproduzir exemplos do livro. |
| 4 · alto | Distância, área, múltiplos alvos e condições | Alcance registrado; penalidade/geometria manuais. Fluxo genérico admite um alvo; estados não aplicam todos os efeitos. Depende de2/3. | Medir conforme cena/token; prévia da penalidade; resistência por alvo; impedir aplicação em alvo trocado; duração/remoção e efeitos explícitos das condições. |
| 5 · alto | Sustentação, Cosmo Residual, bloqueios e duelos | Cobrança por turno, interrupção e oposição dependem de contexto. Mistos/Residual manuais. | Estado persistente, custos periódicos confirmados, interrupção sem cobrança indevida, duelos com participantes/permissões/referências. Resolver ambiguidades antes de codificar. |
| 6 · médio | Recuperação e evolução horizontal | Subir de nível conserva recursos atuais; não cura. Descanso, armaduras, promoção, aprendizagem/desenvolvimento e trocas de virtudes exigem revisão. | Comparação, tempo/custo, limites e confirmação; conservar ajustes manuais; registrar aprendizado/promoção sem ganhos retroativos não conferidos. |
| 7 · médio | Poderes pessoais, armaduras/artefatos e fichas específicas | Há866 Items do livro; catálogo não implica cobertura integral. Das358 entradas pessoais,13 automatizadas,12 parciais,333 manuais. Armaduras/artefatos específicos e criaturas/divindades precisam de auditoria/implementação. | Matriz por página/regra, IDs/proveniência estáveis, efeitos testados em combinação sem duplicar benefícios; fichas próprias após mapear suas regras. |

Recomendação: validar pagamento/ações e implementar pequenos grupos de3 que tornem as técnicas mais úteis na mesa.4 e5 ficam mais simples com essas bases. Iniciativa/simultaneidade, alocação de movimento parcial e consumo de manobras especiais precisam de um próximo passo específico, com conferência das fontes. Os catálogos seguem disponíveis e preservados enquanto gameplay avança.

## Validação transversal

Testes locais não substituem o core do Foundry. Ensaiar em mundo de teste13.350 com mestre e dois jogadores: atualizar pelo manifesto, reabrir fichas antigas, arrastar compêndios, salvar campos do construtor, ativar/resistir, rolagens privadas/cegas, aplicar/desfazer e recuperar operações. Conferir atores e tokens vinculados/não vinculados, mestre ativo e reconexão. Só então registrar compatibilidade verificada. Usar [fichas de exercício](fichas-teste.md) e [roteiro](validacao-foundry.md).

A fila central cobre técnicas, dano e evolução desde0.13.0. Confirmar concorrência no servidor; edição direta/macros e testes genéricos continuam fora da coordenação central. Operações preparadas exigem recuperação explícita.

## Decisões de campanha pendentes

Resistência mantém duas interpretações documentadas/configuráveis. Também pendem a Virtude Extra do Artista e detalhes de criação/companhia do Domador. Ambiguidades adicionais devem ser registradas com página e consequência; não inferir bônus, promoção ou requisitos ausentes. Efeitos manuais continuam acessíveis enquanto essas decisões aguardam.

