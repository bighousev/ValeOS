"use client";

import { useState } from "react";

export function ExternalLinkButton({
  deliverableId,
}: {
  deliverableId: string;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function issue() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/deliverables/${deliverableId}/external-link`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const body = await response.json();
      if (!response.ok)
        setError(body.error || "Não foi possível gerar o link.");
      else setLink(body.url);
    } catch {
      setError("Não foi possível gerar o link.");
    }
    setBusy(false);
  }
  return (
    <div className="link-issuer">
      <button
        className="button secondary"
        type="button"
        onClick={issue}
        disabled={busy}
      >
        {busy ? "Gerando..." : "Gerar link externo"}
      </button>
      {link && (
        <div className="issued-link">
          <input aria-label="Link de aprovação" readOnly value={link} />
          <button
            type="button"
            className="button secondary"
            onClick={() => navigator.clipboard.writeText(link)}
          >
            Copiar
          </button>
          <small>Copie agora. O link não será exibido novamente.</small>
        </div>
      )}
      {error && (
        <p className="form-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
