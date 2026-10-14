import Link from "next/link";
import { createProject } from "@/app/operations";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeading } from "@/components/ui";

export default async function NewProject({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; organization_id?: string }>;
}) {
  const { db, profile } = await requireUser();
  const search = await searchParams;
  const [{ data: organizations }, { data: users }, { data: opportunities }] =
    await Promise.all([
      db
        .from("organizations")
        .select("id,name")
        .is("archived_at", null)
        .order("name"),
      db.from("profiles").select("id,name").eq("active", true).order("name"),
      db
        .from("opportunities")
        .select("id,title,organization_id")
        .eq("stage", "Ganho")
        .is("archived_at", null),
    ]);
  return (
    <>
      <PageHeading
        eyebrow="PROJETOS / NOVO"
        title="Criar projeto"
        description="Escolha o cliente e o responsável. A fase de planejamento será criada automaticamente."
      />
      <Notice error={search.error} />
      <div className="surface form-surface">
        <form action={createProject} className="form-grid">
          <label>
            Cliente *
            <select
              name="organization_id"
              required
              defaultValue={search.organization_id || ""}
            >
              <option value="">Selecione</option>
              {organizations?.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nome do projeto *<input name="name" required />
          </label>
          <label>
            Responsável *
            <select name="owner_id" defaultValue={profile.id}>
              {users?.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo final
            <input name="due_on" type="date" />
          </label>
          <label>
            Oportunidade ganha (opcional)
            <select name="opportunity_id">
              <option value="">Nenhuma</option>
              {opportunities?.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Descrição
            <textarea name="description" rows={4} />
          </label>
          <div className="form-actions full">
            <Link href="/projetos" className="button secondary">
              Cancelar
            </Link>
            <button className="button primary">Criar projeto</button>
          </div>
        </form>
      </div>
    </>
  );
}
