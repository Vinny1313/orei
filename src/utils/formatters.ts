// Pequenos helpers de formatação/conversão usados pela ficha.

/** Converte texto de input numérico em número, tratando vazio/inválido como 0. */
export const asNumber = (value: string): number => Number(value) || 0

/** Formata um número com sinal explícito (ex.: +3, -1, +0). */
export const signed = (value: number): string => (value >= 0 ? `+${value}` : `${value}`)
