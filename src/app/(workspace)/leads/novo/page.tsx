import Link from "next/link";
import { createLead } from "@/app/actions";
import { Notice, PageHeading } from "@/components/ui";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeading
        eyebrow="PROSPECÇÃO / NOVO LEAD"
        title="Registrar contato"
        description="Nome e pelo menos um meio de contato são obrigatórios."
      />
      <Notice error={error} />
      <div className="surface form-surface">
        <form action={createLead} className="form-grid">
          <label>
            Nome do contato *
            <input
              name="name"
              required
              minLength={2}
              placeholder="Nome e sobrenome"
            />
          </label>
          <label>
            Empresa
            <input name="company" placeholder="Nome da empresa" />
          </label>
          <label>
            E-mail
            <input type="email" name="email" placeholder="nome@empresa.com" />
          </label>
          <label>
            Telefone
            <input type="tel" name="phone" placeholder="+55 (11) 99999-9999" />
          </label>
          <label>
            Origem *
            <select name="source" defaultValue="Manual">
              <option>Manual</option>
              <option>Site</option>
              <option>Indicação</option>
              <option>WhatsApp</option>
              <option>Outro</option>
            </select>
          </label>
          <label className="full">
            Interesse / contexto
            <textarea
              name="interest"
              rows={4}
              placeholder="O que motivou este contato?"
            />
          </label>
          <div className="form-actions full">
            <Link href="/leads" className="button secondary">
              Cancelar
            </Link>
            <button className="button primary">Salvar lead</button>
          </div>
        </form>
      </div>
    </>
  );
}
