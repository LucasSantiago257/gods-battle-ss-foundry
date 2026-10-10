Versão **0.24.0** para FoundryVTT 13 build 350.

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
