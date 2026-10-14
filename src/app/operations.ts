"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { z } from "zod";

const val = (form: FormData, key: string) => String(form.get(key) || "").trim();
const validId = (s: string) => z.uuid().safeParse(s).success;
function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createProject(form: FormData) {
  const { db, profile } = await requireUser();
  const organizationId = val(form, "organization_id");
  const name = val(form, "name");
  const ownerId = val(form, "owner_id") || profile.id;
  if (
    !validId(organizationId) ||
    !validId(ownerId) ||
    name.length < 2 ||
    name.length > 200
  )
    fail("/projetos/novo", "Informe cliente, responsável e nome do projeto.");
  const opportunityId = val(form, "opportunity_id");
  if (opportunityId && !validId(opportunityId))
    fail("/projetos/novo", "Oportunidade inválida.");
  const { data, error } = await db.rpc("create_project", {
    p_organization_id: organizationId,
    p_name: name,
    p_description: val(form, "description"),
    p_owner_id: ownerId,
    p_due_on: val(form, "due_on") || null,
    p_opportunity_id: opportunityId || null,
  });
  if (error || !data)
    fail("/projetos/novo", "Não foi possível criar o projeto.");
  revalidatePath("/projetos");
  redirect(`/projetos/${data}`);
}

export async function addPhase(form: FormData) {
  const { db } = await requireUser();
  const id = val(form, "project_id");
  const name = val(form, "name");
  if (!validId(id) || name.length < 2)
    fail("/projetos", "Dados da fase inválidos.");
  const { data: phases } = await db
    .from("project_phases")
    .select("position")
    .eq("project_id", id)
    .order("position", { ascending: false })
    .limit(1);
  const { error } = await db.from("project_phases").insert({
    project_id: id,
    name,
    position: (phases?.[0]?.position || 0) + 1,
  });
  if (error) fail(`/projetos/${id}`, "Não foi possível adicionar a fase.");
  revalidatePath(`/projetos/${id}`);
  redirect(`/projetos/${id}`);
}

export async function addTask(form: FormData) {
  const { db, profile } = await requireUser();
  const projectId = val(form, "project_id");
  const phaseId = val(form, "phase_id");
  const title = val(form, "title");
  const ownerId = val(form, "owner_id") || profile.id;
  if (
    ![projectId, phaseId, ownerId].every(validId) ||
    title.length < 2 ||
    title.length > 200
  )
    fail(
      `/projetos/${projectId}`,
      "Informe título, fase e responsável válidos.",
    );
  const { error } = await db.from("project_tasks").insert({
    project_id: projectId,
    phase_id: phaseId,
    title,
    owner_id: ownerId,
    description: val(form, "description") || null,
    due_on: val(form, "due_on") || null,
    priority: val(form, "priority") || "Média",
  });
  if (error) fail(`/projetos/${projectId}`, "Não foi possível criar a tarefa.");
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function updateTask(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const taskId = val(form, "task_id");
  const status = val(form, "status");
  if (
    ![projectId, taskId].every(validId) ||
    ![
      "A fazer",
      "Em andamento",
      "Bloqueada",
      "Concluída",
      "Cancelada",
    ].includes(status)
  )
    fail(`/projetos/${projectId}`, "Tarefa inválida.");
  const { error } = await db
    .from("project_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId);
  if (error)
    fail(
      `/projetos/${projectId}`,
      error.message.includes("dependência")
        ? "Conclua as tarefas predecessoras antes desta."
        : "Não foi possível atualizar a tarefa.",
    );
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function addDependency(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const predecessorId = val(form, "predecessor_id");
  const successorId = val(form, "successor_id");
  if (
    ![projectId, predecessorId, successorId].every(validId) ||
    predecessorId === successorId
  )
    fail(`/projetos/${projectId}`, "Selecione duas tarefas diferentes.");
  const { error } = await db.from("task_dependencies").insert({
    project_id: projectId,
    predecessor_id: predecessorId,
    successor_id: successorId,
  });
  if (error)
    fail(
      `/projetos/${projectId}`,
      "Dependência inválida ou circular. Verifique as tarefas.",
    );
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function removeDependency(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const predecessorId = val(form, "predecessor_id");
  const successorId = val(form, "successor_id");
  if (![projectId, predecessorId, successorId].every(validId))
    fail("/projetos", "Dependência inválida.");
  const { error } = await db.rpc("remove_task_dependency", {
    p_predecessor: predecessorId,
    p_successor: successorId,
  });
  if (error)
    fail(`/projetos/${projectId}`, "Não foi possível remover a dependência.");
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function addDeliverable(form: FormData) {
  const { db, profile } = await requireUser();
  const projectId = val(form, "project_id");
  const phaseId = val(form, "phase_id");
  const title = val(form, "title");
  if (![projectId, phaseId].every(validId) || title.length < 2)
    fail(`/projetos/${projectId}`, "Informe fase e título do entregável.");
  const documentUrl = val(form, "document_url");
  if (documentUrl && !/^https?:\/\//.test(documentUrl))
    fail(`/projetos/${projectId}`, "Use um link http ou https.");
  const { error } = await db.from("deliverables").insert({
    project_id: projectId,
    phase_id: phaseId,
    title,
    description: val(form, "description") || null,
    document_url: documentUrl || null,
    owner_id: profile.id,
    required: form.get("required") === "on",
  });
  if (error)
    fail(`/projetos/${projectId}`, "Não foi possível criar o entregável.");
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function requestInternal(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const id = val(form, "deliverable_id");
  if (![projectId, id].every(validId))
    fail("/projetos", "Entregável inválido.");
  const { error } = await db.rpc("request_internal_approval", {
    p_deliverable_id: id,
  });
  if (error)
    fail(
      `/projetos/${projectId}`,
      "Não foi possível solicitar a aprovação interna.",
    );
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function decideInternal(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const id = val(form, "request_id");
  const decision = val(form, "decision");
  if (
    ![projectId, id].every(validId) ||
    !["Aprovado", "Ajustes solicitados"].includes(decision)
  )
    fail("/projetos", "Solicitação inválida.");
  const { error } = await db.rpc("decide_internal_approval", {
    p_request_id: id,
    p_decision: decision,
    p_comment: val(form, "comment") || null,
  });
  if (error)
    fail(
      `/projetos/${projectId}`,
      error.message.includes("Outra pessoa")
        ? "Outra pessoa da equipe deve revisar esta entrega."
        : "Não foi possível registrar a decisão. Confira o comentário para ajustes.",
    );
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function reviseDeliverable(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const id = val(form, "deliverable_id");
  if (![projectId, id].every(validId))
    fail("/projetos", "Entregável inválido.");
  const url = val(form, "document_url");
  if (url && !/^https?:\/\//.test(url))
    fail(`/projetos/${projectId}`, "Use um link http ou https.");
  const { error } = await db.rpc("revise_deliverable", {
    p_deliverable_id: id,
    p_document_url: url || null,
    p_description: val(form, "description") || null,
  });
  if (error)
    fail(
      `/projetos/${projectId}`,
      "Não foi possível publicar uma nova versão.",
    );
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function revokeExternalApproval(form: FormData) {
  const { db } = await requireUser();
  const projectId = val(form, "project_id");
  const requestId = val(form, "request_id");
  if (![projectId, requestId].every(validId))
    fail("/projetos", "Solicitação inválida.");
  const { error } = await db.rpc("revoke_external_approval", {
    p_request_id: requestId,
  });
  if (error) fail(`/projetos/${projectId}`, "Não foi possível revogar o link.");
  revalidatePath(`/projetos/${projectId}`);
  redirect(`/projetos/${projectId}`);
}

export async function changeProjectStatus(form: FormData) {
  const { db } = await requireUser();
  const id = val(form, "project_id");
  const status = val(form, "status");
  if (
    !validId(id) ||
    ![
      "Planejado",
      "Em andamento",
      "Pausado",
      "Em aprovação",
      "Concluído",
      "Cancelado",
    ].includes(status)
  )
    fail("/projetos", "Projeto inválido.");
  const { error } = await db.from("projects").update({ status }).eq("id", id);
  if (error)
    fail(
      `/projetos/${id}`,
      "Não é possível concluir o projeto com tarefas ou aprovações pendentes.",
    );
  revalidatePath(`/projetos/${id}`);
  redirect(`/projetos/${id}`);
}

export async function createMeeting(form: FormData) {
  const { db } = await requireUser();
  const title = val(form, "title");
  const starts = val(form, "starts_at");
  const projectId = val(form, "project_id");
  const organizationId = val(form, "organization_id");
  if (
    title.length < 2 ||
    !starts ||
    Number.isNaN(Date.parse(starts)) ||
    (projectId && !validId(projectId)) ||
    (organizationId && !validId(organizationId))
  )
    fail("/reunioes/novo", "Informe título, início e vínculos válidos.");
  const { data, error } = await db
    .from("meetings")
    .insert({
      title,
      starts_at: new Date(starts).toISOString(),
      project_id: projectId || null,
      organization_id: organizationId || null,
      participants: val(form, "participants") || null,
      kind: val(form, "kind") || null,
      agenda: val(form, "agenda") || null,
    })
    .select("id")
    .single();
  if (error || !data)
    fail("/reunioes/novo", "Não foi possível criar a reunião.");
  revalidatePath("/reunioes");
  redirect(`/reunioes/${data.id}`);
}

export async function updateMeeting(form: FormData) {
  const { db } = await requireUser();
  const id = val(form, "meeting_id");
  const status = val(form, "status");
  if (!validId(id) || !["Agendada", "Realizada", "Cancelada"].includes(status))
    fail("/reunioes", "Reunião inválida.");
  const { error } = await db
    .from("meetings")
    .update({
      status,
      minutes: val(form, "minutes") || null,
      decisions: val(form, "decisions") || null,
    })
    .eq("id", id);
  if (error) fail(`/reunioes/${id}`, "Não foi possível atualizar a reunião.");
  revalidatePath(`/reunioes/${id}`);
  redirect(`/reunioes/${id}`);
}

export async function addMeetingAction(form: FormData) {
  const { db, profile } = await requireUser();
  const id = val(form, "meeting_id");
  const description = val(form, "description");
  const ownerId = val(form, "owner_id") || profile.id;
  if (![id, ownerId].every(validId) || description.length < 2)
    fail(`/reunioes/${id}`, "Informe encaminhamento e responsável.");
  const { error } = await db.from("meeting_actions").insert({
    meeting_id: id,
    description,
    owner_id: ownerId,
    due_on: val(form, "due_on") || null,
  });
  if (error)
    fail(`/reunioes/${id}`, "Não foi possível registrar o encaminhamento.");
  revalidatePath(`/reunioes/${id}`);
  redirect(`/reunioes/${id}`);
}

export async function completeMeetingAction(form: FormData) {
  const { db } = await requireUser();
  const meetingId = val(form, "meeting_id");
  const id = val(form, "action_id");
  if (![meetingId, id].every(validId))
    fail("/reunioes", "Encaminhamento inválido.");
  const { error } = await db
    .from("meeting_actions")
    .update({ status: "Concluído" })
    .eq("id", id)
    .eq("meeting_id", meetingId)
    .is("task_id", null);
  if (error)
    fail(
      `/reunioes/${meetingId}`,
      "Não foi possível concluir o encaminhamento.",
    );
  revalidatePath(`/reunioes/${meetingId}`);
  redirect(`/reunioes/${meetingId}`);
}

export async function convertMeetingAction(form: FormData) {
  const { db } = await requireUser();
  const meetingId = val(form, "meeting_id");
  const actionId = val(form, "action_id");
  const phaseId = val(form, "phase_id");
  if (![meetingId, actionId, phaseId].every(validId))
    fail(`/reunioes/${meetingId}`, "Selecione uma fase válida.");
  const { error } = await db.rpc("convert_meeting_action_to_task", {
    p_action_id: actionId,
    p_phase_id: phaseId,
  });
  if (error)
    fail(
      `/reunioes/${meetingId}`,
      "Não foi possível converter o encaminhamento.",
    );
  revalidatePath(`/reunioes/${meetingId}`);
  redirect(`/reunioes/${meetingId}`);
}

export async function markNotificationRead(form: FormData) {
  const { db } = await requireUser();
  const id = val(form, "id");
  if (!validId(id)) fail("/notificacoes", "Notificação inválida.");
  const { error } = await db.rpc("mark_notification_read", { p_id: id });
  if (error) fail("/notificacoes", "Não foi possível atualizar a notificação.");
  revalidatePath("/notificacoes");
  redirect("/notificacoes");
}

export async function createGoal(form: FormData) {
  const { db } = await requireUser();
  const metric = val(form, "metric");
  const period = val(form, "period");
  const start = val(form, "starts_on");
  const end = val(form, "ends_on");
  const target = Number(val(form, "target").replace(",", "."));
  if (
    ![
      "Leads novos",
      "Oportunidades ganhas",
      "Valor ganho",
      "Tarefas concluídas",
      "Reuniões realizadas",
    ].includes(metric) ||
    !["Semanal", "Mensal"].includes(period) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    end < start ||
    !Number.isFinite(target) ||
    target <= 0
  )
    fail("/configuracoes", "Meta inválida.");
  const { error } = await db
    .from("goals")
    .insert({ metric, period, starts_on: start, ends_on: end, target });
  if (error) fail("/configuracoes", "Não foi possível cadastrar a meta.");
  revalidatePath("/");
  revalidatePath("/configuracoes");
  redirect("/configuracoes?ok=meta");
}
