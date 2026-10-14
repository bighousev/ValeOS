import Link from "next/link";
import { notFound } from "next/navigation";
import { moveOpportunity } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { brl, dateBr } from "@/lib/format";
import { Notice, PageHeading, Status } from "@/components/ui";
import { stages } from "@/lib/validation";

export default async function OpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { db } = await requireUser();
  const [{ data: opportunity }, { data: events }, { data: organizations }] =
    await Promise.all([
      db
        .from("opportunities")
        .select("*,leads(id,name,company,email,phone)")
        .eq("id", id)
        .is("archived_at", null)
        .single(),
      db
        .from("opportunity_stage_events")
        .select("id,from_stage,to_stage,confirmed_value,occurred_at")
        .eq("opportunity_id", id)
        .order("occurred_at", { ascending: false }),
      db
        .from("organizations")
        .select("id,name")
        .is("archived_at", null)
        .order("name"),
    ]);
  if (!opportunity) notFound();
  const lead = Array.isArray(opportunity.leads)
    ? opportunity.leads[0]
    : opportunity.leads;
  return (
    <>
      <PageHeading
        eyebrow="PIPELINE / OPORTUNIDADE"
        title={opportunity.title}
        description={`${lead?.name || "Contato"} · criada em ${dateBr(opportunity.created_at)}`}
      />
      <Notice error={search.error} />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Resumo comercial</h2>
              <Status>{opportunity.stage}</Status>
            </div>
            <div className="field-list">
              <div>
                <span>Valor</span>
                <strong>
                  {opportunity.estimated_value == null
                    ? "A definir"
                    : brl(opportunity.estimated_value)}
                </strong>
              </div>
              <div>
                <span>Contato</span>
                <strong>{lead?.name || "—"}</strong>
              </div>
              <div>
                <span>Empresa informada</span>
                <strong>{lead?.company || "—"}</strong>
              </div>
              <div>
                <span>Fechamento</span>
                <strong>{dateBr(opportunity.closed_at)}</strong>
              </div>
            </div>
            {lead?.id && (
              <Link href={`/leads/${lead.id}`} className="button secondary">
                Ver histórico do lead ↗
              </Link>
            )}
            {opportunity.organization_id && (
              <Link
                href={`/clientes/${opportunity.organization_id}`}
                className="button secondary"
              >
                Ver ficha do cliente ↗
              </Link>
            )}
          </section>
          <section className="surface detail-section">
            <h2>Histórico de etapas</h2>
            {!events?.length ? (
              <p className="muted">Ainda não houve movimentações.</p>
            ) : (
              <div className="timeline">
                {events.map((event) => (
                  <div className="timeline-item" key={event.id}>
                    <span className="timeline-dot" />
                    <div>
                      <div className="timeline-top">
                        <strong>
                          {event.from_stage} → {event.to_stage}
                        </strong>
                        <time>{dateBr(event.occurred_at)}</time>
                      </div>
                      {event.confirmed_value != null && (
                        <small>
                          Valor confirmado: {brl(event.confirmed_value)}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="surface detail-section">
            <h2>Mover oportunidade</h2>
            <p className="muted">Cada mudança fica registrada no histórico.</p>
            <form action={moveOpportunity} className="stack-form">
              <input type="hidden" name="id" value={id} />
              <label>
                Nova etapa
                <select name="stage" defaultValue={opportunity.stage}>
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
              <label>
                Valor confirmado (BRL)
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={opportunity.estimated_value || ""}
                  placeholder="Obrigatório ao ganhar"
                />
              </label>
              <label>
                Vincular cliente existente
                <select
                  name="organization_id"
                  defaultValue={opportunity.organization_id || ""}
                >
                  <option value="">Selecione ou crie abaixo</option>
                  {organizations?.map((org) => (
                    <option value={org.id} key={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ou criar cliente com nome
                <input
                  name="new_org_name"
                  defaultValue={lead?.company || ""}
                  placeholder="Empresa"
                />
              </label>
              <label>
                Motivo da perda
                <textarea
                  name="loss_reason"
                  rows={3}
                  placeholder="Obrigatório ao marcar Perdido"
                />
              </label>
              <button className="button primary">Salvar etapa</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
