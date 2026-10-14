import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addContact,
  addContract,
  addExternalLink,
  addService,
} from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { brl, dateBr, safeExternalUrl } from "@/lib/format";
import { Notice, PageHeading, Status } from "@/components/ui";

export default async function ClientDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { db } = await requireUser();
  const [
    { data: org },
    { data: contacts },
    { data: opportunities },
    { data: projects },
    { data: contracts },
    { data: services },
    { data: links },
  ] = await Promise.all([
    db
      .from("organizations")
      .select("*")
      .eq("id", id)
      .is("archived_at", null)
      .single(),
    db
      .from("contacts")
      .select("*")
      .eq("organization_id", id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    db
      .from("opportunities")
      .select("id,title,stage,estimated_value,updated_at")
      .eq("organization_id", id)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    db
      .from("projects")
      .select("id,name,status,due_on")
      .eq("organization_id", id)
      .is("archived_at", null),
    db
      .from("contracts")
      .select("id,title,status,document_url,starts_on,ends_on")
      .eq("organization_id", id),
    db
      .from("services")
      .select("id,description,status")
      .eq("organization_id", id),
    db
      .from("external_links")
      .select("id,label,url,category")
      .eq("organization_id", id),
  ]);
  if (!org) notFound();
  return (
    <>
      <PageHeading
        eyebrow="CLIENTES / FICHA 360°"
        title={org.name}
        description={`${org.segment || "Empresa"} · relacionamento: ${org.relationship_status}`}
      />
      <Notice error={search.error} />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <h2>Visão geral</h2>
            <div className="field-list">
              <div>
                <span>CNPJ</span>
                <strong>{org.tax_id || "—"}</strong>
              </div>
              <div>
                <span>Site</span>
                <strong>
                  {safeExternalUrl(org.website) ? (
                    <a
                      href={safeExternalUrl(org.website)!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir site ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </strong>
              </div>
              <div>
                <span>Segmento</span>
                <strong>{org.segment || "—"}</strong>
              </div>
              <div>
                <span>Desde</span>
                <strong>{dateBr(org.created_at)}</strong>
              </div>
            </div>
            {org.description && <p>{org.description}</p>}
          </section>
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Oportunidades</h2>
              <span className="muted">{opportunities?.length || 0}</span>
            </div>
            {!opportunities?.length ? (
              <p className="muted">Nenhuma oportunidade vinculada.</p>
            ) : (
              <div className="compact-list">
                {opportunities.map((item) => (
                  <Link href={`/pipeline/${item.id}`} key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{brl(item.estimated_value)}</small>
                    </div>
                    <Status>{item.stage}</Status>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <div className="section-heading">
              <h2>Projetos</h2>
              <span className="muted">{projects?.length || 0}</span>
            </div>
            {!projects?.length ? (
              <p className="muted">Nenhum projeto vinculado.</p>
            ) : (
              <div className="compact-list">
                {projects.map((item) => (
                  <Link href={`/projetos/${item.id}`} key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>Prazo: {item.due_on || "a definir"}</small>
                    </div>
                    <Status>{item.status}</Status>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <h2>Serviços e contratos</h2>
            {!services?.length && !contracts?.length ? (
              <p className="muted">Nenhum serviço ou contrato registrado.</p>
            ) : (
              <div className="compact-list">
                {services?.map((item) => (
                  <div key={item.id}>
                    <strong>{item.description}</strong>
                    <Status>{item.status}</Status>
                  </div>
                ))}
                {contracts?.map((item) => (
                  <div key={item.id}>
                    <strong>{item.title}</strong>
                    <Status>{item.status}</Status>
                    {safeExternalUrl(item.document_url) && (
                      <a
                        href={safeExternalUrl(item.document_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Documento ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="surface detail-section">
            <h2>Links</h2>
            {!links?.length ? (
              <p className="muted">Nenhum link registrado.</p>
            ) : (
              <div className="compact-list">
                {links.map(
                  (item) =>
                    safeExternalUrl(item.url) && (
                      <a
                        href={safeExternalUrl(item.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={item.id}
                      >
                        {item.label} ↗
                      </a>
                    ),
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="detail-side">
          <section className="surface detail-section">
            <h2>Contatos</h2>
            {!contacts?.length ? (
              <p className="muted">Nenhum contato.</p>
            ) : (
              <div className="contact-list">
                {contacts.map((contact) => (
                  <div key={contact.id}>
                    <strong>{contact.name}</strong>
                    <small>{contact.role || "Contato"}</small>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    )}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                ))}
              </div>
            )}
            <form action={addContact} className="stack-form separator">
              <input type="hidden" name="organization_id" value={id} />
              <h3>Adicionar contato</h3>
              <label>
                Nome
                <input name="name" required />
              </label>
              <label>
                E-mail
                <input type="email" name="email" />
              </label>
              <label>
                Telefone
                <input name="phone" />
              </label>
              <label>
                Papel
                <input name="role" placeholder="Ex.: Diretor" />
              </label>
              <button className="button primary">Salvar contato</button>
            </form>
          </section>
          <section className="surface detail-section">
            <h2>Adicionar serviço</h2>
            <form action={addService} className="stack-form">
              <input type="hidden" name="organization_id" value={id} />
              <label>
                Descrição
                <input name="description" required />
              </label>
              <label>
                Situação
                <select name="status">
                  <option>Ativo</option>
                  <option>Planejado</option>
                  <option>Encerrado</option>
                </select>
              </label>
              <label>
                Início
                <input type="date" name="starts_on" />
              </label>
              <button className="button secondary">Salvar serviço</button>
            </form>
          </section>
          <section className="surface detail-section">
            <h2>Adicionar contrato</h2>
            <form action={addContract} className="stack-form">
              <input type="hidden" name="organization_id" value={id} />
              <label>
                Título
                <input name="title" required />
              </label>
              <label>
                Situação
                <select name="status">
                  <option>Vigente</option>
                  <option>Em negociação</option>
                  <option>Encerrado</option>
                </select>
              </label>
              <label>
                Início
                <input type="date" name="starts_on" />
              </label>
              <label>
                Fim
                <input type="date" name="ends_on" />
              </label>
              <label>
                URL do documento
                <input type="url" name="document_url" />
              </label>
              <button className="button secondary">Salvar contrato</button>
            </form>
          </section>
          <section className="surface detail-section">
            <h2>Adicionar link</h2>
            <form action={addExternalLink} className="stack-form">
              <input type="hidden" name="organization_id" value={id} />
              <label>
                Rótulo
                <input name="label" required />
              </label>
              <label>
                URL
                <input type="url" name="url" required />
              </label>
              <label>
                Categoria
                <input name="category" />
              </label>
              <button className="button secondary">Salvar link</button>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
