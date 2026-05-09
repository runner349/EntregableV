import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Skeleton = ({ width, height, radius = 12 }) => (
  <div style={{
    width: width || '100%', height: height || 20, borderRadius: radius,
    background: 'linear-gradient(90deg, #0A0A0A 25%, #111 50%, #0A0A0A 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
  }} />
)

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [laboratorios, setLaboratorios] = useState([])
  const [presentaciones, setPresentaciones] = useState([])
  const [unidades, setUnidades] = useState([])
  const [monedas, setMonedas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [erroresForm, setErroresForm] = useState({})

  const formInicial = {
    nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '',
    id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20,
    fecha_vencimiento: '', precio_venta: '', id_unidad: '1', id_moneda: '1', imagen_url: ''
  }

  const [form, setForm] = useState(formInicial)

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [{ data: prod }, { data: cat }, { data: lab }, { data: pres }, { data: uni }, { data: mon }] = await Promise.all([
        supabase.from('Productos').select('*, Laboratorios(*), Categorias(*), Presentaciones(*), Productos_Precios(*, Unidades_Medida(*), Monedas(*))').eq('estado', true).order('nombre_comercial'),
        supabase.from('Categorias').select('*'),
        supabase.from('Laboratorios').select('*').eq('estado', true),
        supabase.from('Presentaciones').select('*'),
        supabase.from('Unidades_Medida').select('*'),
        supabase.from('Monedas').select('*'),
      ])
      setProductos(prod || [])
      setCategorias(cat || [])
      setLaboratorios(lab || [])
      setPresentaciones(pres || [])
      setUnidades(uni || [])
      setMonedas(mon || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const subirImagen = async (file) => {
    if (!file) return null
    setUploading(true)
    const fileName = `producto_${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error } = await supabase.storage.from('productos').upload(fileName, file)
    setUploading(false)
    if (error) {
      setNotificacion({ tipo: 'error', mensaje: 'Error al subir imagen' })
      return null
    }
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  // ============================================
  // GUARDAR PRECIO — CORREGIDO
  // El select de Unidad ya no tiene placeholder vacío,
  // arranca en id_unidad='1' (Unidad). Por eso parseInt
  // siempre recibe un valor numérico válido.
  // ============================================
  const guardarPrecio = async (idProducto, precioVenta, idUnidad, idMoneda) => {
    const precio = parseFloat(precioVenta)
    if (isNaN(precio) || precio <= 0) return

    const unidad = parseInt(idUnidad) || 1   // siempre válido, por defecto 1 (Unidad)
    const moneda = parseInt(idMoneda) || 1   // siempre válido, por defecto 1 (PEN)

    try {
      // Buscar si ya existe un precio para este producto
      const { data: existente, error: errorBusqueda } = await supabase
        .from('Productos_Precios')
        .select('id_producto_precio')
        .eq('id_producto', idProducto)
        .maybeSingle()

      if (errorBusqueda) {
        console.error('Error buscando precio existente:', errorBusqueda)
        return
      }

      const payload = {
        precio_venta: precio,
        id_unidad: unidad,
        id_moneda: moneda,
        cantidad_equivalente: 1
      }

      if (existente) {
        const { error } = await supabase
          .from('Productos_Precios')
          .update(payload)
          .eq('id_producto_precio', existente.id_producto_precio)
        if (error) console.error('Error actualizando precio:', error)
      } else {
        const { error } = await supabase
          .from('Productos_Precios')
          .insert({ id_producto: idProducto, ...payload })
        if (error) console.error('Error insertando precio:', error)
      }
    } catch (e) {
      console.error('Error en guardarPrecio:', e)
    }
  }

  const validarForm = () => {
    const errores = {}
    if (!form.nombre_comercial.trim()) errores.nombre_comercial = 'Requerido'
    if (!form.id_laboratorio) errores.id_laboratorio = 'Requerido'
    if (!form.id_categoria) errores.id_categoria = 'Requerido'
    if (!form.id_presentacion) errores.id_presentacion = 'Requerido'
    // Precio: si se ingresó un valor, validar que sea positivo y que tenga unidad
    if (form.precio_venta !== '' && form.precio_venta !== null) {
      const p = parseFloat(form.precio_venta)
      if (isNaN(p) || p <= 0) errores.precio_venta = 'Precio debe ser mayor a 0'
    }
    setErroresForm(errores)
    return Object.keys(errores).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validarForm()) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' })
      return
    }

    try {
      let imagenUrl = form.imagen_url
      if (imagenFile) {
        const url = await subirImagen(imagenFile)
        if (url) imagenUrl = url
      }

      // Capturar valores de precio ANTES de cualquier operación async que pudiera alterar el estado
      const precioVenta = form.precio_venta
      const idUnidad = form.id_unidad
      const idMoneda = form.id_moneda

      const productoData = {
        nombre_comercial: form.nombre_comercial.trim(),
        principio_activo: form.principio_activo?.trim() || null,
        id_laboratorio: parseInt(form.id_laboratorio),
        id_categoria: parseInt(form.id_categoria),
        id_presentacion: parseInt(form.id_presentacion),
        stock_actual_unidades: parseInt(form.stock_actual_unidades) || 0,
        stock_minimo_unidades: parseInt(form.stock_minimo_unidades) || 20,
        fecha_vencimiento: form.fecha_vencimiento || null,
        imagen_url: imagenUrl || null,
      }

      if (editando) {
        const { error } = await supabase.from('Productos').update(productoData).eq('id_producto', editando)
        if (error) throw error
        await guardarPrecio(editando, precioVenta, idUnidad, idMoneda)
        setNotificacion({ tipo: 'success', mensaje: '✅ Producto actualizado correctamente' })
      } else {
        const { data: producto, error } = await supabase
          .from('Productos')
          .insert(productoData)
          .select('id_producto')
          .single()
        if (error) throw error
        if (producto?.id_producto) {
          await guardarPrecio(producto.id_producto, precioVenta, idUnidad, idMoneda)
        }
        setNotificacion({ tipo: 'success', mensaje: '✅ Producto creado correctamente' })
      }

      resetForm()
      cargarDatos()
    } catch (e) {
      console.error(e)
      setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + (e.message || 'Inténtalo de nuevo') })
    }
  }

  const resetForm = () => {
    setMostrarForm(false)
    setEditando(null)
    setImagenFile(null)
    setImagenPreview(null)
    setErroresForm({})
    setForm(formInicial)
  }

  const handleEditar = (p) => {
    setEditando(p.id_producto)
    const precio = p.Productos_Precios?.[0]
    setForm({
      nombre_comercial: p.nombre_comercial || '',
      principio_activo: p.principio_activo || '',
      id_laboratorio: p.id_laboratorio?.toString() || '',
      id_categoria: p.id_categoria?.toString() || '',
      id_presentacion: p.id_presentacion?.toString() || '',
      stock_actual_unidades: p.stock_actual_unidades ?? 0,
      stock_minimo_unidades: p.stock_minimo_unidades ?? 20,
      fecha_vencimiento: p.fecha_vencimiento || '',
      // BUG CORREGIDO: convertir a string para que el input controlled funcione correctamente
      precio_venta: precio?.precio_venta != null ? String(precio.precio_venta) : '',
      id_unidad: precio?.id_unidad != null ? String(precio.id_unidad) : '',
      id_moneda: precio?.id_moneda != null ? String(precio.id_moneda) : '1',
      imagen_url: p.imagen_url || ''
    })
    setImagenPreview(p.imagen_url || null)
    setImagenFile(null)
    setErroresForm({})
    setProductoSeleccionado(null)
    setMostrarForm(true)
  }

  const handleEliminar = (id) => setConfirmDelete(id)

  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    await supabase.from('Productos').update({ estado: false }).eq('id_producto', confirmDelete)
    setNotificacion({ tipo: 'success', mensaje: '🗑️ Producto desactivado' })
    setConfirmDelete(null)
    setProductoSeleccionado(null)
    cargarDatos()
  }

  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.Categorias?.nombre_categoria).filter(Boolean))]
  const filtrados = productos.filter(p => {
    const matchBusq = !busqueda ||
      p.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.principio_activo?.toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = categoria === 'Todas' || p.Categorias?.nombre_categoria === categoria
    return matchBusq && matchCat
  })

  const mostrarPrecio = (precio) => {
    if (!precio || precio.precio_venta === null || precio.precio_venta === undefined) return '—'
    const valor = Number(precio.precio_venta)
    if (isNaN(valor) || valor <= 0) return '—'
    return `S/ ${valor.toFixed(2)}`
  }

  const inputStyle = {
    width: '100%', background: '#050505', border: '1px solid #1A1A1A', borderRadius: 12,
    padding: '10px 14px', color: '#FFF', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none',
    boxSizing: 'border-box'
  }
  const inputErrorStyle = { ...inputStyle, border: '1px solid #EF4444' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const selectErrorStyle = { ...selectStyle, border: '1px solid #EF4444' }
  const dateInputStyle = { ...inputStyle, colorScheme: 'dark' }

  const ErrorMsg = ({ campo }) => erroresForm[campo]
    ? <small style={{ color: '#EF4444', fontSize: 11, marginTop: -8 }}>{erroresForm[campo]}</small>
    : null

  if (loading) {
    return (
      <div style={{ padding: 28, background: '#000', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <Skeleton width={200} height={36} />
            <div style={{ marginTop: 8 }}><Skeleton width={280} height={18} /></div>
          </div>
          <Skeleton width={150} height={42} radius={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 18, padding: 16 }}>
              <Skeleton height={180} radius={14} />
              <div style={{ marginTop: 12 }}>
                <Skeleton width="70%" height={18} />
                <div style={{ marginTop: 6 }}><Skeleton width="50%" height={14} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="fade-in">
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: '#FFF' }}>Catálogo de Productos</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{productos.length} productos en inventario</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setMostrarForm(true) }} style={{ padding: '11px 22px' }}>
          <i className="ti ti-plus" /> Nuevo producto
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <input
          placeholder="Buscar medicamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, maxWidth: 280 }}
        />
        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ ...selectStyle, maxWidth: 180 }}>
          {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {filtrados.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
            <i className="ti ti-pill" style={{ fontSize: 48, color: '#1A1A1A', display: 'block', marginBottom: 12 }} />
            <strong style={{ color: '#FFF', fontSize: 16 }}>No se encontraron productos</strong>
          </div>
        ) : filtrados.map((p, i) => {
          const precio = p.Productos_Precios?.[0]
          return (
            <div
              key={p.id_producto}
              onClick={() => setProductoSeleccionado(p)}
              style={{
                background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 18,
                overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: `fadeUp 0.4s ${0.05 + i * 0.04}s both`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.8)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = '#1A1A1A'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ width: '100%', height: 180, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {p.imagen_url
                  ? <img src={p.imagen_url} alt={p.nombre_comercial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ fontSize: 48, color: '#1A1A1A' }}>💊</div>
                }
              </div>
              <div style={{ padding: '14px 16px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {p.Categorias?.nombre_categoria || 'Sin categoría'}
                </span>
                <h3 style={{ margin: '6px 0', fontSize: 16, fontWeight: 700, color: '#FFF' }}>{p.nombre_comercial}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{p.principio_activo || p.Laboratorios?.nombre_laboratorio}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>
                    {mostrarPrecio(precio)}
                  </span>
                  <span className={`badge ${p.stock_actual_unidades <= 5 ? 'badge-danger' : p.stock_actual_unidades <= 20 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
                    {p.stock_actual_unidades <= 0 ? 'Agotado' : `${p.stock_actual_unidades} u.`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DETALLE PRODUCTO */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, padding: 0, maxHeight: '85vh', overflowY: 'auto' }}>
            {(() => {
              const p = productoSeleccionado
              const precio = p.Productos_Precios?.[0]
              return (
                <div>
                  <div style={{ width: '100%', height: 180, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre_comercial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 72, color: '#1A1A1A' }}>💊</span>
                    }
                  </div>
                  <div style={{ padding: 24 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase' }}>
                      {p.Categorias?.nombre_categoria}
                    </span>
                    <h2 style={{ color: '#FFF', fontSize: 22 }}>{p.nombre_comercial}</h2>
                    <p style={{ color: '#666' }}>{p.principio_activo || 'Sin principio activo'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, padding: 12, background: '#050505', borderRadius: 12, border: '1px solid #1A1A1A' }}>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Laboratorio</span><p style={{ color: '#FFF', margin: '4px 0 0' }}>{p.Laboratorios?.nombre_laboratorio}</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Presentación</span><p style={{ color: '#FFF', margin: '4px 0 0' }}>{p.Presentaciones?.nombre_presentacion}</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Stock actual</span><p style={{ color: '#22C55E', fontFamily: "'DM Mono', monospace", margin: '4px 0 0' }}>{p.stock_actual_unidades} u.</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Stock mínimo</span><p style={{ color: '#FFF', margin: '4px 0 0' }}>{p.stock_minimo_unidades} u.</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Vencimiento</span><p style={{ color: '#FFF', margin: '4px 0 0' }}>{p.fecha_vencimiento ? new Date(p.fecha_vencimiento + 'T00:00:00').toLocaleDateString() : '—'}</p></div>
                      <div>
                        <span style={{ color: '#666', fontSize: 11 }}>Precio</span>
                        <p style={{ color: '#22C55E', fontFamily: "'DM Mono', monospace", fontSize: 16, margin: '4px 0 0' }}>
                          {precio?.precio_venta
                            ? `S/ ${Number(precio.precio_venta).toFixed(2)}${precio.Unidades_Medida?.nombre_unidad ? ` / ${precio.Unidades_Medida.nombre_unidad}` : ''}`
                            : 'Sin precio'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                      <button className="btn btn-secondary" onClick={() => { setProductoSeleccionado(null); handleEditar(p) }}>
                        <i className="ti ti-edit" /> Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => handleEliminar(p.id_producto)}>
                        <i className="ti ti-trash" /> Eliminar
                      </button>
                      <button className="btn btn-secondary" onClick={() => setProductoSeleccionado(null)}>Cerrar</button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#FFF', fontSize: 20, marginBottom: 18 }}>
              {editando ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <input
                style={erroresForm.nombre_comercial ? inputErrorStyle : inputStyle}
                placeholder="Nombre comercial *"
                value={form.nombre_comercial}
                onChange={e => setForm({ ...form, nombre_comercial: e.target.value })}
              />
              <ErrorMsg campo="nombre_comercial" />

              <input
                style={inputStyle}
                placeholder="Principio activo"
                value={form.principio_activo}
                onChange={e => setForm({ ...form, principio_activo: e.target.value })}
              />

              <select
                style={erroresForm.id_laboratorio ? selectErrorStyle : selectStyle}
                value={form.id_laboratorio}
                onChange={e => setForm({ ...form, id_laboratorio: e.target.value })}
              >
                <option value="">Laboratorio *</option>
                {laboratorios.map(l => <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre_laboratorio}</option>)}
              </select>
              <ErrorMsg campo="id_laboratorio" />

              <select
                style={erroresForm.id_categoria ? selectErrorStyle : selectStyle}
                value={form.id_categoria}
                onChange={e => setForm({ ...form, id_categoria: e.target.value })}
              >
                <option value="">Categoría *</option>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
              <ErrorMsg campo="id_categoria" />

              <select
                style={erroresForm.id_presentacion ? selectErrorStyle : selectStyle}
                value={form.id_presentacion}
                onChange={e => setForm({ ...form, id_presentacion: e.target.value })}
              >
                <option value="">Presentación *</option>
                {presentaciones.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre_presentacion}</option>)}
              </select>
              <ErrorMsg campo="id_presentacion" />

              <hr style={{ borderColor: '#1A1A1A', margin: '4px 0' }} />
              <p style={{ color: '#22C55E', fontWeight: 700, margin: 0 }}>📷 Imagen</p>
              {imagenPreview && (
                <img src={imagenPreview} alt="Preview" style={{ maxHeight: 180, borderRadius: 10, objectFit: 'cover' }} />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files[0]
                  if (f) {
                    setImagenFile(f)
                    setImagenPreview(URL.createObjectURL(f))
                    setForm({ ...form, imagen_url: '' })
                  }
                }}
                style={{ color: '#666', fontSize: 12 }}
              />
              {uploading && <small style={{ color: '#22C55E' }}>Subiendo imagen...</small>}

              <hr style={{ borderColor: '#1A1A1A', margin: '4px 0' }} />
              <p style={{ color: '#22C55E', fontWeight: 700, margin: 0 }}>💰 Precio</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio de venta"
                  value={form.precio_venta}
                  onChange={e => setForm({ ...form, precio_venta: e.target.value })}
                  style={{ ...(erroresForm.precio_venta ? inputErrorStyle : inputStyle), flex: 2 }}
                />
                <select
                  style={{ ...selectStyle, flex: 1 }}
                  value={form.id_unidad}
                  onChange={e => setForm({ ...form, id_unidad: e.target.value })}
                >
                  {unidades.map(u => <option key={u.id_unidad} value={u.id_unidad}>{u.nombre_unidad}</option>)}
                </select>
                <select
                  style={{ ...selectStyle, flex: 1 }}
                  value={form.id_moneda}
                  onChange={e => setForm({ ...form, id_moneda: e.target.value })}
                >
                  {monedas.map(m => <option key={m.id_moneda} value={m.id_moneda}>{m.codigo_moneda}</option>)}
                </select>
              </div>
              <ErrorMsg campo="precio_venta" />

              <hr style={{ borderColor: '#1A1A1A', margin: '4px 0' }} />
              <p style={{ color: '#22C55E', fontWeight: 700, margin: 0 }}>📦 Inventario</p>
              <input
                type="number"
                placeholder="Stock actual"
                value={form.stock_actual_unidades}
                onChange={e => setForm({ ...form, stock_actual_unidades: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Stock mínimo"
                value={form.stock_minimo_unidades}
                onChange={e => setForm({ ...form, stock_minimo_unidades: e.target.value })}
                style={inputStyle}
              />
              <label style={{ color: '#666', fontSize: 11 }}>Fecha de vencimiento</label>
              <input
                type="date"
                value={form.fecha_vencimiento}
                onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                style={dateInputStyle}
              />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Subiendo...' : editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
            <h3 style={{ color: '#FFF' }}>¿Desactivar producto?</h3>
            <p style={{ color: '#666', fontSize: 13 }}>Se ocultará del catálogo pero no se borrará de la base de datos.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarEliminar}>Sí, desactivar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIÓN */}
      {notificacion && (
        <div className="modal-overlay" onClick={() => setNotificacion(null)}>
          <div className="modal-content" style={{ maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>
              {notificacion.tipo === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ color: '#FFF', fontSize: 15 }}>{notificacion.mensaje}</p>
            <button className="btn btn-primary" onClick={() => setNotificacion(null)} style={{ marginTop: 12 }}>
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}