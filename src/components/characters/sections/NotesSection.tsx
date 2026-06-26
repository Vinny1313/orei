// Painel de Anotações, lore e magias (texto livre).

import { BookOpen } from 'lucide-react'
import type { CharacterSheet } from '../../../types/character'
import { Panel } from '../../ui/Panel'

type NotesSectionProps = {
  sheet: CharacterSheet
  setNotes: (value: string) => void
}

export function NotesSection({ sheet, setNotes }: NotesSectionProps) {
  return (
    <Panel icon={<BookOpen size={18} />} title="Anotações, lore e magias" className="notes-panel">
      <textarea
        className="notes-area"
        value={sheet.notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="NPCs, símbolos, pistas, magias, promessas perigosas..."
      />
    </Panel>
  )
}
