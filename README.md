# Saint Seiya — A Batalha dos Deuses para FoundryVTT

**0.59.0 — ativação legível:** custo, dificuldade, PC e alvo aparecem primeiro; ajustes de CE/teste/componentes ficam recolhidos. Distância e área mantêm os mesmos controles, avisos reais e pagamento. [Uso e limites da janela](docs/ativacao-direta.md). A organização da aba Técnicas foi preservada.

**0.58.0 — armadura por rodada:** Quebrar Armadura em técnica personalizada Sustentada ganha registro no alvo, parcela por classe, aplicação/Ajustar, prazo e histórico. Trocar a armadura pausa o vínculo; recuperação completa o registro sem repetir dano. [Contrato e ensaio](docs/armadura-recorrente.md). Ataque físico comum continua com exceções de armadura manuais.

**0.57.0 — ensaio integrado da one-shot:** Atacar começa pela habilidade treinada; técnicas oferecem uma reserva intacta disponível; prazos de efeitos têm títulos compactos. Novo grupo de treino preserva fichas anteriores e inclui exemplos de Dano, Controle e Sustentada. [Ensaio para mestre e jogadores](docs/fichas-teste.md), com construção personalizada, distância, aplicar/Ajustar/Desfazer e recarga.

**Resistência com dados atuais:** mudanças na ficha do defensor, armadura ou ataque durante a resolução impedem publicar um resultado com parâmetros antigos. Botões antigos e parcelas divergentes de área são recusados; nenhuma edição posterior é desfeita.

**Cartões de técnicas:** a penalidade de resistência mostra os componentes e páginas corretos, incluindo Enfraquecer. Falhas não pedem resistência; Controle e Sustentada indicam seus próprios próximos passos. Descrição e referência ficam disponíveis em uma seção recolhível.

**Movendo nas técnicas do livro:** Configurar → Ações na ativação também oferece o modo impresso para Lança Dourada (Total), Teletransporte e as três referências de Velocidade (Parcial). A adesão é explícita; o custo salvo e os demais efeitos da cópia são preservados.

**Big Bang Movendo:** em uma técnica personalizada com composição salva, escolha Parcial ou Total em Configurar → Ações na ativação. Movimento e CE são consumidos juntos, preservando ataque e defesa; falha e recuperação usam o mesmo registro. A escolha exige o componente canônico, não seu nome. Área e deslocamento do token continuam manuais.

**Consulta dos efeitos:** busque por nome, origem, alvo ou página e filtre ativos, parcelas/recargas pendentes ou histórico. A busca ignora acentos, mantém os totais gerais e conserva a preferência enquanto a ficha estiver aberta. Limpar filtros restaura todos os registros.

**Defesa física direta:** o cartão oferece Defender com 1 ação, mostrando a rodada e sem bônus situacional. Ajustar defesa mantém quantidade e modificador livres. O mestre processa a mesma fila e recuperação, sem repetir o gasto do ataque original.

**Recarga de Sustentada:** Pagar 1 CE extra/atual aplica a recarga exibida sem diálogo; Ajustar recarga mantém preferência de recursos e notas. Prévia antiga e cliques simultâneos não repetem débito. Veja [Sustentada](docs/sustentada.md).

**Rodadas de efeitos:** Aplicar N PV usa diretamente a parcela exibida de Brasas; Registrar rodada resolve anotações sem dano. Ajustar rodada mantém valores finais, dispensa e notas opcionais. Botões antigos e cliques simultâneos não repetem a parcela. Veja [efeitos com duração](docs/efeitos-duracao.md).

**Construtor de técnicas:** cada componente mostra se possui cálculo em Ativar, rodadas assistidas ou aplicação manual, com contagem no resumo e indicação do próximo passo. A consulta preserva custos, rascunho e adesão aos efeitos. Veja [técnicas personalizadas](docs/tecnicas-personalizadas.md).

**Prazos dos efeitos:** painel prioriza rodadas/recargas pendentes e mostra próximos prazos, parcelas restantes e lacunas de Sustentada. Residual continua por dias da campanha. Sem cobrança ou dano ao avançar rodadas. Veja [efeitos com duração](docs/efeitos-duracao.md).

**Enfraquecer em técnicas compostas:** salvar Configurar com componentes habilitados calcula a penalidade pela graduação efetiva do atributo-chave da natureza (p.227), congelada por ativação e somada à Destruição quando presente. Resistência rápida/Ajustar usam a mesma parcela. Cópias antigas mantêm seus cálculos até configurar; extensão a outros ataques continua manual. Veja [componentes automáticos](docs/componentes-automaticos.md).

**Técnicas em área:** marque dois ou mais tokens de fichas distintas e use Ativar em uma técnica de Dano com Asterismo3. Prévia calcula custo único, dificuldade e parcela corporal por alvo; cartão oferece resistência individual, aplicação e desfazer separados. A tabela compara distância e alcance por alvo; Atualizar prévia conserva o grupo nas novas posições. Forma de referência opcional desenha círculo/cone com orientação e abertura ajustáveis, comparando centros sem alterar o grupo. Acerto, cobertura e redução por distância da área continuam manuais. Veja [técnicas em área](docs/tecnicas-area.md).

**Ativar → Atualizar medida** mostra distância entre os centros dos tokens pela grade da cena e compara com o alcance configurado. Unidades em metros, mesma elevação e origem inequívoca; outros casos pedem medição manual. A opção Calcular redução por distância aplica faixas de 1,5 m ao ND de Dano ou ao modificador positivo do PC de Controle/Sustentada, com prévia e revalidação pelo mestre. Exceder a parcela positiva disponível, paredes e áreas continuam manuais. Veja [distância e alcance](docs/distancia-alcance.md).

**Combate → Efeitos com duração → Preparar Cosmo Residual · mestre** calcula o segundo Asterismo e congela PC + excesso no usuário, com resultado público e recuperação. Dificuldade final explícita; efeito inicial registrado no alvo. Resistência usa dia da campanha e perfil cumulativo explícitos, com falha repetível e sucesso encerrando só o registro. Ativação inicial continua manual; com controle ativo, o segundo teste registra Ação de Cosmo + um Movimento Parcial junto ao resultado; depósitos de três origens usam o painel específico. Veja [resistência ao Residual](docs/resistencia-residual.md). Veja [Cosmo Residual](docs/cosmo-residual.md).

**Combate → Condições assistidas → Registrar condição assistida · mestre** aplica parcelas de Cansado, membros debilitados e Desorientado às rolagens, bloqueia ações de Paralisado e, para Atordoado, bloqueia movimento, luta, Cosmo, reação e técnicas monitoradas. O dano corporal confirmado é acompanhado por encontro/rodada; ao superar estritamente 70% dos PV totais, a ficha sinaliza que é hora de fazer o teste de Vigor. O teste e o registro/encerramento do estado ainda são manuais. Veja [condições assistidas](docs/condicoes-assistidas.md).

**Combate → Depósitos de Cosmo Energia → Depositar CE em objeto · mestre** registra depósitos específicos de Rosa/Pólen, Ataúde e Benção de Eir, com perfil de saldo/capacidade escolhido pela mesa e devolução única pelo evento do objeto. Veja [depósitos de CE](docs/depositos-ce.md).

**Combate → Efeitos com duração → Registrar efeito · mestre** acompanha origem, alvo e duração. Brasas de técnica personalizada recebe dano periódico confirmado por rodada; outros estados podem ser anotados sem alterar condições ou bônus manuais. Histórico e recuperação conservam recursos. Veja [efeitos com duração](docs/efeitos-duracao.md).

**Configurar → Automatizar este grupo de componentes** habilita Esgotar, Essência Alvo, Terreno Favorável, Controle sobre o Espaço o bônus de PC de Controle sobre as Estrelas e a penalidade de resistência de Controle sobre a Destruição em técnicas personalizadas com composição salva. Cópias antigas preservam o grupo anterior até salvar a configuração atual. A ativação calcula ND/custo/alcance e registra o contexto conferido; outros componentes continuam manuais. Veja [componentes assistidos](docs/componentes-automaticos.md).

**Combate → Ativar controle de ações no encontro aberto** habilita reservas por rodada: ataque/defesa com quantidade confirmada, técnica usando toda a reserva escolhida, Movimento Parcial/Total, Reação e Ação de Cosmo com registro de uso e ajustes do mestre com notas opcionais. Movimento parcial tem máximo igual à Velocidade efetiva; Cosmo não recebe limite arbitrário de ações. Trocar a vez não repõe; trocar a rodada repõe sem alterar PV/CE. Veja [ações e rodadas](docs/acoes.md).

**Ativar** agora envia o pagamento para a fila do mestre ativo, compartilhada com dano e evolução. A mesma solicitação recebe o cartão de resultado; concorrência, interrupção e recuperação não repetem cobrança/rolagem. Consulte [pagamento central e recuperação](docs/ativacoes.md). É necessário um mestre conectado.

**Técnicas → Adicionar** abre o construtor personalizado: classe, natureza, primordial, Big Bangs extras e incrementos com graduação, referência e parâmetros. Slots, CE, dificuldade e prévia de dano são calculados antes da confirmação; rascunho/histórico ficam na cópia. Veja [como criar técnicas](docs/tecnicas-personalizadas.md) e [o mapa dos próximos desafios](docs/proximos-desafios.md).

**Configurar** na lista de técnicas oferece ND/Poder pelo status do cavaleiro ou parâmetros manuais. **Ativar** mostra uma prévia dinâmica de custo, dificuldade e dano; o alvo marcado recebe o cartão de resistência com dificuldade do ataque. O resultado permite conferir/aplicar dano e desfazer. Veja [técnicas e gameplay](docs/tecnicas.md).

**Subir de nível · evolução assistida** abre um rascunho de ganhos e escolhas do compêndio, com comparação antes/depois, saldos de pontos e registro no histórico. O mestre ativo processa a confirmação; recursos atuais e cópias existentes são preservados. Veja [evolução assistida](docs/evolucao.md).

Para ensaiar a one-shot, use **Combate → Ferramentas do mestre → Novo grupo de treino**. Cria Santo, Guardião e Sábia em cópias privadas; Lyra inclui Dano, Controle e Sustentada. Importar grupo de teste preserva as fichas anteriores. Veja [o exercício para mestre e jogadores](docs/fichas-teste.md), incluindo aplicação direta, desfazer, duração e recarga.

Fichas, compêndios e ativação de técnicas do sistema UmD10+, com destino ao **FoundryVTT 13 build 350**. Versão **0.57.0**. Lucas confirmou o combate básico no servidor. Este marco foi ensaiado em módulos e navegador isolados; as interfaces novas e o percurso completo ainda precisam ser conferidos no core hospedado13.350.

O sistema inclui **888 entradas em dez compêndios nativos de Items**, com descrições, requisitos, origem e páginas do livro. Na aba **Poderes**, os atalhos abrem os catálogos para arrastar itens à ficha. Acrescenta 166 técnicas para consulta e configuração, com atalhos na aba Técnicas. As cópias do catálogo exigem revisão antes de gastar CE; custos variáveis, efeitos especiais e Exclamação de Athena permanecem manuais. A ficha permite abrir os Big Bangs relacionados para consulta. Os Items do livro mostram a descrição completa em uma área de leitura. Consulte a [cobertura e o uso dos compêndios](docs/compendios.md). Para atualizar, encerre o mundo e use **Sistemas de Jogo → Atualizar**; depois inicie o mundo e recarregue a página.

## O que já existe

As parcelas dos cálculos ficam disponíveis em detalhes recolhidos. PV cresce a partir do nível 2, conforme a campanha. Bônus de atributos divinos estão implementados com adesão explícita nas fichas existentes; novos personagens usam a automação. PV atuais, ajustes manuais e itens são preservados. Consulte [cálculos e compatibilidade](docs/calculos.md).

Desde 0.7.0, 25 entradas têm efeitos pessoais totais ou parciais: bônus de PV, atributos, perícias, ações, proteção e Domínio. As 358 virtudes/habilidades/dádivas têm classificação de cobertura. Requisitos são informativos; os efeitos cobertos seguem as opções de automação da ficha e da cópia, sem declaração de aceite. Consulte [efeitos pessoais](docs/efeitos-pessoais.md).

Ataque/defesa comuns e resistência de técnicas oferecem aplicação direta de dano pelo proprietário do defensor ou mestre. Um mestre ativo serializa alterações e registra os valores; a última aplicação pode ser desfeita se os recursos não mudaram. Consulte [combate](docs/combate.md).

Desde 0.9.0, novos cavaleiros têm assistente de criação em seis etapas com rascunho persistente, benefícios de estilo concedidos uma vez, escolhas dos compêndios e revisão de orçamento/requisitos. Personagens antigos conservam a edição normal. Consulte [criação assistida](docs/criacao.md).

- Ficha de cavaleiro com sete áreas, cinco atributos, 18 perícias, habilidades de luta, recursos, estados, sentidos, biografia e evolução.
- Fichas de armaduras, técnicas, virtudes, habilidades/dádivas, Big Bangs, incrementos, artefatos e Cosmo Divino.
- Rolagens de atributos, perícias e resistências: maior d10, +2 por 10, −2 por 1, modificadores, dificuldade e vantagem/desvantagem. Seguem o modo de visibilidade de rolagens escolhido no Foundry.
- Equipamento de uma armadura por vez, com PA e CE derivados; PV da armadura independentes.
- Arrastar conteúdos de Item/compêndio para a ficha cria cópias; a origem fica registrada.
- Catálogos de técnicas, Big Bangs, incrementos, virtudes, habilidades/dádivas dos estilos e evoluções, habilidades naturais, combinações de Cosmo, criaturas, poderes divinos e Cosmos Divinos, organizados por origem.
- Botão para criar um compêndio do mundo com seis modelos iniciais. São modelos editáveis, não o catálogo integral do livro.
- Ativação de técnicas: CE extra/reservada, elevação, queima de PV confirmada, teste de Asterismo e cálculo de dano no chat. Resistência com token próprio selecionado. Consulte o [guia de técnicas](docs/tecnicas.md).

## Instalar pela interface, sem acessar os arquivos do servidor

Em **Sistemas de Jogo → Instalar Sistema**, o Foundry aceita uma URL de manifesto e baixa o pacote automaticamente. Para este sistema, o arquivo é `system.json`. O JSON e o ZIP precisam estar acessíveis ao servidor por HTTPS.

O repositório é público, e a distribuição é publicada pelo GitHub Actions. Use a URL abaixo após a release estar disponível:

```text
https://github.com/LucasSantiago257/gods-battle-ss-foundry/releases/latest/download/system.json
```

Consulte o [guia de instalação por manifesto](docs/instalacao-manifesto.md). Crie um mundo de teste para validar as fichas no Foundry 13 build 350.

## Instalação manual no servidor

1. Extraia o ZIP da versão instalada. Ele contém a pasta `gods-battle-ss`.
2. Com o servidor Foundry parado, envie essa pasta para `<pasta de dados>/Data/systems/gods-battle-ss/`. `system.json` deve ficar diretamente nessa pasta, sem uma pasta intermediária.
3. Reinicie o Foundry e crie um **mundo de teste** escolhendo “Saint Seiya — A Batalha dos Deuses”.
4. Crie um Actor do tipo **Cavaleiro**. Edite o nome, atributos, estilo e recursos. As alterações são salvas ao editar os campos.
5. Na aba **Armadura**, clique em **Abrir / criar compêndio de modelos** como mestre. Arraste um modelo para a ficha e use **Equipar** para aplicar a armadura.
6. Confira o [roteiro de validação](docs/validacao-foundry.md).

Se a hospedagem usa um painel gerenciado, use o gerenciador de arquivos ou o método de instalação manual oferecido pelo provedor. O caminho é a pasta de **dados do Foundry**, não a pasta dos executáveis. Não houve instalação ou alteração do seu servidor por esta tarefa.

Nenhuma credencial deve ser colocada em `system.json`.

## Convenções atuais

- Escolha do usuário: **8 pontos de treino** e **Cosmo Energia baseada em Cosmo**. Com os cinco iniciais e o ponto do estilo, o orçamento básico de atributos é 14. O assistente separa treino, benefício do estilo e graduações concedidas pelas virtudes implementadas.
- Resistência: por padrão **graduação + modificador de nível**, conforme as fórmulas das páginas 207/434. O mestre pode escolher **modificador do atributo + modificador de nível** em Configurações do mundo. É uma interpretação provisória, identificada nas fichas.
- PV: `PV inicial + incremento × (nível − 1) + Vigor × nível + extras`, com incremento a partir do nível 2 conforme a campanha. Há campo de máximo manual. Atributos divinos e os efeitos pessoais conferidos são calculados quando a automação está habilitada.
- Tabelas de ações e CE dos estilos são aplicadas até nível 20; depois desse ponto, use os ajustes. Alterar nível não promove status nem altera sentido automaticamente.
- Os bônus de sentidos, Domínio, Nível de Ataque, afinidade e efeitos especiais são registrados manualmente. A ficha mostra essas separações.

Controle calcula duração e permite registrar o resultado de resistência pública na ficha alvo. Veja [guia de Controle](docs/controle.md); estados e novas tentativas permanecem manuais.

## Limites desta entrega

Efeitos pessoais têm cobertura parcial explicitada por Item e no inventário das 358 entradas. Estados, críticos específicos de luta, manobras avançadas, descanso, promoção e recuperação de armaduras continuam manuais. Custos por turno de sustentação são manuais. Os assistentes conferem orçamento e alguns pré-requisitos; requisitos textuais continuam sujeitos à revisão. O construtor estrutura componentes/graduações/slots/custos, mas efeitos específicos, confirmação e primordiais mistos/Residual mantêm resolução manual. Pagamentos de técnicas usam a fila central; edição manual e macros ficam fora dessa coordenação. Controle de ações exige adesão por encontro. Iniciativa/simultaneidade, movimento parcial/total, manobras e efeitos de reação continuam conferidos pelo mestre. Validação real com dois clientes continua pendente.

Bestas, legiões, monstros e deuses não possuem fichas especializadas nesta versão. O cavaleiro guarda o UUID de seu companheiro e os registros de legião/discípulos.

## Desenvolvimento

Node 22+ e Python 3. Instale as dependências com `npm ci`; rode `npm test`, `npm run check` e `npm run build`. As dependências são apenas de desenvolvimento; o sistema instalado usa as bibliotecas do próprio Foundry.

`npm run check` compila os templates com Handlebars e cria `dist/preview.html`. As fontes versionadas estão em `data/catalog/`. `npm run packs` compila os bancos LevelDB com a CLI oficial do Foundry; `npm run build` compila os compêndios e gera o ZIP instalável. Depois de compilar, `python tools/package.py --release` prepara as URLs de uma release sem publicá-la. O empacotamento rejeita bancos desatualizados. Os testes de compêndios fazem round-trip real dos bancos. Os testes de regras e fichas usam um contrato mínimo da API, não um servidor Foundry real.

API utilizada: [ActorSheetV2 v13](https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ActorSheetV2.html), [ItemSheetV2](https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ItemSheetV2.html), [modelos de dados](https://foundryvtt.com/article/system-data-models/) e [compêndios](https://foundryvtt.com/article/compendium/).

Créditos e origem do conteúdo em [ATTRIBUTION.md](ATTRIBUTION.md).

Na0.21.0, o mestre pode processar nova resistência pública de Controle pela ficha alvo, pagando1/2CE uma vez e encerrando apenas o registro em sucesso. CE extra é opcional, reservas/PV/estados preservados; recuperação não repete cobrança nem teste. Ver [guia de Controle](docs/controle.md) para convenções e exceções manuais.

Na0.21.0, [Sustentada](docs/sustentada.md) acompanha duração inicial e recarga no usuário, com frequência escolhida, pagamento único e recuperação. Efeitos permanecem manuais; oposição genérica pública disponível na0.21.0.

[Oposição de Sustentada](docs/oposicao-sustentada.md), na0.21.0: atributo/Cosmo ativo/passivo, níveis calculados, cartão público e recuperação do mesmo resultado. Sem custo adicional; efeitos e manobras completas continuam manuais.


Na seleção de Big Bangs/incrementos, a prévia mostra o apoio disponível antes de adicionar: cálculo em Ativar, rodadas assistidas ou aplicação manual. O texto considera o primordial e composições mistas; não habilita automação por conta própria (0.54.0).


Na0.55.0, **Compêndios → Artefatos** reúne22referências das pp.607–614, com níveis equivalentes, regras, páginas e atribuição. Arrastar cria cópia independente sem equipar nem executar poderes. Os866Items anteriores permanecem preservados.


Na0.55.1, o painel de efeitos oferece Ajustar, Encerrar e recarga somente quando o mestre responsável pode executar a operação. Outros mestres e operações interrompidas conservam a consulta dos registros sem botões que seriam recusados ao clicar.


Na0.56.0, **Atacar** fica no topo da ficha, em todas as abas. Textos gerais de regras foram retirados da leitura principal; ajustes, ferramentas e contas ficam recolhidos. A organização de Técnicas foi preservada. Nos cartões, o dono aplica dano na própria ficha e o mestre aplica nos defensores: **Pendente / Aplicado / Desfeito**, sem pedido visível de aprovação. O mestre conectado coordena a gravação automaticamente; proteção contra duplicidade, permissões e recuperação são mantidas. Ataque físico comum conserva a regra do livro; dano à armadura excepcional fica a cargo do mestre. Veja [ficha e aplicação de dano](docs/ficha-e-dano.md).
