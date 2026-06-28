import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { ATTRIBUTE_LABELS } from '../../data/characterData'
import type { AttributeKey } from '../../types/character'

type AttributePickerProps = {
  value: AttributeKey
  onChange: (value: AttributeKey) => void
}

const ATTRIBUTES = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]

export function AttributePicker({ value, onChange }: AttributePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = ATTRIBUTE_LABELS[value]

  return (
    <div className="attribute-picker">
      <button
        type="button"
        className="attribute-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected.slice(0, 3)}</span>
        <strong>{selected}</strong>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <div className="attribute-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="attribute-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Escolher atributo base"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Atributo base</span>
                <strong>{selected}</strong>
              </div>
              <button type="button" className="icon-button small" onClick={() => setOpen(false)} title="Fechar">
                <X size={15} aria-hidden />
              </button>
            </header>
            <div className="attribute-modal-grid">
              {ATTRIBUTES.map((attribute) => (
                <button
                  key={attribute}
                  type="button"
                  className={attribute === value ? 'active' : ''}
                  onClick={() => {
                    onChange(attribute)
                    setOpen(false)
                  }}
                >
                  <span>{ATTRIBUTE_LABELS[attribute].slice(0, 3)}</span>
                  <strong>{ATTRIBUTE_LABELS[attribute]}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
