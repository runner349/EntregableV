import { useState } from 'react'
import { useAuth } from './lib/useAuth'

import Login from './Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import NuevaVenta from './pages/NuevaVenta'
import Historial from './pages/Historial'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Empleados from './pages/Empleados'

const PAGES = {
  dashboard: Dashboard,
  'nueva-venta': NuevaVenta,
  historial: Historial,
  productos: Productos,
  clientes: Clientes,
  empleados: Empleados,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>
  if (!user) return <Login />

  const PageComponent = PAGES[currentPage] || Dashboard

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        profile={profile}
      />

      <div className="main-area">
        <Topbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          profile={profile}
        />

        <div className="content-area">
          <PageComponent profile={profile} />
        </div>
      </div>
    </div>
  )
}