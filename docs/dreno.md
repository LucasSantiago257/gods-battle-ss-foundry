# Dreno por parcelas informadas

Na ficha do alvo, abra **Combate → Efeitos com duração → Dreno**. Escolha uma técnica Sustentada com Dreno ou uma cópia de Teia da Tarântula configurada como Sustentada, o encontro, a duração e a primeira parcela. O registro é gratuito e não executa outra ativação. A criação lista somente fontes de fichas que você pode editar; o mestre pode registrar nos alvos autorizados.

Após o registro, o dono do alvo aplica a perda na própria ficha sem precisar possuir a ficha atacante. O mestre ativo coordena automaticamente, com mensagens privadas e discretas. Não existe solicitação visível ou aprovação humana. A apresentação do alvo usa o nome Dreno e o perfil capturado; não consulta a fonte oculta para montar a prévia.

**Aplicar** sugere1CE de Bronze,3de Prata ou5de Ouro por rodada, usando a classe capturada da cópia. **Ajustar** recebe quantias explícitas de CEatual e CEextra; a prévia mostra o total e os saldos. O padrão em CEatual é uma convenção operacional, sem afirmar prioridade universal de consumo no livro. Uma alocação que não cabe nos saldos exige ajuste explícito, sem redução silenciosa ou excesso corporal. **Dispensar** registra a rodada sem retirar CE; quantias0também permitem registrar uma perda já resolvida manualmente. Campos vazios não viram0.

O prazo mostra a próxima rodada e o número de parcelas pendentes. Avançar o encontro não aplica ou dispensa nenhuma parcela. A fonte, o combatente, o encontro e sua época têm identidades próprias; uma cópia de outro Actor não recebe automaticamente efeitos financeiros do original. A duração e a primeira parcela são informadas pela mesa, sem inferir sucesso, resistência, ativação ou prazo a partir de um recibo genérico.

**Desfazer última parcela** inverte somente a última aplicação com os saldos e o registro ainda compatíveis, inclusive a alocação em CEextra. Essa ação continua evidente quando a última parcela conclui o prazo. Depois de desfazer, a rodada volta a ficar pendente; não há restauração arbitrária de parcelas antigas. **Encerrar Dreno** conserva CEe histórico e funciona mesmo com fonte ou encontro removidos. O encerramento explícito retira a disponibilidade de Desfazer. Notas e histórico ficam recolhidos.

## Interrupções e preservação

**Conferir Dreno → Concluir pelo registro** completa somente a gravação ausente quando a matemática e os snapshots continuam compatíveis. Se a parcela já foi gravada, conclui apenas o status; não repete perda ou reembolso. **Encerrar sem alterar CE** conserva ajustes posteriores. Um vínculo adulterado não autoriza encerrar outro registro. A recuperação é própria de CEe não usa o resolvedor genérico de PV.

As mensagens usam o autor real e a mesma identidade de intenção na retomada. Papéis, comandos e patches recebidos não são executados. Recibos antigos não substituem o estado atual da ficha, inclusive depois de Desfazer. Nomes/notas personalizados não invalidam a matemática. Permissões e valores são revalidados pelo coordenador; isso não é uma alegação de validação no servidor.

Dreno retira somente CEatual/extra do alvo escolhido. Não credita o usuário nem altera reserva, máximo, sobrecarga, PV ou armadura. A perda externa pode deixar CEatual abaixo da reserva, mantendo seus registros; gastos posteriores conservam seus próprios guardas. CEilimitada permanece manual, pois não há saldo finito definido para esta operação.

## Fonte e limites

Referências: Big Bang Dreno,p.227, e Teia da Tarântula,pp.310–311. O registro captura classe/perfil para o efeito informado: editar, remover ou evoluir a fonte depois não recalcula suas parcelas. Apoiar, aquisição, custo/teste de ativação, resistência, oposição/manutenção e extensão da Sustentada continuam em seus fluxos próprios ou na mesa. Registrar Dreno não os resolve nem cobra novamente.

O suporte cobre fonte canônica Sustentada com Dreno e Teia configurada, com um alvo por registro e duração finita informada. Outros primordiais, área, custo compartilhado e duração variável não são inferidos. O aprisionamento narrativo da Teia não cria uma condição. Não há nova mecânica de Atordoado, Paralisado, Surpreso ou outro estado. O limite de1000entradas/rodadas é técnico, não regra do livro. Catálogos, IDs, cópias, ajustes e notas publicados foram preservados.

## Ensaio curto

1. Use cópias de exercício, um encontro iniciado e um alvo com um único combatente. Configure uma cópia de Teia da Tarântula como Sustentada ou componha Sustentada+Dreno. Resolva ativação/oposição separadamente conforme a mesa. O mestre registra Dreno no alvo; cancelar não muda CE.
2. Escolha duas rodadas e primeira parcela nesta rodada. Confira o registro gratuito, o valor sugerido e Aplicar. O dono do alvo aplica a própria perda, mesmo sem acesso à origem. Confira uma única diferença em CE.
3. Avance para a rodada seguinte, abra Ajustar e escolha uma alocação parcial ou0já resolvido, conferindo a prévia. Aplique e use Desfazer sem editar os saldos entre as ações. A última parcela volta a ficar pendente.
4. Use Dispensar ou aplique novamente. Encerre e abra Histórico. Um observador não recebe linhas/ações/saldos de Dreno; notas e fontes ocultas não são exibidas como escolhas do jogador.
5. Repita em Actor vinculado e token sintético. Não provoque falhas artificiais no mundo de jogo: as janelas de interrupção, reenvio e inversão são exercitadas pelos testes automatizados.

O conjunto foi exercitado com módulos, templates, callbacks e hooks em ambiente isolado, além de Edge/teclado440px. Isso não comprova o core hospedado13.350 ou concorrência entre conexões reais. O combate básico já foi confirmado por Lucas; este ensaio completo continua separado.
