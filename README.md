# O Rei Mandou

Ficha digital de RPG — crie, gerencie e role os dados das suas fichas de personagem.

Stack: React 19 + TypeScript (strict) + Vite + react-router-dom v7 + Supabase Auth.

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento (Vite)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm run preview  # serve o build de produção
```

## Autenticação / Configuração do Supabase

A app usa **Supabase Auth** (e-mail/senha + Google OAuth). A configuração é por
variáveis de ambiente e tem **degradação graciosa**:

- **Com `.env` configurado** → autenticação real: login, cadastro, logout e guards
  de rota funcionando de verdade.
- **Sem `.env`, em `npm run dev`** → **modo visitante**: a app libera um usuário
  sintético "Visitante" para você desenvolver sem travar. Um badge "Modo visitante"
  aparece na navbar. Nada vai à rede.
- **Sem `.env`, em produção (`npm run build`)** → acesso bloqueado e a tela de login
  avisa que o Supabase não está configurado. Nunca há acesso silencioso em produção.

### 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um projeto (anote a senha do banco).
2. Em **Project Settings → API**, copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

### 2. Criar o arquivo `.env`

Copie `.env.example` para `.env` (ou `.env.local`) na raiz do projeto e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> O `.env`/`.env.local` está no `.gitignore` — **nunca** commite chaves reais.
> Reinicie o `npm run dev` após criar/alterar o `.env`.

### 3. Habilitar o login com Google (OAuth)

1. No Supabase: **Authentication → Providers → Google** e ative o provedor.
   Copie a **Callback URL** exibida (algo como
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
2. No **Google Cloud Console** (https://console.cloud.google.com):
   - **APIs & Services → OAuth consent screen**: configure (tipo "External" serve para testes).
   - **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
     tipo **Web application**.
   - Em **Authorized redirect URIs**, cole a **Callback URL do Supabase** do passo 1.
   - (Opcional) Em **Authorized JavaScript origins**, adicione a origem da app
     (ex.: `http://localhost:5173` em dev e a URL de produção).
3. Copie o **Client ID** e o **Client Secret** gerados e cole no provedor Google
   do Supabase (passo 1). Salve.

Pronto: o botão "Entrar com Google" passa a funcionar via OAuth (sem usar a API do Gmail).

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
