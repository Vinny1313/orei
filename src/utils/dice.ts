// Logica de rolagem de dados, isolada da UI para ser testavel e reutilizavel.

export type D20Roll = {
  d20: number
  bonus: number
  total: number
}

export type DiceFormulaParts = {
  formula: string
  count: number
  sides: number
  bonus: number
}

export type FormulaRoll = {
  formula: string
  rolls: number[]
  kept: number
  bonus: number
  total: number
}

const VALID_SIDES = new Set([4, 6, 8, 10, 12, 20, 100])

/** Rola um d20 e soma um bonus opcional. */
export const rollD20 = (bonus = 0): D20Roll => {
  const d20 = Math.floor(Math.random() * 20) + 1
  return { d20, bonus, total: d20 + bonus }
}

export const parseDiceFormula = (formula: string): DiceFormulaParts | null => {
  const match = formula.trim().toLowerCase().match(/^(\d*)d(\d+)\s*([+-]\s*\d+)?$/)
  if (!match) return null

  const count = match[1] ? Number(match[1]) : 1
  const sides = Number(match[2])
  const bonus = match[3] ? Number(match[3].replace(/\s/g, '')) : 0

  if (!Number.isInteger(count) || count < 1 || count > 20) return null
  if (!VALID_SIDES.has(sides)) return null
  if (!Number.isInteger(bonus)) return null

  return {
    formula: `${count === 1 ? '' : count}d${sides}${bonus ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''}`,
    count,
    sides,
    bonus,
  }
}

export const rollFormula = (formula: string): FormulaRoll | null => {
  const parsed = parseDiceFormula(formula)
  if (!parsed) return null

  const rolls = Array.from(
    { length: parsed.count },
    () => Math.floor(Math.random() * parsed.sides) + 1,
  )
  const kept = parsed.count === 1 ? rolls[0] : Math.max(...rolls)

  return {
    formula: parsed.formula,
    rolls,
    kept,
    bonus: parsed.bonus,
    total: kept + parsed.bonus,
  }
}
