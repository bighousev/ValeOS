"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const { error } = await createClient().auth.updateUser({ password });
    setMessage(
      error
        ? "Link inválido ou expirado. Solicite um novo."
        : "Senha atualizada. Você já pode entrar.",
    );
  }
  return (
    <main className="simple-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">V</span> ValeOS
        </div>
        <h1>Definir nova senha</h1>
        <form onSubmit={submit}>
          <label>
            Nova senha
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="button primary">Salvar senha</button>
        </form>
        {message && <p role="status">{message}</p>}
      </div>
    </main>
  );
}
