# Ativar técnicas e resistir — 0.13.0

**Configurar** na lista de técnicas (ou **Configurar técnica para combate** na cópia) reúne natureza, classe, efeito, custo completo, alcance e modo de dano. Confira a descrição e marque a revisão. A configuração altera somente esta cópia; conserva notas, proveniência e parâmetros manuais quando o modo automático é escolhido. Cancelar não grava.

O modo **ND e Poder pelo status do usuário** usa a tabela da p.201: Bronze ND2/Poder10, Prata ND3/Poder15, Ouro ND4/Poder20. Acompanha o status atual, que é separado da classe da técnica; subir de nível não promove status. A tabela refere o status do cavaleiro, não a armadura equipada. Técnicas com ND/Poder específicos ou usuários Divino/Deus usam modo manual. Cópias antigas começam em modo manual, preservando seus cálculos. A opção é explícita; nenhum Item do compêndio é reescrito.

O custo publicado já contém componentes e permanece sujeito à revisão. O assistente não substitui custos variáveis pelo custo simples da classe. Na ativação, a prévia atualiza custo, dificuldade de Asterismo, Poder Cósmico da resistência, dano normal/crítico, dano à armadura e pagamento conforme você altera os campos. Não rola nem gasta recursos durante a prévia. Condensar soma uma CE por virtude aplicada (pp.208–209); seus efeitos precisam de conferência. Não conte novamente algo já incluído no custo publicado ou CE fixa adicional.

Na aba **Técnicas**, crie ou arraste uma técnica e abra sua ficha. Confira natureza, classe, Big Bang primordial (dano, controle ou sustentada), Poder, ND e custo publicado. Esse custo já deve conter os Big Bangs; não haverá uma segunda soma automática. Os modelos novos de Bronze usam ND 2, Poder 10 e custo 2 (páginas 198–202). Cópias e compêndios existentes preservam seus valores; ajuste o ND antigo manualmente se necessário.

Clique em **Ativar**. Acrescente CE para esta ativação, eleve o Cosmo e aplique modificadores. Cada elevação custa +1 CE: aumenta o ND de dano ou o Poder Cósmico de controle/sustentação. Esses ajustes não reescrevem o Item. CE extra pode ser gasta primeiro. A reserva é uma parcela da CE atual protegida do gasto automático; libere-a manualmente quando necessário.

O teste é Asterismo contra **10 + custo total**, usando o atributo da natureza da técnica ou a associação manual escolhida na perícia. A parada fica entre um e cinco dados. A CE é descontada mesmo em falha. Falha crítica registra −10 para o próximo Asterismo; o próximo teste consome a penalidade e pode gerar outra. Na aba Combate existe um ajuste manual.

CE insuficiente bloqueia a ativação. Para ultrapassar o limite do corpo, marque a opção correspondente: uma segunda confirmação informa o gasto exato de PV. A regra cumulativa usa nível × excesso acumulado (p. 447). Exemplo: nível 7, CE atual 5, custo 14 → 9 acima do limite e 63 PV; outra queima de 1 CE → excesso 10 e mais 70 PV. A recuperação e a reinicialização do excesso continuam manuais. Armadura com CE ilimitada dispensa o desconto de CE.

O cartão apresenta a rolagem, o custo, o resultado e o Poder Cósmico. Para dano, calcula **ND × Poder + nível + bônus de dano**, incorporando +1 ND em sucesso crítico. Dano à armadura: Bronze 10, Prata 20, Ouro 30; escala planetária (ND 11–20) 70 e galáctica (ND 21+) 100. Técnicas especiais/divinas e exceções devem ser conferidas no livro.

Marque um único cavaleiro como alvo antes de ativar para vincular o cartão ao defensor. **Resistir com o alvo marcado** usa a ficha desse alvo, mesmo que outro token esteja controlado; somente seu proprietário ou mestre pode resistir. Sem alvo marcado, continua disponível o fluxo com token próprio selecionado ou personagem atribuído ao usuário. Múltiplos alvos não usam a resolução genérica; técnicas em área têm regras próprias. A natureza define o atributo e o Poder Cósmico fixa a dificuldade da resistência. Ajustes situacionais continuam no modificador; aplicação de dano permite ajustes justificados. A configuração provisória da fórmula de resistência continua disponível no mundo.

O cartão apresenta dano completo na falha; metade do dano corporal e nenhum dano à armadura no sucesso; zero em sucesso crítico; dano corporal dobrado na falha crítica. Sem armadura viva equipada, dobra novamente o dano corporal. Armadura com PV 0 ainda é viva; com PV negativos ou estado Morta deixa de proteger. Metades são exibidas sem arredondamento imposto. O cartão indica efeitos resistidos ou duração dobrada na falha crítica.

**A resistência calcula o dano; aplicar exige confirmação.** O proprietário do defensor ou mestre pode usar **Aplicar dano**, conferir o corpo e a armadura e justificar ajustes. Um mestre ativo processa a solicitação, registra os valores e impede aplicação duplicada. A última aplicação pode ser desfeita enquanto os recursos corresponderem ao registro; consulte [combate](combate.md). Confira proteções, Big Bangs e exceções antes de confirmar. Alcance, ações, aprendizado, estados, duração, sustentação por turno e recuperação são manuais. Controle/sustentação não recebe dano corporal genérico. As mensagens seguem a visibilidade de rolagens do Foundry.

A ativação exige mestre conectado: o jogador confere a prévia e envia uma solicitação privada. O mestre processa pagamento/rolagem na mesma fila usada por dano e evolução e atualiza o mesmo cartão com a visibilidade do solicitante. Confirmações concorrentes sobre a ficha anterior não cobram novamente. Interrupções têm registro na aba Combate; recuperar publicação conserva o resultado e não repete a cobrança. Confira antes de repetir e veja ativacoes.md. Edição direta e macros ficam fora dessa coordenação; validação real entre clientes ainda está pendente.

## Importar técnicas do livro (0.5.0)

O catálogo de Técnicas possui 166 entradas, organizadas por origem. Arraste uma para a ficha e use **Conferir**. Revise natureza, efeito, custo total, Poder/ND quando houver dano, alcance e regras específicas; marque a revisão ao terminar. Campos numéricos pendentes usam 0 e custos variáveis permanecem descritos em texto. A revisão é exigida somente pelas cópias do novo catálogo; técnicas anteriores continuam funcionando.

Consultar Big Bangs relacionados abre referências gerais sem modificar a cópia. Efeitos próprios da técnica prevalecem e continuam manuais. Exclamação de Athena é cooperativa e não habilita o botão de ativação genérica. A seção [compêndios](compendios.md) detalha as convenções.

## Composição personalizada

Técnicas → Adicionar abre o construtor com rascunho persistente, classe, primordial, componentes e graduações. Slots, custo, dificuldade e parâmetros genéricos são calculados; requisitos e efeitos especiais exigem revisão. Veja tecnicas-personalizadas.md. A CE fixa já inclui os tipos de incrementos selecionados: em Condensar, conte apenas virtudes adicionais ainda não incluídas.

