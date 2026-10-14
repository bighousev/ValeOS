import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeading, Status } from "@/components/ui";
import { CalendarPreview } from "@/components/calendar-preview";
import { PAGE_SIZE, Pagination, pageNumber } from "@/components/pagination";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 100);
  const status = ["Agendada", "Realizada", "Cancelada"].includes(
    search.status || "",
  )
    ? search.status || ""
    : "";
  const page = pageNumber(search.page);
  let query = db
    .from("meetings")
    .select(
      "id,title,starts_at,status,organizations(name),projects(name),meeting_actions(id,status)",
      { count: "exact" },
    )
    .order("starts_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("title", `%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: meetings, count } = await query;
  return (
    <>
      <PageHeading
        eyebrow="OPERAÇÃO / REUNIÕES"
        title="Reuniões"
        description="Pautas, decisões e encaminhamentos com responsáveis claros."
        action={{ href: "/reunioes/novo", label: "+ Nova reunião" }}
      />
      <div className="surface">
        <div className="surface-toolbar">
          <div>
            <strong>Reuniões</strong>
            <span>{count || 0} encontradas</span>
          </div>
          <form className="search-form wide">
            <input
              name="q"
              aria-label="Buscar reuniões"
              placeholder="Buscar reunião"
              defaultValue={q}
            />
            <select
              name="status"
              aria-label="Filtrar situação"
              defaultValue={status}
            >
              <option value="">Todas as situações</option>
              {["Agendada", "Realizada", "Cancelada"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="button secondary">Filtrar</button>
          </form>
        </div>
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
        <Pagination
          path="/reunioes"
          page={page}
          count={count || 0}
          filters={{ ...(q ? { q } : {}), ...(status ? { status } : {}) }}
        />
      </div>
      <CalendarPreview />
    </>
  );
}
