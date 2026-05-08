const PAGE_NAMES = {
  dashboard: 'Dashboard',
  'nueva-venta': 'Nueva venta',
  historial: 'Historial de ventas',
  productos: 'Productos',
  clientes: 'Clientes',
  empleados: 'Empleados',
}

export default function Topbar({ currentPage, onNavigate }) {
  return (
    <div className="topbar">
      <div className="breadcrumb">
        <span>Inicio</span>
        <i className="ti ti-chevron-right" />
        <span className="current">{PAGE_NAMES[currentPage] || currentPage}</span>
      </div>

      <button className="btn btn-primary topbar-sale-btn" onClick={() => onNavigate('nueva-venta')}>
        <i className="ti ti-plus" />
        Nueva venta
      </button>
    </div>
  )
}