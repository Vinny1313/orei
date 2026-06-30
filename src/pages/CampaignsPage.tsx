// Lista de campanhas (/campanhas): minhas campanhas + entrar por codigo de convite.

import { Plus, Swords } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CampaignCard } from '../components/campaigns/CampaignCard'
import { CampaignsUnavailable } from '../components/campaigns/CampaignsUnavailable'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useCampaigns } from '../hooks/useCampaigns'
import { campaignsEnabled, joinByCode } from '../services/campaignService'

const SKELETON_KEYS = ['s1', 's2', 's3']

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
      const campaign = await joinByCode(code)
      setCode('')
      toast.success(`Você entrou em ${campaign.name}.`)
      navigate(`/campanhas/${campaign.routeKey}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Não foi possível entrar na campanha.')
      setJoining(false)
    }
  }

  return (
    <main className="page">
      <PageHeader
        eyebrow="Mesas"
        title="Minhas Campanhas"
        action={
          <Button to="/campanhas/nova">
            <Plus size={18} aria-hidden />
            Criar campanha
          </Button>
        }
      />

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
        <Button type="submit" variant="ghost" disabled={joining}>
          {joining ? 'Entrando...' : 'Entrar'}
        </Button>
        {joinError && <p className="form-error">{joinError}</p>}
      </form>

      {loading ? (
        <div className="characters-grid">
          {SKELETON_KEYS.map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title={error} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Swords size={28} aria-hidden />}
          title="Você ainda não participa de nenhuma campanha."
          description="Crie uma como mestre ou entre com um código de convite."
        />
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
