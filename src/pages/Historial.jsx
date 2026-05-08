import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Historial() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalleVenta, setDetalleVenta] = useState(null)

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    setLoading(true)

    let query = supabase
      .from('Ventas')
      .select('*, Clientes(*), Usuarios(*), Tipos_Comprobantes(*)')
      .order('fecha_hora', { ascending: false })
      .limit(100)

    const { data } = await query

    setVentas(data || [])
    setLoading(false)
  }

  const verDetalle = async (idVenta) => {
    const { data } = await supabase
      .from('Detalle_Ventas')
      .select('*, Productos(*)')
      .eq('id_venta', idVenta)

    setDetalleVenta({ id: idVenta, items: data || [] })
  }

  const anularVenta = async (idVenta) => {
    if (!confirm('¿Anular esta venta? Se devolverá el stock automáticamente.')) return

    const { error } = await supabase
      .from('Ventas')
      .update({ estado: 'Anulada' })
      .eq('id_venta', idVenta)

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    alert('✅ Venta anulada. Stock devuelto automáticamente.')
    cargarVentas()
  }

  const filtradas = ventas.filter(v => {
    const matchTipo = filtroTipo === 'Todos' || 
      v.Tipos_Comprobantes?.nombre_documento === filtroTipo

    const matchBusq = !busqueda || 
      `${v.serie_documento}-${v.numero_documento}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.Clientes?.nombres_razon_social?.toLowerCase().includes(busqueda.toLowerCase())

    const matchFecha = (!fechaDesde || v.fecha_hora >= fechaDesde) &&
      (!fechaHasta || v.fecha_hora <= fechaHasta + 'T23:59:59')

    return matchTipo && matchBusq && matchFecha
  })

  if (loading) return <div style={{ padding: 30 }}>Cargando historial...</div>

  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>
          <span>Historial de ventas</span>
          <i className="ti ti-receipt" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="form-control"
            style={{ maxWidth: 260 }}
            placeholder="Buscar por N° o cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <select
            className="form-control"
            style={{ maxWidth: 150 }}
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
          >
            <option>Todos</option>
            <option>Boleta</option>
            <option>Factura</option>
          </select>

          <input
            type="date"
            className="form-control"
            style={{ maxWidth: 160 }}
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            placeholder="Desde"
          />

          <input
            type="date"
            className="form-control"
            style={{ maxWidth: 160 }}
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            placeholder="Hasta"
          />

          <div style={{ flex: 1 }} />

          <button className="btn" onClick={() => cargarVentas()}>
            <i className="ti ti-refresh" />
            Actualizar
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Comprobante</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>
                No se encontraron ventas
              </td></tr>
            ) : filtradas.map(v => (
              <tr key={v.id_venta}>
                <td style={{ fontWeight: 600 }}>
                  {v.serie_documento}-{v.numero_documento}
                </td>
                <td>
                  <span className={v.Tipos_Comprobantes?.nombre_documento === 'Boleta' ? 'tag-boleta' : 'tag-factura'}>
                    {v.Tipos_Comprobantes?.nombre_documento}
                  </span>
                </td>
                <td style={{ color: 'var(--gray-500)', fontSize: 12 }}>
                  {new Date(v.fecha_hora).toLocaleString()}
                </td>
                <td>{v.Clientes?.nombres_razon_social || 'Público'}</td>
                <td style={{ fontWeight: 600 }}>S/ {v.total?.toFixed(2)}</td>
                <td>
                  <span className={`badge ${v.estado === 'Completada' ? 'badge-success' : 'badge-danger'}`}>
                    {v.estado}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="icon-btn" title="Ver detalle" onClick={() => verDetalle(v.id_venta)}>
                      <i className="ti ti-eye" />
                    </button>
                    {v.estado === 'Completada' && (
                      <button className="icon-btn danger" title="Anular venta" onClick={() => anularVenta(v.id_venta)}>
                        <i className="ti ti-x" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle */}
      {detalleVenta && (
        <div className="modal-backdrop" onClick={() => setDetalleVenta(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>Detalle de venta</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalleVenta.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.Productos?.nombre_comercial || 'Producto #' + item.id_producto}</td>
                    <td>{item.cantidad}</td>
                    <td>S/ {item.precio_unitario?.toFixed(2)}</td>
                    <td><strong>S/ {item.subtotal?.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn" onClick={() => setDetalleVenta(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}