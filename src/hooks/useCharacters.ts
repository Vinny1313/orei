// Hooks de acesso a personagens. Encapsulam o characterService e expõem
// estados de loading/erro para a UI consumir sem tocar em persistência.

import { useCallback, useEffect, useState } from 'react'
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  updateCharacter,
} from '../services/characterService'
import type { Character, CharacterSheet } from '../types/character'

type UseCharactersResult = {
  characters: Character[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  remove: (id: string) => Promise<void>
}

/** Lista de personagens para o dashboard. */
export function useCharacters(): UseCharactersResult {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCharacters(await listCharacters())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar os agentes.')
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(
    async (id: string) => {
      await deleteCharacter(id)
      await reload()
    },
    [reload],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  return { characters, loading, error, reload, remove }
}

type UseCharacterResult = {
  character: Character | null
  loading: boolean
  error: string | null
  /** Persiste uma ficha e devolve o personagem atualizado. */
  save: (sheet: CharacterSheet) => Promise<Character>
}

/** Personagem individual para a página de ficha. */
export function useCharacter(routeKey: string | undefined): UseCharacterResult {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    if (!routeKey) {
      setCharacter(null)
      setLoading(false)
      return
    }

    getCharacter(routeKey)
      .then((found) => {
        if (active) {
          setCharacter(found)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar a ficha.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [routeKey])

  const save = useCallback(
    async (sheet: CharacterSheet): Promise<Character> => {
      if (!character) {
        throw new Error('Sem personagem carregado para salvar.')
      }
      const updated = await updateCharacter(character.id, sheet)
      setCharacter(updated)
      return updated
    },
    [character],
  )

  return { character, loading, error, save }
}
