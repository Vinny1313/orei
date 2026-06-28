// Painel de Habilidades: habilidades criadas e passivas (listas de texto livre).

import { Wand2 } from 'lucide-react'
import type { CharacterSheet } from '../../../types/character'
import { Panel } from '../../ui/Panel'

type AbilitiesSectionProps = {
  sheet: CharacterSheet
  updateTextList: (key: 'customSkills' | 'passives', index: number, value: string) => void
}

export function AbilitiesSection({ sheet, updateTextList }: AbilitiesSectionProps) {
  return (
    <Panel icon={<Wand2 size={18} />} title="Habilidades" className="abilities-panel">
      <div className="text-stack">
        {sheet.customSkills.map((entry, index) => (
          <label key={`skill-${index}`}>
            Habilidade criada {index + 1}
            <textarea
              value={entry}
              onChange={(event) => updateTextList('customSkills', index, event.target.value)}
            />
          </label>
        ))}
        {sheet.passives.map((entry, index) => (
          <label key={`passive-${index}`}>
            Passiva {index + 1}
            <textarea
              value={entry}
              onChange={(event) => updateTextList('passives', index, event.target.value)}
            />
          </label>
        ))}
      </div>
    </Panel>
  )
}
