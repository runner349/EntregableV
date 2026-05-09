import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

const IGV_RATE = 0.18

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Sans:wght@400;500;600&display=swap');

  .nv-root, .nv-root * {
    font-style: normal;
  }

  .nv-root {
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

  .nv-root * { box-sizing: border-box; }

  /* ── Header ── */
  .nv-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .nv-badge {
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
  .nv-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
    animation: pulse-dot 2s ease infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 0 3px var(--accent-dim); }
    50% { box-shadow: 0 0 0 6px transparent; }
  }
  .nv-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 32px;
    font-weight: 800;
    font-style: normal;
    color: var(--ink);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .nv-subtitle {
    font-size: 13px;
    color: var(--ink-3);
    margin: 0;
  }

  /* ── Layout ── */
  .nv-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 20px;
    align-items: start;
  }
  .nv-left { display: flex; flex-direction: column; gap: 16px; }

  /* ── Card ── */
  .nv-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
  }
  .nv-card-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    margin: 0 0 16px;
  }

  /* ── Input / Select ── */
  .nv-input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 13px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .nv-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
    background: var(--surface);
  }
  .nv-input::placeholder { color: var(--ink-4); }

  /* ── Buttons ── */
  .nv-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nv-btn-primary {
    background: var(--ink);
    color: var(--surface);
  }
  .nv-btn-primary:hover { background: #222; transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .nv-btn-primary:active { transform: translateY(0); }
  .nv-btn-ghost {
    background: var(--surface-2);
    color: var(--ink-2);
    border: 1px solid var(--border);
  }
  .nv-btn-ghost:hover { background: var(--surface-3); }
  .nv-btn-sell {
    background: var(--accent);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    padding: 14px;
    width: 100%;
    justify-content: center;
    border-radius: var(--radius);
    letter-spacing: -0.01em;
  }
  .nv-btn-sell:hover { background: #00b06e; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,195,122,0.30); }
  .nv-btn-sell:active { transform: translateY(0); }
  .nv-btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    transition: all 0.15s;
    padding: 0;
  }
  .nv-btn-icon:hover { background: #fee2e2; color: var(--danger); }

  /* ── Search Row ── */
  .nv-search-row {
    display: flex;
    gap: 8px;
    position: relative;
  }

  /* ── Dropdown ── */
  .nv-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0; right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    z-index: 9999;
    max-height: 220px;
    overflow-y: auto;
    box-shadow: var(--shadow-md);
  }
  .nv-dropdown-item {
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.1s;
  }
  .nv-dropdown-item:last-child { border-bottom: none; }
  .nv-dropdown-item:hover { background: var(--surface-2); }
  .nv-dropdown-item-name { font-size: 13px; color: var(--ink); font-weight: 500; }
  .nv-dropdown-item-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-dim);
    padding: 2px 8px;
    border-radius: 100px;
  }

  /* ── Table ── */
  .nv-table { width: 100%; border-collapse: collapse; }
  .nv-table th {
    text-align: left;
    padding: 8px 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    border-bottom: 1px solid var(--border);
  }
  .nv-table td { padding: 10px 10px; vertical-align: middle; }
  .nv-table tr { border-bottom: 1px solid var(--border); transition: background 0.12s; }
  .nv-table tbody tr:last-child { border-bottom: none; }
  .nv-table tbody tr:hover { background: var(--surface-2); }
  .nv-empty {
    text-align: center;
    padding: 40px 0;
    color: var(--ink-4);
    font-size: 13px;
  }
  .nv-empty-icon { font-size: 28px; margin-bottom: 8px; opacity: 0.4; }
  .nv-price-cell {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-2);
  }
  .nv-qty-input {
    width: 52px;
    text-align: center;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s;
  }
  .nv-qty-input:focus { border-color: var(--accent); }

  /* ── Tipo Comprobante ── */
  .nv-toggle {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    padding: 3px;
    margin-bottom: 14px;
    border: 1px solid var(--border);
  }
  .nv-toggle-btn {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 10px;
    border-radius: 6px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    color: var(--ink-3);
    transition: all 0.15s;
  }
  .nv-toggle-btn.active {
    background: var(--ink);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .nv-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--ink-3);
    margin-bottom: 10px;
  }
  .nv-meta-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--ink-2);
    font-weight: 500;
  }

  /* ── Cliente Selected ── */
  .nv-client-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding: 10px 12px;
    background: var(--accent-dim);
    border: 1px solid var(--accent-mid);
    border-radius: var(--radius-sm);
  }
  .nv-client-chip-avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 12px; font-weight: 800;
    color: #fff;
    flex-shrink: 0;
  }
  .nv-client-chip-name { font-size: 13px; font-weight: 600; color: var(--ink); }
  .nv-client-chip-doc { font-size: 11px; color: var(--ink-3); font-family: 'JetBrains Mono', monospace; }

  /* ── Summary Panel ── */
  .nv-summary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    position: sticky;
    top: 20px;
    box-shadow: var(--shadow);
  }
  .nv-total-hero {
    background: var(--ink);
    border-radius: var(--radius);
    padding: 18px 20px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .nv-total-hero::before {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(0,195,122,0.15);
  }
  .nv-total-hero::after {
    content: '';
    position: absolute;
    bottom: -30px; left: 10px;
    width: 60px; height: 60px;
    border-radius: 50%;
    background: rgba(0,195,122,0.08);
  }
  .nv-total-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.5);
    margin-bottom: 4px;
  }
  .nv-total-amount {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 34px;
    font-weight: 800;
    font-style: normal;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1;
    position: relative;
    z-index: 1;
  }
  .nv-total-amount span {
    font-size: 16px;
    font-weight: 500;
    font-style: normal;
    opacity: 0.7;
    margin-right: 4px;
  }
  .nv-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 12px;
    color: var(--ink-3);
    border-bottom: 1px dashed var(--border);
  }
  .nv-line:last-of-type { border-bottom: none; }
  .nv-line-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--ink-2); font-weight: 500; }
  .nv-divider { height: 1px; background: var(--border); margin: 16px 0; }
  .nv-change-label { font-size: 11px; color: var(--ink-3); margin-bottom: 4px; display: block; font-weight: 500; }
  .nv-change-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
  }
  .nv-change-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--accent-dim);
    border-radius: var(--radius-sm);
    margin-top: 8px;
    border: 1px solid var(--accent-mid);
  }

  /* ── Modal ── */
  .nv-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,10,0.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.18s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .nv-modal {
    background: var(--surface);
    border-radius: 20px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 24px 64px rgba(0,0,0,0.20);
    animation: slideUp 0.22s ease;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .nv-modal-icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--accent-dim);
    border: 2px solid var(--accent-mid);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
    font-size: 28px;
  }
  .nv-modal-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
    margin: 0 0 6px;
    letter-spacing: -0.02em;
  }
  .nv-modal-code {
    display: inline-block;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 12px;
    letter-spacing: 0.04em;
  }
  .nv-modal-sub { font-size: 13px; color: var(--ink-3); margin-bottom: 24px; }
  .nv-modal-actions { display: flex; gap: 10px; justify-content: center; }

  /* ── Loading ── */
  .nv-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 40px;
    font-size: 14px;
    color: var(--ink-3);
    font-family: 'Instrument Sans', sans-serif;
  }
  .nv-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Grid for Comprobante + Cliente ── */
  .nv-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
`

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
      body{width:80mm;margin:0 auto;padding:10px;font-size:11px;color:#0F172A;background:#FFFFFF}
      .header{text-align:center;border-bottom:1px dashed #CBD5E1;padding-bottom:8px;margin-bottom:8px}
      .header h2{font-size:13px;color:#16A34A}.header small{font-size:8px;color:#64748B}
      .tipo{text-align:center;font-weight:bold;font-size:12px;color:#0F172A;margin:6px 0}
      .numero{text-align:center;font-weight:bold;font-size:15px;background:#F8FAFC;padding:4px;color:#16A34A}
      .info{display:flex;justify-content:space-between;font-size:9px;margin:8px 0;color:#64748B}
      .cliente{font-size:9px;margin:8px 0;color:#475569}table{width:100%;border-top:1px dashed #CBD5E1;border-bottom:1px dashed #CBD5E1;margin:8px 0;padding:8px 0}
      table th{text-align:left;font-size:8px;color:#64748B;padding-bottom:4px}table td{font-size:9px;padding:2px 0}
      .totales{font-size:10px}.totales div{display:flex;justify-content:space-between;padding:2px 0;color:#475569}
      .totales .total{font-weight:bold;font-size:13px;border-top:1px dashed #CBD5E1;padding-top:4px;margin-top:4px;color:#16A34A}
      .recibido{font-size:10px;margin-top:4px;color:#475569}.gracias{text-align:center;font-size:9px;margin-top:10px;color:#64748B}
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

  if (loading) return (
    <div className="nv-root">
      <style>{styles}</style>
      <div className="nv-loading">
        <div className="nv-spinner" />
        Cargando datos...
      </div>
    </div>
  )

  return (
    <div className="nv-root">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="nv-header">
        <div>
          <div className="nv-badge">
            <div className="nv-badge-dot" />
            Punto de venta
          </div>
          <h1 className="nv-title">Nueva venta</h1>
          <p className="nv-subtitle">Registra productos y genera el comprobante.</p>
        </div>
      </div>

      <div className="nv-layout">
        <div className="nv-left">

          {/* PRODUCTOS */}
          <div className="nv-card">
            <p className="nv-card-title">Productos</p>
            <div className="nv-search-row" style={{ marginBottom: 16 }}>
              <input
                className="nv-input"
                placeholder="Buscar por nombre, principio activo o laboratorio..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); buscarProductos(e.target.value) }}
                onFocus={() => busqueda && setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                style={{ flex: 1 }}
              />
              <button className="nv-btn nv-btn-primary" onClick={() => { if (busqueda && sugerenciasProductos.length > 0) seleccionarProducto(sugerenciasProductos[0]) }}>
                <i className="ti ti-plus" style={{ fontSize: 14 }} /> Agregar
              </button>
              {mostrarSugerencias && sugerenciasProductos.length > 0 && (
                <div className="nv-dropdown">
                  {sugerenciasProductos.map(p => (
                    <div key={p.id_producto} className="nv-dropdown-item" onClick={() => seleccionarProducto(p)}>
                      <div>
                        <div className="nv-dropdown-item-name">{p.nombre_comercial}</div>
                        {p.Laboratorios?.nombre_laboratorio && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{p.Laboratorios.nombre_laboratorio}</div>
                        )}
                      </div>
                      <div className="nv-dropdown-item-price">S/ {p.Productos_Precios?.[0]?.precio_venta?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <table className="nv-table">
              <thead>
                <tr>
                  {['Producto', 'P. Unit.', 'Cant.', 'Importe', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="nv-empty">
                        <div className="nv-empty-icon"><i className="ti ti-shopping-cart" /></div>
                        Sin productos — usa el buscador para agregar
                      </div>
                    </td>
                  </tr>
                ) : cart.map(item => (
                  <tr key={item.id_producto}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</div>
                      {item.laboratorio && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{item.laboratorio}</div>}
                    </td>
                    <td><span className="nv-price-cell">S/ {item.precio_venta.toFixed(2)}</span></td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.qty}
                        className="nv-qty-input"
                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); updateQty(item.id_producto, val) }}
                        onBlur={e => { if (!e.target.value || parseInt(e.target.value) < 1) updateQty(item.id_producto, 1) }}
                      />
                    </td>
                    <td><span className="nv-price-cell" style={{ fontWeight: 700 }}>S/ {(item.precio_venta * item.qty).toFixed(2)}</span></td>
                    <td>
                      <button className="nv-btn-icon" onClick={() => removeItem(item.id_producto)}>
                        <i className="ti ti-trash" style={{ fontSize: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* COMPROBANTE + CLIENTE */}
          <div className="nv-2col">

            {/* COMPROBANTE */}
            <div className="nv-card">
              <p className="nv-card-title">Comprobante</p>
              <div className="nv-toggle">
                {['Boleta', 'Factura'].map(t => (
                  <button
                    key={t}
                    className={`nv-toggle-btn${tipoDoc === t ? ' active' : ''}`}
                    onClick={() => { setTipoDoc(t); setSerie(t === 'Boleta' ? 'B001' : 'F001') }}
                  >{t}</button>
                ))}
              </div>
              <div className="nv-meta-row">
                <span>Serie</span>
                <span className="nv-meta-val">{serie}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Moneda</label>
                <select className="nv-input" value={moneda} onChange={e => setMoneda(e.target.value)}>
                  {monedas.map(m => <option key={m.id_moneda} value={m.codigo_moneda}>{m.nombre_moneda}</option>)}
                </select>
              </div>
            </div>

            {/* CLIENTE */}
            <div className="nv-card" style={{ position: 'relative' }}>
              <p className="nv-card-title">Cliente</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="nv-input"
                  placeholder="Nombre o documento..."
                  value={clienteBusqueda}
                  onChange={e => { setClienteBusqueda(e.target.value); buscarClientes(e.target.value); if (!e.target.value) setClienteSeleccionado(null) }}
                  style={{ flex: 1 }}
                />
                <button className="nv-btn nv-btn-ghost" onClick={() => buscarClientes(clienteBusqueda)}>
                  <i className="ti ti-search" style={{ fontSize: 13 }} />
                </button>
              </div>
              {mostrarSugerenciasClientes && sugerenciasClientes.length > 0 && (
                <div className="nv-dropdown">
                  {sugerenciasClientes.map(c => (
                    <div key={c.id_cliente} className="nv-dropdown-item" onClick={() => seleccionarCliente(c)}>
                      <div>
                        <div className="nv-dropdown-item-name">{c.nombres_razon_social}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{c.numero_documento}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {clienteSeleccionado && (
                <div className="nv-client-chip">
                  <div className="nv-client-chip-avatar">
                    {clienteSeleccionado.nombres_razon_social?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="nv-client-chip-name">{clienteSeleccionado.nombres_razon_social}</div>
                    <div className="nv-client-chip-doc">{clienteSeleccionado.numero_documento}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="nv-summary">
          <p className="nv-card-title">Resumen</p>

          <div className="nv-total-hero">
            <div className="nv-total-label">Total a cobrar</div>
            <div className="nv-total-amount"><span>S/</span>{total.toFixed(2)}</div>
          </div>

          <div className="nv-line">
            <span>Subtotal</span>
            <span className="nv-line-val">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="nv-line">
            <span>IGV 18%</span>
            <span className="nv-line-val">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="nv-line" style={{ borderBottom: 'none' }}>
            <span>Productos</span>
            <span className="nv-line-val">{cart.length} ítem{cart.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="nv-divider" />

          <label className="nv-change-label">Monto recibido</label>
          <input
            type="number"
            className="nv-input"
            value={totalRecibido}
            onChange={e => setTotalRecibido(e.target.value)}
            placeholder="0.00"
          />

          {totalRecibido && (
            <div className="nv-change-row">
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Vuelto</span>
              <span className="nv-change-amount">S/ {vuelto >= 0 ? vuelto.toFixed(2) : '0.00'}</span>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button className="nv-btn nv-btn-sell" onClick={handleVender}>
              <i className="ti ti-shopping-cart-check" style={{ fontSize: 16 }} />
              Registrar venta
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="nv-overlay" onClick={() => setModal(null)}>
          <div className="nv-modal" onClick={e => e.stopPropagation()}>
            <div className="nv-modal-icon">✅</div>
            <h3 className="nv-modal-title">¡Venta registrada!</h3>
            <div className="nv-modal-code">{modal.comprobante}</div>
            <p className="nv-modal-sub">El comprobante fue generado correctamente.</p>
            <div className="nv-modal-actions">
              <button className="nv-btn nv-btn-ghost" onClick={imprimirComprobante}>
                <i className="ti ti-printer" style={{ fontSize: 14 }} /> Imprimir
              </button>
              <button className="nv-btn nv-btn-primary" onClick={() => setModal(null)}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}