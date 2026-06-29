// Definição das rotas da aplicação (react-router v7, createBrowserRouter).
//
// Estrutura:
//  - públicas: "/" (landing) e 404.
//  - auth (PublicRoute): "/login", "/cadastro".
//  - privadas (ProtectedRoute + AppLayout): "/agentes*", "/campanhas*", "/perfil".
//
// Os guards são pass-through na Fase 1 (ver ProtectedRoute/PublicRoute).

import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicRoute } from './components/layout/PublicRoute'
import { CampaignDetailPage } from './pages/CampaignDetailPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { CharacterSheetPage } from './pages/CharacterSheetPage'
import { CharactersPage } from './pages/CharactersPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NewCampaignPage } from './pages/NewCampaignPage'
import { NewCharacterPage } from './pages/NewCharacterPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    // Rotas públicas de autenticação.
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
    ],
  },
  {
    // Rotas privadas: guard de auth (stub) + layout com navbar.
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/agentes', element: <CharactersPage /> },
          { path: '/agentes/novo', element: <NewCharacterPage /> },
          { path: '/agentes/:routeKey', element: <CharacterSheetPage /> },
          { path: '/campanhas', element: <CampaignsPage /> },
          { path: '/campanhas/nova', element: <NewCampaignPage /> },
          { path: '/campanhas/:routeKey', element: <CampaignDetailPage /> },
          { path: '/perfil', element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
