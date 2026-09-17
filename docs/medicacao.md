# Medicação — Harmonia Care

Abra **Medicação** no menu. O painel usa três visualizações:

- **Administração do dia:** prescrições vigentes, pacientes em ordem alfabética e confirmação individual por prescrição/horário. Verde significa confirmação recebida do banco. Atualização automática a cada minuto enquanto o painel está aberto.
- **Pesquisar tratamentos:** pesquisa por paciente, medicamento/princípio ativo, controle regulatório, classe terapêutica, duração e situação. “Todos os controlados” inclui B1 e C1.
- **Histórico e relatórios:** consulta por qualquer período, incluindo encerrados; PDF e CSV da seleção. O painel por horário usa as mesmas prescrições e os mesmos registros.

O nível 1 pode cadastrar, editar, suspender, retomar e encerrar/arquivar prescrições. Início e fim são obrigatórios nos tratamentos temporários. O fim é inclusivo: a prescrição aparece até esse dia, e depois deixa a rotina diária, sem exclusão do histórico. Dose, via e duração vêm da prescrição individual; não são deduzidas do medicamento.

“Detalhes” mostra princípio ativo, classe, prescrição, cuidados e histórico das alterações. Anulações de registros de administração exigem nível 1 e justificativa; o registro original fica na auditoria. Os registros anteriores à implantação não tinham cópia histórica da dose; os relatórios identificam essa limitação expressamente.

## Classificações e fontes

Referências consultadas em 16/09/2026:

- [Anvisa — lista de substâncias sujeitas a controle especial](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/lista-substancias), atualização RDC 1.036, de 09/07/2026.
- [CMED — lista de medicamentos e princípios ativos](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos), planilha publicada em 09/09/2026.
- [Bulário eletrônico da Anvisa](https://consultas.anvisa.gov.br/#/bulario/).

Quetiapina, trazodona e risperidona constam na lista C1. Alprazolam, clonazepam e zolpidem constam na B1. Marcas foram relacionadas ao princípio ativo pela CMED. As classificações estão em `medicamentos-catalogo.json`, sem dados de pacientes.

“Fora da Portaria 344” não significa venda livre: podem existir outras regras de prescrição/retenção, inclusive para antimicrobianos. Abreviações incompletas, nomes genéricos de apresentações e composições não confirmadas recebem “Conferir identificação”. Não foi atribuída uma composição por suposição.

## Implementação e validação

O endpoint `medicacao_api` valida a conta e o escopo de pacientes a cada chamada. A autenticação automática usa apenas a senha digitada naquele login; sessões restauradas podem pedir confirmação de acesso. A gestão é exclusiva do nível 1. As escritas diretas nas duas tabelas de medicação foram substituídas por operações validadas; os demais módulos mantêm seu fluxo existente.

Novas administrações guardam uma cópia da prescrição e o instante do registro; alterações mantêm versões e auditoria. Há proteção contra edição concorrente e administração repetida. Horários e nomes iguais não juntam prescrições diferentes. Não há exclusão física pela interface.

Fila antiga do dispositivo: preservada para conferência, sem envio automático por rotinas antigas. A opção de exportação permite conciliar pendências com o histórico. O painel novo exige confirmação do banco para considerar uma dose administrada.

Testes: `tests/medicacao-ui.cjs` (JSDOM, jsPDF e AutoTable) e `tests/medicacao-transacional.sql` (fixtures fictícias, transação revertida). Cobrem filtros, datas inclusivas, relatório histórico, isolamento por prescrição, falha de gravação, concorrência, vínculos, autorização, anulação e preservação de dose histórica.
