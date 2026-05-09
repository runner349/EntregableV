import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================
// SKELETON
// ============================================
const Skeleton = ({ width, height, radius = 12 }) => (
  <div style={{
    width: width || '100%', height: height || 20, borderRadius: radius,
    background: 'linear-gradient(90deg, #0A0A0A 25%, #111 50%, #0A0A0A 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  }} />
)

export default function Historial() {
  const [ventas, setVentas] = useState([])
  const [todasLasVentas, setTodasLasVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalleVenta, setDetalleVenta] = useState(null)
  const [confirmAnular, setConfirmAnular] = useState(null)
  const [notificacion, setNotificacion] = useState(null)

  useEffect(() => { cargarTodasLasVentas() }, [])

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

  useEffect(() => { filtrarVentas() }, [busqueda, filtroTipo, fechaDesde, fechaHasta, todasLasVentas])

  const filtrarVentas = () => {
    let resultado = [...todasLasVentas]
    if (busqueda.trim()) {
      const termino = busqueda.trim().toLowerCase()
      resultado = resultado.filter(v => {
        const comprobante = `${v.serie_documento}-${v.numero_documento}`.toLowerCase()
        const cliente = v.Clientes?.nombres_razon_social?.toLowerCase() || ''
        return comprobante.includes(termino) || cliente.includes(termino)
      })
    }
    if (filtroTipo !== 'Todos') {
      resultado = resultado.filter(v => v.Tipos_Comprobantes?.nombre_documento === filtroTipo)
    }
    if (fechaDesde) resultado = resultado.filter(v => v.fecha_hora >= fechaDesde)
    if (fechaHasta) resultado = resultado.filter(v => v.fecha_hora <= fechaHasta + 'T23:59:59')
    setVentas(resultado)
  }

  const verDetalle = async (idVenta) => {
    const { data } = await supabase
      .from('Detalle_Ventas')
      .select('*, Productos(*)')
      .eq('id_venta', idVenta)
    setDetalleVenta({ id: idVenta, items: data || [] })
  }

  const handleAnular = (idVenta) => {
    setConfirmAnular(idVenta)
  }

  const confirmarAnulacion = async () => {
    if (!confirmAnular) return
    const { error } = await supabase.from('Ventas').update({ estado: 'Anulada' }).eq('id_venta', confirmAnular)
    if (error) {
      setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + error.message })
    } else {
      setNotificacion({ tipo: 'success', mensaje: '✅ Venta anulada correctamente. Stock devuelto.' })
    }
    setConfirmAnular(null)
    cargarTodasLasVentas()
  }

  // 📥 EXPORTAR CSV
  const exportarCSV = () => {
    if (!ventas.length) return
    let csv = 'Comprobante,Tipo,Fecha,Cliente,Total,Estado\n'
    ventas.forEach(v => {
      csv += `"${v.serie_documento}-${v.numero_documento}","${v.Tipos_Comprobantes?.nombre_documento || ''}","${new Date(v.fecha_hora).toLocaleString()}","${v.Clientes?.nombres_razon_social || 'Público'}","S/ ${v.total?.toFixed(2)}","${v.estado}"\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial_ventas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // 📄 EXPORTAR PDF
  const exportarPDF = () => {
    if (!ventas.length) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Nova Salud - Historial de Ventas', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28)

    const tabla = ventas.map(v => [
      `${v.serie_documento}-${v.numero_documento}`,
      v.Tipos_Comprobantes?.nombre_documento || '',
      new Date(v.fecha_hora).toLocaleString(),
      v.Clientes?.nombres_razon_social || 'Público',
      `S/ ${v.total?.toFixed(2)}`,
      v.estado
    ])

    autoTable(doc, {
      head: [['Comprobante', 'Tipo', 'Fecha', 'Cliente', 'Total', 'Estado']],
      body: tabla,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3, textColor: [255, 255, 255], fillColor: [10, 10, 10] },
      headStyles: { fillColor: [34, 197, 94], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [15, 15, 15] },
      theme: 'grid',
    })

    doc.save(`historial_ventas_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const inputStyle = { background: '#050505', border: '1px solid #1A1A1A', borderRadius: 12, padding: '9px 14px', color: '#FFF', fontSize: 12, fontFamily: "'Inter', sans-serif", outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  if (loading) {
    return (
      <div style={{ padding: 28, background: '#000', minHeight: '100vh' }}>
        <div style={{ marginBottom: 28 }}><Skeleton width={200} height={36} /><div style={{ marginTop: 8 }}><Skeleton width={280} height={18} /></div></div>
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: 24 }}><Skeleton width="100%" height={300} /></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="fade-in">
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>Historial de ventas</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{ventas.length} movimientos registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={exportarCSV} disabled={!ventas.length}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 14 }} /> CSV
          </button>
          <button className="btn" onClick={exportarPDF} disabled={!ventas.length}>
            <i className="ti ti-file-pdf" style={{ fontSize: 14 }} /> PDF
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input placeholder="Buscar por N° o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...selectStyle, maxWidth: 130 }}>
          <option value="Todos">Todos</option>
          <option value="Boleta">Boleta</option>
          <option value="Factura">Factura</option>
        </select>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ ...inputStyle, maxWidth: 150 }} />
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ ...inputStyle, maxWidth: 150 }} />
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={cargarTodasLasVentas}>
          <i className="ti ti-refresh" style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* TABLA */}
      <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['Comprobante', 'Tipo', 'Fecha', 'Cliente', 'Total', 'Estado', 'Acciones'].map(h => <th key={h} style={{ padding: '12px 16px' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 50 }}>
                  <i className="ti ti-receipt-off" style={{ fontSize: 40, color: '#1A1A1A', display: 'block', marginBottom: 12 }} />
                  <strong style={{ color: '#FFF' }}>No se encontraron ventas</strong>
                </td></tr>
              ) : ventas.map((v, i) => (
                <tr key={v.id_venta} style={{ animation: `fadeUp 0.4s ${0.1 + i * 0.04}s both` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace", background: '#111', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                      {v.serie_documento}-{v.numero_documento}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={v.Tipos_Comprobantes?.nombre_documento === 'Boleta' ? 'tag-boleta' : 'tag-factura'}>
                      {v.Tipos_Comprobantes?.nombre_documento}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: '#666' }}>{new Date(v.fecha_hora).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px' }}>{v.Clientes?.nombres_razon_social || 'Público'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>S/ {v.total?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge ${v.estado === 'Completada' ? 'badge-success' : 'badge-danger'}`}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.estado === 'Completada' ? '#22C55E' : '#EF4444' }} /> {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="icon-btn" title="Ver detalle" onClick={() => verDetalle(v.id_venta)}><i className="ti ti-eye" style={{ fontSize: 15 }} /></button>
                      {v.estado === 'Completada' && (
                        <button className="icon-btn danger" title="Anular venta" onClick={() => handleAnular(v.id_venta)}><i className="ti ti-x" style={{ fontSize: 15 }} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE */}
      {detalleVenta && (
        <div className="modal-overlay" onClick={() => setDetalleVenta(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, color: '#FFF' }}>Detalle de venta</h3>
            <table className="data-table">
              <thead>
                <tr>
                  {['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal'].map(h => <th key={h} style={{ padding: '10px 14px' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {detalleVenta.items.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#666' }}>No hay productos</td></tr>
                ) : detalleVenta.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 14px' }}>{item.Productos?.nombre_comercial || 'Producto #' + item.id_producto}</td>
                    <td style={{ padding: '10px 14px' }}>{item.cantidad}</td>
                    <td style={{ padding: '10px 14px', color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>S/ {item.precio_unitario?.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>S/ {item.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setDetalleVenta(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ANULAR */}
      {confirmAnular && (
        <div className="modal-overlay" onClick={() => setConfirmAnular(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            {/* Icono de advertencia */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 30
            }}>
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#FFF' }}>
              ¿Anular esta venta?
            </h3>
            <p style={{ margin: '0 0 6px', color: '#666', fontSize: 14 }}>
              Esta acción no se puede deshacer.
            </p>
            <p style={{ margin: '0 0 20px', color: '#22C55E', fontSize: 13, fontWeight: 600 }}>
              ✅ El stock se devolverá automáticamente al inventario.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmAnular(null)}
                style={{ padding: '10px 24px', fontSize: 14 }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAnulacion}
                style={{
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  background: '#EF4444',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 6px 20px rgba(239, 68, 68, 0.25)',
                }}
                onMouseEnter={e => e.target.style.background = '#DC2626'}
                onMouseLeave={e => e.target.style.background = '#EF4444'}
              >
                Sí, anular venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIÓN */}
      {notificacion && (
        <div className="modal-overlay" onClick={() => setNotificacion(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: notificacion.tipo === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              fontSize: 24
            }}>
              {notificacion.tipo === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ color: '#FFF', fontSize: 15, margin: '0 0 18px' }}>{notificacion.mensaje}</p>
            <button className="btn btn-primary" onClick={() => setNotificacion(null)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  )
}