import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Historial() {
  const [ventas, setVentas] = useState([])
  const [todasLasVentas, setTodasLasVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalleVenta, setDetalleVenta] = useState(null)

  useEffect(() => {
    cargarTodasLasVentas()
  }, [])

  const cargarTodasLasVentas = async () => {
    setLoading(true)

    const { data } = await supabase
      .from('Ventas')
      .select('*, Clientes(*), Usuarios(*), Tipos_Comprobantes(*)')
      .order('fecha_hora', { ascending: false })
      .limit(200)

    setTodasLasVentas(data || [])
    setVentas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    filtrarVentas()
  }, [busqueda, filtroTipo, fechaDesde, fechaHasta, todasLasVentas])

  const filtrarVentas = () => {
    let resultado = [...todasLasVentas]

    if (busqueda.trim()) {
      const termino = busqueda.trim().toLowerCase()
      resultado = resultado.filter(v => {
        const comprobante = `${v.serie_documento}-${v.numero_documento}`.toLowerCase()
        const cliente = v.Clientes?.nombres_razon_social?.toLowerCase() || ''
        const numeroDoc = v.numero_documento?.toLowerCase() || ''
        const serie = v.serie_documento?.toLowerCase() || ''

        return comprobante.includes(termino) ||
               cliente.includes(termino) ||
               numeroDoc.includes(termino) ||
               serie.includes(termino)
      })
    }

    if (filtroTipo !== 'Todos') {
      resultado = resultado.filter(v =>
        v.Tipos_Comprobantes?.nombre_documento === filtroTipo
      )
    }

    if (fechaDesde) {
      resultado = resultado.filter(v => v.fecha_hora >= fechaDesde)
    }

    if (fechaHasta) {
      resultado = resultado.filter(v => v.fecha_hora <= fechaHasta + 'T23:59:59')
    }

    setVentas(resultado)
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
    cargarTodasLasVentas()
  }

  // 📥 EXPORTAR A CSV
  const exportarCSV = () => {
    if (ventas.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    let csv = 'Comprobante,Tipo,Fecha,Cliente,Total,Estado\n'

    ventas.forEach(v => {
      const comprobante = `${v.serie_documento}-${v.numero_documento}`
      const tipo = v.Tipos_Comprobantes?.nombre_documento || ''
      const fecha = new Date(v.fecha_hora).toLocaleString()
      const cliente = v.Clientes?.nombres_razon_social || 'Público'
      const total = v.total?.toFixed(2) || '0.00'
      const estado = v.estado

      csv += `"${comprobante}","${tipo}","${fecha}","${cliente}","S/ ${total}","${estado}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial_ventas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // 📄 EXPORTAR A PDF
  const exportarPDF = () => {
    if (ventas.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    const doc = new jsPDF()

    // Título
    doc.setFontSize(16)
    doc.text('Nova Salud - Historial de Ventas', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28)

    // Datos de la tabla
    const tabla = ventas.map(v => [
      `${v.serie_documento}-${v.numero_documento}`,
      v.Tipos_Comprobantes?.nombre_documento || '',
      new Date(v.fecha_hora).toLocaleString(),
      v.Clientes?.nombres_razon_social || 'Público',
      `S/ ${v.total?.toFixed(2) || '0.00'}`,
      v.estado
    ])

    // Usar autoTable como plugin independiente
    autoTable(doc, {
      head: [['Comprobante', 'Tipo', 'Fecha', 'Cliente', 'Total', 'Estado']],
      body: tabla,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [35, 94, 189], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 255] }
    })

    doc.save(`historial_ventas_${new Date().toISOString().split('T')[0]}.pdf`)
  }

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

          <button className="btn" onClick={exportarCSV} title="Exportar a CSV">
            <i className="ti ti-file-spreadsheet" /> CSV
          </button>
          <button className="btn" onClick={exportarPDF} title="Exportar a PDF">
            <i className="ti ti-file-pdf" /> PDF
          </button>
          <button className="btn" onClick={cargarTodasLasVentas} title="Actualizar">
            <i className="ti ti-refresh" />
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
            {ventas.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>
                No se encontraron ventas
              </td></tr>
            ) : ventas.map(v => (
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
        <div 
          onClick={() => setDetalleVenta(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Detalle de venta</h3>
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
                {detalleVenta.items.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No hay productos</td></tr>
                ) : (
                  detalleVenta.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.Productos?.nombre_comercial || 'Producto #' + item.id_producto}</td>
                      <td>{item.cantidad}</td>
                      <td>S/ {item.precio_unitario?.toFixed(2)}</td>
                      <td><strong>S/ {item.subtotal?.toFixed(2)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button className="btn" onClick={() => setDetalleVenta(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}