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

const currentUserId = async (client: SupabaseClient): Promise<string> => {
  const { data } = await client.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessão expirada. Entre novamente.')
  return id
}

// ── Row shapes (de/para snake_case → camelCase) ─────────────────────────────
type CampaignRow = {
  id: string
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

export const getCampaign = async (id: string): Promise<Campaign | null> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const { data, error } = await client
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('id', id)
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
  const { error } = await client.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Entra numa campanha pelo código de convite (RPC SECURITY DEFINER). Retorna o id. */
export const joinByCode = async (code: string): Promise<string> => {
  const client = requireClient()
  const { data, error } = await client.rpc('join_campaign', {
    p_invite_code: code.trim().toUpperCase(),
  })
  if (error) throw new Error(error.message)
  return data as string
}

/** Jogador sai da campanha (remove a própria membership). */
export const leaveCampaign = async (campaignId: string): Promise<void> => {
  const client = requireClient()
  const me = await currentUserId(client)
  const { error } = await client
    .from('campaign_members')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', me)
  if (error) throw new Error(error.message)
}

/** Mestre remove um jogador (a RLS impede remover outro mestre). */
export const removeMember = async (campaignId: string, userId: string): Promise<void> => {
  const client = requireClient()
  const { error } = await client
    .from('campaign_members')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('role', 'PLAYER')
  if (error) throw new Error(error.message)
}

type MemberRow = {
  id: string
  campaign_id: string
  user_id: string
  role: CampaignRole
  joined_at: string
  profile?: { username: string | null; display_name: string | null; email: string | null } | null
}

export const listMembers = async (campaignId: string): Promise<CampaignMember[]> => {
  const client = requireClient()
  const { data, error } = await client
    .from('campaign_members')
    .select('*, profile:profiles(username, display_name, email)')
    .eq('campaign_id', campaignId)
    .order('joined_at', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data ?? []) as MemberRow[]).map((m) => ({
    id: m.id,
    campaignId: m.campaign_id,
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    username: m.profile?.username,
    displayName: m.profile?.display_name,
    email: m.profile?.email,
  }))
}

type CampaignCharacterRow = {
  id: string
  campaign_id: string
  character_id: string
  user_id: string
  created_at: string
  character?: {
    id: string
    sheet: { identity?: { characterName?: string; className?: string; level?: number } }
  } | null
}

export const listCampaignCharacters = async (
  campaignId: string,
): Promise<CampaignCharacter[]> => {
  const client = requireClient()
  const { data, error } = await client
    .from('campaign_characters')
    .select('*, character:characters(id, sheet)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data ?? []) as CampaignCharacterRow[]).map((cc) => {
    const identity = cc.character?.sheet?.identity
    return {
      id: cc.id,
      campaignId: cc.campaign_id,
      characterId: cc.character_id,
      userId: cc.user_id,
      createdAt: cc.created_at,
      characterName: identity?.characterName,
      className: identity?.className,
      level: identity?.level,
    }
  })
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
  const { error } = await client
    .from('campaign_characters')
    .delete()
    .eq('id', campaignCharacterId)
  if (error) throw new Error(error.message)
}
