// Backend Supabase/Postgres — usado quando o projeto está configurado e o usuário
// autenticado. A RLS (ver supabase/migrations/0001_init.sql) garante que só os
// personagens do dono (owner_id = auth.uid()) sejam lidos/escritos; `owner_id` tem
// default auth.uid(), então nem precisamos informá-lo no insert.

import type { SupabaseClient } from '@supabase/supabase-js'
import { createDefaultSheet } from '../../data/characterData'
import type { Character, CharacterSheet } from '../../types/character'
import type { CharacterStore } from './CharacterStore'
import { normalizeSheet } from './normalizeSheet'

/** Shape da linha da tabela public.characters. */
type CharacterRow = {
  id: string
  owner_id: string
  sheet: unknown
  created_at: string
  updated_at: string
}

const mapRow = (row: CharacterRow): Character => ({
  id: row.id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sheet: normalizeSheet(row.sheet),
})

export const createSupabaseCharacterStore = (supabase: SupabaseClient): CharacterStore => ({
  list: async () => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as CharacterRow[]).map(mapRow)
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRow(data as CharacterRow) : null
  },

  create: async (initial?: Partial<CharacterSheet>) => {
    const sheet = { ...createDefaultSheet(), ...initial }
    const { data, error } = await supabase
      .from('characters')
      .insert({ sheet })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return mapRow(data as CharacterRow)
  },

  update: async (id, sheet) => {
    const { data, error } = await supabase
      .from('characters')
      .update({ sheet })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return mapRow(data as CharacterRow)
  },

  remove: async (id) => {
    const { error } = await supabase.from('characters').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
})
