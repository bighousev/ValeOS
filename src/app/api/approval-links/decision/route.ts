import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const schema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    name: z.string().trim().min(2).max(160),
    decision: z.enum(["Aprovado", "Ajustes solicitados"]),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.decision !== "Ajustes solicitados" || !!v.comment, {
    message: "Comentário obrigatório",
  });

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ error: "Indisponível" }, { status: 503 });
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return NextResponse.json({ error: "Formato inválido" }, { status: 415 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 5_000)
    return NextResponse.json({ error: "Dados inválidos" }, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  const v = parsed.data;
  const hash = createHash("sha256").update(v.token).digest("hex");
  const { error } = await createAdminClient().rpc("decide_external_approval", {
    p_token_hash: hash,
    p_name: v.name,
    p_decision: v.decision,
    p_comment: v.comment || null,
  });
  if (error)
    return NextResponse.json({ error: "Link indisponível" }, { status: 409 });
  return NextResponse.json(
    { result: "recorded" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
