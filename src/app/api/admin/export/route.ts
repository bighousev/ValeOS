import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tables = [
  ["profiles", "*"],
  ["organizations", "*"],
  ["contacts", "*"],
  ["leads", "*"],
  ["opportunities", "*"],
  ["opportunity_stage_events", "*"],
  ["interactions", "*"],
  ["contracts", "*"],
  ["services", "*"],
  ["projects", "*"],
  ["project_phases", "*"],
  ["project_tasks", "*"],
  ["task_dependencies", "*"],
  ["deliverables", "*"],
  [
    "approval_requests",
    "id,deliverable_id,version,kind,status,expires_at,decided_at,requested_by,created_at",
  ],
  ["approval_decisions", "*"],
  ["meetings", "*"],
  ["meeting_actions", "*"],
  ["goals", "*"],
  ["notifications", "*"],
  ["external_links", "*"],
  ["audit_logs", "*"],
] as const;

export async function GET() {
  const { db, profile } = await requireUser();
  if (!profile.is_admin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const exported: Record<string, unknown[]> = {};
  for (const [table, columns] of tables) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db
        .from(table)
        .select(columns)
        .range(offset, offset + 499);
      if (error)
        return NextResponse.json(
          { error: "Falha na exportação" },
          { status: 500 },
        );
      rows.push(...(data || []));
      if (!data || data.length < 500) break;
    }
    exported[table] = rows;
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(
    JSON.stringify({ exported_at: new Date().toISOString(), tables: exported }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="valeos-export-${date}.json"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
