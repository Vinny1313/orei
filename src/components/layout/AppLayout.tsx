// Layout das páginas privadas: navbar fixa no topo + conteúdo da rota via <Outlet />.
// O conteúdo entra com uma transição suave a cada navegação (keyed pela rota).

import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <Navbar />
      <div id="conteudo" tabIndex={-1}>
        <Outlet />
      </div>
    </div>
  )
}
