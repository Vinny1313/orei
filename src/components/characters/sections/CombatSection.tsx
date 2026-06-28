import { Brain, HeartPulse, Shield, Swords, Wind } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { CharacterSheet, RollSource } from '../../../types/character'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'

type CombatSectionProps = {
  sheet: CharacterSheet
  updateCombat: <K extends keyof CharacterSheet['combat']>(key: K, value: number) => void
  rollDice: (label: string, bonus?: number, source?: RollSource) => void
}

const percent = (value: number, max: number): number =>
  max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0

export function CombatSection({ sheet, updateCombat, rollDice }: CombatSectionProps) {
  const hpPercent = percent(sheet.combat.currentHp, sheet.combat.maxHp)
  const sanityPercent = percent(sheet.combat.sanity, 100)

  return (
    <Panel icon={<HeartPulse size={18} />} title="Combate e vida" className="combat-panel">
      <div className="vital-grid">
        <div className="vital-card">
          <span>
            <HeartPulse size={16} aria-hidden />
            Vida
          </span>
          <strong>
            {sheet.combat.currentHp}/{sheet.combat.maxHp}
          </strong>
          <i style={{ '--value': `${hpPercent}%` } as CSSProperties} />
        </div>
        <div className="vital-card sanity">
          <span>
            <Brain size={16} aria-hidden />
            Sanidade
          </span>
          <strong>{sheet.combat.sanity}</strong>
          <i style={{ '--value': `${sanityPercent}%` } as CSSProperties} />
        </div>
      </div>

      <div className="combat-stat-strip">
        <span>
          <Shield size={15} aria-hidden />
          CA {sheet.combat.armorClass}
        </span>
        <span>
          <Swords size={15} aria-hidden />
          Ini {sheet.combat.initiative}
        </span>
        <span>
          <Wind size={15} aria-hidden />
          {sheet.combat.movement}m
        </span>
      </div>

      <div className="stat-grid compact">
        <NumberField label="Vida atual" value={sheet.combat.currentHp} onChange={(value) => updateCombat('currentHp', value)} />
        <NumberField label="Vida maxima" value={sheet.combat.maxHp} onChange={(value) => updateCombat('maxHp', value)} />
        <NumberField label="CA" value={sheet.combat.armorClass} onChange={(value) => updateCombat('armorClass', value)} />
        <NumberField label="Iniciativa" value={sheet.combat.initiative} onChange={(value) => updateCombat('initiative', value)} />
        <NumberField label="Sanidade" value={sheet.combat.sanity} onChange={(value) => updateCombat('sanity', value)} />
        <NumberField label="Deslocamento" value={sheet.combat.movement} onChange={(value) => updateCombat('movement', value)} />
      </div>

      <div className="quick-rolls">
        <button
          type="button"
          onClick={() =>
            rollDice('Iniciativa', sheet.attributes.destreza.mod + sheet.combat.initiative, 'initiative')
          }
        >
          <Swords size={16} aria-hidden />
          Iniciativa
        </button>
        <button type="button" onClick={() => rollDice('Sanidade', 0, 'generic')}>
          <Brain size={16} aria-hidden />
          Sanidade
        </button>
      </div>
    </Panel>
  )
}
