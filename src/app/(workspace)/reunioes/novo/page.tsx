import Link from "next/link";
import { createMeeting } from "@/app/operations";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeading } from "@/components/ui";

export default async function NewMeeting({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const [{ data: organizations }, { data: projects }] = await Promise.all([
    db
      .from("organizations")
      .select("id,name")
      .is("archived_at", null)
      .order("name"),
    db.from("projects").select("id,name").is("archived_at", null).order("name"),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="REUNIÕES / NOVA"
        title="Agendar reunião"
        description="Reuniões gerais geram encaminhamentos; tarefas só aparecem quando um projeto é selecionado."
      />
      <Notice error={search.error} />
      <div className="surface form-surface">
        <form action={createMeeting} className="form-grid">
          <label>
            Título *<input name="title" required />
          </label>
          <label>
            Início *<input type="datetime-local" name="starts_at" required />
          </label>
          <label>
            Tipo
            <input name="kind" placeholder="Ex.: semanal, cliente" />
          </label>
          <label>
            Cliente
            <select name="organization_id">
              <option value="">Nenhum</option>
              {organizations?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Projeto
            <select name="project_id">
              <option value="">Reunião geral</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Participantes
            <input name="participants" placeholder="Nomes ou e-mails" />
          </label>
          <label className="full">
            Pauta
            <textarea name="agenda" rows={4} />
          </label>
          <div className="form-actions full">
            <Link href="/reunioes" className="button secondary">
              Cancelar
            </Link>
            <button className="button primary">Criar reunião</button>
          </div>
        </form>
      </div>
    </>
  );
}
