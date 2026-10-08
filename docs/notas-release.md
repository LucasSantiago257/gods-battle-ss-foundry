Versão **0.3.0** para FoundryVTT 13 build 350: compêndios do livro disponíveis para arrastar à ficha.

- **589 entradas em seis catálogos nativos**: 129 virtudes, 226 habilidades/dádivas, 98 combinações de Cosmo, 88 habilidades de criaturas, 34 poderes/habilidades divinas e 14 Cosmos Divinos.
- Habilidades dos seis estilos até nível 20, especializações adicionais, evoluções de nível 21–30 e habilidades naturais, com pastas de origem e identificação do tipo.
- Descrições, pré-requisitos e páginas; níveis de refino de Cosmo Divino conferidos visualmente. Nomes iguais com regras distintas permanecem separados.
- Atalhos na aba Poderes, importação por drag-and-drop e registro do UUID de origem. Cópias importadas e dados do mundo são preservados ao atualizar os catálogos.
- Bancos LevelDB compilados com a CLI oficial; testes de round-trip, cobertura, campos e proveniência. Handlebars de desenvolvimento atualizado para corrigir vulnerabilidades reportadas pela auditoria.

Mantém fichas e ativação de técnicas da versão 0.2.0. Os bônus das virtudes/habilidades, custos especiais e pré-requisitos são aplicados manualmente. Auras, tabelas de Sentidos e os catálogos de técnicas, Big Bangs, incrementos e artefatos ficam para etapas seguintes. Consulte docs/compendios.md para a cobertura e docs/validacao-foundry.md para verificar a instalação no servidor.

Para atualizar, encerre o mundo, abra **Sistemas de Jogo → Atualizar**, confirme **0.3.0**, inicie o mundo e recarregue a página. Os novos compêndios aparecem na aba Compêndios; a ficha tem atalhos em **Poderes**.

Manifesto de instalação:
https://github.com/LucasSantiago257/gods-battle-ss-foundry/releases/latest/download/system.json
