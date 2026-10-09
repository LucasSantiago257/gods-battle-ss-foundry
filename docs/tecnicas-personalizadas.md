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
