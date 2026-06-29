// Página da ficha (/agentes/:id): carrega o personagem e renderiza a ficha editável.

import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CharacterSheet } from '../components/characters/CharacterSheet'
import { useCharacter } from '../hooks/useCharacters'

export function CharacterSheetPage() {
  const { routeKey } = useParams<{ routeKey: string }>()
  const { character, loading, error, save } = useCharacter(routeKey)

  if (loading) {
    return (
      <main className="page">
        <div className="empty-state large">Carregando a ficha…</div>
      </main>
    )
  }

  if (error || !character) {
    return (
      <main className="page">
        <div className="empty-state large">
          <p>{error ?? 'Ficha não encontrada.'}</p>
          <Link to="/agentes" className="roll-button">
            <ArrowLeft size={18} aria-hidden />
            Voltar aos agentes
          </Link>
        </div>
      </main>
    )
  }

  // key={character.id} garante que ao trocar de personagem o estado interno seja reiniciado.
  return <CharacterSheet key={character.id} initialSheet={character.sheet} onSave={save} />
}
