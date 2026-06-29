// Dashboard de agentes (/agentes): grade de personagens com criar/abrir/editar/excluir.

import { Layers, Plus, ScrollText, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CharacterCard } from '../components/characters/CharacterCard'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { SkeletonCard } from '../components/ui/Skeleton'
import { StatCard } from '../components/ui/StatCard'
import { useCharacters } from '../hooks/useCharacters'
import type { Character } from '../types/character'

const SKELETON_KEYS = ['s1', 's2', 's3']

export function CharactersPage() {
  const { characters, loading, error, remove } = useCharacters()
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null)

  const pendingName = pendingDelete?.sheet.identity.characterName.trim() || 'este personagem'

  const confirmDelete = () => {
    if (pendingDelete) {
      const name = pendingDelete.sheet.identity.characterName.trim() || 'O agente'
      void remove(pendingDelete.id)
      toast.success(`${name} foi excluído.`)
    }
    setPendingDelete(null)
  }

  const hasCharacters = !loading && !error && characters.length > 0
  const maxLevel = characters.reduce(
    (max, character) => Math.max(max, Number(character.sheet.identity.level) || 0),
    0,
  )
  const classCount = new Set(
    characters.map((character) => character.sheet.identity.className).filter(Boolean),
  ).size

  return (
    <main className="page">
      <PageHeader
        eyebrow="Ficha digital"
        title="Meus Agentes"
        action={
          <Button to="/agentes/novo">
            <Plus size={18} aria-hidden />
            Criar novo personagem
          </Button>
        }
      />

      {hasCharacters && (
        <div className="summary-grid dashboard-summary">
          <StatCard
            icon={<ScrollText size={20} aria-hidden />}
            value={characters.length}
            label="Agentes"
          />
          <StatCard icon={<Star size={20} aria-hidden />} value={maxLevel} label="Maior nível" />
          <StatCard icon={<Layers size={20} aria-hidden />} value={classCount} label="Classes" />
        </div>
      )}

      {loading ? (
        <div className="characters-grid">
          {SKELETON_KEYS.map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title={error} />
      ) : characters.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={28} aria-hidden />}
          title="Nenhum agente ainda. Crie o primeiro!"
          action={
            <Button to="/agentes/novo">
              <Plus size={18} aria-hidden />
              Criar personagem
            </Button>
          }
        />
      ) : (
        <div className="characters-grid">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir agente?"
        description={`${pendingName} será removido permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  )
}
