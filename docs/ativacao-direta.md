# Ativação direta — 0.59.0

A organização da aba Técnicas permanece a mesma. Ao usar **Ativar**, a janela começa pelo nome/alvo e pelos valores: custo, dificuldade de Asterismo e PC. Dano mostra corpo/armadura e críticos; Controle mostra sua duração base; Sustentada conserva seu fluxo próprio, sem uma linha de dano genérico.

## Uso na sessão

- Uma ativação comum pode seguir direto para **Gastar CE e rolar**. Reserva intacta disponível continua selecionada; opções indisponíveis permanecem desabilitadas. Movendo mostra a reserva configurada de movimento; área usa ataque e defesa.
- **CE e Elevar/Condensar** reúne CE adicional, Elevar, Condensar, preferência de CE extra e queima acima da CE disponível. **Ajustes do teste** contém modificador e vantagem/desvantagem. **Componentes da ativação** aparece no grupo já habilitado, com Esgotar, Essência ou Terreno quando aplicáveis. Os grupos começam recolhidos; abrir/fechar conserva as escolhas.
- Os valores principais atualizam ao editar campos. Erros reais de CE/ND/alvos/reservas ficam visíveis fora dos grupos e bloqueiam o envio. Resolver a causa atualiza a prévia; cancelar não gasta CE, ações ou dados. Queima de PV conserva a confirmação concreta do valor antes da cobrança.
- Distância mantém opção explícita e **Atualizar medida**. A linha mostra distância entre centros, alcance e situação. Com redução ligada, mostra a parcela de ND ou PC já incluída. Sem alvo/cena/unidade/elevação válidos, o aviso explica a medição manual; optar pelo cálculo automático exige uma medida válida.
- Área mantém a lista original, tabela de distâncias/situação e **Atualizar prévia da área**. A atualização conserva os UUIDs; não troca o grupo por novos tokens marcados. **Forma de referência** fica recolhida e é opcional. Falha do desenho não bloqueia sozinha uma ativação válida; alvo oculto/removido ou posição alterada mantém a proteção existente.
- **Cálculos** reúne dados/modificador, fórmula e adicionais de área. Notas continuam opcionais. Os grupos podem ser abertos pelo teclado, sem uma caixa de aceite de regras.

## Limites preservados

Custos, dificuldade, dano, PC, duração, CE reservada, pagamento único, permissões e recuperação são os mesmos. Nenhuma opção nova concede virtude ou muda o componente da técnica. Condensar mantém a contabilização já existente; demais efeitos da virtude seguem sua referência. A simplificação da janela não altera o que o sistema executa.

Medição usa a grade entre centros. A forma opcional é plana/euclidiana; direção0° aponta à direita e90° abaixo. Ângulo90° é parâmetro visual inicial, não regra do livro. Desenho não seleciona alvos, decide acerto, inclui paredes/cobertura, move tokens ou muda custos/dano. A combinação de redução individual por distância com divisão de área continua manual; não foi inferida uma ordem de cálculo. Veja [área](tecnicas-area.md) e [componentes](componentes-automaticos.md).

O ensaio isolado cobre Dano/Controle/Sustentada/Esgotar/Movendo/área, callbacks reais com campos recolhidos, custo/dificuldade/dano/PC/prazo, avisos de CE/ND/cena/alvos, cancelamento e viewport440px/teclado. Não comprova execução no core hospedado13.350 nem concorrência entre conexões reais. O combate básico foi confirmado por Lucas; as interfaces novas e o percurso completo ainda precisam desse ensaio.
