import { ChevronDown, HeartPulse, Shield, Sparkles, Swords, UserRound, Wind } from 'lucide-react'
import type { CSSProperties } from 'react'
import { CLASS_DATA } from '../../data/characterData'
import type { CharacterSheet, ClassName } from '../../types/character'
import { asNumber } from '../../utils/formatters'

type CharacterIdentityHeaderProps = {
  sheet: CharacterSheet
  updateIdentity: <K extends keyof CharacterSheet['identity']>(
    key: K,
    value: CharacterSheet['identity'][K],
  ) => void
}

export function CharacterIdentityHeader({ sheet, updateIdentity }: CharacterIdentityHeaderProps) {
  const classInfo = CLASS_DATA[sheet.identity.className]
  const hpPercent =
    sheet.combat.maxHp > 0
      ? Math.max(0, Math.min(100, (sheet.combat.currentHp / sheet.combat.maxHp) * 100))
      : 0

  return (
    <section className="character-identity-header">
      <div className="identity-name-block">
        <p className="eyebrow">Personagem</p>
        <input
          className="identity-name-input"
          value={sheet.identity.characterName}
          onChange={(event) => updateIdentity('characterName', event.target.value)}
          placeholder="Nome do personagem"
        />
        <p className="class-ability">{classInfo.ability}</p>
      </div>

      <div className="identity-fields">
        <label>
          <UserRound size={15} aria-hidden />
          Jogador
          <input
            value={sheet.identity.playerName}
            onChange={(event) => updateIdentity('playerName', event.target.value)}
            placeholder="Seu nome"
          />
        </label>
        <label>
          <Sparkles size={15} aria-hidden />
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
            <ChevronDown size={15} aria-hidden />
          </span>
        </label>
        <label>
          Nivel
          <input
            type="number"
            value={sheet.identity.level}
            onChange={(event) => updateIdentity('level', asNumber(event.target.value))}
          />
        </label>
        <label>
          Prof.
          <input
            type="number"
            value={sheet.identity.proficiency}
            onChange={(event) => updateIdentity('proficiency', asNumber(event.target.value))}
          />
        </label>
      </div>

      <div className="combat-ribbon" style={{ '--hp': `${hpPercent}%` } as CSSProperties}>
        <span>
          <HeartPulse size={15} aria-hidden />
          PV {sheet.combat.currentHp}/{sheet.combat.maxHp}
        </span>
        <span>
          <Shield size={15} aria-hidden />
          CA {sheet.combat.armorClass}
        </span>
        <span>
          <Swords size={15} aria-hidden />
          Ini {sheet.combat.initiative}
        </span>
        <span>
          <Sparkles size={15} aria-hidden />
          San {sheet.combat.sanity}
        </span>
        <span>
          <Wind size={15} aria-hidden />
          {sheet.combat.movement}m
        </span>
      </div>
    </section>
  )
}
