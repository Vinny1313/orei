// Personagens vinculados a uma campanha. Dono ou mestre podem desvincular.

import { ScrollText, Unlink } from 'lucide-react'
import type { CampaignCharacter } from '../../types/campaign'

type CampaignCharactersProps = {
  characters: CampaignCharacter[]
  isMaster: boolean
  currentUserId?: string
  disabled?: boolean
  onUnlink: (link: CampaignCharacter) => void
}

export function CampaignCharacters({
  characters,
  isMaster,
  currentUserId,
  disabled = false,
  onUnlink,
}: CampaignCharactersProps) {
  if (characters.length === 0) {
    return <p className="muted-note">Nenhum personagem vinculado ainda.</p>
  }

  return (
    <ul className="linked-list">
      {characters.map((link) => {
        const canUnlink = isMaster || link.userId === currentUserId
        return (
          <li key={link.id} className="linked-row">
            <ScrollText size={16} aria-hidden />
            <span className="linked-name">{link.characterName?.trim() || 'Personagem sem nome'}</span>
            <span className="linked-meta">
              {link.className ?? '—'} · Nv {link.level ?? 1}
            </span>
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
