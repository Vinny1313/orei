// Card de um personagem no dashboard de agentes.

import { Brain, HeartPulse, Pencil, ScrollText, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Character } from '../../types/character'
import { Avatar } from '../ui/Avatar'

type CharacterCardProps = {
  character: Character
  onDelete: (character: Character) => void
}

export function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const { sheet } = character
  const name = sheet.identity.characterName.trim() || 'Personagem sem nome'

  return (
    <article className="character-card panel">
      <header className="character-card__head">
        <div className="character-card__identity">
          <Avatar name={name} size={40} />
          <h3>{name}</h3>
        </div>
        <span className="character-card__class">{sheet.identity.className}</span>
      </header>

      <dl className="character-card__meta">
        <div>
          <dt>Nível</dt>
          <dd>{sheet.identity.level}</dd>
        </div>
        <div>
          <dt>Jogador</dt>
          <dd>{sheet.identity.playerName.trim() || '—'}</dd>
        </div>
      </dl>

      <div className="character-card__stats">
        <span className="character-card__stat">
          <HeartPulse size={15} aria-hidden />
          {sheet.combat.currentHp}/{sheet.combat.maxHp} PV
        </span>
        <span className="character-card__stat">
          <Brain size={15} aria-hidden />
          {sheet.combat.sanity} SAN
        </span>
      </div>

      <footer className="character-card__actions">
        <Link to={`/agentes/${character.routeKey}`} className="card-action primary">
          <ScrollText size={15} aria-hidden />
          Abrir ficha
        </Link>
        <Link to={`/agentes/${character.routeKey}`} className="card-action" title="Editar ficha">
          <Pencil size={15} aria-hidden />
          Editar
        </Link>
        <button
          type="button"
          className="card-action danger"
          onClick={() => onDelete(character)}
          title="Excluir personagem"
        >
          <Trash2 size={15} aria-hidden />
          Excluir
        </button>
      </footer>
    </article>
  )
}
