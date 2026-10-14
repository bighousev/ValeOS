# ValeOS

Aplicação interna de CRM, clientes, projetos, reuniões e indicadores para uma pequena empresa de tecnologia e automação. O [PRD v1.0](docs/ValeOS_PRD_v1.0.md) é a referência de produto. O [estado da implementação](docs/IMPLEMENTATION_STATUS.md) mostra o que ainda precisa de homologação.

## Stack

Next.js 16 + TypeScript na aplicação; Supabase gerenciado para PostgreSQL e Auth; Google Calendar em leitura opcional; Docker na VPS, atrás de Nginx e HTTPS.

## Desenvolvimento local

1. Instale Node.js 24 e pnpm 11. Execute `pnpm install`.
2. Crie um projeto no Supabase. Copie `.env.example` para `.env.local` e preencha URL, chave publishable, chave service role, `APP_URL` e segredos fortes. **Nunca envie `.env.local` ao GitHub.**
3. Aplique [a migration inicial](supabase/migrations/202610140001_initial.sql) pelo Supabase CLI ou SQL Editor. Mantenha a migration versionada como fonte de verdade.
4. Em Supabase Auth, desabilite cadastro público e configure a URL do site e URLs de redirecionamento para `http://localhost:3000/auth/confirm` e, depois, para o domínio HTTPS. Mesmo que haja uma conta Auth criada por outro meio, as políticas RLS bloqueiam acesso sem perfil ativo.
5. Configure os modelos de e-mail **Invite user** e **Reset password** para o fluxo SSR. O link do convite deve apontar para `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`; o de recuperação para `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`. Confira a sintaxe com a [documentação oficial de templates do Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).
6. Crie o administrador inicial: `node --env-file=.env.local scripts/bootstrap-admin.mjs vitorcasagrande09@gmail.com bighousev`. Abra o convite e defina a senha.
7. Execute `pnpm dev` e abra `http://localhost:3000`.

Os comandos `pnpm typecheck`, `pnpm test` e `pnpm build` verificam o código. Os testes com banco, e-mail e APIs externas precisam do ambiente Supabase configurado.

## Variáveis de ambiente

Veja `.env.example`. `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` são públicas e entram no bundle durante o build. `SUPABASE_SERVICE_ROLE_KEY`, `WEBHOOK_SECRET`, `CRON_SECRET` e a chave privada do Google são **somente do servidor**. Use segredos distintos em desenvolvimento, homologação e produção.

Para o calendário compartilhado, informe `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`. Compartilhe o calendário com a conta de serviço com permissão de leitura. Sem a integração, reuniões próprias continuam funcionando.

## Webhook de leads

`POST /api/integrations/leads` aceita JSON de até 16 KiB com `source`, `external_event_id`, `name` e `email` ou `phone`. Envie:

- `x-valeos-timestamp`: timestamp Unix em milissegundos;
- `x-valeos-signature`: `sha256=` + HMAC SHA-256 hexadecimal de `<timestamp>.<corpo bruto>`, usando `WEBHOOK_SECRET`.

O timestamp tem janela de 5 minutos. A chave `(source, external_event_id)` torna o processamento idempotente. Um evento repetido retorna o ID existente; contato semelhante gera marcador para revisão, sem mesclagem automática. Restrinja taxa de requisições no proxy.

## VPS

O `compose.yaml` expõe o Next.js apenas em `127.0.0.1:3000`. Preencha `.env.production` fora do controle de versão e construa com `docker compose --env-file .env.production up -d --build`. Adapte [a configuração Nginx de exemplo](deploy/nginx/valeos.conf.example) ao domínio e ao certificado TLS. O endpoint `/api/health` apoia checagem de disponibilidade.

Configure um job diário para `POST /api/cron/notifications` com `Authorization: Bearer <CRON_SECRET>`. A operação é idempotente por condição. O proxy deve aplicar limites de requisição para webhook e aprovação externa e evitar registrar os tokens das URLs `/aprovar/`.

Antes de produção, valide o backup gerenciado do Supabase e realize uma restauração em homologação. Defina RPO/RTO depois do ensaio. Execute a migration e os testes de aceitação em homologação antes de promover a mesma imagem Docker para produção. Em falha de implantação, retorne à imagem anterior e preserve o banco; migrations destrutivas exigem plano específico de rollback.

## Segurança e limites

Rotas internas validam identidade no servidor e políticas RLS protegem as tabelas. A chave service role é usada apenas em rotas de integração, administração e aprovação pública controlada. Links externos de aprovação usam token aleatório, armazenado como hash, com validade de 7 dias, revogação e resposta única. Esta aprovação é declaratória, não assinatura eletrônica qualificada.

Este repositório contém uma implementação inicial ampla, mas **ainda não uma implantação homologada**. Consulte o [estado da implementação](docs/IMPLEMENTATION_STATUS.md) antes de usar dados reais.
