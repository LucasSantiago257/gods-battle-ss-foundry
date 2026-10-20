# Seleção de componentes — 0.36.0

A cobertura atual dos componentes, incluindo Movendo e o fluxo separado de Brasas, está na [tabela de execução](componentes-automaticos.md). Os marcos datados abaixo preservam a evolução do construtor; uma referência no compêndio não significa execução integral do efeito.

Adicionar Big Bang / incremento abre busca por nome ou página, sem distinção de maiúsculas e acentos, e filtro de tipo. A regra e os requisitos do selecionado aparecem na própria janela como texto. Componentes já incluídos e o primordial atual ficam fora da lista. Sem resultados, Adicionar fica indisponível; limpar a busca recupera a lista.

Adicionar altera somente o rascunho e não abre outra ficha automaticamente. A leitura completa continua nos detalhes do componente e em Abrir referência por escolha do usuário. Cancelar conserva composição e recursos. Propriedade, permissão de consulta, documento e duplicatas são conferidos antes de gravar; nenhuma regra, custo, graduação ou automação de efeito muda por pesquisar ou selecionar.

# Criar técnicas personalizadas

Na ficha do cavaleiro, abra **Técnicas → Adicionar**. A nova cópia abre o construtor. Para recompor uma técnica personalizada existente, abra seu Item e clique em **Construir técnica personalizada**. Técnicas importadas do livro continuam usando **Configurar técnica para combate**, preservando suas referências.

1. Informe nome, classe (Bronze/Prata/Ouro), natureza e Big Bang primordial: Dano, Controle, Sustentada ou Cosmo Residual.
2. Escolha ND/Poder pelo status do usuário ou valores manuais. Classe da técnica, status do cavaleiro e classe da armadura são parâmetros distintos. O modo automático não promove o cavaleiro e não presume tabelas para status Divino/Deus.
3. Use **Adicionar Big Bang / incremento** para selecionar os componentes do compêndio. A referência abre para leitura; a composição conserva UUID, regras, requisitos, página, atribuição, graduação e a escolha anotada. Escolher aqui não acrescenta uma virtude ao personagem.
4. Confira os slots, CE, dificuldade e prévia de dano. Alcance 0 e duração vazia usam os padrões da classe/primordial. CE fixa extra registra custos especiais conferidos; slots além da classe aparecem nas informações da composição.
5. Revise requisitos, mestre/armadura que ensina e desenvolvimento. As pendências são informativas e as notas opcionais. Clique em **Concluir composição**; a confirmação grava os parâmetros e o histórico na própria cópia.

O rascunho salva ao editar. Pode fechar/reabrir a ficha; uma nova tentativa de adicionar técnica retoma o rascunho existente. Durante a composição, a ativação fica bloqueada. **Descartar rascunho** conserva a técnica e seus parâmetros anteriores; uma técnica nova permanece manual até ser configurada. Concluir conserva PV/CE atuais, armadura, notas, origem e ID do Item. Cancelar a confirmação não altera parâmetros. Mudanças na ficha/composição durante a confirmação exigem nova conferência.

## O que é calculado

| Componente | Slots extras | Custo |
|---|---:|---:|
| Primordial Bronze/Prata/Ouro | Capacidade de2/3/4 extras, além do primordial | 2/3/4 CE |
| Big Bang extra | 1 | +1 CE |
| Apoiar | 1 | +0 CE |
| Tipo de incremento selecionado | 0 | +1 CE fixa, independentemente da graduação |

Referências: composição/exemplos pp.222–223; Apoiar p.225; incrementos/Mestre p.217. Até três tipos de incrementos e graduação até três são conferidos. Aquisição e graduação apropriadas ao personagem exigem revisão explícita; o construtor não concede Mestre. Dificuldade de Asterismo =10+CE total (p.199). Ouro com três Big Bangs extras custa7CE/dificuldade17; um tipo de incremento acrescenta1CE/dificuldade18.

A CE fixa já inclui os tipos de incrementos selecionados. Na ativação, **Condensar** conta somente virtudes adicionais ainda não incluídas; repetir um incremento ali cobraria sua CE novamente. Elevação e CE extra continuam escolhas da ativação. Veja [técnicas](tecnicas.md).

## Limites e referências

O construtor calcula composição, slots, custos e parâmetros genéricos. Efeitos especiais, testes de confirmação, durações condicionais, desenvolvimento e aquisição permanecem sujeitos à leitura/conferência. Apoiar conserva sua referência, mas evolução de classe/capacidade não é aplicada silenciosamente. Primordiais mistos e Cosmo Residual mantêm resolução manual; selecionar Dano junto de Controle não implica somar seus efeitos automaticamente.

**Composição salva** registra a decisão mais recente. Editar parâmetros depois não reescreve esse registro; recompor permite nova revisão. O histórico conserva composições anteriores, sem desfazer automático. Finalize antes de exportar para um compêndio do mundo; a técnica pode ser arrastada para outra ficha como cópia independente. Um rascunho copiado pode precisar ser descartado e reaberto, pois sua referência de estado pertence à cópia original.

Fonte: *Saint Seiya — A Batalha dos Deuses*, Dhoko de Libra, edição interna49.0, exemplar V49.1.1; pp.198–209,217–233. Conteúdo CC BY-NC-SA4.0; veja [atribuição](../ATTRIBUTION.md). Sem PDF/imagens do livro no pacote.

Validação local usa testes de regras/contratos e prévia dos templates. Execução real no Foundry13 build350, especialmente salvamento dos campos e permissões, ainda precisa seguir [o roteiro de validação](validacao-foundry.md).

Desde0.15.0, após concluir composição com primordial Dano, Configurar permite aderir ao primeiro grupo de componentes assistidos. Esgotar, Essência Alvo, Terreno Favorável e Controle sobre o Espaço calculam parcelas na ativação. Use ND/alcance base; recompor desliga a opção para nova revisão. Outros componentes ainda manuais. Ver componentes-automaticos.md.


Na 0.18.0, Controle possui duração por classe ou parâmetro personalizado e vínculo da resistência pública à ficha alvo. Estados e novas resistências permanecem manuais. Veja [Controle](controle.md).


## Suporte de execução no construtor — 0.45.0

O resumo da composição informa quantos componentes escolhidos possuem cálculo disponível em Ativar, quantos usam rodadas assistidas e quantos permanecem manuais. Cada componente mostra essa indicação mesmo fechado e explica o passo seguinte ao abrir sua referência. A informação acompanha IDs/chaves canônicos e o primordial escolhido; nomes livres não anunciam automação.

Os sete componentes do grupo de Dano são identificados como cálculo disponível após concluir e habilitar em Configurar: Esgotar, Essência Alvo, Terreno Favorável, Espaço, Estrelas, Destruição e Enfraquecer. A indicação cobre somente as parcelas já implementadas e suas opções; não afirma execução integral de cada texto. Enfraquecer mantém a extensão a outros ataques manual. Brasas é identificado como fluxo separado no painel Efeitos com duração, após ativação/resistência; o construtor não promete criar esse registro automaticamente.

Outros primordiais e composições mistas não anunciam o grupo automático de Dano. Custos/slots continuam calculados, enquanto efeitos específicos manuais permanecem disponíveis nas referências. A prévia de dano do construtor é a base da composição; as escolhas contextuais do grupo entram na ativação. Ler o suporte não altera fichas, recursos, rascunho, adesão aos componentes ou histórico salvo. Não adiciona novas regras, condições ou componentes executáveis.

Próximos contratos mecânicos exigem distinguir custos, dano, duração e alcance nas fontes. A leitura atual não inferiu como repetir/cobrar Sacrifício em falha, como combinar divisão de dano de área com distância individual ou como converter o “+1ND na Armadura” de Quebrar Armadura entre faixas de proteção. Esses pontos permanecem manuais até contrato explícito; não foram implementados por suposição. Foundry hospedado13.350 continua sem validação.
