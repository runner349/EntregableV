import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Sans:wght@400;500;600&display=swap');

  .pr-root, .pr-root * {
    box-sizing: border-box;
    font-style: normal;
  }
  .pr-root {
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
    --warn: #d97706;
    --warn-dim: rgba(217,119,6,0.10);
    --danger: #e53535;
    --danger-dim: rgba(229,53,53,0.10);
    --danger-mid: rgba(229,53,53,0.20);
    --info: #2563eb;
    --info-dim: rgba(37,99,235,0.10);
    --border: #e4e4e2;
    --radius: 14px;
    --radius-sm: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    --shadow-md: 0 8px 32px rgba(0,0,0,0.10);
    --shadow-card: 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04);
    font-family: 'Instrument Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    color: var(--ink);
    background: var(--surface-2);
    padding: 0;
    min-height: 100vh;
  }

  @keyframes pr-shimmer {
    0%   { background-position: 200% 0 }
    100% { background-position: -200% 0 }
  }
  @keyframes pr-up {
    from { opacity:0; transform:translateY(12px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes pr-fade {
    from { opacity:0 } to { opacity:1 }
  }
  @keyframes pr-scale {
    from { opacity:0; transform:scale(0.97) translateY(8px) }
    to   { opacity:1; transform:scale(1) translateY(0) }
  }

  /* Header */
  .pr-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 20px 0;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 14px;
    background: var(--surface);
  }
  .pr-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-dim); border: 1px solid var(--accent-mid);
    border-radius: 100px; padding: 4px 10px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 10px;
  }
  .pr-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
  }
  .pr-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 30px; font-weight: 800;
    color: var(--ink); margin: 0 0 4px;
    letter-spacing: -0.02em; line-height: 1;
  }
  .pr-subtitle { font-size: 13px; color: var(--ink-3); margin: 0; }

  /* Stat Cards */
  .pr-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .pr-stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    box-shadow: var(--shadow);
    transition: box-shadow 0.15s;
  }
  .pr-stat:hover { box-shadow: var(--shadow-md); }
  .pr-stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .pr-stat-label { font-size: 11px; color: var(--ink-3); font-weight: 500; }
  .pr-stat-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .pr-stat-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 700; color: var(--ink);
    letter-spacing: -0.02em;
  }

  /* ── Filter Bar ── */
  /*
   * Una sola fila: [búsqueda] [pills categoría] [ranking buttons] [sep] [vista]
   * Usamos flex con nowrap en pantallas amplias y scroll horizontal
   * para que todo quede en una misma línea.
   */
  .pr-filterbar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 14px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
    align-items: center;
    box-shadow: var(--shadow);
    overflow-x: auto;
    min-height: 54px;
  }
  .pr-filterbar::-webkit-scrollbar { height: 3px; }
  .pr-filterbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .pr-input {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    color: var(--ink); outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .pr-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
    background: var(--surface);
  }
  .pr-input::placeholder { color: var(--ink-4); }

  /* búsqueda: ancho fijo para no empujar a los demás */
  .pr-search-wrap {
    position: relative;
    flex: 0 0 200px;
    min-width: 160px;
  }
  .pr-search-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: var(--ink-4); font-size: 13px; pointer-events: none;
  }

  /* Grupo de pills de categoría */
  .pr-cat-pills {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  /* Pill buttons */
  .pr-pill {
    padding: 5px 12px; border-radius: 100px;
    border: 1px solid var(--border);
    background: transparent; color: var(--ink-3);
    font-size: 12px; font-family: 'Instrument Sans', sans-serif;
    font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    flex-shrink: 0;
  }
  .pr-pill:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
  .pr-pill.active { border-color: var(--accent); color: #fff; background: var(--accent); }

  /* Grupo de botones de ranking */
  .pr-rank-group {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
    flex-wrap: nowrap;
  }

  .pr-rank-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 100px;
    border: 1px solid var(--border); background: var(--surface);
    font-size: 11px; font-family: 'Instrument Sans', sans-serif;
    font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap; color: var(--ink-3);
    flex-shrink: 0;
  }
  .pr-rank-btn:hover { border-color: var(--ink-3); color: var(--ink-2); }
  .pr-rank-top      { background: var(--accent-dim); border-color: var(--accent-mid); color: #059652; }
  .pr-rank-low      { background: var(--danger-dim); border-color: var(--danger-mid); color: var(--danger); }
  .pr-rank-sale-top { background: var(--info-dim);   border-color: rgba(37,99,235,0.22); color: var(--info); }
  .pr-rank-sale-low { background: var(--warn-dim);   border-color: rgba(217,119,6,0.22); color: var(--warn); }

  .pr-sep { width: 1px; height: 22px; background: var(--border); flex-shrink: 0; }

  /* Grupo de botones de vista */
  .pr-view-group {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .pr-view-btn {
    width: 30px; height: 30px; border-radius: 7px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--ink-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: all 0.15s;
    flex-shrink: 0;
  }
  .pr-view-btn.active { background: var(--ink); border-color: var(--ink); color: #fff; }
  .pr-view-btn:hover:not(.active) { background: var(--surface-2); color: var(--ink-2); }

  /* Product Grid */
  .pr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
    gap: 14px;
  }
  .pr-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    display: flex; flex-direction: column;
    box-shadow: var(--shadow-card);
    animation: pr-up 0.32s ease both;
  }
  .pr-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.10);
    border-color: var(--accent-mid);
  }
  .pr-card-img {
    width: 100%; height: 160px;
    background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }
  .pr-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  .pr-card:hover .pr-card-img img { transform: scale(1.04); }
  .pr-card-body { padding: 13px 14px 16px; flex: 1; display: flex; flex-direction: column; }
  .pr-card-lab {
    display: flex; align-items: center; gap: 5px; margin-bottom: 7px;
  }
  .pr-card-lab-dot {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--accent-dim); border: 1px solid var(--accent-mid);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pr-card-lab span { font-size: 11px; color: var(--ink-3); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pr-card-pres { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-4); margin-bottom: 3px; }
  .pr-card-name { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.3; margin: 0 0 3px; }
  .pr-card-sub { font-size: 11px; color: var(--ink-4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 0 12px; }
  .pr-card-foot { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
  .pr-card-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px; font-weight: 700; color: var(--ink);
  }
  .pr-card-price-none { font-size: 14px; color: var(--ink-4); font-family: 'JetBrains Mono', monospace; }

  /* Rank tags */
  .pr-rank-tags {
    position: absolute; top: 9px; right: 9px;
    display: flex; flex-direction: column; gap: 5px; align-items: flex-end;
  }
  .pr-rank-tag {
    font-size: 9px; font-weight: 700; padding: 3px 8px;
    border-radius: 100px; letter-spacing: 0.04em;
  }
  .pr-rank-tag-top      { background: var(--ink);   color: #fff; }
  .pr-rank-tag-low      { background: var(--danger); color: #fff; }
  .pr-rank-tag-sale     { background: var(--info);   color: #fff; }
  .pr-rank-tag-sale-low { background: var(--warn);   color: #fff; }

  /* Stock badge */
  .pr-stock {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 100px;
    font-size: 10px; font-weight: 700;
    font-family: 'JetBrains Mono', monospace; white-space: nowrap;
  }
  .pr-stock-ok   { background: var(--accent-dim); color: #059652; border: 1px solid var(--accent-mid); }
  .pr-stock-warn { background: var(--warn-dim);   color: var(--warn);   border: 1px solid rgba(217,119,6,0.20); }
  .pr-stock-bad  { background: var(--danger-dim); color: var(--danger); border: 1px solid var(--danger-mid); }

  /* List View */
  .pr-list-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden; box-shadow: var(--shadow);
  }
  .pr-list-head {
    display: grid;
    grid-template-columns: 46px 1fr 140px 110px 110px 90px 80px;
    padding: 9px 16px; gap: 12px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  .pr-list-head span {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--ink-3);
  }
  .pr-list-row {
    display: grid;
    grid-template-columns: 46px 1fr 140px 110px 110px 90px 80px;
    align-items: center; padding: 10px 16px; gap: 12px;
    border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background 0.12s;
    animation: pr-up 0.28s ease both;
  }
  .pr-list-row:last-child { border-bottom: none; }
  .pr-list-row:hover { background: var(--surface-2); }
  .pr-list-thumb {
    width: 40px; height: 40px; border-radius: 9px;
    background: var(--surface-2); border: 1px solid var(--border);
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pr-list-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .pr-list-name { font-size: 13px; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pr-list-sub { font-size: 11px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pr-list-cell { font-size: 12px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pr-cat-chip {
    display: inline-block; font-size: 10px; font-weight: 600;
    color: var(--accent); background: var(--accent-dim);
    border: 1px solid var(--accent-mid);
    padding: 2px 8px; border-radius: 100px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
  }
  .pr-date-cell { font-size: 11px; color: var(--ink-3); font-family: 'JetBrains Mono', monospace; }

  /* Empty */
  .pr-empty {
    text-align: center; padding: 64px 0;
    background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius);
  }
  .pr-empty-icon { font-size: 34px; color: var(--ink-4); margin-bottom: 10px; opacity: 0.4; }
  .pr-empty-title { font-size: 14px; font-weight: 600; color: var(--ink-3); margin-bottom: 4px; }
  .pr-empty-sub { font-size: 12px; color: var(--ink-4); }

  /* Skeleton */
  .pr-skel {
    background: linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%);
    background-size: 200% 100%; animation: pr-shimmer 1.5s infinite; border-radius: 8px;
  }

  /* Buttons */
  .pr-btn {
    display: inline-flex; align-items: center; gap: 7px;
    border: none; border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .pr-btn-primary { background: var(--ink); color: #fff; }
  .pr-btn-primary:hover { background: #222; transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .pr-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .pr-btn-ghost { background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--border); }
  .pr-btn-ghost:hover { background: var(--surface-3); }
  .pr-btn-danger { background: var(--danger); color: #fff; }
  .pr-btn-danger:hover { background: #c42222; }
  .pr-btn-danger-outline {
    background: var(--danger-dim); color: var(--danger);
    border: 1px solid var(--danger-mid);
  }
  .pr-btn-danger-outline:hover { background: rgba(229,53,53,0.18); }

  /* Modal */
  .pr-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,10,0.55); backdrop-filter: blur(4px);
    z-index: 1000; display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: pr-fade 0.18s ease;
  }
  .pr-modal {
    background: var(--surface); border-radius: 18px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    animation: pr-scale 0.22s ease; overflow: hidden; width: 100%;
  }
  .pr-modal-head {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .pr-modal-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px; font-weight: 800;
    color: var(--ink); margin: 0; letter-spacing: -0.01em;
  }
  .pr-modal-body { padding: 20px 22px 24px; }
  .pr-modal-foot {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 16px 22px; border-top: 1px solid var(--border);
    background: var(--surface-2);
  }

  /* Form */
  .pr-form { display: flex; flex-direction: column; gap: 10px; }
  .pr-section-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase; color: var(--ink-3); margin: 4px 0 2px;
  }
  .pr-divider { border: none; border-top: 1px solid var(--border); margin: 4px 0; }
  .pr-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pr-3col { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; }

  /* Detail grid */
  .pr-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .pr-detail-cell {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px 12px;
  }
  .pr-detail-cell-label {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--ink-3); margin-bottom: 3px;
  }
  .pr-detail-cell-val { font-size: 13px; font-weight: 600; color: var(--ink); }

  /* Price hero */
  .pr-price-hero {
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px 16px;
    margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;
  }
  .pr-price-big {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px; font-weight: 700; color: var(--ink);
    letter-spacing: -0.02em;
  }

  /* Toast */
  .pr-toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 2000;
    background: var(--ink); border-radius: 12px; padding: 12px 16px;
    color: #fff; font-size: 13px; font-family: 'Instrument Sans', sans-serif;
    display: flex; align-items: center; gap: 10px;
    animation: pr-up 0.28s ease;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25); max-width: 300px;
  }

  /* Count row */
  .pr-count { font-size: 12px; color: var(--ink-3); margin: 0 0 12px; }
  .pr-count strong { color: var(--accent); }
`

const Skel = ({ w, h, r = 8 }) => (
  <div className="pr-skel" style={{ width: w || '100%', height: h || 18, borderRadius: r }} />
)

export default function Productos() {
  const [productos, setProductos]             = useState([])
  const [categorias, setCategorias]           = useState([])
  const [laboratorios, setLaboratorios]       = useState([])
  const [presentaciones, setPresentaciones]   = useState([])
  const [unidades, setUnidades]               = useState([])
  const [monedas, setMonedas]                 = useState([])
  const [ventasPorProducto, setVentasPorProducto] = useState({})
  const [loading, setLoading]                 = useState(true)
  const [busqueda, setBusqueda]               = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas')
  const [rankFiltro, setRankFiltro]           = useState('todos')
  const [vistaLista, setVistaLista]           = useState(false)
  const [mostrarForm, setMostrarForm]         = useState(false)
  const [editando, setEditando]               = useState(null)
  const [imagenFile, setImagenFile]           = useState(null)
  const [imagenPreview, setImagenPreview]     = useState(null)
  const [uploading, setUploading]             = useState(false)
  const [toast, setToast]                     = useState(null)
  const [confirmDelete, setConfirmDelete]     = useState(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  const [form, setForm] = useState({
    nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '',
    id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20,
    fecha_vencimiento: '', precio_venta: '', id_unidad: '', id_moneda: '1', imagen_url: ''
  })

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [{ data: prod }, { data: cat }, { data: lab }, { data: pres }, { data: uni }, { data: mon }, { data: det }] = await Promise.all([
        supabase.from('Productos').select('*, Laboratorios(*), Categorias(*), Presentaciones(*), Productos_Precios(*, Unidades_Medida(*), Monedas(*))').eq('estado', true).order('nombre_comercial'),
        supabase.from('Categorias').select('*'),
        supabase.from('Laboratorios').select('*').eq('estado', true),
        supabase.from('Presentaciones').select('*'),
        supabase.from('Unidades_Medida').select('*'),
        supabase.from('Monedas').select('*'),
        supabase.from('Detalle_Ventas').select('id_producto,cantidad'),
      ])
      setProductos(prod || []); setCategorias(cat || []); setLaboratorios(lab || [])
      setPresentaciones(pres || []); setUnidades(uni || []); setMonedas(mon || [])
      const ventasMap = {}
      ;(det || []).forEach(item => {
        const id = item.id_producto
        if (!id) return
        ventasMap[id] = (ventasMap[id] || 0) + Number(item.cantidad || 0)
      })
      setVentasPorProducto(ventasMap)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const subirImagen = async (file) => {
    if (!file) return null
    setUploading(true)
    const fileName = `producto_${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error } = await supabase.storage.from('productos').upload(fileName, file)
    setUploading(false)
    if (error) { setToast({ tipo: 'error', mensaje: 'Error al subir imagen' }); return null }
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre_comercial || !form.id_laboratorio || !form.id_categoria || !form.id_presentacion) {
      setToast({ tipo: 'error', mensaje: 'Completa los campos obligatorios' }); return
    }
    try {
      let imagenUrl = form.imagen_url
      if (imagenFile) { const url = await subirImagen(imagenFile); if (url) imagenUrl = url }
      if (editando) {
        await supabase.from('Productos').update({ ...form, imagen_url: imagenUrl }).eq('id_producto', editando)
        setToast({ tipo: 'success', mensaje: 'Producto actualizado correctamente' })
      } else {
        const { data: prod } = await supabase.from('Productos').insert({ ...form, imagen_url: imagenUrl }).select('id_producto').single()
        if (form.precio_venta && form.id_unidad) {
          await supabase.from('Productos_Precios').insert({ id_producto: prod.id_producto, id_unidad: form.id_unidad, cantidad_equivalente: 1, precio_venta: form.precio_venta, id_moneda: form.id_moneda })
        }
        setToast({ tipo: 'success', mensaje: 'Producto creado correctamente' })
      }
      setMostrarForm(false); setEditando(null); setImagenFile(null); setImagenPreview(null)
      setForm({ nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '', id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20, fecha_vencimiento: '', precio_venta: '', id_unidad: '', id_moneda: '1', imagen_url: '' })
      cargarDatos()
    } catch (e) { setToast({ tipo: 'error', mensaje: 'Error: ' + e.message }) }
  }

  const handleEditar = (p) => {
    setEditando(p.id_producto)
    const precio = p.Productos_Precios?.[0]
    setForm({
      nombre_comercial: p.nombre_comercial, principio_activo: p.principio_activo || '',
      id_laboratorio: p.id_laboratorio, id_categoria: p.id_categoria, id_presentacion: p.id_presentacion,
      stock_actual_unidades: p.stock_actual_unidades, stock_minimo_unidades: p.stock_minimo_unidades,
      fecha_vencimiento: p.fecha_vencimiento || '', precio_venta: precio?.precio_venta || '',
      id_unidad: precio?.id_unidad || '', id_moneda: precio?.id_moneda || '1', imagen_url: p.imagen_url || ''
    })
    setImagenPreview(p.imagen_url || null); setImagenFile(null); setProductoSeleccionado(null); setMostrarForm(true)
  }

  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    await supabase.from('Productos').update({ estado: false }).eq('id_producto', confirmDelete)
    setToast({ tipo: 'success', mensaje: 'Producto eliminado del catálogo' })
    setConfirmDelete(null); setProductoSeleccionado(null); cargarDatos()
  }

  const rankingSize = Math.max(1, Math.ceil(productos.length * 0.3))
  const sortedStock = [...productos].sort((a, b) => b.stock_actual_unidades - a.stock_actual_unidades)
  const masStock    = sortedStock.slice(0, rankingSize).map(p => p.id_producto)
  const menosStock  = sortedStock.slice(-rankingSize).map(p => p.id_producto)
  const sortedVentas  = [...productos].sort((a, b) => (ventasPorProducto[b.id_producto] || 0) - (ventasPorProducto[a.id_producto] || 0))
  const masVendidos   = sortedVentas.filter(p => (ventasPorProducto[p.id_producto] || 0) > 0).slice(0, rankingSize).map(p => p.id_producto)
  const menosVendidos = sortedVentas.slice(-rankingSize).map(p => p.id_producto)
  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.Categorias?.nombre_categoria).filter(Boolean))]

  const filtrados = productos.filter(p => {
    const matchB = !busqueda || p.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) || p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(busqueda.toLowerCase()) || p.principio_activo?.toLowerCase().includes(busqueda.toLowerCase())
    const matchC = categoriaFiltro === 'Todas' || p.Categorias?.nombre_categoria === categoriaFiltro
    const matchR =
      rankFiltro === 'todos' ||
      (rankFiltro === 'stock-mas'    && masStock.includes(p.id_producto)) ||
      (rankFiltro === 'stock-menos'  && menosStock.includes(p.id_producto)) ||
      (rankFiltro === 'ventas-mas'   && masVendidos.includes(p.id_producto)) ||
      (rankFiltro === 'ventas-menos' && menosVendidos.includes(p.id_producto))
    return matchB && matchC && matchR
  })

  const agotados   = productos.filter(p => p.stock_actual_unidades <= 0).length
  const bajoStock  = productos.filter(p => p.stock_actual_unidades > 0 && p.stock_actual_unidades <= p.stock_minimo_unidades).length
  const totalValor = productos.reduce((acc, p) => acc + (p.Productos_Precios?.[0]?.precio_venta || 0) * p.stock_actual_unidades, 0)

  const stockClass = (p) => p.stock_actual_unidades <= 0 ? 'pr-stock-bad' : p.stock_actual_unidades <= p.stock_minimo_unidades ? 'pr-stock-warn' : 'pr-stock-ok'
  const stockText  = (p) => p.stock_actual_unidades <= 0 ? 'Agotado' : `${p.stock_actual_unidades} u.`
  const rankInfo = {
    'stock-mas':    { label: 'Mayor stock',     color: 'var(--accent)' },
    'stock-menos':  { label: 'Menor stock',     color: 'var(--danger)' },
    'ventas-mas':   { label: 'Más vendidos',    color: 'var(--info)'   },
    'ventas-menos': { label: 'Menos vendidos',  color: 'var(--warn)'   },
  }[rankFiltro]

  if (loading) return (
    <div className="pr-root">
      <style>{styles}</style>
      <div className="pr-header">
        <div><Skel w={220} h={30} /><div style={{ marginTop: 8 }}><Skel w={160} h={14} /></div></div>
        <Skel w={140} h={38} r={8} />
      </div>
      <div className="pr-stats">
        {[1,2,3,4].map(i => <div key={i} className="pr-stat"><Skel h={70} /></div>)}
      </div>
      <div className="pr-grid">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden' }}>
            <Skel h={160} r={0} />
            <div style={{ padding: 14 }}><Skel w="65%" h={14} /><div style={{ marginTop: 6 }}><Skel w="45%" h={11} /></div></div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="pr-root">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="pr-header">
        <div>
          <div className="pr-badge"><div className="pr-badge-dot" />Catálogo</div>
          <h1 className="pr-title">Productos</h1>
          <p className="pr-subtitle">{productos.length} productos registrados</p>
        </div>
        <button className="pr-btn pr-btn-primary" onClick={() => { setEditando(null); setImagenPreview(null); setImagenFile(null); setMostrarForm(true) }}>
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> Nuevo producto
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="pr-stats">
        {[
          { label: 'Total productos', value: productos.length,        icon: 'ti-pill',            color: 'var(--accent)', bg: 'var(--accent-dim)' },
          { label: 'Valor en stock',  value: `S/ ${totalValor.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`, icon: 'ti-currency-sol', color: 'var(--info)',   bg: 'var(--info-dim)'   },
          { label: 'Bajo stock',      value: bajoStock,               icon: 'ti-alert-triangle',  color: 'var(--warn)',   bg: 'var(--warn-dim)'   },
          { label: 'Agotados',        value: agotados,                icon: 'ti-ban',             color: 'var(--danger)', bg: 'var(--danger-dim)' },
        ].map((s, i) => (
          <div className="pr-stat" key={i}>
            <div className="pr-stat-top">
              <span className="pr-stat-label">{s.label}</span>
              <div className="pr-stat-icon" style={{ background: s.bg }}>
                <i className={`ti ${s.icon}`} style={{ color: s.color }} />
              </div>
            </div>
            <div className="pr-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR (una sola fila) ── */}
      <div className="pr-filterbar">

        {/* Búsqueda */}
        <div className="pr-search-wrap">
          <i className="ti ti-search pr-search-icon" />
          <input
            className="pr-input"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>

        {/* Pills de categoría */}
        <div className="pr-cat-pills">
          {categoriasUnicas.map(c => (
            <button key={c} className={`pr-pill ${categoriaFiltro === c ? 'active' : ''}`} onClick={() => setCategoriaFiltro(c)}>{c}</button>
          ))}
        </div>

        {/* Separador visual */}
        <div className="pr-sep" />

        {/* Botones de ranking — todos en una fila */}
        <div className="pr-rank-group">
          <button className={`pr-rank-btn ${rankFiltro === 'stock-mas'    ? 'pr-rank-top'      : ''}`} onClick={() => setRankFiltro(r => r === 'stock-mas'    ? 'todos' : 'stock-mas')}>
            <i className="ti ti-trending-up"   style={{ fontSize: 11 }} /> Más stock
          </button>
          <button className={`pr-rank-btn ${rankFiltro === 'stock-menos'  ? 'pr-rank-low'      : ''}`} onClick={() => setRankFiltro(r => r === 'stock-menos'  ? 'todos' : 'stock-menos')}>
            <i className="ti ti-trending-down" style={{ fontSize: 11 }} /> Menos stock
          </button>
          <button className={`pr-rank-btn ${rankFiltro === 'ventas-mas'   ? 'pr-rank-sale-top' : ''}`} onClick={() => setRankFiltro(r => r === 'ventas-mas'   ? 'todos' : 'ventas-mas')}>
            <i className="ti ti-chart-bar"     style={{ fontSize: 11 }} /> Más vendidos
          </button>
          <button className={`pr-rank-btn ${rankFiltro === 'ventas-menos' ? 'pr-rank-sale-low' : ''}`} onClick={() => setRankFiltro(r => r === 'ventas-menos' ? 'todos' : 'ventas-menos')}>
            <i className="ti ti-chart-bar-off" style={{ fontSize: 11 }} /> Menos vendidos
          </button>
        </div>

        {/* Separador + botones de vista */}
        <div className="pr-sep" />
        <div className="pr-view-group">
          <button className={`pr-view-btn ${!vistaLista ? 'active' : ''}`} onClick={() => setVistaLista(false)} title="Tarjetas"><i className="ti ti-layout-grid" /></button>
          <button className={`pr-view-btn ${ vistaLista ? 'active' : ''}`} onClick={() => setVistaLista(true)}  title="Lista"><i className="ti ti-layout-list" /></button>
        </div>

      </div>

      <p className="pr-count">
        Mostrando <strong>{filtrados.length}</strong> de {productos.length} productos
        {rankInfo && <span style={{ color: rankInfo.color, marginLeft: 6 }}>· {rankInfo.label}</span>}
      </p>

      {/* EMPTY */}
      {filtrados.length === 0 && (
        <div className="pr-empty">
          <div className="pr-empty-icon"><i className="ti ti-pill" /></div>
          <div className="pr-empty-title">No se encontraron productos</div>
          <div className="pr-empty-sub">Intenta con otros filtros</div>
        </div>
      )}

      {/* GRID */}
      {!vistaLista && filtrados.length > 0 && (
        <div className="pr-grid">
          {filtrados.map((p, i) => {
            const precio    = p.Productos_Precios?.[0]
            const precioVal = precio?.precio_venta
            const esMasStock     = masStock.includes(p.id_producto)
            const esMenosStock   = menosStock.includes(p.id_producto)
            const esMasVendido   = masVendidos.includes(p.id_producto)
            const esMenosVendido = menosVendidos.includes(p.id_producto)
            const ventasProducto = ventasPorProducto[p.id_producto] || 0
            return (
              <div key={p.id_producto} className="pr-card" style={{ animationDelay: `${Math.min(i * 0.04, 0.32)}s` }} onClick={() => setProductoSeleccionado(p)}>
                <div className="pr-card-img">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={p.nombre_comercial} />
                    : <i className="ti ti-pill" style={{ fontSize: 36, color: 'var(--ink-4)' }} />
                  }
                  <div className="pr-rank-tags">
                    {esMasVendido  && <span className="pr-rank-tag pr-rank-tag-sale">Top ventas</span>}
                    {esMenosVendido && !esMasVendido  && <span className="pr-rank-tag pr-rank-tag-sale-low">Menos vendido</span>}
                    {esMasStock    && <span className="pr-rank-tag pr-rank-tag-top">Top stock</span>}
                    {esMenosStock  && !esMasStock     && <span className="pr-rank-tag pr-rank-tag-low">Bajo stock</span>}
                  </div>
                </div>
                <div className="pr-card-body">
                  <div className="pr-card-lab">
                    <div className="pr-card-lab-dot">
                      <i className="ti ti-building-store" style={{ fontSize: 9, color: 'var(--accent)' }} />
                    </div>
                    <span>{p.Laboratorios?.nombre_laboratorio || '—'}</span>
                  </div>
                  {p.Presentaciones?.nombre_presentacion && (
                    <div className="pr-card-pres">{p.Presentaciones.nombre_presentacion}</div>
                  )}
                  <div className="pr-card-name">{p.nombre_comercial}</div>
                  <div className="pr-card-sub">{p.principio_activo || p.Categorias?.nombre_categoria || '—'} · {ventasProducto} vendidos</div>
                  <div className="pr-card-foot">
                    {precioVal
                      ? <span className="pr-card-price">S/ {precioVal.toFixed(2)}</span>
                      : <span className="pr-card-price-none">—</span>
                    }
                    <span className={`pr-stock ${stockClass(p)}`}>{stockText(p)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LIST */}
      {vistaLista && filtrados.length > 0 && (
        <div className="pr-list-wrap">
          <div className="pr-list-head">
            {['', 'Producto', 'Laboratorio', 'Categoría', 'Precio', 'Stock', 'Vence'].map((h, i) => (
              <span key={i}>{h}</span>
            ))}
          </div>
          {filtrados.map((p, i) => {
            const precio    = p.Productos_Precios?.[0]
            const precioVal = precio?.precio_venta
            const esMasStock     = masStock.includes(p.id_producto)
            const esMenosStock   = menosStock.includes(p.id_producto)
            const esMasVendido   = masVendidos.includes(p.id_producto)
            const esMenosVendido = menosVendidos.includes(p.id_producto)
            const ventasProducto = ventasPorProducto[p.id_producto] || 0
            const vence = p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
            return (
              <div key={p.id_producto} className="pr-list-row" style={{ animationDelay: `${Math.min(i * 0.02, 0.22)}s` }} onClick={() => setProductoSeleccionado(p)}>
                <div className="pr-list-thumb">
                  {p.imagen_url ? <img src={p.imagen_url} alt="" /> : <i className="ti ti-pill" style={{ fontSize: 15, color: 'var(--ink-4)' }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="pr-list-name">{p.nombre_comercial}</div>
                    {esMasVendido   && <span style={{ fontSize: 9, color: 'var(--info)',   background: 'var(--info-dim)',   padding: '1px 6px', borderRadius: 100, flexShrink: 0, fontWeight: 700 }}>Top ventas</span>}
                    {esMenosVendido && !esMasVendido  && <span style={{ fontSize: 9, color: 'var(--warn)',   background: 'var(--warn-dim)',   padding: '1px 6px', borderRadius: 100, flexShrink: 0, fontWeight: 700 }}>Menos vendido</span>}
                    {esMasStock     && <span style={{ fontSize: 9, color: '#059652',        background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: 100, flexShrink: 0, fontWeight: 700 }}>Stock alto</span>}
                    {esMenosStock   && !esMasStock    && <span style={{ fontSize: 9, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '1px 6px', borderRadius: 100, flexShrink: 0, fontWeight: 700 }}>Stock bajo</span>}
                  </div>
                  <div className="pr-list-sub">{p.principio_activo || '—'} · {ventasProducto} vendidos</div>
                </div>
                <div className="pr-list-cell">{p.Laboratorios?.nombre_laboratorio || '—'}</div>
                <div><span className="pr-cat-chip">{p.Categorias?.nombre_categoria || '—'}</span></div>
                <div>
                  {precioVal
                    ? <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>S/ {precioVal.toFixed(2)}</span>
                    : <span style={{ color: 'var(--ink-4)' }}>—</span>
                  }
                </div>
                <span className={`pr-stock ${stockClass(p)}`}>{stockText(p)}</span>
                <span className="pr-date-cell">{vence}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DETALLE */}
      {productoSeleccionado && (() => {
        const p = productoSeleccionado
        const precio    = p.Productos_Precios?.[0]
        const precioVal = precio?.precio_venta
        return (
          <div className="pr-overlay" onClick={() => setProductoSeleccionado(null)}>
            <div className="pr-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '100%', height: 180, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', borderBottom: '1px solid var(--border)' }}>
                {p.imagen_url
                  ? <img src={p.imagen_url} alt={p.nombre_comercial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className="ti ti-pill" style={{ fontSize: 52, color: 'var(--ink-4)' }} />
                }
              </div>
              <div className="pr-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {p.Categorias?.nombre_categoria && <span className="pr-cat-chip">{p.Categorias.nombre_categoria}</span>}
                  {p.Presentaciones?.nombre_presentacion && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.Presentaciones.nombre_presentacion}</span>}
                </div>
                <h2 style={{ margin: '0 0 3px', fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.nombre_comercial}</h2>
                <p style={{ margin: '0 0 16px', color: 'var(--ink-3)', fontSize: 13 }}>{p.principio_activo || 'Sin principio activo'}</p>

                <div className="pr-detail-grid">
                  {[
                    { label: 'Laboratorio',  val: p.Laboratorios?.nombre_laboratorio },
                    { label: 'Presentación', val: p.Presentaciones?.nombre_presentacion },
                    { label: 'Stock actual', val: `${p.stock_actual_unidades} unidades`, accent: true },
                    { label: 'Stock mínimo', val: `${p.stock_minimo_unidades} u.` },
                    { label: 'Vencimiento',  val: p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') : '—' },
                    { label: 'Unidad',       val: precio?.Unidades_Medida?.nombre_unidad || '—' },
                  ].map((row, i) => (
                    <div key={i} className="pr-detail-cell">
                      <div className="pr-detail-cell-label">{row.label}</div>
                      <div className="pr-detail-cell-val" style={{ color: row.accent ? 'var(--accent)' : 'var(--ink)' }}>{row.val || '—'}</div>
                    </div>
                  ))}
                </div>

                {precioVal && (
                  <div className="pr-price-hero">
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Precio de venta</div>
                      <div className="pr-price-big">S/ {precioVal.toFixed(2)}</div>
                    </div>
                    <span className={`pr-stock ${stockClass(p)}`}>{stockText(p)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="pr-btn pr-btn-ghost" onClick={() => setProductoSeleccionado(null)}><i className="ti ti-x" style={{ fontSize: 13 }} /> Cerrar</button>
                  <button className="pr-btn pr-btn-ghost" onClick={() => handleEditar(p)}><i className="ti ti-edit" style={{ fontSize: 13 }} /> Editar</button>
                  <button className="pr-btn pr-btn-danger-outline" onClick={() => { setConfirmDelete(p.id_producto); setProductoSeleccionado(null) }}><i className="ti ti-trash" style={{ fontSize: 13 }} /> Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="pr-overlay" onClick={() => setMostrarForm(false)}>
          <div className="pr-modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="pr-modal-head">
              <h3 className="pr-modal-title">{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button className="pr-btn pr-btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setMostrarForm(false)}>
                <i className="ti ti-x" style={{ fontSize: 14 }} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pr-modal-body pr-form">
                <p className="pr-section-label">Información general</p>
                <input className="pr-input" placeholder="Nombre comercial *" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} required />
                <input className="pr-input" placeholder="Principio activo" value={form.principio_activo} onChange={e => setForm({ ...form, principio_activo: e.target.value })} />
                <div className="pr-2col">
                  <select className="pr-input" value={form.id_laboratorio} onChange={e => setForm({ ...form, id_laboratorio: e.target.value })} required>
                    <option value="">Laboratorio *</option>
                    {laboratorios.map(l => <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre_laboratorio}</option>)}
                  </select>
                  <select className="pr-input" value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })} required>
                    <option value="">Categoría *</option>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                  </select>
                </div>
                <select className="pr-input" value={form.id_presentacion} onChange={e => setForm({ ...form, id_presentacion: e.target.value })} required>
                  <option value="">Presentación *</option>
                  {presentaciones.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre_presentacion}</option>)}
                </select>

                <hr className="pr-divider" />
                <p className="pr-section-label">Imagen del producto</p>
                {imagenPreview && <img src={imagenPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 10, border: '1px solid var(--border)', objectFit: 'cover' }} />}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)) } }} style={{ fontSize: 12, color: 'var(--ink-3)' }} />
                {uploading && <small style={{ color: 'var(--accent)' }}>Subiendo imagen...</small>}

                <hr className="pr-divider" />
                <p className="pr-section-label">Precio de venta</p>
                <div className="pr-3col">
                  <input type="number" step="0.01" min="0" placeholder="Precio" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} className="pr-input" />
                  <select className="pr-input" value={form.id_unidad} onChange={e => setForm({ ...form, id_unidad: e.target.value })}>
                    <option value="">Unidad</option>
                    {unidades.map(u => <option key={u.id_unidad} value={u.id_unidad}>{u.nombre_unidad}</option>)}
                  </select>
                  <select className="pr-input" value={form.id_moneda} onChange={e => setForm({ ...form, id_moneda: e.target.value })}>
                    {monedas.map(m => <option key={m.id_moneda} value={m.id_moneda}>{m.codigo_moneda}</option>)}
                  </select>
                </div>

                <hr className="pr-divider" />
                <p className="pr-section-label">Inventario</p>
                <div className="pr-2col">
                  <input type="number" placeholder="Stock actual" value={form.stock_actual_unidades} onChange={e => setForm({ ...form, stock_actual_unidades: parseInt(e.target.value) })} className="pr-input" required />
                  <input type="number" placeholder="Stock mínimo" value={form.stock_minimo_unidades} onChange={e => setForm({ ...form, stock_minimo_unidades: parseInt(e.target.value) })} className="pr-input" />
                </div>
                <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} className="pr-input" />
              </div>
              <div className="pr-modal-foot">
                <button type="button" className="pr-btn pr-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="pr-btn pr-btn-primary" disabled={uploading}>
                  {editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="pr-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="pr-modal" style={{ maxWidth: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="pr-modal-body">
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--danger-dim)', border: '1px solid var(--danger-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ti ti-trash" style={{ color: 'var(--danger)', fontSize: 22 }} />
              </div>
              <h3 style={{ color: 'var(--ink)', margin: '0 0 8px', fontSize: 17, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>¿Eliminar producto?</h3>
              <p style={{ color: 'var(--ink-3)', fontSize: 13, marginBottom: 22 }}>Esta acción desactivará el producto del catálogo.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="pr-btn pr-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button className="pr-btn pr-btn-danger" onClick={confirmarEliminar}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="pr-toast">
          <i className={`ti ${toast.tipo === 'success' ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ fontSize: 17, color: toast.tipo === 'success' ? 'var(--accent)' : '#f87171', flexShrink: 0 }} />
          {toast.mensaje}
        </div>
      )}
    </div>
  )
}