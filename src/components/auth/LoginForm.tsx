// Formulário de login. O fluxo principal é o Google (botão em destaque no topo);
// e-mail/senha ficam recolhidos atrás de um toggle "Entrar com e-mail". Valida com
// zod, mostra erros por campo e um erro geral do service, com estados de loading.
// Redireciona para a origem (location.state.from) ou /agentes após sucesso.

import { AlertTriangle, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authMode } from '../../services/authService'
import { signInSchema } from '../../utils/validators'
import { Field } from '../ui/Field'
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
  const [showEmail, setShowEmail] = useState(false)

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

      <GoogleLoginButton onClick={handleGoogle} loading={googleLoading} disabled={disabledEnv} />

      <div className="auth-divider">
        <span>ou</span>
      </div>

      {showEmail ? (
        <div className="auth-email-fields">
          <Field
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={submitting}
          />

          <PasswordField
            label="Senha"
            name="password"
            autoComplete="current-password"
            error={fieldErrors.password}
            disabled={submitting}
          />

          <button
            type="submit"
            className="roll-button auth-submit"
            disabled={submitting || disabledEnv}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="ghost-button auth-submit"
          onClick={() => setShowEmail(true)}
          disabled={disabledEnv}
        >
          <Mail size={16} aria-hidden />
          Entrar com e-mail e senha
        </button>
      )}

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <p className="auth-switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </form>
  )
}
