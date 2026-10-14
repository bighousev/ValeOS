import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhook } from "@/lib/webhook";
import { webhookLeadSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json(
      { error: "Integração indisponível" },
      { status: 503 },
    );
  if (Number(request.headers.get("content-length") || 0) > 16_384)
    return NextResponse.json(
      { error: "Payload muito grande" },
      { status: 413 },
    );
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16_384)
    return NextResponse.json(
      { error: "Payload muito grande" },
      { status: 413 },
    );
  if (
    !verifyWebhook(
      raw,
      request.headers.get("x-valeos-timestamp"),
      request.headers.get("x-valeos-signature"),
      secret,
    )
  )
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = webhookLeadSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  const v = parsed.data;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("ingest_webhook_lead", {
    p_source: v.source,
    p_event_id: v.external_event_id,
    p_name: v.name,
    p_email: v.email || null,
    p_phone: v.phone || null,
    p_company: v.company || null,
    p_interest: v.interest || null,
  });
  if (error)
    return NextResponse.json(
      { error: "Falha ao processar evento" },
      { status: 500 },
    );
  return NextResponse.json(data, {
    status: data?.result === "created" ? 201 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
