import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVentas: 0,
    comprobantes: 0,
    stockBajo: 0,
    vencePronto: 0,
    productosActivos: 0,
    clientes: 0
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    try {
      // 1. Cargar últimas ventas
      const { data: ventasData } = await supabase
        .from('Ventas')
        .select('*, Clientes(*), Usuarios(*)')
        .order('fecha_hora', { ascending: false })
        .limit(10)

      setVentas(ventasData || [])

      // 2. Estadísticas
      const { count: totalVentas } = await supabase
        .from('Ventas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Completada')

      const { count: productosActivos } = await supabase
        .from('Productos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', true)

      const { count: clientes } = await supabase
        .from('Clientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', true)

      // Contar productos con stock bajo (stock actual <= stock mínimo)
      const { data: stockBajoData } = await supabase
        .from('Productos')
        .select('*')
        .eq('estado', true)
      
      const stockBajo = stockBajoData?.filter(p => p.stock_actual_unidades <= p.stock_minimo_unidades).length || 0

      setStats({
        totalVentas: totalVentas || 0,
        comprobantes: totalVentas || 0,
        stockBajo: stockBajo,
        vencePronto: 0,
        productosActivos: productosActivos || 0,
        clientes: clientes || 0
      })
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
    }

    setLoading(false)
  }

  if (loading) {
    return <div className="dashboard-page fade-in" style={{ padding: 30 }}>Cargando dashboard...</div>
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Panel general</h1>
          <p>Resumen operativo de Nova Salud</p>
        </div>

        <div className="date-pill">
          <i className="ti ti-calendar" />
          {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-card main-hero hover-card">
          <div>
            <div className="hero-icon">
              <i className="ti ti-heart-plus" />
            </div>

            <h2>Resumen de ventas</h2>
            <p>Control diario de ventas, comprobantes y productos críticos.</p>
          </div>

          <div className="hero-number">
            <small>Total de ventas</small>
            <strong>S/ {stats.totalVentas.toLocaleString()}</strong>
            <span>
              <i className="ti ti-trending-up" />
              Actualizado ahora
            </span>
          </div>
        </div>

        <div className="mini-card hover-card">
          <i className="ti ti-receipt" />
          <span>Comprobantes</span>
          <strong>{stats.comprobantes}</strong>
          <small>Emitidos</small>
        </div>

        <div className="mini-card warning hover-card">
          <i className="ti ti-alert-triangle" />
          <span>Stock bajo</span>
          <strong>{stats.stockBajo}</strong>
          <small>Productos críticos</small>
        </div>

        <div className="mini-card orange hover-card">
          <i className="ti ti-calendar-exclamation" />
          <span>Vence pronto</span>
          <strong>{stats.vencePronto}</strong>
          <small>Próximos 30 días</small>
        </div>
      </div>

      <div className="quick-grid">
        <div className="quick-card hover-card">
          <i className="ti ti-capsule" />
          <div>
            <strong>Productos activos</strong>
            <span>{stats.productosActivos} registrados</span>
          </div>
        </div>

        <div className="quick-card hover-card">
          <i className="ti ti-users" />
          <div>
            <strong>Clientes</strong>
            <span>{stats.clientes} clientes</span>
          </div>
        </div>

        <div className="quick-card hover-card">
          <i className="ti ti-trending-up" />
          <div>
            <strong>Ventas totales</strong>
            <span>{stats.totalVentas} transacciones</span>
          </div>
        </div>

        <div className="quick-card hover-card">
          <i className="ti ti-shield-check" />
          <div>
            <strong>Sistema</strong>
            <span>En línea</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card soft-card hover-card">
          <div className="card-title">
            <div>
              <span>Últimas ventas</span>
              <p>Movimientos recientes del sistema</p>
            </div>
            <i className="ti ti-clock" />
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Comprobante</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                ventas.map((v, index) => (
                  <tr key={v.id_venta} style={{ animationDelay: `${index * 0.08}s` }}>
                    <td style={{ fontWeight: 700 }}>
                      {v.serie_documento}-{v.numero_documento}
                    </td>
                    <td>{v.Clientes?.nombres_razon_social || 'Sin cliente'}</td>
                    <td>{new Date(v.fecha_hora).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 800 }}>S/ {v.total?.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${v.estado === 'Completada' ? 'badge-success' : 'badge-danger'}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="side-widgets">
          <div className="health-card hover-card">
            <div className="widget-title">
              <h3>Ventas totales</h3>
              <i className="ti ti-chart-line" />
            </div>

            <div className="pulse">{stats.totalVentas}</div>
            <p>Transacciones completadas</p>

            <div className="bar-track">
              <div className="bar-fill"></div>
            </div>
          </div>

          <div className="circle-card hover-card">
            <div className="progress-ring">
              <span>{stats.productosActivos}</span>
            </div>

            <div>
              <h3>Productos</h3>
              <p>En catálogo</p>
            </div>
          </div>

          <div className="alert-card hover-card">
            <div>
              <h3>Alertas</h3>
              <p>{stats.stockBajo} productos necesitan reposición.</p>
            </div>
            <i className="ti ti-bell-ringing" />
          </div>
        </div>
      </div>
    </div>
  )
}