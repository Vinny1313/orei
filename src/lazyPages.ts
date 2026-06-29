// Páginas carregadas sob demanda (code-splitting por rota). Mantidas num módulo
// separado de routes.tsx para que aquele arquivo não misture definição de
// componentes com a exportação do `router` (regra react/only-export-components).

import { lazy } from 'react'

export const HomePage = lazy(() =>
  import('./pages/HomePage').then((mod) => ({ default: mod.HomePage })),
)
export const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((mod) => ({ default: mod.LoginPage })),
)
export const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((mod) => ({ default: mod.RegisterPage })),
)
export const CharactersPage = lazy(() =>
  import('./pages/CharactersPage').then((mod) => ({ default: mod.CharactersPage })),
)
export const NewCharacterPage = lazy(() =>
  import('./pages/NewCharacterPage').then((mod) => ({ default: mod.NewCharacterPage })),
)
export const CharacterSheetPage = lazy(() =>
  import('./pages/CharacterSheetPage').then((mod) => ({ default: mod.CharacterSheetPage })),
)
export const CampaignsPage = lazy(() =>
  import('./pages/CampaignsPage').then((mod) => ({ default: mod.CampaignsPage })),
)
export const NewCampaignPage = lazy(() =>
  import('./pages/NewCampaignPage').then((mod) => ({ default: mod.NewCampaignPage })),
)
export const CampaignDetailPage = lazy(() =>
  import('./pages/CampaignDetailPage').then((mod) => ({ default: mod.CampaignDetailPage })),
)
export const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((mod) => ({ default: mod.ProfilePage })),
)
export const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((mod) => ({ default: mod.NotFoundPage })),
)
