import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/format";
import { stages } from "@/lib/validation";
import { EmptyState, PageHeading, Status } from "@/components/ui";
import { PAGE_SIZE, Pagination, pageNumber } from "@/components/pagination";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; page?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 100);
  const stage = stages.includes(search.stage as (typeof stages)[number])
    ? search.stage || ""
    : "";
  const page = pageNumber(search.page);
  let query = db
    .from("opportunities")
    .select(
      "id,title,stage,estimated_value,created_at,leads(name,company,source)",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("title", `%${q}%`);
  if (stage) query = query.eq("stage", stage);
  const { data: opportunities, count } = await query;
  return (
    <>
      <PageHeading
        eyebrow="COMERCIAL / OPORTUNIDADES"
        title="Pipeline"
        description="Uma visão simples das oportunidades em cada etapa."
        action={{ href: "/leads/novo", label: "+ Novo lead" }}
      />
      <section className="surface pipeline-filter">
        <div className="surface-toolbar">
          <div>
            <strong>Oportunidades</strong>
            <span>{count || 0} encontradas</span>
          </div>
          <form className="search-form wide">
            <input
              name="q"
              aria-label="Buscar oportunidades"
              placeholder="Buscar oportunidade"
              defaultValue={q}
            />
            <select
              name="stage"
              aria-label="Filtrar etapa"
              defaultValue={stage}
            >
              <option value="">Todas as etapas</option>
              {stages.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="button secondary">Filtrar</button>
          </form>
        </div>
      </section>
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
      <Pagination
        path="/pipeline"
        page={page}
        count={count || 0}
        filters={{ ...(q ? { q } : {}), ...(stage ? { stage } : {}) }}
      />
    </>
  );
}
