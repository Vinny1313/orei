// Dashboard de agentes (/agentes): grade de personagens com criar/abrir/editar/excluir.

import { Plus, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CharacterCard } from '../components/characters/CharacterCard'
import { useCharacters } from '../hooks/useCharacters'
import type { Character } from '../types/character'

export function CharactersPage() {
  const { characters, loading, error, remove } = useCharacters()

  const handleDelete = (character: Character) => {
    const name = character.sheet.identity.characterName.trim() || 'este personagem'
    if (window.confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) {
      void remove(character.id)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Ficha digital</p>
          <h1>Meus Agentes</h1>
        </div>
        <Link to="/agentes/novo" className="roll-button">
          <Plus size={18} aria-hidden />
          Criar novo personagem
        </Link>
      </header>

      {loading ? (
        <div className="empty-state large">Carregando seus agentes…</div>
      ) : error ? (
        <div className="empty-state large">{error}</div>
      ) : characters.length === 0 ? (
        <div className="empty-state large">
          <ScrollText size={28} aria-hidden />
          <p>Nenhum agente ainda. Crie o primeiro!</p>
          <Link to="/agentes/novo" className="roll-button">
            <Plus size={18} aria-hidden />
            Criar personagem
          </Link>
        </div>
      ) : (
        <div className="characters-grid">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </main>
  )
}
