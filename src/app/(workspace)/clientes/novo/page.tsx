import Link from "next/link";
import { createOrganization } from "@/app/actions";
import { Notice, PageHeading } from "@/components/ui";

export default async function NewOrganization({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeading
        eyebrow="CLIENTES / NOVA EMPRESA"
        title="Cadastrar empresa"
        description="Crie uma ficha para manter contatos, oportunidades e projetos juntos."
      />
      <Notice error={error} />
      <div className="surface form-surface">
        <form action={createOrganization} className="form-grid">
          <label>
            Nome da empresa *<input name="name" required minLength={2} />
          </label>
          <label>
            CNPJ
            <input name="tax_id" />
          </label>
          <label>
            Segmento
            <input name="segment" />
          </label>
          <label>
            Site
            <input name="website" type="url" placeholder="https://" />
          </label>
          <label className="full">
            Descrição
            <textarea name="description" rows={4} />
          </label>
          <div className="form-actions full">
            <Link href="/clientes" className="button secondary">
              Cancelar
            </Link>
            <button className="button primary">Salvar empresa</button>
          </div>
        </form>
      </div>
    </>
  );
}
