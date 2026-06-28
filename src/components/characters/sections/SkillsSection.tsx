import { Check, Dice5 } from 'lucide-react'
import { ATTRIBUTE_LABELS, CLASS_DATA, SKILLS } from '../../../data/characterData'
import type { AttributeKey, CharacterSheet, RollSource } from '../../../types/character'
import { signed } from '../../../utils/formatters'
import { AttributePicker } from '../AttributePicker'

type SkillsSectionProps = {
  sheet: CharacterSheet
  toggleSkill: (name: string) => void
  trainSuggestedSkills: () => void
  updateSkillAttribute: (skillName: string, attribute: AttributeKey) => void
  rollDice: (label: string, bonus?: number, source?: RollSource) => void
}

export function SkillsSection({
  sheet,
  toggleSkill,
  trainSuggestedSkills,
  updateSkillAttribute,
  rollDice,
}: SkillsSectionProps) {
  const classInfo = CLASS_DATA[sheet.identity.className]

  return (
    <section className="skills-tab">
      <header className="tab-section-header">
        <div>
          <p className="eyebrow">Pericias</p>
          <h2>Treino, atributo base e testes</h2>
        </div>
        <button type="button" className="ghost-button" onClick={trainSuggestedSkills}>
          <Check size={16} aria-hidden />
          Marcar sugestoes
        </button>
      </header>

      <div className="attribute-summary-grid">
        {(Object.keys(sheet.attributes) as AttributeKey[]).map((key) => (
          <span key={key}>
            <small>{ATTRIBUTE_LABELS[key].slice(0, 3)}</small>
            <strong>{signed(sheet.attributes[key].mod)}</strong>
          </span>
        ))}
      </div>

      <p className="skill-helper-text">
        {sheet.identity.className}: {classInfo.picks} entre {classInfo.suggested.join(', ')}.
      </p>

      <div className="skills-list upgraded">
        {SKILLS.map((skill) => {
          const trained = sheet.trainedSkills.includes(skill.name)
          const attribute = sheet.skillAttributeOverrides[skill.name] ?? skill.attribute
          const bonus = sheet.attributes[attribute].mod + (trained ? sheet.identity.proficiency : 0)
          return (
            <article className={trained ? 'skill-row trained' : 'skill-row'} key={skill.name}>
              <label>
                <input type="checkbox" checked={trained} onChange={() => toggleSkill(skill.name)} />
                <span>{skill.name}</span>
              </label>
              <AttributePicker
                value={attribute}
                onChange={(nextAttribute) => updateSkillAttribute(skill.name, nextAttribute)}
              />
              <button type="button" onClick={() => rollDice(skill.name, bonus, 'skill')}>
                <Dice5 size={15} aria-hidden />
                {signed(bonus)}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
