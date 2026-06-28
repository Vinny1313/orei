// Formulário de campanha (criar/editar). Componente controlado: estado e submit na página.

import type { FormEvent } from 'react'

export type CampaignFormValues = {
  name: string
  description: string
}

type CampaignFormProps = {
  values: CampaignFormValues
  error?: string | null
  submitting?: boolean
  submitLabel?: string
  onChange: <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) => void
  onSubmit: () => void
  onCancel: () => void
}

export function CampaignForm({
  values,
  error,
  submitting,
  submitLabel = 'Criar campanha',
  onChange,
  onSubmit,
  onCancel,
}: CampaignFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="character-form panel" onSubmit={handleSubmit}>
      <label>
        Nome da campanha
        <input
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="Ex.: A Sombra sobre Valdônia"
          autoFocus
        />
      </label>
      <label>
        Descrição
        <textarea
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Resumo, tom da mesa, regras da casa..."
          rows={4}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="roll-button" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
