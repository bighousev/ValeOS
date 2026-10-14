export type DemoStage =
  "Novo lead" | "Em contato" | "Proposta" | "Ganho" | "Perdido";
export type DemoTaskStatus =
  "A fazer" | "Em andamento" | "Concluída" | "Cancelada";
export type DemoDeliverableStatus =
  | "Rascunho"
  | "Em aprovação interna"
  | "Aprovado internamente"
  | "Em aprovação externa"
  | "Aprovado"
  | "Revisão";

export interface DemoLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  interest: string;
  createdAt: string;
  duplicateOf?: string;
  interactions: {
    id: string;
    kind: string;
    summary: string;
    createdAt: string;
  }[];
}
export interface DemoOpportunity {
  id: string;
  leadId: string;
  title: string;
  stage: DemoStage;
  value: number | null;
  clientId?: string;
  createdAt: string;
  events: { stage: DemoStage; at: string }[];
}
export interface DemoClient {
  id: string;
  name: string;
  segment: string;
  contacts: { id: string; name: string; email: string; phone: string }[];
}
export interface DemoTask {
  id: string;
  title: string;
  phase: string;
  status: DemoTaskStatus;
  dueOn: string;
  predecessorIds: string[];
}
export interface DemoDeliverable {
  id: string;
  title: string;
  version: number;
  status: DemoDeliverableStatus;
  requester?: string;
  comment?: string;
  decidedBy?: string;
}
export interface DemoProject {
  id: string;
  clientId: string;
  name: string;
  status:
    | "Planejado"
    | "Em andamento"
    | "Pausado"
    | "Em aprovação"
    | "Concluído"
    | "Cancelado";
  priority: "Baixa" | "Média" | "Alta";
  dueOn: string;
  phases: string[];
  tasks: DemoTask[];
  deliverables: DemoDeliverable[];
}
export interface DemoMeeting {
  id: string;
  title: string;
  startsAt: string;
  projectId?: string;
  status: "Agendada" | "Realizada" | "Cancelada";
  participants: string;
  agenda: string;
  minutes: string;
  decisions: string;
  actions: {
    id: string;
    description: string;
    status: "Pendente" | "Concluído" | "Convertido";
    taskId?: string;
  }[];
}
export interface DemoNotification {
  id: string;
  message: string;
  target: string;
  read: boolean;
}
export interface DemoState {
  version: 1;
  leads: DemoLead[];
  opportunities: DemoOpportunity[];
  clients: DemoClient[];
  projects: DemoProject[];
  meetings: DemoMeeting[];
  notifications: DemoNotification[];
}

export const demoStages: DemoStage[] = [
  "Novo lead",
  "Em contato",
  "Proposta",
  "Ganho",
  "Perdido",
];

export function seedDemoState(): DemoState {
  return {
    version: 1,
    leads: [
      {
        id: "lead-1",
        name: "Marina Costa",
        email: "marina@aurora.exemplo",
        phone: "11988887777",
        company: "Aurora Digital",
        source: "Formulário",
        interest: "Automação de atendimento",
        createdAt: "2026-10-12T13:00:00Z",
        interactions: [
          {
            id: "i-1",
            kind: "Ligação",
            summary: "Alinhamento inicial sobre o projeto.",
            createdAt: "2026-10-13T14:00:00Z",
          },
        ],
      },
      {
        id: "lead-2",
        name: "Rafael Lima",
        email: "rafael@orbit.exemplo",
        phone: "21977776666",
        company: "Orbit Labs",
        source: "Indicação",
        interest: "CRM e integrações",
        createdAt: "2026-10-10T15:00:00Z",
        interactions: [],
      },
      {
        id: "lead-3",
        name: "Bianca Souza",
        email: "bianca@solis.exemplo",
        phone: "31999998888",
        company: "Solis Studio",
        source: "WhatsApp declarado",
        interest: "Site institucional",
        createdAt: "2026-10-08T11:00:00Z",
        interactions: [],
      },
    ],
    opportunities: [
      {
        id: "opp-1",
        leadId: "lead-1",
        title: "Automação Aurora",
        stage: "Proposta",
        value: 18500,
        createdAt: "2026-10-12T13:00:00Z",
        events: [
          { stage: "Novo lead", at: "2026-10-12T13:00:00Z" },
          { stage: "Em contato", at: "2026-10-13T14:00:00Z" },
          { stage: "Proposta", at: "2026-10-14T10:00:00Z" },
        ],
      },
      {
        id: "opp-2",
        leadId: "lead-2",
        title: "Integração Orbit",
        stage: "Em contato",
        value: 12000,
        createdAt: "2026-10-10T15:00:00Z",
        events: [
          { stage: "Novo lead", at: "2026-10-10T15:00:00Z" },
          { stage: "Em contato", at: "2026-10-12T16:00:00Z" },
        ],
      },
      {
        id: "opp-3",
        leadId: "lead-3",
        title: "Site Solis",
        stage: "Ganho",
        value: 9500,
        clientId: "client-1",
        createdAt: "2026-10-08T11:00:00Z",
        events: [
          { stage: "Novo lead", at: "2026-10-08T11:00:00Z" },
          { stage: "Ganho", at: "2026-10-11T13:00:00Z" },
        ],
      },
    ],
    clients: [
      {
        id: "client-1",
        name: "Solis Studio",
        segment: "Design",
        contacts: [
          {
            id: "contact-1",
            name: "Bianca Souza",
            email: "bianca@solis.exemplo",
            phone: "31999998888",
          },
        ],
      },
      {
        id: "client-2",
        name: "Norte Contábil",
        segment: "Serviços",
        contacts: [
          {
            id: "contact-2",
            name: "Paulo Mendes",
            email: "paulo@norte.exemplo",
            phone: "11966665555",
          },
        ],
      },
    ],
    projects: [
      {
        id: "project-1",
        clientId: "client-1",
        name: "Novo site Solis",
        status: "Em andamento",
        priority: "Alta",
        dueOn: "2026-10-28",
        phases: ["Planejamento", "Produção", "Entrega"],
        tasks: [
          {
            id: "task-1",
            title: "Mapear páginas",
            phase: "Planejamento",
            status: "Concluída",
            dueOn: "2026-10-12",
            predecessorIds: [],
          },
          {
            id: "task-2",
            title: "Criar layout",
            phase: "Produção",
            status: "Em andamento",
            dueOn: "2026-10-18",
            predecessorIds: ["task-1"],
          },
          {
            id: "task-3",
            title: "Publicar site",
            phase: "Entrega",
            status: "A fazer",
            dueOn: "2026-10-27",
            predecessorIds: ["task-2"],
          },
        ],
        deliverables: [
          {
            id: "deliverable-1",
            title: "Layout final",
            version: 1,
            status: "Rascunho",
          },
        ],
      },
      {
        id: "project-2",
        clientId: "client-2",
        name: "Painel Norte",
        status: "Planejado",
        priority: "Média",
        dueOn: "2026-11-05",
        phases: ["Planejamento"],
        tasks: [],
        deliverables: [],
      },
    ],
    meetings: [
      {
        id: "meeting-1",
        title: "Alinhamento Solis",
        startsAt: "2026-10-16T13:00:00Z",
        projectId: "project-1",
        status: "Agendada",
        participants: "Bianca, equipe ValeOS",
        agenda: "Validar layout e próximos passos",
        minutes: "",
        decisions: "",
        actions: [
          {
            id: "action-1",
            description: "Enviar referências de conteúdo",
            status: "Pendente",
          },
        ],
      },
      {
        id: "meeting-2",
        title: "Planejamento semanal",
        startsAt: "2026-10-15T13:00:00Z",
        status: "Agendada",
        participants: "Equipe ValeOS",
        agenda: "Revisar funil e entregas",
        minutes: "",
        decisions: "",
        actions: [],
      },
    ],
    notifications: [
      {
        id: "note-1",
        message: "Projeto Novo site Solis possui tarefas pendentes",
        target: "projects",
        read: false,
      },
      {
        id: "note-2",
        message: "Nova proposta para Aurora Digital",
        target: "pipeline",
        read: false,
      },
    ],
  };
}

export function normalizeContact(value: string) {
  return value.trim().toLowerCase();
}

export function addDemoLead(
  state: DemoState,
  lead: DemoLead,
  opportunityId: string,
): DemoState {
  if (lead.name.trim().length < 2 || (!lead.email.trim() && !lead.phone.trim()))
    throw new Error("Informe nome e e-mail ou telefone.");
  const email = normalizeContact(lead.email);
  const phone = lead.phone.replace(/\D/g, "");
  const duplicate = state.leads.find(
    (item) =>
      (email && normalizeContact(item.email) === email) ||
      (phone && item.phone.replace(/\D/g, "") === phone),
  );
  const storedLead = {
    ...lead,
    name: lead.name.trim(),
    email,
    phone: lead.phone.trim(),
    duplicateOf: duplicate?.id,
  };
  return {
    ...state,
    leads: [storedLead, ...state.leads],
    opportunities: [
      {
        id: opportunityId,
        leadId: lead.id,
        title: `Oportunidade — ${storedLead.name}`,
        stage: "Novo lead",
        value: null,
        createdAt: lead.createdAt,
        events: [{ stage: "Novo lead", at: lead.createdAt }],
      },
      ...state.opportunities,
    ],
    notifications: [
      {
        id: `note-${lead.id}`,
        message: `Novo lead: ${storedLead.name}`,
        target: "leads",
        read: false,
      },
      ...state.notifications,
    ],
  };
}

export function moveDemoOpportunity(
  state: DemoState,
  id: string,
  stage: DemoStage,
  value: number | null,
  clientId: string | undefined,
  newClientName: string,
  at: string,
): DemoState {
  const opportunity = state.opportunities.find((item) => item.id === id);
  if (!opportunity) throw new Error("Oportunidade não encontrada.");
  if (
    stage === "Ganho" &&
    (!value || value <= 0 || (!clientId && !newClientName.trim()))
  )
    throw new Error("Para marcar como ganho, informe valor e cliente.");
  let clients = state.clients;
  let selectedClient = clientId;
  if (stage === "Ganho" && !selectedClient) {
    const existing = clients.find(
      (item) => normalizeContact(item.name) === normalizeContact(newClientName),
    );
    if (existing) selectedClient = existing.id;
    else {
      selectedClient = `client-${id}`;
      clients = [
        {
          id: selectedClient,
          name: newClientName.trim(),
          segment: "",
          contacts: [],
        },
        ...clients,
      ];
    }
  }
  return {
    ...state,
    clients,
    opportunities: state.opportunities.map((item) =>
      item.id === id
        ? {
            ...item,
            stage,
            value: value ?? item.value,
            clientId: selectedClient ?? item.clientId,
            events:
              item.stage === stage
                ? item.events
                : [...item.events, { stage, at }],
          }
        : item,
    ),
  };
}

export function addDemoDependency(
  project: DemoProject,
  predecessorId: string,
  successorId: string,
): DemoProject {
  if (predecessorId === successorId)
    throw new Error("Uma tarefa não pode depender dela mesma.");
  const predecessor = project.tasks.find((item) => item.id === predecessorId);
  const successor = project.tasks.find((item) => item.id === successorId);
  if (!predecessor || !successor)
    throw new Error("As tarefas precisam pertencer ao mesmo projeto.");
  if (successor.predecessorIds.includes(predecessorId)) return project;
  const visited = new Set<string>();
  const reachesSuccessor = (id: string): boolean => {
    if (id === successorId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (
      project.tasks
        .find((item) => item.id === id)
        ?.predecessorIds.some(reachesSuccessor) || false
    );
  };
  if (reachesSuccessor(predecessorId))
    throw new Error("Dependência circular não permitida.");
  return {
    ...project,
    tasks: project.tasks.map((item) =>
      item.id === successorId
        ? { ...item, predecessorIds: [...item.predecessorIds, predecessorId] }
        : item,
    ),
  };
}

export function setDemoTaskStatus(
  project: DemoProject,
  taskId: string,
  status: DemoTaskStatus,
): DemoProject {
  const task = project.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Tarefa não encontrada.");
  if (
    status === "Concluída" &&
    task.predecessorIds.some(
      (id) =>
        project.tasks.find((item) => item.id === id)?.status !== "Concluída",
    )
  )
    throw new Error("Conclua as tarefas predecessoras antes desta tarefa.");
  return {
    ...project,
    tasks: project.tasks.map((item) =>
      item.id === taskId ? { ...item, status } : item,
    ),
  };
}

export function concludeDemoProject(project: DemoProject): DemoProject {
  if (
    project.tasks.some(
      (task) => !["Concluída", "Cancelada"].includes(task.status),
    )
  )
    throw new Error("Há tarefas pendentes.");
  if (project.deliverables.some((item) => item.status !== "Aprovado"))
    throw new Error("Há entregáveis sem aprovação externa.");
  return { ...project, status: "Concluído" };
}

export function changeDemoDeliverable(
  project: DemoProject,
  id: string,
  action:
    | "request"
    | "internalApprove"
    | "internalAdjust"
    | "externalApprove"
    | "externalAdjust"
    | "revise",
  actor = "Equipe ValeOS",
  comment = "",
): DemoProject {
  const deliverable = project.deliverables.find((item) => item.id === id);
  if (!deliverable) throw new Error("Entregável não encontrado.");
  const next = { ...deliverable };
  switch (action) {
    case "request":
      if (next.status !== "Rascunho")
        throw new Error("Crie uma nova versão antes de solicitar aprovação.");
      next.status = "Em aprovação interna";
      next.requester = actor;
      break;
    case "internalApprove":
      if (next.status !== "Em aprovação interna")
        throw new Error("Aprovação interna indisponível.");
      if (
        next.requester &&
        next.requester.trim().toLowerCase() === actor.trim().toLowerCase()
      )
        throw new Error(
          "Outra pessoa da equipe deve aprovar esta entrega no demo.",
        );
      next.status = "Aprovado internamente";
      next.decidedBy = actor;
      break;
    case "internalAdjust":
      if (next.status !== "Em aprovação interna" || !comment.trim())
        throw new Error("Informe o ajuste solicitado.");
      next.status = "Revisão";
      next.comment = comment.trim();
      break;
    case "externalApprove":
      if (next.status !== "Em aprovação externa")
        throw new Error("Envie para aprovação externa antes da resposta.");
      next.status = "Aprovado";
      next.decidedBy = actor;
      break;
    case "externalAdjust":
      if (next.status !== "Em aprovação externa" || !comment.trim())
        throw new Error("Informe o ajuste solicitado.");
      next.status = "Revisão";
      next.comment = comment.trim();
      next.decidedBy = actor;
      break;
    case "revise":
      if (!["Revisão", "Aprovado"].includes(next.status))
        throw new Error("Esta versão não pode ser revisada agora.");
      next.version += 1;
      next.status = "Rascunho";
      next.comment = "";
      next.decidedBy = "";
      break;
  }
  return {
    ...project,
    deliverables: project.deliverables.map((item) =>
      item.id === id ? next : item,
    ),
  };
}

export function sendDemoExternal(
  project: DemoProject,
  id: string,
): DemoProject {
  const item = project.deliverables.find(
    (deliverable) => deliverable.id === id,
  );
  if (!item || item.status !== "Aprovado internamente")
    throw new Error("Aprovação interna obrigatória.");
  return {
    ...project,
    deliverables: project.deliverables.map((deliverable) =>
      deliverable.id === id
        ? { ...deliverable, status: "Em aprovação externa" }
        : deliverable,
    ),
  };
}
