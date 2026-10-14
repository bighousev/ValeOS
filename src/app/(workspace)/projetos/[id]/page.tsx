import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addDependency,
  addDeliverable,
  addPhase,
  addTask,
  changeProjectStatus,
  decideInternal,
  removeDependency,
  requestInternal,
  reviseDeliverable,
  revokeExternalApproval,
  updateTask,
} from "@/app/operations";
import { requireUser } from "@/lib/auth";
import { ExternalLinkButton } from "@/components/external-link-button";
import { Notice, PageHeading, Status } from "@/components/ui";
import { safeExternalUrl } from "@/lib/format";

export default async function ProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { db, profile } = await requireUser();
  const [
    { data: project },
    { data: phases },
    { data: tasks },
    { data: dependencies },
    { data: deliverables },
    { data: users },
  ] = await Promise.all([
    db
      .from("projects")
      .select("*,organizations(id,name)")
      .eq("id", id)
      .is("archived_at", null)
      .single(),
    db
      .from("project_phases")
      .select("id,name,position,status")
      .eq("project_id", id)
      .order("position"),
    db
      .from("project_tasks")
      .select("id,title,status,priority,due_on,phase_id,owner_id,completed_at")
      .eq("project_id", id)
      .order("created_at"),
    db
      .from("task_dependencies")
      .select("predecessor_id,successor_id")
      .eq("project_id", id),
    db
      .from("deliverables")
      .select(
        "id,title,description,document_url,version,status,required,phase_id",
      )
      .eq("project_id", id)
      .order("created_at"),
    db.from("profiles").select("id,name").eq("active", true).order("name"),
  ]);
  if (!project) notFound();
  const { data: approvals } = deliverables?.length
    ? await db
        .from("approval_requests")
        .select(
          "id,deliverable_id,version,kind,status,created_at,expires_at,requested_by",
        )
        .in(
          "deliverable_id",
          deliverables.map((deliverable) => deliverable.id),
        )
        .order("created_at", { ascending: false })
    : { data: [] };
  const organization = Array.isArray(project.organizations)
    ? project.organizations[0]
    : project.organizations;
  const eligible = (tasks || []).filter((t) => t.status !== "Cancelada");
  const done = eligible.filter((t) => t.status === "Concluída").length;
  const progress = eligible.length
    ? Math.round((done / eligible.length) * 100)
    : 0;
  return (
    <>
      <PageHeading
        eyebrow="PROJETOS / EXECUÇÃO"
        title={project.name}
        description={`${organization?.name || "Cliente"} · prazo ${project.due_on || "a definir"}`}
      />
      <Notice error={search.error} />
      <div className="project-top">
        <div className="surface detail-section">
          <div className="section-heading">
            <h2>Progresso das tarefas</h2>
            <strong>{progress}%</strong>
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="muted">
            {done} de {eligible.length} tarefas elegíveis concluídas. A entrega
            depende das aprovações obrigatórias.
          </p>
        </div>
        <div className="surface detail-section">
          <h2>Situação</h2>
          <form action={changeProjectStatus} className="status-form">
            <input type="hidden" name="project_id" value={id} />
            <select name="status" defaultValue={project.status}>
              {[
                "Planejado",
                "Em andamento",
                "Pausado",
                "Em aprovação",
                "Concluído",
                "Cancelado",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="button secondary">Atualizar</button>
          </form>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PLANO DE EXECUÇÃO</span>
                <h2>Fases e tarefas</h2>
              </div>
              <span className="muted">{tasks?.length || 0} tarefas</span>
            </div>
            {phases?.map((phase) => (
              <div className="phase-block" key={phase.id}>
                <div className="phase-heading">
                  <strong>
                    {phase.position.toString().padStart(2, "0")} · {phase.name}
                  </strong>
                  <Status>{phase.status}</Status>
                </div>
                {!tasks?.some((t) => t.phase_id === phase.id) ? (
                  <p className="muted">Nenhuma tarefa nesta fase.</p>
                ) : (
                  <div className="task-list">
                    {tasks
                      ?.filter((t) => t.phase_id === phase.id)
                      .map((task) => {
                        const blockedBy =
                          dependencies
                            ?.filter((d) => d.successor_id === task.id)
                            .map(
                              (d) =>
                                tasks.find((t) => t.id === d.predecessor_id)
                                  ?.title,
                            )
                            .filter(Boolean) || [];
                        return (
                          <div className="task-row" key={task.id}>
                            <div>
                              <strong>{task.title}</strong>
                              <small>
                                {task.due_on
                                  ? `Prazo ${task.due_on}`
                                  : "Sem prazo"}
                                {blockedBy.length
                                  ? ` · depende de ${blockedBy.join(", ")}`
                                  : ""}
                              </small>
                            </div>
                            <form action={updateTask}>
                              <input
                                type="hidden"
                                name="project_id"
                                value={id}
                              />
                              <input
                                type="hidden"
                                name="task_id"
                                value={task.id}
                              />
                              <select
                                name="status"
                                aria-label={`Situação de ${task.title}`}
                                defaultValue={task.status}
                              >
                                {[
                                  "A fazer",
                                  "Em andamento",
                                  "Bloqueada",
                                  "Concluída",
                                  "Cancelada",
                                ].map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                              <button className="button secondary">
                                Salvar
                              </button>
                            </form>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </section>
          <section className="surface detail-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CONTROLE DE ENTREGA</span>
                <h2>Entregáveis e aprovações</h2>
              </div>
            </div>
            {!deliverables?.length ? (
              <p className="muted">Nenhum entregável cadastrado.</p>
            ) : (
              <div className="deliverable-list">
                {deliverables.map((item) => {
                  const active = approvals?.find(
                    (r) =>
                      r.deliverable_id === item.id &&
                      r.version === item.version &&
                      r.status === "Pendente",
                  );
                  return (
                    <article className="deliverable-card" key={item.id}>
                      <div className="section-heading">
                        <div>
                          <strong>{item.title}</strong>
                          <small>
                            Versão {item.version} ·{" "}
                            {item.required ? "Obrigatório" : "Opcional"}
                          </small>
                        </div>
                        <Status>{item.status}</Status>
                      </div>
                      {item.description && <p>{item.description}</p>}
                      {safeExternalUrl(item.document_url) && (
                        <a
                          className="subtle-link"
                          href={safeExternalUrl(item.document_url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir documento ↗
                        </a>
                      )}
                      <div className="deliverable-actions">
                        {item.status === "Rascunho" && (
                          <form action={requestInternal}>
                            <input type="hidden" name="project_id" value={id} />
                            <input
                              type="hidden"
                              name="deliverable_id"
                              value={item.id}
                            />
                            <button className="button secondary">
                              Solicitar aprovação interna
                            </button>
                          </form>
                        )}
                        {active?.kind === "Interna" && (
                          <form
                            action={decideInternal}
                            className="approval-form"
                          >
                            <input type="hidden" name="project_id" value={id} />
                            <input
                              type="hidden"
                              name="request_id"
                              value={active.id}
                            />
                            <textarea
                              name="comment"
                              placeholder="Comentário obrigatório para ajustes"
                              rows={2}
                            />
                            <div>
                              <button
                                className="button secondary"
                                name="decision"
                                value="Ajustes solicitados"
                              >
                                Pedir ajustes
                              </button>
                              <button
                                className="button primary"
                                name="decision"
                                value="Aprovado"
                              >
                                Aprovar internamente
                              </button>
                            </div>
                          </form>
                        )}
                        {item.status === "Aprovado internamente" && (
                          <ExternalLinkButton deliverableId={item.id} />
                        )}
                        {item.status === "Em aprovação externa" && (
                          <>
                            <span className="muted">
                              Aguardando decisão externa até{" "}
                              {active?.expires_at
                                ? new Date(
                                    active.expires_at,
                                  ).toLocaleDateString("pt-BR")
                                : "o vencimento"}
                              .
                            </span>
                            {active && (
                              <form action={revokeExternalApproval}>
                                <input
                                  type="hidden"
                                  name="project_id"
                                  value={id}
                                />
                                <input
                                  type="hidden"
                                  name="request_id"
                                  value={active.id}
                                />
                                <button className="button secondary">
                                  Revogar link
                                </button>
                              </form>
                            )}
                          </>
                        )}
                        {["Revisão", "Aprovado"].includes(item.status) && (
                          <form
                            action={reviseDeliverable}
                            className="revision-form"
                          >
                            <input type="hidden" name="project_id" value={id} />
                            <input
                              type="hidden"
                              name="deliverable_id"
                              value={item.id}
                            />
                            <input
                              type="url"
                              name="document_url"
                              placeholder="URL da nova versão"
                              defaultValue={item.document_url || ""}
                            />
                            <input
                              name="description"
                              placeholder="Descrição da revisão"
                              defaultValue={item.description || ""}
                            />
                            <button className="button secondary">
                              Publicar nova versão
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="surface detail-section">
            <h2>Adicionar tarefa</h2>
            <form action={addTask} className="stack-form">
              <input type="hidden" name="project_id" value={id} />
              <label>
                Título
                <input name="title" required />
              </label>
              <label>
                Fase
                <select name="phase_id" required>
                  {phases?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsável
                <select name="owner_id" defaultValue={profile.id}>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prazo
                <input name="due_on" type="date" />
              </label>
              <label>
                Prioridade
                <select name="priority">
                  <option>Média</option>
                  <option>Baixa</option>
                  <option>Alta</option>
                </select>
              </label>
              <button className="button primary">Adicionar tarefa</button>
            </form>
            <form action={addPhase} className="stack-form separator">
              <input type="hidden" name="project_id" value={id} />
              <h3>Nova fase</h3>
              <input name="name" placeholder="Nome da fase" required />
              <button className="button secondary">Adicionar fase</button>
            </form>
          </section>
          <section className="surface detail-section">
            <h2>Dependências</h2>
            <p className="muted">
              A tarefa sucessora só pode ser concluída quando a predecessora
              estiver concluída.
            </p>
            <form action={addDependency} className="stack-form">
              <input type="hidden" name="project_id" value={id} />
              <label>
                Predecessora
                <select name="predecessor_id">
                  {tasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sucessora
                <select name="successor_id">
                  {tasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button secondary">
                Adicionar dependência
              </button>
            </form>
            {!!dependencies?.length && (
              <div className="dependency-list">
                {dependencies.map((dep) => (
                  <div key={`${dep.predecessor_id}-${dep.successor_id}`}>
                    <small>
                      {tasks?.find((t) => t.id === dep.predecessor_id)?.title} →{" "}
                      {tasks?.find((t) => t.id === dep.successor_id)?.title}
                    </small>
                    <form action={removeDependency}>
                      <input type="hidden" name="project_id" value={id} />
                      <input
                        type="hidden"
                        name="predecessor_id"
                        value={dep.predecessor_id}
                      />
                      <input
                        type="hidden"
                        name="successor_id"
                        value={dep.successor_id}
                      />
                      <button className="text-button">Remover</button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <h2>Novo entregável</h2>
            <form action={addDeliverable} className="stack-form">
              <input type="hidden" name="project_id" value={id} />
              <label>
                Título
                <input name="title" required />
              </label>
              <label>
                Fase
                <select name="phase_id">
                  {phases?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Documento externo
                <input name="document_url" type="url" placeholder="https://" />
              </label>
              <label>
                Descrição
                <textarea name="description" rows={3} />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="required" defaultChecked />
                Obrigatório para concluir
              </label>
              <button className="button primary">Adicionar entregável</button>
            </form>
          </section>
          <Link
            href={`/clientes/${project.organization_id}`}
            className="button secondary"
          >
            Ver ficha do cliente ↗
          </Link>
        </aside>
      </div>
    </>
  );
}
