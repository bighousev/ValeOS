# Estado da implementação

Referência: [PRD v1.0](ValeOS_PRD_v1.0.md). Este registro distingue código disponível de funcionalidade homologada.

| Incremento | Implementado no repositório | Pendente para aceite |
|---|---|---|
| 0 — Fundação | Next.js + TypeScript, autenticação SSR, convites, RLS e migration, Docker, proxy de exemplo, CI | Criar Supabase, aplicar migration, configurar ambiente, testar login, backup e restauração, implantar na VPS |
| 1 — Comercial | Entrada manual e webhook HMAC/idempotente, sugestão de duplicata, interação, pipeline com histórico e conversão para cliente, ficha 360° | Testar F01/CA-01 a CA-04 com banco real; aprimorar busca, filtros e paginação |
| 2 — Entrega | Projetos, fases, tarefas, dependências, bloqueio de conclusão, entregáveis, aprovações interna/externa e revisão versionada | Testar F02/CA-05 a CA-10 com banco real; validar migrações e permissões via APIs diretas |
| 3 — Operação | Reuniões, encaminhamentos, conversão para tarefa, central de notificações, job diário e Google Calendar somente leitura | Configurar credencial dedicada, job na VPS; testar F03/CA-11, CA-12, CA-16 e CA-17 |
| 4 — Gestão | Dashboard semanal, comparação anterior, metas gerais e CSS responsivo | Validar números, fuso, dados grandes, acessibilidade móvel, desempenho e CA-13 a CA-18 |

O build e os testes unitários locais passam. A migration ainda não foi executada em uma instância Supabase e não há evidência de homologação ponta a ponta. Não implantar em produção até concluir o gate da seção 13 do PRD.

## Pontos de atenção antes do lançamento

- Confirmar no Supabase que cadastro público está desabilitado e testar RLS com contas de colaborador, administrador e conta sem perfil.
- Verificar convite e recuperação de senha com templates de e-mail SSR.
- Testar os fluxos SQL transacionais, especialmente HMAC/idempotência, dependências e aprovações.
- Testar cópia e restauração de backup no plano Supabase contratado; definir RPO/RTO com base no ensaio.
- Configurar limites de requisição no proxy e monitorar erros sem registrar tokens ou dados pessoais em logs.
- Validar layout e teclado em navegador desktop e celular reais.
- Definir retenção e exclusão dos dados pessoais antes de uso de produção; validar a exportação administrativa com banco real.
