// Backend localStorage — usado no modo visitante (dev sem Supabase). Mantém o app
// funcional sem backend e PRESERVA a migração da ficha antiga (chave single-sheet v1).
//
// É exatamente a persistência da Fase 1, agora isolada atrás do contrato CharacterStore.

import { createDefaultSheet } from '../../data/characterData'
import type { Character, CharacterSheet } from '../../types/character'
import { createRouteKey } from '../../utils/routeKeys'
import type { CharacterStore } from './CharacterStore'
import { normalizeSheet } from './normalizeSheet'

const STORAGE_KEY = 'orei:characters:v1'
const LEGACY_SHEET_KEY = 'orei-character-sheet-v1'

const nowIso = (): string => new Date().toISOString()

const writeStore = (characters: Character[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
}

/** Lê e migra o store bruto do localStorage. */
const readStore = (): Character[] => {
  let characters: Character[] = []
  let migrated = false

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Character[]
      if (Array.isArray(parsed)) {
        characters = parsed.map((character) => {
          const routeKey = character.routeKey || createRouteKey()
          if (!character.routeKey) migrated = true

          return {
            ...character,
            routeKey,
            sheet: normalizeSheet(character.sheet),
          }
        })
      }
    } catch {
      characters = []
    }
  }

  // MIGRAÇÃO: store novo vazio + ficha antiga (v1 single-sheet) presente → importa
  // como o primeiro personagem para não perder o trabalho do usuário. A chave antiga
  // é preservada como backup (não removemos).
  if (characters.length === 0) {
    const legacy = localStorage.getItem(LEGACY_SHEET_KEY)
    if (legacy) {
      try {
        const sheet = normalizeSheet(JSON.parse(legacy))
        const migrated: Character = {
          id: crypto.randomUUID(),
          routeKey: createRouteKey(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
          sheet,
        }
        characters = [migrated]
        writeStore(characters)
      } catch {
        // Ficha antiga corrompida: ignora e segue com store vazio.
      }
    }
  }

  if (migrated) writeStore(characters)

  return characters
}

export const localCharacterStore: CharacterStore = {
  list: async () => readStore(),

  getByRouteKey: async (routeKey) =>
    readStore().find((character) => character.routeKey === routeKey) ?? null,

  create: async (initial?: Partial<CharacterSheet>) => {
    const characters = readStore()
    const character: Character = {
      id: crypto.randomUUID(),
      routeKey: createRouteKey(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sheet: { ...createDefaultSheet(), ...initial },
    }
    writeStore([...characters, character])
    return character
  },

  update: async (id, sheet) => {
    const characters = readStore()
    const index = characters.findIndex((character) => character.id === id)
    if (index === -1) {
      throw new Error(`Personagem ${id} não encontrado.`)
    }
    const updated: Character = { ...characters[index], sheet, updatedAt: nowIso() }
    characters[index] = updated
    writeStore(characters)
    return updated
  },

  remove: async (id) => {
    writeStore(readStore().filter((character) => character.id !== id))
  },
}
