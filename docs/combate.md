# Combate e aplicação confirmada

Marque um cavaleiro como alvo e, na aba Combate, use Atacar alvo selecionado. Escolha a habilidade de luta. O proprietário do defensor ou mestre usa Defender no cartão. Ambos rolam suas graduações de luta com ações e modificador de nível (p.415). Acertos efetivos = máximo(0, ataques − defesas). Dano corporal = acertos × máximo(0, nível de ataque + bônus − PA), pp.416–418. Nível de ataque, bônus situacionais, críticos específicos de luta e ações gastas são conferidos pelo usuário. Combate rápido e manobras avançadas ficam fora deste fluxo.

Para técnicas, ative normalmente e use Resistir com o defensor selecionado. O novo cartão tem Conferir e aplicar dano e Desfazer aplicação. Confira efeitos de Big Bangs e exceções antes de confirmar. Ajustar os valores exige justificativa. Mensagens antigas precisam de nova resolução para gerar um registro de aplicação.

É necessário um mestre ativo. O primeiro mestre ativo segundo o Foundry processa solicitações privadas em fila, verifica autor/permissão do defensor, acesso ao cartão, valores confirmados e duplicação por ataque/defensor. Um atacante não pode alterar PV de personagem alheio. Ataques físicos comuns não retiram PV da armadura; técnicas usam o dano de armadura já resolvido.

Aplicação registra valores anteriores/posteriores e justificativa em flags.gods-battle-ss.damageOperations no defensor. Clique em Desfazer no cartão: somente a última aplicação pode ser desfeita e os PV devem coincidir com os valores registrados. Cura, edição ou dano posterior impedem restauração silenciosa. Ao desfazer, a aplicação anterior volta a ser a última operação.

Falha entre gravações tenta restaurar a armadura quando os valores ainda coincidem. Operação incompleta fica bloqueada e mantém seu journal; o mestre confere before/after no registro e corrige os recursos antes de liberar uma nova tentativa. Reentrada e troca de mestre não reaplicam um journal preparado. Solicitações não processadas são retomadas ao abrir o mundo ou atualizar usuários.

Controle, sustentação, duração, condições, efeitos em área e movimentação permanecem manuais. PV fracionários são conservados conforme a escolha de preservar a metade do dano. Não aplicar a proteção de ataque físico novamente sobre o dano de uma técnica.
