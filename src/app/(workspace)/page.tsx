import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCheck,
  ContactRound,
  FolderKanban,
  KanbanSquare,
  CalendarDays,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { brl, dateBr } from "@/lib/format";
import {
  completeWeekWindows,
  latestWonEvents,
  localDateKey,
  localMidnightUtc,
} from "@/lib/reporting";
import { PageHeading, Status } from "@/components/ui";

export default async function Dashboard() {
  const { db, profile } = await requireUser();
  const w = completeWeekWindows(new Date());
  const todayKey = localDateKey(new Date(), "America/Sao_Paulo");
  const [
    leadsNow,
    leadsPrev,
    eventsResult,
    opportunitiesResult,
    projectsResult,
    tasksNow,
    tasksPrev,
    meetingsNow,
    meetingsPrev,
    approvalResult,
    actionResult,
    latestLeads,
    goalsResult,
  ] = await Promise.all([
    db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", w.current.start)
      .lt("created_at", w.current.end)
      .is("archived_at", null),
    db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", w.previous.start)
      .lt("created_at", w.previous.end)
      .is("archived_at", null),
    db
      .from("opportunity_stage_events")
      .select("opportunity_id,to_stage,confirmed_value,occurred_at")
      .gte("occurred_at", w.previous.start)
      .order("occurred_at", { ascending: false })
      .limit(1000),
    db
      .from("opportunities")
      .select("id,stage")
      .is("archived_at", null)
      .limit(1000),
    db
      .from("projects")
      .select("id,name,status,due_on,organization_id")
      .is("archived_at", null)
      .order("due_on", { ascending: true })
      .limit(100),
    db
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "Concluída")
      .gte("completed_at", w.current.start)
      .lt("completed_at", w.current.end),
    db
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "Concluída")
      .gte("completed_at", w.previous.start)
      .lt("completed_at", w.previous.end),
    db
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("status", "Realizada")
      .gte("starts_at", w.current.start)
      .lt("starts_at", w.current.end),
    db
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("status", "Realizada")
      .gte("starts_at", w.previous.start)
      .lt("starts_at", w.previous.end),
    db
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "Pendente"),
    db
      .from("meeting_actions")
      .select("id", { count: "exact", head: true })
      .eq("status", "Pendente"),
    db
      .from("leads")
      .select("id,name,company,source,created_at")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("goals")
      .select("id,metric,target,period,starts_on,ends_on")
      .lte("starts_on", todayKey)
      .gte("ends_on", todayKey)
      .limit(20),
  ]);
  const stages = new Map(
    (opportunitiesResult.data || []).map((v) => [v.id, v.stage]),
  );
  const events = eventsResult.data || [];
  const winsNow = latestWonEvents(
    events,
    stages,
    w.current.start,
    w.current.end,
  );
  const winsPrev = latestWonEvents(
    events,
    stages,
    w.previous.start,
    w.previous.end,
  );
  const inProgress = (projectsResult.data || []).filter(
    (p) => p.status === "Em andamento",
  ).length;
  const overdue = (projectsResult.data || []).filter(
    (p) =>
      !["Concluído", "Cancelado"].includes(p.status) &&
      p.due_on &&
      p.due_on < todayKey,
  ).length;
  const cards = [
    {
      label: "Leads novos",
      value: String(leadsNow.count || 0),
      previous: leadsPrev.count || 0,
      icon: ContactRound,
      tone: "blue",
    },
    {
      label: "Oportunidades ganhas",
      value: String(winsNow.length),
      previous: winsPrev.length,
      icon: KanbanSquare,
      tone: "green",
    },
    {
      label: "Valor comercial ganho",
      value: brl(
        winsNow.reduce((sum, e) => sum + Number(e.confirmed_value || 0), 0),
      ),
      previous: brl(
        winsPrev.reduce((sum, e) => sum + Number(e.confirmed_value || 0), 0),
      ),
      icon: Building2,
      tone: "amber",
    },
    {
      label: "Tarefas concluídas",
      value: String(tasksNow.count || 0),
      previous: tasksPrev.count || 0,
      icon: CheckCheck,
      tone: "violet",
    },
    {
      label: "Reuniões realizadas",
      value: String(meetingsNow.count || 0),
      previous: meetingsPrev.count || 0,
      icon: CalendarDays,
      tone: "blue",
    },
  ];
  const goals = await Promise.all(
    (goalsResult.data || []).map(async (goal) => {
      const start = localMidnightUtc(goal.starts_on, "America/Sao_Paulo");
      const end = new Date().toISOString();
      let actual = 0;
      if (goal.metric === "Leads novos") {
        const r = await db
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start)
          .lte("created_at", end)
          .is("archived_at", null);
        actual = r.count || 0;
      }
      if (goal.metric === "Tarefas concluídas") {
        const r = await db
          .from("project_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "Concluída")
          .gte("completed_at", start)
          .lte("completed_at", end);
        actual = r.count || 0;
      }
      if (goal.metric === "Reuniões realizadas") {
        const r = await db
          .from("meetings")
          .select("id", { count: "exact", head: true })
          .eq("status", "Realizada")
          .gte("starts_at", start)
          .lte("starts_at", end);
        actual = r.count || 0;
      }
      if (
        goal.metric === "Oportunidades ganhas" ||
        goal.metric === "Valor ganho"
      ) {
        const r = await db
          .from("opportunity_stage_events")
          .select("opportunity_id,to_stage,confirmed_value,occurred_at")
          .gte("occurred_at", start)
          .lte("occurred_at", end)
          .order("occurred_at", { ascending: false })
          .limit(1000);
        const wins = latestWonEvents(r.data || [], stages, start, end);
        actual =
          goal.metric === "Oportunidades ganhas"
            ? wins.length
            : wins.reduce((sum, e) => sum + Number(e.confirmed_value || 0), 0);
      }
      return { ...goal, actual };
    }),
  );
  return (
    <>
      <PageHeading
        eyebrow="VISÃO GERAL / SEMANA COMPLETA"
        title={`Bom dia, ${profile.name.split(" ")[0]}.`}
        description="Veja o que avançou e onde sua atenção faz diferença."
        action={{ href: "/leads/novo", label: "+ Novo lead" }}
      />
      <div className="period-note">
        <span className="period-dot" /> Dados de {dateBr(w.current.start)} a{" "}
        {dateBr(new Date(new Date(w.current.end).getTime() - 1).toISOString())}{" "}
        · comparação com os 7 dias anteriores
      </div>
      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-top">
              <span>{card.label}</span>
              <span className={`stat-icon ${card.tone}`}>
                <card.icon size={20} strokeWidth={1.7} />
              </span>
            </div>
            <strong>{card.value}</strong>
            <small>Período anterior: {card.previous}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="surface detail-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ACOMPANHAMENTO</span>
                <h2>Projetos que pedem atenção</h2>
              </div>
              <Link href="/projetos" className="subtle-link">
                Ver projetos <ArrowUpRight size={15} />
              </Link>
            </div>
            {!projectsResult.data?.length ? (
              <p className="muted">Nenhum projeto criado ainda.</p>
            ) : (
              <div className="compact-list">
                {projectsResult.data
                  .filter(
                    (p) => p.status !== "Concluído" && p.status !== "Cancelado",
                  )
                  .slice(0, 5)
                  .map((p) => (
                    <Link href={`/projetos/${p.id}`} key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <small>Prazo: {p.due_on || "a definir"}</small>
                      </div>
                      <Status>{p.status}</Status>
                    </Link>
                  ))}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ATIVIDADE RECENTE</span>
                <h2>Novos contatos</h2>
              </div>
              <Link href="/leads" className="subtle-link">
                Ver todos <ArrowUpRight size={15} />
              </Link>
            </div>
            {!latestLeads.data?.length ? (
              <p className="muted">A jornada começa com o primeiro lead.</p>
            ) : (
              <div className="compact-list">
                {latestLeads.data.map((lead) => (
                  <Link href={`/leads/${lead.id}`} key={lead.id}>
                    <div>
                      <strong>{lead.name}</strong>
                      <small>{lead.company || lead.source}</small>
                    </div>
                    <span className="muted">{dateBr(lead.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="surface detail-section">
            <span className="eyebrow">SITUAÇÃO ATUAL</span>
            <h2>Em foco</h2>
            <div className="focus-row">
              <span>Projetos em andamento</span>
              <strong>{inProgress}</strong>
            </div>
            <div className="focus-row">
              <span>Projetos atrasados</span>
              <strong>{overdue}</strong>
            </div>
            <div className="focus-row">
              <span>Aprovações pendentes</span>
              <strong>{approvalResult.count || 0}</strong>
            </div>
            <div className="focus-row">
              <span>Encaminhamentos pendentes</span>
              <strong>{actionResult.count || 0}</strong>
            </div>
          </section>
          <section className="surface detail-section">
            <span className="eyebrow">METAS GERAIS</span>
            <h2>Resultado no período</h2>
            {!goals.length ? (
              <p className="muted">Meta não cadastrada.</p>
            ) : (
              goals.map((goal) => (
                <div className="goal-row" key={goal.id}>
                  <strong>{goal.metric}</strong>
                  <span>
                    {goal.metric === "Valor ganho"
                      ? brl(goal.actual)
                      : goal.actual}{" "}
                    /{" "}
                    {goal.metric === "Valor ganho"
                      ? brl(goal.target)
                      : goal.target}
                  </span>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.min(100, Math.round((goal.actual / Number(goal.target)) * 100))}%`,
                      }}
                    />
                  </div>
                  <small>
                    {Math.round((goal.actual / Number(goal.target)) * 100)}% ·{" "}
                    {goal.period.toLowerCase()}
                  </small>
                </div>
              ))
            )}
          </section>
          <section className="quick-panel">
            <span className="eyebrow light">ATALHO RÁPIDO</span>
            <h2>Da conversa à entrega, sem perder o fio.</h2>
            <p>
              Registre cada novo contato e acompanhe sua evolução no pipeline.
            </p>
            <Link href="/pipeline">
              Abrir pipeline <ArrowUpRight size={16} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
