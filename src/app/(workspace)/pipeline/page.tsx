import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/format";
import { stages } from "@/lib/validation";
import { EmptyState, PageHeading, Status } from "@/components/ui";

export default async function PipelinePage() {
  const { db } = await requireUser();
  const { data: opportunities } = await db
    .from("opportunities")
    .select(
      "id,title,stage,estimated_value,created_at,leads(name,company,source)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeading
        eyebrow="COMERCIAL / OPORTUNIDADES"
        title="Pipeline"
        description="Uma visão simples das oportunidades em cada etapa."
        action={{ href: "/leads/novo", label: "+ Novo lead" }}
      />
      {!opportunities?.length ? (
        <div className="surface">
          <EmptyState
            title="Pipeline vazio"
            description="Oportunidades são criadas quando um novo lead entra."
            href="/leads/novo"
            label="Cadastrar lead"
          />
        </div>
      ) : (
        <div className="kanban">
          {stages.map((stage) => {
            const cards = opportunities.filter((item) => item.stage === stage);
            return (
              <section className="kanban-column" key={stage}>
                <div className="kanban-heading">
                  <Status>{stage}</Status>
                  <span>{cards.length}</span>
                </div>
                <div className="kanban-cards">
                  {cards.map((item) => {
                    const lead = Array.isArray(item.leads)
                      ? item.leads[0]
                      : item.leads;
                    return (
                      <Link
                        className="opportunity-card"
                        href={`/pipeline/${item.id}`}
                        key={item.id}
                      >
                        <strong>{item.title}</strong>
                        <span>
                          {lead?.company || lead?.name || "Sem empresa"}
                        </span>
                        <div>
                          <small>{lead?.source || "Comercial"}</small>
                          <b>
                            {item.estimated_value == null
                              ? "Valor a definir"
                              : brl(item.estimated_value)}
                          </b>
                        </div>
                      </Link>
                    );
                  })}
                  {!cards.length && (
                    <p className="kanban-empty">Nenhuma oportunidade</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
