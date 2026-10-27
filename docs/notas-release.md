# 0.62.0 — Reparo de armaduras por horas informadas

Um conjunto integrado para acompanhar Consertar Armaduras: escolher técnica/armadura, registrar gratuitamente, aplicar uma hora, ajustar PV/custo, desfazer a última parcela intacta, encerrar e consultar histórico. O painel fica em Equipamento → Armadura da ficha que possui a técnica. Sugestão de nível/1CE, máximo derivado, CEextra e excesso explícito; custo0 disponível para pagamento já resolvido manualmente.

O dono atua sobre origem e alvo que pode editar; o mestre coordena automaticamente. Mensagens privadas/discretas, autorização real, cobrança única e journals nos dois Actors protegem interrupções entre pagamento e Item. Recuperação completa somente a parte ausente ou encerra preservando ajustes. Reenvio não repete uma hora nem grava um recibo histórico sobre a ficha atual.

A entrega conserva Atacar/Técnicas, catálogos e condições existentes. Não cria calendário, cura ao importar/ativar, revivificação/evolução ou perda de PVA por ataque comum. [Uso, limites e ensaio](reparo-armaduras.md).

Validação:77testes focados de plano/runtime/transporte/callbacks, suíte Linux/roundtrip/check/pacotes no CI e oito cenários Edge isolados com teclado440px, registro/aplicação/Ajustar/Desfazer reais e privacidade. O ensaio hospedado13.350 e conexões simultâneas continuam separados.
