import Link from "next/link";

export default function Setup() {
  return (
    <main className="simple-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">V</span> ValeOS
        </div>
        <h1>Preparando o ambiente</h1>
        <p>
          A aplicação está instalada. Configure as variáveis do Supabase e
          aplique as migrations para ativar o acesso.
        </p>
        <p>As etapas estão no README do projeto.</p>
        {process.env.NODE_ENV === "development" && (
          <div className="setup-demo">
            <p>
              Quer conhecer o sistema agora? Abra uma demonstração local com
              dados fictícios. Suas alterações ficam somente neste navegador.
            </p>
            <Link className="button primary" href="/demo">
              Abrir demonstração
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
