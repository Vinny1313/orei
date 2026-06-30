// Personagens vinculados a uma campanha.
// Privacidade: o roster mostra nome/classe/nível de todos, mas só o DONO abre a própria
// ficha (edição) e decide se ela fica visível; um não-dono só "Vê a ficha" (somente
// leitura, dentro da campanha) quando o dono liberou — ou quando ele é o mestre.

import { Eye, EyeOff, ScrollText, Unlink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CampaignCharacter } from '../../types/campaign'

type CampaignCharactersProps = {
  characters: CampaignCharacter[]
  isMaster: boolean
  currentUserId?: string
  campaignRouteKey: string
  disabled?: boolean
  onUnlink: (link: CampaignCharacter) => void
  onToggleShare: (link: CampaignCharacter, shared: boolean) => void
}

export function CampaignCharacters({
  characters,
  isMaster,
  currentUserId,
  campaignRouteKey,
  disabled = false,
  onUnlink,
  onToggleShare,
}: CampaignCharactersProps) {
  if (characters.length === 0) {
    return <p className="muted-note">Nenhum personagem vinculado ainda.</p>
  }

  return (
    <ul className="linked-list">
      {characters.map((link) => {
        const isOwner = link.userId === currentUserId
        const canUnlink = isMaster || isOwner
        const canOpen = Boolean(link.routeKey)

        return (
          <li key={link.id} className="linked-row">
            <ScrollText size={16} aria-hidden />
            <span className="linked-name">{link.characterName?.trim() || 'Personagem sem nome'}</span>
            <span className="linked-meta">
              {link.className ?? '—'} · Nv {link.level ?? 1}
            </span>

            {isOwner ? (
              <>
                <button
                  type="button"
                  className="ghost-button small"
                  title={link.shared ? 'Tornar privada' : 'Tornar visível na campanha'}
                  disabled={disabled}
                  onClick={() => onToggleShare(link, !link.shared)}
                >
                  {link.shared ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
                  {link.shared ? 'Visível' : 'Privada'}
                </button>
                {link.routeKey && (
                  <Link to={`/agentes/${link.routeKey}`} className="ghost-button small">
                    Abrir
                  </Link>
                )}
              </>
            ) : canOpen ? (
              <Link
                to={`/campanhas/${campaignRouteKey}/ficha/${link.routeKey}`}
                className="ghost-button small"
              >
                <Eye size={15} aria-hidden />
                Ver ficha
              </Link>
            ) : (
              <span className="linked-meta" title="O dono não liberou esta ficha">
                <EyeOff size={14} aria-hidden /> Ficha privada
              </span>
            )}

            {canUnlink && (
              <button
                type="button"
                className="icon-button small danger"
                title="Desvincular personagem"
                disabled={disabled}
                onClick={() => onUnlink(link)}
              >
                <Unlink size={15} aria-hidden />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
