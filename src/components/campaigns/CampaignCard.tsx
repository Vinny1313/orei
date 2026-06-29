// Card de uma campanha na lista /campanhas.

import { Crown, Swords, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Campaign, CampaignStatus } from '../../types/campaign'

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const isMaster = campaign.role === 'MASTER'

  return (
    <article className="campaign-card panel">
      <header className="character-card__head">
        <h3>{campaign.name}</h3>
        <span className={`status-badge status-${campaign.status}`}>
          {STATUS_LABEL[campaign.status]}
        </span>
      </header>

      {campaign.description ? (
        <p className="campaign-card__desc">{campaign.description}</p>
      ) : (
        <p className="campaign-card__desc muted-note">Sem descrição.</p>
      )}

      <div className="character-card__stats">
        <span className="character-card__stat">
          {isMaster ? <Crown size={15} aria-hidden /> : <Swords size={15} aria-hidden />}
          {isMaster ? 'Mestre' : 'Jogador'}
        </span>
        {campaign.memberCount !== undefined && (
          <span className="character-card__stat">
            <Users size={15} aria-hidden />
            {campaign.memberCount} {campaign.memberCount === 1 ? 'membro' : 'membros'}
          </span>
        )}
      </div>

      <footer className="character-card__actions">
        <Link to={`/campanhas/${campaign.routeKey}`} className="card-action primary">
          Abrir campanha
        </Link>
      </footer>
    </article>
  )
}
