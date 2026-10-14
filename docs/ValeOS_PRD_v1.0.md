# ValeOS — Product Requirements Document (PRD)

**Versão:** 1.0 · **Data:** 14 de outubro de 2026  
**Status:** baseline aprovada para iniciar implementação; hipóteses revisáveis  
**Produto:** plataforma interna de CRM, clientes, projetos, reuniões e indicadores  
**Público inicial:** 2–5 colaboradores de uma empresa de software, tecnologia e automação  
**Responsável pelo produto:** equipe proprietária do ValeOS

> **Decisão de produto:** este documento encerra o levantamento inicial sem novas perguntas. Escolhas não respondidas foram resolvidas por premissas explícitas, passíveis de revisão por controle de mudanças.

## 1. Resumo executivo

O ValeOS é um sistema web responsivo para centralizar a operação de uma pequena empresa de serviços de tecnologia e automação. O MVP conecta captação automatizada de leads, pipeline comercial simplificado, cadastro 360° de clientes, execução de projetos, aprovações internas/externas, reuniões e um dashboard de acompanhamento.

O **fluxo norteador** é: lead entra por formulário ou webhook → aparece no pipeline → o time registra contatos e resultado comercial → o cadastro vira cliente quando aplicável → o time cria manualmente um projeto vinculado → executa tarefas com dependências e aprova entregáveis → acompanha pendências e resultados no dashboard.

O ValeOS **não** será um ERP financeiro, um mensageiro de WhatsApp ou uma ferramenta de automação nativa. Ele coordenará operações e integrará sistemas existentes por meios oficiais e controlados.

### 1.1 Objetivos e resultados esperados

1. Reduzir a dispersão de informações sobre leads, clientes, propostas, projetos e decisões.
2. Garantir responsáveis, estados e prazos visíveis para oportunidades, tarefas e encaminhamentos.
3. Tornar rastreável a passagem de uma oportunidade comercial à execução e à aprovação de entregas.
4. Preparar reuniões semanais a partir de indicadores calculados automaticamente.
5. Manter um escopo implementável por desenvolvimento assistido por IA, com testes verificáveis.

### 1.2 Indicadores de sucesso do lançamento (metas internas propostas)

- 100% dos leads de teste recebidos por webhook válido cadastrados ou identificados como duplicatas sem perder histórico.
- 100% dos cenários críticos de jornada ponta a ponta aprovados em homologação.
- Toda tarefa de projeto possui projeto, status e responsável; toda aprovação preserva evidência de decisão.
- Dados comerciais, operacionais e de reuniões aparecem no dashboard sem digitação duplicada.
- Equipe consegue completar os principais fluxos em navegador desktop e celular.

## 2. Decisões consolidadas e premissas

| Domínio | Decisão de implementação no MVP |
|---|---|
| Plataforma | Aplicação web responsiva, visual corporativo e analítico, idioma pt-BR. |
| Acesso | Usuários internos autenticados; mesmos direitos operacionais, com administração técnica restrita. |
| Comercial | Pipeline: Novo lead → Em contato → Proposta → Ganho/Perdido. |
| Captação | Formulários, integrações n8n e webhooks autenticados. WhatsApp poderá ser informado como origem por integração externa autorizada. |
| WhatsApp | Abrir chat via link e registrar interação manual; sem sincronizar conversas. |
| Clientes | Empresa/organização com vários contatos, oportunidades, contratos, serviços e projetos. |
| Projetos | Criados manualmente; fases configuráveis, tarefas, dependências e entregáveis. |
| Tarefas | Exclusivamente vinculadas a projetos. Reuniões gerais criam encaminhamentos, não tarefas avulsas. |
| Aprovações | Aprovação interna antes da externa; cliente responde via link seguro e limitado. |
| Reuniões | Agenda própria, participantes, pauta, ata, decisões, encaminhamentos e vínculo opcional a projeto/cliente. |
| Google Calendar | Visualização somente leitura de um calendário compartilhado conectado. Sem alterar eventos pelo ValeOS. |
| Documentos | Referências externas por URL; sem armazenamento de arquivos. |
| Dashboard | Últimos 7 dias completos no fuso configurado, comparados aos 7 dias anteriores; metas gerais manuais. |
| Alertas | Somente central interna; novos leads, atrasos, prazos próximos, aprovações e reuniões. |
| Stack | Next.js + TypeScript na VPS; Supabase gerenciado (PostgreSQL, Auth); APIs no servidor. |
| Implantação | Docker/serviço gerenciado na VPS, proxy reverso, HTTPS, ambientes separados. |

**Premissas definidas sem nova consulta:** o cadastro mínimo de lead é nome + ao menos um contato + origem; empresa é opcional na entrada. Metas são gerais, por semana ou mês. O progresso de projetos considera a proporção de tarefas concluídas; projetos sem tarefas têm 0%. A moeda padrão de oportunidades é BRL. O fuso padrão é America/Sao_Paulo e pode ser ajustado em configuração técnica. Aprovação externa por link não representa assinatura eletrônica qualificada.

## 3. Usuários, permissões e limites de acesso

**Colaborador interno:** pode visualizar, cadastrar e editar leads, clientes, oportunidades, projetos, tarefas, reuniões, metas e registros operacionais, incluindo aprovações internas. Deve estar autenticado.

**Administrador técnico:** além do acesso operacional, gerencia convites, configurações de integração, credenciais, ambientes, retenção e exclusão permanente. Trata-se de proteção de infraestrutura, não de hierarquia comercial.

**Aprovador externo:** não possui usuário interno; acessa apenas uma solicitação específica por URL temporária, válida e revogável. Pode aprovar ou solicitar ajustes e informar seu nome. Não pode navegar pela plataforma.

**Segurança aplicável:** autorização validada no servidor e no banco, mesmo que os colaboradores compartilhem permissões operacionais. Exclusão operacional será lógica/arquivamento; eventos críticos permanecem auditáveis. Nenhuma chave privilegiada poderá aparecer no navegador.

## 4. Escopo priorizado

### 4.1 P0 — Obrigatório para o MVP

- Autenticação, convites internos, sessão, proteção de rotas, trilha de auditoria essencial.
- CRM com entrada automatizada e manual, prevenção de duplicatas, lista, filtros, histórico e pipeline simplificado.
- Cliente 360° com empresa, contatos, serviços, contratos por metadados e links, oportunidades e projetos.
- Projetos manuais, fases, tarefas, dependências, responsáveis, datas, entregáveis e status.
- Aprovação interna e aprovação externa por link seguro, incluindo pedido de ajuste.
- Reuniões com pautas, atas, decisões, encaminhamentos e geração de tarefa apenas em projeto.
- Dashboard com indicadores comerciais, operacionais e metas manuais.
- Central de notificações no aplicativo e regras automáticas de disparo.
- Links para WhatsApp; Google Calendar compartilhado em leitura (credenciamento separado).
- Segurança, logs, procedimentos de backup, observabilidade e responsividade.

### 4.2 P1 — Após estabilizar o MVP

Templates de projetos; importação assistida CSV/Google Sheets; indicadores personalizados; filtros e metas por pessoa; visualização Gantt; dashboards configuráveis; histórico detalhado de versões; calendário individual por usuário; exportação avançada; automações mais elaboradas.

### 4.3 Fora do MVP

Inbox de WhatsApp e envio automatizado de mensagens; sincronização completa com e-mail; geração automática de propostas e contratos; assinatura eletrônica juridicamente robusta; faturamento, notas fiscais, contabilidade e cobrança; aplicativo móvel nativo; controle de horas e custos financeiros detalhados; recursos de IA autônoma para prospectar ou decidir; portal completo do cliente; sincronização bidirecional do Google Calendar.

## 5. Fluxos principais de ponta a ponta

**F01 — Lead até ganho:** webhook autenticado recebe lead → valida e procura duplicidade → cria/atualiza registro sem duplicar evento → cria oportunidade padrão em “Novo lead” → colaborador registra interação → move para “Em contato” e “Proposta” → marca “Ganho” com valor e data → registra organização como cliente sem duplicar organização.

**F02 — Projeto até entrega:** colaborador cria projeto manualmente, relaciona cliente e, opcionalmente, oportunidade ganha → organiza fases e tarefas → define dependências e prazos → entrega gera solicitação de aprovação interna → após aprovação interna, link externo é disponibilizado → cliente aprova ou solicita ajustes → revisão e nova rodada de aprovação, se necessário → projeto é concluído quando regras forem satisfeitas.

**F03 — Reunião e encaminhamento:** criar reunião com pauta e participantes → registrar ata e decisões → se relacionada a projeto, criar tarefas nesse projeto; caso contrário, criar encaminhamentos próprios da reunião → atribuir responsáveis e prazos → acompanhar pendências no módulo de reuniões e no dashboard.

**F04 — Acompanhamento semanal:** dashboard calcula eventos nos 7 dias completos anteriores à data atual e comparação histórica → lista atrasos, aprovações e reuniões → equipe revisa números → realiza reunião semanal → registra decisões e encaminhamentos.

## 6. Requisitos funcionais detalhados

### 6.1 RF-01 — Autenticação e configuração interna (P0)

- Login por e-mail e senha através de provedor de autenticação; recuperação de acesso; convites aprovados.
- Apenas domínios/contas convidados podem acessar. Bloquear cadastros públicos.
- Sessões e proteção contra abuso; logout; mensagens de erro sem vazar detalhes internos.
- Administração técnica separada para credenciais, integrações, usuários e dados sensíveis.
- Nome, avatar opcional, fuso global e configurações iniciais da empresa.

**Aceite:** usuário não autenticado não consegue abrir nem consultar APIs internas; usuário comum não visualiza segredos nem executa funções técnicas.

### 6.2 RF-02 — Captação de leads e CRM (P0)

**Campos do lead:** ID; nome; e-mail e/ou telefone (ao menos um); empresa opcional; origem; interesse/descrição; responsável opcional; data de criação; atualização; consentimento/base legal quando aplicável; status; marcador de possível duplicidade.

**Canais:** cadastro manual; endpoint de formulário; webhook genérico para n8n; fonte WhatsApp somente via integração explicitamente configurada ou origem declarada. Não ler automaticamente mensagens do WhatsApp sem integração autorizada.

**Webhook:** autenticação por segredo/HMAC ou equivalente; HTTPS; chave de idempotência; proteção de replay, limite de requisições, logs sem dados sensíveis; validação de payload; resposta com ID e resultado criado/duplicado/erro. Falhas tratadas com segurança para permitir nova tentativa.

**Duplicatas:** comparação por e-mail normalizado e telefone normalizado, com verificação contextual. Se o evento de origem for idêntico, ignorar repetição; se os dados sugerirem a mesma pessoa, sinalizar para revisão sem mesclar registros automaticamente.

**Interações:** data/hora, tipo (WhatsApp, ligação, e-mail, reunião, nota), colaborador, resumo e próxima ação opcional. Botão “Abrir WhatsApp” gera link usando telefone válido, sem armazenar conversas externas.

**Aceite:** dois eventos com mesma chave de idempotência geram apenas um lead/evento lógico; um evento inválido não cria registro parcial.

### 6.3 RF-03 — Pipeline comercial (P0)

- Etapas exatas: **Novo lead**, **Em contato**, **Proposta**, **Ganho**, **Perdido**.
- Visual Kanban e lista; mover por arrastar ou seletor acessível; filtros por responsável, origem e período.
- Oportunidade padrão criada ao cadastrar lead novo; a organização pode ter outras oportunidades posteriores, sem gerar novo cliente.
- Campos: título, contato, organização, estágio, valor estimado em BRL, responsável, previsão de fechamento, data de ganho/perda, motivo de perda quando aplicável.
- Mudanças de estágio registram usuário, data/hora, estágio anterior e novo; não apagar histórico.
- Ao marcar como ganho, confirmar valor e vincular à organização; oferecer link para “Criar projeto” manualmente, sem criação automática.
- Não calcular comissão nem forecast probabilístico no MVP.

**Aceite:** valor ganho é contabilizado só uma vez, pela data do evento de transição para “Ganho”; reabertura exige evento de auditoria e reprocessamento correto das métricas.

### 6.4 RF-04 — Clientes 360° (P0)

- Uma organização pode ter vários contatos, oportunidades, contratos, serviços e projetos.
- Ficha com abas: Visão geral, Contatos, Histórico, Oportunidades, Projetos, Serviços/Contratos e Links.
- Cadastro de empresa: nome, CNPJ opcional, segmento opcional, site, status de relacionamento, contatos, descrição e tags.
- Contratos: título, situação, vigência, valor de referência opcional, URL do documento; não haverá assinatura ou upload interno.
- Serviços: descrição, início, status, valor de referência opcional e ligação com projeto.
- Histórico unificado de atividades relevantes, com origem e data.
- Organizações duplicadas podem ser sinalizadas e mescladas apenas por fluxo administrativo auditado.

**Aceite:** alterações em oportunidade ou projeto relacionado aparecem na ficha da organização; não é necessário cadastrar a mesma empresa novamente.

### 6.5 RF-05 — Projetos, fases e tarefas (P0)

- Projeto criado manualmente: cliente obrigatório, nome, descrição, responsável, colaboradores, data inicial, prazo final, prioridade, situação e oportunidade opcional.
- Status do projeto: **Planejado, Em andamento, Pausado, Em aprovação, Concluído, Cancelado**.
- Fases com nome, ordem, descrição, datas opcionais e status; personalizáveis em cada projeto.
- Tarefa obrigatoriamente vinculada a projeto e fase; campos: título, descrição, responsável, prioridade, início opcional, prazo, status, conclusão e links.
- Status da tarefa: **A fazer, Em andamento, Bloqueada, Concluída, Cancelada**.
- Dependência termina-para-começar no MVP: uma tarefa só pode ser concluída se predecessoras obrigatórias estiverem concluídas. Proibir dependências circulares e entre projetos diferentes.
- Tarefa bloqueada por dependência não pode ser concluída; alteração excepcional requer remoção da dependência com auditoria.
- Progresso do projeto = tarefas concluídas / (tarefas totais - canceladas) × 100; sem tarefas elegíveis, 0%. Mostrar separadamente “aguardando aprovação” para não confundir 100% de tarefas com projeto entregue.
- Conclusão do projeto requer tarefas elegíveis concluídas, entregáveis obrigatórios aprovados e ausência de aprovação pendente; administrador técnico não tem atalho silencioso.

**Aceite:** ciclo de dependências rejeitado; não é possível concluir projeto com entregável obrigatório aguardando aprovação.

### 6.6 RF-06 — Entregáveis e dupla aprovação (P0)

- Cada entregável possui título, descrição, projeto/fase, URL externa, responsável, versão e status.
- Etapa 1: solicitação interna. Qualquer colaborador pode solicitar; outro colaborador interno, distinto do solicitante quando possível, registra aprovação ou pedido de ajuste.
- Etapa 2: após aprovação interna, gerar link externo individual, com token aleatório forte armazenado apenas como hash, escopo restrito, expiração padrão em 7 dias, possibilidade de revogação e limite contra tentativas abusivas.
- A tela externa mostra somente informações indispensáveis do entregável; o cliente informa nome e escolhe **Aprovar** ou **Solicitar ajustes**. Comentário obrigatório para ajustes.
- Registrar resultado, horário, versão, identificador da solicitação e evidências técnicas minimizadas. Nome fornecido é declaratório; o link sozinho não equivale a autenticação forte nem a assinatura legal.
- Solicitar ajustes reabre o entregável em revisão; uma nova versão invalida aprovações anteriores daquela versão e exige reapresentação interna antes de novo link externo.
- A interface interna permite copiar o link e compartilhá-lo manualmente, por exemplo via WhatsApp. Envio automatizado fica fora do MVP.

**Aceite:** URL expirada, revogada ou já finalizada não aceita nova decisão; solicitante externo não consegue abrir outra aprovação; uma nova versão não herda autorização da anterior.

### 6.7 RF-07 — Reuniões e encaminhamentos (P0)

- Reunião com título, data/hora, participantes internos e externos como texto/contatos, tipo, cliente/projeto opcional, pauta, ata, decisões e status **Agendada, Realizada, Cancelada**.
- Encaminhamento de reunião: descrição, responsável, prazo, status **Pendente/Concluído/Cancelado**, sem vínculo obrigatório a projeto.
- Se reunião estiver vinculada a projeto, opção explícita de criar tarefa dentro do projeto; evitar criar automaticamente tarefa e encaminhamento duplicados.
- Reuniões gerais não criam tarefas de projeto sem projeto selecionado.
- Visualizar agenda e pendências; reuniões realizadas alimentam dashboard com base no momento em que ocorreram.
- Integrar, por credencial dedicada, um calendário compartilhado do Google em modo leitura; eventos externos são apresentados separadamente dos registros próprios. Não modificar eventos no Google nem transformar eventos em reuniões automaticamente.

**Aceite:** encaminhamento não aparece como tarefa de projeto; ao transformar encaminhamento em tarefa vinculada, o sistema preserva referência e evita dupla contagem.

### 6.8 RF-08 — Dashboard e metas (P0)

- Tela principal com KPIs, tendências de comparação, lista de projetos críticos, aprovações pendentes, atividades recentes, próximas reuniões e metas.
- Janela inicial: últimos 7 dias completos no fuso configurado (exclui o dia em andamento); comparar com os 7 dias completos imediatamente anteriores.
- Indicadores de evento usam data do evento; indicadores de estoque representam o estado no instante da consulta, sem falsa comparação temporal.
- Metas gerais inseridas manualmente: indicador alvo, valor, periodicidade semanal ou mensal, início e fim. Exibir realizado/planejado e percentual; quando a meta não existir, mostrar “Meta não cadastrada”.
- Dashboard baseado nas tabelas operacionais e eventos auditáveis; nunca exigir duplicação manual dos números.

**Aceite:** mudança de estágio e conclusão de tarefa refletem nos KPIs após atualização normal; comparação semanal usa exatamente os dois períodos definidos, sem misturar dados do dia atual.

### 6.9 RF-09 — Central de notificações (P0)

- Notificações internas com categoria, mensagem, link de destino, responsável, data, estado lida/não lida e chave anti-duplicação.
- Disparos: **novo lead atribuído**; **tarefa vencida**; **projeto com prazo em até 3 dias corridos**; **aprovação pendente há 48 horas**; **reunião em até 24 horas**.
- Rotina de avaliação periódica, no mínimo diária para vencimentos; eventos imediatos para novos leads. Evitar notificações repetidas para o mesmo objeto e condição enquanto o evento estiver aberto.
- Destinatário: responsáveis quando existentes; leads sem responsável e alertas gerais ficam visíveis na central para todos os colaboradores.
- Sem envio por push, WhatsApp ou e-mail no MVP.

**Aceite:** atualizar uma notificação para “lida” não apaga a condição operacional; remover a condição encerra novos alertas daquela ocorrência.

### 6.10 RF-10 — Busca, filtros e links (P0)

- Busca por organização, nome de contato, lead, oportunidade ou projeto; filtros básicos por status, responsável, data e prioridade.
- Paginação ou carregamento progressivo para listas maiores.
- Links externos têm rótulo, URL validada, categoria e origem; abrir em nova aba com proteções apropriadas. Não incorporar arquivos externos em páginas públicas de aprovação sem autorização específica.

## 7. Modelo de dados lógico

**Entidades principais (nomes sugeridos):**

| Entidade | Campos/relacionamentos centrais |
|---|---|
| `users` / `profiles` | ID de autenticação, nome, e-mail, status e perfil técnico. |
| `organizations` | Empresa, identificação opcional, segmento, cliente ativo, dados básicos. |
| `contacts` | Organização opcional, nome, e-mail, telefone, papel. |
| `leads` | Contato, origem, descrição, responsável, chave da origem, duplicidade. |
| `opportunities` | Organização/contato/lead, estágio, valor, previsão, ganho/perda e responsável. |
| `interactions` | Alvo relacionado, tipo, resumo, autor, quando, próxima ação. |
| `opportunity_stage_events` | Histórico de transições, data e autor. |
| `projects` | Organização, oportunidade opcional, datas, status, responsável. |
| `project_phases` | Projeto, ordem, nome, situação e datas. |
| `project_tasks` | Projeto, fase, responsável, prazo, estado, conclusão. |
| `task_dependencies` | Par predecessor/sucessor do mesmo projeto; integridade sem ciclos. |
| `deliverables` | Projeto/fase, link, versão, status e obrigatoriedade. |
| `approval_requests` | Entregável/versão, tipo interno/externo, token hash, expiração e status. |
| `approval_decisions` | Solicitação, decisão, ator declarado/interno, data, comentário. |
| `meetings` | Título, início, fim, status, cliente/projeto opcional, pauta e ata. |
| `meeting_actions` | Reunião, responsável, prazo, status e tarefa vinculada opcional. |
| `notifications` | Tipo, destinatário ou escopo, objeto, deduplicação, lida. |
| `goals` | Indicador, periodicidade, intervalo, alvo numérico. |
| `external_links` | Objeto relacionado, URL, rótulo, categoria. |
| `webhook_events` | Fonte, idempotência, recebido em, resultado, ID lógico e erro sanitizado. |
| `audit_logs` | Autor, objeto, ação, antes/depois filtrados, timestamp. |
| `integration_settings` | Provedor, configuração pública, referência segura à credencial, status. |

**Regras estruturais:** UUID como identificador; timestamps UTC armazenados e exibidos no fuso configurado; índices em relacionamentos, estado e datas usadas no dashboard; unicidade de chave de idempotência por fonte; políticas RLS e verificações de autorização; soft delete onde permitido; segredos armazenados fora de colunas acessíveis ao cliente.

**Relações:** organização 1:N contatos, oportunidades e projetos; oportunidade N:1 organização; projeto 1:N fases/tarefas/entregáveis/reuniões; tarefa N:N tarefas via dependência; entregável 1:N solicitações; reunião 1:N encaminhamentos; oportunidade 1:N eventos de etapa.

## 8. Regras de indicadores e fórmulas

| KPI | Fórmula / referência temporal |
|---|---|
| Leads novos | Contagem de `leads.created_at` na janela de 7 dias completos. |
| Oportunidades ganhas | Contagem dos eventos de entrada no estágio Ganho na janela, considerando reversões conforme log. |
| Valor comercial ganho | Soma do valor confirmado associado às oportunidades ganhas na janela, sem dupla contagem em reaberturas. |
| Taxa de fechamento (opcional no resumo) | Ganhas ÷ (ganhas + perdidas) no período, por eventos de encerramento válidos; se denominador zero, “—”. |
| Tarefas concluídas | Contagem por `completed_at` na janela, desconsiderando tarefas canceladas. |
| Projetos em andamento | Contagem atual de projetos nesse status. |
| Projetos atrasados | Contagem atual de projetos não concluídos/cancelados com prazo anterior à data local atual. |
| Aprovações pendentes | Contagem atual de solicitações ainda válidas e sem decisão, incluindo diferenciação entre internas e externas. |
| Reuniões realizadas | Reuniões com status Realizada e início dentro da janela. |
| Pendências de reuniões | Encaminhamentos atualmente pendentes, com subcontagem de vencidos. |
| Meta atingida (%) | Realizado no período correspondente ÷ meta × 100; sem meta ou meta zero, mostrar “—”. |

**Cuidado metodológico:** “últimos 7 dias” não significa mês atual ou últimos 7 × 24 horas contando o momento presente. Indicadores de estoque (“agora”) devem receber a legenda “situação atual”, sem variação histórica inventada. O valor monetário é somente comercial estimado/ganho, não receita reconhecida nem caixa recebido.

## 9. Navegação e experiência de uso

**Menu lateral desktop:** Dashboard; Prospecção; Pipeline; Clientes; Projetos; Reuniões; Notificações; Configurações. Em celular, menu recolhível, filtros acessíveis e tabelas responsivas.

**Padrão visual:** fundo neutro, tipografia legível, contraste adequado, cards de KPI, gráficos simples, tabelas e estados de status consistentes. Priorizar densidade de informação sem sacrificar usabilidade. Interface em pt-BR, moeda BRL, datas locais.

**Telas essenciais:** login/convite; dashboard; lista e detalhe de leads; Kanban e detalhe de oportunidade; lista e ficha 360° do cliente; lista e detalhe de projeto (fases, tarefas, entregáveis); aprovação interna; página pública de aprovação; lista e detalhe de reunião; central de alertas; integrações técnicas.

**Ações rápidas:** cadastrar lead, mover oportunidade, adicionar interação, criar projeto, criar tarefa, registrar ata, copiar link de aprovação. Erros exibem orientação clara e preservam dados preenchidos.

## 10. APIs e integrações previstas

**Endpoints conceituais** (podem mudar conforme implementação):

- `POST /api/integrations/leads` — entrada segura de leads de formulários/n8n.
- `GET /api/leads`, `POST /api/leads`, `PATCH /api/leads/{id}` — CRUD autenticado.
- `PATCH /api/opportunities/{id}/stage` — transição com evento auditável.
- `GET /api/organizations/{id}/overview` — visão 360°.
- `POST /api/projects`, `PATCH /api/tasks/{id}` — criação e atualização com validação.
- `POST /api/deliverables/{id}/request-internal-approval` — iniciar aprovação.
- `POST /api/approval-links/{id}/decision` — resposta externa com token, limites e controle de uso.
- `GET /api/dashboard/summary` — agregação no servidor.
- `GET /api/calendar/events` — leitura de calendário conectado.

**Exemplo de payload de captação** (campos opcionais conforme disponibilidade):

```json
{
  "source": "site-form",
  "external_event_id": "evento-exemplo-123",
  "name": "Contato de exemplo",
  "email": "contato@exemplo.com",
  "phone": "+5511999999999",
  "company": "Empresa Exemplo",
  "interest": "Automação de processos"
}
```

A autorização do webhook é independente da sessão do navegador. Nunca expor tokens de integração ou chaves privilegiadas no frontend. Para eventos do Google Calendar, usar permissões somente leitura e armazenar credenciais de forma protegida.

## 11. Requisitos não funcionais e segurança

- **RNF-01 Disponibilidade:** objetivo interno inicial de 99% mensal, excluindo manutenção anunciada; monitorar indisponibilidades.
- **RNF-02 Desempenho:** meta de p95 inferior a 3 segundos para telas usuais na base inicial (até 5 usuários e alguns milhares de registros), medida em ambiente de homologação e produção.
- **RNF-03 Acessibilidade:** contraste, navegação por teclado, rótulos e feedback textual; não depender exclusivamente de arrastar no Kanban.
- **RNF-04 Segurança:** TLS/HTTPS, reverse proxy, atualizações, rate limiting, autenticação, autorização server-side/RLS, proteção de segredos, validação de entrada e prevenção de acessos cruzados.
- **RNF-05 Dados pessoais:** coletar o mínimo necessário, documentar finalidades e base legal quando aplicável, definir retenção e atender solicitações conforme obrigações legais e contratos. Não registrar conteúdo integral de conversas sem necessidade.
- **RNF-06 Backup e recuperação:** habilitar política de backup compatível com o plano contratado, realizar cópia lógica criptografada quando necessário, definir retenção e testar restauração antes da implantação; definir RPO/RTO após ensaio de recuperação.
- **RNF-07 Auditoria:** trilha para mudanças de etapa, alterações em tarefas críticas, aprovações, exclusões e configurações técnicas. Logs de aplicação não devem armazenar tokens ou conteúdo pessoal desnecessário.
- **RNF-08 Ambientes:** desenvolvimento, homologação e produção separados; variáveis de ambiente e credenciais isoladas; migrations versionadas.
- **RNF-09 Exportação:** exportação administrativa mínima dos dados principais em formato estruturado para portabilidade e recuperação, sem acesso externo público.

**Referência jurídica/operacional:** observar LGPD e orientações oficiais da ANPD para agentes de tratamento de pequeno porte. O PRD não substitui revisão jurídica sobre contratos, bases legais e períodos de retenção.

## 12. Arquitetura e implantação propostas

**Frontend e backend:** Next.js + TypeScript, interface responsiva, rotas de servidor para validações e chamadas externas. Separar camada de apresentação, regras de negócio, serviços externos e repositórios.

**Dados e autenticação:** Supabase gerenciado com PostgreSQL, autenticação e RLS. Credenciais privilegiadas usadas exclusivamente no lado servidor. Não fazer consultas que contornem regras de autorização sem necessidade explícita.

**Hospedagem:** VPS própria para Next.js em contêiner/processo gerenciado; proxy reverso (por exemplo, Nginx), certificado HTTPS, firewall, monitoramento e política de atualização. Banco e autenticação continuam gerenciados no Supabase. Esta divisão atende à preferência pela VPS sem assumir self-hosting integral da plataforma de dados.

**Rotinas agendadas:** job no servidor para alertas, expiração e reconciliações; criação idempotente de notificações.

**Calendário:** conexão autorizada a um calendário compartilhado, leitura de eventos por API, falha de integração isolada do restante do sistema e opção de desconectar. Reuniões próprias não dependem da API para funcionar.

**Observabilidade:** monitorar erros, jobs, integração de webhooks, filas de falha, saúde da aplicação e disponibilidade. Criar procedimento de rollback para implantações.

## 13. Critérios de aceitação verificáveis

| ID | Cenário | Resultado esperado |
|---|---|---|
| CA-01 | Enviar evento webhook válido duas vezes com mesmo identificador. | Apenas um registro lógico; ambas as tentativas rastreadas. |
| CA-02 | Enviar lead sem e-mail nem telefone. | Rejeição validada, sem cadastro parcial. |
| CA-03 | Mover oportunidade para Ganho. | Histórico salvo, valor confirmado e KPI atualizado. |
| CA-04 | Criar segundo projeto para cliente existente. | Mesmo cadastro 360°, dois projetos relacionados. |
| CA-05 | Criar dependência circular A→B→A. | Operação rejeitada com explicação. |
| CA-06 | Concluir tarefa dependente de predecessor pendente. | Conclusão bloqueada pelo servidor. |
| CA-07 | Solicitar aprovação externa antes da interna. | Link não emitido. |
| CA-08 | Cliente responde link válido. | Decisão registrada; token inutilizado para outra decisão. |
| CA-09 | Cliente tenta usar link expirado/revogado. | Acesso de decisão negado, sem revelar outros dados. |
| CA-10 | Solicitar ajustes e publicar nova versão. | Aprovações anteriores não validam nova versão. |
| CA-11 | Registrar ação de reunião geral. | Aparece em pendências da reunião, não em tarefas de projeto. |
| CA-12 | Criar tarefa a partir de reunião vinculada a projeto. | Tarefa aparece no projeto correto e mantém referência de origem. |
| CA-13 | Configurar dados distribuídos em datas de 3 semanas. | Dashboard usa últimos 7 dias completos e compara com 7 anteriores. |
| CA-14 | Usuário não autenticado abre endpoint interno. | Solicitação negada independentemente da interface. |
| CA-15 | Colaborador tenta acessar segredos técnicos. | Acesso negado; operação protegida e auditada. |
| CA-16 | Falha a API do Google Calendar. | ValeOS permanece utilizável e informa indisponibilidade parcial. |
| CA-17 | Gerar notificação diária pela mesma condição aberta. | Não duplicar notificações para a mesma ocorrência. |
| CA-18 | Abrir app em navegador móvel. | Funcionalidades críticas acessíveis sem transbordamento ou recurso exclusivo de desktop. |

**Gate de lançamento:** todos os CA P0 aprovados; backup/restauração testados; revisão básica de segurança e teste de ponta a ponta realizados com usuários da empresa.

## 14. Backlog e plano de execução

O plano abaixo é uma **ordem de implementação**, não uma promessa de calendário. A próxima fase só avança depois de entregar e testar a anterior.

| Incremento | Entrega vertical | Demonstração de pronto |
|---|---|---|
| 0 — Fundação | Repositório, padrões de código, Supabase, autenticação, banco, RLS, VPS/homologação, CI e backups. | Login seguro, migrations, implantação de teste e restore validado. |
| 1 — Comercial | Leads manuais/webhooks, deduplicação, histórico, pipeline e cliente 360° básico. | Lead externo entra, é movimentado, ganho e relacionado a cliente sem duplicar. |
| 2 — Entrega | Projetos, fases, tarefas, dependências, entregáveis e aprovação interna/externa. | Projeto manual completo passa por bloqueios e dupla aprovação. |
| 3 — Operação | Reuniões, encaminhamentos, Google Calendar leitura, alertas internos. | Reunião registra ações, calendário é consultado, alertas acionados. |
| 4 — Gestão e lançamento | Dashboard, metas, UX responsiva, testes, auditoria, documentação de operação. | Jornada ponta a ponta e todos os critérios de aceite aprovados. |

**Definition of Done por funcionalidade:** migration versionada + regras e validações + UI responsiva + autorização + teste unitário/integração pertinente + caso de aceite demonstrável + tratamento de falhas + documentação técnica mínima.

## 15. Riscos, mitigação e decisões de governança

| Risco | Mitigação prevista |
|---|---|
| Escopo grande para 2–5 usuários | Incrementos verticais, backlog P0/P1, bloquear expansão antes da homologação. |
| Webhooks repetidos ou maliciosos | Assinatura, idempotência, limite de tráfego, logs e revisão de duplicidade. |
| Link de aprovação encaminhado | Prazo curto, escopo mínimo, revogação, uso único e registro declaratório; reforçar identidade em entregas críticas. |
| Dados privados em links externos | Mostrar o mínimo no portal externo; links para documentos exigem permissões próprias do provedor. |
| Todos terem acesso operacional igual | Administração técnica segregada; auditoria de mudanças relevantes. |
| Dependências gerarem impasses | Detectar ciclos e exibir bloqueios de modo explícito. |
| Dashboard inconsistente | Usar eventos imutáveis de estágio, datas de ocorrência e testes de limites temporais. |
| VPS indisponível | Monitoramento, rotina de backup, plano de rollback e teste de recuperação. |
| Integração Calendar indisponível | Falha isolada; reuniões internas continuam funcionando. |
| Desenvolvimento com IA gerar regressões | Testes automatizados, code review, migrations controladas e entrega incremental. |

**Gestão de mudanças:** toda alteração após v1.0 deverá registrar número de versão, motivo, impacto em escopo/banco/testes e decisão de priorização. Mudanças sem impacto no MVP podem ir para P1/P2.

## 16. Próximos passos executivos já decididos

1. Congelar a baseline deste PRD como **v1.0**, com decisões assumidas claramente identificadas.
2. Criar repositório, design system mínimo, quadro de backlog e ambientes separados.
3. Desenhar o esquema inicial do banco e suas políticas de acesso antes das telas completas.
4. Implementar autenticação e um fluxo vertical de lead por webhook até cliente convertido.
5. Implementar o fluxo de projeto até dupla aprovação, tratando os bloqueios de dependência.
6. Adicionar reuniões, calendário em leitura e notificações internas.
7. Finalizar dashboard, metas, testes de aceitação, documentação de implantação, segurança e restauração.
8. Homologar com os 2–5 usuários previstos e registrar melhorias como evolução pós-MVP.

**Regra de execução:** nenhuma funcionalidade será considerada entregue apenas porque a interface foi gerada por IA; será necessário validar persistência, autorização, casos-limite e regras de negócio.

## 17. Referências técnicas e regulatórias

1. Next.js — Self-Hosting: https://nextjs.org/docs/app/guides/self-hosting
2. Supabase — Self-Hosting e diferenças de operação: https://supabase.com/docs/guides/self-hosting
3. Google Calendar API — Escopos de autorização de leitura: https://developers.google.com/workspace/calendar/api/auth
4. Google Calendar API — Lista de eventos: https://developers.google.com/workspace/calendar/api/v3/reference/events/list
5. ANPD — Guia de segurança da informação para agentes de pequeno porte: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte

---

**Fim do PRD v1.0 · ValeOS**  
Documento orientador de produto e desenvolvimento. Regras operacionais, prioridades e premissas são revisáveis por versionamento; a implementação deve seguir os critérios de aceitação aqui definidos.
