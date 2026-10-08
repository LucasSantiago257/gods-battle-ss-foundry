# Validação no Foundry 13 build 350

Estado: o usuário confirmou a criação e funcionamento das fichas 0.1.1 no servidor. A ativação 0.2.0 tem testes locais; sua execução dentro do Foundry precisa ser confirmada. Use um mundo de teste e preserve um backup antes de atualizar.

1. Iniciar mundo e conferir console: nenhum erro ao carregar o sistema, criar cavaleiro e abrir todas as abas.
2. Alterar nome, atributos, perícia e recursos; fechar/reabrir e recarregar a página. Confirmar persistência. PV negativos devem ser preservados.
3. Manter Cosmo 4 e alterar Sentidos entre 2 e 5. No nível 1 sem armadura, a capacidade de CE continua 4.
4. Equipar Bronze: PA 3 e CE +3. Equipar Prata: Bronze fica removida, PA 5 e CE +5. Remover: bônus da armadura deixam de ser aplicados. PV do cavaleiro permanecem separados.
5. Alterar PV da armadura para 0 e depois −1. Em −1 os bônus deixam de ser aplicados; a armadura permanece na ficha.
6. Criar o compêndio inicial e acioná-lo novamente: não duplicar modelos. Arrastar uma técnica e uma armadura; editar as cópias e conferir que os originais não mudaram. Ordenar itens já pertencentes ao Actor sem duplicá-los.
7. Fazer TAA e TAP; conferir maior d10 e cada face 1/10 na mensagem. Usar vantagem/desvantagem. Testar modo público e sussurro ao mestre.
8. Alternar configuração de resistência. Com graduação 4, nível 8 e sem extras, conferir modificador 12 na fórmula impressa e 16 na alternativa do exemplo.
9. Acessar como jogador proprietário e como observador: proprietário edita e rola; observador lê e não altera dados nem arrasta conteúdo para a ficha.
10. Registrar versão/build, navegador, resultado e erros. Somente após aprovação desse roteiro, preencher `compatibility.verified`.

## Técnicas 0.2.0

1. Criar uma técnica Bronze: ND 2, Poder 10, custo 2. Conferir o seletor Dano/Controle/Sustentada. Cópias antigas devem manter seus valores.
2. Com CE 5, reserva 1 e CE extra 1, ativar custo 2: extra passa a 0, atual passa a 4 e reserva permanece 1. Cancelar outra ativação: nada muda e não há rolagem.
3. Sem CE suficiente, ativar sem autorizar PV: bloqueia. Autorizar e cancelar a confirmação: nenhum recurso muda. Confirmar: PV e excesso refletem o valor anunciado.
4. Forçar falha/crítica com modificador situacional. Mesmo na falha, CE é gasta. Falha crítica deixa −10 no próximo Asterismo. O próximo teste consome a penalidade; conferir botão da técnica e rolagem pela aba Perícias.
5. Elevar 1: custo aumenta 1; dano ganha 1 ND. Para Controle/Sustentada, PC aumenta 1 e não aparece dano corporal genérico. O Item não é reescrito.
6. Selecionar um token defensor próprio e usar Resistir. Conferir dificuldade PC, natureza e fórmula configurada. Dois tokens ou token sem propriedade impedem a ação. Sem token, testar o personagem atribuído ao usuário.
7. Conferir sucesso, falha e limites críticos na resistência. Metade de dano ímpar mantém a fração. PV do defensor e armadura permanecem inalterados. Sem armadura viva, corpo recebe dobro.
8. Testar rolagem pública, privada ao mestre e cega. Mensagens ocultas não expõem cartão/botão. Jogador proprietário consegue ativar e resistir.
9. Dois cliques rápidos em Ativar devem abrir uma única ativação e gastar uma vez. Recarregar e conferir CE, PV e penalidade. Evitar ativação simultânea do mesmo cavaleiro em clientes diferentes.

Dano ao defensor, efeitos, requisitos e sentidos são conferidos manualmente conforme os limites do README e do guia de técnicas.

## Compêndios nativos 0.3.0

1. Na aba Compêndios, confira os seis catálogos e suas quantidades conforme docs/compendios.md. Abra as pastas de um estilo e busque uma virtude por nome.
2. Na aba Poderes de um cavaleiro, abra Habilidades e Dádivas, Virtudes, Combinações de Cosmo e Cosmos Divinos pelos atalhos.
3. Arraste uma dádiva, uma virtude e um Cosmo Divino para a ficha. Abra cada cópia e confira descrição, requisitos, tipo e página; confirme o registro da origem.
4. Edite as notas da cópia. O Item do catálogo deve continuar com suas notas originais; importar não deve alterar atributos ou gastar recursos.
5. Repita com um jogador proprietário do cavaleiro. Ajuste a visibilidade do catálogo como mestre se necessário. Um observador não pode modificar a ficha.
6. Reabra o mundo e confira a persistência das cópias. Modelos e compêndios anteriores do mundo devem permanecer intactos.

Estes passos requerem o Foundry real; os testes automatizados não os substituem.

## Evolução assistida 0.10.0

1. Use Aster de teste, XP 10, antes de abrir o rascunho. Confira 1 → 2: PV máximo 23 → 36; CE máxima 6 → 7; ações 1 → 2; três pontos de perícia, dádiva/Melhoria. Recursos atuais e armadura não mudam.
2. Feche/reabra e recarregue. Escolher referências não cria cópias; descartar não altera a ficha. Alterar a ficha fora do rascunho exige nova revisão.
3. Como jogador proprietário, confirme a evolução com mestre ativo. Confira aquisição/nível do Item, comparação/histórico e ausência de concessão duplicada em dois clientes. Observador ou autoria inválida não pode evoluir.
4. Avance até 4/5: escolha virtude, confira dois pontos de atributo (dois por graduação a partir de 5), dois de luta, especialização e Sentido. Saldos não distribuídos permanecem disponíveis. Limites inválidos são bloqueados; pendências exigem motivo.
5. Teste uma Melhoria existente: graduação aumenta, notas preservadas, sexta aquisição bloqueada. Escolher conteúdo já adquirido preserva a cópia e indica pendência.
6. Confira nível 11: técnica Prata requer configurar cópia; status/armadura permanecem. Em 20/21 confira pré-requisito do 7º Sentido e escolha de evolução épica. Avanço não reduz Sentido obtido horizontalmente.
7. Sem mestre ativo, não há aplicação. Confira mensagens privadas, retomada de solicitações e registro interrompido. Ganhos anteriores de fichas manuais não são concedidos retroativamente.

## Cálculos e efeitos pessoais 0.6–0.7

1. Abra uma ficha antiga: automação deve permanecer desativada, sem mudanças de PV atuais, ajustes ou itens. Duplicá-la deve preservar essa escolha.
2. Crie um Santo, Vigor 3: máximo 23 no nível 1 e 36 no nível 2. Máximo manual 77 deve prevalecer. PV −2,5 devem persistir.
3. Com automação habilitada, importe Vitalidade: máximo ganha 20 + 2 por nível. Reabra/recarregue; o benefício não deve duplicar. Desative/remova e confira a reversão sem alterar PV atuais.
4. Importe Combo duas vezes: +4 ações. Importe Aumento de Atributo e escolha dois pontos em Força; base preservada, graduação efetiva +2. Remover reverte.
5. Importe Dançarino de Sábio em um Santo nível 1: aquisição permitida, efeito pendente. Confira a pendência e aceite a exceção na cópia para testar o bônus. Compare duas habilidades do mesmo tipo; memória deve mostrar a supressão.
6. Importe Armadura Poderosa: máximo da armadura dobra sem curar; máximo manual prevalece. Importe Gigante e a habilidade natural Gigante: bônus de PV não duplica.

## Auditoria 0.3.1

1. Abra Sentidos e Auras pelo atalho de História e evolução. Confira 38 Auras e 11 referências de Sentidos. Importar uma delas cria Item sem modificar os campos Sentido, estágio e Aura.
2. Abra Olho de Fogo no compêndio. Confira a descrição principal e expanda Outras ocorrências no livro: Visão Aérea deve preservar Fotógrafo de Cosmo, com página122, além da regra do índice465.
3. Importe uma cópia e edite sua descrição. A área de leitura deve refletir essa edição, enquanto os trechos de outras ocorrências continuam como referência original. Um observador consegue ler e expandir o conteúdo, sem editar.
4. Confira que cópias importadas na versão0.3.0 conservam seus dados. Nenhuma importação ou leitura gasta recursos nem aplica bônus automaticamente.

## Componentes 0.4.0

1. Na aba Técnicas, abra Big Bangs e Incrementos. Confira 47 Big Bangs e 12 incrementos; abra Apoiar (0 CE e 1 slot), Cosmo Residual (regra contínua e exemplo de aventura) e Controle Cósmico (graduação única).
2. Arraste um Big Bang e um incremento para a ficha. Confira seus grupos, descrição e origem. Editar graduação/notas da cópia não modifica o catálogo; importar não modifica CE, técnica ou bônus.
3. Abra uma técnica antiga: custo, componentes e parâmetros devem continuar iguais. Registre a composição e ajuste o custo manualmente antes de ativar.

## Catálogo de técnicas 0.5.0

1. Abra Técnicas do livro e confira 166 entradas em cinco pastas. Compare Execução Aurora (Ar) e Aniquilação Aurora (Ar); os textos e páginas devem ser separados.
2. Arraste uma técnica de dano: a ficha mostra Conferir. Tentar ativação programática antes da revisão não deve abrir diálogo, rolar nem gastar CE. Configure natureza, custo, Poder e ND, marque a revisão e ative normalmente.
3. Apenas marcar a revisão com Poder/ND 0 ou custo 0 deve continuar bloqueando. Veneno começa com natureza vazia e custo textual; escolher a natureza e configurar o custo é obrigatório.
4. Escudo Entrópico mantém aplicação manual e custos 2/3/4 descritos. Exclamação de Athena permanece manual, sem botão de ativação genérica.
5. Abra Big Bangs relacionados como observador autorizado; restrinja as permissões do pack e confirme que o link não abre o documento. Cópias editadas e técnicas antigas mantêm seus dados e funcionamento.

## Combate 0.8.0

Para executar este roteiro com dados prontos, use o grupo de [fichas de teste da 0.9.2](fichas-teste.md). Confira importação individual pelo compêndio e importação do grupo pelo botão na aba Combate. Repetir o botão deve preservar PV/CE, nomes e notas já editados. Os três atores devem conservar armadura e técnica embutidas e tokens vinculados.

1. Com mestre e dois jogadores conectados, marque um alvo e role ataque/defesa. Confira acertos e fórmula de dano. Cancelar não cria rolagem nem altera recursos.
2. Ative técnica e resista. Confira dano corporal/armadura e confirme aplicação como proprietário do defensor. Os valores anunciados devem ser debitados uma vez, incluindo frações.
3. Dois clientes confirmam o mesmo resultado: somente uma aplicação. Observador e atacante sem propriedade do defensor não podem aplicá-lo.
4. Desfaça a última aplicação e confira ambos os recursos. Após editar PV ou aplicar outro dano, a operação anterior deve recusar desfazer.
5. Confira rolagens privadas/cegas. Sem mestre ativo, nenhum recurso muda. Reabra o mundo para conferir journal e solicitações pendentes.


## Criação assistida 0.9.0

1. Crie um cavaleiro: rascunho e automação habilitados. Abra uma ficha antiga/duplicação: edição normal e opções preservadas.
2. Aplique o estilo duas vezes; apenas um ponto é concedido. Campos de luta já preenchidos permanecem intactos.
3. Distribua oito pontos, escolha virtudes e configure Aumento de Atributo: graduação básica e efetiva devem ficar separadas.
4. Escolha do catálogo e repita: cópia editada e notas preservadas, sem duplicação. Arrastar continua funcionando.
5. Exceda orçamento/limites: revisão aponta pendências. Concluir requer corrigir ou marcar exceção com justificativa. Cancelar mantém recursos e rascunho.
6. Feche/reabra e recarregue entre etapas. Conclua com preenchimento de recursos desligado e confira PV/CE anteriores. Com preenchimento ligado, somente recursos do cavaleiro são preenchidos; armadura não é curada.
7. Repetir conclusão não concede benefícios nem importa itens. Teste como proprietário e observador.

## Gameplay de técnicas 0.11.0

1. Arraste uma técnica, abra Configurar e cancele: dados/notas/origem permanecem. Escolha natureza, custo completo e modo ND/Poder pelo status; confirme a leitura. Custo0 continua pendente; componentes não são cobrados novamente. Técnicas cooperativas permanecem manuais.
2. Como Bronze nível1, confira ND2/Poder10 e dano21 sem bônus. Altere somente o status para Prata: ND3/Poder15. Valores manuais salvos permanecem; retornar ao modo manual os recupera. Nível alto sozinho não muda status.
3. Abra Ativar: elevação/condensação/CE extra devem atualizar custo, dificuldade, dano normal/crítico, armadura e pagamento, sem gastar na prévia. Cancelar não altera recursos. CE insuficiente exige liberar reserva/obter CE ou autorizar queima, com confirmação exata dos PV.
4. Marque um alvo e deixe outro token controlado. O cartão Resistir deve usar exclusivamente o alvo marcado e sua dificuldade de Poder Cósmico. Proprietário de outro cavaleiro não pode resistir/aplicar esse resultado. Sem alvo, o fluxo com token selecionado permanece. Teste tokens vinculados e não vinculados.
5. Resista como proprietário e confirme dano corporal/armadura; confira metade, crítico, ausência de armadura, privacidade e desfazer. Trocar a ficha ou técnica enquanto a prévia/rolagem estiver aberta deve impedir cobrança até reabrir.
6. Teste com mestre/jogador no build350. Consumo de ações, alcance, condições e Big Bangs específicos ainda são conferidos manualmente. Pagamento agora usa fila central; execute também o roteiro0.13.0 abaixo.

## Técnicas personalizadas 0.12.0

1. Na ficha de teste, Técnicas → Adicionar abre o rascunho. Escolha classe, natureza, primordial e ND/Poder pelo status. Feche/reabra: escolhas persistem; ativação permanece bloqueada. Outra tentativa de adicionar deve retomar o rascunho.
2. Bronze permite dois extras além do primordial; Prata três; Ouro quatro. Apoiar ocupa um slot e não acrescenta CE. Ouro com três extras comuns custa7CE/dificuldade17. Um tipo de incremento acrescenta1CE, mesmo na graduação3. Controle Cósmico aceita apenas graduação1. Incrementos não ocupam slots de Big Bangs.
3. Confira graduações, aquisição por Mestre e efeitos descritos; excesso de slots, quantidade/tipos e requisitos pendentes exigem resolução/exceção justificada. Apenas permitir exceções sem revisão não conclui. Referências exibem regra, página e atribuição; observador não altera; compêndio sem permissão impede consulta.
4. Confira dano normal/crítico conforme status do usuário, separado da classe da técnica. Misto/Residual permanece manual. Efeitos específicos e confirmação são manuais. CE fixa inclui os incrementos escolhidos; não repita esses custos no campo Condensar da ativação.
5. Cancele conclusão: nenhum parâmetro/recurso muda. Conclua e confira notas, ID, origem, PV/CE e armadura preservados, custo e histórico salvos. Reabra composição, remova componente, revise e conclua: registro novo não pode reter componente removido.
6. Edite ficha/técnica/composição em outro cliente durante confirmação: recusar estado alterado. Descartar preserva a técnica; modificar o rascunho em outro cliente durante descarte deve exigir nova conferência. Técnicas do livro mantêm Configurar e não são reescritas pelo construtor.
7. Finalize, exporte para compêndio do mundo, arraste para outro cavaleiro e confira cópia independente e modo por status desse novo usuário. Atualização do sistema não deve alterar composições existentes. Testar no Foundry13.350; estes passos não foram executados no servidor por Codex.


## Pagamento central de técnicas 0.13.0

1. Mestre e dois jogadores conectados, usando mundo de teste. Atribua o mesmo cavaleiro a ambos para o ensaio; importe cópias das fichas de exercício. Ativar abre prévia. Cancelar ou cancelar queima de PV não cria solicitação, rola ou gasta.
2. Confirmar envia solicitação privada; mestre processa automaticamente e atualiza o mesmo cartão com resultado. Desconto, falha crítica e alvo devem coincidir com a prévia. Conferir histórico na aba Combate. Repetir uma solicitação recebida não cobra nem rola novamente.
3. Dois clientes confirmam a mesma ficha: apenas a primeira confirmação desse estado é aceita; a outra informa mudança e exige reabrir. Repetir com CE ilimitada, sem modificar outros recursos. Sem mestre ativo, ativação não processa rolagem nem pagamento.
4. Testar público, privado, cego e somente para si em contas distintas. O modo self deve pertencer ao jogador, não ao mestre que executou. Cego não revela dados ao solicitante por notificação/histórico de Actor. Cartão final conserva autor e remove dados privados de solicitação/preparação.
5. Conferir CE extra/reservada e excesso cumulativo: limites autorizados não mudam durante confirmação. Altere ficha/técnica/alvo ou remova Item durante prévia/processamento; a cobrança deve parar e exigir conferência. Fazer ensaio com token vinculado e não vinculado.
6. Concorrer ativação por excesso com aplicação/desfazer de dano e evolução: nenhuma alteração confirma um valor antigo por cima de outra operação. Operação preparada interrompida bloqueia dano/evolução/novas técnicas até conferência; editor manual permanece disponível para reparos.
7. Recarregar/trocar mestre durante processamento. Solicitação preparada não repete rolagem/pagamento; estado pago recupera somente publicação do mesmo resultado. Recuperação automática/manualmente não muda recursos alterados depois do pagamento.
8. Ensaiar recuperação em cópia do mundo: estado anterior encerra sem gasto; posterior completo reconhece pagamento sem cobrar; valores divergentes recusam restauração. Após reparo manual, liberar exige conferência e justificativa, sem alterar recursos nem criar resultado. Cancelar mantém registro. Confirmar permissões do mestre responsável.
9. Reabrir mundo e atualizar0.13.0 sobre fichas existentes: notas/origem/IDs/recursos/compêndios preservados. Conferir aplicação de dano pelo cartão atualizado e desfazer no defensor. Este roteiro depende do Foundry real; testes locais não equivalem à sua execução.



## Ações e rodadas 0.14.0 — validação pendente

Use mestre e dois jogadores em mundo de teste13.350, com cópia preservada das fichas.

1. Crie/abra encontro no rastreador, adicione tokens e inicie. Na aba Combate, habilite o controle como mestre; confirme que PV/CE/armadura e cópias não mudam.
2. Confira reservas com os máximos da ficha. Ataque escolhendo menos ações que o máximo; confira o modificador/cartão, gasto e defesa intacta. Cancelar não consome.
3. Defenda pelo cartão fora da vez do defensor. Repita o clique: não deve haver outra defesa paga do mesmo ataque. Confira o vínculo para aplicação de dano.
4. Troque a vez de combatente: reservas permanecem. Avance a rodada: todas são repostas, sem alterar PV/CE/excesso. Voltar a rodada abre um novo ciclo; não desfaz gastos anteriores.
5. Ative técnica com ataque inteiro e confirme gasto junto com CE. Falha também paga. Reserva parcialmente gasta deve impedir essa escolha; defesa intacta deve continuar possível. Alterar ficha/rodada durante diálogo exige reabrir.
6. Registre Movimento/Reação com descrição: apenas uma por ciclo, sem CE ou efeito automático. Teste reação fora da vez. Confira ajustes justificados do mestre e cancelamento.
7. Com Combate6+ e automação avançada ligada, confira ações extras uma vez e memória de cálculo. Desligar mantém a parcela manual; confira ajustes antigos para evitar duplicação.
8. Teste dois proprietários solicitando gasto sobre a mesma reserva e cliques repetidos: não consumir estado antigo duas vezes. Teste mestre ausente/secundário e usuário observador.
9. Teste público/privado/cego/self: autor e visibilidade corretos, sem Roll/resultado no histórico do Actor. Cartão privado/cego não permite defesa de quem não o vê.
10. Teste fichas/tokens vinculados e não vinculados, entrada tardia, remoção e encerramento. Mesma ficha em dois combatentes/encontros habilitados deve exigir resolução da ambiguidade.
11. Em ambiente de teste, simule interrupção/reconexão/troca de GM e falha de publicação: recuperar mesmo resultado sem consumir/rolar outra vez. Operação preparada bloqueia gastos/dano/evolução até revisão. Ajustes posteriores devem ser conservados.
12. Copie ficha com registro interrompido: recuperar não deve tocar original. Encerrar após revisão deve liberar só a cópia. Ataques de outra rodada exigem resolução manual; concluir defesas antes de avançar.

Iniciativa/simultaneidade, alcance, movimento parcial/total, manobras e efeitos próprios de poderes permanecem conferidos; não registrar automação integral como validada.
