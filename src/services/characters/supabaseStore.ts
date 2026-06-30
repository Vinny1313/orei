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
  route_key?: string | null
  owner_id: string
  sheet: unknown
  created_at: string
  updated_at: string
}

const mapRow = (row: CharacterRow): Character => ({
  id: row.id,
  routeKey: row.route_key ?? row.id,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  sheet: normalizeSheet(row.sheet),
})

/** id do usuário autenticado (para filtrar o dashboard só pelos próprios). */
const currentUserId = async (supabase: SupabaseClient): Promise<string | null> => {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

const isMissingRouteKeyError = (error: { message?: string; code?: string } | null): boolean =>
  error?.code === '42703' || error?.message?.includes('route_key') === true

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

export const createSupabaseCharacterStore = (supabase: SupabaseClient): CharacterStore => ({
  list: async () => {
    // O dashboard /agentes mostra SOMENTE os personagens do próprio dono. Filtramos
    // explicitamente por owner_id: a RLS pode liberar fichas alheias para leitura
    // (mestre / compartilhadas em campanha), mas elas nunca devem entrar nesta lista.
    const me = await currentUserId(supabase)
    let query = supabase.from('characters').select('*').order('updated_at', { ascending: false })
    if (me) query = query.eq('owner_id', me)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data ?? []) as CharacterRow[]).map(mapRow)
  },

  getByRouteKey: async (routeKey) => {
    const byRouteKey = await supabase
      .from('characters')
      .select('*')
      .eq('route_key', routeKey)
      .maybeSingle()

    if (!byRouteKey.error && byRouteKey.data) {
      return mapRow(byRouteKey.data as CharacterRow)
    }
    if (byRouteKey.error && !isMissingRouteKeyError(byRouteKey.error)) {
      throw new Error(byRouteKey.error.message)
    }
    if (!isUuid(routeKey)) return null

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', routeKey)
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
