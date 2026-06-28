// Lógica de rolagem de dados, isolada da UI para ser testável e reutilizável.

export type D20Roll = {
  d20: number
  bonus: number
  total: number
}

/** Rola um d20 e soma um bônus opcional. */
export const rollD20 = (bonus = 0): D20Roll => {
  const d20 = Math.floor(Math.random() * 20) + 1
  return { d20, bonus, total: d20 + bonus }
}
