"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error)
        setMessage("Não foi possível entrar. Confira seu e-mail e senha.");
      else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setMessage("A autenticação ainda não está configurada.");
    }
    setLoading(false);
  }

  async function reset() {
    if (!email) {
      setMessage("Informe seu e-mail para recuperar o acesso.");
      return;
    }
    setLoading(true);
    try {
      await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/confirm`,
      });
      setMessage(
        "Se o endereço estiver cadastrado, enviaremos instruções de recuperação.",
      );
    } catch {
      setMessage("Não foi possível enviar as instruções.");
    }
    setLoading(false);
  }

  return (
    <main className="auth-screen">
      <section className="auth-intro">
        <div className="brand">
          <span className="brand-mark">V</span> ValeOS
        </div>
        <div>
          <span className="eyebrow light">SUA OPERAÇÃO, EM UMA VISÃO</span>
          <h1>
            Clareza para cada
            <br />
            <em>próximo passo.</em>
          </h1>
          <p>
            Da primeira conversa ao projeto entregue, toda a equipe segue o
            mesmo caminho.
          </p>
        </div>
        <small>Plataforma interna · acesso restrito</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">BEM-VINDO DE VOLTA</span>
          <h2>Entrar no ValeOS</h2>
          <p>
            Use o convite recebido pela equipe para acessar sua área de
            trabalho.
          </p>
          <form onSubmit={login}>
            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="button primary" disabled={loading}>
              {loading ? "Aguarde..." : "Entrar"}
            </button>
          </form>
          <button className="text-button" onClick={reset} disabled={loading}>
            Esqueceu a senha?
          </button>
          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
