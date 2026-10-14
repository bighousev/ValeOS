"use client";

import { useState } from "react";

export function ExternalApprovalForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [decision, setDecision] = useState("Aprovado");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/approval-links/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, decision, comment }),
      });
      if (response.ok) {
        setDone(true);
        setMessage("Sua decisão foi registrada. Obrigado!");
      } else
        setMessage(
          "Não foi possível registrar. Verifique os dados ou solicite um novo link à equipe.",
        );
    } catch {
      setMessage("Não foi possível conectar. Tente novamente.");
    }
    setBusy(false);
  }
  if (done)
    return (
      <div className="notice success" role="status">
        {message}
      </div>
    );
  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        Seu nome *
        <input
          required
          minLength={2}
          maxLength={160}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Decisão
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option>Aprovado</option>
          <option>Ajustes solicitados</option>
        </select>
      </label>
      <label>
        Comentário {decision === "Ajustes solicitados" ? "*" : "(opcional)"}
        <textarea
          rows={4}
          required={decision === "Ajustes solicitados"}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button className="button primary" disabled={busy}>
        {busy ? "Registrando..." : "Enviar decisão"}
      </button>
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
