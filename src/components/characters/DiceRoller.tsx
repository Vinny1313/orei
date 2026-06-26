// Botão de rolar d20 sem bônus (usado no cabeçalho da ficha).

import { Dice5 } from 'lucide-react'

type DiceRollerProps = {
  onRoll: (label: string, bonus?: number) => void
}

export function DiceRoller({ onRoll }: DiceRollerProps) {
  return (
    <button type="button" className="roll-button" onClick={() => onRoll('d20 sem bônus')}>
      <Dice5 size={20} aria-hidden />
      Rolar d20
    </button>
  )
}
