import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Sans:wght@400;500;600&display=swap');

  .hv-root, .hv-root * {
    box-sizing: border-box;
    font-style: normal;
  }

  .hv-root {
    --ink: #0a0a0a;
    --ink-2: #3d3d3d;
    --ink-3: #8a8a8a;
    --ink-4: #c4c4c4;
    --surface: #ffffff;
    --surface-2: #f5f5f3;
    --surface-3: #ebebea;
    --accent: #00c37a;
    --accent-dim: rgba(0,195,122,0.10);
    --accent-mid: rgba(0,195,122,0.22);
    --danger: #e53535;
    --danger-dim: rgba(229,53,53,0.10);
    --border: #e4e4e2;
    --radius: 14px;
    --radius-sm: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.10);
    font-family: 'Instrument Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    color: var(--ink);
    background: var(--surface);
    padding: 0;
    min-height: 100vh;
  }

  /* ── Header ── */
  .hv-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 14px;
  }
  .hv-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-dim);
    border: 1px solid var(--accent-mid);
    border-radius: 100px;
    padding: 4px 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }
  .hv-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
  .hv-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 30px;
    font-weight: 800;
    font-style: normal;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .hv-subtitle {
    font-size: 13px;
    color: var(--ink-3);
    margin: 0;
  }
  .hv-header-actions { display: flex; gap: 8px; align-items: center; }

  /* ── Buttons ── */
  .hv-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 14px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    font-style: normal;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .hv-btn-ghost {
    background: var(--surface-2);
    color: var(--ink-2);
    border: 1px solid var(--border);
  }
  .hv-btn-ghost:hover { background: var(--surface-3); }
  .hv-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
  .hv-btn-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--ink-3);
    cursor: pointer;
    transition: all 0.15s;
    padding: 0;
    font-size: 14px;
  }
  .hv-btn-icon:hover { background: var(--surface-3); color: var(--ink); }
  .hv-btn-icon.danger:hover { background: var(--danger-dim); color: var(--danger); border-color: rgba(229,53,53,0.2); }

  /* ── Filters ── */
  .hv-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
    flex-wrap: wrap;
    align-items: center;
  }
  .hv-input {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 9px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 12px;
    font-style: normal;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .hv-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
    background: var(--surface);
  }
  .hv-input::placeholder { color: var(--ink-4); }
  .hv-filter-sep {
    width: 1px; height: 24px;
    background: var(--border);
    flex-shrink: 0;
  }
  .hv-filter-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }

  /* ── Table card ── */
  .hv-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .hv-table {
    width: 100%;
    border-collapse: collapse;
  }
  .hv-table thead tr {
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  .hv-table th {
    padding: 10px 16px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    white-space: nowrap;
  }
  .hv-table td {
    padding: 10px 16px;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .hv-table tbody tr:last-child td { border-bottom: none; }
  .hv-table tbody tr { transition: background 0.1s; }
  .hv-table tbody tr:hover { background: var(--surface-2); }

  /* ── Cells ── */
  .hv-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    font-style: normal;
    background: var(--surface-2);
    border: 1px solid var(--border);
    padding: 3px 9px;
    border-radius: 6px;
    color: var(--ink-2);
    letter-spacing: 0.04em;
    display: inline-block;
  }
  .hv-date {
    font-size: 11px;
    color: var(--ink-3);
    font-family: 'JetBrains Mono', monospace;
    font-style: normal;
  }
  .hv-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    font-style: normal;
    color: var(--ink);
  }
  .hv-client {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-2);
  }
  .hv-actions { display: flex; gap: 5px; }

  /* ── Tags / Badges ── */
  .hv-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    font-style: normal;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .hv-tag-boleta {
    background: rgba(59,130,246,0.10);
    color: #2563eb;
    border: 1px solid rgba(59,130,246,0.20);
  }
  .hv-tag-factura {
    background: rgba(168,85,247,0.10);
    color: #7c3aed;
    border: 1px solid rgba(168,85,247,0.20);
  }
  .hv-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    font-style: normal;
    letter-spacing: 0.04em;
  }
  .hv-status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .hv-status-ok {
    background: var(--accent-dim);
    color: #059652;
    border: 1px solid var(--accent-mid);
  }
  .hv-status-ok .hv-status-dot { background: var(--accent); }
  .hv-status-bad {
    background: var(--danger-dim);
    color: var(--danger);
    border: 1px solid rgba(229,53,53,0.20);
  }
  .hv-status-bad .hv-status-dot { background: var(--danger); }

  /* ── Empty state ── */
  .hv-empty {
    text-align: center;
    padding: 56px 0;
    color: var(--ink-4);
  }
  .hv-empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.35; }
  .hv-empty-title { font-size: 14px; font-weight: 600; color: var(--ink-3); margin-bottom: 4px; }
  .hv-empty-sub { font-size: 12px; color: var(--ink-4); }

  /* ── Skeleton ── */
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .hv-skeleton {
    border-radius: 8px;
    background: linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ── Modal ── */
  .hv-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,10,0.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999;
    animation: hv-fade 0.18s ease;
  }
  @keyframes hv-fade { from { opacity: 0; } to { opacity: 1; } }
  .hv-modal {
    background: var(--surface);
    border-radius: 18px;
    padding: 28px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    animation: hv-up 0.20s ease;
    width: 90%;
  }
  @keyframes hv-up { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .hv-modal-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 17px;
    font-weight: 800;
    font-style: normal;
    color: var(--ink);
    margin: 0 0 18px;
    letter-spacing: -0.01em;
  }
  .hv-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
  }
  .hv-modal-icon {
    width: 60px; height: 60px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
    font-size: 26px;
  }
  .hv-modal-center { text-align: center; }
  .hv-modal-center .hv-modal-title { text-align: center; }

  /* ── Confirm danger button ── */
  .hv-btn-danger {
    background: var(--danger);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    font-style: normal;
    cursor: pointer;
    transition: all 0.15s;
  }
  .hv-btn-danger:hover { background: #c42222; box-shadow: 0 4px 16px rgba(229,53,53,0.25); }

  .hv-btn-primary {
    background: var(--ink);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    font-style: normal;
    cursor: pointer;
    transition: all 0.15s;
  }
  .hv-btn-primary:hover { background: #222; }
`

const SkeletonRow = () => (
  <tr>
    {[140, 80, 110, 160, 70, 70, 60].map((w, i) => (
      <td key={i} style={{ padding: '12px 16px' }}>
        <div className="hv-skeleton" style={{ width: w, height: 14 }} />
      </td>
    ))}
  </tr>
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

  const confirmarAnulacion = async () => {
    if (!confirmAnular) return
    const { error } = await supabase.from('Ventas').update({ estado: 'Anulada' }).eq('id_venta', confirmAnular)
    if (error) {
      setNotificacion({ tipo: 'error', mensaje: 'Error al anular: ' + error.message })
    } else {
      setNotificacion({ tipo: 'success', mensaje: 'Venta anulada correctamente.' })
    }
    setConfirmAnular(null)
    cargarTodasLasVentas()
  }

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
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 195, 122], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid',
    })
    doc.save(`historial_ventas_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="hv-root">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="hv-header">
        <div>
          <div className="hv-badge">
            <div className="hv-badge-dot" />
            Registro de ventas
          </div>
          <h1 className="hv-title">Historial de ventas</h1>
          <p className="hv-subtitle">{loading ? '—' : `${ventas.length} movimientos registrados`}</p>
        </div>
        <div className="hv-header-actions">
          <button className="hv-btn hv-btn-ghost" onClick={exportarCSV} disabled={!ventas.length}>
            <i className="ti ti-file-spreadsheet" style={{ fontSize: 13 }} /> CSV
          </button>
          <button className="hv-btn hv-btn-ghost" onClick={exportarPDF} disabled={!ventas.length}>
            <i className="ti ti-file-pdf" style={{ fontSize: 13 }} /> PDF
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="hv-filters">
        <input
          className="hv-input"
          placeholder="Buscar por N° o cliente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <div className="hv-filter-sep" />
        <span className="hv-filter-label">Tipo</span>
        <select className="hv-input" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ width: 120 }}>
          <option value="Todos">Todos</option>
          <option value="Boleta">Boleta</option>
          <option value="Factura">Factura</option>
        </select>
        <div className="hv-filter-sep" />
        <span className="hv-filter-label">Desde</span>
        <input type="date" className="hv-input" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ width: 145 }} />
        <span className="hv-filter-label">Hasta</span>
        <input type="date" className="hv-input" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ width: 145 }} />
        <div style={{ flex: 1 }} />
        <button className="hv-btn-icon" title="Actualizar" onClick={cargarTodasLasVentas}>
          <i className="ti ti-refresh" />
        </button>
      </div>

      {/* TABLA */}
      <div className="hv-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="hv-table">
            <thead>
              <tr>
                {['Comprobante', 'Tipo', 'Fecha', 'Cliente', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="hv-empty">
                      <div className="hv-empty-icon"><i className="ti ti-receipt-off" /></div>
                      <div className="hv-empty-title">No se encontraron ventas</div>
                      <div className="hv-empty-sub">Prueba ajustando los filtros</div>
                    </div>
                  </td>
                </tr>
              ) : ventas.map(v => (
                <tr key={v.id_venta}>
                  <td>
                    <span className="hv-code">{v.serie_documento}-{v.numero_documento}</span>
                  </td>
                  <td>
                    <span className={`hv-tag ${v.Tipos_Comprobantes?.nombre_documento === 'Boleta' ? 'hv-tag-boleta' : 'hv-tag-factura'}`}>
                      {v.Tipos_Comprobantes?.nombre_documento}
                    </span>
                  </td>
                  <td>
                    <span className="hv-date">{new Date(v.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </td>
                  <td>
                    <span className="hv-client">{v.Clientes?.nombres_razon_social || 'Público'}</span>
                  </td>
                  <td>
                    <span className="hv-amount">S/ {v.total?.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`hv-status ${v.estado === 'Completada' ? 'hv-status-ok' : 'hv-status-bad'}`}>
                      <span className="hv-status-dot" />
                      {v.estado}
                    </span>
                  </td>
                  <td>
                    <div className="hv-actions">
                      <button className="hv-btn-icon" title="Ver detalle" onClick={() => verDetalle(v.id_venta)}>
                        <i className="ti ti-eye" />
                      </button>
                      {v.estado === 'Completada' && (
                        <button className="hv-btn-icon danger" title="Anular venta" onClick={() => setConfirmAnular(v.id_venta)}>
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
      </div>

      {/* MODAL DETALLE */}
      {detalleVenta && (
        <div className="hv-overlay" onClick={() => setDetalleVenta(null)}>
          <div className="hv-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h3 className="hv-modal-title">Detalle de venta</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="hv-table" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <thead>
                  <tr>
                    {['Producto', 'Cantidad', 'Precio unit.', 'Subtotal'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {detalleVenta.items.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 28, color: 'var(--ink-3)', fontSize: 13 }}>Sin productos</td></tr>
                  ) : detalleVenta.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{item.Productos?.nombre_comercial || 'Producto #' + item.id_producto}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td><span className="hv-amount" style={{ fontSize: 12 }}>S/ {item.precio_unitario?.toFixed(2)}</span></td>
                      <td><span className="hv-amount">S/ {item.subtotal?.toFixed(2)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hv-modal-footer">
              <button className="hv-btn hv-btn-ghost" onClick={() => setDetalleVenta(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ANULAR */}
      {confirmAnular && (
        <div className="hv-overlay" onClick={() => setConfirmAnular(null)}>
          <div className="hv-modal hv-modal-center" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="hv-modal-icon" style={{ background: 'var(--danger-dim)', border: '1px solid rgba(229,53,53,0.18)' }}>⚠️</div>
            <h3 className="hv-modal-title">¿Anular esta venta?</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 8px' }}>Esta acción no se puede deshacer.</p>
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, margin: '0 0 22px' }}>El stock se devolverá automáticamente al inventario.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="hv-btn hv-btn-ghost" onClick={() => setConfirmAnular(null)}>Cancelar</button>
              <button className="hv-btn-danger" onClick={confirmarAnulacion}>Sí, anular</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIÓN */}
      {notificacion && (
        <div className="hv-overlay" onClick={() => setNotificacion(null)}>
          <div className="hv-modal hv-modal-center" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="hv-modal-icon" style={{ background: notificacion.tipo === 'success' ? 'var(--accent-dim)' : 'var(--danger-dim)' }}>
              {notificacion.tipo === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink)', margin: '0 0 20px', fontWeight: 500 }}>{notificacion.mensaje}</p>
            <button className="hv-btn-primary" onClick={() => setNotificacion(null)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  )
}