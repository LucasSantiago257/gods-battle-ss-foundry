# Resistência ao Cosmo Residual

Desde0.23.0, ficha do usuário → Combate → Efeitos com duração → Resistir ao Cosmo Residual · mestre. O registro ativo criado na0.22.0 já contém a dificuldade fixa; nenhuma nova preparação/ativação é feita. O mestre responsável rola pelo alvo e registra o resultado somente no usuário.

## Dias e bônus cumulativo

A p.225 permite resistência diária ou segundo a técnica e testes seguidos após falha, mas combina bônus “a cada novo teste” e “por dia”. Este fluxo oferece três perfis explícitos, conservados depois do primeiro resultado:

| Perfil | Bônus cumulativo |
|---|---|
| Por dias | Dia informado − dia da primeira resistência registrada. Primeiro teste tem0; repetir no mesmo dia conserva o bônus; dias sem teste também contam. |
| Por tentativa | Quantidade de tentativas anteriores neste registro, inclusive no mesmo dia. Primeiro teste tem0. |
| Informado pela mesa | Valor final informado no campo cumulativo, permitindo exigências específicas, histórico anterior ou outra interpretação da campanha. |

Exemplo: primeiro teste no dia100, perfil dias. Tentativa seguinte ainda no dia100 recebe0; no dia103 recebe3. Perfil tentativas receberia1 e2, respectivamente. A escolha é uma convenção explícita da campanha, não uma resolução universal da ambiguidade do livro. O perfil manual aceita cumulativo no primeiro teste e ajustes posteriores declarados. Bônus adicional é separado; não inclua a mesma parcela nos dois campos.

Dia da campanha é inteiro0–1000000 informado pelo mestre. Não é relógio real, data civil, rodada ou vez do combatente. Primeira resistência ancora o contador; não se presume que dias anteriores à primeira resistência geraram bônus. Dias não retrocedem no registro. Depois de falha, outra tentativa confirmada pode ocorrer no mesmo dia: não existe limite automático de uma tentativa diária. O limite técnico de1000 tentativas por registro é declarado e não é regra do livro; além disso, resolver continuidade manualmente.

## Rolagem e resultado

O atributo sugerido vem da natureza congelada da técnica; o mestre pode escolher Vigor, Velocidade, Sentidos ou Cosmo conforme a aplicação. Usa resistência atual do alvo, modo de campanha graduação/modificador, modificador de nível, bônus pessoal/divino/assistido de resistência e parcelas específicas de técnicas. Bônus adicional, vantagem/desvantagem e cumulativo entram uma vez; condições assistidas ajustam dados/modificador uma vez. CD usa somente o valor Residual congelado, sem recalcular o PC ou excesso após evolução/edição da técnica.

Igualar ou superar aCD liberta o alvo e encerra este registro no usuário, mantendo histórico. Falha conserva Residual e permite nova tentativa confirmada; não prolonga prazo inicial nem aplica penalidade de Asterismo. Condições, anotação inicial, PV, armadura, CE/reserva/extra e ações de ambas as fichas permanecem iguais. Depósitos e devolução de CE específicos não são executados; custo de novas resistências de Controle1/1/2CE não se transfere ao Residual.

O usuário não precisa permanecer no combate/local depois da preparação. Resistência funciona fora do encontro se a ficha original do alvo estiver acessível no mundo, tokens ou encontros disponíveis. A técnica original pode ter sido removida; fonte eCD congeladas conservam o contrato. Cópia de ficha não herda identidade válida do registro; alvo deve ser o UUID original. Objetos, múltiplos alvos, condições/preparo especiais e execução por jogador/privada continuam manuais.

## Recuperação e concorrência

Dialogo fora da fila; confirmação serializada revalida mestre, permissões, ambos os sistemas, registro e contexto. Dois cliques da mesma prévia produzem um resultado. Histórico preserva perfil/dias/ordem, CD e matemática do cumulativo; valores inconsistentes exigem conferência, sem normalização silenciosa.

Operação no usuário prepara umRoll do alvo e cartão privado do mestre, grava tentativa/dias/encerramento em umActor.update e publica o mesmo cartão explicitamente público, independentemente da preferência geral de rolagem. Não importa resultado privado anterior e não gera flags/botões de dano. NenhumActor.update no alvo ou em recursos.

Preparação incompleta pode ser descartada sem nova rolagem. Resultado completo anterior só é registrado se participantes/sistemas/contexto conservarem o estado. Após aplicado, Recuperar mesmo resultado publica o mesmo cartão, preservando ajustes posteriores de recursos. Cartão ausente/alterado, autoria, cópia ou divergência não provocam rolagem/restauração; Encerrar pendência conserva ajustes. Um resultado aplicado sem publicação impede nova tentativa até recuperação. Cartão privado órfão antes de salvarID não deve ser publicado manualmente. FilaGM é coordenação no cliente, nãoCAS/transação do servidor. Notas opcionais, sem justificativas/aceites obrigatórios.

24 novos testes,373 totais, módulos/templates/manifesto e prévias locais. Validação real no servidor Foundry13.350 permanece pendente.

Fontes: livro V49.1.1 de Caio Carvalho Santiago, pp.224–225; [atribuição](../ATTRIBUTION.md), [preparação do Residual](cosmo-residual.md), [auditoria de regras](sustentacao-residual-auditoria.md).
