-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  O REI MANDOU — Migration 0004: privacidade de fichas em campanhas          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Pré-requisito: 0002_campaigns.sql aplicado. Aplique igual: SQL Editor → cole → Run.
-- Idempotente.
--
-- PROBLEMA QUE ESTA MIGRAÇÃO CORRIGE
-- ----------------------------------
-- A policy "characters_select_via_campaign" (0002) liberava a leitura de QUALQUER
-- personagem vinculado a uma campanha para QUALQUER membro — então jogadores viam as
-- fichas uns dos outros. Aqui introduzimos CONSENTIMENTO por vínculo:
--   • cada vínculo personagem↔campanha nasce PRIVADO (shared = false);
--   • um não-dono só lê a ficha se o dono marcou shared = true OU se é o MESTRE;
--   • o dono sempre lê a própria ficha (policy characters_select_own, do 0001);
--   • leitura alheia é sempre SOMENTE-LEITURA (UPDATE continua restrito ao dono).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Consentimento por vínculo: coluna shared (privado por padrão).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.campaign_characters
  add column if not exists shared boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS: leitura de ficha por campanha exige consentimento OU ser mestre.
--    (O dono lê pela policy characters_select_own; aqui cobrimos só os não-donos.)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "characters_select_via_campaign" on public.characters;
create policy "characters_select_via_campaign" on public.characters for select
  using (
    exists (
      select 1 from public.campaign_characters cc
      where cc.character_id = characters.id
        and public.is_campaign_member(cc.campaign_id)
        and (cc.shared = true or public.is_campaign_master(cc.campaign_id))
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS: só o DONO do vínculo pode alternar a visibilidade (shared).
--    O mestre não força compartilhar — ele já enxerga de qualquer forma.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "campaign_characters_update_share" on public.campaign_characters;
create policy "campaign_characters_update_share" on public.campaign_characters for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC do roster — lista os personagens vinculados de uma campanha para os
--    membros. SECURITY DEFINER: lê identidade leve (nome/classe/nível) de todos
--    os vínculos, mas só devolve a route_key (porta para abrir a ficha) de quem
--    tem permissão (dono, compartilhado ou mestre). Gateada por is_campaign_member.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.campaign_roster(p_campaign uuid)
returns table (
  link_id      uuid,
  character_id uuid,
  owner_id     uuid,
  shared       boolean,
  name         text,
  class_name   text,
  level        int,
  route_key    text,
  created_at   timestamptz
)
language sql security definer set search_path = public stable as $$
  select
    cc.id,
    cc.character_id,
    c.owner_id,
    cc.shared,
    nullif(c.sheet->'identity'->>'characterName', ''),
    nullif(c.sheet->'identity'->>'className', ''),
    nullif(c.sheet->'identity'->>'level', '')::int,
    case
      when c.owner_id = auth.uid()
        or cc.shared
        or public.is_campaign_master(p_campaign)
      then c.route_key
      else null
    end,
    cc.created_at
  from public.campaign_characters cc
  join public.characters c on c.id = cc.character_id
  where cc.campaign_id = p_campaign
    and public.is_campaign_member(p_campaign)
  order by cc.created_at;
$$;

grant execute on function public.campaign_roster(uuid) to authenticated;
