import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateBr } from "@/lib/format";
import { EmptyState, Notice, PageHeading, Status } from "@/components/ui";
import { PAGE_SIZE, Pagination, pageNumber } from "@/components/pagination";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 100);
  const page = pageNumber(search.page);
  let query = db
    .from("leads")
    .select(
      "id,name,email,phone,company,source,created_at,possible_duplicate_id,opportunities(stage)",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: leads, error, count } = await query;
  return (
    <>
      <PageHeading
        eyebrow="COMERCIAL / PROSPECÇÃO"
        title="Leads"
        description="Cada conversa começa aqui. Acompanhe origem, contato e próximos passos."
        action={{ href: "/leads/novo", label: "+ Novo lead" }}
      />
      <Notice
        error={
          search.error ||
          (error ? "Não foi possível carregar os leads." : undefined)
        }
      />
      <div className="surface">
        <div className="surface-toolbar">
          <div>
            <strong>Leads cadastrados</strong>
            <span>{count || 0} encontrados</span>
          </div>
          <form className="search-form">
            <input
              aria-label="Buscar leads"
              name="q"
              placeholder="Buscar por nome"
              defaultValue={q}
            />
            <button className="button secondary">Buscar</button>
          </form>
        </div>
        {!leads?.length ? (
          <EmptyState
            title="Nenhum lead por aqui"
            description="Cadastre o primeiro contato ou conecte um formulário por webhook."
            href="/leads/novo"
            label="Cadastrar lead"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome / contato</th>
                  <th>Empresa</th>
                  <th>Origem</th>
                  <th>Etapa</th>
                  <th>Entrada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <Link className="table-link" href={`/leads/${lead.id}`}>
                        {lead.name}
                      </Link>
                      <small>
                        {lead.email || lead.phone}
                        {lead.possible_duplicate_id && (
                          <span className="duplicate-mark">
                            {" "}
                            · Possível duplicata
                          </span>
                        )}
                      </small>
                    </td>
                    <td>{lead.company || "—"}</td>
                    <td>{lead.source}</td>
                    <td>
                      <Status>
                        {Array.isArray(lead.opportunities)
                          ? lead.opportunities[0]?.stage || "Novo lead"
                          : "Novo lead"}
                      </Status>
                    </td>
                    <td>{dateBr(lead.created_at)}</td>
                    <td>
                      <Link
                        className="row-arrow"
                        href={`/leads/${lead.id}`}
                        aria-label={`Abrir ${lead.name}`}
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          path="/leads"
          page={page}
          count={count || 0}
          filters={q ? { q } : {}}
        />
      </div>
    </>
  );
}
