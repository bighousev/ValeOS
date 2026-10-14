import Link from "next/link";
import { markNotificationRead } from "@/app/operations";
import { requireUser } from "@/lib/auth";
import { dateBr } from "@/lib/format";
import { EmptyState, Notice, PageHeading } from "@/components/ui";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { db, profile } = await requireUser();
  const search = await searchParams;
  const { data: notifications } = await db
    .from("notifications")
    .select("id,kind,message,target_url,read_at,created_at")
    .or(`recipient_id.eq.${profile.id},recipient_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageHeading
        eyebrow="OPERAÇÃO / ALERTAS"
        title="Notificações"
        description="Condições que precisam da atenção da equipe."
      />
      <Notice error={search.error} />
      <div className="surface">
        {!notifications?.length ? (
          <EmptyState
            title="Tudo em dia"
            description="Os novos alertas aparecerão aqui."
          />
        ) : (
          <div className="notification-list">
            {notifications.map((item) => (
              <div
                className={`notification-item ${item.read_at ? "read" : ""}`}
                key={item.id}
              >
                <span className="notification-dot" />
                <div>
                  <small>
                    {item.kind} · {dateBr(item.created_at)}
                  </small>
                  <p>{item.message}</p>
                  <Link className="subtle-link" href={item.target_url}>
                    Abrir item ↗
                  </Link>
                </div>
                {!item.read_at && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="button secondary">Marcar lida</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
