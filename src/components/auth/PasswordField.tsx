import { Eye, EyeOff } from 'lucide-react'
import { useId, useState } from 'react'

type PasswordFieldProps = {
  label: string
  name: string
  autoComplete: string
  error?: string
  disabled?: boolean
}

export function PasswordField({
  label,
  name,
  autoComplete,
  error,
  disabled,
}: PasswordFieldProps) {
  const inputId = useId()
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye
  const title = visible ? 'Ocultar senha' : 'Mostrar senha'

  return (
    <label htmlFor={inputId}>
      {label}
      <span className="password-input-wrap">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={title}
          title={title}
          disabled={disabled}
        >
          <Icon size={18} aria-hidden />
        </button>
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
