// Página de perfil: identidade do usuário (avatar/nome/e-mail), estatísticas e
// vínculos (agentes e campanhas). Usa os dados já disponíveis em useAuth +
// useCharacters + useCampaigns. Apenas apresentacional — não altera persistência.

import { Crown, LogOut, ScrollText, Swords } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { StatCard } from '../components/ui/StatCard'
import { useAuth } from '../hooks/useAuth'
import { useCampaigns } from '../hooks/useCampaigns'
import { useCharacters } from '../hooks/useCharacters'
import { campaignsEnabled } from '../services/campaignService'

export function ProfilePage() {
  const { user, isGuest, signOut } = useAuth()
  const navigate = useNavigate()
  const { characters, loading: loadingChars } = useCharacters()
  const { campaigns, loading: loadingCamps } = useCampaigns()

  const displayName = user?.displayName ?? user?.username ?? user?.email ?? 'Visitante'
  const masterCount = campaigns.filter((campaign) => campaign.role === 'MASTER').length

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <main className="page">
      <PageHeader eyebrow="Conta" title="Perfil" />

      <div className="profile-stack">
        <section className="panel profile-hero">
          <Avatar name={displayName} src={user?.avatarUrl} size={72} />
          <div className="profile-hero__info">
            <h2 className="profile-hero__name">{displayName}</h2>
            {user?.username && <span className="profile-hero__meta">@{user.username}</span>}
            {user?.email && <span className="profile-hero__meta">{user.email}</span>}
            {isGuest && <Badge tone="gold">Modo visitante</Badge>}
          </div>
          <div className="profile-hero__actions">
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut size={16} aria-hidden />
              Sair
            </Button>
          </div>
        </section>

        <div className="summary-grid">
          <StatCard
            icon={<ScrollText size={20} aria-hidden />}
            value={loadingChars ? '—' : characters.length}
            label="Agentes"
          />
          {campaignsEnabled && (
            <>
              <StatCard
                icon={<Swords size={20} aria-hidden />}
                value={loadingCamps ? '—' : campaigns.length}
                label="Campanhas"
              />
              <StatCard
                icon={<Crown size={20} aria-hidden />}
                value={loadingCamps ? '—' : masterCount}
                label="Como mestre"
              />
            </>
          )}
        </div>

        <Panel title="Meus agentes" icon={<ScrollText size={18} aria-hidden />}>
          {characters.length === 0 ? (
            <p className="muted-note">
              Nenhum agente ainda.{' '}
              <Link to="/agentes/novo" className="text-link">
                Criar o primeiro
              </Link>
              .
            </p>
          ) : (
            <ul className="linked-list">
              {characters.map((character) => (
                <li key={character.id}>
                  <Link to={`/agentes/${character.routeKey}`} className="linked-row">
                    <span className="linked-name">
                      {character.sheet.identity.characterName.trim() || 'Personagem sem nome'}
                    </span>
                    <span className="linked-meta">
                      {character.sheet.identity.className} · Nv {character.sheet.identity.level}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {campaignsEnabled && (
          <Panel title="Minhas campanhas" icon={<Swords size={18} aria-hidden />}>
            {campaigns.length === 0 ? (
              <p className="muted-note">Você ainda não participa de nenhuma campanha.</p>
            ) : (
              <ul className="linked-list">
                {campaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <Link to={`/campanhas/${campaign.routeKey}`} className="linked-row">
                      <span className="linked-name">{campaign.name}</span>
                      <span className="linked-meta">
                        {campaign.role === 'MASTER' ? 'Mestre' : 'Jogador'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </main>
  )
}
