// Painel de Combate e vida: HP, CA, iniciativa, sanidade, deslocamento + rolagens rápidas.

import { Brain, HeartPulse, Swords } from 'lucide-react'
import type { CharacterSheet } from '../../../types/character'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'

type CombatSectionProps = {
  sheet: CharacterSheet
  updateCombat: <K extends keyof CharacterSheet['combat']>(key: K, value: number) => void
  rollDice: (label: string, bonus?: number) => void
}

export function CombatSection({ sheet, updateCombat, rollDice }: CombatSectionProps) {
  return (
    <Panel icon={<HeartPulse size={18} />} title="Combate e vida">
      <div className="stat-grid">
        <NumberField label="Vida atual" value={sheet.combat.currentHp} onChange={(value) => updateCombat('currentHp', value)} />
        <NumberField label="Vida máxima" value={sheet.combat.maxHp} onChange={(value) => updateCombat('maxHp', value)} />
        <NumberField label="CA" value={sheet.combat.armorClass} onChange={(value) => updateCombat('armorClass', value)} />
        <NumberField label="Iniciativa" value={sheet.combat.initiative} onChange={(value) => updateCombat('initiative', value)} />
        <NumberField label="Sanidade" value={sheet.combat.sanity} onChange={(value) => updateCombat('sanity', value)} />
        <NumberField label="Deslocamento" value={sheet.combat.movement} onChange={(value) => updateCombat('movement', value)} />
      </div>
      <div className="quick-rolls">
        <button type="button" onClick={() => rollDice('Iniciativa', sheet.attributes.destreza.mod + sheet.combat.initiative)}>
          <Swords size={16} aria-hidden />
          Iniciativa
        </button>
        <button type="button" onClick={() => rollDice('Sanidade')}>
          <Brain size={16} aria-hidden />
          Sanidade
        </button>
      </div>
    </Panel>
  )
}
