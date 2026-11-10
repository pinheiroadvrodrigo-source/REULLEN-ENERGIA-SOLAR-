-- ============================================================
-- RR Engenharia Solar — banco de dados (Supabase)
-- Como usar: Supabase → SQL Editor → New query → cole TUDO → Run
-- Depois troque o e-mail no final pelo e-mail de quem pode ver o painel.
-- ============================================================

-- Cadastros de clientes (formulário e chatbot)
create table if not exists public.leads (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  nome          text not null check (char_length(nome) between 2 and 120),
  whatsapp      text not null check (char_length(whatsapp) between 10 and 20),
  cidade        text check (char_length(cidade) <= 120),
  bairro        text check (char_length(bairro) <= 120),
  conta         text check (char_length(conta) <= 40),
  tipo          text check (char_length(tipo) <= 40),
  origem        text check (char_length(origem) <= 40),
  pagina        text check (char_length(pagina) <= 300),
  consentimento boolean not null default false,
  status        text not null default 'novo' check (status in ('novo','em contato','orçamento enviado','fechado','perdido'))
);

-- Acessos ao site
create table if not exists public.visitas (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  pagina      text check (char_length(pagina) <= 300),
  referencia  text check (char_length(referencia) <= 200),
  dispositivo text check (char_length(dispositivo) <= 20),
  visitante   text check (char_length(visitante) <= 64)
);
create index if not exists visitas_created_at_idx on public.visitas (created_at desc);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- Quem pode ver o painel (área de membros)
create table if not exists public.admins (
  email text primary key
);

-- Segurança: ninguém lê nada sem estar na lista de admins
alter table public.leads   enable row level security;
alter table public.visitas enable row level security;
alter table public.admins  enable row level security;

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "site grava leads"     on public.leads;
drop policy if exists "admin le leads"       on public.leads;
drop policy if exists "admin altera leads"   on public.leads;
drop policy if exists "admin apaga leads"    on public.leads;
drop policy if exists "site grava visitas"   on public.visitas;
drop policy if exists "admin le visitas"     on public.visitas;
drop policy if exists "admin ve admins"      on public.admins;

create policy "site grava leads"   on public.leads   for insert to anon, authenticated with check (consentimento = true);
create policy "admin le leads"     on public.leads   for select to authenticated using (public.eh_admin());
create policy "admin altera leads" on public.leads   for update to authenticated using (public.eh_admin()) with check (public.eh_admin());
create policy "admin apaga leads"  on public.leads   for delete to authenticated using (public.eh_admin());
create policy "site grava visitas" on public.visitas for insert to anon, authenticated with check (true);
create policy "admin le visitas"   on public.visitas for select to authenticated using (public.eh_admin());
create policy "admin ve admins"    on public.admins  for select to authenticated using (public.eh_admin());

grant insert on public.leads, public.visitas to anon, authenticated;
grant select, update, delete on public.leads to authenticated;
grant select on public.visitas, public.admins to authenticated;

-- >>> TROQUE PELO E-MAIL QUE VAI ENTRAR NO PAINEL (pode repetir a linha para mais pessoas)
insert into public.admins (email) values ('SEU-EMAIL@exemplo.com') on conflict do nothing;
