// Campo numérico com botões -/+ usado em vários painéis. Extraído do antigo App.tsx.

import { asNumber } from '../../utils/formatters'

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="number-field">
      {label}
      <span>
        <button type="button" onClick={() => onChange(value - 1)} aria-label={`Diminuir ${label}`}>
          -
        </button>
        <input type="number" value={value} onChange={(event) => onChange(asNumber(event.target.value))} />
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </span>
    </label>
  )
}
