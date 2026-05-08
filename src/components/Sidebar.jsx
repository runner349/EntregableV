import { supabase } from '../lib/supabase'

export default function Sidebar({ currentPage, onNavigate, profile }) {
  const navItems = [
    { section: 'General' },
    { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
    { id: 'nueva-venta', label: 'Nueva venta', icon: 'ti-shopping-cart' },
    { id: 'historial', label: 'Historial', icon: 'ti-receipt' },
    { id: 'productos', label: 'Productos', icon: 'ti-pill' },
    { id: 'clientes', label: 'Clientes', icon: 'ti-users' },
    { id: 'empleados', label: 'Empleados', icon: 'ti-id-badge' },
  ]

  // Datos reales desde la tabla Usuarios
  const email = profile?.username || 'Usuario'
  const rolNombre = getRolNombre(profile?.id_rol)

  // Iniciales desde el email
  const initials = email
    .split('@')[0]
    .split('.')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">
          <i className="ti ti-heart-plus" />
          <span>Nova Salud</span>
        </div>
        <div className="sub">Sistema de ventas</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) =>
          item.section ? (
            <div key={idx} className="nav-section">{item.section}</div>
          ) : (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <i className={`ti ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>

          <div className="user-info">
            <div className="name">{email}</div>
            <div className="role">{rolNombre}</div>
          </div>
        </div>

        <button className="logout-btn-sidebar" onClick={handleLogout}>
          <i className="ti ti-logout" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

// Función auxiliar para mostrar el nombre del rol
function getRolNombre(idRol) {
  switch (idRol) {
    case 1: return 'Administrador'
    case 2: return 'Vendedor'
    case 3: return 'Farmacéutico'
    case 4: return 'Almacenero'
    default: return 'Usuario'
  }
}