// Painel de Identidade da ficha (jogador, classe, nível, proficiência + nota da classe).

import { ChevronDown, UserRound } from 'lucide-react'
import { CLASS_DATA } from '../../../data/characterData'
import type { CharacterSheet, ClassName } from '../../../types/character'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'

type IdentitySectionProps = {
  sheet: CharacterSheet
  updateIdentity: <K extends keyof CharacterSheet['identity']>(
    key: K,
    value: CharacterSheet['identity'][K],
  ) => void
}

export function IdentitySection({ sheet, updateIdentity }: IdentitySectionProps) {
  const classInfo = CLASS_DATA[sheet.identity.className]

  return (
    <Panel icon={<UserRound size={18} />} title="Identidade" className="identity-panel">
      <div className="field-grid two">
        <label>
          Jogador
          <input
            value={sheet.identity.playerName}
            onChange={(event) => updateIdentity('playerName', event.target.value)}
            placeholder="Seu nome"
          />
        </label>
        <label>
          Classe
          <span className="select-wrap">
            <select
              value={sheet.identity.className}
              onChange={(event) => updateIdentity('className', event.target.value as ClassName)}
            >
              {Object.keys(CLASS_DATA).map((className) => (
                <option key={className}>{className}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden />
          </span>
        </label>
        <NumberField
          label="Nível"
          value={sheet.identity.level}
          onChange={(value) => updateIdentity('level', value)}
        />
        <NumberField
          label="Proficiência"
          value={sheet.identity.proficiency}
          onChange={(value) => updateIdentity('proficiency', value)}
        />
      </div>
      <div className="class-note">
        <strong>{sheet.identity.className}</strong>
        <span>{classInfo.ability}</span>
      </div>
    </Panel>
  )
}
