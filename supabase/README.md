# Banco de dados (Supabase / Postgres)

Schema e políticas de segurança (RLS) do "O Rei Mandou".

## Como aplicar as migrations

A forma mais simples (sem CLI):

1. Abra o **Supabase Dashboard** do seu projeto.
2. Vá em **SQL Editor → New query**.
3. Cole o conteúdo de cada arquivo de `migrations/`, **na ordem numérica**, e clique **Run**:
   - `0001_init.sql` — `profiles` + `characters` (RLS, triggers, criação automática de profile).
   - `0002_campaigns.sql` — campanhas (chega na Fase 4).

Os scripts são **idempotentes**: dá pra rodar de novo sem quebrar.

> Usando a **Supabase CLI**? Os arquivos seguem ordem por prefixo numérico. Você pode
> renomeá-los para o padrão `<timestamp>_nome.sql` (ex.: `20260626000001_init.sql`) e
> rodar `supabase db push`.

## Modelo de dados (resumo)

| Tabela | Papel | Regra de acesso (RLS) |
|---|---|---|
| `profiles` | Perfil 1:1 com `auth.users` | Usuário lê/edita só o próprio |
| `characters` | Personagens; ficha completa em `sheet` (JSONB) | Usuário só acessa os próprios (`owner_id = auth.uid()`) |

**Por que `sheet` é JSONB?** A ficha do app é aninhada (`identity`/`attributes`/`combat`/…).
Guardá-la inteira em JSONB mantém fidelidade total com o modelo `Character` do frontend e
zero atrito de mapeamento. `owner_id` tem `default auth.uid()`, então o app nem precisa
informar o dono no insert — a RLS garante a consistência.

## Criação automática de profile

A função `handle_new_user()` (trigger `on_auth_user_created` em `auth.users`) cria o profile
no cadastro, lendo `username`/`display_name` de `raw_user_meta_data` — exatamente os campos
que o `authService.signUp` envia em `options.data`. Colisão de `username` único vira `null`
(o usuário ajusta depois em `/perfil`).
