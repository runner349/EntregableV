import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

const IGV_RATE = 0.18

export default function NuevaVenta() {
  const { profile } = useAuth() || {}
  const [catalogo, setCatalogo] = useState([])
  const [monedas, setMonedas] = useState([])
  const [tipoDoc, setTipoDoc] = useState('Boleta')
  const [serie, setSerie] = useState('B001')
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [sugerenciasClientes, setSugerenciasClientes] = useState([])
  const [moneda, setMoneda] = useState('PEN')
  const [busqueda, setBusqueda] = useState('')
  const [sugerenciasProductos, setSugerenciasProductos] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] = useState(false)
  const [cart, setCart] = useState([])
  const [totalRecibido, setTotalRecibido] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    const { data: prod } = await supabase.from('Productos').select('*, Productos_Precios(*, Unidades_Medida(*), Monedas(*)), Laboratorios(*)').eq('estado', true)
    setCatalogo(prod || [])
    const { data: mon } = await supabase.from('Monedas').select('*')
    setMonedas(mon || [])
    setLoading(false)
  }

  const buscarProductos = (termino) => {
    if (!termino || termino.length < 1) { setSugerenciasProductos([]); setMostrarSugerencias(false); return }
    const resultados = catalogo.filter(p => p.nombre_comercial?.toLowerCase().includes(termino.toLowerCase()) || p.principio_activo?.toLowerCase().includes(termino.toLowerCase()) || p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(termino.toLowerCase())).slice(0, 8)
    setSugerenciasProductos(resultados); setMostrarSugerencias(resultados.length > 0)
  }

  const buscarClientes = async (termino) => {
    if (!termino || termino.length < 1) { setSugerenciasClientes([]); setMostrarSugerenciasClientes(false); return }
    const { data } = await supabase.from('Clientes').select('*').eq('estado', true).or(`nombres_razon_social.ilike.%${termino}%,numero_documento.ilike.%${termino}%`).order('nombres_razon_social').limit(20)
    const filtrados = (data || []).filter(c => c.id_cliente !== 1)
    setSugerenciasClientes(filtrados); setMostrarSugerenciasClientes(filtrados.length > 0)
  }

  const seleccionarProducto = (prod) => {
    const precioDefault = prod.Productos_Precios?.[0]
    setCart(prev => {
      const ex = prev.find(c => c.id_producto === prod.id_producto)
      if (ex) return prev.map(c => c.id_producto === prod.id_producto ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id_producto: prod.id_producto, id_producto_precio: precioDefault?.id_producto_precio, nombre: prod.nombre_comercial, precio_venta: precioDefault?.precio_venta || 0, qty: 1, laboratorio: prod.Laboratorios?.nombre_laboratorio }]
    })
    setBusqueda(''); setSugerenciasProductos([]); setMostrarSugerencias(false)
  }

  const seleccionarCliente = (cliente) => { setClienteSeleccionado(cliente); setClienteBusqueda(cliente.nombres_razon_social); setSugerenciasClientes([]); setMostrarSugerenciasClientes(false) }

  const subtotal = cart.reduce((acc, item) => acc + item.precio_venta * item.qty, 0)
  const igv = subtotal * IGV_RATE
  const total = subtotal + igv
  const vuelto = totalRecibido ? parseFloat(totalRecibido) - total : 0

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id_producto !== id))
  const updateQty = (id, val) => { const q = val === '' ? '' : Math.max(0, parseInt(val) || 0); setCart(prev => prev.map(c => c.id_producto === id ? { ...c, qty: q } : c)) }

  const handleVender = async () => {
    if (!cart.length) { alert('Agregue al menos un producto.'); return }
    let idCliente = clienteSeleccionado?.id_cliente || 1
    const { data: compData } = await supabase.from('Tipos_Comprobantes').select('*').eq('nombre_documento', tipoDoc).single()
    const serieUsar = compData?.serie_actual || serie
    const correlativo = (compData?.correlativo_actual || 0) + 1
    const numeroDoc = String(correlativo).padStart(6, '0')
    const idUsuario = profile?.id_usuario
    if (!idUsuario) { alert('No se pudo identificar al usuario'); return }

    const { data: venta, error: errorVenta } = await supabase.from('Ventas').insert({
      id_tipo_comprobante: compData?.id_tipo_comprobante || 1, serie_documento: serieUsar, numero_documento: numeroDoc,
      id_cliente: idCliente, id_usuario: idUsuario, subtotal, igv, total,
      id_moneda: monedas.find(m => m.codigo_moneda === moneda)?.id_moneda || 1, estado: 'Completada'
    }).select('id_venta').single()

    if (errorVenta) { alert('Error: ' + errorVenta.message); return }

    const detalles = cart.map(item => ({ id_venta: venta.id_venta, id_producto: item.id_producto, id_producto_precio: item.id_producto_precio, cantidad: item.qty, precio_unitario: item.precio_venta, subtotal: item.precio_venta * item.qty }))
    const { error: errorDetalle } = await supabase.from('Detalle_Ventas').insert(detalles)
    if (errorDetalle) { await supabase.from('Ventas').delete().eq('id_venta', venta.id_venta); alert('❌ ' + errorDetalle.message); return }

    setModal({ comprobante: `${serieUsar}-${numeroDoc}`, cliente: clienteSeleccionado, cart: [...cart], subtotal, igv, total, totalRecibido, vuelto, moneda, tipoDoc })
    setCart([]); setTotalRecibido(''); setClienteSeleccionado(null); setClienteBusqueda(''); cargarDatos()
  }

  const imprimirComprobante = () => {
    if (!modal) return
    const cliente = modal.cliente?.nombres_razon_social || 'PÚBLICO EN GENERAL'
    const docCliente = modal.cliente?.numero_documento || '99999999'
    const fecha = new Date().toLocaleDateString('es-PE')
    const productos = modal.cart || []
    const ventana = window.open('', '_blank', 'width=400,height=600')
    ventana.document.write(`<!DOCTYPE html><html><head><title>${modal.comprobante}</title><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Courier New',monospace}
      body{width:80mm;margin:0 auto;padding:10px;font-size:11px;color:#FFF;background:#000}
      .header{text-align:center;border-bottom:1px dashed #1A1A1A;padding-bottom:8px;margin-bottom:8px}
      .header h2{font-size:13px;color:#22C55E}.header small{font-size:8px;color:#666}
      .tipo{text-align:center;font-weight:bold;font-size:12px;color:#FFF;margin:6px 0}
      .numero{text-align:center;font-weight:bold;font-size:15px;background:#0A0A0A;padding:4px;color:#22C55E}
      .info{display:flex;justify-content:space-between;font-size:9px;margin:8px 0;color:#999}
      .cliente{font-size:9px;margin:8px 0;color:#CCC}table{width:100%;border-top:1px dashed #1A1A1A;border-bottom:1px dashed #1A1A1A;margin:8px 0;padding:8px 0}
      table th{text-align:left;font-size:8px;color:#666;padding-bottom:4px}table td{font-size:9px;padding:2px 0}
      .totales{font-size:10px}.totales div{display:flex;justify-content:space-between;padding:2px 0;color:#CCC}
      .totales .total{font-weight:bold;font-size:13px;border-top:1px dashed #1A1A1A;padding-top:4px;margin-top:4px;color:#22C55E}
      .recibido{font-size:10px;margin-top:4px;color:#CCC}.gracias{text-align:center;font-size:9px;margin-top:10px;color:#666}
</style></head><body>
<div class="header"><h2>BOTICA NOVA SALUD</h2><small>RUC 00000000000</small><br><small>Sistema de ventas</small></div>
<div class="tipo">${modal.tipoDoc.toUpperCase()} ELECTRÓNICA</div><div class="numero">${modal.comprobante}</div>
<div class="info"><div>Fecha<br><span>${fecha}</span></div><div>Pago<br><span>Contado</span></div><div>Moneda<br><span>${modal.moneda}</span></div></div>
<div class="cliente"><strong>Cliente: ${cliente}</strong>Documento: ${docCliente}</div>
<table><thead><tr><th>Producto</th><th style="text-align:right">Importe</th></tr></thead><tbody>
${productos.map(item => `<tr><td>${item.nombre}<br><small>${item.qty} x S/ ${item.precio_venta.toFixed(2)}</small></td><td style="text-align:right">S/ ${(item.precio_venta * item.qty).toFixed(2)}</td></tr>`).join('')}</tbody></table>
<div class="totales"><div><span>Op. Gravadas</span><span>S/ ${modal.subtotal.toFixed(2)}</span></div><div><span>Subtotal</span><span>S/ ${modal.subtotal.toFixed(2)}</span></div><div><span>IGV 18%</span><span>S/ ${modal.igv.toFixed(2)}</span></div><div class="total"><span>Total</span><span>S/ ${modal.total.toFixed(2)}</span></div></div>
<div class="recibido"><div><span>Recibido</span><span>S/ ${parseFloat(modal.totalRecibido || 0).toFixed(2)}</span></div><div><span>Vuelto</span><span>S/ ${modal.vuelto >= 0 ? modal.vuelto.toFixed(2) : '0.00'}</span></div></div>
<div class="gracias">Gracias por su compra.</div>
<script>window.print();setTimeout(()=>window.close(),500);<\/script></body></html>`)
    ventana.document.close(); setModal(null)
  }

  const inputStyle = { background: '#050505', border: '1px solid #1A1A1A', borderRadius: 12, padding: '10px 14px', color: '#FFF', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  if (loading) return <div style={{ padding: 28, background: '#000', color: '#FFF', fontFamily: "'Inter', sans-serif" }}>Cargando...</div>

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#666' }}>Punto de venta</span>
          </div>
          <h1 style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 800, color: '#FFF' }}>Nueva venta</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 12 }}>Registra productos y comprobante.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* PRODUCTOS */}
          <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', color: '#FFF', fontSize: 15 }}>Agregar productos</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, position: 'relative' }}>
              <input placeholder="Buscar producto..." value={busqueda} onChange={e => { setBusqueda(e.target.value); buscarProductos(e.target.value) }} onFocus={() => busqueda && setMostrarSugerencias(true)} onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)} style={{ ...inputStyle, flex: 1 }} />
              <button className="btn btn-primary" onClick={() => { if (busqueda && sugerenciasProductos.length > 0) seleccionarProducto(sugerenciasProductos[0]) }}>Agregar</button>
              {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, zIndex: 9999, maxHeight: 220, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                  {sugerenciasProductos.map(p => (
                    <div key={p.id_producto} onClick={() => seleccionarProducto(p)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', color: '#FFF' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span>{p.nombre_comercial}</span><span style={{ color: '#22C55E', fontWeight: 700 }}>S/ {p.Productos_Precios?.[0]?.precio_venta?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #1A1A1A' }}>{['Producto', 'Precio', 'Cant.', 'Importe', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>
                {cart.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#666' }}>No hay productos</td></tr> :
                  cart.map(item => (
                    <tr key={item.id_producto} style={{ borderBottom: '1px solid #1A1A1A' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.nombre}</td>
                      <td style={{ padding: '8px 10px', color: '#22C55E', fontWeight: 700 }}>S/ {item.precio_venta.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}><input type="text" inputMode="numeric" value={item.qty} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); updateQty(item.id_producto, val) }} onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) updateQty(item.id_producto, 1) }} style={{ width: 50, background: '#050505', border: '1px solid #1A1A1A', borderRadius: 8, padding: '6px', color: '#FFF', textAlign: 'center', fontSize: 12 }} /></td>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>S/ {(item.precio_venta * item.qty).toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}><button onClick={() => removeItem(item.id_producto)} className="icon-btn danger"><i className="ti ti-trash" style={{ fontSize: 13 }} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* CLIENTE + COMPROBANTE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', color: '#FFF', fontSize: 15 }}>Comprobante</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: '#050505', borderRadius: 12, padding: 4 }}>
                {['Boleta', 'Factura'].map(t => (
                  <button key={t} onClick={() => { setTipoDoc(t); setSerie(t === 'Boleta' ? 'B001' : 'F001') }} style={{ flex: 1, border: 'none', padding: '8px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: tipoDoc === t ? '#22C55E' : 'transparent', color: tipoDoc === t ? '#000' : '#666' }}>{t}</button>
                ))}
              </div>
              <p style={{ color: '#666', fontSize: 12, margin: '4px 0' }}>Serie: <span style={{ color: '#FFF' }}>{serie}</span></p>
              <select style={selectStyle} value={moneda} onChange={e => setMoneda(e.target.value)}>
                {monedas.map(m => <option key={m.id_moneda} value={m.codigo_moneda}>{m.nombre_moneda}</option>)}
              </select>
            </div>

            <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '20px', position: 'relative' }}>
              <h3 style={{ margin: '0 0 12px', color: '#FFF', fontSize: 15 }}>Cliente</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <input placeholder="Buscar cliente..." value={clienteBusqueda} onChange={e => { setClienteBusqueda(e.target.value); buscarClientes(e.target.value); if (!e.target.value) setClienteSeleccionado(null) }} style={{ ...inputStyle, flex: 1 }} />
                <button className="btn btn-secondary" onClick={() => buscarClientes(clienteBusqueda)}>Buscar</button>
              </div>
              {mostrarSugerenciasClientes && sugerenciasClientes.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 12, zIndex: 9999, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                  {sugerenciasClientes.map(c => (
                    <div key={c.id_cliente} onClick={() => seleccionarCliente(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1A1A1A', color: '#FFF' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <strong>{c.nombres_razon_social}</strong><span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>{c.numero_documento}</span>
                    </div>
                  ))}
                </div>
              )}
              {clienteSeleccionado && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.15)' }}>
                  <strong style={{ color: '#FFF' }}>{clienteSeleccionado.nombres_razon_social}</strong>
                  <p style={{ color: '#666', margin: '2px 0 0', fontSize: 12 }}>{clienteSeleccionado.numero_documento}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESUMEN */}
        <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 20, padding: '22px', position: 'sticky', top: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: '#FFF', fontSize: 16 }}>Resumen</h3>
          <div style={{ background: 'linear-gradient(135deg, #22C55E, #10B981)', borderRadius: 18, padding: '18px', marginBottom: 16, color: '#000' }}>
            <small style={{ fontWeight: 700, opacity: 0.8 }}>Total</small>
            <strong style={{ display: 'block', fontSize: 30, fontWeight: 800 }}>S/ {total.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}><span>Subtotal</span><span style={{ color: '#FFF' }}>S/ {subtotal.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}><span>IGV 18%</span><span style={{ color: '#FFF' }}>S/ {igv.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}><span>Productos</span><span style={{ color: '#FFF' }}>{cart.length}</span></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#666', fontSize: 11, display: 'block', marginBottom: 4 }}>Total recibido</label>
            <input type="number" value={totalRecibido} onChange={e => setTotalRecibido(e.target.value)} style={inputStyle} placeholder="0.00" />
            <p style={{ color: '#22C55E', fontSize: 12, margin: '4px 0 0' }}>Vuelto: S/ {vuelto >= 0 ? vuelto.toFixed(2) : '0.00'}</p>
          </div>
          <button className="btn btn-primary" onClick={handleVender} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <i className="ti ti-shopping-cart-check" style={{ fontSize: 16 }} /> Vender
          </button>
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 30 }}>✅</div>
            <h3 style={{ color: '#FFF', margin: '0 0 6px', fontSize: 20 }}>¡Venta registrada!</h3>
            <div style={{ background: 'rgba(34,197,94,0.08)', padding: '6px 16px', borderRadius: 8, display: 'inline-block', marginBottom: 12 }}>
              <span style={{ color: '#22C55E', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{modal.comprobante}</span>
            </div>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>El comprobante fue generado correctamente.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={imprimirComprobante}><i className="ti ti-printer" /> Imprimir</button>
              <button className="btn btn-primary" onClick={() => setModal(null)}>Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}