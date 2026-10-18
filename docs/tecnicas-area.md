# Técnicas em área — 0.41.0

Marque de dois a vinte tokens distintos de cavaleiros e use Ativar em uma técnica com primordial Dano. A janela mostra os nomes congelados, custo, dificuldade e dano por alvo. Asterismo precisa ter pelo menos três graduações (p.210). Controle, Sustentada e Cosmo Residual não usam esta manobra. O limite de vinte é técnico para o tamanho da solicitação, não uma regra do livro.

Regras deste grupo, pp.210/404:

- CE: custo completo da ativação +1 por alvo, cobrado uma vez no usuário. Elevar/Condensar/componentes já incluídos não são multiplicados pelos alvos.
- Asterismo: dificuldade da ativação antes do adicional de área +2 por alvo. O adicional de CE da área não aumenta novamente a dificuldade. Exemplo do livro: base2CE e quatro alvos custam6CE e dificuldade20, não24.
- Uma rolagem de Asterismo para o grupo. Falhar ainda gasta o custo; não cria ataque para resistir. ND/Poder continuam seguindo a técnica configurada, inclusive elevação/crítico.
- Dano corporal total, incluindo nível e bônus, dividido igualmente pelos alvos antes de cada resistência. Mantém frações, sem arredondamento silencioso. Adota dano à armadura integral por alvo, seguindo o exemplo que separa a divisão corporal do dano à armadura; a interpretação fica registrada aqui para a mesa revisar.
- Ações de luta são ataque + defesa (p.404). Com controle de ações ativo, ambas as reservas precisam estar intactas e são consumidas juntas, na mesma gravação do pagamento. Movimento, Reação e registros de Cosmo permanecem separados. Sem controle ativo, o gasto de ações é conferido na mesa.

O cartão tem Resistir e Ajustar resistência para cada alvo. Usa sempre a ficha daquele botão, mesmo que outro token esteja selecionado. Resistência, aplicação e desfazer são individuais; uma aplicação por origem e defensor. Desfazer em um alvo não restaura o outro. Nenhuma resistência cobra novamente a ativação ou refaz o Asterismo.

Só admite fichas distintas: dois tokens vinculados ao mesmo Actor não podem receber duas parcelas. Use fichas/tokens sintéticos independentes quando forem criaturas independentes. Misturar tokens de cenas diferentes, token sem ficha, invisível, removido, oculto para o solicitante ou com identidade/posição alterada impede a operação antes do pagamento. Perda de acesso também impede. Trocar alvos após abrir a janela não modifica a lista original; reabra para selecionar outro grupo. O mestre revalida todos após operações assíncronas. Modos público/privado/cego/self preservam o contrato anterior. Coordenadas não vão para o cartão ou histórico do Actor.

Se o pagamento foi salvo mas a publicação falhou, recuperar republica o mesmo cartão, alvos e parcelas, mesmo que tokens tenham se movido ou sido removidos depois. Não repete custo, reserva ou rolagem. Um alvo removido ainda pode precisar de conferência manual para resistir; o pagamento registrado permanece preservado.

Geometria deste grupo é manual: confira forma, orientação, alcance de cada alvo, elevação, paredes e cobertura na cena antes de ativar. A lista marcada declara quem será atingido; não afirma que estão dentro de um cone/raio. Redução automática de distância fica desativada para área, pois faixas diferentes precisam de contrato próprio. Essência Alvo não pode conceder bônus único ao grupo inteiro; use resolução individual/manual. Terreno Favorável/Esgotar e outros componentes já suportados continuam conforme a configuração, sem novas condições.

Ambiguidades preservadas: o exemplo p.210 cita dano30+nível em uma técnica Bronze, enquanto a tabela de ND/Poder usa valores próprios de classe. O sistema não força ND3 nem altera a cópia para imitar esse número; aplica a fórmula configurada e divide o total. Divisão de armadura, áreas naturais/cooperativas, efeitos especiais por alvo e exceções de custos precisam de contrato próprio antes de ampliar a automação.

Validar no Foundry13.350 com mestre e dois jogadores: marcas, nomes/UUID, fichas vinculadas e sintéticas, duas reservas, CE insuficiente, fracasso/crítico, dois alvos com resistências/armaduras diferentes, aplicação dupla, desfazer de apenas um, troca de mestre, reconexão, recuperação e rolagens privadas. Testes locais e prévia isolada não substituem o core hospedado.


## Distâncias e atualização da prévia — 0.41.0

A janela de área apresenta uma tabela com cada alvo original, distância e situação em relação ao alcance configurado (incluindo Espaço quando suportado pela cópia). A medida entre centros usa a grade e suas diagonais, conforme a convenção de distância da 0.37.0. Não demonstra inclusão em cone/raio, paredes, cobertura ou linha de visão; exceder alcance não reduz o dano automaticamente neste grupo.

**Atualizar prévia da área** mede novamente e captura as posições atuais dos mesmos tokens. Depois de movimento, não é preciso fechar a janela apenas para conservar o grupo nas novas posições. O grupo mantém UUIDs e ordem originais: marcar outro token não o substitui. Troca de ficha, token removido, oculto ou em outra cena exige corrigir a situação ou reabrir para escolher outro grupo. Mudanças posteriores à última prévia continuam sendo recusadas pelo mestre antes de pagar.

Com múltiplos tokens da ficha usuária, selecione somente a origem desejada para medir. Sem origem inequívoca, unidade em metros, mesma elevação ou API disponível, a tabela informa medição manual e preserva o fluxo manual de ativação. Distâncias são apenas informativas, não são enviadas como cálculo de dano nem copiadas ao cartão/histórico. A atualização muda somente o snapshot local de posições que já existe na manobra; não move tokens nem gasta CE/ações.

A situação de alcance não autoriza ignorar regras de área: a combinação da divisão do dano (p.210) com reduções diferentes de ND pela distância (p.204) ainda precisa de um contrato explícito. Não se adotou uma ordem de cálculo ou faixa comum/individual silenciosamente. Geometria e redução por alvo continuam no roteiro; sem novas condições. Validar a janela real em Foundry13.350, especialmente tokens vinculados/sintéticos, seleção da origem, movimento entre prévia e envio, troca de alvos e modos de visibilidade.


## Geometria de referência — 0.42.0

Na janela de área, abra **Forma de referência (opcional)** e escolha círculo ou cone. O desenho usa o alcance efetivo como raio/comprimento e representa os centros dos tokens originais, numerados conforme a tabela; U marca a origem. Direção 0° aponta à direita e 90° abaixo. A abertura inicial de 90° é parâmetro visual ajustável, não regra extraída do livro. Círculo é uma referência disponível à mesa, não uma interpretação obrigatória da palavra “raio” da p.204. O livro cita formas e alcance, mas não se adotou um ângulo obrigatório.

A referência é plana, euclidiana, em metros e na mesma elevação. A tabela continua medindo pela grade/diagonais do Foundry e pode diferir do desenho. “Centro dentro/fora da referência” não decide acerto, interseção com bordas de tokens, paredes, cobertura ou linha de visão. Não há seleção automática, filtro do grupo, template persistente na cena, alteração de CE/ações/DC/dano ou inclusão de coordenadas novas no cartão/ficha. Para mudar o grupo, reabra a ativação.

**Atualizar prévia da área** conserva os mesmos UUIDs e atualiza posições, distâncias e referência. Origem ambígua, unidade/escala/alcance inválidos, parâmetros visuais incompletos ou cena indisponível deixam o desenho manual sem bloquear por si só a ativação. Tokens ocultos/externos/trocados não são desenhados; elevação diferente não é classificada como fora. Erro de atualização remove o desenho anterior. Validações já existentes de alvos, movimento, permissão e cobrança única continuam valendo.

A combinação da redução individual de distância (p.204) com a divisão de dano (p.210) continua manual, sem inventar ordem de cálculo. Próximos contratos: distância por alvo com fórmula explícita; ampliar componentes executáveis e exceções de poderes sem novas condições. Validar no core hospedado13.350 seleção da origem, tokens sintéticos, atualização/movimento e permissões. A prévia Edge isolada não confirma compatibilidade do servidor.
