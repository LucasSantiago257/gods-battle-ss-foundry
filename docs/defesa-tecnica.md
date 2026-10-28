# Defender com técnica

No cartão de uma técnica recebida, o dono do defensor ou mestre encontra **Defender com técnica** e **Registrar defesa**. Em área, cada defensor tem seu próprio controle. O painel só aparece para quem pode editar aquela ficha; não consulta a ficha atacante. Atacar e a organização da aba Técnicas permanecem iguais.

## Ativar a defesa

Escolha uma técnica da própria ficha. A prévia mostra defesa corporal, ND/Poder, custo, dificuldade de Asterismo e reserva usada. Cópias com números pendentes podem ser abertas em **Abrir cópia** para configurar custo, ND/Poder manuais ou pelo status. O efeito da cópia pode continuar Manual ou Sustentada: a projeção numérica desta manobra não o troca por Dano. Nenhuma declaração de revisão, justificativa ou aceite é exigido.

A ativação usa toda a reserva de Defesa, ou uma Reação quando a ficha possui a referência canônica de Bloqueador de Técnicas. Elevar, CE adicional, Condensar, modificadores e distribuição de CE ficam em **Ajustes da ativação**. Excesso corporal é uma opção explícita de pagamento; a prévia inclui os PV correspondentes. Cancelar não envia pedido, cobra ou rola. Sem controle de ações, as reservas continuam sendo conferidas pela mesa.

**Gastar CE e defender** envia uma operação privada ao coordenador mestre, processada automaticamente. Há uma tentativa paga por ataque/defensor. O resultado, CE e Asterismo ficam visíveis no painel; os dados reais salvos e o histórico ficam recolhidos. Não é necessário pedir aprovação ao mestre e nenhum dado é relançado para exibir o resultado. Uma falha também registra o custo da tentativa.

## Resistir e aplicar dano

A defesa bem-sucedida é subtraída do dano corporal original **antes** da resistência. O ataque original, PC, natureza e componentes de resistência são preservados. Use o botão de resistência já existente; em falha crítica da defesa sem Bloqueador, ele passa a **Calcular dano** e não inventa um teste de resistência. Bloqueador concede+2 ao Asterismo, conserva a resistência nesse caso e remove a penalidade de falha prevista na manobra.

O resultado mantém **Aplicar dano**, **Ajustar** e **Desfazer**. O dono aplica na própria ficha e o mestre nos defensores autorizados. Depois de alterar a defesa, cartões de resistência anteriores ficam como **Atualizar resistência** e não podem aplicar valores antigos. **Desfazer** restaura apenas o dano pelos snapshots intactos; não devolve CE ou ações da defesa.

Reduzir o corpo a0 não equivale a resistir aos efeitos extras. As pp.213–214 não dão uma conversão geral do bloqueio corporal para PVA: o fluxo conserva o dano tabelado à armadura e mostra um aviso curto de conferência quando relevante. Use Ajustar para a decisão da mesa. Isso é um limite operacional, sem supor absorção proporcional ou anulação automática de PVA. Ataque físico comum continua sem perda automática de PV da armadura.

## Resultado já resolvido e ajustes

**Registrar defesa** informa resultado, valor corporal e a exceção de Bloqueador já resolvidos pela mesa. Aceita0 ou valor fracionário explícito e não executa outro teste, pagamento, consumo de ações ou penalidade. **Ajustar defesa** cria outra revisão por esse mesmo caminho. Não infere pagamento ou sucesso de um recibo genérico. Notas não editadas são preservadas, inclusive quando mudam durante uma espera.

Cada revisão pertence ao ataque original e à identidade real do defensor, incluindo token sintético. Uma parcela de área não transfere sobra de bloqueio aos outros alvos. O histórico de uma ficha copiada não concede defesa automática à cópia. Se o dano já foi aplicado ou está interrompido, confira ou desfaça essa aplicação antes de registrar outra defesa.

## Interrupções

**Conferir defesa** aparece no cartão e na ficha do dono/mestre quando há uma operação interrompida. **Concluir pelo registro** completa somente a gravação ausente compatível; se já houve commit, não cobra ou rola novamente. Se os dados não chegaram a ser salvos, a tentativa interrompida é encerrada sem cobrança ou nova rolagem. **Encerrar sem alterar recursos** conserva ajustes e o registro instalado.

A identidade da mensagem representa a intenção única. Reenvio, troca de coordenador e resposta perdida não restauram estados antigos. Se o commit real já foi confirmado, uma falha na resposta privada não mantém os controles bloqueados. Journals de defesa têm recuperação própria e não são tratados como parcelas genéricas de PV. As verificações e a fila são client-side; não constituem validação no servidor.

## Fonte e limites

Fontes: manobra213–214, Bloqueador178, cálculo/ativação199–202 e resistência205–207. Asterismo3 e a relação entre Sentidos estão no livro; a interface não cria um gate de aquisição nem presume uma ordem entre ordinal e estágio ou destruição automática de barreiras. A mesa continua resolvendo essa relação e suas exceções. O apoio não promete defesa automática contra um Sentido superior.

Guardar228–229 continua separado: não há+10/+15/+20 ações automáticas, contador de imobilidade ou escudo com HP por analogia. Componentes ativos, Movendo, área/distância da defesa, Residual, proteção de terceiros e efeitos especiais sem contrato ficam fora desta ativação. Uma técnica cooperativa, rascunho ou fonte com parâmetros incompatíveis não recebe uma ativação paga presumida; o resultado já resolvido conserva seu caminho explícito. Não há novas condições, aquisição automática, Apoiar, migração ou alteração de catálogos.

## Ensaio curto

1. Em cópias de exercício, configure uma técnica defensiva com custo/ND/Poder. Receba uma técnica com um alvo e abra Defender com técnica. Confira a prévia e cancele; nenhum recurso muda.
2. Ative uma vez. Confira CE, Asterismo e reserva da defesa. Resista e aplique o valor calculado; use Desfazer sem editar os saldos entre as ações. CE e ações da defesa continuam gastos.
3. Use Ajustar defesa ou Registrar defesa com um resultado já resolvido. Confira que não há outro custo ou dado e que a resistência anterior exige atualização. Experimente0 explícito.
4. Registre falha crítica sem Bloqueador: Calcular dano não rola resistência. Com Bloqueador, a resistência continua disponível.
5. Repita com token sintético e uma área com dois proprietários. Cada um vê seus controles; observador vê somente o conteúdo público do ataque. Não provoque falhas artificiais no mundo de jogo: os testes simulam interrupções e reenvios.

Módulos/templates/callbacks/hooks foram exercitados em testes e Edge isolados, incluindo teclado440px e privacidade. O combate básico foi confirmado por Lucas no servidor; este fluxo novo e a concorrência real ainda precisam do ensaio hospedado13.350.
