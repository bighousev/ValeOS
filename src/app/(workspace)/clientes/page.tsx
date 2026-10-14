import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateBr } from "@/lib/format";
import { EmptyState, PageHeading } from "@/components/ui";
import { PAGE_SIZE, Pagination, pageNumber } from "@/components/pagination";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 100);
  const page = pageNumber(search.page);
  let query = db
    .from("organizations")
    .select(
      "id,name,segment,relationship_status,created_at,contacts(count),opportunities(count),projects(count)",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: organizations, count } = await query;
  return (
    <>
      <PageHeading
        eyebrow="RELACIONAMENTO / CLIENTES"
        title="Clientes"
        description="Empresas, contatos e histórico em uma única ficha."
        action={{ href: "/clientes/novo", label: "+ Nova empresa" }}
      />
      <div className="surface">
        <div className="surface-toolbar">
          <div>
            <strong>Empresas</strong>
            <span>{count || 0} encontradas</span>
          </div>
          <form className="search-form">
            <input
              name="q"
              aria-label="Buscar empresas"
              placeholder="Buscar empresa"
              defaultValue={q}
            />
            <button className="button secondary">Buscar</button>
          </form>
        </div>
        {!organizations?.length ? (
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Cadastre uma empresa ou converta uma oportunidade para começar."
            href="/clientes/novo"
            label="Cadastrar empresa"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Segmento</th>
                  <th>Contatos</th>
                  <th>Oportunidades</th>
                  <th>Projetos</th>
                  <th>Desde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <Link className="table-link" href={`/clientes/${org.id}`}>
                        {org.name}
                      </Link>
                      <small>{org.relationship_status}</small>
                    </td>
                    <td>{org.segment || "—"}</td>
                    <td>{org.contacts?.[0]?.count || 0}</td>
                    <td>{org.opportunities?.[0]?.count || 0}</td>
                    <td>{org.projects?.[0]?.count || 0}</td>
                    <td>{dateBr(org.created_at)}</td>
                    <td>
                      <Link className="row-arrow" href={`/clientes/${org.id}`}>
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
          path="/clientes"
          page={page}
          count={count || 0}
          filters={q ? { q } : {}}
        />
      </div>
    </>
  );
}
