create extension if not exists pgcrypto;

create type public.pipeline_stage as enum ('Novo lead', 'Em contato', 'Proposta', 'Ganho', 'Perdido');
create type public.project_status as enum ('Planejado', 'Em andamento', 'Pausado', 'Em aprovação', 'Concluído', 'Cancelado');
create type public.task_status as enum ('A fazer', 'Em andamento', 'Bloqueada', 'Concluída', 'Cancelada');
create type public.approval_status as enum ('Pendente', 'Aprovado', 'Ajustes solicitados', 'Revogado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  is_admin boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create function public.is_internal_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active);
$$;
create function public.is_technical_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active and is_admin);
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  segment text,
  website text,
  description text,
  relationship_status text not null default 'Prospect',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index organizations_tax_id_unique on public.organizations (regexp_replace(tax_id, '[^0-9]', '', 'g')) where tax_id is not null and archived_at is null;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  name text not null,
  email text,
  phone text,
  role text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index contacts_organization_idx on public.contacts(organization_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  source text not null,
  interest text,
  owner_id uuid references public.profiles(id),
  possible_duplicate_id uuid references public.leads(id),
  legal_basis text,
  organization_id uuid references public.organizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint lead_contact_required check (nullif(trim(coalesce(email, '')), '') is not null or nullif(trim(coalesce(phone, '')), '') is not null)
);
create index leads_created_idx on public.leads(created_at desc);
create index leads_email_idx on public.leads(lower(email)) where email is not null;
create index leads_phone_idx on public.leads(regexp_replace(phone, '[^0-9]', '', 'g')) where phone is not null;

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  organization_id uuid references public.organizations(id),
  contact_id uuid references public.contacts(id),
  title text not null,
  stage public.pipeline_stage not null default 'Novo lead',
  estimated_value numeric(14,2),
  owner_id uuid references public.profiles(id),
  expected_close_at date,
  closed_at timestamptz,
  loss_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create index opportunities_stage_idx on public.opportunities(stage) where archived_at is null;
create index opportunities_organization_idx on public.opportunities(organization_id);
create unique index opportunities_default_lead_unique on public.opportunities(lead_id) where lead_id is not null;

create table public.opportunity_stage_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id),
  from_stage public.pipeline_stage,
  to_stage public.pipeline_stage not null,
  confirmed_value numeric(14,2),
  actor_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now()
);
create index opportunity_stage_events_time_idx on public.opportunity_stage_events(occurred_at desc);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  opportunity_id uuid references public.opportunities(id),
  organization_id uuid references public.organizations(id),
  kind text not null check (kind in ('WhatsApp', 'Ligação', 'E-mail', 'Reunião', 'Nota')),
  summary text not null,
  next_action text,
  author_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  constraint interaction_target check (num_nonnulls(lead_id, opportunity_id, organization_id) = 1)
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  title text not null,
  status text not null,
  starts_on date,
  ends_on date,
  reference_value numeric(14,2),
  document_url text,
  created_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  description text not null,
  starts_on date,
  status text not null,
  reference_value numeric(14,2),
  project_id uuid,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  opportunity_id uuid references public.opportunities(id),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id),
  starts_on date,
  due_on date,
  priority text not null default 'Média',
  status public.project_status not null default 'Planejado',
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
alter table public.services add constraint services_project_fk foreign key (project_id) references public.projects(id);
create index projects_organization_idx on public.projects(organization_id);
create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  position int not null,
  status text not null default 'Planejada',
  starts_on date,
  due_on date,
  unique(project_id, position),
  unique(id, project_id)
);
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  phase_id uuid not null,
  title text not null,
  description text,
  owner_id uuid not null references public.profiles(id),
  priority text not null default 'Média',
  starts_on date,
  due_on date,
  status public.task_status not null default 'A fazer',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (phase_id, project_id) references public.project_phases(id, project_id),
  unique(id, project_id)
);
create index tasks_project_idx on public.project_tasks(project_id);
create index tasks_due_idx on public.project_tasks(due_on) where status not in ('Concluída', 'Cancelada');
create table public.task_dependencies (
  project_id uuid not null references public.projects(id),
  predecessor_id uuid not null,
  successor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(predecessor_id, successor_id),
  check(predecessor_id <> successor_id),
  foreign key(predecessor_id, project_id) references public.project_tasks(id, project_id),
  foreign key(successor_id, project_id) references public.project_tasks(id, project_id)
);
create function public.prevent_dependency_cycle() returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (
    with recursive chain(id) as (
      select new.successor_id
      union
      select d.successor_id from public.task_dependencies d join chain c on d.predecessor_id = c.id
    ) select 1 from chain where id = new.predecessor_id
  ) then raise exception 'Dependência circular não permitida'; end if;
  return new;
end; $$;
create trigger task_dependency_cycle before insert or update on public.task_dependencies for each row execute function public.prevent_dependency_cycle();
create function public.guard_task_completion() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'Concluída' and old.status is distinct from 'Concluída' then
    if exists(select 1 from public.task_dependencies d join public.project_tasks t on t.id = d.predecessor_id where d.successor_id = new.id and t.status <> 'Concluída') then
      raise exception 'Tarefa bloqueada por dependência pendente';
    end if;
    new.completed_at := now();
  elsif new.status <> 'Concluída' then new.completed_at := null;
  else new.completed_at := old.completed_at; end if;
  return new;
end; $$;
create trigger task_completion_guard before update on public.project_tasks for each row execute function public.guard_task_completion();
create function public.guard_task_insert() returns trigger language plpgsql set search_path = '' as $$ begin
  if new.status = 'Concluída' then raise exception 'Conclua a tarefa após sua criação'; end if;
  new.completed_at := null;
  return new;
end; $$;
create trigger task_insert_guard before insert on public.project_tasks for each row execute function public.guard_task_insert();

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  phase_id uuid references public.project_phases(id),
  title text not null,
  description text,
  document_url text,
  owner_id uuid not null references public.profiles(id),
  version int not null default 1,
  required boolean not null default true,
  status text not null default 'Rascunho',
  created_at timestamptz not null default now()
);
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables(id),
  version int not null,
  kind text not null check (kind in ('Interna', 'Externa')),
  status public.approval_status not null default 'Pendente',
  token_hash text unique,
  expires_at timestamptz,
  decided_at timestamptz,
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.approval_requests(id),
  decision text not null check (decision in ('Aprovado', 'Ajustes solicitados')),
  actor_id uuid references public.profiles(id),
  actor_name text,
  comment text,
  decided_at timestamptz not null default now(),
  check(decision = 'Aprovado' or nullif(trim(coalesce(comment, '')), '') is not null)
);
create function public.guard_project_completion() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'Concluído' and old.status is distinct from 'Concluído' then
    if exists(select 1 from public.project_tasks where project_id = new.id and status not in ('Concluída', 'Cancelada')) then raise exception 'Há tarefas pendentes'; end if;
    if exists(select 1 from public.deliverables where project_id = new.id and required and status <> 'Aprovado') then raise exception 'Há entregáveis obrigatórios sem aprovação'; end if;
    if exists(select 1 from public.approval_requests r join public.deliverables d on d.id = r.deliverable_id where d.project_id = new.id and r.status = 'Pendente') then raise exception 'Há aprovações pendentes'; end if;
  end if;
  return new;
end; $$;
create trigger project_completion_guard before update on public.projects for each row execute function public.guard_project_completion();
create function public.guard_project_insert() returns trigger language plpgsql set search_path = '' as $$ begin
  if new.status = 'Concluído' then raise exception 'Conclua o projeto após sua criação'; end if;
  return new;
end; $$;
create trigger project_insert_guard before insert on public.projects for each row execute function public.guard_project_insert();

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'Agendada' check(status in ('Agendada', 'Realizada', 'Cancelada')),
  organization_id uuid references public.organizations(id),
  project_id uuid references public.projects(id),
  participants text,
  kind text,
  agenda text,
  minutes text,
  decisions text,
  created_at timestamptz not null default now()
);
create table public.meeting_actions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id),
  description text not null,
  owner_id uuid references public.profiles(id),
  due_on date,
  status text not null default 'Pendente' check(status in ('Pendente', 'Concluído', 'Cancelado')),
  task_id uuid unique references public.project_tasks(id),
  created_at timestamptz not null default now()
);
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  period text not null check(period in ('Semanal', 'Mensal')),
  starts_on date not null,
  ends_on date not null,
  target numeric(14,2) not null check(target > 0),
  check(ends_on >= starts_on)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  message text not null,
  target_url text not null,
  recipient_id uuid references public.profiles(id),
  dedupe_key text not null unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.external_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  project_id uuid references public.projects(id),
  label text not null,
  url text not null,
  category text,
  created_at timestamptz not null default now()
);
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_event_id text not null,
  lead_id uuid references public.leads(id),
  result text not null default 'processing',
  received_at timestamptz not null default now(),
  duplicate_attempts int not null default 0,
  unique(source, external_event_id)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  entity text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create table public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  public_config jsonb not null default '{}',
  credential_reference text,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Public schema tables are private until an active profile exists. No public sign-up grants access.
do $$ declare t text; begin
  foreach t in array array['profiles','organizations','contacts','leads','opportunities','opportunity_stage_events','interactions','contracts','services','projects','project_phases','project_tasks','task_dependencies','deliverables','approval_requests','approval_decisions','meetings','meeting_actions','goals','notifications','external_links','webhook_events','audit_logs','integration_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    if t not in ('webhook_events','integration_settings','notifications') then
      execute format('create policy internal_select on public.%I for select to authenticated using (public.is_internal_user())', t);
    end if;
    if t not in ('profiles','webhook_events','audit_logs','integration_settings','opportunity_stage_events','opportunities','approval_decisions','approval_requests','notifications','deliverables') then
      execute format('create policy internal_insert on public.%I for insert to authenticated with check (public.is_internal_user())', t);
      execute format('create policy internal_update on public.%I for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())', t);
    end if;
  end loop;
end $$;
create policy integration_admin_select on public.integration_settings for select to authenticated using (public.is_technical_admin());
create policy notification_recipient_select on public.notifications for select to authenticated using (public.is_internal_user() and (recipient_id = auth.uid() or recipient_id is null));
create policy deliverable_draft_insert on public.deliverables for insert to authenticated with check (public.is_internal_user() and status = 'Rascunho' and version = 1);

-- Narrow RPCs keep related writes atomic and preserve history.
create function public.create_manual_lead(p_name text, p_email text, p_phone text, p_company text, p_source text, p_interest text, p_owner uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_duplicate uuid;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_source), '') is null or (nullif(trim(coalesce(p_email,'')), '') is null and nullif(trim(coalesce(p_phone,'')), '') is null) then raise exception 'Nome, origem e contato são obrigatórios'; end if;
  select id into v_duplicate from public.leads where archived_at is null and ((p_email is not null and lower(email) = lower(trim(p_email))) or (p_phone is not null and regexp_replace(phone,'[^0-9]','','g') = regexp_replace(p_phone,'[^0-9]','','g'))) limit 1;
  insert into public.leads(name,email,phone,company,source,interest,owner_id,possible_duplicate_id) values(trim(p_name),nullif(lower(trim(p_email)),''),nullif(trim(p_phone),''),nullif(trim(p_company),''),trim(p_source),nullif(trim(p_interest),''),p_owner,v_duplicate) returning id into v_id;
  insert into public.opportunities(lead_id,title,owner_id) values(v_id, 'Oportunidade — ' || trim(p_name), p_owner);
  insert into public.audit_logs(actor_id,entity,entity_id,action) values(auth.uid(),'lead',v_id,'created');
  return v_id;
end; $$;
revoke all on function public.create_manual_lead(text,text,text,text,text,text,uuid) from public, anon;
grant execute on function public.create_manual_lead(text,text,text,text,text,text,uuid) to authenticated;

create function public.ingest_webhook_lead(p_source text, p_event_id text, p_name text, p_email text, p_phone text, p_company text, p_interest text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_event uuid; v_lead uuid; v_existing uuid; v_duplicate uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_source),'') is null or nullif(trim(p_event_id),'') is null or nullif(trim(p_name),'') is null or (nullif(trim(coalesce(p_email,'')),'') is null and nullif(trim(coalesce(p_phone,'')),'') is null) then raise exception 'Payload inválido'; end if;
  insert into public.webhook_events(source,external_event_id) values(trim(p_source),trim(p_event_id)) on conflict do nothing returning id into v_event;
  if v_event is null then
    update public.webhook_events set duplicate_attempts = duplicate_attempts + 1 where source = trim(p_source) and external_event_id = trim(p_event_id) returning lead_id into v_existing;
    return jsonb_build_object('result','duplicate','lead_id',v_existing);
  end if;
  select id into v_duplicate from public.leads where archived_at is null and ((p_email is not null and lower(email) = lower(trim(p_email))) or (p_phone is not null and regexp_replace(phone,'[^0-9]','','g') = regexp_replace(p_phone,'[^0-9]','','g'))) limit 1;
  insert into public.leads(name,email,phone,company,source,interest,possible_duplicate_id) values(trim(p_name),nullif(lower(trim(p_email)),''),nullif(trim(p_phone),''),nullif(trim(p_company),''),trim(p_source),nullif(trim(p_interest),''),v_duplicate) returning id into v_lead;
  insert into public.opportunities(lead_id,title) values(v_lead, 'Oportunidade — ' || trim(p_name));
  update public.webhook_events set lead_id = v_lead, result = 'created' where id = v_event;
  return jsonb_build_object('result','created','lead_id',v_lead,'possible_duplicate_id',v_duplicate);
end; $$;
revoke all on function public.ingest_webhook_lead(text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.ingest_webhook_lead(text,text,text,text,text,text,text) to service_role;

create function public.transition_opportunity(p_id uuid, p_stage public.pipeline_stage, p_value numeric default null, p_loss_reason text default null, p_organization_id uuid default null, p_new_org_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.opportunities%rowtype; v_org uuid; v_org_name text;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  select * into v_old from public.opportunities where id = p_id and archived_at is null for update;
  if not found then raise exception 'Oportunidade não encontrada'; end if;
  if v_old.stage = p_stage then return; end if;
  v_org := coalesce(p_organization_id, v_old.organization_id);
  if p_stage = 'Ganho' and v_org is null then
    v_org_name := nullif(trim(coalesce(p_new_org_name,'')), '');
    if v_org_name is not null then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(lower(v_org_name)));
      select id into v_org from public.organizations where lower(name) = lower(v_org_name) and archived_at is null limit 1;
      if v_org is null then insert into public.organizations(name,relationship_status) values(v_org_name,'Cliente') returning id into v_org; end if;
    end if;
  end if;
  if p_stage = 'Ganho' and (coalesce(p_value, v_old.estimated_value) is null or v_org is null) then raise exception 'Valor e cliente são obrigatórios para ganho'; end if;
  if p_stage = 'Perdido' and nullif(trim(coalesce(p_loss_reason,'')),'') is null then raise exception 'Motivo da perda é obrigatório'; end if;
  update public.opportunities set stage = p_stage, estimated_value = coalesce(p_value, estimated_value), organization_id = coalesce(v_org, organization_id), loss_reason = case when p_stage = 'Perdido' then p_loss_reason else null end, closed_at = case when p_stage in ('Ganho','Perdido') then now() else null end, updated_at = now() where id = p_id;
  if v_org is not null and v_old.lead_id is not null then update public.leads set organization_id = v_org, updated_at = now() where id = v_old.lead_id; end if;
  insert into public.opportunity_stage_events(opportunity_id,from_stage,to_stage,confirmed_value,actor_id) values(p_id,v_old.stage,p_stage,case when p_stage = 'Ganho' then coalesce(p_value,v_old.estimated_value) end,auth.uid());
  insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),'opportunity',p_id,'stage_changed',jsonb_build_object('from',v_old.stage,'to',p_stage));
end; $$;
revoke all on function public.transition_opportunity(uuid,public.pipeline_stage,numeric,text,uuid,text) from public, anon;
grant execute on function public.transition_opportunity(uuid,public.pipeline_stage,numeric,text,uuid,text) to authenticated;

create function public.create_project(p_organization_id uuid, p_name text, p_description text, p_owner_id uuid, p_due_on date, p_opportunity_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  if nullif(trim(p_name),'') is null or not exists(select 1 from public.organizations where id = p_organization_id and archived_at is null) then raise exception 'Cliente e nome são obrigatórios'; end if;
  if not exists(select 1 from public.profiles where id = p_owner_id and active) then raise exception 'Responsável inválido'; end if;
  if p_opportunity_id is not null and not exists(select 1 from public.opportunities where id = p_opportunity_id and organization_id = p_organization_id and stage = 'Ganho') then raise exception 'Oportunidade incompatível'; end if;
  insert into public.projects(organization_id,opportunity_id,name,description,owner_id,due_on) values(p_organization_id,p_opportunity_id,trim(p_name),nullif(trim(p_description),''),p_owner_id,p_due_on) returning id into v_id;
  insert into public.project_phases(project_id,name,position) values(v_id,'Planejamento',1);
  insert into public.audit_logs(actor_id,entity,entity_id,action) values(auth.uid(),'project',v_id,'created');
  return v_id;
end; $$;
revoke all on function public.create_project(uuid,text,text,uuid,date,uuid) from public,anon;
grant execute on function public.create_project(uuid,text,text,uuid,date,uuid) to authenticated;

create function public.request_internal_approval(p_deliverable_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_deliverable public.deliverables%rowtype; v_id uuid;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  select * into v_deliverable from public.deliverables where id = p_deliverable_id for update;
  if not found or v_deliverable.status <> 'Rascunho' then raise exception 'Crie uma nova versão antes de solicitar outra aprovação'; end if;
  insert into public.approval_requests(deliverable_id,version,kind,requested_by) values(p_deliverable_id,v_deliverable.version,'Interna',auth.uid()) returning id into v_id;
  update public.deliverables set status = 'Em aprovação interna' where id = p_deliverable_id;
  insert into public.audit_logs(actor_id,entity,entity_id,action) values(auth.uid(),'deliverable',p_deliverable_id,'internal_approval_requested');
  return v_id;
end; $$;
revoke all on function public.request_internal_approval(uuid) from public,anon;
grant execute on function public.request_internal_approval(uuid) to authenticated;

create function public.decide_internal_approval(p_request_id uuid, p_decision text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.approval_requests%rowtype; v_deliverable public.deliverables%rowtype;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  if p_decision not in ('Aprovado','Ajustes solicitados') or (p_decision = 'Ajustes solicitados' and nullif(trim(coalesce(p_comment,'')),'') is null) then raise exception 'Decisão inválida'; end if;
  select * into v_request from public.approval_requests where id = p_request_id for update;
  if not found or v_request.kind <> 'Interna' or v_request.status <> 'Pendente' then raise exception 'Solicitação indisponível'; end if;
  select * into v_deliverable from public.deliverables where id = v_request.deliverable_id for update;
  if v_deliverable.version <> v_request.version then raise exception 'Versão desatualizada'; end if;
  if v_request.requested_by = auth.uid() and (select count(*) from public.profiles where active) > 1 then raise exception 'Outra pessoa deve revisar esta entrega'; end if;
  update public.approval_requests set status = p_decision::public.approval_status, decided_at = now() where id = p_request_id;
  insert into public.approval_decisions(request_id,decision,actor_id,comment) values(p_request_id,p_decision,auth.uid(),p_comment);
  update public.deliverables set status = case when p_decision = 'Aprovado' then 'Aprovado internamente' else 'Revisão' end where id = v_deliverable.id;
  insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),'deliverable',v_deliverable.id,'internal_decision',jsonb_build_object('decision',p_decision,'version',v_request.version));
end; $$;
revoke all on function public.decide_internal_approval(uuid,text,text) from public,anon;
grant execute on function public.decide_internal_approval(uuid,text,text) to authenticated;

create function public.issue_external_approval(p_deliverable_id uuid, p_token_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_deliverable public.deliverables%rowtype; v_id uuid;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Token inválido'; end if;
  select * into v_deliverable from public.deliverables where id = p_deliverable_id for update;
  if not found or v_deliverable.status <> 'Aprovado internamente' then raise exception 'Aprovação interna obrigatória'; end if;
  if not exists(select 1 from public.approval_requests where deliverable_id = p_deliverable_id and version = v_deliverable.version and kind = 'Interna' and status = 'Aprovado') then raise exception 'Aprovação interna obrigatória'; end if;
  insert into public.approval_requests(deliverable_id,version,kind,token_hash,expires_at,requested_by) values(p_deliverable_id,v_deliverable.version,'Externa',p_token_hash,now() + interval '7 days',auth.uid()) returning id into v_id;
  update public.deliverables set status = 'Em aprovação externa' where id = p_deliverable_id;
  insert into public.audit_logs(actor_id,entity,entity_id,action) values(auth.uid(),'deliverable',p_deliverable_id,'external_link_issued');
  return v_id;
end; $$;
revoke all on function public.issue_external_approval(uuid,text) from public,anon;
grant execute on function public.issue_external_approval(uuid,text) to authenticated;

create function public.revoke_external_approval(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.approval_requests%rowtype; v_deliverable public.deliverables%rowtype;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  select * into v_request from public.approval_requests where id = p_request_id for update;
  if not found or v_request.kind <> 'Externa' or v_request.status <> 'Pendente' then raise exception 'Link indisponível'; end if;
  select * into v_deliverable from public.deliverables where id = v_request.deliverable_id for update;
  update public.approval_requests set status = 'Revogado' where id = p_request_id;
  if v_deliverable.version = v_request.version then update public.deliverables set status = 'Aprovado internamente' where id = v_deliverable.id; end if;
  insert into public.audit_logs(actor_id,entity,entity_id,action) values(auth.uid(),'approval_request',p_request_id,'revoked');
end; $$;
revoke all on function public.revoke_external_approval(uuid) from public,anon;
grant execute on function public.revoke_external_approval(uuid) to authenticated;

create function public.decide_external_approval(p_token_hash text, p_name text, p_decision text, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.approval_requests%rowtype; v_deliverable public.deliverables%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'Acesso negado'; end if;
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 160 or p_decision not in ('Aprovado','Ajustes solicitados') or (p_decision = 'Ajustes solicitados' and nullif(trim(coalesce(p_comment,'')),'') is null) then raise exception 'Decisão inválida'; end if;
  select * into v_request from public.approval_requests where token_hash = p_token_hash for update;
  if not found or v_request.kind <> 'Externa' or v_request.status <> 'Pendente' or v_request.expires_at <= now() then raise exception 'Link indisponível'; end if;
  select * into v_deliverable from public.deliverables where id = v_request.deliverable_id for update;
  if v_deliverable.version <> v_request.version or v_deliverable.status <> 'Em aprovação externa' then raise exception 'Versão indisponível'; end if;
  update public.approval_requests set status = p_decision::public.approval_status, decided_at = now() where id = v_request.id;
  insert into public.approval_decisions(request_id,decision,actor_name,comment) values(v_request.id,p_decision,trim(p_name),p_comment);
  update public.deliverables set status = case when p_decision = 'Aprovado' then 'Aprovado' else 'Revisão' end where id = v_deliverable.id;
  insert into public.audit_logs(entity,entity_id,action,details) values('deliverable',v_deliverable.id,'external_decision',jsonb_build_object('decision',p_decision,'version',v_request.version,'request_id',v_request.id));
end; $$;
revoke all on function public.decide_external_approval(text,text,text,text) from public,anon,authenticated;
grant execute on function public.decide_external_approval(text,text,text,text) to service_role;

create function public.revise_deliverable(p_deliverable_id uuid, p_document_url text, p_description text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old public.deliverables%rowtype;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  select * into v_old from public.deliverables where id = p_deliverable_id for update;
  if not found or v_old.status not in ('Revisão','Aprovado') then raise exception 'Entregável não pode ser revisado'; end if;
  update public.approval_requests set status = 'Revogado' where deliverable_id = p_deliverable_id and status = 'Pendente';
  update public.deliverables set version = version + 1, status = 'Rascunho', document_url = p_document_url, description = p_description where id = p_deliverable_id;
  insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),'deliverable',p_deliverable_id,'new_version',jsonb_build_object('version',v_old.version + 1));
end; $$;
revoke all on function public.revise_deliverable(uuid,text,text) from public,anon;
grant execute on function public.revise_deliverable(uuid,text,text) to authenticated;

create function public.mark_notification_read(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  update public.notifications set read_at = now() where id = p_id and (recipient_id = auth.uid() or recipient_id is null);
end; $$;
revoke all on function public.mark_notification_read(uuid) from public,anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create function public.notify_new_lead() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(kind,message,target_url,recipient_id,dedupe_key) values('Novo lead','Novo lead: ' || new.name,'/leads/' || new.id,new.owner_id,'lead:' || new.id) on conflict (dedupe_key) do nothing;
  return new;
end; $$;
create trigger lead_notification after insert on public.leads for each row execute function public.notify_new_lead();

create function public.evaluate_notifications() returns void language plpgsql security definer set search_path = '' as $$
declare v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.role() <> 'service_role' then raise exception 'Acesso negado'; end if;
  with expired as (
    update public.approval_requests set status = 'Revogado'
    where kind = 'Externa' and status = 'Pendente' and expires_at <= now()
    returning id, deliverable_id, version
  ), reset_deliverables as (
    update public.deliverables d set status = 'Aprovado internamente'
    from expired e
    where d.id = e.deliverable_id and d.version = e.version and d.status = 'Em aprovação externa'
    returning d.id
  )
  insert into public.audit_logs(entity,entity_id,action,details)
    select 'approval_request',e.id,'expired',jsonb_build_object('deliverable_id',e.deliverable_id,'version',e.version) from expired e;
  insert into public.notifications(kind,message,target_url,recipient_id,dedupe_key)
    select 'Tarefa vencida','Tarefa vencida: ' || title,'/projetos/' || project_id,owner_id,'task-overdue:' || id from public.project_tasks where due_on < v_today and status not in ('Concluída','Cancelada') on conflict (dedupe_key) do nothing;
  insert into public.notifications(kind,message,target_url,recipient_id,dedupe_key)
    select 'Prazo de projeto','Projeto perto do prazo: ' || name,'/projetos/' || id,owner_id,'project-due:' || id || ':' || due_on from public.projects where due_on between v_today and v_today + 3 and status not in ('Concluído','Cancelado') on conflict (dedupe_key) do nothing;
  insert into public.notifications(kind,message,target_url,recipient_id,dedupe_key)
    select 'Aprovação pendente','Aprovação pendente há 48 horas','/projetos/' || d.project_id,d.owner_id,'approval:' || r.id from public.approval_requests r join public.deliverables d on d.id = r.deliverable_id where r.status = 'Pendente' and r.created_at <= now() - interval '48 hours' and (r.expires_at is null or r.expires_at > now()) on conflict (dedupe_key) do nothing;
  insert into public.notifications(kind,message,target_url,recipient_id,dedupe_key)
    select 'Reunião próxima','Reunião nas próximas 24 horas: ' || title,'/reunioes/' || id,null,'meeting:' || id from public.meetings where status = 'Agendada' and starts_at > now() and starts_at <= now() + interval '24 hours' on conflict (dedupe_key) do nothing;
end; $$;
revoke all on function public.evaluate_notifications() from public,anon,authenticated;
grant execute on function public.evaluate_notifications() to service_role;

create function public.convert_meeting_action_to_task(p_action_id uuid, p_phase_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_action public.meeting_actions%rowtype; v_project uuid; v_task uuid;
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  select * into v_action from public.meeting_actions where id = p_action_id for update;
  if not found or v_action.task_id is not null or v_action.status <> 'Pendente' then raise exception 'Encaminhamento indisponível'; end if;
  select project_id into v_project from public.meetings where id = v_action.meeting_id;
  if v_project is null or not exists(select 1 from public.project_phases where id = p_phase_id and project_id = v_project) then raise exception 'Projeto ou fase inválidos'; end if;
  insert into public.project_tasks(project_id,phase_id,title,owner_id,due_on) values(v_project,p_phase_id,v_action.description,coalesce(v_action.owner_id,auth.uid()),v_action.due_on) returning id into v_task;
  update public.meeting_actions set task_id = v_task, status = 'Cancelado' where id = p_action_id;
  insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),'meeting_action',p_action_id,'converted_to_task',jsonb_build_object('task_id',v_task));
  return v_task;
end; $$;
revoke all on function public.convert_meeting_action_to_task(uuid,uuid) from public,anon;
grant execute on function public.convert_meeting_action_to_task(uuid,uuid) to authenticated;

create function public.remove_task_dependency(p_predecessor uuid, p_successor uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_internal_user() then raise exception 'Acesso negado'; end if;
  delete from public.task_dependencies where predecessor_id = p_predecessor and successor_id = p_successor;
end; $$;
revoke all on function public.remove_task_dependency(uuid,uuid) from public,anon;
grant execute on function public.remove_task_dependency(uuid,uuid) to authenticated;

create function public.audit_status_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if to_jsonb(old)->>'status' is distinct from to_jsonb(new)->>'status' then
    insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),tg_table_name,new.id,'status_changed',jsonb_build_object('from',to_jsonb(old)->>'status','to',to_jsonb(new)->>'status'));
  end if;
  return new;
end; $$;
create trigger task_status_audit after update on public.project_tasks for each row execute function public.audit_status_change();
create trigger project_status_audit after update on public.projects for each row execute function public.audit_status_change();

create function public.audit_dependency_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(actor_id,entity,entity_id,action,details) values(auth.uid(),'task_dependency',old.successor_id,'removed',jsonb_build_object('predecessor_id',old.predecessor_id));
  return old;
end; $$;
create trigger dependency_removed_audit after delete on public.task_dependencies for each row execute function public.audit_dependency_change();
