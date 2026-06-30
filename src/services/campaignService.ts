// Serviço de campanhas — única fronteira entre a app e as tabelas de campanha.
//
// Campanhas são MULTI-USUÁRIO, então exigem Supabase: no modo visitante (sem client)
// a listagem devolve vazio e as mutações lançam erro amigável. Toda a segurança real
// mora na RLS (supabase/migrations/0002_campaigns.sql); aqui só montamos as queries.

import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type {
  Campaign,
  CampaignCharacter,
  CampaignMember,
  CampaignRole,
  CampaignStatus,
  NewCampaignInput,
} from '../types/campaign'

/** Campanhas só funcionam com Supabase configurado. */
export const campaignsEnabled: boolean = supabase !== null

const GUEST_MESSAGE =
  'Campanhas exigem login com Supabase. Configure o .env (modo visitante não suporta campanhas).'

const requireClient = (): SupabaseClient => {
  if (!supabase) throw new Error(GUEST_MESSAGE)
  return supabase
}

const assertDeleted = (count: number | null, message: string) => {
  if (!count) throw new Error(message)
}

const currentUserId = async (client: SupabaseClient): Promise<string> => {
  const { data } = await client.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessão expirada. Entre novamente.')
  return id
}

// ── Row shapes (de/para snake_case → camelCase) ─────────────────────────────
type CampaignRow = {
  id: string
  route_key?: string | null
  owner_id: string
  name: string
  description: string
  system_name: string
  status: CampaignStatus
  invite_code: string
  created_at: string
  updated_at: string
  campaign_members?: { user_id: string; role: CampaignRole }[]
}

const mapCampaign = (row: CampaignRow, meId?: string): Campaign => {
  const members = row.campaign_members
  return {
    id: row.id,
    routeKey: row.route_key ?? row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    systemName: row.system_name,
    status: row.status,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: meId && members ? members.find((m) => m.user_id === meId)?.role : undefined,
    memberCount: members ? members.length : undefined,
  }
}

const CAMPAIGN_SELECT = '*, campaign_members(user_id, role)'

const isMissingRouteKeyError = (error: { message?: string; code?: string } | null): boolean =>
  error?.code === '42703' || error?.message?.includes('route_key') === true

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

// ── Operações ───────────────────────────────────────────────────────────────

/** Campanhas onde sou mestre ou jogador (a RLS já filtra para as minhas). */
export const listMyCampaigns = async (): Promise<Campaign[]> => {
  if (!supabase) return []
  const me = await currentUserId(supabase)
  const { data, error } = await supabase
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as CampaignRow[]).map((row) => mapCampaign(row, me))
}

export const getCampaign = async (routeKey: string): Promise<Campaign | null> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const byRouteKey = await client
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('route_key', routeKey)
    .maybeSingle()

  if (!byRouteKey.error && byRouteKey.data) {
    return mapCampaign(byRouteKey.data as CampaignRow, me)
  }
  if (byRouteKey.error && !isMissingRouteKeyError(byRouteKey.error)) {
    throw new Error(byRouteKey.error.message)
  }
  if (!isUuid(routeKey)) return null

  const { data, error } = await client
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('id', routeKey)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapCampaign(data as CampaignRow, me) : null
}

export const createCampaign = async (input: NewCampaignInput): Promise<Campaign> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const { data, error } = await client
    .from('campaigns')
    .insert({ name: input.name, description: input.description ?? '' })
    .select(CAMPAIGN_SELECT)
    .single()
  if (error) throw new Error(error.message)
  // O trigger cria a membership MASTER; garantimos o papel no retorno.
  return { ...mapCampaign(data as CampaignRow, me), role: 'MASTER' }
}

export const updateCampaign = async (
  id: string,
  patch: Partial<Pick<Campaign, 'name' | 'description' | 'status'>>,
): Promise<Campaign> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const payload: Record<string, unknown> = {}
  if (patch.name !== undefined) payload.name = patch.name
  if (patch.description !== undefined) payload.description = patch.description
  if (patch.status !== undefined) payload.status = patch.status

  const { data, error } = await client
    .from('campaigns')
    .update(payload)
    .eq('id', id)
    .select(CAMPAIGN_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return mapCampaign(data as CampaignRow, me)
}

export const deleteCampaign = async (id: string): Promise<void> => {
  const client = requireClient()
  const { count, error } = await client
    .from('campaigns')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  assertDeleted(count, 'Campanha nao encontrada ou sem permissao para excluir.')
}

/** Entra numa campanha pelo código de convite (RPC SECURITY DEFINER). Retorna o id. */
export const joinByCode = async (code: string): Promise<Campaign> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const { data, error } = await client.rpc('join_campaign', {
    p_invite_code: code.trim().toUpperCase(),
  })
  if (error) throw new Error(error.message)

  const { data: campaign, error: campaignError } = await client
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('id', data as string)
    .single()
  if (campaignError) throw new Error(campaignError.message)
  return mapCampaign(campaign as CampaignRow, me)
}

/** Jogador sai da campanha (remove a própria membership). */
export const leaveCampaign = async (campaignId: string): Promise<void> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const { count, error } = await client
    .from('campaign_members')
    .delete({ count: 'exact' })
    .eq('campaign_id', campaignId)
    .eq('user_id', me)
  if (error) throw new Error(error.message)
  assertDeleted(count, 'Voce nao pode sair desta campanha.')
}

/** Mestre remove um jogador (a RLS impede remover outro mestre). */
export const removeMember = async (campaignId: string, userId: string): Promise<void> => {
  const client = requireClient()
  const { count, error } = await client
    .from('campaign_members')
    .delete({ count: 'exact' })
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('role', 'PLAYER')
  if (error) throw new Error(error.message)
  assertDeleted(count, 'Jogador nao encontrado ou sem permissao para remover.')
}

type MemberRow = {
  id: string
  campaign_id: string
  user_id: string
  role: CampaignRole
  joined_at: string
}

type MemberProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
}

export const listMembers = async (campaignId: string): Promise<CampaignMember[]> => {
  const client = requireClient()
  const { data, error } = await client
    .from('campaign_members')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('joined_at', { ascending: true })
  if (error) throw new Error(error.message)

  const members = (data ?? []) as MemberRow[]
  if (members.length === 0) return []

  const userIds = [...new Set(members.map((member) => member.user_id))]
  let profilesById = new Map<string, MemberProfileRow>()
  try {
    const { data: profileData } = await client
      .from('profiles')
      .select('id, username, display_name, email')
      .in('id', userIds)
    profilesById = new Map(
      ((profileData ?? []) as MemberProfileRow[]).map((profile) => [profile.id, profile]),
    )
  } catch {
    profilesById = new Map()
  }

  return members.map((m) => {
    const profile = profilesById.get(m.user_id)
    return {
      id: m.id,
      campaignId: m.campaign_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      username: profile?.username,
      displayName: profile?.display_name,
      email: profile?.email,
    }
  })
}

// Linha devolvida pela RPC campaign_roster (SECURITY DEFINER): identidade leve de
// todos os vínculos da campanha; route_key só vem quando o usuário pode abrir a ficha.
type RosterRow = {
  link_id: string
  character_id: string
  owner_id: string
  shared: boolean
  name: string | null
  class_name: string | null
  level: number | null
  route_key: string | null
  created_at: string
}

export const listCampaignCharacters = async (
  campaignId: string,
): Promise<CampaignCharacter[]> => {
  const client = requireClient()
  // RPC em vez de join direto: a RLS de characters bloqueia fichas privadas alheias,
  // então um join devolveria nomes vazios. A RPC mostra o roster (nome/classe/nível)
  // a todos os membros e só revela a route_key (porta da ficha) a quem tem permissão.
  const { data, error } = await client.rpc('campaign_roster', { p_campaign: campaignId })
  if (error) throw new Error(error.message)
  return ((data ?? []) as RosterRow[]).map((cc) => ({
    id: cc.link_id,
    campaignId,
    characterId: cc.character_id,
    userId: cc.owner_id,
    createdAt: cc.created_at,
    characterName: cc.name ?? undefined,
    className: cc.class_name ?? undefined,
    level: cc.level ?? undefined,
    shared: cc.shared,
    routeKey: cc.route_key,
  }))
}

/** Dono alterna a visibilidade da própria ficha nesta campanha (a RLS valida a posse). */
export const setCharacterShared = async (
  campaignCharacterId: string,
  shared: boolean,
): Promise<void> => {
  const client = requireClient()
  const { count, error } = await client
    .from('campaign_characters')
    .update({ shared }, { count: 'exact' })
    .eq('id', campaignCharacterId)
  if (error) throw new Error(error.message)
  assertDeleted(count, 'Personagem nao encontrado ou sem permissao para alterar visibilidade.')
}

/** Jogador vincula um personagem PRÓPRIO (a RLS valida a posse). */
export const linkCharacter = async (
  campaignId: string,
  characterId: string,
): Promise<void> => {
  const client = requireClient()
  const { error } = await client
    .from('campaign_characters')
    .insert({ campaign_id: campaignId, character_id: characterId })
  if (error) throw new Error(error.message)
}

export const unlinkCharacter = async (campaignCharacterId: string): Promise<void> => {
  const client = requireClient()
  const { count, error } = await client
    .from('campaign_characters')
    .delete({ count: 'exact' })
    .eq('id', campaignCharacterId)
  if (error) throw new Error(error.message)
  assertDeleted(count, 'Personagem nao encontrado ou sem permissao para desvincular.')
}
