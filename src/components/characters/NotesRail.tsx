import { BookOpen } from 'lucide-react'
import type { CharacterSheet } from '../../types/character'

type NotesRailProps = {
  sheet: CharacterSheet
  setNotes: (value: string) => void
}

export function NotesRail({ sheet, setNotes }: NotesRailProps) {
  return (
    <details className="notes-rail" open>
      <summary>
        <BookOpen size={18} aria-hidden />
        <h2>Anotacoes</h2>
      </summary>
      <textarea
        value={sheet.notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="NPCs, pistas, promessas, magias, dividas e qualquer coisa que o mestre jogue na sua cara depois..."
      />
    </details>
  )
}
