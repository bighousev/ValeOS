import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeading } from "@/components/ui";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { db } = await requireUser();
  const { q: raw = "" } = await searchParams;
  const q = raw.trim().slice(0, 80);
  const pattern = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const [organizations, contacts, leads, opportunities, projects] =
    q.length >= 2
      ? await Promise.all([
          db
            .from("organizations")
            .select("id,name")
            .is("archived_at", null)
            .ilike("name", pattern)
            .order("name")
            .limit(10),
          db
            .from("contacts")
            .select("id,name,organization_id,organizations(name)")
            .ilike("name", pattern)
            .order("name")
            .limit(10),
          db
            .from("leads")
            .select("id,name,company")
            .is("archived_at", null)
            .ilike("name", pattern)
            .order("created_at", { ascending: false })
            .limit(10),
          db
            .from("opportunities")
            .select("id,title,stage")
            .is("archived_at", null)
            .ilike("title", pattern)
            .order("created_at", { ascending: false })
            .limit(10),
          db
            .from("projects")
            .select("id,name,status")
            .is("archived_at", null)
            .ilike("name", pattern)
            .order("created_at", { ascending: false })
            .limit(10),
        ])
      : [null, null, null, null, null];

  const groups = [
    {
      title: "Empresas",
      items: organizations?.data?.map((item) => ({
        id: item.id,
        name: item.name,
        detail: "Cliente",
        href: `/clientes/${item.id}`,
      })),
    },
    {
      title: "Contatos",
      items: contacts?.data?.map((item) => ({
        id: item.id,
        name: item.name,
        detail: "Contato da empresa",
        href: `/clientes/${item.organization_id}`,
      })),
    },
    {
      title: "Leads",
      items: leads?.data?.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.company || "Lead",
        href: `/leads/${item.id}`,
      })),
    },
    {
      title: "Oportunidades",
      items: opportunities?.data?.map((item) => ({
        id: item.id,
        name: item.title,
        detail: item.stage,
        href: `/pipeline/${item.id}`,
      })),
    },
    {
      title: "Projetos",
      items: projects?.data?.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.status,
        href: `/projetos/${item.id}`,
      })),
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE / PESQUISA"
        title="Busca"
        description="Encontre empresas, contatos, leads, oportunidades e projetos."
      />
      <section className="surface detail-section">
        <form className="search-form">
          <input
            aria-label="Termo de busca"
            name="q"
            minLength={2}
            maxLength={80}
            placeholder="Digite ao menos duas letras"
            defaultValue={q}
            required
          />
          <button className="button secondary">Buscar</button>
        </form>
      </section>
      {q.length >= 2 &&
        groups.map((group) => (
          <section className="surface detail-section" key={group.title}>
            <h2>{group.title}</h2>
            {!group.items?.length ? (
              <p className="muted">Nenhum resultado nesta categoria.</p>
            ) : (
              <div className="compact-list">
                {group.items.map((item) => (
                  <Link href={item.href} key={item.id}>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
    </>
  );
}
