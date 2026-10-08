# Instalação pela interface do Foundry

Este projeto é um **sistema de jogo**. Seu manifesto é `system.json`. É possível instalá-lo pela tela de configuração do Foundry, sem acesso aos arquivos do servidor.

## Preparação da distribuição

O servidor precisa conseguir baixar o JSON e o ZIP por HTTPS, sem depender da sessão do navegador ou do acesso do desenvolvedor ao GitHub. Um arquivo local, um artefato privado do Actions ou uma release privada/em rascunho não atendem a essa condição. Não coloque tokens no manifesto.

O proprietário autorizou a distribuição e tornou o repositório público. O manifesto está em:

```text
https://github.com/LucasSantiago257/gods-battle-ss-foundry/releases/latest/download/system.json
```

`python tools/package.py --release` gera `dist/system.json` e o ZIP com URLs de uma release no repositório atual. Isso **prepara**, mas não publica a distribuição. O manifesto dentro do ZIP é igual ao arquivo externo. Antes da publicação, os links gerados ainda não funcionam para instalação.

O workflow **Publicar sistema para instalação por manifesto** verifica o projeto e publica o manifesto e o ZIP. Ele roda quando `system.json` é alterado em `main`, ou quando é acionado manualmente em `main`. Uma versão já existente não será sobrescrita. Para atualizar, incremente `version` e ajuste o endereço `download` em `system.json`; integrar essa mudança em `main` publicará a nova versão após os testes passarem.

Outra hospedagem pode ser usada com:

```sh
python tools/package.py --manifest-url https://HOST/system.json --download-url https://HOST/gods-battle-ss-0.1.1.zip
```

Substitua `HOST` pelo endereço real e publique os dois arquivos juntos. O endereço do manifesto deve permanecer estável entre versões.

## Instalar e testar

Depois de publicados, abra o link do manifesto e o link de download em uma janela sem login. Ambos devem responder: o primeiro com JSON, o segundo com o ZIP. O servidor também precisa ter acesso de rede a essa hospedagem.

1. Na configuração do Foundry, abra **Sistemas de Jogo → Instalar Sistema**.
2. Cole a **URL HTTPS do arquivo `system.json`** no campo **URL do Manifesto** e clique em **Instalar**.
3. Crie um mundo de teste com **Saint Seiya — A Batalha dos Deuses** e inicie esse mundo.
4. Crie um cavaleiro e siga o [roteiro de validação](validacao-foundry.md).

A instalação por manifesto resolve a entrega do pacote. A validação das fichas acontece dentro desse mundo e continua necessária; a versão ainda não declara `compatibility.verified`.

Referência: [desenvolvimento de sistemas no Foundry](https://foundryvtt.com/article/system-development/).
