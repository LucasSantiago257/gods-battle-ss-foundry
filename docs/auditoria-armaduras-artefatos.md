# Armaduras e artefatos — fontes e cobertura da0.61.0

Base de catálogo conferida:0.60.1. O conjunto0.61.0 reúne apresentação de armaduras, ensaio e levantamento de fontes. Corrige a leitura de requisitos e distingue parâmetros de bônus efetivamente aplicados. Catálogos e cópias permanecem preservados. A contagem de referências não mede automação integral.

## Classes e parâmetros básicos

| Classe | Página | PVA base | PA | Capacidade de CE | Requisito da tabela |
|---|---|---:|---:|---|---|
| Bronze |149|30|3|+3|Cosmo1|
| Prata |150|50|5|+5|Cosmo5|
| Ouro |151|100|10|+10|7º Sentido|
| Divina |152|150|15|+15|7º Sentido Superado|
| Kamui |152|200|20|Ilimitada|9º Sentido|

Os valores numéricos base coincidem com `ARMORS`/`armorValues`. O campo numérico interno `minimum` usa0 nas três classes superiores naV1; esse0 não representa ausência de requisito. O contexto de apresentação passa a mostrar o requisito qualitativo da tabela, sem criar bloqueio de equipamento ou reescrever o campo numérico. Bronze/Prata continuam mostrando o Cosmo mínimo calculado por versão.

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
| Estado Em recuperação |Campo manual|Atualmente não exclui bônus por si só se PVA>=0; Morta exclui. A UI reflete esse resultado sem impor uma regra nova ao campo.|
| PA contra dano físico comum |144/417–418|Proteção reduz o dano corporal no fluxo físico. Ataque comum não recebe perda automática de PVA; exceções continuam manuais conforme decisão de Lucas.|
| Dano à armadura por técnicas |141 e regras da técnica|Aplicação individual e journal existentes. Exceções de classe/perfil seguem conferidas na mesa; não aplicar imunidade nova por inferência.|
| Quebrar Armadura Sustentada |229|Parcela1/2/3 por classe em registro específico, com prazo, Ajustar e recuperação; ver [contrato](armadura-recorrente.md). Forma instantânea e mistos permanecem manuais.|
| Recuperação, restauração e sangue |142–143/307–308|Condições de recipiente, dias, técnica e sangue continuam manuais. A recuperação do journal de uma operação interrompida é outra função.|
| Lutar sem armadura |145|PA/capacidade deixam de ser somadas quando não há armadura aplicada; a parcela corporal de20% pelo uso de técnica sem armadura continua manual. Não foi inferido em que momento cobrar a parcela ligada ao dano causado.|
| Afinidade, memórias e acessórios |145–148|Parâmetros e descrição disponíveis; efeitos específicos exigem seus próprios contratos. Não concedem ações/condições automaticamente.|
| Divinização e asas |151–152|Processo de despertar/duração, requisitos e voo permanecem manuais. Selecionar a classe numérica não executa esses eventos.|

A lista e o Item distinguem Bônus aplicados, Guardada e Sem bônus com motivo real (PV negativo, Morta ou outra armadura em uso). A PA exibida continua sendo o parâmetro daquela armadura, e a seleção usa a ordem da coleção do cálculo, mesmo quando a lista está ordenada de outra forma. Itens de mundo/compêndio e cópias removidas não recebem estado de aplicação. O contexto usa máximos já derivados, inclusive passivas e máximo manual; não recalcula nem grava recursos. Equipar e os parâmetros manuais permanecem disponíveis, sem equipamento forçado, cura ou dano automático.

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

A seção6.6, pp.688–698, foi inventariada por ocorrência no material de trabalho. São168referências principais nos blocos abaixo, e não168novos Items ou armaduras numéricas. O levantamento conserva portadores alternativos na mesma linha, separa referências explícitas e evita unir nomes semelhantes sem contexto. Essa lista não é preenchida pelos22artefatos nem pelas cinco classes genéricas do formulário.

| Bloco da lista | Páginas | Referências contadas |
|---|---|---:|
|Athena: zodíaco / Bronze / outros guerreiros / bloco de Prata / constelações restantes|688–692|12 /11 /4 /24 /37 =88|
|Espectros: juízes / celestes / terrestres / soldado / Lost Canvas|692–694|3 /11 /8 /1 /11 =34|
|Odin: matriarca / Asgard / Aesirs / Soul of Gold|694–696|1 /8 /5 /7 =21|
|Poseidon: generais / comandantes / soldados|696–697|7 /12 /6 =25|

Em separado há11referências de Ares (4acompanhantes,3nomes de regimentos e4categorias coletivas) e7menções incidentais de armas na descrição dos guerreiros de Soul of Gold. Estas últimas não foram transformadas em artefatos ou efeitos executáveis. As contagens são deste trecho, não uma declaração de cobertura integral do livro.

Limites encontrados no próprio trecho:

- A numeração de Athena vai de1a89, omite52 e contém88linhas; preservar a referência, sem fabricar a entrada52 ou renumerar o livro.
- O cabeçalho menciona15dos16cavaleiros de Prata do mangá, mas as linhas13–28 contêm16referências; o bloco13–36 tem24linhas ao incluir as demais origens.
- Shido/Mizar e Bado/Alcor dividem uma linha, mas são duas referências explícitas. Portadores alternativos de uma mesma linha numerada de Athena não são outras armaduras.
- Queen e Fiodor aparecem com Mandrágora e estrelas distintas. Gram na descrição de Sigmund(p.695) não foi igualada automaticamente ao artefato lendário das pp.613–614.
- O trecho cita quatro regimentos de Ares e fornece três nomes. Não foi criado um quarto, nem atribuída classe numérica a partir de status coletivo.

Inventário deste trecho concluído; conferência das referências dispersas e cobertura individual de poderes continuam pendentes antes de uma auditoria global. Nenhum catálogo, UUID, ficha ou campo de classe foi criado/alterado pelo inventário. As pp.699–702 não ampliam a lista nessa extração.

A matriz desta etapa cobre parâmetros básicos, limites de execução já identificados e os22artefatos da seção607–614. Não fecha todas as armaduras, poderes específicos ou referências cruzadas do livro. Tampouco substitui os contratos ambíguos de componentes e poderes avançados que continuam registrados em [próximos desafios](proximos-desafios.md).

## Ensaio do conjunto

Oito regressões cobrem requisito qualitativo, versões e valor interno preservado, troca/remoção, PVA0/negativo fracionário e inteiro, Morta/Em recuperação, múltiplas equipadas com ordenação visual diferente, máximos derivados/passiva/manual, CE negativa sem sinal duplo, cópias removidas e outra ficha. O callback existente de Equipar continua funcionando abaixo do requisito de Sentido; nenhum recurso atual é consumido ou restaurado pela apresentação.

Edge isolado usa os templates e contextos reais do sistema e o callback Equipar da ficha sobre Actors de exercício vinculados/sintéticos simulados. Confere teclado, estados reais, remoção, nomes escapados, observador sem ações de edição e largura440px. Cinco classes de Item independente exibem requisitos sem estado de aplicação. Estes são ensaios locais, não execução do core hospedado.

Validação do conjunto:671testes Linux completos, compilação de templates, roundtrip nativo de compêndios e pacote de CI conferidos;670testes locais, com apenas o roundtrip nativo de Items omitido no ambiente Windows. O ZIP da release deve conservar as fontes, catálogos/IDs e privacidade conferidos antes da instalação. Inventário por ocorrência de688–698 registrado; referências dispersas e poderes individuais seguem pendentes para a auditoria global; não reimportar artefatos já publicados. Preservar organização de Técnicas, Atacar no topo e a diretriz de versões maiores.

As verificações atuais combinam leitura das fontes já extraídas, metadados de catálogo, cálculos, contextos e navegador isolados. Não comprovam core hospedado13.350 ou conexões reais; esses ensaios permanecem pendentes. Sem novas condições ou regras presumidas. Fonte e licença do livro permanecem em [atribuição](../ATTRIBUTION.md).

## Conferência complementar de poderes e referências — 25/10/2026

O [levantamento de poderes de equipamentos](poderes-equipamentos.md) fecha um conjunto posterior à 0.61.0: matriz dos 22 artefatos, 14 blocos técnicos de Pó de Armaduras em 27 páginas e índice467, classificação contextual dos 322 candidatos da busca direta e sete referências indiretas nomeadas. A matriz registra valores, unidades, cobertura real e limites de execução, sem modificar catálogos ou cópias.

As pendências de referências dispersas citadas acima passaram a ter esse registro verificável. A classificação cobre os contextos selecionados, sem alegar leitura integral das 702 páginas, ausência de toda grafia/OCR ou execução de todos os poderes. A continuação77 de Armadura Remota, a divergência29/30 em Selamento666–669 e as distinções entre objetos, variantes e recompensas sugeridas permanecem explícitas. O inventário688–698 e as cinco classes não foram recontados como novos Items.

Este é o fechamento do conjunto documental definido, não da automação integral do livro ou do ensaio hospedado. Os poderes manuais continuam manuais; novas condições e decisões ambíguas permanecem adiadas. Sem alteração de runtime, versão, recursos, permissões ou UUIDs; nenhuma release isolada por documentação.
