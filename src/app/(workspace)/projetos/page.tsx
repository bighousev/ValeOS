import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeading, Status } from "@/components/ui";
import { PAGE_SIZE, Pagination, pageNumber } from "@/components/pagination";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { db } = await requireUser();
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 100);
  const status = [
    "Planejado",
    "Em andamento",
    "Pausado",
    "Em aprovação",
    "Concluído",
    "Cancelado",
  ].includes(search.status || "")
    ? search.status || ""
    : "";
  const page = pageNumber(search.page);
  let query = db
    .from("projects")
    .select(
      "id,name,status,priority,due_on,organizations(name),project_tasks(id,status)",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", `%${q}%`);
  if (status) query = query.eq("status", status);
  const { data: projects, count } = await query;
  return (
    <>
      <PageHeading
        eyebrow="ENTREGA / PROJETOS"
        title="Projetos"
        description="Fases, tarefas e aprovações conectadas ao cliente."
        action={{ href: "/projetos/novo", label: "+ Novo projeto" }}
      />
      <div className="surface">
        <div className="surface-toolbar">
          <div>
            <strong>Projetos</strong>
            <span>{count || 0} encontrados</span>
          </div>
          <form className="search-form wide">
            <input
              name="q"
              aria-label="Buscar projetos"
              placeholder="Buscar projeto"
              defaultValue={q}
            />
            <select
              name="status"
              aria-label="Filtrar situação"
              defaultValue={status}
            >
              <option value="">Todas as situações</option>
              {[
                "Planejado",
                "Em andamento",
                "Pausado",
                "Em aprovação",
                "Concluído",
                "Cancelado",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button className="button secondary">Filtrar</button>
          </form>
        </div>
        {!projects?.length ? (
          <EmptyState
            title="Nenhum projeto ainda"
            description="Projetos são criados manualmente e sempre vinculados a um cliente."
            href="/projetos/novo"
            label="Criar projeto"
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Situação</th>
                  <th>Prioridade</th>
                  <th>Progresso de tarefas</th>
                  <th>Prazo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const tasks = project.project_tasks || [];
                  const eligible = tasks.filter(
                    (t) => t.status !== "Cancelada",
                  );
                  const done = eligible.filter(
                    (t) => t.status === "Concluída",
                  ).length;
                  const org = Array.isArray(project.organizations)
                    ? project.organizations[0]
                    : project.organizations;
                  return (
                    <tr key={project.id}>
                      <td>
                        <Link
                          href={`/projetos/${project.id}`}
                          className="table-link"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td>{org?.name || "—"}</td>
                      <td>
                        <Status>{project.status}</Status>
                      </td>
                      <td>{project.priority}</td>
                      <td>
                        {eligible.length
                          ? Math.round((done / eligible.length) * 100)
                          : 0}
                        %
                      </td>
                      <td>{project.due_on || "—"}</td>
                      <td>
                        <Link
                          className="row-arrow"
                          href={`/projetos/${project.id}`}
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
          path="/projetos"
          page={page}
          count={count || 0}
          filters={{ ...(q ? { q } : {}), ...(status ? { status } : {}) }}
        />
      </div>
    </>
  );
}
