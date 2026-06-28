// Painel de Atributos: valor + modificador por atributo, com botão de rolar.

import { Activity, Dice5 } from 'lucide-react'
import { ATTRIBUTE_LABELS } from '../../../data/characterData'
import type { AttributeKey, CharacterSheet } from '../../../types/character'
import { asNumber } from '../../../utils/formatters'
import { Panel } from '../../ui/Panel'

type AttributesSectionProps = {
  sheet: CharacterSheet
  updateAttribute: (key: AttributeKey, field: 'value' | 'mod', value: number) => void
  rollDice: (label: string, bonus?: number) => void
}

export function AttributesSection({ sheet, updateAttribute, rollDice }: AttributesSectionProps) {
  return (
    <Panel icon={<Activity size={18} />} title="Atributos">
      <div className="attributes-list">
        {(Object.keys(sheet.attributes) as AttributeKey[]).map((key) => (
          <div className="attribute-row" key={key}>
            <button type="button" onClick={() => rollDice(ATTRIBUTE_LABELS[key], sheet.attributes[key].mod)}>
              <Dice5 size={15} aria-hidden />
            </button>
            <span>{sheet.attributes[key].label}</span>
            <input
              aria-label={`${sheet.attributes[key].label} valor`}
              type="number"
              value={sheet.attributes[key].value}
              onChange={(event) => updateAttribute(key, 'value', asNumber(event.target.value))}
            />
            <input
              aria-label={`${sheet.attributes[key].label} modificador`}
              type="number"
              value={sheet.attributes[key].mod}
              onChange={(event) => updateAttribute(key, 'mod', asNumber(event.target.value))}
            />
          </div>
        ))}
      </div>
    </Panel>
  )
}
