import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
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

  const [form, setForm] = useState({
    nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '',
    id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20,
    fecha_vencimiento: '', precio_venta: '', id_unidad: '', id_moneda: '1', imagen_url: ''
  })

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
      setProductos(prod || []); setCategorias(cat || []); setLaboratorios(lab || [])
      setPresentaciones(pres || []); setUnidades(uni || []); setMonedas(mon || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const subirImagen = async (file) => {
    if (!file) return null
    setUploading(true)
    const fileName = `producto_${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error } = await supabase.storage.from('productos').upload(fileName, file)
    setUploading(false)
    if (error) { setNotificacion({ tipo: 'error', mensaje: 'Error al subir imagen' }); return null }
    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre_comercial || !form.id_laboratorio || !form.id_categoria || !form.id_presentacion) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' }); return
    }
    try {
      let imagenUrl = form.imagen_url
      if (imagenFile) { const url = await subirImagen(imagenFile); if (url) imagenUrl = url }
      if (editando) {
        await supabase.from('Productos').update({ ...form, imagen_url: imagenUrl }).eq('id_producto', editando)
        setNotificacion({ tipo: 'success', mensaje: '✅ Producto actualizado' })
      } else {
        const { data: prod } = await supabase.from('Productos').insert({ ...form, imagen_url: imagenUrl }).select('id_producto').single()
        if (form.precio_venta && form.id_unidad) {
          await supabase.from('Productos_Precios').insert({ id_producto: prod.id_producto, id_unidad: form.id_unidad, cantidad_equivalente: 1, precio_venta: form.precio_venta, id_moneda: form.id_moneda })
        }
        setNotificacion({ tipo: 'success', mensaje: '✅ Producto creado' })
      }
      setMostrarForm(false); setEditando(null); setImagenFile(null); setImagenPreview(null)
      setForm({ nombre_comercial: '', principio_activo: '', id_laboratorio: '', id_categoria: '', id_presentacion: '', stock_actual_unidades: 0, stock_minimo_unidades: 20, fecha_vencimiento: '', precio_venta: '', id_unidad: '', id_moneda: '1', imagen_url: '' })
      cargarDatos()
    } catch (e) { setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + e.message }) }
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

  const handleEliminar = (id) => setConfirmDelete(id)

  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    await supabase.from('Productos').update({ estado: false }).eq('id_producto', confirmDelete)
    setNotificacion({ tipo: 'success', mensaje: '🗑️ Producto eliminado' })
    setConfirmDelete(null); setProductoSeleccionado(null); cargarDatos()
  }

  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.Categorias?.nombre_categoria).filter(Boolean))]
  const filtrados = productos.filter(p => {
    const matchBusq = !busqueda || p.nombre_comercial?.toLowerCase().includes(busqueda.toLowerCase()) || p.Laboratorios?.nombre_laboratorio?.toLowerCase().includes(busqueda.toLowerCase()) || p.principio_activo?.toLowerCase().includes(busqueda.toLowerCase())
    const matchCat = categoria === 'Todas' || p.Categorias?.nombre_categoria === categoria
    return matchBusq && matchCat
  })

  const inputStyle = { width: '100%', background: '#050505', border: '1px solid #1A1A1A', borderRadius: 12, padding: '10px 14px', color: '#FFF', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  if (loading) {
    return (
      <div style={{ padding: 28, background: '#000', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
          <div><Skeleton width={200} height={36} /><div style={{ marginTop: 8 }}><Skeleton width={280} height={18} /></div></div>
          <Skeleton width={150} height={42} radius={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 18, padding: 16 }}><Skeleton height={180} radius={14} /><div style={{ marginTop: 12 }}><Skeleton width="70%" height={18} /><div style={{ marginTop: 6 }}><Skeleton width="50%" height={14} /></div></div></div>)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0', background: '#000', color: '#FFF', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="fade-in">
          <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 800, color: '#FFF', letterSpacing: '-0.03em' }}>Catálogo de Productos</h1>
          <p style={{ margin: 0, color: '#666', fontSize: 13 }}>{productos.length} productos en inventario</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setImagenPreview(null); setImagenFile(null); setMostrarForm(true) }} style={{ padding: '11px 22px' }}>
          <i className="ti ti-plus" style={{ fontSize: 16 }} /> Nuevo producto
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <input placeholder="Buscar medicamento..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ ...inputStyle, maxWidth: 280 }} />
        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={{ ...selectStyle, maxWidth: 180 }}>
          {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* GRID DE TARJETAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {filtrados.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: '#666' }}>
            <i className="ti ti-pill" style={{ fontSize: 48, color: '#1A1A1A', display: 'block', marginBottom: 12 }} />
            <strong style={{ color: '#FFF', display: 'block', fontSize: 16 }}>No se encontraron productos</strong>
          </div>
        ) : filtrados.map((p, i) => {
          const precio = p.Productos_Precios?.[0]
          return (
            <div
              key={p.id_producto}
              onClick={() => setProductoSeleccionado(p)}
              style={{
                background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: 18, overflow: 'hidden',
                cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: `fadeUp 0.4s ${0.05 + i * 0.04}s both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.8)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Imagen */}
              <div style={{ width: '100%', height: 180, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre_comercial} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                ) : (
                  <div style={{ fontSize: 48, color: '#1A1A1A' }}>💊</div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {p.Categorias?.nombre_categoria || 'Sin categoría'}
                </span>
                <h3 style={{ margin: '6px 0', fontSize: 16, fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em' }}>
                  {p.nombre_comercial}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.principio_activo || p.Laboratorios?.nombre_laboratorio}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#22C55E', fontFamily: "'DM Mono', monospace" }}>
                    {precio ? `S/ ${precio.precio_venta?.toFixed(2)}` : '—'}
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

      {/* MODAL DETALLE DEL PRODUCTO */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 550, padding: 0, overflow: 'hidden', maxHeight: '85vh', overflowY: 'auto' }}>
            {(() => {
              const p = productoSeleccionado
              const precio = p.Productos_Precios?.[0]
              return (
                <div>
                  {/* Imagen grande */}
                  <div style={{ width: '100%', height: 180, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt={p.nombre_comercial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: 72, color: '#1A1A1A' }}>💊</div>
                    )}
                  </div>

                  {/* Detalles */}
                  <div style={{ padding: '24px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {p.Categorias?.nombre_categoria}
                    </span>
                    <h2 style={{ margin: '6px 0', fontSize: 22, fontWeight: 800, color: '#FFF' }}>{p.nombre_comercial}</h2>
                    <p style={{ color: '#666', fontSize: 13, margin: '4px 0' }}>{p.principio_activo || 'Sin principio activo'}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16, padding: '12px', background: '#050505', borderRadius: 12, border: '1px solid #1A1A1A' }}>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Laboratorio</span><p style={{ margin: '2px 0 0', color: '#FFF', fontWeight: 600 }}>{p.Laboratorios?.nombre_laboratorio}</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Presentación</span><p style={{ margin: '2px 0 0', color: '#FFF', fontWeight: 600 }}>{p.Presentaciones?.nombre_presentacion}</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Stock actual</span><p style={{ margin: '2px 0 0', color: '#22C55E', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{p.stock_actual_unidades} unidades</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Stock mínimo</span><p style={{ margin: '2px 0 0', color: '#FFF', fontWeight: 600 }}>{p.stock_minimo_unidades} u.</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Vencimiento</span><p style={{ margin: '2px 0 0', color: '#FFF', fontWeight: 600 }}>{p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : '—'}</p></div>
                      <div><span style={{ color: '#666', fontSize: 11 }}>Precio</span><p style={{ margin: '2px 0 0', color: '#22C55E', fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 16 }}>{precio ? `S/ ${precio.precio_venta?.toFixed(2)} / ${precio.Unidades_Medida?.nombre_unidad || 'Unidad'}` : 'Sin precio'}</p></div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                      <button className="btn btn-secondary" onClick={() => { setProductoSeleccionado(null); handleEditar(p) }}>
                        <i className="ti ti-edit" style={{ fontSize: 15 }} /> Editar
                      </button>
                      <button className="btn btn-danger" onClick={() => handleEliminar(p.id_producto)}>
                        <i className="ti ti-trash" style={{ fontSize: 15 }} /> Eliminar
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

      {/* MODAL FORMULARIO (CREAR/EDITAR) */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#FFF' }}>{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} placeholder="Nombre comercial" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} required />
              <input style={inputStyle} placeholder="Principio activo" value={form.principio_activo} onChange={e => setForm({ ...form, principio_activo: e.target.value })} />
              <select style={selectStyle} value={form.id_laboratorio} onChange={e => setForm({ ...form, id_laboratorio: e.target.value })} required>
                <option value="">Seleccionar laboratorio</option>
                {laboratorios.map(l => <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre_laboratorio}</option>)}
              </select>
              <select style={selectStyle} value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })} required>
                <option value="">Seleccionar categoría</option>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
              <select style={selectStyle} value={form.id_presentacion} onChange={e => setForm({ ...form, id_presentacion: e.target.value })} required>
                <option value="">Seleccionar presentación</option>
                {presentaciones.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre_presentacion}</option>)}
              </select>

              <hr style={{ border: 'none', borderTop: '1px solid #1A1A1A', margin: '4px 0' }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#22C55E' }}>📷 Imagen del producto</p>
              {imagenPreview && <img src={imagenPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: '1px solid #1A1A1A', objectFit: 'cover' }} />}
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImagenFile(f); setImagenPreview(URL.createObjectURL(f)) } }} style={{ color: '#666', fontSize: 12 }} />
              {uploading && <small style={{ color: '#22C55E' }}>Subiendo imagen...</small>}

              <hr style={{ border: 'none', borderTop: '1px solid #1A1A1A', margin: '4px 0' }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#22C55E' }}>Precio de venta</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" step="0.01" min="0" placeholder="Precio" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} style={{ ...inputStyle, flex: 2 }} />
                <select style={{ ...selectStyle, flex: 1 }} value={form.id_unidad} onChange={e => setForm({ ...form, id_unidad: e.target.value })}>
                  <option value="">Unidad</option>
                  {unidades.map(u => <option key={u.id_unidad} value={u.id_unidad}>{u.nombre_unidad}</option>)}
                </select>
                <select style={{ ...selectStyle, flex: 1 }} value={form.id_moneda} onChange={e => setForm({ ...form, id_moneda: e.target.value })}>
                  {monedas.map(m => <option key={m.id_moneda} value={m.id_moneda}>{m.codigo_moneda}</option>)}
                </select>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #1A1A1A', margin: '4px 0' }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#22C55E' }}>Inventario</p>
              <input type="number" placeholder="Stock actual" value={form.stock_actual_unidades} onChange={e => setForm({ ...form, stock_actual_unidades: parseInt(e.target.value) })} style={inputStyle} required />
              <input type="number" placeholder="Stock mínimo" value={form.stock_minimo_unidades} onChange={e => setForm({ ...form, stock_minimo_unidades: parseInt(e.target.value) })} style={inputStyle} />
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} style={inputStyle} />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>{editando ? 'Guardar cambios' : 'Crear producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>⚠️</div>
            <h3 style={{ color: '#FFF', margin: '0 0 6px' }}>¿Eliminar este producto?</h3>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>Esta acción desactivará el producto del catálogo.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarEliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFICACIÓN */}
      {notificacion && (
        <div className="modal-overlay" onClick={() => setNotificacion(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: notificacion.tipo === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>
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