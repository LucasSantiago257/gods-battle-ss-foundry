# Fichas prontas para testar combate

O sistema inclui o compêndio **Fichas de teste — Combate**, com três cavaleiros fictícios de nível 1. Cada um tem armadura de Bronze equipada (30 PV), uma técnica personalizada de dano (ND 2, Poder 10, custo 2 CE) e PV/CE preenchidos.

| Ficha | Papel | PV | CE | Luta |
| --- | --- | ---: | ---: | --- |
| Aster, Santo | Ataque físico | 23 | 6 | Soco 2; Esquiva/Bloqueio 1 |
| Doran, Guardião | Defesa | 28 | 6 | Armas 1; Esquiva/Bloqueio 2 |
| Lyra, Sábia | Técnica mental | 23 | 7 | Psíquico 2; Esquiva/Bloqueio 1 |

São fichas de exercício de combate, sem virtudes/dádivas especiais ou escolhas completas de criação. O nível de ataque físico foi ajustado para 5, permitindo produzir dano contra PA 3; esse parâmetro de treino está indicado na biografia. Nomes e técnicas são exemplos fictícios, sem personagens ou imagens do livro.

## Importar e começar

1. Atualize para **0.9.2** com o mundo encerrado e reinicie o mundo.
2. Como mestre, abra **Compêndios → Fichas de teste — Combate** e importe as fichas. Alternativamente, abra qualquer ficha, vá a **Combate → Importar grupo de teste**: cria somente as fichas ausentes na pasta **TESTES — Combate**. **Abrir fichas de teste** abre o catálogo.
3. Arraste os personagens da aba Atores para uma cena. Os tokens são vinculados às fichas e mostram barras de PV/CE. Para testar com jogadores, atribua manualmente a propriedade de cada ficha; o importador não muda permissões de personagens existentes.
4. Com Aster, marque Doran como alvo e use **Atacar alvo selecionado**, escolhendo Soco. Resolva **Defender** pelo cartão, confirme a aplicação e confira PV e histórico. Ataque físico comum não retira PV da armadura.
5. Na aba Técnicas de Lyra, ative **Pulso mental de treino**. Selecione somente o token de Doran como defensor e use **Resistir** no cartão de sucesso. Confira o gasto de 2 CE, a resistência, o dano corporal/armadura e a confirmação. É necessário um mestre ativo para aplicar/desfazer.
6. Use **Desfazer aplicação** para conferir a restauração; após alterar recursos ou aplicar outro dano, o registro anterior não pode ser desfeito silenciosamente. Compare a resistência de técnica com a armadura desequipada. Reponha CE manualmente entre exercícios, se necessário.

O importador preserva fichas de teste já presentes: nomes, PV, CE, notas e cópias de itens não são restaurados. Para começar do zero, importe uma nova cópia diretamente do compêndio. Nenhuma ficha ou token é criado automaticamente ao iniciar o mundo; não há cena, posicionamento ou jogadores predefinidos.

API opcional: `game.godsBattle.openTestActors()` abre o catálogo; `await game.godsBattle.importTestActors()` importa o grupo como mestre. Os botões usam a mesma operação.

As verificações locais cobrem dados, importação e bancos nativos. A execução dentro do servidor Foundry 13 build 350 ainda precisa ser conferida pelo usuário.
