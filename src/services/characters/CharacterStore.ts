// Contrato comum dos backends de personagem. localStorage e Supabase implementam
// esta mesma interface, e o characterService escolhe um deles em runtime — assim a
// UI (hooks/telas) fala com uma API estável, sem saber onde os dados vivem.

import type { Character, CharacterSheet } from '../../types/character'

export type CharacterStore = {
  list: () => Promise<Character[]>
  get: (id: string) => Promise<Character | null>
  create: (initial?: Partial<CharacterSheet>) => Promise<Character>
  update: (id: string, sheet: CharacterSheet) => Promise<Character>
  remove: (id: string) => Promise<void>
}
