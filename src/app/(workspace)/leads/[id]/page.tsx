import Link from "next/link";
import { notFound } from "next/navigation";
import { addInteraction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { dateBr, phoneDigits } from "@/lib/format";
import { Notice, PageHeading, Status } from "@/components/ui";

export default async function LeadDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { db } = await requireUser();
  const [{ data: lead }, { data: opportunities }, { data: interactions }] =
    await Promise.all([
      db
        .from("leads")
        .select("*")
        .eq("id", id)
        .is("archived_at", null)
        .single(),
      db
        .from("opportunities")
        .select("id,title,stage,estimated_value,organization_id")
        .eq("lead_id", id)
        .limit(1),
      db
        .from("interactions")
        .select("id,kind,summary,next_action,occurred_at")
        .eq("lead_id", id)
        .order("occurred_at", { ascending: false })
        .limit(30),
    ]);
  if (!lead) notFound();
  const opportunity = opportunities?.[0];
  const whatsapp = phoneDigits(lead.phone);
  return (
    <>
      <PageHeading
        eyebrow="PROSPECÇÃO / DETALHE"
        title={lead.name}
        description={`${lead.company || "Sem empresa"} · entrada em ${dateBr(lead.created_at)}`}
        action={
          opportunity
            ? {
                href: `/pipeline/${opportunity.id}`,
                label: "Ver oportunidade ↗",
              }
            : undefined
        }
      />
      <Notice error={search.error} />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Visão geral</h2>
              <Status>{opportunity?.stage || "Novo lead"}</Status>
            </div>
            {lead.possible_duplicate_id && (
              <div className="notice warning">
                Este contato pode já existir.{" "}
                <Link href={`/leads/${lead.possible_duplicate_id}`}>
                  Comparar com o cadastro anterior
                </Link>
                .
              </div>
            )}
            <div className="field-list">
              <div>
                <span>E-mail</span>
                <strong>{lead.email || "—"}</strong>
              </div>
              <div>
                <span>Telefone</span>
                <strong>{lead.phone || "—"}</strong>
              </div>
              <div>
                <span>Origem</span>
                <strong>{lead.source}</strong>
              </div>
              <div>
                <span>Responsável</span>
                <strong>
                  {lead.owner_id ? "Equipe ValeOS" : "Não atribuído"}
                </strong>
              </div>
            </div>
            {lead.interest && (
              <div className="description-block">
                <span>Interesse</span>
                <p>{lead.interest}</p>
              </div>
            )}
            <div className="inline-actions">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button secondary"
                >
                  Abrir WhatsApp ↗
                </a>
              )}
              {lead.organization_id && (
                <Link
                  className="button secondary"
                  href={`/clientes/${lead.organization_id}`}
                >
                  Ver cliente
                </Link>
              )}
            </div>
          </section>
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Histórico de interações</h2>
              <span className="muted">
                {interactions?.length || 0} registros
              </span>
            </div>
            {!interactions?.length ? (
              <p className="muted">Nenhuma interação registrada até agora.</p>
            ) : (
              <div className="timeline">
                {interactions.map((item) => (
                  <div className="timeline-item" key={item.id}>
                    <span className="timeline-dot" />
                    <div>
                      <div className="timeline-top">
                        <strong>{item.kind}</strong>
                        <time>{dateBr(item.occurred_at)}</time>
                      </div>
                      <p>{item.summary}</p>
                      {item.next_action && (
                        <small>Próxima ação: {item.next_action}</small>
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
            <h2>Registrar interação</h2>
            <p className="muted">
              Mantenha o contexto da relação acessível à equipe.
            </p>
            <form action={addInteraction} className="stack-form">
              <input type="hidden" name="lead_id" value={id} />
              <label>
                Tipo
                <select name="kind">
                  <option>Nota</option>
                  <option>WhatsApp</option>
                  <option>Ligação</option>
                  <option>E-mail</option>
                  <option>Reunião</option>
                </select>
              </label>
              <label>
                Resumo
                <textarea
                  name="summary"
                  required
                  minLength={2}
                  rows={4}
                  placeholder="O que aconteceu?"
                />
              </label>
              <label>
                Próxima ação
                <input name="next_action" placeholder="Opcional" />
              </label>
              <button className="button primary">Adicionar ao histórico</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
