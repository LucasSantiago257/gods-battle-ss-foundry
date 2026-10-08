# Validação no Foundry 13 build 350

Estado inicial: testes locais de regras, contextos de fichas, templates e pacote; execução dentro do Foundry ainda pendente. Use um mundo de teste.

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

Durante estes testes, dano, efeitos, requisitos e sentidos são conferidos manualmente conforme os limites do README.
