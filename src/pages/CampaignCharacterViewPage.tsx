// Visualização SOMENTE-LEITURA de uma ficha dentro de uma campanha
// (/campanhas/:routeKey/ficha/:characterRouteKey).
//
// Acessível só quando o dono liberou a ficha (shared) ou quem vê é o mestre — a RLS
// do Supabase é quem garante isso: se não houver permissão, getCharacter devolve null.
// A ficha é renderizada com readOnly (sem autosave, sem edição), nunca pela rota /agentes.

import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CharacterSheet } from '../components/characters/CharacterSheet'
import { useCharacter } from '../hooks/useCharacters'

const noopSave = () => Promise.resolve()

export function CampaignCharacterViewPage() {
  const { routeKey, characterRouteKey } = useParams<{
    routeKey: string
    characterRouteKey: string
  }>()
  const { character, loading, error } = useCharacter(characterRouteKey)
  const backTo = `/campanhas/${routeKey ?? ''}`

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
          <p>{error ?? 'Você não tem permissão para ver esta ficha.'}</p>
          <Link to={backTo} className="roll-button">
            <ArrowLeft size={18} aria-hidden />
            Voltar à campanha
          </Link>
        </div>
      </main>
    )
  }

  return (
    <CharacterSheet
      key={character.id}
      initialSheet={character.sheet}
      onSave={noopSave}
      readOnly
      backTo={{ to: backTo, label: 'Voltar à campanha' }}
      title={character.sheet.identity.characterName?.trim() || 'Ficha'}
    />
  )
}
