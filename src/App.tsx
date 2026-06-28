// Raiz da aplicação: provê o contexto de auth e conecta o roteador.
// Toda a ficha (antes monolítica aqui) virou componentes em src/components + páginas em src/pages.

import { RouterProvider } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { router } from './routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
