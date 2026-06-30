// Página da ficha (/agentes/:id): carrega o personagem e renderiza a ficha editável.

import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CharacterSheet } from '../components/characters/CharacterSheet'
import { useAuth } from '../hooks/useAuth'
import { useCharacter } from '../hooks/useCharacters'

const noopSave = () => Promise.resolve()

export function CharacterSheetPage() {
  const { routeKey } = useParams<{ routeKey: string }>()
  const { user } = useAuth()
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

  // Defesa: se a ficha não é do usuário (acesso por URL direta a uma ficha alheia
  // que a RLS liberou para leitura), nunca abrir em edição — renderiza somente-leitura.
  const isOwner = character.ownerId === undefined || character.ownerId === user?.id

  if (!isOwner) {
    return (
      <CharacterSheet
        key={character.id}
        initialSheet={character.sheet}
        onSave={noopSave}
        readOnly
        title={character.sheet.identity.characterName?.trim() || 'Ficha'}
      />
    )
  }

  // key={character.id} garante que ao trocar de personagem o estado interno seja reiniciado.
  return <CharacterSheet key={character.id} initialSheet={character.sheet} onSave={save} />
}
