# Saint Seiya — A Batalha dos Deuses para FoundryVTT

Fichas, compêndios e ativação de técnicas do sistema UmD10+, com destino ao **FoundryVTT 13 build 350**. Versão **0.7.0, em desenvolvimento**. A criação de personagens na versão 0.1.1 foi confirmada pelo usuário no servidor; a nova automação ainda precisa ser validada dentro do Foundry.

A versão 0.7.0 inclui **866 entradas em nove compêndios nativos**, com descrições, requisitos, origem e páginas do livro. Na aba **Poderes**, os atalhos abrem os catálogos para arrastar itens à ficha. Acrescenta 166 técnicas para consulta e configuração, com atalhos na aba Técnicas. As cópias do catálogo exigem revisão antes de gastar CE; custos variáveis, efeitos especiais e Exclamação de Athena permanecem manuais. A ficha permite abrir os Big Bangs relacionados para consulta. Os Items do livro mostram a descrição completa em uma área de leitura. Consulte a [cobertura e o uso dos compêndios](docs/compendios.md). Para atualizar, encerre o mundo e use **Sistemas de Jogo → Atualizar**; depois inicie o mundo e recarregue a página.

## O que já existe

Desde 0.7.0, a Visão geral explica as parcelas dos cálculos. PV cresce a partir do nível 2, conforme a campanha. Bônus de atributos divinos estão implementados com adesão explícita nas fichas existentes; novos personagens usam a automação. PV atuais, ajustes manuais e itens são preservados. Consulte [cálculos e compatibilidade](docs/calculos.md).

Desde 0.7.0, 25 entradas têm efeitos pessoais totais ou parciais: bônus de PV, atributos, perícias, ações, proteção e Domínio. As 358 virtudes/habilidades/dádivas têm classificação de cobertura. Cópias com requisitos pendentes podem ser adquiridas, mas seus efeitos aguardam conferência ou exceção explícita. Consulte [efeitos pessoais](docs/efeitos-pessoais.md).

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

1. Extraia o ZIP `gods-battle-ss-0.7.0.zip`. Ele contém a pasta `gods-battle-ss`.
2. Com o servidor Foundry parado, envie essa pasta para `<pasta de dados>/Data/systems/gods-battle-ss/`. `system.json` deve ficar diretamente nessa pasta, sem uma pasta intermediária.
3. Reinicie o Foundry e crie um **mundo de teste** escolhendo “Saint Seiya — A Batalha dos Deuses”.
4. Crie um Actor do tipo **Cavaleiro**. Edite o nome, atributos, estilo e recursos. As alterações são salvas ao editar os campos.
5. Na aba **Armadura**, clique em **Abrir / criar compêndio de modelos** como mestre. Arraste um modelo para a ficha e use **Equipar** para aplicar a armadura.
6. Confira o [roteiro de validação](docs/validacao-foundry.md).

Se a hospedagem usa um painel gerenciado, use o gerenciador de arquivos ou o método de instalação manual oferecido pelo provedor. O caminho é a pasta de **dados do Foundry**, não a pasta dos executáveis. Não houve instalação ou alteração do seu servidor por esta tarefa.

Nenhuma credencial deve ser colocada em `system.json`.

## Convenções atuais

- Escolha do usuário: **8 pontos de treino** e **Cosmo Energia baseada em Cosmo**. Com os cinco iniciais e o ponto do estilo, o orçamento básico de atributos é 14. A distribuição, o ponto do estilo e bônus de virtudes são lançados pelo usuário.
- Resistência: por padrão **graduação + modificador de nível**, conforme as fórmulas das páginas 207/434. O mestre pode escolher **modificador do atributo + modificador de nível** em Configurações do mundo. É uma interpretação provisória, identificada nas fichas.
- PV: cálculo provisório `PV inicial + incremento × (nível − 1) + Vigor × nível + extras`. Há campo de máximo manual. Bônus especiais de atributos divinos e poderes são lançados manualmente.
- Tabelas de ações e CE dos estilos são aplicadas até nível 20; depois desse ponto, use os ajustes. Alterar nível não promove status nem altera sentido automaticamente.
- Os bônus de sentidos, Domínio, Nível de Ataque, afinidade e efeitos especiais são registrados manualmente. A ficha mostra essas separações.

## Limites desta entrega

Ainda não automatiza ataque contra defesa, aplicação de dano ao defensor/armadura, pré-requisitos de aquisição, efeitos de estados/virtudes, descanso, promoção, compra de perícias ou recuperação de armaduras. Custos por turno de sustentação são manuais. A ficha oferece campos para registrar essas regras. Big Bangs e incrementos de uma técnica ficam descritos na cópia; compor técnicas a partir de referências estruturadas é um próximo marco.

Bestas, legiões, monstros e deuses não possuem fichas especializadas nesta versão. O cavaleiro guarda o UUID de seu companheiro e os registros de legião/discípulos.

## Desenvolvimento

Node 22+ e Python 3. Instale as dependências com `npm ci`; rode `npm test`, `npm run check` e `npm run build`. As dependências são apenas de desenvolvimento; o sistema instalado usa as bibliotecas do próprio Foundry.

`npm run check` compila os templates com Handlebars e cria `dist/preview.html`. As fontes versionadas estão em `data/catalog/`. `npm run packs` compila os bancos LevelDB com a CLI oficial do Foundry; `npm run build` compila os compêndios e gera o ZIP instalável. Depois de compilar, `python tools/package.py --release` prepara as URLs de uma release sem publicá-la. O empacotamento rejeita bancos desatualizados. Os testes de compêndios fazem round-trip real dos bancos. Os testes de regras e fichas usam um contrato mínimo da API, não um servidor Foundry real.

API utilizada: [ActorSheetV2 v13](https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ActorSheetV2.html), [ItemSheetV2](https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ItemSheetV2.html), [modelos de dados](https://foundryvtt.com/article/system-data-models/) e [compêndios](https://foundryvtt.com/article/compendium/).

Créditos e origem do conteúdo em [ATTRIBUTION.md](ATTRIBUTION.md).
