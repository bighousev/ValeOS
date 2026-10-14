import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeading, Status } from "@/components/ui";
import { CalendarPreview } from "@/components/calendar-preview";

export default async function MeetingsPage() {
  const { db } = await requireUser();
  const { data: meetings } = await db
    .from("meetings")
    .select(
      "id,title,starts_at,status,organizations(name),projects(name),meeting_actions(id,status)",
    )
    .order("starts_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageHeading
        eyebrow="OPERAÇÃO / REUNIÕES"
        title="Reuniões"
        description="Pautas, decisões e encaminhamentos com responsáveis claros."
        action={{ href: "/reunioes/novo", label: "+ Nova reunião" }}
      />
      <div className="surface">
        {!meetings?.length ? (
          <EmptyState
            title="Nenhuma reunião registrada"
            description="Crie uma reunião para registrar pautas e próximos passos."
            href="/reunioes/novo"
            label="Criar reunião"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reunião</th>
                  <th>Quando</th>
                  <th>Vínculo</th>
                  <th>Situação</th>
                  <th>Encaminhamentos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((item) => {
                  const org = Array.isArray(item.organizations)
                    ? item.organizations[0]
                    : item.organizations;
                  const project = Array.isArray(item.projects)
                    ? item.projects[0]
                    : item.projects;
                  return (
                    <tr key={item.id}>
                      <td>
                        <Link
                          className="table-link"
                          href={`/reunioes/${item.id}`}
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td>
                        {new Date(item.starts_at).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>{project?.name || org?.name || "Geral"}</td>
                      <td>
                        <Status>{item.status}</Status>
                      </td>
                      <td>
                        {item.meeting_actions?.filter(
                          (a) => a.status === "Pendente",
                        ).length || 0}{" "}
                        pendentes
                      </td>
                      <td>
                        <Link
                          className="row-arrow"
                          href={`/reunioes/${item.id}`}
                        >
                          ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <CalendarPreview />
    </>
  );
}
