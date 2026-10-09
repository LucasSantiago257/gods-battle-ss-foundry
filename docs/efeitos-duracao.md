# Efeitos com duração — 0.16.0

Na ficha do alvo, **Combate → Efeitos com duração → Registrar efeito · mestre** acompanha origem, duração e resolução por rodada. É uma operação explícita do mestre responsável, na fila compartilhada com ações, técnicas, dano e evolução. Não registra ou aplica efeitos ao abrir o mundo ou avançar o rastreador.

## Brasas assistidas

Este marco cobre **Big Bang Brasas** em técnica personalizada pronta com primordial Dano e composição salva contendo o componente canônico. A lista reúne cópias dos personagens e tokens disponíveis; nomes escritos livremente não habilitam a regra. A classificação da técnica define a parcela base: Bronze5, Prata10, Ouro15 PV por turno (p.225). ND, Esgotar e status posterior não multiplicam essa parcela. Classe/origem ficam congeladas no registro histórico; alterar/recompor a técnica depois não reescreve o efeito já conferido.

1. Resolva a ativação, resistência e dano inicial pelo fluxo existente. A aplicação de Brasas não é deduzida do cartão; o mestre precisa conferir se o efeito persiste.
2. Abra um encontro iniciado com exatamente um combatente para a ficha do alvo. Registre o efeito, selecione a técnica e informe **duração final em rodadas**, primeira aplicação nesta/próxima rodada e justificativa. Revise duplicação de duração por falha crítica, imunidades e regras específicas. Este assistente não interpreta o texto da duração.
3. Cada rodada agendada apresenta **Conferir rodada**. O mestre vê a parcela base e os PV atuais, confere o dano corporal final (inclusive ajustes justificados) e confirma. Pode dispensar a rodada sem dano com motivo. PV, rodada e conclusão são gravados juntos; armadura, CE, ações, condições marcadas e campos manuais são preservados.
4. Depois da última rodada resolvida/dispensada, o registro fica **Duração concluída**, conservando histórico. **Encerrar após revisão** interrompe antes disso com motivo, sem cobrar rodadas pendentes, devolver PV ou remover condições manuais.

Rodada do Foundry representa o turno coletivo do livro. Escolher nesta/próxima rodada é uma convenção explícita da integração para o momento confirmado pelo mestre; não afirma que o livro define um único instante para o dano periódico. Duração aceita1–1000 rodadas como limite técnico, sem alterar limites da técnica. Mudar a vez não aplica dano. Avançar muitas rodadas sinaliza atraso e exige conferir cada rodada pendente, em ordem; não cobra tudo silenciosamente. Retroceder não apaga registros nem permite aplicar outra vez uma rodada concluída.

Não presume cumulatividade: outra aplicação de Brasas da mesma cópia exige encerrar/revisar a anterior. Origem diferente também exige conferência do mestre sobre acúmulo. Não acrescenta CE, dano à armadura, duplicador por ausência de armadura, resistência nova ou cura. O dano final é revisado explicitamente; a parcela não é enviada ao cartão de resistência nem cobrada como nova ativação.

## Anotações de condições e outros efeitos

**Anotação de efeito / condição manual** guarda nome, referência, descrição, duração e revisão. Passar uma rodada registra a conferência com dano0. Não marca/desmarca caixas de condição, cria bônus, limita ações, move tokens, cobra CE ou executa uma regra pelo nome. Assim o mestre pode acompanhar uma condição sem alterar ajustes que já aplicou manualmente.

Detalhes registrados ficam visíveis na ficha do alvo; o mestre confirma isso antes de salvar. Não copia dados de rolagens cegas ou privadas para o Actor nem publica mensagem adicional de chat. Não oferece leitura automática de cartões privados.

## Interrupção, cópias e preservação

Antes de resolver, um journal guarda o estado anterior/posterior previsto. A conclusão atualiza PV e histórico em um único Actor.update. Se houver falha ou alteração de ficha/rodada/propriedade/mestre entre as etapas, não se repete a tentativa: **Conferir efeito interrompido · mestre** reconhece o posterior já gravado ou encerra o anterior intacto sem gasto. Divergência exige reparo manual e confirmação expressa; a revisão conserva os PV atuais. Tentativas preparadas bloqueiam outras alterações pela fila até conferência.

Cancelamento não gasta nem conclui uma rodada. Não há desfazer automático do dano de Brasas; um reparo posterior é manual e precisa ser justificado no encerramento/revisão. Não confundir com o desfazer do dano inicial do cartão. A fila é coordenação do cliente do mestre, sem CAS/transação global do backend; edição direta, macros e chamadas externas continuam fora dessa serialização. Validar concorrência e reconexão no servidor.

Fim/exclusão do encontro ou substituição do combatente pausa o registro para revisão; não cobra nem remove o efeito. Reutilizar/reiniciar o mesmo encontro não apaga rodadas anteriores. Encerre/recrie o registro ao iniciar outro ciclo de duração. Tokens com UUID próprio têm registros independentes. Uma ficha copiada com histórico de outro UUID não pode resolver o efeito original; encerrar/revisar afeta apenas a cópia, e um novo efeito deve ser registrado nela.

## Cobertura e próximos grupos

Brasas acrescenta resolução periódica assistida a um componente, além dos quatro cálculos de0.15.0: **cinco entradas entre59 componentes têm alguma assistência**, com limites diferentes; Brasas continua exigindo conferência explícita de resistência/duração. Isso não altera a matriz dos358 poderes pessoais nem representa automação integral de condições.

Próximos grupos: efeitos de condições com contribuições derivadas reversíveis; duração/testes próprios de Controle; Dreno com definição de destino da CE e reservas; Sustentada/Residual com duelos, custo/tempo e testes de libertação. A fonte p.225 exige oposição para Sustentada, e p.227 descreve retirada de CE por Dreno sem estabelecer neste trecho transferência ao usuário: não inventar restauração/transferência. Duração varia por técnica (p.233), e a relação entre eventos de fim e dano periódico precisa ser definida antes de cobrança automática.

Fonte: pp.225,227,233. Autor: Dhoko de Libra; licença/atribuição em [ATTRIBUTION.md](../ATTRIBUTION.md). Sem reprodução de páginas/imagens do livro no pacote. Testes locais/previews não confirmam execução no Foundry13.350 real.
