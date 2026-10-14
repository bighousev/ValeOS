import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeading, Status } from "@/components/ui";

export default async function ProjectsPage() {
  const { db } = await requireUser();
  const { data: projects } = await db
    .from("projects")
    .select(
      "id,name,status,priority,due_on,organizations(name),project_tasks(id,status)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <>
      <PageHeading
        eyebrow="ENTREGA / PROJETOS"
        title="Projetos"
        description="Fases, tarefas e aprovações conectadas ao cliente."
        action={{ href: "/projetos/novo", label: "+ Novo projeto" }}
      />
      <div className="surface">
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
      </div>
    </>
  );
}
