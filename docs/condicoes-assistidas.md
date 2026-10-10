# Condições assistidas — 0.25.0

Na ficha, **Combate → Condições assistidas → Registrar condição assistida · mestre** aplica parcelas numéricas de Cansado, de membros debilitados em Incapacitado e de sentidos perdidos em Desorientado. Ajustar condição muda a quantidade no mesmo registro, com histórico, sem encerrar/recriar. Registro explícito do mestre responsável, na fila comum; não converte marcações antigas nem interpreta nomes/descrições de poderes.

| Regra conferida | Parcela nas rolagens | Recuperação/duração |
|---|---|---|
| Cansado · p.393 | −2 por dia/nível de cansaço registrado em testes | Até descanso confirmado pelo mestre. Quantidade não cresce pelo relógio ou ao avançar rodada. |
| Desorientado · pp.393–394 | Tabela: −4 e perda de1 dado por sentido perdido; modificador final opcional substitui somente a penalidade. | Até o efeito causador terminar, conferido na mesa. Não resolve resistência nem progressão de perda de sentidos. |
| Incapacitado: membro debilitado · p.397 | −2 e perda de1 dado por membro conferido em testes | Registrar membros, resultado de resistência e prazo correto; encerramento explícito após recuperação. Não decide dano localizado nem restringe uso de membros automaticamente. |

## Registrar e encerrar

1. Como mestre, escolha condição e quantidade cumulativa final. Informe origem/contexto, detalhes (membros afetados), critério/prazo de encerramento e notas, se desejar. Todos os textos são opcionais; duração vazia usa Até encerrar. Não exige combate aberto: cansaço ou lesão podem persistir fora da luta.
2. Confira e retire somente parcelas da mesma condição já lançadas manualmente em modificadores/diálogos. Clique em Aplicar condição; não há caixa de aceite. Não há correção automática dos ajustes antigos; manter o mesmo −2 manual e assistido duplicaria a penalidade.
3. As parcelas entram em atributos, perícias, resistências, Asterismo de técnicas e ataque/defesa, inclusive fora do controle de ações. Prévia/cartão indicam a contribuição; resistências derivadas exibem o modificador resultante. As graduações e os modificadores base editáveis permanecem iguais.
4. Após recuperação conferida, **Encerrar condição**, sem motivo obrigatório, remove apenas a contribuição daquele registro. PV, CE, máximos, armadura, XP, notas, caixas de estado e ajustes manuais permanecem. Não oferece cura, repouso automático ou desfazer de dano.

É permitido um registro ativo próprio por tipo. Para mudar a quantidade, use **Ajustar condição**, informe o total final e salve. O mesmo ID permanece ativo e conserva antes/depois no histórico. Para recuperação completa, use Encerrar condição; não é necessário criar um registro intermediário. Cansado, membros debilitados e Desorientado podem coexistir e suas parcelas são somadas uma vez. Duplicatas ou dados inválidos são sinalizados e não concedem parcelas adicionais. Os limites1–1000 para dias/membros são guardas técnicas, não máximos do livro. Desorientado aceita1–6 sentidos: tabela394 inclui Audição, Intuição, Olfato, Paladar, Tato e Visão; a seleção e o efeito específico continuam na mesa. Modificador final aceita inteiro−100..0, limite técnico de entrada.

## Dados, valores e cálculos

Perdas de dados e vantagem/desvantagem entram na mesma expressão antes do piso/teto da jogada; o sistema conserva mínimo1 dado em uma jogada válida e os limites de parada existentes. Não transforma uma graduação de luta0 em luta treinada. A perda de dados não reduz a graduação de atributos/perícias, a aquisição de habilidades, os PV máximos ou os modificadores associados ao rank. Os dois campos internos derivados são recalculados das flags; valores antigos desses campos não ativam uma condição por si.

Nos testes de resistência, a fórmula provisória de graduação/modificador do atributo permanece configurável; condição soma sua penalidade e reduz os dados, sem reescrever essa escolha. No Asterismo, aplica uma vez os ajustes do estado, da condição e da situação. Não reduz CE, ND, dano/Poder de técnica, dificuldade, ações disponíveis, PA, Domínio ou movimento diretamente. Quantidade de ataques efetivos pode mudar porque a rolagem mudou.

As perícias e os atributos da ficha mostram bases preservadas; a seção de condições explica o ajuste aplicado na jogada. Encerrar remove a contribuição no próximo preparo/rolagem. O assistente de evolução conserva o contexto dos registros na projeção e não encerra nem cura condições ao subir de nível.

## Histórico, cópias e revisão

Registros guardam origem narrativa, tipo, quantidade, referência, critério de término, revisão e autor/data, sem copiar dados de rolagens privadas/cegas. Detalhes opcionais registrados pelo mestre ficam visíveis na ficha conforme suas permissões. Estados históricos ativos até revisão não expiram por fechar o mundo ou excluir o encontro; fim de luta/descanso precisa ser confirmado no registro.

Uma ficha/token com UUID próprio não recebe automaticamente a penalidade de registros copiados de outro UUID. Aviso identifica o histórico estrangeiro; encerrar afeta apenas a cópia, depois registre nela o estado conferido. Cancelar conserva tudo. Mudanças de registro durante prévia/rolagem invalidam a confirmação antiga; em operações centrais preparadas, use a recuperação existente. A fila coordena o cliente do mestre; edição direta/macros e testes genéricos continuam fora de uma transação global do servidor.

## Cobertura e ambiguidades

Três tipos de estado têm parcelas numéricas assistidas neste marco. Incapacitado é parcial: efeito narrativo/uso de membro, limiar de dano, resistência15 e duração pelo sucesso/falha/crítico continuam conferidos pelo mestre (p.397). Cansado é parcial quanto a aquisição de cansaço, relógio e descanso. Não muda a cobertura dos358 poderes pessoais nem a contagem5/59 de componentes de técnicas.

Desorientado é parcial: aplica parcelas numéricas por registro confirmado. A p.393 descreve perda cumulativa por sentido e a tabela394 lista−4 para cada sentido, enquanto falha crítica diz que o alvo aumenta para−6 sem formalizar acúmulo. Campo final vazio adota−4×quantidade; preenchido substitui esse total, permitindo−6 final ou outra interpretação da mesa. A perda de dados continua igual à quantidade, sem multiplicar pelo modificador. Não infere se falha crítica é−6 total ou por sentido: o mestre informa o total quando necessário. Dor/envenenamento sem perda sensorial, resistência de origem natural/cavaleiro, custo de nova resistência, prazo e progressão específica seguem manuais. Paralisado permite Cosmo mas retira movimento/luta (pp.395–396), exigindo distinguir técnicas/Ações de Cosmo das reservas antes de bloquear ações. Amedrontado envolve posição e vantagens cumulativas; Atordoado, Surpreso, morte e Sufocado precisam de eventos/testes/duração próprios. Não implementar esses estados por equivalência com uma penalidade genérica.

Fonte: pp.393–398. Autor: Dhoko de Libra; atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). Foundry13.350 real ainda precisa ser validado com mestre e jogadores; os testes locais não confirmam o servidor.


Na 0.18.1, as janelas do mestre para condições, efeitos, Controle, ajustes e recuperações não ocupam a fila enquanto aguardam sua decisão. Outros pagamentos podem prosseguir; a confirmação entra na fila para revalidar os dados e gravar. Se os dados conferidos mudarem, reabra a operação com a situação atual. A gravação continua coordenada no cliente do mestre, sem bloqueio global do servidor.


## Ajustes no mesmo registro desde0.25.0

Exemplo: dois sentidos perdidos, campo final vazio →−8/−2dados. Ajustar para três sentidos →−12/−3dados; recuperar dois e ajustar para um →−4/−1dado. Se o campo final for−6, o total de modificador fica−6 independentemente da quantidade de sentidos, até esse campo mudar/ficar vazio. Encerrar retira somente o registro assistido. A perda de dados não muda graduações/base/máximos/dano/custos/ações; todas as condições continuam separadas das caixas antigas e de ajustes manuais.

Ajustar conserva ID, autoria/data inicial, contexto e status; grava definição atual e revisão antes/depois em um únicoActor.update. Tipo não pode mudar; notas/textos são opcionais. Ajuste sem mudanças ou cancelado não escreve. Dois cliques da mesma prévia geram uma revisão; edição durante diálogo/preparo/leitura, mudança de mestre/UUID/propriedade ou operações interrompidas recusam a confirmação. Diálogo fora da fila comum. Resposta perdida após gravação deixa quantidade/histórico novos na ficha; repetir os mesmos valores não duplica revisão. Falha antes da gravação deixa registro anterior. Não usa custos/rolagens nem diário financeiro separado.

Histórico preserva sequência e antes/depois; divergência ou duplicata ativa exige conferência, sem sobrescrever histórico/parcelas. Limite técnico1000 ajustes por registro; ao atingir, encerre e registre continuidade manualmente. Cópia não herda parcelas nem permite ajuste financeiro/de estado sobre o registro estrangeiro; encerramento local continua disponível como antes. Limites derivados combinados agora comportam−4100/1006dados (casos extremos das três entradas), sem cortar contribuições válidas. Esquemas antigos mantêm defaults; não há conversão de caixas/descriptions por nome. Validação real13.350/concorrência do servidor pendente.

17 novos testes (410 totais). As358 entradas pessoais e866Items do catálogo não foram reclassificados como automáticos: aplicação de condições é um contrato separado, parcial. Ver [roteiro de validação](validacao-foundry.md).

Desorientado usa contrato de regra2; Cansado/membros mantêm regra1. Anotações antigas com o tipo Desorientado mas contrato1/ausente continuam sem parcela e precisam ser registradas pelo fluxo atual. Não converter registros antes desconhecidos só porque o nome passou a existir. A versão do esquema geral permanece3.
