# Reparo de armaduras por horas informadas

Na ficha que possui uma cópia de **Consertar Armaduras**, abra **Equipamento → Armadura → Reparo de armaduras**. **Novo reparo** escolhe a técnica e uma armadura de uma ficha que você pode editar. O registro é gratuito; não aplica cura nem cobra CE.

**Aplicar hora** registra uma hora completa informada pela mesa. A sugestão é o nível atual de quem conserta em PVA e1CE. O reparo respeita o máximo derivado atual da armadura; não reduz PV que já estejam acima desse máximo. A armadura pode estar guardada ou equipada. O dono precisa ter permissão de proprietário na origem e no alvo; o mestre pode operar as fichas autorizadas. O mestre ativo coordena automaticamente, sem pedido visível ou aprovação humana.

**Ajustar** oferece PV a reparar, CE da hora, CEextra, excesso corporal e notas opcionais. Custo **0** é uma escolha explícita quando a mesa já resolveu esse pagamento. Um campo vazio não vira0. Prévia, cancelamento e abertura da ficha não alteram recursos. O custo genérico da ativação não é interpretado como pagamento de uma hora.

**Desfazer última hora** inverte somente a última parcela com os recursos e a armadura ainda no estado esperado. **Encerrar** conserva recursos e histórico, inclusive quando a cópia da técnica foi removida. O histórico fica recolhido. Nomes/notas personalizados não invalidam o pagamento; alterações relevantes de PV, CE, nível, máximo, identidade ou revisão exigem uma nova prévia.

## Interrupções

Se uma gravação for interrompida, o painel mostra **Conferir reparo** na origem e no alvo. **Concluir pelo registro** executa apenas a parte ausente quando os snapshots continuam compatíveis. Não repete débito/cura. **Encerrar sem alterar recursos** conserva ajustes posteriores e libera o vínculo desta operação para lançamento manual. Um vínculo sem origem/journal só pode ser encerrado pelo mestre. A recuperação de reparo é própria; não usa o resolvedor genérico de efeitos.

Solicitações internas são privadas e discretas. Autor e permissões são derivados da mensagem e dos usuários reais do mundo; comandos, papéis e patches recebidos não são executados. A identidade da mensagem acompanha a mesma intenção em retomadas. Recibos antigos não substituem o estado atual de uma ficha, inclusive após Desfazer.

## Fonte e limites

Referência: Consertar Armaduras, pp.307–308, Controle de Prata/Manipulação. Aquisição, requisitos publicados, teste de ativação/Asterismo e eventual custo já resolvido pela mesa continuam separados deste registro manual. Não existe cura ao importar/ativar, calendário real, avanço por rodada, área ou custo compartilhado entre alvos. Uma parcela representa uma hora completa; PV ajustados podem ser fracionários. O limite técnico de1000entradas de histórico não é regra do livro.

Armadura morta ou com PVnegativo, reviver/evoluir, Restaurador Avançado e outros poderes específicos permanecem manuais. Não se altera estado da armadura nem se automatiza perda de PVA por ataque físico comum. Novas condições não fazem parte deste conjunto. Fontes publicadas, IDs, cópias e notas do usuário permanecem preservados.

## Ensaio curto

1. Use cópias de exercício. Arraste Consertar Armaduras para quem repara e uma armadura para um alvo editável; ajuste o dano e CE manualmente para o ensaio. Cancelar Novo reparo deve conservar todos os valores.
2. Registre o trabalho. Confira PVatuais/máximo, próxima hora e CE. A criação não cobra. Aplique uma hora e confira uma única diferença de CE/PVA.
3. Em outra parcela, use Ajustar com reparo parcial e custo0 explícito. Confira a prévia, aplique e use Desfazer última hora sem editar os recursos entre as ações. Abra Histórico.
4. Encerre o trabalho. Observe o registro recolhido e os recursos preservados. Um observador não recebe nomes privados, valores ou ações de reparo; um jogador sem acesso ao alvo não pode selecioná-lo.
5. Repita em Actor vinculado e token sintético. O mestre vê as fichas autorizadas; dois cliques na mesma revisão não devem criar duas horas. Não provoque falhas de gravação no mundo de jogo: as janelas de interrupção e recuperação são exercitadas pelos testes automatizados.

Modelos, templates, callbacks e runtime foram ensaiados em ambiente isolado. Isso não confirma o core hospedado13.350 nem concorrência entre conexões reais. O combate básico já foi confirmado por Lucas; o ensaio completo desta interface permanece separado.
