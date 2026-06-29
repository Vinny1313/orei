// Campo de formulário reutilizável: label + input + mensagem de erro.
// Consolida o markup repetido (`<label>…<input>…<span className="field-error">`).
// Encaminha todas as props nativas do <input> (name, value, onChange, etc.).

import type { InputHTMLAttributes, ReactNode } from 'react'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> & {
  label: ReactNode
  error?: string
}

export function Field({ label, error, ...inputProps }: FieldProps) {
  return (
    <label>
      {label}
      <input {...inputProps} aria-invalid={error ? true : undefined} />
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
