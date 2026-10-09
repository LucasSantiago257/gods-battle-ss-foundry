# Combate e aplicação confirmada

Marque um cavaleiro como alvo e, na aba Combate, use Atacar alvo selecionado. Escolha a habilidade de luta. O proprietário do defensor ou mestre usa Defender no cartão. Ambos rolam suas graduações de luta com ações e modificador de nível (p.415). Acertos efetivos = máximo(0, ataques − defesas). Dano corporal = acertos × máximo(0, nível de ataque + bônus − PA), pp.416–418. Nível de ataque, bônus situacionais, críticos específicos de luta e ações gastas são conferidos pelo usuário. Combate rápido e manobras avançadas ficam fora deste fluxo.

Para técnicas, use Configurar na cópia, confira a prévia de custo/dificuldade/dano e ative. Marcar um único alvo vincula o cartão ao defensor; Resistir usa sua ficha e o Poder Cósmico do ataque como dificuldade. Sem alvo, continua o fluxo com defensor selecionado. O novo cartão tem Conferir e aplicar dano e Desfazer aplicação. Confira efeitos de Big Bangs e exceções antes de confirmar. Ajustar os valores permite notas opcionais. Mensagens antigas precisam de nova resolução para gerar um registro de aplicação. Veja tecnicas.md.

É necessário um mestre ativo. O primeiro mestre ativo segundo o Foundry processa solicitações privadas em fila, verifica autor/permissão do defensor, acesso ao cartão, valores confirmados e duplicação por ataque/defensor. Um atacante não pode alterar PV de personagem alheio. Ataques físicos comuns não retiram PV da armadura; técnicas usam o dano de armadura já resolvido.

Aplicação registra valores anteriores/posteriores e notas opcionais em flags.gods-battle-ss.damageOperations no defensor. Clique em Desfazer no cartão: somente a última aplicação pode ser desfeita e os PV devem coincidir com os valores registrados. Cura, edição ou dano posterior impedem restauração silenciosa. Ao desfazer, a aplicação anterior volta a ser a última operação.

Falha entre gravações tenta restaurar a armadura quando os valores ainda coincidem. Na aba Combate, Histórico de aplicações de dano mostra valores anteriores/posteriores e ajustes. Operação interrompida tem botão de recuperação para o mestre responsável: ele confirma a conferência, e o sistema só completa o registro ou reverte a gravação parcial se os recursos coincidirem com os valores armazenados. Alterações posteriores exigem conferência manual. Reentrada e troca de mestre não reaplicam uma operação preparada. Solicitações não processadas são retomadas ao abrir o mundo ou atualizar usuários.

Controle, sustentação, duração, condições, efeitos em área e movimentação permanecem manuais. PV fracionários são conservados conforme a escolha de preservar a metade do dano. Não aplicar a proteção de ataque físico novamente sobre o dano de uma técnica.

## Pagamento de técnicas 0.13.0

Pagamento/rolagem de técnicas agora compartilha a fila do mestre ativo com dano e evolução. A solicitação do jogador vira o cartão final, preservando autoria e visibilidade. Confirmações sobre um estado anterior são recusadas; pagamento interrompido exige conferência e bloqueia alterações automatizadas conflitantes. Histórico/recuperação na aba Combate não repete cobrança ou rolagem. Edição direta/macros ficam fora da fila. Ver ativacoes.md e validar dois clientes no servidor antes de considerar este fluxo verificado.

## Ações por rodada 0.14.0

Controle habilitado por encontro em Combate → Ativar controle de ações. Ataque/defesa escolhem quantidade disponível e gastam pela fila do mestre; técnicas escolhem reserva inteira de ataque ou defesa, paga junto com CE/PV. Trocar a vez não repõe; trocar a rodada abre reservas novas sem mudar recursos. Movimento/Reação têm registro separado. O histórico permite recuperar o mesmo resultado e o mestre pode ajustar com notas opcionais. Ver acoes.md para convenção de turno coletivo, interrupções, tokens e limites.
