// Formulário de cadastro (username + e-mail + senha + confirmação) + Google.
// Valida com zod, mostra erros por campo/gerais e estados de loading.
//
// Em auth real, o Supabase normalmente exige confirmação de e-mail antes de criar
// sessão — por isso, em sucesso, exibimos um aviso para checar o e-mail (e não
// forçamos navegação). No modo visitante, segue direto para /agentes.

import { AlertTriangle, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authMode } from '../../services/authService'
import { signUpSchema } from '../../utils/validators'
import { GoogleLoginButton } from './GoogleLoginButton'
import { PasswordField } from './PasswordField'

type FieldKey = 'username' | 'displayName' | 'email' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<FieldKey, string>>

const clearPasswordFields = (form: HTMLFormElement) => {
  for (const name of ['password', 'confirmPassword']) {
    const field = form.elements.namedItem(name)
    if (field instanceof HTMLInputElement) field.value = ''
  }
}

export function RegisterForm() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const disabledEnv = authMode === 'disabled'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = signUpSchema.safeParse({
      username,
      displayName: displayName || undefined,
      email,
      password: String(formData.get('password') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
    })
    clearPasswordFields(form)

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setFieldErrors({
        username: flat.username?.[0],
        displayName: flat.displayName?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      })
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    const { error } = await signUp({
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      password: parsed.data.password,
    })
    setSubmitting(false)

    if (error) {
      setFormError(error)
      return
    }
    if (authMode === 'guest') {
      navigate('/agentes', { replace: true })
      return
    }
    setSuccess(true)
  }

  const handleGoogle = async () => {
    setFormError(null)
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setFormError(error)
      setGoogleLoading(false)
      return
    }
    if (authMode === 'guest') {
      navigate('/agentes', { replace: true })
    }
  }

  if (success) {
    return (
      <div className="auth-success" role="status">
        <MailCheck size={28} aria-hidden />
        <p>Conta criada! Verifique seu e-mail para confirmar o cadastro.</p>
        <Link to="/login" className="ghost-button">
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {disabledEnv && (
        <p className="auth-alert" role="alert">
          <AlertTriangle size={16} aria-hidden />
          Supabase não configurado: o cadastro está indisponível neste ambiente.
        </p>
      )}

      <label>
        Nome de usuário
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-invalid={!!fieldErrors.username}
          disabled={submitting}
        />
        {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
      </label>

      <label>
        Nome de exibição <span className="field-optional">(opcional)</span>
        <input
          type="text"
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          aria-invalid={!!fieldErrors.displayName}
          disabled={submitting}
        />
        {fieldErrors.displayName && (
          <span className="field-error">{fieldErrors.displayName}</span>
        )}
      </label>

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
        autoComplete="new-password"
        error={fieldErrors.password}
        disabled={submitting}
      />

      <PasswordField
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
        disabled={submitting}
      />

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="roll-button auth-submit" disabled={submitting || disabledEnv}>
        {submitting ? 'Criando conta…' : 'Criar conta'}
      </button>

      <div className="auth-divider">
        <span>ou</span>
      </div>

      <GoogleLoginButton
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={disabledEnv}
        label="Cadastrar com Google"
      />

      <p className="auth-switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </form>
  )
}
