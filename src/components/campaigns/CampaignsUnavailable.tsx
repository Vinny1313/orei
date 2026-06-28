import { Swords } from 'lucide-react'
import { Link } from 'react-router-dom'

type CampaignsUnavailableProps = {
  showBackLink?: boolean
}

export function CampaignsUnavailable({ showBackLink = false }: CampaignsUnavailableProps) {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Campanhas</h1>
      </header>
      <div className="empty-state large">
        <Swords size={28} aria-hidden />
        <p>As campanhas exigem login com Supabase.</p>
        <small>
          Configure o <code>.env</code> para usar campanhas multi-jogador. O modo visitante
          continua disponivel para personagens locais.
        </small>
        {showBackLink && (
          <Link to="/campanhas" className="roll-button">
            Voltar as campanhas
          </Link>
        )}
      </div>
    </main>
  )
}
