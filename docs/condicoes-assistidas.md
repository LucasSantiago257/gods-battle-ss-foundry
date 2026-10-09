# Condições assistidas — 0.17.0

Na ficha, **Combate → Condições assistidas → Registrar condição assistida · mestre** aplica parcelas numéricas conferidas de Cansado e de membros debilitados em Incapacitado. Registro explícito do mestre responsável, na fila comum; não converte marcações antigas nem interpreta nomes/descrições de poderes.

| Regra conferida | Parcela nas rolagens | Recuperação/duração |
|---|---|---|
| Cansado · p.393 | −2 por dia/nível de cansaço registrado em testes | Até descanso confirmado pelo mestre. Quantidade não cresce pelo relógio ou ao avançar rodada. |
| Incapacitado: membro debilitado · p.397 | −2 e perda de1 dado por membro conferido em testes | Registrar membros, resultado de resistência e prazo correto; encerramento explícito após recuperação. Não decide dano localizado nem restringe uso de membros automaticamente. |

## Registrar e encerrar

1. Como mestre, escolha condição e quantidade cumulativa final. Informe origem/contexto, detalhes (membros afetados), critério/prazo de encerramento e motivo da revisão. Não exige combate aberto: cansaço ou lesão podem persistir fora da luta.
2. Confira e retire somente parcelas da mesma condição já lançadas manualmente em modificadores/diálogos. Confirme a adesão. Não há correção automática dos ajustes antigos; manter o mesmo −2 manual e assistido duplicaria a penalidade.
3. As parcelas entram em atributos, perícias, resistências, Asterismo de técnicas e ataque/defesa, inclusive fora do controle de ações. Prévia/cartão indicam a contribuição; resistências derivadas exibem o modificador resultante. As graduações e os modificadores base editáveis permanecem iguais.
4. Após recuperação conferida, **Encerrar condição após revisão**, com motivo, remove apenas a contribuição daquele registro. PV, CE, máximos, armadura, XP, notas, caixas de estado e ajustes manuais permanecem. Não oferece cura, repouso automático ou desfazer de dano.

É permitido um registro ativo próprio por tipo. Para mudar a quantidade, encerre/revise o registro anterior e registre o novo total; histórico é conservado. Cansado e membros debilitados podem coexistir e suas parcelas são somadas uma vez. Duplicatas ou dados inválidos são sinalizados e não concedem parcelas adicionais. O limite1–1000 é uma guarda técnica de entrada, não máximo de dias/membros estabelecido pelo livro.

## Dados, valores e cálculos

Perdas de dados e vantagem/desvantagem entram na mesma expressão antes do piso/teto da jogada; o sistema conserva mínimo1 dado em uma jogada válida e os limites de parada existentes. Não transforma uma graduação de luta0 em luta treinada. A perda de dados não reduz a graduação de atributos/perícias, a aquisição de habilidades, os PV máximos ou os modificadores associados ao rank. Os dois campos internos derivados são recalculados das flags; valores antigos desses campos não ativam uma condição por si.

Nos testes de resistência, a fórmula provisória de graduação/modificador do atributo permanece configurável; condição soma sua penalidade e reduz os dados, sem reescrever essa escolha. No Asterismo, aplica uma vez os ajustes do estado, da condição e da situação. Não reduz CE, ND, dano/Poder de técnica, dificuldade, ações disponíveis, PA, Domínio ou movimento diretamente. Quantidade de ataques efetivos pode mudar porque a rolagem mudou.

As perícias e os atributos da ficha mostram bases preservadas; a seção de condições explica o ajuste aplicado na jogada. Encerrar remove a contribuição no próximo preparo/rolagem. O assistente de evolução conserva o contexto dos registros na projeção e não encerra nem cura condições ao subir de nível.

## Histórico, cópias e revisão

Registros guardam origem narrativa, tipo, quantidade, referência, critério de término, revisão e autor/data, sem copiar dados de rolagens privadas/cegas. O mestre autoriza que esses detalhes fiquem visíveis na ficha. Estados históricos ativos até revisão não expiram por fechar o mundo ou excluir o encontro; fim de luta/descanso precisa ser confirmado no registro.

Uma ficha/token com UUID próprio não recebe automaticamente a penalidade de registros copiados de outro UUID. Aviso identifica o histórico estrangeiro; encerrar afeta apenas a cópia, depois registre nela o estado conferido. Cancelar conserva tudo. Mudanças de registro durante prévia/rolagem invalidam a confirmação antiga; em operações centrais preparadas, use a recuperação existente. A fila coordena o cliente do mestre; edição direta/macros e testes genéricos continuam fora de uma transação global do servidor.

## Cobertura e ambiguidades

Dois tipos de estado têm parcelas numéricas assistidas neste marco. Incapacitado é parcial: efeito narrativo/uso de membro, limiar de dano, resistência15 e duração pelo sucesso/falha/crítico continuam conferidos pelo mestre (p.397). Cansado é parcial quanto a aquisição de cansaço, relógio e descanso. Não muda a cobertura dos358 poderes pessoais nem a contagem5/59 de componentes de técnicas.

Desorientado permanece manual: pp.393–394 descrevem perda de dados, tabela de−4 e falha crítica de−6, cujo acúmulo por sentido deve ser esclarecido. Paralisado permite Cosmo mas retira movimento/luta (pp.395–396), exigindo distinguir técnicas/Ações de Cosmo das reservas antes de bloquear ações. Amedrontado envolve posição e vantagens cumulativas; Atordoado, Surpreso, morte e Sufocado precisam de eventos/testes/duração próprios. Não implementar esses estados por equivalência com uma penalidade genérica.

Fonte: pp.393–398. Autor: Dhoko de Libra; atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). Foundry13.350 real ainda precisa ser validado com mestre e jogadores; os testes locais não confirmam o servidor.
