-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  O REI MANDOU — Migration 0002: campanhas                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Pré-requisito: 0001_init.sql aplicado. Aplique igual: SQL Editor → cole → Run.
-- Idempotente.
--
-- RLS À PROVA DE RECURSÃO: políticas que precisam saber "este usuário é membro/mestre
-- desta campanha?" usam funções SECURITY DEFINER (is_campaign_member/is_campaign_master)
-- que consultam campaign_members IGNORANDO a RLS — assim uma policy de campaign_members
-- não chama a si mesma (o erro clássico "infinite recursion detected in policy").

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text not null default '',
  system_name text not null default 'O Rei Mandou',
  status      text not null default 'ativa' check (status in ('ativa', 'pausada', 'encerrada')),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists campaigns_owner_id_idx on public.campaigns (owner_id);

create table if not exists public.campaign_members (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('MASTER', 'PLAYER')),
  joined_at   timestamptz not null default now(),
  unique (campaign_id, user_id)
);
create index if not exists campaign_members_campaign_idx on public.campaign_members (campaign_id);
create index if not exists campaign_members_user_idx on public.campaign_members (user_id);

create table if not exists public.campaign_characters (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (campaign_id, character_id)
);
create index if not exists campaign_characters_campaign_idx on public.campaign_characters (campaign_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Funções SECURITY DEFINER (quebram a recursão de RLS)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_campaign_member(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_campaign_master(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid() and m.role = 'MASTER'
  );
$$;

-- Entrar numa campanha pelo código de convite (resolve código → id e cria a
-- membership como PLAYER). SECURITY DEFINER porque o jogador ainda NÃO é membro,
-- então não conseguiria enxergar a campanha pela RLS para descobrir o id.
create or replace function public.join_campaign(p_invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_campaign_id uuid;
begin
  if auth.uid() is null then
    raise exception 'É preciso estar autenticado para entrar numa campanha.';
  end if;

  select id into v_campaign_id from public.campaigns
  where invite_code = upper(trim(p_invite_code)) and status <> 'encerrada';

  if v_campaign_id is null then
    raise exception 'Código de convite inválido ou campanha encerrada.';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign_id, auth.uid(), 'PLAYER')
  on conflict (campaign_id, user_id) do nothing;

  return v_campaign_id;
end;
$$;

grant execute on function public.is_campaign_member(uuid) to authenticated;
grant execute on function public.is_campaign_master(uuid) to authenticated;
grant execute on function public.join_campaign(text) to authenticated;

-- Mestre/criador entra automaticamente como MASTER ao criar a campanha.
create or replace function public.handle_new_campaign()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role)
  values (new.id, new.owner_id, 'MASTER')
  on conflict (campaign_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_campaign_created on public.campaigns;
create trigger on_campaign_created
  after insert on public.campaigns
  for each row execute function public.handle_new_campaign();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_characters enable row level security;

-- campaigns: vê quem é dono ou membro; só o dono cria/edita/apaga.
drop policy if exists "campaigns_select" on public.campaigns;
create policy "campaigns_select" on public.campaigns for select
  using (owner_id = auth.uid() or public.is_campaign_member(id));

drop policy if exists "campaigns_insert" on public.campaigns;
create policy "campaigns_insert" on public.campaigns for insert
  with check (owner_id = auth.uid());

drop policy if exists "campaigns_update" on public.campaigns;
create policy "campaigns_update" on public.campaigns for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "campaigns_delete" on public.campaigns;
create policy "campaigns_delete" on public.campaigns for delete
  using (owner_id = auth.uid());

-- campaign_members: qualquer membro vê os membros da campanha; jogador entra a si
-- mesmo (PLAYER); jogador sai (deleta a própria) e mestre remove jogadores.
drop policy if exists "campaign_members_select" on public.campaign_members;
create policy "campaign_members_select" on public.campaign_members for select
  using (public.is_campaign_member(campaign_id));

drop policy if exists "campaign_members_insert_self" on public.campaign_members;
create policy "campaign_members_insert_self" on public.campaign_members for insert
  with check (user_id = auth.uid() and role = 'PLAYER');

drop policy if exists "campaign_members_delete" on public.campaign_members;
create policy "campaign_members_delete" on public.campaign_members for delete
  using (
    (user_id = auth.uid() and role = 'PLAYER')
    or (public.is_campaign_master(campaign_id) and role = 'PLAYER')
  );

-- campaign_characters: membros veem os vínculos; jogador vincula só personagem
-- PRÓPRIO (e sendo membro); desvincula o próprio, e o mestre pode desvincular.
drop policy if exists "campaign_characters_select" on public.campaign_characters;
create policy "campaign_characters_select" on public.campaign_characters for select
  using (public.is_campaign_member(campaign_id));

drop policy if exists "campaign_characters_insert" on public.campaign_characters;
create policy "campaign_characters_insert" on public.campaign_characters for insert
  with check (
    user_id = auth.uid()
    and public.is_campaign_member(campaign_id)
    and exists (
      select 1 from public.characters c
      where c.id = character_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "campaign_characters_delete" on public.campaign_characters;
create policy "campaign_characters_delete" on public.campaign_characters for delete
  using (user_id = auth.uid() or public.is_campaign_master(campaign_id));

-- characters: além do dono (0001), membros de uma campanha podem LER os personagens
-- vinculados a ela (o mestre enxerga as fichas dos jogadores).
drop policy if exists "characters_select_via_campaign" on public.characters;
create policy "characters_select_via_campaign" on public.characters for select
  using (
    exists (
      select 1 from public.campaign_characters cc
      where cc.character_id = characters.id
        and public.is_campaign_member(cc.campaign_id)
    )
  );

-- profiles: além do próprio (0001), co-membros de campanha podem LER o profile uns
-- dos outros (mestre vê nome/e-mail dos jogadores). SECURITY DEFINER para não
-- recorrer à RLS de campaign_members dentro da policy de profiles.
create or replace function public.shares_campaign_with(other uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.campaign_members m1
    join public.campaign_members m2 on m1.campaign_id = m2.campaign_id
    where m1.user_id = auth.uid() and m2.user_id = other
  );
$$;
grant execute on function public.shares_campaign_with(uuid) to authenticated;

drop policy if exists "profiles_select_comember" on public.profiles;
create policy "profiles_select_comember" on public.profiles for select
  using (public.shares_campaign_with(id));
