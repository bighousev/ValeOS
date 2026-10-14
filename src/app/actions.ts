"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema, stageSchema } from "@/lib/validation";
import { z } from "zod";

function value(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}
function errorTo(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/login");
}

export async function createLead(form: FormData) {
  const { db, profile } = await requireUser();
  const parsed = leadSchema.safeParse(
    Object.fromEntries(
      ["name", "email", "phone", "company", "source", "interest"].map((k) => [
        k,
        value(form, k),
      ]),
    ),
  );
  if (!parsed.success)
    errorTo(
      "/leads/novo",
      "Preencha nome, origem e pelo menos um contato válido.",
    );
  const v = parsed.data;
  const { data, error } = await db.rpc("create_manual_lead", {
    p_name: v.name,
    p_email: v.email || null,
    p_phone: v.phone || null,
    p_company: v.company || null,
    p_source: v.source,
    p_interest: v.interest || null,
    p_owner: profile.id,
  });
  if (error || !data)
    errorTo("/leads/novo", "Não foi possível cadastrar o lead.");
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  redirect(`/leads/${data}`);
}

export async function addInteraction(form: FormData) {
  const { db, profile } = await requireUser();
  const leadId = value(form, "lead_id");
  if (!z.uuid().safeParse(leadId).success) errorTo("/leads", "Lead inválido.");
  const kind = z
    .enum(["WhatsApp", "Ligação", "E-mail", "Reunião", "Nota"])
    .safeParse(value(form, "kind"));
  const summary = value(form, "summary");
  if (!kind.success || summary.length < 2 || summary.length > 2000)
    errorTo(`/leads/${leadId}`, "Informe o tipo e o resumo da interação.");
  const { error } = await db.from("interactions").insert({
    lead_id: leadId,
    kind: kind.data,
    summary,
    next_action: value(form, "next_action") || null,
    author_id: profile.id,
  });
  if (error)
    errorTo(`/leads/${leadId}`, "Não foi possível registrar a interação.");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function moveOpportunity(form: FormData) {
  const { db } = await requireUser();
  const id = value(form, "id");
  const stage = stageSchema.safeParse(value(form, "stage"));
  if (!z.uuid().safeParse(id).success || !stage.success)
    errorTo("/pipeline", "Dados da oportunidade inválidos.");
  const amountText = value(form, "value");
  const amount = amountText ? Number(amountText.replace(",", ".")) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0))
    errorTo(`/pipeline/${id}`, "Informe um valor válido.");
  const organizationId = value(form, "organization_id");
  if (organizationId && !z.uuid().safeParse(organizationId).success)
    errorTo(`/pipeline/${id}`, "Cliente inválido.");
  const { error } = await db.rpc("transition_opportunity", {
    p_id: id,
    p_stage: stage.data,
    p_value: amount,
    p_loss_reason: value(form, "loss_reason") || null,
    p_organization_id: organizationId || null,
    p_new_org_name: value(form, "new_org_name") || null,
  });
  if (error)
    errorTo(
      `/pipeline/${id}`,
      error.message.includes("obrigat")
        ? "Para concluir, informe o valor e o cliente ou motivo da perda."
        : "Não foi possível alterar a etapa.",
    );
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${id}`);
  revalidatePath("/clientes");
  revalidatePath("/");
  redirect(`/pipeline/${id}`);
}

export async function createOrganization(form: FormData) {
  const { db } = await requireUser();
  const name = value(form, "name");
  if (name.length < 2 || name.length > 200)
    errorTo("/clientes/novo", "Informe o nome da empresa.");
  const { data, error } = await db
    .from("organizations")
    .insert({
      name,
      tax_id: value(form, "tax_id") || null,
      segment: value(form, "segment") || null,
      website: value(form, "website") || null,
      description: value(form, "description") || null,
      relationship_status: "Cliente",
    })
    .select("id")
    .single();
  if (error || !data)
    errorTo(
      "/clientes/novo",
      "Não foi possível cadastrar a empresa. Confira se ela já existe.",
    );
  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function addContact(form: FormData) {
  const { db } = await requireUser();
  const id = value(form, "organization_id");
  const name = value(form, "name");
  const email = value(form, "email");
  const phone = value(form, "phone");
  if (
    !z.uuid().safeParse(id).success ||
    name.length < 2 ||
    (!email && !phone) ||
    (email && !z.email().safeParse(email).success)
  )
    errorTo("/clientes", "Contato inválido.");
  const { error } = await db.from("contacts").insert({
    organization_id: id,
    name,
    email: email || null,
    phone: phone || null,
    role: value(form, "role") || null,
  });
  if (error)
    errorTo(`/clientes/${id}`, "Não foi possível cadastrar o contato.");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function addContract(form: FormData) {
  const { db } = await requireUser();
  const id = value(form, "organization_id");
  const title = value(form, "title");
  const url = value(form, "document_url");
  if (
    !z.uuid().safeParse(id).success ||
    title.length < 2 ||
    (url && !/^https?:\/\//.test(url))
  )
    errorTo(`/clientes/${id}`, "Contrato inválido.");
  const { error } = await db.from("contracts").insert({
    organization_id: id,
    title,
    status: value(form, "status") || "Vigente",
    starts_on: value(form, "starts_on") || null,
    ends_on: value(form, "ends_on") || null,
    document_url: url || null,
  });
  if (error)
    errorTo(`/clientes/${id}`, "Não foi possível cadastrar o contrato.");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function addService(form: FormData) {
  const { db } = await requireUser();
  const id = value(form, "organization_id");
  const description = value(form, "description");
  if (!z.uuid().safeParse(id).success || description.length < 2)
    errorTo(`/clientes/${id}`, "Serviço inválido.");
  const { error } = await db.from("services").insert({
    organization_id: id,
    description,
    status: value(form, "status") || "Ativo",
    starts_on: value(form, "starts_on") || null,
  });
  if (error)
    errorTo(`/clientes/${id}`, "Não foi possível cadastrar o serviço.");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function addExternalLink(form: FormData) {
  const { db } = await requireUser();
  const id = value(form, "organization_id");
  const label = value(form, "label");
  const url = value(form, "url");
  if (
    !z.uuid().safeParse(id).success ||
    label.length < 2 ||
    !/^https?:\/\//.test(url)
  )
    errorTo(`/clientes/${id}`, "Informe um link http ou https válido.");
  const { error } = await db.from("external_links").insert({
    organization_id: id,
    label,
    url,
    category: value(form, "category") || null,
  });
  if (error) errorTo(`/clientes/${id}`, "Não foi possível cadastrar o link.");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function inviteUser(form: FormData) {
  const { profile } = await requireAdmin();
  const email = value(form, "email").toLowerCase();
  const name = value(form, "name");
  if (!z.email().safeParse(email).success || name.length < 2)
    errorTo("/configuracoes", "Informe nome e e-mail válidos.");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.APP_URL}/auth/confirm`,
  });
  if (error || !data.user)
    errorTo("/configuracoes", "Não foi possível enviar o convite.");
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, email, name, active: true, is_admin: false });
  if (profileError)
    errorTo(
      "/configuracoes",
      "O convite foi enviado, mas o perfil não foi criado. Verifique a configuração.",
    );
  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    entity: "profile",
    entity_id: data.user.id,
    action: "invited",
  });
  revalidatePath("/configuracoes");
  redirect("/configuracoes?ok=convite");
}
