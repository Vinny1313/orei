// Painel "Última rolagem": mostra o resultado do último teste de dado.

import { Sparkles } from 'lucide-react'
import type { RollResult } from '../../../types/character'
import { signed } from '../../../utils/formatters'
import { Panel } from '../../ui/Panel'

type LastRollPanelProps = {
  roll: RollResult | null
}

export function LastRollPanel({ roll }: LastRollPanelProps) {
  return (
    <Panel icon={<Sparkles size={18} />} title="Última rolagem" className="roll-panel">
      {roll ? (
        <div className="roll-result">
          <span>{roll.label}</span>
          <strong>{roll.total}</strong>
          <small>
            d20 {roll.d20} {signed(roll.bonus)}
          </small>
        </div>
      ) : (
        <div className="empty-state">Role um teste para ver o resultado aqui.</div>
      )}
    </Panel>
  )
}
