// Hooks de campanhas: encapsulam o campaignService e expõem loading/erro para a UI.

import { useCallback, useEffect, useState } from 'react'
import {
  getCampaign,
  listCampaignCharacters,
  listMembers,
  listMyCampaigns,
} from '../services/campaignService'
import type { Campaign, CampaignCharacter, CampaignMember } from '../types/campaign'

type UseCampaignsResult = {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/** Lista das minhas campanhas (mestre ou jogador). */
export function useCampaigns(): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCampaigns(await listMyCampaigns())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar campanhas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { campaigns, loading, error, reload }
}

type UseCampaignResult = {
  campaign: Campaign | null
  members: CampaignMember[]
  characters: CampaignCharacter[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/** Detalhe de uma campanha: dados + membros + personagens vinculados. */
export function useCampaign(routeKey: string | undefined): UseCampaignResult {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [characters, setCharacters] = useState<CampaignCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!routeKey) {
      setCampaign(null)
      setMembers([])
      setCharacters([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const campaignData = await getCampaign(routeKey)
      if (!campaignData) {
        setCampaign(null)
        setMembers([])
        setCharacters([])
        return
      }

      const [memberData, characterData] = await Promise.all([
        listMembers(campaignData.id),
        listCampaignCharacters(campaignData.id),
      ])
      setCampaign(campaignData)
      setMembers(memberData)
      setCharacters(characterData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a campanha.')
    } finally {
      setLoading(false)
    }
  }, [routeKey])

  useEffect(() => {
    void reload()
  }, [reload])

  return { campaign, members, characters, loading, error, reload }
}
