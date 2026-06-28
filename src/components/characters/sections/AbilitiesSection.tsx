import { useState } from 'react'
import { Dice5, Plus, Trash2, Wand2 } from 'lucide-react'
import type { AbilityEntry, PassiveEntry } from '../../../types/character'
import { parseDiceFormula } from '../../../utils/dice'

type AbilityField = Exclude<keyof AbilityEntry, 'id'>
type PassiveField = Exclude<keyof PassiveEntry, 'id'>

type AbilitiesSectionProps = {
  abilities: AbilityEntry[]
  passives: PassiveEntry[]
  updateAbility: <K extends AbilityField>(id: string, key: K, value: AbilityEntry[K]) => void
  addAbility: () => void
  removeAbility: (id: string) => void
  updatePassive: <K extends PassiveField>(id: string, key: K, value: PassiveEntry[K]) => void
  addPassive: () => void
  removePassive: (id: string) => void
  rollDamage: (label: string, formula: string) => boolean
}

export function AbilitiesSection({
  abilities,
  passives,
  updateAbility,
  addAbility,
  removeAbility,
  updatePassive,
  addPassive,
  removePassive,
  rollDamage,
}: AbilitiesSectionProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleRoll = (id: string, label: string, formula?: string) => {
    if (!formula || !parseDiceFormula(formula)) {
      setErrors((current) => ({ ...current, [id]: 'Formula invalida. Use algo como 2d6+3.' }))
      return
    }
    const ok = rollDamage(label || 'Dano', formula)
    setErrors((current) => ({ ...current, [id]: ok ? '' : 'Formula invalida.' }))
  }

  return (
    <section className="abilities-tab">
      <header className="tab-section-header">
        <div>
          <p className="eyebrow">Arsenal</p>
          <h2>Habilidades e passivas</h2>
        </div>
        <div className="tab-actions">
          <button type="button" className="ghost-button" onClick={addAbility}>
            <Plus size={16} aria-hidden />
            Habilidade
          </button>
          <button type="button" className="ghost-button" onClick={addPassive}>
            <Plus size={16} aria-hidden />
            Passiva
          </button>
        </div>
      </header>

      <div className="ability-columns">
        <div className="ability-stack">
          <h3>
            <Wand2 size={17} aria-hidden />
            Habilidades
          </h3>
          {abilities.length === 0 ? (
            <p className="muted-note">Nenhuma habilidade cadastrada.</p>
          ) : (
            abilities.map((ability) => (
              <article className="ability-card" key={ability.id}>
                <header>
                  <input
                    value={ability.name}
                    onChange={(event) => updateAbility(ability.id, 'name', event.target.value)}
                    placeholder="Nome da habilidade"
                  />
                  <button
                    type="button"
                    className="icon-button small danger"
                    onClick={() => removeAbility(ability.id)}
                    title="Remover habilidade"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </header>
                <div className="ability-field-grid">
                  <input
                    value={ability.range}
                    onChange={(event) => updateAbility(ability.id, 'range', event.target.value)}
                    placeholder="Alcance"
                  />
                  <input
                    value={ability.area}
                    onChange={(event) => updateAbility(ability.id, 'area', event.target.value)}
                    placeholder="Area"
                  />
                  <input
                    value={ability.effect}
                    onChange={(event) => updateAbility(ability.id, 'effect', event.target.value)}
                    placeholder="Efeito"
                  />
                  <span className="damage-input">
                    <input
                      value={ability.damageFormula}
                      onChange={(event) => {
                        setErrors((current) => ({ ...current, [ability.id]: '' }))
                        updateAbility(ability.id, 'damageFormula', event.target.value)
                      }}
                      placeholder="Dano ex.: 2d6+3"
                    />
                    <button
                      type="button"
                      disabled={!ability.damageFormula}
                      onClick={() => handleRoll(ability.id, ability.name, ability.damageFormula)}
                    >
                      <Dice5 size={15} aria-hidden />
                    </button>
                  </span>
                </div>
                {errors[ability.id] && <small className="field-error">{errors[ability.id]}</small>}
                <textarea
                  value={ability.description}
                  onChange={(event) => updateAbility(ability.id, 'description', event.target.value)}
                  placeholder="Descricao"
                />
              </article>
            ))
          )}
        </div>

        <div className="ability-stack passive">
          <h3>Passivas</h3>
          {passives.length === 0 ? (
            <p className="muted-note">Nenhuma passiva cadastrada.</p>
          ) : (
            passives.map((passive) => (
              <article className="ability-card passive" key={passive.id}>
                <header>
                  <input
                    value={passive.name ?? ''}
                    onChange={(event) => updatePassive(passive.id, 'name', event.target.value)}
                    placeholder="Nome da passiva"
                  />
                  <button
                    type="button"
                    className="icon-button small danger"
                    onClick={() => removePassive(passive.id)}
                    title="Remover passiva"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </header>
                <div className="ability-field-grid">
                  <input
                    value={passive.range ?? ''}
                    onChange={(event) => updatePassive(passive.id, 'range', event.target.value)}
                    placeholder="Alcance"
                  />
                  <input
                    value={passive.area ?? ''}
                    onChange={(event) => updatePassive(passive.id, 'area', event.target.value)}
                    placeholder="Area"
                  />
                  <input
                    value={passive.effect ?? ''}
                    onChange={(event) => updatePassive(passive.id, 'effect', event.target.value)}
                    placeholder="Efeito"
                  />
                  <span className="damage-input">
                    <input
                      value={passive.damageFormula ?? ''}
                      onChange={(event) => {
                        setErrors((current) => ({ ...current, [passive.id]: '' }))
                        updatePassive(passive.id, 'damageFormula', event.target.value)
                      }}
                      placeholder="Dano opcional"
                    />
                    <button
                      type="button"
                      disabled={!passive.damageFormula}
                      onClick={() => handleRoll(passive.id, passive.name ?? 'Passiva', passive.damageFormula)}
                    >
                      <Dice5 size={15} aria-hidden />
                    </button>
                  </span>
                </div>
                {errors[passive.id] && <small className="field-error">{errors[passive.id]}</small>}
                <textarea
                  value={passive.description ?? ''}
                  onChange={(event) => updatePassive(passive.id, 'description', event.target.value)}
                  placeholder="Descricao opcional"
                />
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
