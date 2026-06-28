// Criação de personagem (/agentes/novo): formulário mínimo -> cria -> abre a ficha.

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { CharacterForm } from '../components/characters/CharacterForm'
import type { CharacterFormValues } from '../components/characters/CharacterForm'
import { createCharacter } from '../services/characterService'

const INITIAL_VALUES: CharacterFormValues = {
  characterName: '',
  playerName: '',
  className: 'Guerreiro',
  level: 1,
}

export function NewCharacterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<CharacterFormValues>(INITIAL_VALUES)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = <K extends keyof CharacterFormValues>(
    key: K,
    value: CharacterFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!values.characterName.trim()) {
      setError('O nome do personagem é obrigatório.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const character = await createCharacter({
        identity: {
          characterName: values.characterName.trim(),
          playerName: values.playerName.trim(),
          className: values.className,
          level: values.level,
          proficiency: 2,
        },
      })
      navigate(`/agentes/${character.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o personagem.')
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <Link to="/agentes" className="back-link">
            <ArrowLeft size={16} aria-hidden />
            Voltar aos agentes
          </Link>
          <h1>Novo personagem</h1>
        </div>
      </header>

      <CharacterForm
        values={values}
        error={error}
        submitting={submitting}
        onChange={handleChange}
        onSubmit={() => void handleSubmit()}
        onCancel={() => navigate('/agentes')}
      />
    </main>
  )
}
