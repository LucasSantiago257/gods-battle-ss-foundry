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
