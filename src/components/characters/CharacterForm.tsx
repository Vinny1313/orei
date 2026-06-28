// Formulário inicial de criação de personagem (campos mínimos).
// Componente controlado: o estado e o submit ficam na página que o usa.

import type { FormEvent } from 'react'
import { CLASS_DATA } from '../../data/characterData'
import type { ClassName } from '../../types/character'
import { NumberField } from '../ui/NumberField'

export type CharacterFormValues = {
  characterName: string
  playerName: string
  className: ClassName
  level: number
}

type CharacterFormProps = {
  values: CharacterFormValues
  error?: string | null
  submitting?: boolean
  onChange: <K extends keyof CharacterFormValues>(key: K, value: CharacterFormValues[K]) => void
  onSubmit: () => void
  onCancel: () => void
}

export function CharacterForm({
  values,
  error,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}: CharacterFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="character-form panel" onSubmit={handleSubmit}>
      <label>
        Nome do personagem
        <input
          value={values.characterName}
          onChange={(event) => onChange('characterName', event.target.value)}
          placeholder="Ex.: Thornan, o Bravo"
          autoFocus
        />
      </label>
      <label>
        Nome do jogador
        <input
          value={values.playerName}
          onChange={(event) => onChange('playerName', event.target.value)}
          placeholder="Seu nome"
        />
      </label>
      <label>
        Classe
        <span className="select-wrap">
          <select
            value={values.className}
            onChange={(event) => onChange('className', event.target.value as ClassName)}
          >
            {Object.keys(CLASS_DATA).map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>
        </span>
      </label>
      <NumberField label="Nível" value={values.level} onChange={(value) => onChange('level', value)} />

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="roll-button" disabled={submitting}>
          {submitting ? 'Criando…' : 'Criar personagem'}
        </button>
      </div>
    </form>
  )
}
