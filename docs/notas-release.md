# 0.62.0 — Reparo de armaduras por horas informadas

Um conjunto integrado para acompanhar Consertar Armaduras: escolher técnica/armadura, registrar gratuitamente, aplicar uma hora, ajustar PV/custo, desfazer a última parcela intacta, encerrar e consultar histórico. O painel fica em Equipamento → Armadura da ficha que possui a técnica. Sugestão de nível/1CE, máximo derivado, CEextra e excesso explícito; custo0 disponível para pagamento já resolvido manualmente.

O dono atua sobre origem e alvo que pode editar; o mestre coordena automaticamente. Mensagens privadas/discretas, autorização real, cobrança única e journals nos dois Actors protegem interrupções entre pagamento e Item. Recuperação completa somente a parte ausente ou encerra preservando ajustes. Reenvio não repete uma hora nem grava um recibo histórico sobre a ficha atual.

A entrega conserva Atacar/Técnicas, catálogos e condições existentes. Não cria calendário, cura ao importar/ativar, revivificação/evolução ou perda de PVA por ataque comum. [Uso, limites e ensaio](reparo-armaduras.md).

Validação:77testes focados de plano/runtime/transporte/callbacks, suíte Linux/roundtrip/check/pacotes no CI e oito cenários Edge isolados com teclado440px, registro/aplicação/Ajustar/Desfazer reais e privacidade. O ensaio hospedado13.350 e conexões simultâneas continuam separados.

## 0.61.0 — Armaduras legíveis e auditoria de referências

O conjunto reúne requisito legível, estado da armadura efetivamente aplicada, apresentação em janela estreita e auditoria de cobertura. Não acrescenta bloqueios de equipamento ou regras de dano.

- Item Armadura mostra Cosmo mínimo para Bronze/Prata e o Sentido da tabela para Ouro/Divina/Kamui. O campo numérico interno é preservado; requisitos continuam a cargo da mesa.
- Lista e Item distinguem Bônus aplicados, Guardada e Sem bônus com motivo real. A ordem visual não troca a armadura usada pelo cálculo. Valores manuais, passivas, recursos atuais e cópias são preservados.
- CE ajustada negativa aparece sem sinal duplo; nomes longos, teclado e440px foram conferidos. Atacar e organização de Técnicas preservados.
- Matriz de cinco classes e22artefatos cruzada com as fontes e identidades publicadas. Lista688–698 inventariada:168referências principais,11referências coletivas/personagens de Ares e7menções incidentais de armas. Contagens não equivalem a novos Items ou automação integral.
- Oito regressões de apresentação/equipamento,671testes Linux completos e ensaio Edge isolado com callbacks da ficha. Core hospedado13.350 e concorrência real permanecem pendentes.

Catálogos e UUIDs conservados. Sem migração, novas condições, cura/corte de recursos, perda geral de PVA em ataque comum ou inferência para regras ambíguas. Referências dispersas e poderes individuais continuam no roteiro. [Fontes, convenções e limites](auditoria-armaduras-artefatos.md).

## 0.60.1 — Correção do pagamento ao elevar Cosmo

Corrige falso conflito causado por comparar comandos internos de gravação em formatos diferentes. A autorização passa a transportar os valores de CE/PV; solicitações antigas continuam compatíveis. Elevar, custos, permissões, fila, cobrança única e recuperação preservados. Patch isolado por falha que bloqueava uso, sem nova regra ou condição.


## 0.60.0 — Andamento por alvo da área

- Novos cartões acompanham resistência e dano de cada defensor pelos resultados legíveis e journal existente.
- Mestre e dono recebem suas ações; outros jogadores conservam só os nomes públicos. Atualização remove estados antigos após perda de acesso, exclusão ou troca de identidade.
- Aplicar/Ajustar/Desfazer continuam no resultado individual, sem nova cobrança ou aprovação humana. Cálculo do dano recolhido; valores e avisos reais visíveis.
- Ensaios de módulos vinculados/sintéticos e Edge isolado; core hospedado13.350 e concorrência real pendentes. Catálogos e regras preservados.


## 0.59.0 — Ativação legível para a sessão

Ativar agora começa pelos valores e pelo alvo. Ajustes ficam em grupos opcionais, preservando a organização atual de Técnicas e os mesmos cálculos/pagamentos.

- Custo, dificuldade, PC e dano por tipo no topo; Controle exibe duração base e Sustentada omite dano genérico.
- CE/Elevar/Condensar, teste e componentes ficam recolhidos. Abrir/fechar conserva as escolhas; ativação comum segue direto com os mesmos defaults.
- Distância e área mantêm opções explícitas, alvos originais, medidas/atualização e forma opcional. Avisos de CE/ND/cena/alvo alterado continuam visíveis e bloqueiam quando necessário.
- Campos vazios não criam textos soltos; cálculos detalhados ficam recolhidos. Teclado, nomes longos e janela440px conferidos em Edge isolado.
- Ensaio integrado de formulários reais/callbacks e coordenação do pagamento com Dano/Controle/Sustentada/Esgotar/Movendo/área. Cancelar e preparar não gastam; pagamento e reservas continuam únicos.
- Sem regras novas, migração, catálogos alterados ou perda automática de armadura em ataque físico comum. Validação no core hospedado13.350 e conexões reais continua pendente. [Uso e limites](ativacao-direta.md).

## 0.58.0 — Quebrar Armadura Sustentada: composição, parcelas e recuperação

Técnicas personalizadas Sustentadas com Quebrar Armadura canônico podem acompanhar1/2/3PV de armadura por rodada em Bronze/Prata/Ouro. O mestre registra prazo finito e início no alvo após resolver a ativação e os efeitos da técnica.

- Construtor e seletor indicam o fluxo separado. O painel mostra a armadura vinculada, PV atuais, parcela, prazo e histórico; Aplicar/Ajustar/dispensar preservam notas opcionais.
- Troca/remoção, cópias, prévia antiga e cliques concorrentes não transferem ou repetem parcelas. O registro não aplica dano ao avançar rodadas.
- Journal precede a gravação de Item+Actor. Interrupção após o débito pode completar somente o registro; reparos/edições posteriores são preservados. Encerrar a operação também encerra seu efeito, sem alterar PV.
- Nenhum débito de corpo/CE/ações/condições; manutenção/oposição e extensão de Sustentada continuam no fluxo próprio. Forma instantânea +1ND, técnicas mistas e dano físico comum à armadura permanecem manuais.
- Catálogos, UUIDs e organização de Técnicas preservados; sem migração. [Ensaio curto](armadura-recorrente.md#ensaio-curto), inclusive com fichas de exercício. Testes isolados e CI não substituem o ensaio hospedado13.350 ou conexões reais.

## 0.57.0 — Marco integrado de combate e ensaio da one-shot

- Atacar abre com a habilidade treinada de maior graduação. O botão permanece no topo; a organização de Técnicas foi preservada.
- Ativar seleciona uma reserva inteira disponível de ataque/defesa; opções indisponíveis ficam desabilitadas. Cálculo, gasto único e recuperação permanecem os mesmos.
- Novo grupo de treino cria três fichas privadas sem restaurar cópias anteriores. Lyra inclui Dano, Controle e Sustentada para praticar prazo/recarga sem condições novas.
- Títulos de efeitos válidos apresentam um prazo claro, preservando avisos reais, estados pausados e histórico.
- Ensaio documentado para mestre/jogadores e integração de construção/configuração/ativação, custo/dificuldade/dano/distância, resistência, aplicação/Ajustar/Desfazer, área por alvo, duração e recuperação de publicação perdida.
- Dono aplica dano em si e mestre nos defensores, sem aprovação humana; proteções e coordenação automática preservadas. Ataque físico comum continua sem perda automática de PV da armadura.
- Catálogos Item, UUIDs anteriores, fichas, notas e recursos preservados. Sem migração de dados.
- O combate básico foi confirmado por Lucas no servidor. Testes e navegador isolados desta entrega não comprovam o percurso completo no core hospedado13.350; veja [o ensaio](https://github.com/LucasSantiago257/gods-battle-ss-foundry/blob/main/docs/fichas-teste.md).

### Histórico de entregas anteriores

## 0.36.0 — Busca e leitura de componentes na composição

- O seletor de Big Bangs/incrementos busca por nome ou página e filtra por tipo, com leitura da regra e requisitos na mesma janela.
- Componentes já escolhidos ficam fora da lista; busca sem resultado impede adicionar. Adicionar mantém a referência acessível, sem abrir outra ficha automaticamente.
- Cancelamento, propriedade, permissão, identidade do documento e duplicatas são conferidos antes da gravação. Custos, recursos, condições e catálogos preservados.
- Foundry hospedado não validado.

## 0.35.0 — Controle sobre a Destruição na resistência

- Técnicas personalizadas de Dano com o grupo atualizado aplicam −1/−2/−3 no teste de resistência pela graduação do incremento (p.219).
- Prévia e cartão mostram a parcela; resistências rápida e ajustada a incluem uma vez, conservando PC, dados, dano e custos.
- Cópias anteriores conservam seu grupo até salvar Configurar ligado. Cartões antigos mantêm os cálculos; recuperação conserva metadados e pagamento.
- Nenhuma nova condição, débito adicional ou alteração dos catálogos. Foundry hospedado não validado.

## 0.34.0 — Controle sobre as Estrelas no Poder Cósmico

- O incremento canônico de graduação 1/2/3 soma +1/+2/+3 PC em técnicas personalizadas de Dano com o grupo de componentes atualizado pela configuração.
- Prévia, cartão e dificuldade de resistência usam o PC final; ND, dano e custo fixo permanecem preservados.
- Cópias anteriores não recebem o bônus silenciosamente: precisam salvar Configurar com o grupo ligado. Desligar conserva parâmetros base e recursos.
- Recuperação conserva o mesmo PC e pagamento. Sem novas condições ou alteração dos catálogos. Foundry hospedado não validado.

## 0.33.0 — Resistência de técnica sem janela extra

- Resistir no cartão da técnica rola diretamente contra o Poder Cósmico do ataque, com modificador situacional zero e vantagem normal.
- Ajustar resistência conserva a janela de modificador e vantagem/desvantagem, com cancelamento e dificuldade vinculada ao ataque.
- Cliques simultâneos entre os dois botões no mesmo cartão/cliente não rolam duas vezes. Permissões, alvo, condições existentes e modo de rolagem são preservados.
- Resistir não gasta CE/ações nem aplica dano. Testes genéricos continuam com janela; nenhuma nova regra de condições. Foundry hospedado não validado.

## 0.32.0 — Efeitos ativos separados do histórico

- O painel Efeitos com duração mostra Ativos e pendentes primeiro e recolhe o Histórico de efeitos, com contagens.
- Registros concluídos, encerrados ou com segundo Asterismo falho conservam detalhes e histórico. Efeitos pausados, cópias e estados desconhecidos continuam visíveis na área principal.
- Notas vazias deixam de ocupar uma linha; Encerrar efeito mantém a ação existente, sem declaração obrigatória.
- Não altera custos, prazos, resolução, recuperação, condições, catálogos ou cópias. Foundry hospedado não validado.

## 0.31.0 — Aplicação direta do dano calculado

- Ataques físicos e resistências de técnicas de dano oferecem Aplicar dano com os valores corporais e da armadura no botão, sem abrir outra janela numérica.
- Ajustar dano mantém o formulário de exceções e notas opcionais; Desfazer continua separado, com confirmação e conferência dos recursos.
- A aplicação continua explícita, processada pelo mestre ativo e protegida por permissões, acesso ao cartão, contexto, cobrança única e recuperação.
- Nenhuma nova regra de condições. Catálogos e cópias preservados. Foundry hospedado não validado.

Versão **0.30.0** para FoundryVTT 13 build 350.

## 0.30.0 — Dificuldade assistida para TAP de Vigor

- Ao ultrapassar o limiar geral de Atordoado, a ficha calcula a CD de Vigor como `10 + dano/10` usando o dano corporal agregado da rodada, sem arredondamento.
- A regra, o gatilho e a precisão permanecem os da p.396; a interface apenas apresenta a CD calculada no contexto do encontro.
- O jogador ainda realiza o teste; registrar Atordoado em caso de falha e encerrar após a rodada completa continuam manuais.
- 435 testes totais; comparação decimal e contexto do encontro cobertos. Foundry hospedado não validado.

## 0.29.0 — Acompanhamento do limiar de Atordoado

- Cartões de ataque/dano guardam encontro, rodada, época e PV totais do alvo no momento do ataque.
- A ficha soma somente dano corporal aplicado naquela rodada; dano à armadura é excluído e desfazer remove a parcela do total.
- O limiar usa `dano > 70% dos PV totais`; igualdade não dispara. A ficha mostra progresso e sinaliza quando o teste de Vigor deve ser feito.
- O teste de Vigor/CD, o registro do estado após falha e a expiração após uma rodada ainda são manuais. Danos sem contexto confiável de encontro seguem a conferência manual.
- Três testes novos de agregação/contexto no total final da versão (435 testes aprovados). Foundry hospedado não validado.

## 0.28.0 — Estado Atordoado (parcial)

- Novo estado assistido Atordoado, persistente na ficha e referenciado à p.396.
- Enquanto ativo, bloqueia movimento, ataque, defesa, Ação de Cosmo, Reação e ativação monitorada de técnicas antes de rolar ou gastar recursos.
- Aplicar o gatilho (>70% dos PV totais recebidos em uma rodada), teste de Vigor/CD e encerrar após a rodada ainda são decisões manuais do mestre.
- Paralisado e demais condições, fichas e compêndios preservados.


## 0.27.0 — Paralisado e bloqueios de ação

- Novo registro assistido de Paralisado por ficha, com origem/duração opcionais, p.395–396.
- Bloqueia ataques, defesas e movimentos na validação e nos botões; mantém Ações de Cosmo e Reação disponíveis.
- Com controle de reservas, técnicas que selecionam Ataque/Defesa e Cosmo Residual também respeitam o bloqueio.
- Resistência, CD, novas tentativas e término do estado permanecem conferidos pelo mestre; sem automação de duração.
- Validação manual fora do controle de ações: classificação de ação de técnicas específicas continua pendente.

## 0.26.0 — Movimento Parcial/Total e ações de Cosmo

Movimento tem parcelas pela Velocidade efetiva; parcial usa uma e total exige reserva intacta. Ação de Cosmo tem contador de registros sem limite arbitrário, custos/efeitos do poder separados. Segundo Asterismo de Residual registra Cosmo+parcela com resultado/penalidade, inclusive falha, sem repetirCE ou gastar luta. Legados/ajustes/cópias e recuperação preservados.19 testes novos,429 totais; Foundry13.350 real pendente. Ver [ações](acoes.md) e [Residual](cosmo-residual.md).

## 0.25.0 — sentidos perdidos e ajustes de condições

Desorientado aplica−4 e perda de1dado por sentido confirmado, com campo opcional de modificador final para falha crítica/convenção da mesa. Cansado, membros debilitados e sentidos perdidos podem ser ajustados no mesmo registro, com antes/depois e confirmação protegida contra alteração de estado/GM/UUID. Sem encerrar/recriar, novos custos, justificativas ou aceites.17 testes novos,410 totais e prévias locais; servidor13.350 pendente. [Condições assistidas](condicoes-assistidas.md).

## 0.24.0 — depósitos e devolução de CE em objetos

Rosa/Pólen5, Ataúde1 e Eir5 têm registros específicos, perfil explícito de CE atual ou atual+capacidade, parcelas derivadas e retorno único pelo evento da fonte. Custos de ativação, requisitos, estados e testes de Residual seguem separados. Ajustes posteriores, reservas/extra/PV/atributos e cópias preservados; diário recupera sem repetir débito/crédito.20 novos testes (393 totais), sem validação real no servidor. Ver [depósitos de CE](depositos-ce.md).

## 0.23.0 — resistência ao Cosmo Residual e dias da campanha

Mestre rola resistência do alvo contra valor Residual fixo, com dia informado e perfil cumulativo conservado: dias desde o primeiro teste, tentativas ou bônus final da mesa. Falha permite nova tentativa confirmada; igualdade/sucesso encerra só o registro no usuário. Funciona fora do combate, sem cobrar CE, alterar alvo/condições ou recalcularPC.

Histórico e recuperação mantêm resultado/contador únicos, sem repetirRoll ou restaurar recursos; proteções de permissões, identidade, matemática, prévia alterada e publicação.24 novos testes (373 totais) e prévias locais. Depósitos específicos/ações parciais permanecem manuais; Foundry13.350 real pendente. Ver [resistência ao Residual](resistencia-residual.md).

## 0.22.0 — segundo Asterismo e valor fixo de Cosmo Residual

Mestre vincula técnica Residual a efeito inicial registrado e rola o segundo Asterismo público. Dificuldade e PC finais explícitos; excesso calculado, valor Residual congelado e próxima penalidade registrada junto. Sucesso iguala ou supera dificuldade; falha não cria efeito. Prazo inicial, duplicação e retrocesso conferidos; diário de recuperação conserva o mesmo resultado sem Roll/custo novo.

Registro fica no usuário; alvo, condições, CE/PV e ações conservados. Ativação inicial, ações de Cosmo/Movimento Parcial, resistências diárias, objetos e depósitos específicos continuam manuais.20 novos testes (349 totais), fontes/templates/manifesto e prévias locais. Foundry13.350 real pendente. Ver [Cosmo Residual](cosmo-residual.md).

## 0.21.0 — oposição genérica de Sustentada

Após recarga vigente, mestre resolve oposição pública por atributo chave, Utilização do Cosmo ativa ou alvo passivo. Nível e condições de cada participante calculados uma vez; maior total ativo vence, igualdade passiva resiste. Empate segue regra do perfil ou escolha da mesa; derrota pode encerrar só este registro, conservando pagamentos, recursos e condições.

Dois resultados/um cartão rastreados no journal do usuário; recuperação publica ou registra o mesmo resultado sem novas rolagens/cobranças, com revalidação de participantes e rodada. Não escreve no alvo, não cobra CE adicional nem executa efeitos completos da manobra.21 novos testes,329 totais, módulos/templates e prévias; Foundry13.350 real pendente. Ver oposicao-sustentada.md.

## 0.20.0 — duração e recarga de Sustentada no usuário

Registro na ficha pagadora identifica técnica pronta, alvo e duração inicial, com padrões Bronze2/Prata3/Ouro4 incluindo ativação. Após o prazo, recarga de1CE confirmada conserva CE reservada, PV, ações e condições; CE extra opcional e ilimitada rastreada. Frequência é perfil explícito da mesa (por rodada ou única até encerrar), pois a p.205 não a detalha. Oposição continua manual; pagar não vence duelo nem aplica efeito.

Pagamento único com histórico, lacunas sem cobrança retroativa, fila/revalidação e recuperação de operações sem recobrar/restaurar recursos. Encerrar conserva custos anteriores. Um registro por técnica/um alvo evita duplicar cobrança; nenhuma escrita no alvo, migração ou mudança de catálogo.21 novos testes,308 totais aprovados, módulos/templates e prévias conferidos; validação real Foundry13.350 pendente. Ver sustentada.md.

## 0.19.1 — resistência de efeitos sem aplicação de dano

Sustentada e Controle antigo sem metadados agora mostram resistência de efeito, sem botão/journal de dano zero ou campos de dano herdados. O mestre confere duração/oposição pela técnica. A aplicação de dano também recusa cartões antigos explicitamente de Controle/Sustentada/Especial e suas origens, inclusive substituições; desfazer aplicações anteriores continua disponível com as proteções existentes. Cartões legados de dano sem classificação permanecem compatíveis. Não muda o pagamento de ativação, recursos, fichas ou compêndios.

Auditoria de Sustentada/Residual documenta recarga genérica de1CE (p.205), duelo/empates, distinção de dano à armadura1/2/3 por turno e regras específicas de dias/CE permanente. Essas regras ainda são manuais; não implanta cobrança automática nem fluxo Residual/duelos.287 testes locais, módulos/templates e prévias aprovados; validação real Foundry13.350 pendente. Ver sustentacao-residual-auditoria.md.


## 0.19.0 — nova resistência paga de Controle

Na ficha alvo, o mestre pode rolar a nova resistência genérica nas rodadas posteriores de Controle:1CE Bronze/Prata,2CE Ouro, dificuldade original, atributo/bônus/condições atuais. A ação pública confirma pagamento único e pode encerrar só o registro em sucesso; falha mantém prazo, estados manuais ficam preservados. CE extra opcional, reserva mantida, sem queimar PV. Um resultado por registro/rodada, sem repetição por cliques ou retrocesso.

Journal de efeitos e fila comum guardam preparo, pagamento e publicação do mesmo cartão; recuperação não cobra nem rola novamente. Janela sem bloqueio da fila; notas opcionais, sem aceite. Registros antigos escolhem atributo sem migração. Exceções de Dominado/Medo e resultados privados permanecem manuais. Livro p.206–208/394–395 conferido.283 testes locais, JS/templates e prévias; compêndios/IDs/schema3 preservados. Validação Foundry13.350 real pendente.


0.18.1 corrige o bloqueio da fila enquanto o mestre responde às janelas de condições, efeitos, Controle, ajustes de ações e recuperações. As decisões ficam fora da fila; ao confirmar, o sistema revalida os dados e serializa a gravação. Uma janela aberta em outra ficha deixa pagamentos e publicações prosseguirem. Confirmações desatualizadas continuam recusadas; cancelamento não altera recursos, não repete rolagens e não adiciona justificativas/aceites. Catálogos e fichas preservados, sem migração. Validação:262 testes locais e módulos/templates; servidor13.350 ainda pendente.

0.18.0 acrescenta duração de Controle por classe (2/3/4 rodadas incluindo ativação), substituição explícita na cópia e duplicação em falha crítica da resistência. Cartão público de resistência falha permite ao mestre registrar o prazo no alvo original; começo congelado na ativação, histórico e conferência por rodada na aba Combate. Cartões privados/antigos usam registro manual. Não cria dano zero, estados ou bloqueios, nem cobra novas resistências automaticamente. Notas opcionais; catálogos e recursos preservados. Validação:251 testes locais, módulos/templates e prévias; servidor13.350 ainda pendente. Ver controle.md.

0.17.1 simplifica a interface por pedido de Lucas: remove declarações de leitura/revisão e aceite de exceções; justificativas tornam-se notas opcionais em criação, evolução, técnicas, dano, ações, efeitos e condições. Pendências de campanha são informativas. Parâmetros numéricos, escolhas de cálculo, permissões, proteção contra repetição e mudança de estado continuam validados. Recuperações oferecem ações concretas sem checkbox de declaração. Campos/flags históricos preservados, sem migração de fichas ou catálogos. Validação:230 testes locais, módulos/templates e prévias; servidor13.350 ainda pendente.

0.17.0 acrescenta condições assistidas por adesão explícita do mestre: parcelas cumulativas de Cansado e de membros debilitados em Incapacitado entram em atributos, perícias, resistências, Asterismo e ataque/defesa. Dados e modificador são ajustados uma vez; prévia/cartão explicam a contribuição. Origem, quantidade, critério de recuperação e histórico conservados; encerramento justificado remove só a parcela assistida, sem curar ou alterar ajustes/caixas manuais. Registros copiados de outro UUID não concedem efeitos; dados inválidos/duplicatas sinalizados. Operações centrais e testes genéricos recusam condições alteradas durante a confirmação. Dois campos internos derivados adicionados, schema3 mantido. Catálogos/IDs preservados. Incapacitado narrativo, outros estados, relógio/descanso e bloqueios de ações ainda exigem conferência. Ver condicoes-assistidas.md; servidor13.350 permanece pendente.

0.16.0 acrescenta registro de efeitos com origem/alvo/duração e acompanhamento por rodada na aba Combate. Brasas de técnica personalizada com composição canônica oferece parcela base por classe e dano final confirmado pelo mestre; cada rodada recebe histórico e a duração é concluída após a última resolução/dispensa. Avançar rodada não cobra automaticamente. Anotações de condições permanecem manuais e não alteram bônus/caixas existentes. PV e journal da rodada são gravados juntos, com fila compartilhada, verificação de alterações e recuperação explícita de interrupções sem repetir dano. Cancelamentos, cópias, recursos e catálogos preservados. Não implementa Sustentada/Residual/Dreno ou todas as condições. Ver efeitos-duracao.md; validação real pendente.

0.15.0 acrescenta cálculo assistido, com adesão explícita, para Esgotar (+1ND/2CE), Essência Alvo e Terreno Favorável (+1ND após contexto confirmado), e Controle sobre o Espaço (+1,5/3/4,5m). Usa IDs/chaves/graduações da composição salva de técnica personalizada com primordial Dano; não interpreta nomes livres nem altera cópias antigas. A prévia/cartão mostram parcelas/referências e o mestre recalcula o pagamento variável. Configuração/desligamento e recomposição preservam parâmetros, notas e recursos. Outros componentes, estados, duração e geometria continuam manuais. Ver componentes-automaticos.md; validação real pendente.

0.14.0 acrescenta controle de ações por encontro, habilitado pelo mestre. Ataque/defesa confirmam quantidades e usam as ações escolhidas na fórmula; técnicas consomem toda a reserva intacta de ataque ou defesa junto com o pagamento de CE/PV, inclusive em falha. Reservas repostas por rodada, sem reposição ao trocar a vez, defesas/reações fora da vez e registros de Movimento/Reação. Ajustes justificados, deduplicação, fila comum, histórico e recuperação do mesmo resultado. Combate acima de5 concede ações extras com automação avançada ligada; ajustes antigos permanecem e devem ser conferidos. Preserva recursos, cópias e compêndios. Iniciativa, movimento parcial/total, alcance, manobras e efeitos específicos permanecem conferidos. Ver acoes.md e validar no servidor.

0.13.0 centraliza pagamento/rolagem de técnicas no mestre ativo, na fila compartilhada com dano e evolução. O jogador confere a prévia e autoriza valores; a solicitação privada é atualizada com o resultado no mesmo cartão. Verifica propriedade, autoria, estado da ficha/técnica/alvo e pagamento; repetição/concorrência não cobra dados antigos novamente, incluindo CE ilimitada. Registra pagamento e mantém resultado para recuperar publicação sem repetir cobrança ou rolagem. Histórico na aba Combate com recuperação e liberação após reparo manual justificado. Modos público/privado/cego/self preservam o solicitante. Catálogos, cópias e regras de cálculo permanecem; exige mestre conectado. Ver ativacoes.md e validacao-foundry.md. Ações/turnos e efeitos específicos continuam próximos desafios.

0.12.0 acrescenta o construtor de técnicas personalizadas na ficha: classe/nível, natureza, primordial, seleção de Big Bangs e incrementos do compêndio, graduações e escolhas. Rascunho persistente, slots/custos/dificuldade e prévia de dano, conferência de requisitos/exceções e confirmação com histórico na cópia. Apoiar ocupa slot sem CE; incrementos custam por tipo e respeitam sua graduação máxima, incluindo Controle Cósmico único. Recursos atuais, notas, IDs e catálogos preservados. Efeitos especiais/confirmatórios, primordiais mistos e Cosmo Residual continuam manuais. Veja tecnicas-personalizadas.md e proximos-desafios.md.

0.11.0 amplia o gameplay de técnicas: configuração assistida da cópia, ND/Poder automático pelo status Bronze/Prata/Ouro com adesão explícita, prévia dinâmica de custo/dificuldade/dano/pagamento, condensação e alvo vinculado ao cartão de resistência. A resistência usa o Poder Cósmico do ataque; conferir/aplicar dano e desfazer continuam disponíveis. Parâmetros manuais, cópias e compêndios existentes são preservados. Não substitui custos variáveis, efeitos de Big Bangs, manobras, ações, duração ou alcance por regras genéricas. Veja tecnicas.md.

A versão 0.10.0 acrescenta evolução assistida até o nível 30: rascunho persistente, distribuição de ganhos/saldos, escolhas de compêndios, comparação antes/depois e histórico. Solicitações são confirmadas e processadas pelo mestre ativo; recursos atuais, cópias e ajustes permanecem. Ganhos contextuais e promoções estão na lista de revisão. Veja evolucao.md.

A revisão 0.9.2 acrescenta o compêndio de Atores **Fichas de teste — Combate**: Santo, Guardião e Sábia com recursos, armadura e técnicas prontos. Atalhos na aba Combate abrem o catálogo e importam o grupo em pasta própria, preservando fichas já presentes. Não cria fichas ou tokens ao iniciar o mundo. Veja fichas-teste.md.

A revisão 0.9.1 atualiza os guias de compêndios e técnicas para descrever os efeitos derivados e a aplicação confirmada de dano. Mantém as regras e funcionalidades da 0.9.0.

- Cálculos explicados, PV com incremento a partir do nível 2 e bônus de atributos divinos.
- Efeitos pessoais: 13 entradas automatizadas, 12 parciais e 333 manuais, com cobertura e pendências explícitas. Remover/desativar reverte bônus sem reescrever a base.
- Ataque e defesa comuns, aplicação confirmada de dano corporal/armadura e desfazer da última aplicação, processados por mestre ativo.
- Assistente de criação em seis etapas com rascunho, benefícios do estilo uma vez, escolhas de compêndios e revisão de orçamento/exceções.
- Migração para schema 3 preserva fichas, cópias, recursos e configurações anteriores. Resistências específicas de virtudes aplicam-se somente ao contexto de técnicas.
- Mantidos os 866 Items e nove compêndios, com IDs, descrições e proveniência.

Testes locais e integração contínua verificam regras, permissões, falhas de gravação, concorrência e empacotamento. Execução no Foundry real permanece pendente; siga validacao-foundry.md. Manobras avançadas, condições, recuperação e automação integral dos poderes continuam pendentes.
