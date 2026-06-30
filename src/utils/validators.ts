// Schemas de validação dos formulários de autenticação (zod).
// As telas usam estes schemas para validar antes de chamar o authService,
// e os tipos inferidos mantêm formulário e service em sincronia.

import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('E-mail inválido.')

const signInPassword = z.string().min(1, 'Informe sua senha.')

const newPassword = z
  .string()
  .min(6, 'A senha deve ter ao menos 6 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
  .regex(/[0-9]/, 'A senha deve conter ao menos um nÃºmero.')

const username = z
  .string()
  .trim()
  .min(3, 'O nome de usuário deve ter ao menos 3 caracteres.')
  .max(32, 'O nome de usuário deve ter no máximo 32 caracteres.')

/** Login: e-mail válido + senha mínima. */
export const signInSchema = z.object({
  email,
  password: signInPassword,
})

/**
 * Cadastro: usuário obrigatório, e-mail válido, senha mínima e confirmação.
 * `displayName` é opcional (cai para o username se vazio, no service).
 */
export const signUpSchema = z
  .object({
    username,
    displayName: z.string().trim().max(60).optional(),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
