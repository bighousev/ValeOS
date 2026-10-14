import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateBr } from "@/lib/format";
import { EmptyState, PageHeading } from "@/components/ui";

export default async function ClientsPage() {
  const { db } = await requireUser();
  const { data: organizations } = await db
    .from("organizations")
    .select(
      "id,name,segment,relationship_status,created_at,contacts(count),opportunities(count),projects(count)",
    )
    .is("archived_at", null)
    .order("name")
    .limit(100);
  return (
    <>
      <PageHeading
        eyebrow="RELACIONAMENTO / CLIENTES"
        title="Clientes"
        description="Empresas, contatos e histórico em uma única ficha."
        action={{ href: "/clientes/novo", label: "+ Nova empresa" }}
      />
      <div className="surface">
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
      </div>
    </>
  );
}
