// Tipos de domínio das campanhas. Espelham as tabelas de 0002_campaigns.sql,
// em camelCase para a app (o campaignService faz o de/para com as colunas snake_case).

export type CampaignStatus = 'ativa' | 'pausada' | 'encerrada'
export type CampaignRole = 'MASTER' | 'PLAYER'

export type Campaign = {
  id: string
  routeKey: string
  ownerId: string
  name: string
  description: string
  systemName: string
  status: CampaignStatus
  inviteCode: string
  createdAt: string
  updatedAt: string
  /** Papel do usuário ATUAL nesta campanha (preenchido nas listagens). */
  role?: CampaignRole
  /** Total de membros (preenchido quando disponível). */
  memberCount?: number
}

export type CampaignMember = {
  id: string
  campaignId: string
  userId: string
  role: CampaignRole
  joinedAt: string
  /** Dados do profile do membro (join), quando carregados. */
  username?: string | null
  displayName?: string | null
  email?: string | null
}

export type CampaignCharacter = {
  id: string
  campaignId: string
  characterId: string
  userId: string
  createdAt: string
  /** Resumo do personagem vinculado (derivado do sheet), quando carregado. */
  characterName?: string
  className?: string
  level?: number
}

/** Entrada do formulário de criação de campanha. */
export type NewCampaignInput = {
  name: string
  description?: string
}
