// Definição das rotas da aplicação (react-router v7, createBrowserRouter).
//
// Estrutura:
//  - públicas: "/" (landing) e 404.
//  - auth (PublicRoute): "/login", "/cadastro".
//  - privadas (ProtectedRoute + AppLayout): "/agentes*", "/campanhas*", "/perfil".
//
// As páginas são carregadas sob demanda (React.lazy) → cada rota vira um chunk
// separado, reduzindo o JS inicial. O FullPageLoader cobre o tempo de carga do chunk.

import { Suspense, type ReactElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { FullPageLoader } from './components/layout/FullPageLoader'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicRoute } from './components/layout/PublicRoute'
import {
  CampaignDetailPage,
  CampaignsPage,
  CharacterSheetPage,
  CharactersPage,
  HomePage,
  LoginPage,
  NewCampaignPage,
  NewCharacterPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
} from './lazyPages'

const withSuspense = (element: ReactElement): ReactElement => (
  <Suspense fallback={<FullPageLoader />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<HomePage />),
  },
  {
    // Rotas públicas de autenticação.
    element: <PublicRoute />,
    children: [
      { path: '/login', element: withSuspense(<LoginPage />) },
      { path: '/cadastro', element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    // Rotas privadas: guard de auth + layout com navbar.
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/agentes', element: withSuspense(<CharactersPage />) },
          { path: '/agentes/novo', element: withSuspense(<NewCharacterPage />) },
          { path: '/agentes/:routeKey', element: withSuspense(<CharacterSheetPage />) },
          { path: '/campanhas', element: withSuspense(<CampaignsPage />) },
          { path: '/campanhas/nova', element: withSuspense(<NewCampaignPage />) },
          { path: '/campanhas/:routeKey', element: withSuspense(<CampaignDetailPage />) },
          { path: '/perfil', element: withSuspense(<ProfilePage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
])
