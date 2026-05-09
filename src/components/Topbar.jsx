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
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Inicio</span>
        <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />
        <span className="current">{PAGE_NAMES[currentPage] || currentPage}</span>
      </div>

      {/* Botón de acción */}
      <button
        className="btn btn-primary"
        onClick={() => onNavigate('nueva-venta')}
        style={{
          padding: '10px 20px',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Inter', 'DM Sans', sans-serif",
        }}
      >
        <i className="ti ti-plus" style={{ fontSize: 16 }} />
        Nueva venta
      </button>
    </div>
  )
}