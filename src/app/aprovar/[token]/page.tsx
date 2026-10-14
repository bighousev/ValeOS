import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeExternalUrl } from "@/lib/format";
import { ExternalApprovalForm } from "@/components/external-approval-form";

export const dynamic = "force-dynamic";

export default async function ExternalApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let request: {
    status: string;
    expires_at: string;
    version: number;
    deliverable_id: string;
  } | null = null;
  let deliverable: {
    title: string;
    description: string | null;
    document_url: string | null;
    version: number;
    status: string;
  } | null = null;
  if (
    /^[A-Za-z0-9_-]{43}$/.test(token) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const admin = createAdminClient();
    const hash = createHash("sha256").update(token).digest("hex");
    const { data } = await admin
      .from("approval_requests")
      .select("status,expires_at,version,deliverable_id")
      .eq("token_hash", hash)
      .eq("kind", "Externa")
      .single();
    if (
      data &&
      data.status === "Pendente" &&
      new Date(data.expires_at) > new Date()
    ) {
      request = data;
      const result = await admin
        .from("deliverables")
        .select("title,description,document_url,version,status")
        .eq("id", data.deliverable_id)
        .single();
      if (
        result.data &&
        result.data.version === data.version &&
        result.data.status === "Em aprovação externa"
      )
        deliverable = result.data;
    }
  }
  return (
    <main className="external-screen">
      <header>
        <div className="brand">
          <span className="brand-mark">V</span> ValeOS
        </div>
        <span>Revisão de entrega</span>
      </header>
      <section className="external-card">
        {!request || !deliverable ? (
          <>
            <span className="eyebrow">LINK INDISPONÍVEL</span>
            <h1>Esta aprovação não está disponível.</h1>
            <p>
              O link pode ter expirado, sido revogado ou já ter recebido uma
              resposta. Solicite um novo link à equipe responsável.
            </p>
          </>
        ) : (
          <>
            <span className="eyebrow">
              APROVAÇÃO EXTERNA · VERSÃO {deliverable.version}
            </span>
            <h1>{deliverable.title}</h1>
            <p>
              {deliverable.description ||
                "Revise a entrega e registre sua decisão abaixo."}
            </p>
            {safeExternalUrl(deliverable.document_url) && (
              <a
                href={safeExternalUrl(deliverable.document_url)!}
                className="button secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir documento ↗
              </a>
            )}
            <div className="external-divider" />
            <ExternalApprovalForm token={token} />
            <small>
              Seu nome é uma declaração. Esta aprovação não equivale a
              assinatura eletrônica qualificada.
            </small>
          </>
        )}
      </section>
      <footer>ValeOS · acesso limitado a esta solicitação</footer>
    </main>
  );
}
