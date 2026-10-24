# Armaduras e artefatos — auditoria em preparação

Base conferida:0.60.1. Esta etapa registra fontes, cobertura e achados para o próximo conjunto. A apresentação publicada ainda mostra um número no requisito de classes superiores; a correção de UI e o ensaio integrado estão pendentes na mesma branch. Catálogos e cópias permanecem preservados. A contagem de referências não mede automação integral.

## Classes e parâmetros básicos

| Classe | Página | PVA base | PA | Capacidade de CE | Requisito da tabela |
|---|---|---:|---:|---|---|
| Bronze |149|30|3|+3|Cosmo1|
| Prata |150|50|5|+5|Cosmo5|
| Ouro |151|100|10|+10|7º Sentido|
| Divina |152|150|15|+15|7º Sentido Superado|
| Kamui |152|200|20|Ilimitada|9º Sentido|

Os valores numéricos base coincidem com `ARMORS`/`armorValues`. O campo numérico interno `minimum` usa0 nas três classes superiores naV1; esse0 não representa ausência de requisito. A ficha de Item hoje o imprime como Cosmo mínimo0. A próxima etapa deve mostrar o requisito qualitativo legível, sem criar bloqueio de equipamento ou reescrever dados do usuário.

A tabela de Divina e o processo de despertar nas pp.151–152 usam referências distintas de estágio/elevação; essa leitura não cria uma validação automática. O texto específico de acesso e a decisão da mesa permanecem relevantes. Requisitos de classe, penalidades por Cosmo insuficiente e imunidades de dano não são conferidos automaticamente por estes números.

## Cobertura do fluxo de armadura

| Parte | Fonte | Comportamento atual / limite |
|---|---|---|
| PVA, PA e capacidade |149–152|Calculados por classe, versão e ajustes. Valores atuais não são restaurados ao recalcular máximo.|
| EvoluçãoV1–V5 |142|Bronze/Prata acrescentam5PVA,1PA e2Cosmo mínimo por versão posterior à primeira. Ouro conserva os valores da classe.|
| Versões de Divina/Kamui |142/151–152|A fórmula atual aplica incrementos quando a versão é maior que1. A extensão às classes superiores é convenção existente a esclarecer; esta auditoria não a declara regra do livro nem modifica cópias.|
| Máximo manual |Campo da ficha|Tem precedência sobre o máximo calculado; bônus/efeitos continuam como implementados. Nenhuma cura ao editar máximo.|
| Estado e seleção |142–143 + convenção do sistema|A primeira armadura equipada com PVA>=0 e estado diferente de Morta fornece bônus. A ação normal de equipar seleciona uma; dados antigos/manuais podem conter mais de uma equipada.|
| PVA0 / negativo |142–143|0 ainda pode recuperar; a fonte cita-1 como sem uso. O sistema exclui qualquer PVA negativo, inclusive fração. Essa fronteira fracionária é convenção existente, sem arredondamento novo.|
| Estado Em recuperação |Campo manual|Atualmente não exclui bônus por si só se PVA>=0; Morta exclui. A próxima UI deve refletir o que foi aplicado, sem impor uma regra nova ao campo.|
| PA contra dano físico comum |144/417–418|Proteção reduz o dano corporal no fluxo físico. Ataque comum não recebe perda automática de PVA; exceções continuam manuais conforme decisão de Lucas.|
| Dano à armadura por técnicas |141 e regras da técnica|Aplicação individual e journal existentes. Exceções de classe/perfil seguem conferidas na mesa; não aplicar imunidade nova por inferência.|
| Quebrar Armadura Sustentada |229|Parcela1/2/3 por classe em registro específico, com prazo, Ajustar e recuperação; ver [contrato](armadura-recorrente.md). Forma instantânea e mistos permanecem manuais.|
| Recuperação, restauração e sangue |142–143/307–308|Condições de recipiente, dias, técnica e sangue continuam manuais. A recuperação do journal de uma operação interrompida é outra função.|
| Lutar sem armadura |145|A perda de bônus ocorre na seleção; a parcela corporal de20% pelo uso de técnica sem armadura continua manual. Não foi inferido em que momento cobrar a parcela ligada ao dano causado.|
| Afinidade, memórias e acessórios |145–148|Parâmetros e descrição disponíveis; efeitos específicos exigem seus próprios contratos. Não concedem ações/condições automaticamente.|
| Divinização e asas |151–152|Processo de despertar/duração, requisitos e voo permanecem manuais. Selecionar a classe numérica não executa esses eventos.|

A lista de Itens hoje imprime a PA da armadura mesmo quando ela está sem bônus aplicados. A próxima etapa deve distinguir a armadura efetivamente usada, mantendo parâmetros e Equipar disponíveis. Esta é uma mudança de apresentação; não haverá equipamento forçado, corte silencioso de recurso, cura ou dano automático.

## Artefatos publicados: presença e aplicação

O compêndio Artefatos contém22Items:19objetos e3espadas/armaduras lendárias. Cada referência é do tipo Artefato, com nível equivalente e aplicação manual; não é um Item Armadura equipado automaticamente. Nível equivalente40/45 de um objeto não aumenta o nível do personagem nem concede Lenda, quebra de limite ou bônus.

Títulos, níveis e páginas foram cruzados com os cabeçalhos da seção607–614 já extraída. As três lendárias recebem nível equivalente30 pelo cabeçalho comum da p.613. Fonte local dos22Items igual à main0.60.1; IDs e chaves originais preservados. A grafia original da chave de Talismã conserva o cabeçalho quebrado; o nome exibido é normalizado.

| Referência | Páginas registradas | Nível equivalente | ID preservado |
|---|---|---:|---|
|Adaga dourada|607|30|`040cefc3828d0d8d`|
|O Anel Nibelungo|607|25|`65cad3b180b6f3e8`|
|Draupnir|607, 608|28|`66fbe71e56c0d574`|
|Lança de Gungnir|608|30|`b887e28ecc58cad8`|
|Espada Balmung|608|30|`6aa98216919430cf`|
|Safiras de Odin|608, 609|25|`5866f2fe5bbaef87`|
|Mapa Estelar|609|20|`89cd3b4728de3326`|
|Espelho Senin|609|30|`a0cf78aaedaaf898`|
|Fio de Ariadne|609|20|`f476fe2f1b657645`|
|Guizos|609|15|`25339096bc97a24d`|
|Espelho de Pandora|609, 610|30|`e4a617281d5ba3e3`|
|Harpa de Pandora|610|40|`fc925ab2e128651d`|
|Pomo Dourado|610, 612|45|`1f4519ef9da37a30`|
|Vaso Sagrado|610, 611, 612|45|`5ed056648da431d0`|
|Rosário de 108 Contas|611, 612|30|`9924340fc813010d`|
|Ânfora de Athena|611, 612|40|`ed270a26e6fec90b`|
|Selos de Athena|611, 612|20|`87cd1e0fd1c371c4`|
|Talismã de Selamento|612|28|`05b4fc8331cf0548`|
|Máscara Rangda|612, 613|30|`c674c21f3a1d10d6`|
|Durandal, A Espada Sagrada Indestrutível|613|30|`fc9abbd6cc132a44`|
|Arondight, A Espada Sagrada da Traição|613, 614|30|`db1685652460e125`|
|Gram, A Espada Sagrada da Ira|613, 614|30|`4f2a20eed58edc46`|

As páginas adicionais612 em objetos de Selamento incluem a tabela vinculada à referência; não são um efeito da Máscara Rangda. Os testes de catálogo já verificam22entradas, níveis altos, tabela, importação independente e ausência de passivos automáticos. Nenhum custo, estado, condição ou poder de artefato foi habilitado por esta auditoria.

O inventário histórico em work, baseado na0.54.0, ainda descrevia essas entradas como ausentes. A cobertura atual acima substitui essa leitura de pendência; o arquivo histórico não deve provocar reimportação ou duplicação. O catálogo foi publicado na0.55.0 e permaneceu preservado nas versões seguintes.

## Lista de vestimentas e auditoria restante

A seção6.6, pp.688–698, contém uma lista distinta: vestimentas de Athena, espectros, guerreiros de Asgard/Aesirs, outras referências de Odin, escamas e regimentos de Ares. Essa lista não é preenchida pelos22artefatos nem pelas cinco classes genéricas do formulário. Ainda falta inventário por ocorrência, deduplicação e classificação das referências dispersas antes de uma auditoria global de cobertura. As pp.699–702 não ampliam a lista nessa extração.

A matriz desta etapa cobre parâmetros básicos, limites de execução já identificados e os22artefatos da seção607–614. Não fecha todas as armaduras, poderes específicos ou referências cruzadas do livro. Tampouco substitui os contratos ambíguos de componentes e poderes avançados que continuam registrados em [próximos desafios](proximos-desafios.md).

## Próximas verificações do conjunto

- Mostrar requisito qualitativo no Item e estado real da armadura aplicada, sem persistência ou bloqueio de Equipar.
- Exercitar troca/remoção, PVA0/negativo, Morta/Em recuperação, múltiplas equipadas, ajustes e máximos manuais em fichas vinculadas/sintéticas.
- Conferir conteúdo escapado, teclado/440px e detalhes opcionais; preservar organização de Técnicas e Atacar no topo.
- Manter catálogos/IDs/888Items/3fichas e privacidade; publicar uma versão integrada depois do ensaio e auditoria, sem release desta etapa documental.

As verificações atuais são leitura das fontes já extraídas, metadados de catálogo e cálculo isolado de classe. Não comprovam core hospedado13.350 ou conexões reais; esses ensaios permanecem pendentes. Sem novas condições ou regras presumidas. Fonte e licença do livro permanecem em [atribuição](../ATTRIBUTION.md).
