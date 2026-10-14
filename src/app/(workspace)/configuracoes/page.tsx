import { inviteUser } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { Notice, PageHeading, Status } from "@/components/ui";
import { createGoal } from "@/app/operations";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { db, profile } = await requireUser();
  const search = await searchParams;
  const { data: users } = profile.is_admin
    ? await db
        .from("profiles")
        .select("id,name,email,active,is_admin")
        .order("name")
    : { data: [] };
  const { data: goals } = await db
    .from("goals")
    .select("id,metric,period,starts_on,ends_on,target")
    .order("starts_on", { ascending: false })
    .limit(20);
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE / CONFIGURAÇÕES"
        title="Configurações"
        description="Identidade da equipe, metas e integrações técnicas."
      />
      <Notice
        error={search.error}
        ok={
          search.ok === "convite"
            ? "Convite enviado."
            : search.ok === "meta"
              ? "Meta cadastrada."
              : undefined
        }
      />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface detail-section">
            <h2>Minha conta</h2>
            <div className="field-list">
              <div>
                <span>Nome</span>
                <strong>{profile.name}</strong>
              </div>
              <div>
                <span>E-mail</span>
                <strong>{profile.email}</strong>
              </div>
              <div>
                <span>Perfil</span>
                <strong>
                  {profile.is_admin ? "Administrador técnico" : "Colaborador"}
                </strong>
              </div>
              <div>
                <span>Fuso</span>
                <strong>America/Sao_Paulo</strong>
              </div>
            </div>
          </section>
          <section className="surface detail-section">
            <h2>Metas gerais</h2>
            {!goals?.length ? (
              <p className="muted">Meta não cadastrada.</p>
            ) : (
              <div className="compact-list">
                {goals.map((goal) => (
                  <div key={goal.id}>
                    <div>
                      <strong>{goal.metric}</strong>
                      <small>
                        {goal.period} · {goal.starts_on} a {goal.ends_on}
                      </small>
                    </div>
                    <b>{goal.target}</b>
                  </div>
                ))}
              </div>
            )}
          </section>
          {profile.is_admin && (
            <section className="surface detail-section">
              <h2>Equipe convidada</h2>
              <div className="compact-list">
                {users?.map((user) => (
                  <div key={user.id}>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <Status>
                      {user.active
                        ? user.is_admin
                          ? "Admin técnico"
                          : "Ativo"
                        : "Inativo"}
                    </Status>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="detail-side">
          <section className="surface detail-section">
            <h2>Nova meta</h2>
            <form action={createGoal} className="stack-form">
              <label>
                Indicador
                <select name="metric">
                  <option>Leads novos</option>
                  <option>Oportunidades ganhas</option>
                  <option>Valor ganho</option>
                  <option>Tarefas concluídas</option>
                  <option>Reuniões realizadas</option>
                </select>
              </label>
              <label>
                Periodicidade
                <select name="period">
                  <option>Semanal</option>
                  <option>Mensal</option>
                </select>
              </label>
              <label>
                Início
                <input type="date" name="starts_on" required />
              </label>
              <label>
                Fim
                <input type="date" name="ends_on" required />
              </label>
              <label>
                Alvo
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="target"
                  required
                />
              </label>
              <button className="button primary">Salvar meta</button>
            </form>
          </section>
          {profile.is_admin && (
            <>
              <section className="surface detail-section">
                <h2>Convidar colaborador</h2>
                <p className="muted">
                  Somente contas convidadas e ativadas podem acessar os dados.
                </p>
                <form action={inviteUser} className="stack-form">
                  <label>
                    Nome
                    <input name="name" required />
                  </label>
                  <label>
                    E-mail
                    <input name="email" type="email" required />
                  </label>
                  <button className="button primary">Enviar convite</button>
                </form>
              </section>
              <section className="surface detail-section">
                <h2>Integrações</h2>
                <p className="muted">
                  Configure chaves no ambiente do servidor. Nenhum segredo é
                  mostrado aqui.
                </p>
                <div className="compact-list">
                  <div>
                    <strong>Google Calendar</strong>
                    <Status>
                      {process.env.GOOGLE_CALENDAR_ID
                        ? "Configurado"
                        : "Pendente"}
                    </Status>
                  </div>
                  <div>
                    <strong>Webhook de leads</strong>
                    <Status>
                      {process.env.WEBHOOK_SECRET ? "Configurado" : "Pendente"}
                    </Status>
                  </div>
                </div>
              </section>
              <section className="surface detail-section">
                <h2>Dados do ValeOS</h2>
                <p className="muted">
                  Baixe uma cópia JSON dos registros operacionais. O arquivo
                  contém dados pessoais; guarde-o em local seguro.
                </p>
                <a className="button secondary" href="/api/admin/export">
                  Exportar dados
                </a>
              </section>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
