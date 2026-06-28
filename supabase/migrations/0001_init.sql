-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  O REI MANDOU — Migration 0001: profiles + characters                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Como aplicar: Supabase Dashboard → SQL Editor → cole este arquivo inteiro → Run.
-- É idempotente (pode rodar de novo sem erro).
--
-- As tabelas de campanha (campaigns, campaign_members, campaign_characters) chegam
-- no 0002_campaigns.sql, junto da Fase 4 (Arauto), para a RLS nascer com as features
-- que a exercitam.

-- gen_random_uuid() já vem habilitado no Supabase; garantimos pgcrypto por segurança.
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper genérico: mantém updated_at sempre atual em UPDATEs.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ═════════════════════════════════════════════════════════════════════════════
-- profiles — perfil do usuário autenticado (1:1 com auth.users).
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  email        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário lê/edita SOMENTE o próprio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
-- TODO(campaigns): a Fase 4 pode adicionar uma policy para co-membros de campanha
-- lerem o profile uns dos outros (mestre enxerga os jogadores).

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o profile automaticamente no cadastro, lendo username/display_name de
-- raw_user_meta_data (o authService os envia em options.data no signUp).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_username text := nullif(trim(new.raw_user_meta_data->>'username'), '');
begin
  -- Evita colisão no username único (dois apelidos iguais, ou login Google sem
  -- username): se já existe, grava null e o usuário ajusta depois no /perfil.
  if desired_username is not null
     and exists (select 1 from public.profiles where username = desired_username) then
    desired_username := null;
  end if;

  insert into public.profiles (id, username, display_name, email)
  values (
    new.id,
    desired_username,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      desired_username
    ),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═════════════════════════════════════════════════════════════════════════════
-- characters — personagens do usuário. A ficha completa vive em `sheet` (JSONB),
-- fiel ao modelo do app; dono/tempo em colunas próprias.
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.characters (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sheet      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_owner_id_idx on public.characters (owner_id);

alter table public.characters enable row level security;

-- Cada usuário só enxerga/cria/edita/apaga os PRÓPRIOS personagens.
drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own"
  on public.characters for select
  using (owner_id = auth.uid());
-- TODO(campaigns): a Fase 4 adiciona um SELECT extra para personagens vinculados a
-- uma campanha onde o usuário é mestre ou jogador (via campaign_characters).

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own"
  on public.characters for insert
  with check (owner_id = auth.uid());

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own"
  on public.characters for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own"
  on public.characters for delete
  using (owner_id = auth.uid());

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();
