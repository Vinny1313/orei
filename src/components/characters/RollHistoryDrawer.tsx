import { History, Trash2, X } from 'lucide-react'
import type { RollHistoryEntry } from '../../types/character'
import { signed } from '../../utils/formatters'

type RollHistoryDrawerProps = {
  open: boolean
  rolls: RollHistoryEntry[]
  onClose: () => void
  onClear: () => void
}

const formatTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function RollHistoryDrawer({ open, rolls, onClose, onClear }: RollHistoryDrawerProps) {
  return (
    <aside className={open ? 'roll-history-drawer open' : 'roll-history-drawer'} aria-hidden={!open}>
      <header>
        <span>
          <History size={18} aria-hidden />
          Historico
        </span>
        <button type="button" className="icon-button small" onClick={onClose} title="Fechar historico">
          <X size={15} aria-hidden />
        </button>
      </header>

      {rolls.length > 0 ? (
        <>
          <button type="button" className="ghost-button history-clear" onClick={onClear}>
            <Trash2 size={15} aria-hidden />
            Limpar historico
          </button>
          <ol className="roll-history-list">
            {rolls.map((roll) => (
              <li key={roll.id}>
                <div>
                  <strong>{roll.label}</strong>
                  <time>{formatTime(roll.createdAt)}</time>
                </div>
                <span className="history-total">{roll.total}</span>
                <small>
                  {roll.formula}: [{roll.rolls.join(', ')}] fica {roll.kept} {signed(roll.bonus)}
                </small>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="muted-note">Nenhuma rolagem registrada ainda.</p>
      )}
    </aside>
  )
}
