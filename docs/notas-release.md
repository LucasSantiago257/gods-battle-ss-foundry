Correção 0.1.1 para FoundryVTT 13 build 350: resolve `system.skills ... can't be blank` ao criar cavaleiros. As perícias aceitam explicitamente a opção “Automático”, mantendo a validação de escolhas inválidas e dos campos obrigatórios.

Inclui testes de regressão para dados padrão, retorno à associação automática e campos opcionais de conteúdos. Esses testes usam um contrato local da API; a criação do personagem deve ser confirmada no servidor Foundry.

Para atualizar, encerre o mundo, abra **Sistemas de Jogo** e use **Atualizar** no sistema. Confirme a versão **0.1.1**, inicie o mundo e recarregue a página antes de criar o cavaleiro.

Em desenvolvimento. A execução dentro do Foundry ainda precisa de validação. Consulte o README e o roteiro de testes incluídos no pacote; crie um mundo de teste.

Para instalar, use esta URL em **Sistemas de Jogo → Instalar Sistema → URL do Manifesto**:

https://github.com/LucasSantiago257/gods-battle-ss-foundry/releases/latest/download/system.json
