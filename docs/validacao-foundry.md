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
