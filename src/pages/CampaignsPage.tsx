// Lista de campanhas (/campanhas): minhas campanhas + entrar por codigo de convite.

import { Plus, Swords } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CampaignCard } from '../components/campaigns/CampaignCard'
import { CampaignsUnavailable } from '../components/campaigns/CampaignsUnavailable'
import { useCampaigns } from '../hooks/useCampaigns'
import { campaignsEnabled, joinByCode } from '../services/campaignService'

export function CampaignsPage() {
  if (!campaignsEnabled) {
    return <CampaignsUnavailable />
  }

  return <CampaignsPageContent />
}

function CampaignsPageContent() {
  const { campaigns, loading, error } = useCampaigns()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      return
    }
    setJoining(true)
    setJoinError(null)
    try {
      const campaignId = await joinByCode(code)
      setCode('')
      navigate(`/campanhas/${campaignId}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Nao foi possivel entrar na campanha.')
      setJoining(false)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mesas</p>
          <h1>Minhas Campanhas</h1>
        </div>
        <Link to="/campanhas/nova" className="roll-button">
          <Plus size={18} aria-hidden />
          Criar campanha
        </Link>
      </header>

      <form className="join-form panel" onSubmit={handleJoin}>
        <label>
          Entrar por codigo de convite
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Ex.: A1B2C3D4"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="ghost-button" disabled={joining}>
          {joining ? 'Entrando...' : 'Entrar'}
        </button>
        {joinError && <p className="form-error">{joinError}</p>}
      </form>

      {loading ? (
        <div className="empty-state large">Carregando campanhas...</div>
      ) : error ? (
        <div className="empty-state large">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state large">
          <Swords size={28} aria-hidden />
          <p>Voce ainda nao participa de nenhuma campanha.</p>
          <small>Crie uma como mestre ou entre com um codigo de convite.</small>
        </div>
      ) : (
        <div className="characters-grid">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </main>
  )
}
