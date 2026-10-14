import { notFound } from "next/navigation";
import Link from "next/link";
import {
  addMeetingAction,
  completeMeetingAction,
  convertMeetingAction,
  updateMeeting,
} from "@/app/operations";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeading, Status } from "@/components/ui";

export default async function MeetingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { db, profile } = await requireUser();
  const [{ data: meeting }, { data: actions }, { data: users }] =
    await Promise.all([
      db.from("meetings").select("*").eq("id", id).single(),
      db
        .from("meeting_actions")
        .select("id,description,owner_id,due_on,status,task_id")
        .eq("meeting_id", id)
        .order("created_at"),
      db.from("profiles").select("id,name").eq("active", true).order("name"),
    ]);
  if (!meeting) notFound();
  const { data: phases } = meeting.project_id
    ? await db
        .from("project_phases")
        .select("id,name")
        .eq("project_id", meeting.project_id)
        .order("position")
    : { data: [] };
  return (
    <>
      <PageHeading
        eyebrow="REUNIÕES / REGISTRO"
        title={meeting.title}
        description={new Date(meeting.starts_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          dateStyle: "full",
          timeStyle: "short",
        })}
      />
      <Notice error={search.error} />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Registro da reunião</h2>
              <Status>{meeting.status}</Status>
            </div>
            <div className="field-list">
              <div>
                <span>Participantes</span>
                <strong>{meeting.participants || "—"}</strong>
              </div>
              <div>
                <span>Tipo</span>
                <strong>{meeting.kind || "—"}</strong>
              </div>
            </div>
            <div className="description-block">
              <span>Pauta</span>
              <p>{meeting.agenda || "Sem pauta registrada."}</p>
            </div>
            {meeting.project_id && (
              <Link
                className="subtle-link"
                href={`/projetos/${meeting.project_id}`}
              >
                Ver projeto relacionado ↗
              </Link>
            )}
          </section>
          <section className="surface detail-section">
            <h2>Encaminhamentos</h2>
            {!actions?.length ? (
              <p className="muted">Nenhum encaminhamento registrado.</p>
            ) : (
              <div className="action-list">
                {actions.map((action) => (
                  <div className="action-row" key={action.id}>
                    <div>
                      <strong>{action.description}</strong>
                      <small>
                        Responsável:{" "}
                        {users?.find((u) => u.id === action.owner_id)?.name ||
                          "Não definido"}{" "}
                        · prazo {action.due_on || "a definir"}
                      </small>
                      {action.task_id && (
                        <Link
                          className="subtle-link"
                          href={`/projetos/${meeting.project_id}`}
                        >
                          Tarefa criada no projeto ↗
                        </Link>
                      )}
                    </div>
                    <Status>
                      {action.task_id ? "Convertido em tarefa" : action.status}
                    </Status>
                    {action.status === "Pendente" && !action.task_id && (
                      <div className="action-buttons">
                        <form action={completeMeetingAction}>
                          <input type="hidden" name="meeting_id" value={id} />
                          <input
                            type="hidden"
                            name="action_id"
                            value={action.id}
                          />
                          <button className="button secondary">Concluir</button>
                        </form>
                        {meeting.project_id && !!phases?.length && (
                          <form action={convertMeetingAction}>
                            <input type="hidden" name="meeting_id" value={id} />
                            <input
                              type="hidden"
                              name="action_id"
                              value={action.id}
                            />
                            <select
                              name="phase_id"
                              aria-label="Fase da nova tarefa"
                            >
                              {phases.map((phase) => (
                                <option key={phase.id} value={phase.id}>
                                  {phase.name}
                                </option>
                              ))}
                            </select>
                            <button className="button secondary">
                              Criar tarefa
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="surface detail-section">
            <h2>Ata e decisões</h2>
            <form action={updateMeeting} className="stack-form">
              <input type="hidden" name="meeting_id" value={id} />
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
                  rows={5}
                  defaultValue={meeting.minutes || ""}
                />
              </label>
              <label>
                Decisões
                <textarea
                  name="decisions"
                  rows={4}
                  defaultValue={meeting.decisions || ""}
                />
              </label>
              <button className="button primary">Salvar reunião</button>
            </form>
          </section>
          <section className="surface detail-section">
            <h2>Novo encaminhamento</h2>
            <form action={addMeetingAction} className="stack-form">
              <input type="hidden" name="meeting_id" value={id} />
              <label>
                Descrição
                <textarea name="description" rows={3} required />
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
                <input type="date" name="due_on" />
              </label>
              <button className="button secondary">
                Adicionar encaminhamento
              </button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
