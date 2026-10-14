import { createClient } from "@supabase/supabase-js";

const [email, name] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.APP_URL;
if (!email || !name || !url || !key || !appUrl) {
  console.error("Uso: node --env-file=.env.local scripts/bootstrap-admin.mjs email nome");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${appUrl}/auth/confirm` });
if (error || !data.user) {
  console.error("Não foi possível criar o convite inicial:", error?.message || "resposta inválida");
  process.exit(1);
}
const result = await admin.from("profiles").upsert({ id: data.user.id, email, name, active: true, is_admin: true });
if (result.error) {
  console.error("Convite enviado, mas o perfil de administrador não foi criado:", result.error.message);
  process.exit(1);
}
console.log(`Convite de administrador enviado para ${email}.`);
