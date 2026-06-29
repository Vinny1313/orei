// Formulário de login (e-mail/senha) + Google. Valida com zod, mostra erros por
// campo e um erro geral do service, com estados de loading. Redireciona para a
// origem (location.state.from) ou /agentes após sucesso.

import { AlertTriangle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authMode } from '../../services/authService'
import { signInSchema } from '../../utils/validators'
import { GoogleLoginButton } from './GoogleLoginButton'
import { PasswordField } from './PasswordField'

type FieldErrors = Partial<Record<'email' | 'password', string>>

/** Extrai um caminho seguro de location.state.from (default /agentes). */
const resolveRedirect = (state: unknown): string => {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from?: unknown }).from
    if (from && typeof from === 'object' && 'pathname' in from) {
      const pathname = (from as { pathname?: unknown }).pathname
      if (typeof pathname === 'string' && pathname.length > 0) return pathname
    }
  }
  return '/agentes'
}

const clearPasswordFields = (form: HTMLFormElement) => {
  const passwordField = form.elements.namedItem('password')
  if (passwordField instanceof HTMLInputElement) passwordField.value = ''
}

export function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const disabledEnv = authMode === 'disabled'
  const redirectTo = resolveRedirect(location.state)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = signInSchema.safeParse({
      email,
      password: String(formData.get('password') ?? ''),
    })
    clearPasswordFields(form)

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setFieldErrors({ email: flat.email?.[0], password: flat.password?.[0] })
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    const { error } = await signIn(parsed.data)
    setSubmitting(false)

    if (error) {
      setFormError(error)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  const handleGoogle = async () => {
    setFormError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    // Em caso de sucesso o browser é redirecionado pelo provedor; só tratamos erro.
    if (error) {
      setFormError(error)
      setGoogleLoading(false)
      return
    }
    if (authMode === 'guest') {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {disabledEnv && (
        <p className="auth-alert" role="alert">
          <AlertTriangle size={16} aria-hidden />
          Supabase não configurado: o login está indisponível neste ambiente.
        </p>
      )}

      <label>
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!fieldErrors.email}
          disabled={submitting}
        />
        {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
      </label>

      <PasswordField
        label="Senha"
        name="password"
        autoComplete="current-password"
        error={fieldErrors.password}
        disabled={submitting}
      />

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="roll-button auth-submit" disabled={submitting || disabledEnv}>
        {submitting ? 'Entrando…' : 'Entrar'}
      </button>

      <div className="auth-divider">
        <span>ou</span>
      </div>

      <GoogleLoginButton onClick={handleGoogle} loading={googleLoading} disabled={disabledEnv} />

      <p className="auth-switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </form>
  )
}
