// Layout das páginas privadas: navbar fixa no topo + conteúdo da rota via <Outlet />.

import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  )
}
