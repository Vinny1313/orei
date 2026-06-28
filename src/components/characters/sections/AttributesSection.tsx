import { Activity, Dice5 } from 'lucide-react'
import { ATTRIBUTE_LABELS } from '../../../data/characterData'
import type { AttributeKey, CharacterSheet, RollSource } from '../../../types/character'
import { asNumber, signed } from '../../../utils/formatters'

type AttributesSectionProps = {
  sheet: CharacterSheet
  updateAttribute: (key: AttributeKey, field: 'value' | 'mod', value: number) => void
  rollDice: (label: string, bonus?: number, source?: RollSource) => void
}

const ATTRIBUTE_ORDER: AttributeKey[] = [
  'forca',
  'constituicao',
  'sabedoria',
  'carisma',
  'inteligencia',
  'destreza',
]

export function AttributesSection({ sheet, updateAttribute, rollDice }: AttributesSectionProps) {
  return (
    <section className="attribute-star-panel">
      <header className="panel-header">
        <span>
          <Activity size={18} aria-hidden />
        </span>
        <h2>Atributos</h2>
      </header>

      <div className="attribute-star">
        <svg className="attribute-star-lines" viewBox="0 0 100 100" aria-hidden>
          <polygon className="star-triangle gold" points="50,4 92,78 8,78" />
          <polygon className="star-triangle red" points="8,22 92,22 50,96" />
          <polygon className="star-hex" points="50,7 85,28 85,72 50,93 15,72 15,28" />
          <line x1="50" y1="50" x2="50" y2="7" />
          <line x1="50" y1="50" x2="85" y2="28" />
          <line x1="50" y1="50" x2="85" y2="72" />
          <line x1="50" y1="50" x2="50" y2="93" />
          <line x1="50" y1="50" x2="15" y2="72" />
          <line x1="50" y1="50" x2="15" y2="28" />
          <circle cx="50" cy="7" r="1.8" />
          <circle cx="85" cy="28" r="1.8" />
          <circle cx="85" cy="72" r="1.8" />
          <circle cx="50" cy="93" r="1.8" />
          <circle cx="15" cy="72" r="1.8" />
          <circle cx="15" cy="28" r="1.8" />
        </svg>
        <div className="attribute-star-core">
          <strong>{sheet.identity.className}</strong>
          <span>Nivel {sheet.identity.level}</span>
          <small>Prof. {signed(sheet.identity.proficiency)}</small>
        </div>

        {ATTRIBUTE_ORDER.map((key, index) => {
          const attribute = sheet.attributes[key]
          return (
            <article className={`attribute-point point-${index}`} key={key}>
              <button
                type="button"
                className="attribute-roll"
                onClick={() => rollDice(ATTRIBUTE_LABELS[key], attribute.mod, 'attribute')}
                title={`Rolar ${ATTRIBUTE_LABELS[key]}`}
              >
                <Dice5 size={15} aria-hidden />
              </button>
              <strong>{attribute.label}</strong>
              <label>
                Valor
                <input
                  type="number"
                  value={attribute.value}
                  onChange={(event) => updateAttribute(key, 'value', asNumber(event.target.value))}
                />
              </label>
              <label>
                Mod
                <input
                  type="number"
                  value={attribute.mod}
                  onChange={(event) => updateAttribute(key, 'mod', asNumber(event.target.value))}
                />
              </label>
            </article>
          )
        })}
      </div>
    </section>
  )
}
