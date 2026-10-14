"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ContactRound,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  RotateCcw,
} from "lucide-react";
import {
  addDemoDependency,
  addDemoLead,
  changeDemoDeliverable,
  concludeDemoProject,
  demoStages,
  moveDemoOpportunity,
  seedDemoState,
  sendDemoExternal,
  setDemoTaskStatus,
  type DemoClient,
  type DemoDeliverable,
  type DemoLead,
  type DemoProject,
  type DemoStage,
  type DemoState,
  type DemoTaskStatus,
} from "@/lib/demo";

const STORAGE_KEY = "valeos-demo-v1";
type Section =
  | "dashboard"
  | "leads"
  | "pipeline"
  | "clients"
  | "projects"
  | "meetings"
  | "notifications";
const nav: { id: Section; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "leads", label: "Prospecção", Icon: ContactRound },
  { id: "pipeline", label: "Pipeline", Icon: KanbanSquare },
  { id: "clients", label: "Clientes", Icon: Building2 },
  { id: "projects", label: "Projetos", Icon: FolderKanban },
  { id: "meetings", label: "Reuniões", Icon: CalendarDays },
  { id: "notifications", label: "Notificações", Icon: Bell },
];

function field(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) || "").trim();
}
function money(value: number | null) {
  return value == null
    ? "Valor a definir"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
}
function date(value: string) {
  if (!value) return "Sem prazo";
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function uid() {
  return crypto.randomUUID();
}

export function DemoApp() {
  const [state, setState] = useState<DemoState>(seedDemoState);
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [actor, setActor] = useState("Vitor (demo)");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          "version" in parsed &&
          parsed.version === 1 &&
          "leads" in parsed &&
          Array.isArray(parsed.leads)
        )
          setState(parsed as DemoState);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  function run(change: (current: DemoState) => DemoState, success: string) {
    try {
      const next = change(state);
      setState(next);
      setError("");
      setNotice(success);
    } catch (reason) {
      setNotice("");
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir esta ação.",
      );
    }
  }
  function updateProject(
    id: string,
    change: (project: DemoProject) => DemoProject,
    success: string,
  ) {
    run(
      (current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === id ? change(project) : project,
        ),
      }),
      success,
    );
  }
  function open(next: Section, id = "") {
    setSection(next);
    setSelectedId(id);
    setQuery("");
    setError("");
    setNotice("");
  }
  function submit(
    event: FormEvent<HTMLFormElement>,
    handler: (form: HTMLFormElement) => void,
  ) {
    event.preventDefault();
    handler(event.currentTarget);
    event.currentTarget.reset();
  }
  function reset() {
    if (!confirm("Reiniciar todos os dados fictícios deste navegador?")) return;
    const fresh = seedDemoState();
    setState(fresh);
    open("dashboard");
    setNotice("Demonstração reiniciada.");
  }

  const lead = state.leads.find((item) => item.id === selectedId);
  const opportunity = state.opportunities.find(
    (item) => item.id === selectedId,
  );
  const client = state.clients.find((item) => item.id === selectedId);
  const project = state.projects.find((item) => item.id === selectedId);
  const meeting = state.meetings.find((item) => item.id === selectedId);
  const match = (text: string) =>
    text.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"));
  const unread = state.notifications.filter((item) => !item.read).length;
  const completedTasks = state.projects
    .flatMap((item) => item.tasks)
    .filter((item) => item.status === "Concluída").length;
  const wonValue = state.opportunities
    .filter((item) => item.stage === "Ganho")
    .reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>ValeOS</span>
        </div>
        <span className="demo-side-label">AMBIENTE DE DEMONSTRAÇÃO</span>
        <nav aria-label="Navegação da demonstração">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`demo-nav-item ${section === id ? "active" : ""}`}
              onClick={() => open(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "notifications" && unread > 0 && <b>{unread}</b>}
            </button>
          ))}
        </nav>
        <div className="demo-sidebar-bottom">
          <p>
            Os dados deste modo ficam somente neste navegador. Nada é enviado ao
            Supabase.
          </p>
          <button className="button secondary" type="button" onClick={reset}>
            <RotateCcw size={15} /> Reiniciar dados
          </button>
        </div>
      </aside>
      <div className="demo-main">
        <header className="demo-topbar">
          <div>
            <span className="brand-mark">V</span>
            <strong>ValeOS</strong>
            <span className="demo-badge">DEMO LOCAL</span>
          </div>
          <a href="/setup">Configurar Supabase real ↗</a>
        </header>
        <main className="demo-content">
          {notice && (
            <div className="notice success" role="status">
              {notice}
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}

          {section === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">VISÃO GERAL / DEMONSTRAÇÃO</span>
                  <h1>Seu trabalho em um só lugar</h1>
                  <p>Dados fictícios para explorar os fluxos do ValeOS.</p>
                </div>
              </div>
              <div className="demo-stats">
                <article>
                  <small>Leads</small>
                  <strong>{state.leads.length}</strong>
                  <span>contatos cadastrados</span>
                </article>
                <article>
                  <small>Oportunidades ganhas</small>
                  <strong>
                    {
                      state.opportunities.filter(
                        (item) => item.stage === "Ganho",
                      ).length
                    }
                  </strong>
                  <span>{money(wonValue)}</span>
                </article>
                <article>
                  <small>Projetos ativos</small>
                  <strong>
                    {
                      state.projects.filter(
                        (item) =>
                          !["Concluído", "Cancelado"].includes(item.status),
                      ).length
                    }
                  </strong>
                  <span>em acompanhamento</span>
                </article>
                <article>
                  <small>Tarefas concluídas</small>
                  <strong>{completedTasks}</strong>
                  <span>no total</span>
                </article>
              </div>
              <div className="demo-columns">
                <section className="surface detail-section">
                  <h2>Próximos passos</h2>
                  <div className="compact-list">
                    {state.projects
                      .filter((item) => item.status !== "Concluído")
                      .map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => open("projects", item.id)}
                        >
                          <strong>{item.name}</strong>
                          <small>Prazo {date(item.dueOn)}</small>
                        </button>
                      ))}
                  </div>
                </section>
                <section className="surface detail-section">
                  <h2>Reuniões</h2>
                  <div className="compact-list">
                    {state.meetings
                      .filter((item) => item.status === "Agendada")
                      .map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => open("meetings", item.id)}
                        >
                          <strong>{item.title}</strong>
                          <small>{date(item.startsAt)}</small>
                        </button>
                      ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {section === "leads" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">COMERCIAL / PROSPECÇÃO</span>
                  <h1>Leads</h1>
                  <p>
                    Cadastre um contato e acompanhe o início da oportunidade.
                  </p>
                </div>
              </div>
              <div className="demo-columns">
                <section className="surface detail-section">
                  <h2>Novo lead</h2>
                  <form
                    className="stack-form"
                    onSubmit={(event) =>
                      submit(event, (form) => {
                        const id = uid();
                        const createdAt = new Date().toISOString();
                        const value: DemoLead = {
                          id,
                          name: field(form, "name"),
                          email: field(form, "email"),
                          phone: field(form, "phone"),
                          company: field(form, "company"),
                          source: field(form, "source") || "Manual",
                          interest: field(form, "interest"),
                          createdAt,
                          interactions: [],
                        };
                        run(
                          (current) => addDemoLead(current, value, uid()),
                          "Lead e oportunidade criados.",
                        );
                        setSelectedId(id);
                      })
                    }
                  >
                    <label>
                      Nome
                      <input name="name" minLength={2} required />
                    </label>
                    <label>
                      E-mail
                      <input name="email" type="email" />
                    </label>
                    <label>
                      Telefone
                      <input name="phone" />
                    </label>
                    <label>
                      Empresa
                      <input name="company" />
                    </label>
                    <label>
                      Origem
                      <input name="source" defaultValue="Manual" required />
                    </label>
                    <label>
                      Interesse
                      <textarea name="interest" rows={2} />
                    </label>
                    <button className="button primary">Cadastrar lead</button>
                  </form>
                </section>
                <section className="surface detail-section">
                  <h2>Leads cadastrados</h2>
                  <input
                    className="demo-search"
                    aria-label="Filtrar leads"
                    placeholder="Buscar nome ou empresa"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="compact-list">
                    {state.leads
                      .filter((item) => match(`${item.name} ${item.company}`))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={item.id === selectedId ? "selected" : ""}
                        >
                          <strong>
                            {item.name}
                            {item.duplicateOf && <em> · Possível duplicata</em>}
                          </strong>
                          <small>
                            {item.company || item.email || item.phone}
                          </small>
                        </button>
                      ))}
                  </div>
                </section>
              </div>
              {lead && (
                <section className="surface detail-section demo-detail">
                  <h2>{lead.name}</h2>
                  <p>
                    {lead.company || "Sem empresa"} · {lead.email || lead.phone}{" "}
                    · origem {lead.source}
                  </p>
                  <p>{lead.interest}</p>
                  {lead.phone && (
                    <a
                      className="subtle-link"
                      href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir WhatsApp ↗
                    </a>
                  )}
                  <h3>Interações</h3>
                  <div className="compact-list">
                    {lead.interactions.map((item) => (
                      <div key={item.id}>
                        <strong>{item.kind}</strong>
                        <small>{item.summary}</small>
                      </div>
                    ))}
                  </div>
                  <form
                    className="demo-inline-form"
                    onSubmit={(event) =>
                      submit(event, (form) =>
                        run(
                          (current) => ({
                            ...current,
                            leads: current.leads.map((item) =>
                              item.id === lead.id
                                ? {
                                    ...item,
                                    interactions: [
                                      {
                                        id: uid(),
                                        kind: field(form, "kind"),
                                        summary: field(form, "summary"),
                                        createdAt: new Date().toISOString(),
                                      },
                                      ...item.interactions,
                                    ],
                                  }
                                : item,
                            ),
                          }),
                          "Interação registrada.",
                        ),
                      )
                    }
                  >
                    <select name="kind" aria-label="Tipo de interação">
                      <option>WhatsApp</option>
                      <option>Ligação</option>
                      <option>E-mail</option>
                      <option>Reunião</option>
                      <option>Nota</option>
                    </select>
                    <input
                      name="summary"
                      placeholder="Resumo da interação"
                      required
                    />
                    <button className="button secondary">Registrar</button>
                  </form>
                </section>
              )}
            </>
          )}

          {section === "pipeline" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">COMERCIAL / OPORTUNIDADES</span>
                  <h1>Pipeline</h1>
                  <p>
                    Mova as oportunidades e acompanhe o histórico de etapas.
                  </p>
                </div>
              </div>
              <div className="demo-kanban">
                {demoStages.map((stage) => (
                  <section className="kanban-column" key={stage}>
                    <div className="kanban-heading">
                      <span className="status">{stage}</span>
                      <span>
                        {
                          state.opportunities.filter(
                            (item) => item.stage === stage,
                          ).length
                        }
                      </span>
                    </div>
                    <div className="kanban-cards">
                      {state.opportunities
                        .filter((item) => item.stage === stage)
                        .map((item) => (
                          <button
                            className="opportunity-card"
                            type="button"
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                          >
                            <strong>{item.title}</strong>
                            <span>
                              {state.leads.find(
                                (leadItem) => leadItem.id === item.leadId,
                              )?.company || "Contato"}
                            </span>
                            <b>{money(item.value)}</b>
                          </button>
                        ))}
                    </div>
                  </section>
                ))}
              </div>
              {opportunity && (
                <section className="surface detail-section demo-detail">
                  <h2>{opportunity.title}</h2>
                  <p>
                    Etapa atual:{" "}
                    <span className="status">{opportunity.stage}</span>
                  </p>
                  <form
                    className="demo-form-grid"
                    key={opportunity.id}
                    onSubmit={(event) =>
                      submit(event, (form) => {
                        const stage = field(form, "stage") as DemoStage;
                        const rawValue = field(form, "value");
                        const value = rawValue ? Number(rawValue) : null;
                        run(
                          (current) =>
                            moveDemoOpportunity(
                              current,
                              opportunity.id,
                              stage,
                              value,
                              field(form, "clientId") || undefined,
                              field(form, "newClientName"),
                              new Date().toISOString(),
                            ),
                          "Etapa atualizada e histórico registrado.",
                        );
                      })
                    }
                  >
                    <label>
                      Nova etapa
                      <select name="stage" defaultValue={opportunity.stage}>
                        {demoStages.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Valor (R$)
                      <input
                        name="value"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={opportunity.value ?? ""}
                      />
                    </label>
                    <label>
                      Cliente existente
                      <select
                        name="clientId"
                        defaultValue={opportunity.clientId || ""}
                      >
                        <option value="">Novo cliente ou manter</option>
                        {state.clients.map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nome do novo cliente
                      <input
                        name="newClientName"
                        placeholder="Obrigatório para ganho sem cliente"
                      />
                    </label>
                    <button className="button primary">Salvar etapa</button>
                  </form>
                  <h3>Histórico de etapas</h3>
                  <div className="compact-list">
                    {opportunity.events
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <div key={`${event.at}-${index}`}>
                          <strong>{event.stage}</strong>
                          <small>{date(event.at)}</small>
                        </div>
                      ))}
                  </div>
                  {opportunity.stage === "Ganho" && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => open("projects")}
                    >
                      Criar projeto para este cliente →
                    </button>
                  )}
                </section>
              )}
            </>
          )}

          {section === "clients" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">RELACIONAMENTO / CLIENTES</span>
                  <h1>Clientes</h1>
                  <p>
                    Empresas, contatos, oportunidades e projetos relacionados.
                  </p>
                </div>
              </div>
              <div className="demo-columns">
                <section className="surface detail-section">
                  <h2>Nova empresa</h2>
                  <form
                    className="stack-form"
                    onSubmit={(event) =>
                      submit(event, (form) => {
                        const id = uid();
                        const name = field(form, "name");
                        if (!name) return;
                        run(
                          (current) => ({
                            ...current,
                            clients: [
                              {
                                id,
                                name,
                                segment: field(form, "segment"),
                                contacts: [],
                              },
                              ...current.clients,
                            ],
                          }),
                          "Empresa cadastrada.",
                        );
                        setSelectedId(id);
                      })
                    }
                  >
                    <label>
                      Nome
                      <input name="name" required />
                    </label>
                    <label>
                      Segmento
                      <input name="segment" />
                    </label>
                    <button className="button primary">
                      Cadastrar empresa
                    </button>
                  </form>
                </section>
                <section className="surface detail-section">
                  <h2>Empresas cadastradas</h2>
                  <input
                    className="demo-search"
                    aria-label="Filtrar clientes"
                    placeholder="Buscar empresa"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="compact-list">
                    {state.clients
                      .filter((item) => match(item.name))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={item.id === selectedId ? "selected" : ""}
                        >
                          <strong>{item.name}</strong>
                          <small>{item.segment || "Cliente"}</small>
                        </button>
                      ))}
                  </div>
                </section>
              </div>
              {client && (
                <section className="surface detail-section demo-detail">
                  <h2>{client.name}</h2>
                  <p>{client.segment || "Segmento não informado"}</p>
                  <div className="demo-columns">
                    <div>
                      <h3>Contatos</h3>
                      <div className="compact-list">
                        {client.contacts.map((item) => (
                          <div key={item.id}>
                            <strong>{item.name}</strong>
                            <small>{item.email || item.phone}</small>
                          </div>
                        ))}
                      </div>
                      <form
                        className="stack-form"
                        onSubmit={(event) =>
                          submit(event, (form) =>
                            run(
                              (current) => ({
                                ...current,
                                clients: current.clients.map((item) =>
                                  item.id === client.id
                                    ? {
                                        ...item,
                                        contacts: [
                                          ...item.contacts,
                                          {
                                            id: uid(),
                                            name: field(form, "name"),
                                            email: field(form, "email"),
                                            phone: field(form, "phone"),
                                          },
                                        ],
                                      }
                                    : item,
                                ),
                              }),
                              "Contato adicionado.",
                            ),
                          )
                        }
                      >
                        <label>
                          Nome
                          <input name="name" required />
                        </label>
                        <label>
                          E-mail
                          <input name="email" type="email" />
                        </label>
                        <label>
                          Telefone
                          <input name="phone" />
                        </label>
                        <button className="button secondary">
                          Adicionar contato
                        </button>
                      </form>
                    </div>
                    <div>
                      <h3>Relacionamentos</h3>
                      <div className="compact-list">
                        {state.opportunities
                          .filter((item) => item.clientId === client.id)
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => open("pipeline", item.id)}
                            >
                              <strong>{item.title}</strong>
                              <small>Oportunidade · {item.stage}</small>
                            </button>
                          ))}
                        {state.projects
                          .filter((item) => item.clientId === client.id)
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => open("projects", item.id)}
                            >
                              <strong>{item.name}</strong>
                              <small>Projeto · {item.status}</small>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {section === "projects" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">ENTREGA / PROJETOS</span>
                  <h1>Projetos</h1>
                  <p>
                    Teste tarefas, dependências e a dupla aprovação de
                    entregáveis.
                  </p>
                </div>
              </div>
              <div className="demo-columns">
                <section className="surface detail-section">
                  <h2>Novo projeto</h2>
                  <form
                    className="stack-form"
                    onSubmit={(event) =>
                      submit(event, (form) => {
                        const id = uid();
                        run(
                          (current) => ({
                            ...current,
                            projects: [
                              {
                                id,
                                clientId: field(form, "clientId"),
                                name: field(form, "name"),
                                status: "Planejado",
                                priority: field(
                                  form,
                                  "priority",
                                ) as DemoProject["priority"],
                                dueOn: field(form, "dueOn"),
                                phases: ["Planejamento"],
                                tasks: [],
                                deliverables: [],
                              },
                              ...current.projects,
                            ],
                          }),
                          "Projeto criado.",
                        );
                        setSelectedId(id);
                      })
                    }
                  >
                    <label>
                      Cliente
                      <select name="clientId" required>
                        {state.clients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nome
                      <input name="name" required />
                    </label>
                    <label>
                      Prioridade
                      <select name="priority">
                        <option>Média</option>
                        <option>Alta</option>
                        <option>Baixa</option>
                      </select>
                    </label>
                    <label>
                      Prazo
                      <input name="dueOn" type="date" required />
                    </label>
                    <button className="button primary">Criar projeto</button>
                  </form>
                </section>
                <section className="surface detail-section">
                  <h2>Projetos cadastrados</h2>
                  <input
                    className="demo-search"
                    aria-label="Filtrar projetos"
                    placeholder="Buscar projeto"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="compact-list">
                    {state.projects
                      .filter((item) => match(item.name))
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className={item.id === selectedId ? "selected" : ""}
                        >
                          <strong>{item.name}</strong>
                          <small>
                            {item.status} · {date(item.dueOn)}
                          </small>
                        </button>
                      ))}
                  </div>
                </section>
              </div>
              {project && (
                <ProjectDetail
                  project={project}
                  client={state.clients.find(
                    (item) => item.id === project.clientId,
                  )}
                  actor={actor}
                  setActor={setActor}
                  feedback={feedback}
                  setFeedback={setFeedback}
                  updateProject={updateProject}
                  submit={submit}
                />
              )}
            </>
          )}

          {section === "meetings" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">OPERAÇÃO / REUNIÕES</span>
                  <h1>Reuniões</h1>
                  <p>
                    Registre decisões e transforme encaminhamentos em tarefas
                    quando houver projeto.
                  </p>
                </div>
              </div>
              <div className="demo-columns">
                <section className="surface detail-section">
                  <h2>Nova reunião</h2>
                  <form
                    className="stack-form"
                    onSubmit={(event) =>
                      submit(event, (form) => {
                        const id = uid();
                        run(
                          (current) => ({
                            ...current,
                            meetings: [
                              {
                                id,
                                title: field(form, "title"),
                                startsAt: new Date(
                                  field(form, "startsAt"),
                                ).toISOString(),
                                projectId:
                                  field(form, "projectId") || undefined,
                                status: "Agendada",
                                participants: field(form, "participants"),
                                agenda: field(form, "agenda"),
                                minutes: "",
                                decisions: "",
                                actions: [],
                              },
                              ...current.meetings,
                            ],
                          }),
                          "Reunião criada.",
                        );
                        setSelectedId(id);
                      })
                    }
                  >
                    <label>
                      Título
                      <input name="title" required />
                    </label>
                    <label>
                      Início
                      <input name="startsAt" type="datetime-local" required />
                    </label>
                    <label>
                      Projeto vinculado
                      <select name="projectId">
                        <option value="">Reunião geral</option>
                        {state.projects.map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Participantes
                      <input name="participants" />
                    </label>
                    <label>
                      Pauta
                      <textarea name="agenda" rows={2} />
                    </label>
                    <button className="button primary">Criar reunião</button>
                  </form>
                </section>
                <section className="surface detail-section">
                  <h2>Reuniões cadastradas</h2>
                  <div className="compact-list">
                    {state.meetings.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={item.id === selectedId ? "selected" : ""}
                      >
                        <strong>{item.title}</strong>
                        <small>
                          {date(item.startsAt)} · {item.status}
                        </small>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
              {meeting && (
                <section className="surface detail-section demo-detail">
                  <h2>{meeting.title}</h2>
                  <p>
                    {date(meeting.startsAt)} ·{" "}
                    {meeting.participants || "Participantes não informados"} ·{" "}
                    {meeting.status}
                  </p>
                  <p>
                    <strong>Pauta:</strong> {meeting.agenda || "Não informada"}
                  </p>
                  <form
                    className="stack-form"
                    key={meeting.id}
                    onSubmit={(event) =>
                      submit(event, (form) =>
                        run(
                          (current) => ({
                            ...current,
                            meetings: current.meetings.map((item) =>
                              item.id === meeting.id
                                ? {
                                    ...item,
                                    status: field(
                                      form,
                                      "status",
                                    ) as typeof item.status,
                                    minutes: field(form, "minutes"),
                                    decisions: field(form, "decisions"),
                                  }
                                : item,
                            ),
                          }),
                          "Reunião atualizada.",
                        ),
                      )
                    }
                  >
                    <label>
                      Situação
                      <select name="status" defaultValue={meeting.status}>
                        <option>Agendada</option>
                        <option>Realizada</option>
                        <option>Cancelada</option>
                      </select>
                    </label>
                    <label>
                      Ata
                      <textarea
                        name="minutes"
                        defaultValue={meeting.minutes}
                        rows={2}
                      />
                    </label>
                    <label>
                      Decisões
                      <textarea
                        name="decisions"
                        defaultValue={meeting.decisions}
                        rows={2}
                      />
                    </label>
                    <button className="button secondary">Salvar reunião</button>
                  </form>
                  <h3>Encaminhamentos</h3>
                  <div className="compact-list">
                    {meeting.actions.map((action) => (
                      <div key={action.id}>
                        <div>
                          <strong>{action.description}</strong>
                          <small>{action.status}</small>
                        </div>
                        {action.status === "Pendente" && (
                          <div className="demo-action-buttons">
                            <button
                              className="button secondary"
                              type="button"
                              onClick={() =>
                                run(
                                  (current) => ({
                                    ...current,
                                    meetings: current.meetings.map((item) =>
                                      item.id === meeting.id
                                        ? {
                                            ...item,
                                            actions: item.actions.map(
                                              (entry) =>
                                                entry.id === action.id
                                                  ? {
                                                      ...entry,
                                                      status: "Concluído",
                                                    }
                                                  : entry,
                                            ),
                                          }
                                        : item,
                                    ),
                                  }),
                                  "Encaminhamento concluído.",
                                )
                              }
                            >
                              Concluir
                            </button>
                            {meeting.projectId && (
                              <button
                                className="button secondary"
                                type="button"
                                onClick={() =>
                                  run((current) => {
                                    const project = current.projects.find(
                                      (item) => item.id === meeting.projectId,
                                    );
                                    if (!project)
                                      throw new Error(
                                        "Projeto não encontrado.",
                                      );
                                    const taskId = uid();
                                    return {
                                      ...current,
                                      projects: current.projects.map((item) =>
                                        item.id === project.id
                                          ? {
                                              ...item,
                                              tasks: [
                                                ...item.tasks,
                                                {
                                                  id: taskId,
                                                  title: action.description,
                                                  phase: item.phases[0],
                                                  status: "A fazer",
                                                  dueOn: "",
                                                  predecessorIds: [],
                                                },
                                              ],
                                            }
                                          : item,
                                      ),
                                      meetings: current.meetings.map((item) =>
                                        item.id === meeting.id
                                          ? {
                                              ...item,
                                              actions: item.actions.map(
                                                (entry) =>
                                                  entry.id === action.id
                                                    ? {
                                                        ...entry,
                                                        status: "Convertido",
                                                        taskId,
                                                      }
                                                    : entry,
                                              ),
                                            }
                                          : item,
                                      ),
                                    };
                                  }, "Tarefa criada no projeto vinculado.")
                                }
                              >
                                Criar tarefa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <form
                    className="demo-inline-form"
                    onSubmit={(event) =>
                      submit(event, (form) =>
                        run(
                          (current) => ({
                            ...current,
                            meetings: current.meetings.map((item) =>
                              item.id === meeting.id
                                ? {
                                    ...item,
                                    actions: [
                                      ...item.actions,
                                      {
                                        id: uid(),
                                        description: field(form, "description"),
                                        status: "Pendente",
                                      },
                                    ],
                                  }
                                : item,
                            ),
                          }),
                          "Encaminhamento criado.",
                        ),
                      )
                    }
                  >
                    <input
                      name="description"
                      placeholder="Novo encaminhamento"
                      required
                    />
                    <button className="button secondary">Adicionar</button>
                  </form>
                </section>
              )}
            </>
          )}

          {section === "notifications" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">WORKSPACE / ALERTAS</span>
                  <h1>Notificações</h1>
                  <p>Leads e condições que precisam de atenção.</p>
                </div>
              </div>
              <section className="surface detail-section">
                <div className="compact-list">
                  {state.notifications.map((item) => (
                    <div key={item.id}>
                      <div>
                        <strong>{item.message}</strong>
                        <small>{item.read ? "Lida" : "Não lida"}</small>
                      </div>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          if (item.read) open(item.target as Section);
                          else
                            run(
                              (current) => ({
                                ...current,
                                notifications: current.notifications.map(
                                  (note) =>
                                    note.id === item.id
                                      ? { ...note, read: true }
                                      : note,
                                ),
                              }),
                              "Notificação marcada como lida.",
                            );
                        }}
                      >
                        {item.read ? "Abrir" : "Marcar como lida"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectDetail({
  project,
  client,
  actor,
  setActor,
  feedback,
  setFeedback,
  updateProject,
  submit,
}: {
  project: DemoProject;
  client?: DemoClient;
  actor: string;
  setActor: (value: string) => void;
  feedback: string;
  setFeedback: (value: string) => void;
  updateProject: (
    id: string,
    change: (project: DemoProject) => DemoProject,
    success: string,
  ) => void;
  submit: (
    event: FormEvent<HTMLFormElement>,
    handler: (form: HTMLFormElement) => void,
  ) => void;
}) {
  const eligible = project.tasks.filter((item) => item.status !== "Cancelada");
  const completed = eligible.filter(
    (item) => item.status === "Concluída",
  ).length;
  return (
    <section className="surface detail-section demo-detail">
      <div className="demo-detail-heading">
        <div>
          <span className="eyebrow">PROJETO / {client?.name || "CLIENTE"}</span>
          <h2>{project.name}</h2>
          <p>
            {project.status} · prioridade {project.priority} · prazo{" "}
            {date(project.dueOn)}
          </p>
        </div>
        <div className="demo-project-status">
          <select
            aria-label="Situação do projeto"
            value={project.status}
            onChange={(event) =>
              updateProject(
                project.id,
                (current) => ({
                  ...current,
                  status: event.target.value as DemoProject["status"],
                }),
                "Situação do projeto atualizada.",
              )
            }
          >
            {[
              "Planejado",
              "Em andamento",
              "Pausado",
              "Em aprovação",
              "Cancelado",
              ...(project.status === "Concluído" ? ["Concluído"] : []),
            ].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <button
            type="button"
            className="button primary"
            onClick={() =>
              updateProject(
                project.id,
                concludeDemoProject,
                "Projeto concluído.",
              )
            }
          >
            Concluir projeto
          </button>
        </div>
      </div>
      <div className="demo-progress">
        <div
          style={{
            width: `${eligible.length ? Math.round((completed / eligible.length) * 100) : 0}%`,
          }}
        />
      </div>
      <small>
        {completed} de {eligible.length} tarefas concluídas
      </small>
      <div className="demo-columns">
        <div>
          <h3>Fases</h3>
          <div className="demo-chips">
            {project.phases.map((phase) => (
              <span key={phase}>{phase}</span>
            ))}
          </div>
          <form
            className="demo-inline-form"
            onSubmit={(event) =>
              submit(event, (form) =>
                updateProject(
                  project.id,
                  (current) => ({
                    ...current,
                    phases: [...current.phases, field(form, "name")],
                  }),
                  "Fase criada.",
                ),
              )
            }
          >
            <input name="name" placeholder="Nova fase" required />
            <button className="button secondary">Adicionar</button>
          </form>
        </div>
        <div>
          <h3>Nova tarefa</h3>
          <form
            className="demo-inline-form"
            onSubmit={(event) =>
              submit(event, (form) =>
                updateProject(
                  project.id,
                  (current) => ({
                    ...current,
                    tasks: [
                      ...current.tasks,
                      {
                        id: uid(),
                        title: field(form, "title"),
                        phase: field(form, "phase"),
                        status: "A fazer",
                        dueOn: field(form, "dueOn"),
                        predecessorIds: [],
                      },
                    ],
                  }),
                  "Tarefa criada.",
                ),
              )
            }
          >
            <input name="title" placeholder="Título da tarefa" required />
            <select name="phase" aria-label="Fase da tarefa">
              {project.phases.map((phase) => (
                <option key={phase}>{phase}</option>
              ))}
            </select>
            <input name="dueOn" type="date" aria-label="Prazo da tarefa" />
            <button className="button secondary">Criar</button>
          </form>
        </div>
      </div>
      <h3>Tarefas</h3>
      <div className="demo-task-list">
        {project.tasks.map((task) => (
          <div key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <small>
                {task.phase} · {date(task.dueOn)}
                {task.predecessorIds.length > 0 &&
                  ` · depende de ${task.predecessorIds.map((id) => project.tasks.find((item) => item.id === id)?.title).join(", ")}`}
              </small>
            </div>
            <select
              aria-label={`Situação da tarefa ${task.title}`}
              value={task.status}
              onChange={(event) =>
                updateProject(
                  project.id,
                  (current) =>
                    setDemoTaskStatus(
                      current,
                      task.id,
                      event.target.value as DemoTaskStatus,
                    ),
                  "Tarefa atualizada.",
                )
              }
            >
              <option>A fazer</option>
              <option>Em andamento</option>
              <option>Concluída</option>
              <option>Cancelada</option>
            </select>
          </div>
        ))}
      </div>
      {project.tasks.length >= 2 && (
        <form
          className="demo-inline-form demo-dependency"
          onSubmit={(event) =>
            submit(event, (form) =>
              updateProject(
                project.id,
                (current) =>
                  addDemoDependency(
                    current,
                    field(form, "predecessor"),
                    field(form, "successor"),
                  ),
                "Dependência criada.",
              ),
            )
          }
        >
          <select name="predecessor" aria-label="Tarefa predecessora">
            {project.tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <span>antes de</span>
          <select name="successor" aria-label="Tarefa sucessora">
            {project.tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <button className="button secondary">Adicionar dependência</button>
        </form>
      )}
      <h3>Entregáveis e aprovações</h3>
      <div className="demo-deliverables">
        {project.deliverables.map((item: DemoDeliverable) => (
          <article key={item.id}>
            <div>
              <strong>
                {item.title} · v{item.version}
              </strong>
              <span className="status">{item.status}</span>
            </div>
            {item.comment && <p>Último pedido de ajuste: {item.comment}</p>}
            <div className="demo-action-buttons">
              {item.status === "Rascunho" && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    updateProject(
                      project.id,
                      (current) =>
                        changeDemoDeliverable(
                          current,
                          item.id,
                          "request",
                          actor,
                        ),
                      "Aprovação interna solicitada.",
                    )
                  }
                >
                  Solicitar aprovação interna
                </button>
              )}
              {item.status === "Em aprovação interna" && (
                <>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      updateProject(
                        project.id,
                        (current) =>
                          changeDemoDeliverable(
                            current,
                            item.id,
                            "internalAdjust",
                            actor,
                            feedback,
                          ),
                        "Ajustes internos solicitados.",
                      )
                    }
                  >
                    Pedir ajustes
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() =>
                      updateProject(
                        project.id,
                        (current) =>
                          changeDemoDeliverable(
                            current,
                            item.id,
                            "internalApprove",
                            actor,
                          ),
                        "Aprovação interna registrada.",
                      )
                    }
                  >
                    Aprovar internamente
                  </button>
                </>
              )}
              {item.status === "Aprovado internamente" && (
                <button
                  type="button"
                  className="button primary"
                  onClick={() =>
                    updateProject(
                      project.id,
                      (current) => sendDemoExternal(current, item.id),
                      "Solicitação externa simulada. Agora registre a resposta do cliente.",
                    )
                  }
                >
                  Enviar para cliente (simulação)
                </button>
              )}
              {item.status === "Em aprovação externa" && (
                <>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      updateProject(
                        project.id,
                        (current) =>
                          changeDemoDeliverable(
                            current,
                            item.id,
                            "externalAdjust",
                            actor,
                            feedback,
                          ),
                        "Cliente pediu ajustes.",
                      )
                    }
                  >
                    Cliente pede ajustes
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={() =>
                      updateProject(
                        project.id,
                        (current) =>
                          changeDemoDeliverable(
                            current,
                            item.id,
                            "externalApprove",
                            actor,
                          ),
                        "Cliente aprovou a entrega.",
                      )
                    }
                  >
                    Cliente aprova
                  </button>
                </>
              )}
              {["Revisão", "Aprovado"].includes(item.status) && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    updateProject(
                      project.id,
                      (current) =>
                        changeDemoDeliverable(current, item.id, "revise"),
                      "Nova versão criada; aprovações anteriores não valem para ela.",
                    )
                  }
                >
                  Criar nova versão
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {project.deliverables.length > 0 && (
        <div className="demo-approval-inputs">
          <label>
            Quem está respondendo
            <input
              value={actor}
              onChange={(event) => setActor(event.target.value)}
            />
            <small>Para aprovar internamente, use outro nome da equipe.</small>
          </label>
          <label>
            Comentário para pedir ajustes
            <input
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Obrigatório para ajustes"
            />
          </label>
        </div>
      )}
      <form
        className="demo-inline-form"
        onSubmit={(event) =>
          submit(event, (form) =>
            updateProject(
              project.id,
              (current) => ({
                ...current,
                deliverables: [
                  ...current.deliverables,
                  {
                    id: uid(),
                    title: field(form, "title"),
                    version: 1,
                    status: "Rascunho",
                  },
                ],
              }),
              "Entregável criado.",
            ),
          )
        }
      >
        <input name="title" placeholder="Novo entregável" required />
        <button className="button secondary">Adicionar entregável</button>
      </form>
    </section>
  );
}
