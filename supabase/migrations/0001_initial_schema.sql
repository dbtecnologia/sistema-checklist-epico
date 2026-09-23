create extension if not exists "pgcrypto";

create table if not exists public.organizations (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, organization_id uuid references public.organizations(id) on delete cascade, full_name text not null default '', role text not null default 'CLIENTE_OPERADOR' check (role in ('ADMIN','GESTOR','AUDITOR','CONSULTOR','CLIENTE_ADMIN','CLIENTE_GESTOR','CLIENTE_OPERADOR')), first_login boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.clients (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, legal_name text not null, trade_name text, tax_id text, email text, phone text, status text not null default 'EM_IMPLANTACAO' check (status in ('ATIVO','INATIVO','EM_IMPLANTACAO','SUSPENSO')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.client_users (client_id uuid not null references public.clients(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'CLIENTE_ADMIN', primary key(client_id,user_id));
create table if not exists public.client_units (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, name text not null, code text, city text, state text, status text not null default 'ATIVO', created_at timestamptz not null default now());

alter table public.organizations enable row level security; alter table public.profiles enable row level security; alter table public.clients enable row level security; alter table public.client_users enable row level security; alter table public.client_units enable row level security;
create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security invoker set search_path = public as $$ select exists(select 1 from public.profiles where id = (select auth.uid()) and organization_id = target_org); $$;
create policy "profiles own record" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "org members read clients" on public.clients for select to authenticated using (public.is_org_member(organization_id));
create policy "org members manage clients" on public.clients for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "client users see own link" on public.client_users for select to authenticated using (user_id = (select auth.uid()));
create policy "org members read units" on public.client_units for select to authenticated using (exists(select 1 from public.clients c where c.id = client_id and public.is_org_member(c.organization_id)));

