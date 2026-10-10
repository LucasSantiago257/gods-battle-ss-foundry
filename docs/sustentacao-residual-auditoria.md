# Sustentação, Cosmo Residual e oposição — auditoria para implementação

Estado após0.21.0: resistência sem dano indevido, registro da fase inicial e recarga assistida entregues. Frequência de recarga é perfil explícito da mesa; oposição genérica pública por atributo/Cosmo ativo/passivo entregue na0.21.0. QueimaCEadicional, efeitos completos do duelo e Cosmo Residual continuam manuais. Ver sustentada.md e oposicao-sustentada.md. Esta auditoria usa o livro V49.1.1, com atribuição em ATTRIBUTION.md. As regras abaixo são paráfrases; nenhuma página, imagem ou dado da cópia foi incorporado ao pacote. O documento orienta os próximos marcos, sem transformar propostas em regras novas.

## Contratos distintos

| Fonte | Regra conferida | Consequência para a implementação |
|---|---|---|
| p.205 | Controle dura2/3/4turnos conforme classe, contando ativação. Após a duração normal, Sustentada pode continuar mediante recarga de1CE até libertação ou falta de CE. | Distinguir fase inicial e manutenção; frequência não está detalhada nessa passagem:0.20.0 oferece perfis de campanha por rodada/recarga única, sem impor um deles como regra universal. Cobrar o usuário da técnica, não o alvo; não usar a tabela de nova resistência de Controle1/1/2CE como custo de manutenção. |
| p.225 | Sustentada prolonga o efeito enquanto o usuário vence teste resistido de Duelo de Cosmos ou atributo chave, à escolha do usuário. | Resolver oposição e pagamento com contextos explícitos; custo pago não constitui vitória nem aplicação automática de estado/dano. |
| p.382–383 | Teste resistido de atributo/perícia soma modificador de nível; maior total vence. Empate genérico repete, salvo regra específica. Pode queimarCE para+2por ponto. | Não reutilizar teste genérico sem a parcela de nível. Tratar empate sem decidir vencedor automaticamente. Boost pago, decisão e resultado rastreáveis. |
| p.421–422 | Duelo de Cosmos usa Utilização do Cosmo com CE queimada; possui efeitos próprios e opção passiva baseada em7+total da perícia+modificador de nível+ajustes. | A p.382 dá+2porCE enquanto a manobra descreve adição de CE queimada. Não fixar multiplicador sem um perfil/decisão de campanha explícitos. Preservar as consequências específicas e distinguir duelo ativo de passivo. |
| p.423–424 | Imobilização Sustentada é manobra própria: Combate, restrições de ações e dano corporal específico. | Não confundir com primordial de técnica nem aplicar os efeitos desta manobra a toda Sustentada. |
| p.429–434 | Habilidades/Dádivas Sustentadas têm espaços, custos e resistência próprios; empate mantém sustentação nessa categoria. | Regra de empate específica não pode ser transferida silenciosamente a técnicas.1CE por turno/extra desta categoria não é uma regra universal de todos os efeitos. |
| p.224–225 | Cosmo Residual requer alvo/objeto sob efeito e segundo Asterismo durante a duração/no turno seguinte, com ação de Cosmo e movimento parcial. Excesso do Asterismo aumentaPC, congelando a dificuldade. Novas resistências seguem dias/especificações da técnica. | Novo teste e nova operação, sem reusar o total inicial. Registrar condição prévia, PC, dificuldade e excesso explícitos. Objeto não é necessariamente Actor.knight; tempo por dia não pode ser confundido com round de combate. |
| p.225 | Texto de tentativas repetidas menciona bônus+1por novo teste e por dia; exemplo usa evolução diária. | Contadores de dia e de tentativa separados; não conceder bônus ilimitado por clicar nem proibir exceções específicas sem perfil da campanha. |
| p.229 | Quebrar Armadura sustentado causa1/2/3por turno em Bronze/Prata/Ouro. | Esse valor é dano à armadura, não custo CE de manutenção. Requer aplicação e recuperação próprias, sem confundir PV corporais. |
| p.212–213 | Duelo de Técnicas tem interceptação, continuidade/cumulatividade, Vigor ilusório, multiplicação de dano e explosão em empate. | Não reutilizar seu empate explosivo em Sustentada nem lançar dano automaticamente por duelo de Cosmos. |

## Exemplos que impedem uma automação universal

| Técnica/fonte | Particularidade | Delimitação |
|---|---|---|
| Tesouro do Céu, p.249–250 | Sustentação por Duelo de Cosmos; descrição específica de restrições. | Restrição de ações deve ser um efeito explícito conferido, sem deduzir pelo nome. |
| Serenata da Viagem da Morte, p.252–253 | Duração em dias, execução contínua, teste diário, bônus após dano e bônus próprio no duelo. | Sem conversão automática de dias em rodadas nem aplicação da resistência genérica de Controle. |
| Enforcamento do Urso, p.257–258 | Oposição por Força, dano corporal de nível+modificador de Força por turno e dano à armadura. | Não chamar tudo de Duelo de Cosmos nem trocar manutenção1CE por dano1/2/3. |
| Lendário Golpe Satânico, p.254–255 | Residual, comando, não termina por dano, testes diários e bônus semanais particulares. | Relógios e eventos específicos; genericidade limitada. |
| Rosa Diabólica Real Polén, p.281–282 | Preparação de um dia,5CEpermanente devolvida ao cessar, perda sequencial de sentidos/sono e área específica. | Separar depósito/reserva de CE de custo queimado; devolução idempotente vinculada, sem recobrar/curar automaticamente. |

## Ordem técnica proposta

1. Registro de fase inicial/manutenção para uma técnica e participantes identificados; prazo/unidade/custo escolhidos explicitamente. Histórico no pagador, referência opaca no alvo quando privado. Não generalizar a todos os catálogos por texto livre.
2. Pagamento de manutenção por rodada confirmada, com CE reservada/extra/ilimitada, mesma fila e journal, recuperação sem repetir. Ações concretas: pagar e manter, encerrar sem pagar; notas opcionais. Avançar rodadas não cobra por si só. Lacunas/atrasos devem ter decisão explícita.
3. Oposição em perfil declarado: atributo, perícia ou Duelo de Cosmos/passivo, participante/proprietário autorizados, parcelas separadas, política de empate específica. Resultados privados não passam automaticamente a flags visíveis do alvo.
4. Efeitos futuros removidos ao encerrar; custos anteriores, dano e ajustes conservados. Transação entre doisActors não é atômica no cliente: preparar/revalidar cada documento e recuperar interrupções sem sobrescrever dados posteriores.
5. Residual com segundo Asterismo, excesso ePCcongelados; calendário/dias/counters explícitos; objetos e exceções só após contrato próprio. Inicialmente manter o perfil diário manual e não inferir bônus acumulado da passagem real de tempo.

Esta é uma proposta de divisão do trabalho dentro da prioridade gameplay já autorizada. As ambiguidades de multiplicador de CE, empate de técnica Sustentada e repetição diária de Residual devem virar parâmetros úteis ou fluxo manual, sem justificativas obrigatórias, caixas de aceite ou regras presumidas. Não significa implementação/publicação desses cinco passos. Antes de automatizar cada perfil, conferir condições, eventos e exemplos necessários, reproduzir matemática, testar custo único/rollback/publicação e validar no Foundry13.350 real.

Registro/pagamento dos passos1–2 entregues na0.20.0 com um alvo e apenas escrita no pagador. Perfil por rodada ou recarga única, recarga atual sem cobrança retroativa e rodada coletiva são convenções operacionais declaradas. Não são inferidas como regra universal. Passos3–5, estados/removal automáticos e múltiplos alvos continuam pendentes.

Passo3 parcialmente entregue na0.21.0: oposição genérica sem débito adicional, dois participantes distintos, pública pelo mestre; empate ativo repete, igualdade passiva resiste, alternativos são perfis de campanha. Tabela188/perícia3=+3 preservada; exemplo383 usa+6 e fica documentado como divergência, sem alterar todas as fichas. Recuperação somente no usuário, sem doisActors escritos. Passos4–5,boostCE/ações/efeitos próprios e privacidade/jogadores continuam pendentes.


## Implementado na0.22.0: segundo Asterismo de Residual

Vínculo a anotação inicial/Controle ativo, técnica própria Residual, dois cavaleiros distintos e janela durante duração ou turno seguinte à ativação; dificuldade e PC finais explícitos. Excesso e PC fixos, sem cobrar CE adicional/depósito nem substituir ação de Cosmo + Movimento Parcial por reserva inteira. Falha/penalidade seguem Asterismo genérico, diário recupera sem repetir. Um registro no usuário conserva alvo/efeito inicial, privacidade anterior, catálogos e cópias. [Contrato publicado](cosmo-residual.md). Dias/bônus por tentativa versus dia, depósitos/preparo e objetos permanecem pendentes. O limite de uma tentativa por rodada/efeito inicial é convenção de coordenação do fluxo, não regra universal de toda técnica.


## Implementado na0.23.0: resistência ao Residual

Valor fixo da preparação, resistência atual do alvo, perfil cumulativo explícito conservado por registro: dias desde primeiro teste, quantidade de tentativas anteriores ou valor final da mesa. Perfis são convenções para ambiguidade225, não regra universal inferida. Dia inteiro declarado; nenhuma conversão relógio/rodada nem avanço automático. Repetições após falha são confirmadas no mesmo dia; sucesso>=CD encerra somente registro no usuário, sem alterar alvo/condições ou cobrarCE. Histórico e recuperação conservam teste/dias, validam matemática/CD/ordem/permissões. [Contrato](resistencia-residual.md). Depósitos/devolução e exceções continuam pendentes.


## Implementado na0.24.0: depósitos específicos e retorno

Rosa281–282:5 retornam após cessação; Ataúde357–358:1 por ataúde volta ao quebrar; Eir553:5 retornam após consumo. Painel por objeto com origem própria, perfil explícito somente saldo ou saldo+capacidade, congelado; custos/preparo/testes/estados separados. Regras gerais443–446 não formalizam permanente versus capacidade; perfis são convenções, não perda de atributo. Eir usa o termoCosmo e demanda essa distinção. Marcas125/130/Fadas298/305 dependem de contrato de ativos; perdas irreversíveis102/464/637/643 não são devolução. Fonte da capacidade445 e recuperação446 relidas. [Contrato e limitações](depositos-ce.md).
