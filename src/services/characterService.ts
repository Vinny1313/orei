// Camada de serviço de personagens — FACHADA estável sobre dois backends:
//
//   • Supabase (configurado + autenticado) → fonte de verdade no Postgres, RLS por owner.
//   • localStorage (modo visitante / sem Supabase) → mantém o app funcional sem backend.
//
// A UI (hooks/telas) importa SOMENTE este módulo; a escolha do backend é transparente
// e decidida uma vez, em runtime, pela presença do client Supabase. As assinaturas
// públicas são as mesmas desde a Fase 1 — trocar o backend não tocou em nenhuma tela.

import { supabase } from './supabaseClient'
import type { CharacterStore } from './characters/CharacterStore'
import { localCharacterStore } from './characters/localStore'
import { createSupabaseCharacterStore } from './characters/supabaseStore'
import type { Character, CharacterSheet } from '../types/character'

const store: CharacterStore = supabase
  ? createSupabaseCharacterStore(supabase)
  : localCharacterStore

export const listCharacters = (): Promise<Character[]> => store.list()

export const getCharacter = (routeKey: string): Promise<Character | null> =>
  store.getByRouteKey(routeKey)

export const createCharacter = (initial?: Partial<CharacterSheet>): Promise<Character> =>
  store.create(initial)

export const updateCharacter = (id: string, sheet: CharacterSheet): Promise<Character> =>
  store.update(id, sheet)

export const deleteCharacter = (id: string): Promise<void> => store.remove(id)
