// Formulário de cadastro. Fluxo principal é o Google (botão em destaque no topo);
// os campos (username + e-mail + senha + confirmação) ficam recolhidos atrás de um
// toggle "Criar conta com e-mail". Valida com zod, mostra erros por campo/gerais.
//
// Em auth real, o Supabase normalmente exige confirmação de e-mail antes de criar
// sessão — por isso, em sucesso, exibimos um aviso para checar o e-mail (e não
// forçamos navegação). No modo visitante, segue direto para /agentes.

import { AlertTriangle, Mail, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authMode } from '../../services/authService'
import { signUpSchema } from '../../utils/validators'
import { Field } from '../ui/Field'
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
  const [showEmail, setShowEmail] = useState(false)

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

      <GoogleLoginButton
        onClick={handleGoogle}
        loading={googleLoading}
        disabled={disabledEnv}
        label="Cadastrar com Google"
      />

      <div className="auth-divider">
        <span>ou</span>
      </div>

      {showEmail ? (
        <div className="auth-email-fields">
          <Field
            label="Nome de usuário"
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            disabled={submitting}
          />

          <Field
            label={
              <>
                Nome de exibição <span className="field-optional">(opcional)</span>
              </>
            }
            type="text"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={fieldErrors.displayName}
            disabled={submitting}
          />

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

          <button
            type="submit"
            className="roll-button auth-submit"
            disabled={submitting || disabledEnv}
          >
            {submitting ? 'Criando conta…' : 'Criar conta'}
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
          Criar conta com e-mail
        </button>
      )}

      {formError && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <p className="auth-switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </form>
  )
}
