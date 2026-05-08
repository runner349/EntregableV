import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

const IGV_RATE = 0.18

export default function NuevaVenta() {
  const { profile } = useAuth() || {}
  const [catalogo, setCatalogo] = useState([])
  const [clientes, setClientes] = useState([])
  const [monedas, setMonedas] = useState([])
  const [tipoDoc, setTipoDoc] = useState('Boleta')
  const [serie, setSerie] = useState('B001')
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [moneda, setMoneda] = useState('PEN')
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState([])
  const [totalRecibido, setTotalRecibido] = useState('')
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    // Cargar productos con precios
    const { data: prod } = await supabase
      .from('Productos')
      .select('*, Productos_Precios(*), Laboratorios(*)')
      .eq('estado', true)

    setCatalogo(prod || [])

    // Cargar clientes
    const { data: cli } = await supabase
      .from('Clientes')
      .select('*')
      .eq('estado', true)
      .order('nombres_razon_social')

    setClientes(cli || [])

    // Cargar monedas
    const { data: mon } = await supabase.from('Monedas').select('*')
    setMonedas(mon || [])

    setLoading(false)
  }

  const handleTipoDoc = (tipo) => {
    setTipoDoc(tipo)
    setSerie(tipo === 'Boleta' ? 'B001' : 'F001')
  }

  const buscarCliente = async () => {
    if (!clienteBusqueda) return

    const { data } = await supabase
      .from('Clientes')
      .select('*')
      .eq('estado', true)
      .or(`numero_documento.eq.${clienteBusqueda},nombres_razon_social.ilike.%${clienteBusqueda}%`)
      .limit(5)

    if (data && data.length > 0) {
      setClienteSeleccionado(data[0])
    }
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.precio_venta || item.precio) * item.qty, 0)
  const igv = subtotal * IGV_RATE
  const total = subtotal + igv
  const vuelto = totalRecibido ? parseFloat(totalRecibido) - total : 0

  const addProduct = () => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return

    const prod = catalogo.find(p =>
      p.nombre_comercial?.toLowerCase().includes(term) ||
      p.principio_activo?.toLowerCase().includes(term)
    )

    if (!prod) {
      alert('Producto no encontrado')
      return
    }

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
  }

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id_producto !== id))
  const updateQty = (id, val) => {
    const q = Math.max(1, parseInt(val) || 1)
    setCart(prev => prev.map(c => c.id_producto === id ? { ...c, qty: q } : c))
  }

  const handleVender = async () => {
    if (!cart.length) {
      alert('Agregue al menos un producto.')
      return
    }

    // 1. Buscar o usar cliente genérico
    let idCliente = clienteSeleccionado?.id_cliente || 1 // 1 = PÚBLICO EN GENERAL

    // 2. Obtener serie y correlativo
    const { data: compData } = await supabase
      .from('Tipos_Comprobantes')
      .select('*')
      .eq('nombre_documento', tipoDoc)
      .single()

    const serieUsar = compData?.serie_actual || serie
    const correlativo = (compData?.correlativo_actual || 0) + 1
    const numeroDoc = String(correlativo).padStart(6, '0')

    // 3. Usar el id_usuario del perfil (desde useAuth)
    const idUsuario = profile?.id_usuario

    if (!idUsuario) {
      alert('No se pudo identificar al usuario')
      return
    }

    // 4. Insertar venta
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

    // 5. Insertar detalle (los triggers descuentan stock automáticamente)
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

    if (errorDetalle) {
      alert('Error en detalle: ' + errorDetalle.message)
      return
    }

    // 6. Mostrar confirmación
    setModal(`${serieUsar}-${numeroDoc}`)
    setCart([])
    setTotalRecibido('')
    setClienteSeleccionado(null)
    setClienteBusqueda('')
    cargarDatos()
  }

  if (loading) return <div style={{ padding: 30 }}>Cargando...</div>

  return (
    <div className="pos-page">
      <div className="pos-header">
        <div>
          <span className="pos-kicker">Punto de venta</span>
          <h1>Nueva venta</h1>
          <p>Registra productos y comprobante.</p>
        </div>
      </div>

      <div className="pos-layout">
        <main className="pos-main">
          <section className="pos-panel">
            <div className="pos-panel-head">
              <h2>Agregar productos</h2>
            </div>

            <div className="pos-search">
              <i className="ti ti-search" />
              <input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProduct()}
              />
              <button onClick={addProduct}>Agregar</button>
            </div>

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
                      <input type="number" min={1} value={item.qty} onChange={e => updateQty(item.id_producto, e.target.value)} />
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

          <section className="pos-panel">
            <h2>Comprobante</h2>
            <div className="doc-switch">
              {['Boleta', 'Factura'].map(t => (
                <button key={t} className={tipoDoc === t ? 'active' : ''} onClick={() => handleTipoDoc(t)}>
                  {t}
                </button>
              ))}
            </div>
            <p>Serie: {serie}</p>
            <p>Moneda: {moneda}</p>
            <select value={moneda} onChange={e => setMoneda(e.target.value)}>
              {monedas.map(m => <option key={m.id_moneda} value={m.codigo_moneda}>{m.nombre_moneda}</option>)}
            </select>
          </section>

          <section className="pos-panel">
            <h2>Cliente</h2>
            <div>
              <input placeholder="Buscar cliente..." value={clienteBusqueda} onChange={e => setClienteBusqueda(e.target.value)} />
              <button onClick={buscarCliente}>Buscar</button>
            </div>
            {clienteSeleccionado && (
              <div>
                <strong>{clienteSeleccionado.nombres_razon_social}</strong>
                <p>{clienteSeleccionado.numero_documento}</p>
              </div>
            )}
          </section>
        </main>

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

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>✅ ¡Venta registrada!</h3>
            <p>{modal}</p>
            <button onClick={() => setModal(null)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  )
}