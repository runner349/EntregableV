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

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    const { data: prod } = await supabase
      .from('Productos')
      .select('*, Productos_Precios(*, Unidades_Medida(*), Monedas(*)), Laboratorios(*)')
      .eq('estado', true)

    setCatalogo(prod || [])

    const { data: mon } = await supabase.from('Monedas').select('*')
    setMonedas(mon || [])

    setLoading(false)
  }

  const buscarProductos = async (termino) => {
    if (!termino || termino.length < 1) {
      setSugerenciasProductos([])
      setMostrarSugerencias(false)
      return
    }

    const term = termino.toLowerCase()
    const resultados = catalogo.filter(p =>
      p.nombre_comercial?.toLowerCase().includes(term) ||
      p.principio_activo?.toLowerCase().includes(term) ||
      p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(term)
    ).slice(0, 8)

    setSugerenciasProductos(resultados)
    setMostrarSugerencias(resultados.length > 0)
  }

  const buscarClientes = async (termino) => {
    if (!termino || termino.length < 1) {
      setSugerenciasClientes([])
      setMostrarSugerenciasClientes(false)
      return
    }

    const term = `%${termino}%`

    const { data } = await supabase
      .from('Clientes')
      .select('*')
      .eq('estado', true)
      .or(`nombres_razon_social.ilike.${term},numero_documento.ilike.${term}`)
      .order('nombres_razon_social')
      .limit(20)

    const filtrados = (data || []).filter(c => c.id_cliente !== 1)

    setSugerenciasClientes(filtrados)
    setMostrarSugerenciasClientes(filtrados.length > 0)
  }

  const seleccionarProducto = (prod) => {
    const precioDefault = prod.Productos_Precios?.[0]

    setCart(prev => {
      const ex = prev.find(c => c.id_producto === prod.id_producto)
      if (ex) return prev.map(c => c.id_producto === prod.id_producto ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, {
        id_producto: prod.id_producto,
        id_producto_precio: precioDefault?.id_producto_precio,
        nombre: prod.nombre_comercial,
        precio_venta: precioDefault?.precio_venta || 0,
        precio: precioDefault?.precio_venta || 0,
        qty: 1,
        laboratorio: prod.Laboratorios?.nombre_laboratorio
      }]
    })

    setBusqueda('')
    setSugerenciasProductos([])
    setMostrarSugerencias(false)
  }

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setClienteBusqueda(cliente.nombres_razon_social)
    setSugerenciasClientes([])
    setMostrarSugerenciasClientes(false)
  }

  const handleTipoDoc = (tipo) => {
    setTipoDoc(tipo)
    setSerie(tipo === 'Boleta' ? 'B001' : 'F001')
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta || item.precio) * item.qty, 0)
  const igv = subtotal * IGV_RATE
  const total = subtotal + igv
  const vuelto = totalRecibido ? parseFloat(totalRecibido) - total : 0

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id_producto !== id))
  
  const updateQty = (id, val) => {
    const q = val === '' ? '' : Math.max(0, parseInt(val) || 0)
    setCart(prev => prev.map(c => c.id_producto === id ? { ...c, qty: q } : c))
  }

  const handleVender = async () => {
    if (!cart.length) {
      alert('Agregue al menos un producto.')
      return
    }

    let idCliente = clienteSeleccionado?.id_cliente || 1

    const { data: compData } = await supabase
      .from('Tipos_Comprobantes')
      .select('*')
      .eq('nombre_documento', tipoDoc)
      .single()

    const serieUsar = compData?.serie_actual || serie
    const correlativo = (compData?.correlativo_actual || 0) + 1
    const numeroDoc = String(correlativo).padStart(6, '0')

    const idUsuario = profile?.id_usuario

    if (!idUsuario) {
      alert('No se pudo identificar al usuario')
      return
    }

    // 1. Insertar la venta
    const { data: venta, error: errorVenta } = await supabase
      .from('Ventas')
      .insert({
        id_tipo_comprobante: compData?.id_tipo_comprobante || 1,
        serie_documento: serieUsar,
        numero_documento: numeroDoc,
        id_cliente: idCliente,
        id_usuario: idUsuario,
        subtotal,
        igv,
        total,
        id_moneda: monedas.find(m => m.codigo_moneda === moneda)?.id_moneda || 1,
        estado: 'Completada'
      })
      .select('id_venta')
      .single()

    if (errorVenta) {
      alert('Error al crear venta: ' + errorVenta.message)
      return
    }

    // 2. Insertar el detalle
    const detalles = cart.map(item => ({
      id_venta: venta.id_venta,
      id_producto: item.id_producto,
      id_producto_precio: item.id_producto_precio,
      cantidad: item.qty,
      precio_unitario: item.precio_venta,
      subtotal: item.precio_venta * item.qty
    }))

    const { error: errorDetalle } = await supabase
      .from('Detalle_Ventas')
      .insert(detalles)

    // 3. Si falla el detalle, ELIMINAR la venta huérfana
    if (errorDetalle) {
      await supabase
        .from('Ventas')
        .delete()
        .eq('id_venta', venta.id_venta)

      alert('❌ ' + errorDetalle.message)
      return
    }

    // 4. Guardar datos de la venta para imprimir
    const datosImpresion = {
      comprobante: `${serieUsar}-${numeroDoc}`,
      cliente: clienteSeleccionado,
      cart: [...cart],
      subtotal,
      igv,
      total,
      totalRecibido,
      vuelto,
      moneda,
      tipoDoc
    }

    // 5. Todo salió bien
    setModal(datosImpresion)
    setCart([])
    setTotalRecibido('')
    setClienteSeleccionado(null)
    setClienteBusqueda('')
    cargarDatos()
  }

  // 📄 IMPRIMIR COMPROBANTE
  const imprimirComprobante = () => {
    if (!modal) return

    const cliente = modal.cliente?.nombres_razon_social || 'PÚBLICO EN GENERAL'
    const docCliente = modal.cliente?.numero_documento || '99999999'
    const direccion = modal.cliente?.direccion || '-'
    const telefono = modal.cliente?.telefono || '-'
    const fecha = new Date().toLocaleDateString('es-PE')
    const productos = modal.cart || []
    const subtotalPrint = modal.subtotal || 0
    const igvPrint = modal.igv || 0
    const totalPrint = modal.total || 0
    const recibidoPrint = parseFloat(modal.totalRecibido || 0)
    const vueltoPrint = modal.vuelto || 0
    const monedaPrint = modal.moneda || 'PEN'
    const tipoPrint = modal.tipoDoc || 'Boleta'

    const ventana = window.open('', '_blank', 'width=400,height=600')

    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${modal.comprobante}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Courier New', monospace; }
                body { 
                    width: 80mm; 
                    margin: 0 auto; 
                    padding: 10px; 
                    font-size: 12px; 
                    color: #000;
                }
                .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                .header h2 { font-size: 14px; margin-bottom: 2px; }
                .header small { font-size: 9px; color: #333; }
                .tipo { text-align: center; font-weight: bold; font-size: 13px; margin: 8px 0; }
                .numero { text-align: center; font-weight: bold; font-size: 16px; margin: 4px 0; background: #f0f0f0; padding: 4px; }
                .info { display: flex; justify-content: space-between; font-size: 10px; margin: 8px 0; }
                .info span { color: #555; }
                .cliente { font-size: 10px; margin: 8px 0; }
                .cliente strong { display: block; }
                table { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 8px 0; padding: 8px 0; }
                table th { text-align: left; font-size: 9px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
                table td { font-size: 10px; padding: 2px 0; }
                .totales { font-size: 11px; }
                .totales div { display: flex; justify-content: space-between; padding: 2px 0; }
                .totales .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
                .recibido { font-size: 11px; margin-top: 4px; }
                .gracias { text-align: center; font-size: 10px; margin-top: 12px; color: #555; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>BOTICA NOVA SALUD</h2>
                <small>RUC 00000000000</small>
                <br><small>Sistema de ventas</small>
            </div>

            <div class="tipo">${tipoPrint.toUpperCase()} ELECTRÓNICA</div>
            <div class="numero">${modal.comprobante}</div>

            <div class="info">
                <div>Fecha<br><span>${fecha}</span></div>
                <div>Pago<br><span>Contado</span></div>
                <div>Moneda<br><span>${monedaPrint}</span></div>
            </div>

            <div class="cliente">
                <strong>Cliente: ${cliente}</strong>
                Documento: ${docCliente}<br>
                Dirección: ${direccion}<br>
                Teléfono: ${telefono}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th style="text-align:right">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(item => `
                        <tr>
                            <td>${item.nombre}<br><small>${item.qty} x S/ ${item.precio_venta.toFixed(2)}</small></td>
                            <td style="text-align:right">S/ ${(item.precio_venta * item.qty).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totales">
                <div><span>Op. Gravadas</span><span>S/ ${subtotalPrint.toFixed(2)}</span></div>
                <div><span>Subtotal</span><span>S/ ${subtotalPrint.toFixed(2)}</span></div>
                <div><span>IGV 18%</span><span>S/ ${igvPrint.toFixed(2)}</span></div>
                <div class="total"><span>Total</span><span>S/ ${totalPrint.toFixed(2)}</span></div>
            </div>

            <div class="recibido">
                <div><span>Recibido</span><span>S/ ${recibidoPrint.toFixed(2)}</span></div>
                <div><span>Vuelto</span><span>S/ ${vueltoPrint >= 0 ? vueltoPrint.toFixed(2) : '0.00'}</span></div>
            </div>

            <div class="gracias">Gracias por su compra.</div>

            <script>window.print(); setTimeout(() => window.close(), 500);<\/script>
        </body>
        </html>
    `)

    ventana.document.close()
    setModal(null)
  }

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>

  return (
    <div className="pos-page" style={{ overflow: 'visible' }}>
      <div className="pos-header">
        <div>
          <span className="pos-kicker">Punto de venta</span>
          <h1>Nueva venta</h1>
          <p>Registra productos y comprobante.</p>
        </div>
      </div>

      <div className="pos-layout" style={{ overflow: 'visible' }}>
        <main className="pos-main" style={{ overflow: 'visible' }}>
          {/* PRODUCTOS */}
          <section className="pos-panel" style={{ overflow: 'visible' }}>
            <div className="pos-panel-head">
              <h2>Agregar productos</h2>
            </div>

            <div className="pos-search" style={{ position: 'relative', overflow: 'visible' }}>
              <i className="ti ti-search" />
              <input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => {
                  setBusqueda(e.target.value)
                  buscarProductos(e.target.value)
                }}
                onFocus={() => busqueda && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && sugerenciasProductos.length > 0) {
                    seleccionarProducto(sugerenciasProductos[0])
                  }
                }}
              />
              <button onClick={() => {
                if (busqueda && sugerenciasProductos.length > 0) {
                  seleccionarProducto(sugerenciasProductos[0])
                }
              }}>Agregar</button>

              {/* Dropdown de sugerencias de productos */}
              {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  zIndex: 9999,
                  maxHeight: 250,
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {sugerenciasProductos.map(p => (
                    <div
                      key={p.id_producto}
                      onClick={() => seleccionarProducto(p)}
                      style={{
                        padding: '10px 15px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div>
                        <strong>{p.nombre_comercial}</strong>
                        <div style={{ fontSize: 12, color: '#666' }}>{p.Laboratorios?.nombre_laboratorio} - {p.principio_activo}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: '#235ebd' }}>
                        S/ {p.Productos_Precios?.[0]?.precio_venta?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de productos agregados */}
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cant.</th>
                  <th>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan={5}>No hay productos</td></tr>
                ) : cart.map(item => (
                  <tr key={item.id_producto}>
                    <td><strong>{item.nombre}</strong></td>
                    <td>S/ {item.precio_venta.toFixed(2)}</td>
                    <td>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        pattern="[0-9]*"
                        value={item.qty} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          updateQty(item.id_producto, val === '' ? '' : val)
                        }}
                        onBlur={e => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            updateQty(item.id_producto, 1)
                          }
                        }}
                        style={{ width: 60, textAlign: 'center' }}
                      />
                    </td>
                    <td><strong>S/ {(item.precio_venta * item.qty).toFixed(2)}</strong></td>
                    <td>
                      <button onClick={() => removeItem(item.id_producto)}>
                        <i className="ti ti-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* COMPROBANTE */}
          <section className="pos-panel" style={{ position: 'relative', zIndex: 1 }}>
            <h2>Comprobante</h2>
            <div className="doc-switch">
              {['Boleta', 'Factura'].map(t => (
                <button key={t} className={tipoDoc === t ? 'active' : ''} onClick={() => handleTipoDoc(t)}>
                  {t}
                </button>
              ))}
            </div>
            <p>Serie: {serie}</p>
            <select value={moneda} onChange={e => setMoneda(e.target.value)}>
              {monedas.map(m => <option key={m.id_moneda} value={m.codigo_moneda}>{m.nombre_moneda}</option>)}
            </select>
          </section>

          {/* CLIENTE */}
          <section className="pos-panel" style={{ overflow: 'visible' }}>
            <h2>Cliente</h2>
            <div style={{ position: 'relative', overflow: 'visible' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Buscar cliente..."
                  value={clienteBusqueda}
                  onChange={e => {
                    setClienteBusqueda(e.target.value)
                    buscarClientes(e.target.value)
                    if (!e.target.value) {
                      setClienteSeleccionado(null)
                    }
                  }}
                  onFocus={() => clienteBusqueda && setMostrarSugerenciasClientes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugerenciasClientes(false), 200)}
                  style={{ flex: 1 }}
                />
                <button onClick={() => buscarClientes(clienteBusqueda)}>Buscar</button>
              </div>

              {/* Dropdown de sugerencias de clientes */}
              {mostrarSugerenciasClientes && sugerenciasClientes.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  zIndex: 9999,
                  maxHeight: 250,
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {sugerenciasClientes.map(c => (
                    <div
                      key={c.id_cliente}
                      onClick={() => seleccionarCliente(c)}
                      style={{
                        padding: '10px 15px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <strong>{c.nombres_razon_social}</strong>
                      <span style={{ marginLeft: 10, color: '#666', fontSize: 13 }}>
                        {c.tipo_documento}: {c.numero_documento}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {clienteSeleccionado && (
              <div style={{ marginTop: 10, padding: 10, background: '#f0f4ff', borderRadius: 8 }}>
                <strong>{clienteSeleccionado.nombres_razon_social}</strong>
                <p style={{ margin: 0, color: '#666' }}>{clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento}</p>
              </div>
            )}
          </section>
        </main>

        {/* RESUMEN */}
        <aside className="pos-summary">
          <div className="summary-card">
            <h3>Resumen</h3>
            <div className="summary-total">
              <small>Total</small>
              <strong>S/ {total.toFixed(2)}</strong>
            </div>
            <div>
              <span>Subtotal: S/ {subtotal.toFixed(2)}</span>
              <span>IGV: S/ {igv.toFixed(2)}</span>
              <span>Productos: {cart.length}</span>
            </div>
            <div>
              <label>Total recibido</label>
              <input type="number" value={totalRecibido} onChange={e => setTotalRecibido(e.target.value)} />
              <p>Vuelto: S/ {vuelto >= 0 ? vuelto.toFixed(2) : '0.00'}</p>
            </div>
            <button className="btn btn-primary" onClick={handleVender}>
              Vender
            </button>
          </div>
        </aside>
      </div>

      {/* Modal de confirmación */}
      {modal && (
        <div 
          onClick={() => setModal(null)}
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
              borderRadius: 16,
              padding: 32,
              maxWidth: 450,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 40
            }}>
              ✅
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 22 }}>¡Venta registrada!</h3>
            <div style={{
              fontSize: 16,
              color: '#235ebd',
              fontWeight: 700,
              background: '#f0f4ff',
              padding: '8px 16px',
              borderRadius: 8,
              display: 'inline-block',
              marginBottom: 16
            }}>
              {modal.comprobante}
            </div>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
              El comprobante fue generado correctamente.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                className="btn"
                onClick={imprimirComprobante}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 15
                }}
              >
                <i className="ti ti-printer" /> Imprimir
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setModal(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  fontSize: 15
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}