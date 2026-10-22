# Ensaio de combate para a one-shot

O compêndio **Fichas de teste — Combate** traz três cavaleiros fictícios de nível 1, com PV/CE preenchidos e Bronze equipada (30 PV, PA 3). Cada ficha tem uma técnica de Dano configurada: ND 2, Poder 10, custo 2 CE. Lyra também tem **Foco de treino — Controle** e **Aura de treino — Sustentada**, para exercitar duração e recarga sem impor condições ou bônus.

| Ficha | PV | CE | Luta | Uso no ensaio |
| --- | ---: | ---: | --- | --- |
| Aster, Santo | 23 | 6 | Soco 2; defesa 1 | Ataque físico |
| Doran, Guardião | 28 | 6 | Armas 1; defesa 2 | Defensor |
| Lyra, Sábia | 23 | 7 | Psíquico 2; defesa 1 | Dano mental, Controle e Sustentada |

São exemplos de operação, sem escolhas completas de criação ou virtudes/dádivas. O nível de ataque físico foi ajustado para 5 para superar PA 3, conforme indicado na biografia. Não são personagens nem técnicas nomeadas do livro. Controle e Sustentada usam os prazos Bronze já suportados; não executam poderes adicionais.

## Preparar como mestre

1. Atualize o sistema com o mundo encerrado. Abra qualquer ficha: **Combate → Ferramentas do mestre → Novo grupo de treino**. Cria três cópias privadas em pasta própria, sem restaurar ou modificar fichas anteriores. **Importar grupo de teste** continua criando apenas os personagens ausentes; não acrescenta técnicas às cópias antigas.
2. Arraste os três Atores novos para uma cena de teste. Use tokens vinculados e mantenha-os próximos. Dê propriedade de Aster/Lyra a um jogador e Doran a outro. O mestre permanece conectado; não existe aprovação humana de dano.
3. Adicione os três ao encontro e inicie a rodada 1. Na mesma área de ferramentas, ative **controle de ações no encontro aberto**. Cada ficha começa com 1 ataque, 1 defesa e 2 parcelas de movimento. Trocar a vez não repõe reservas; avançar a rodada repõe ações, preservando PV e CE.

Para testar identidade sintética, faça outro grupo e coloque o token de Doran sem vínculo antes de adicioná-lo ao encontro. Abra a ficha pelo token. Compare PV/armadura com o Actor base: aplicar e desfazer devem afetar somente a cópia da cena. Use apenas um token por ficha vinculada no encontro.

## Jogadores: ataque e técnica de Dano

1. **Aster:** marque Doran e clique em **Atacar**, no topo da ficha. Soco vem selecionado. Role usando 1 ação e bônus 0.
2. **Doran:** no cartão, use **Defender com 1 ação**. O resultado mostra o dano calculado. **Aplicar dano** desconta esse valor na própria ficha; o estado passa de Pendente para Aplicado. O mestre também pode aplicar. Clicar novamente não repete o dano.
3. Use **Desfazer**, sem editar os recursos entre as duas ações. PV retornam ao valor anterior; ações de ataque/defesa continuam gastas. **Ajustar dano** é separado: depois de desfazer, experimente 1,5 PV corporais e 0 na armadura, aplique e desfaça. Ataque físico comum conserva os PV da armadura.
4. **Lyra:** marque Doran. Em **Técnicas**, use **Ativar → Pulso mental de treino**. Confira custo 2 CE, dificuldade 12, ND 2 e dano normal 21 PV; escolha a reserva de ataque. O teste pode falhar e ainda consumir o custo/ações. Em sucesso crítico, a prévia indica o dano maior.
5. **Doran:** use **Resistir** no cartão da técnica, ou Ajustar para um modificador situacional. A resistência mental usa Sentidos e a dificuldade do ataque. Aplique o dano exibido e desfaça logo depois. No resultado de falha de resistência, Bronze perde 10 PV; em sucesso, a parcela pode ser menor ou nula, conforme o resultado. Desfazer restaura corpo e armadura, sem devolver CE ou ações à Lyra.

Os dados variam. Se a ativação falhar, não há ataque a resistir; avance a rodada para outra tentativa, observando a CE restante. Para repetir o exercício com recursos iniciais, crie **Novo grupo de treino**. Nenhum botão reinicia as fichas usadas.

## Mestre: duração, recarga e histórico

1. Avance para a rodada 2. Lyra ativa **Foco de treino — Controle** contra Doran: 2 CE, dificuldade 12. Após sucesso, Doran resiste. Se não resistir, o mestre usa **Registrar Controle** no resultado, mantendo a duração sugerida. Bronze tem 2 rodadas; falha crítica na resistência dobra o prazo. Se resistir, não há efeito para registrar.
2. Abra **Combate → Efeitos com duração** de Doran. Localize o registro por busca; confira alvo, prazo e rodadas. Encerre o registro usando notas vazias. Ele vai para Histórico sem modificar PV, CE ou condições.
3. Na rodada seguinte, Lyra ativa **Aura de treino — Sustentada**. Como mestre, em **Combate → Efeitos com duração → Sustentada**, selecione essa técnica e Doran, rodada de ativação atual, duração padrão e perfil **por rodada**. Registrar o prazo não cobra a ativação novamente. Oposição usa seu fluxo próprio; a recarga não concede sucesso de oposição.
4. O prazo inicial inclui a rodada de ativação e a próxima. Avance até a primeira rodada de manutenção: o painel mostra **Pagar 1 CE atual/extra**. Avançar a rodada não cobra sozinho. Clique uma vez, confira o saldo e o registro. O botão não permite cobrar novamente a mesma rodada. Encerre a Sustentada e confira o Histórico.

Uma sequência de uma técnica de Dano, um Controle, uma Sustentada e uma recarga usa os 7 CE iniciais de Lyra. Falhas também gastam CE; use um novo grupo se precisar repetir. O ensaio de Controle acompanha prazo, sem impor uma condição nova. A Aura não concede defesa, dano ou bônus fictícios.

## Interrupção e resultado esperado

Se surgir estado de operação interrompida, o mestre usa a recuperação do registro em Combate; não repete a ativação para obter o cartão perdido. Alterações posteriores de PV/armadura podem impedir Desfazer; o sistema deve preservar essas edições. A preparação de falhas artificiais fica nos testes automatizados, sem precisar interromper gravações no mundo de jogo.

Os testes de integração usam as mesmas fontes dos Atores e percorrem ataque/defesa, aplicação pelo dono, Ajustar/Desfazer, técnica/resistência, duração, recarga e recuperação. Incluem Actor vinculado e identidade sintética, com dois proprietários e um observador. Com dados controlados, o ataque físico resolve 8 PV corporais/0 na armadura; a técnica mental resolve 21/10 em falha normal da resistência. São testes de módulos em runtime simulado, não execução do core Foundry.

O combate básico já foi confirmado por Lucas no servidor. O ensaio completo desta entrega, interfaces novas e concorrência entre conexões no Foundry 13 build 350 continuam pendentes de confirmação. Catálogos e cópias existentes permanecem preservados.

API opcional: `game.godsBattle.openTestActors()` abre o catálogo; `await game.godsBattle.importTestActors()` preserva o grupo existente; `await game.godsBattle.importTestActors({fresh:true})` cria outro grupo privado. Nenhuma ficha, cena, token ou permissão de jogador é criada ao iniciar o mundo.
