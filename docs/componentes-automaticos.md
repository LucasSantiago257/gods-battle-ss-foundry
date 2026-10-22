# Componentes: cobertura atual — 0.58.0

O catálogo contém 59 referências de Big Bangs e incrementos, incluindo primordiais. Dez referências têm os apoios específicos listados abaixo: sete pertencem ao grupo numérico de Dano, Movendo tem configuração própria de ações e Brasas/Quebrar Armadura Sustentada usam registros separados por rodada. Essa contagem mede referências com algum suporte, não execução integral dos seus textos nem proporção de conclusão do sistema. A cobertura pessoal de virtudes/habilidades/dádivas é outra matriz.

| Referência | Apoio disponível | Limite principal |
|---|---|---|
| Esgotar · p.228 | Quantidade escolhida aumenta ND e custo em 2 CE por graduação. | Requer grupo de Dano habilitado e pagamento válido. |
| Essência Alvo · p.228 | +1 ND quando selecionada a Essência contrária. | O jogador confere a relação entre as Essências. |
| Terreno Favorável · p.230 | +1 ND quando selecionado o ambiente especificado. | O ambiente é conferido na mesa. |
| Controle sobre o Espaço · pp.217–218 | +1,5/+3/+4,5 m de alcance. | Não ignora paredes, geometria ou medição indisponível. |
| Controle sobre as Estrelas · p.219 | +1/+2/+3 no PC congelado da ativação. | O texto sobre perfurar defesas não remove PA automaticamente. |
| Controle sobre a Destruição · p.219 | −1/−2/−3 na resistência desta ativação. | Não cria penalidade persistente. |
| Enfraquecer · p.227 | Graduação efetiva do atributo da natureza como penalidade nesta resistência. | Extensão a outros ataques continua manual. |
| Movendo · p.229 | Movimento Parcial ou Total junto ao pagamento da técnica. | Configuração própria; área, Residual e primordiais mistos permanecem manuais. |
| Quebrar Armadura · p.229 | Sustentada:1/2/3PV de armadura por rodada; vínculo específico, Ajustar, prazo e recuperação. | Registro separado pelo mestre no alvo; instantânea +1ND e primordiais mistos permanecem manuais. |
| Brasas · p.225 | Parcela de PV registrada por rodada, com aplicação direta ou ajuste. | É preciso registrar no alvo após ativação/resistência; não surge automaticamente. |

## Como habilitar

Para os sete cálculos do grupo de Dano, conclua a composição personalizada e habilite o grupo em **Configurar**. A versão interna atual do grupo é 4; cópias com grupos anteriores conservam seus cálculos até nova configuração. Custos/slots já incluídos não são somados novamente.

Movendo é independente desse grupo: **Configurar → Ações na ativação**. Composições personalizadas válidas permitem escolher Parcial ou Total conforme a técnica. Cinco referências do livro oferecem apenas o modo impresso: Lança Dourada usa Total; Teletransporte, Velocidade mental, Velocidade física e Velocidade (Ar) usam Parcial. Cópias existentes mantêm a reserva de luta padrão até a escolha explícita. Não importa novamente a técnica nem desloca o token.

Quebrar Armadura Sustentada usa o botão próprio no alvo quando há composição apta; veja [vínculo, prazo e ensaio](armadura-recorrente.md).

Brasas usa **Combate → Efeitos com duração**. O registro acompanha origem, parcelas e histórico, sem dano ao avançar rodadas. Veja [efeitos com duração](efeitos-duracao.md). Detalhes de Movendo, fontes e limites estão no [roteiro atual](proximos-desafios.md).

## Contratos ainda pendentes

Controle Atômico tem relação entre contagem de resultados e graduação a esclarecer; Controle sobre a Energia exige definir devolução, falha e interação com excesso de CE; Guardar envolve a duração imóvel; Vitalidade precisa de contrato de dano causado, cura e recuperação; Sacrifício mantém dúvidas de repetição/cobrança em falha; A forma instantânea de Quebrar Armadura mantém dúvida sobre conversão de +1 ND entre faixas; a parcela fixa Sustentada tem o fluxo próprio acima. Não foram implementados por suposição. Novas mecânicas de condições seguem adiadas por decisão de Lucas.

Permissões, assinatura da prévia, cobrança única e recuperação continuam validadas no processamento. Testes e navegador isolado não confirmam o core hospedado13.350. Fontes e licença do catálogo permanecem em [ATTRIBUTION.md](../ATTRIBUTION.md).

## Registros dos marcos anteriores

As seções datadas abaixo descrevem o escopo de cada entrega histórica. As contagens e pendências antigas não substituem a tabela atual acima.

## Enfraquecer — 0.43.0

Em técnicas personalizadas de Dano com composição canônica salva, Enfraquecer (p.227) aplica como penalidade na resistência a graduação efetiva do atributo-chave da natureza da técnica: Força/Físico, Sentidos/Mental, Velocidade/Natureza ou Cosmo/Manipulação. Usa graduação, não o modificador da tabela nem bônus situacional do Asterismo. A associação manual da perícia Asterismo não redefine a natureza do golpe. A graduação inclui os benefícios de atributos já suportados pela ficha e fica congelada na ativação paga, com nome do atributo e valor no cartão.

O cálculo cobre a resistência contra **esta ativação**. Não reduz permanentemente a ficha do defensor, não cria uma condição e não estende a penalidade automaticamente a outros ataques do usuário. A formulação da p.227 menciona testes contra o PC do usuário sem estabelecer aqui duração/alcance entre técnicas: essa extensão continua manual até contrato próprio. Primordiais Controle/Sustentada/Residual e técnicas de catálogo sem composição canônica continuam fora deste grupo.

Destruição e Enfraquecer, quando presentes na mesma composição, entram como parcelas negativas distintas, somadas uma vez no teste; o cartão lista ambas. O PC, os dados de resistência, ND, dano, alcance, dificuldade de Asterismo e custo fixo não recebem bônus novos por Enfraquecer. Slots já estão no custo da composição, sem nova cobrança. Resistência rápida e Ajustar usam a mesma parcela; ajustes situacionais continuam separados. Sem novas condições.

Cópias com grupos1/2/3 mantêm Enfraquecer manual. Salvar Configurar com o grupo habilitado adota o grupo4; desabilitar volta ao fluxo manual, sem alterar os parâmetros base. Composição e graduação são recalculadas pelo mestre antes do pagamento; alterações durante a prévia/rolagem interrompem a operação. Recuperar resultado pago conserva a graduação original mesmo se o usuário evoluir depois, sem repetir rolagem/custo. Cartões antigos de Destruição mantêm metadados anteriores; cartões novos com ambas as parcelas validam soma, natureza, atributo, graduação, IDs/chaves e duplicatas antes de rolar.

Fontes: p.227 (Enfraquecer), p.219 (Destruição), regras de natureza e Asterismo pp.193/198. Autor: Dhoko de Libra; [atribuição](../ATTRIBUTION.md). Implementação parcial explicitada acima; testes locais não confirmam execução no core hospedado13.350.

## Controle sobre a Destruição — 0.35.0

O incremento canônico de graduação 1/2/3 aplica −1/−2/−3 ao teste de resistência contra a técnica de Dano, conforme p.219. O mestre congela a parcela no cartão da ativação. Resistência rápida e ajustada incluem a penalidade uma vez, mostrando-a como já incluída; o modificador situacional continua disponível para outras parcelas. O PC, a quantidade de dados, ND, dano e custos permanecem os calculados pelas outras regras.

Cópias com grupos anteriores conservam seus cálculos até salvar Configurar com o grupo ligado. O novo grupo interno versão3 mantém Estrelas e acrescenta Destruição; não migra fichas ou interpreta nomes livres. O efeito é somente sobre o teste daquela técnica: não cria condição persistente ou alteração no alvo. Cartões antigos sem metadados mantêm resistência anterior; metadados incompatíveis são recusados antes de rolar. Recuperar publicação conserva a mesma parcela e pagamento. A chave original do catálogo conserva o erro de título do livro: increment:Controle sobre s Destruição; o nome exibido permanece corrigido.

## Controle sobre as Estrelas — 0.34.0

Em técnicas personalizadas de Dano com composição salva e componentes habilitados na configuração atual, Controle sobre as Estrelas (p.219) soma +1/+2/+3 ao Poder Cósmico pela graduação. A prévia, o cartão e a dificuldade da resistência usam esse PC final. O incremento não acrescenta ND, dano corporal ou dano à armadura e não cobra novamente o Condensar já incluído no custo fixo da composição. A implementação cobre o bônus numérico da tabela; não cria uma nova regra de remoção de PA a partir do texto descritivo.

Cópias com o grupo habilitado antes desta versão conservam o PC anterior: Estrelas continua manual até salvar Configurar com o grupo ligado. A configuração lista os componentes e explica o novo cálculo. Confira eventuais bônus equivalentes lançados manualmente. Desligar o grupo ou recompor conserva bases, recursos, notas e histórico. A versão interna do grupo fica na cópia, sem migração automática.

O processamento do mestre recalcula o bônus da composição canônica; recuperação conserva o mesmo PC e pagamento. Não automatiza outros incrementos ou primordiais mistos, Controle e Sustentada.

## Componentes assistidos — 0.15.0

Desde0.16.0, Brasas também possui acompanhamento periódico confirmado pelo mestre, em fluxo separado. Veja [efeitos com duração](efeitos-duracao.md); os quatro cálculos deste guia permanecem iguais.

Este primeiro grupo calcula quatro componentes de **técnicas personalizadas com primordial Dano** e composição salva no construtor. Não interpreta nomes escritos nos campos livres nem ativa efeitos de todas as técnicas do catálogo.

| Componente | Parte calculada | Conferência necessária |
|---|---|---|
| Esgotar · p.228 | Cada aumento escolhido acrescenta1ND e2CE ao custo desta ativação; atualiza dificuldade e pagamento. | Escolher a quantidade e conferir CE/queima de PV na prévia. |
| Essência Alvo · p.228 | +1ND quando confirmado na ativação. | Alvo marcado, Essência contrária conferida pelo jogador e notas opcionais. Não deduzir bondade/maldade de texto livre. |
| Terreno Favorável · p.230 | +1ND quando confirmado na ativação. | Ambiente especificado no parâmetro do componente no construtor e seleção do ambiente atual; notas opcionais. |
| Controle sobre o Espaço · pp.217–218 | +1,5/+3/+4,5m ao alcance base pelas graduações1/2/3. | Aquisição/graduação de Mestre, alcance base e distância na cena. Não mede geometria nem aplica penalidades automaticamente. |

### Como usar

1. Crie/conclua uma técnica personalizada com esses componentes, usando os Big Bangs/incrementos reais do compêndio. Para Terreno Favorável, informe o ambiente no campo **Parâmetro / escolha**.
2. Abra **Configurar** na técnica. Confira custo publicado/fixo, ND/Poder e alcance **base**, retirando dos parâmetros apenas bônus desses componentes que você já havia lançado manualmente, se necessário. Marque **Automatizar este grupo de componentes da composição salva** e salve a configuração.
3. Em **Ativar**, escolha os aumentos de Esgotar e confirme os contextos aplicáveis. Essência/Terreno não exigem justificativa; Essência exige um alvo marcado. A prévia calcula custo, dificuldade, dano normal/crítico e alcance.
4. Confira e confirme. O mestre recalcula a partir da cópia/composição salva, paga uma vez pela fila e publica as parcelas/referências no cartão. A rolagem de resistência e o dano continuam no fluxo existente.

Custo de slots e o +1Condensar por tipo de incremento já estão no custo fixo da composição; este grupo não os cobra novamente. A graduação de Espaço altera alcance, não multiplica a cobrança de Condensar. Somente a queima variável de Esgotar acrescenta CE nesta ativação. Não informe a mesma queima novamente em **CE adicional** ou **Elevar Cosmo**.

Esgotar soma ND antes do cálculo de dano. Essência/Terreno só entram quando conferidos; não são descobertos automaticamente. Sucesso crítico conserva o +1ND já implementado. O dano à armadura segue as faixas do fluxo existente após o ND final. Falha paga a CE autorizada e as ações do encontro, mas não causa dano/efeito; veja acoes.md e ativacoes.md.

### Preservação e limites

Opção inicialmente desligada, sem migração automática de fichas ou mudança dos parâmetros manuais. Desmarcar na configuração volta à aplicação manual; notas, IDs, recursos e histórico permanecem. Refazer a composição desliga a opção para uma nova conferência. Alterar composição/adesão durante prévia ou rolagem impede cobrar parâmetros novos sobre uma confirmação antiga.

Recuperar publicação usa o mesmo resultado e pagamento, sem repetir Esgotar, CE/PV ou ações. Registro mantém parâmetros/componentes/contexto sem copiar os dados privados de Roll para o Actor. Outros componentes são listados como manuais na ativação/cartão. A técnica pode conter esses componentes, mas este grupo não executa seus efeitos, estados ou testes de confirmação.

Primordiais mistos, Controle, Sustentada e Cosmo Residual continuam fora deste grupo. Não aplica duração/estado persistente, recuperação de CE, cura, movimentação de token, área, múltiplos alvos ou testes de chance. O uso de incrementos do personagem em todas as técnicas também exige conferência/aquisição; o construtor não concede Mestre. Não acrescentar componentes silenciosamente a cópias existentes.

### Cobertura e ambiguidades

Quatro componentes possuem cálculo assistido neste marco, entre59 entradas do pack de componentes (incluindo primordiais). Não significa que quatro poderes pessoais tenham sido automatizados; a matriz de358 entradas pessoais permanece separada.

Antes dos próximos grupos: Controle Atômico precisa esclarecer a relação entre cada0 e a tabela de graduação, além da CE extra por1; Controle sobre as Estrelas menciona perfurar defesas e bônus de PC, exigindo revisar resistência/dano; Guardar envolve tempo imóvel; Brasas/Dreno dependem de duração e cobrança recorrente; Movendo precisa representar movimento parcial/total sem presumir que sejam dois usos. Eles continuam manuais. Condições, confirmação percentual, sustentação e cura exigem operações/expiração próprias.

Fontes conferidas: pp.217–218,228,230 e regras gerais de composição/ativação. Autor: Dhoko de Libra. Atribuição/licença em [ATTRIBUTION.md](../ATTRIBUTION.md). Testes locais e prévias não substituem validação em Foundry13.350 com mestre e jogadores.
