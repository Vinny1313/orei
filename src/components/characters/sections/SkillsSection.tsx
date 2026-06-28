// Painel de Perícias: lista treinável, atalho de sugestões da classe e bônus por perícia.

import { Check } from 'lucide-react'
import { ATTRIBUTE_LABELS, CLASS_DATA, SKILLS } from '../../../data/characterData'
import type { CharacterSheet } from '../../../types/character'
import { signed } from '../../../utils/formatters'
import { Panel } from '../../ui/Panel'

type SkillsSectionProps = {
  sheet: CharacterSheet
  toggleSkill: (name: string) => void
  trainSuggestedSkills: () => void
  rollDice: (label: string, bonus?: number) => void
}

export function SkillsSection({
  sheet,
  toggleSkill,
  trainSuggestedSkills,
  rollDice,
}: SkillsSectionProps) {
  const classInfo = CLASS_DATA[sheet.identity.className]

  return (
    <Panel icon={<Check size={18} />} title="Perícias" className="skills-panel">
      <div className="skill-helper">
        <span>
          {classInfo.picks}: {classInfo.suggested.join(', ')}
        </span>
        <button type="button" onClick={trainSuggestedSkills}>
          Marcar sugestões
        </button>
      </div>
      <div className="skills-list">
        {SKILLS.map((skill) => {
          const trained = sheet.trainedSkills.includes(skill.name)
          const bonus = sheet.attributes[skill.attribute].mod + (trained ? sheet.identity.proficiency : 0)
          return (
            <div className={trained ? 'skill-row trained' : 'skill-row'} key={skill.name}>
              <label>
                <input type="checkbox" checked={trained} onChange={() => toggleSkill(skill.name)} />
                <span>{skill.name}</span>
              </label>
              <small>{ATTRIBUTE_LABELS[skill.attribute].slice(0, 3)}</small>
              <button type="button" onClick={() => rollDice(skill.name, bonus)}>
                {signed(bonus)}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
