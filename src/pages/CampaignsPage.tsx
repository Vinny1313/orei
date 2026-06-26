// Lista de campanhas (/campanhas): minhas campanhas + entrar por código de convite.

import { Plus, Swords } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CampaignCard } from '../components/campaigns/CampaignCard'
import { useCampaigns } from '../hooks/useCampaigns'
import { campaignsEnabled, joinByCode } from '../services/campaignService'

export function CampaignsPage() {
  const { campaigns, loading, error } = useCampaigns()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  // Modo visitante: campanhas precisam de Supabase (são multi-jogador).
  if (!campaignsEnabled) {
    return (
      <main className="page">
        <header className="page-header">
          <h1>Campanhas</h1>
        </header>
        <div className="empty-state large">
          <Swords size={28} aria-hidden />
          <p>As campanhas exigem login com Supabase.</p>
          <small>Configure o <code>.env</code> — o modo visitante não suporta campanhas multi-jogador.</small>
        </div>
      </main>
    )
  }

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
      setJoinError(err instanceof Error ? err.message : 'Não foi possível entrar na campanha.')
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
          Entrar por código de convite
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Ex.: A1B2C3D4"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="ghost-button" disabled={joining}>
          {joining ? 'Entrando…' : 'Entrar'}
        </button>
        {joinError && <p className="form-error">{joinError}</p>}
      </form>

      {loading ? (
        <div className="empty-state large">Carregando campanhas…</div>
      ) : error ? (
        <div className="empty-state large">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state large">
          <Swords size={28} aria-hidden />
          <p>Você ainda não participa de nenhuma campanha.</p>
          <small>Crie uma como mestre ou entre com um código de convite.</small>
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
