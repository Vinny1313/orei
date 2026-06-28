import { X } from 'lucide-react'
import type { RollHistoryEntry } from '../../types/character'
import { signed } from '../../utils/formatters'

type RollToastProps = {
  roll: RollHistoryEntry | null
  onDismiss: () => void
}

export function RollToast({ roll, onDismiss }: RollToastProps) {
  if (!roll) return null

  return (
    <aside className="roll-toast" role="status" aria-live="polite">
      <button type="button" className="icon-button small" onClick={onDismiss} title="Fechar">
        <X size={14} aria-hidden />
      </button>
      <span>{roll.label}</span>
      <strong>{roll.total}</strong>
      <small>
        {roll.formula}: [{roll.rolls.join(', ')}] fica {roll.kept} {signed(roll.bonus)}
      </small>
    </aside>
  )
}
