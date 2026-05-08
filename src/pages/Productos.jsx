import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function stockBadge(stock) {
  if (stock <= 5) return <span className="badge badge-danger">{stock} u.</span>
  if (stock <= 20) return <span className="badge badge-warning">{stock} u.</span>
  return <span className="badge badge-success">{stock} u.</span>
}

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

  const [form, setForm] = useState({
    nombre_comercial: '',
    principio_activo: '',
    id_laboratorio: '',
    id_categoria: '',
    id_presentacion: '',
    stock_actual_unidades: 0,
    stock_minimo_unidades: 20,
    fecha_vencimiento: '',
    precio_venta: '',
    id_unidad: '',
    id_moneda: '1',
    imagen_url: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    const { data: prod } = await supabase
      .from('Productos')
      .select('*, Laboratorios(*), Categorias(*), Presentaciones(*), Productos_Precios(*, Unidades_Medida(*), Monedas(*))')
      .eq('estado', true)
      .order('nombre_comercial')

    setProductos(prod || [])

    const { data: cat } = await supabase.from('Categorias').select('*')
    setCategorias(cat || [])

    const { data: lab } = await supabase.from('Laboratorios').select('*').eq('estado', true)
    setLaboratorios(lab || [])

    const { data: pres } = await supabase.from('Presentaciones').select('*')
    setPresentaciones(pres || [])

    const { data: uni } = await supabase.from('Unidades_Medida').select('*')
    setUnidades(uni || [])

    const { data: mon } = await supabase.from('Monedas').select('*')
    setMonedas(mon || [])

    setLoading(false)
  }

  const subirImagen = async (file) => {
    if (!file) return null

    setUploading(true)
    const fileName = `producto_${Date.now()}_${file.name.replace(/\s/g, '_')}`
    
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(fileName, file)

    setUploading(false)

    if (error) {
      setNotificacion({ tipo: 'error', mensaje: 'Error al subir imagen: ' + error.message })
      return null
    }

    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagenFile(file)
      setImagenPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre_comercial || !form.id_laboratorio || !form.id_categoria || !form.id_presentacion) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' })
      return
    }

    try {
      let imagenUrl = form.imagen_url
      if (imagenFile) {
        const url = await subirImagen(imagenFile)
        if (url) imagenUrl = url
      }

      if (editando) {
        const { error } = await supabase
          .from('Productos')
          .update({
            nombre_comercial: form.nombre_comercial,
            principio_activo: form.principio_activo,
            id_laboratorio: form.id_laboratorio,
            id_categoria: form.id_categoria,
            id_presentacion: form.id_presentacion,
            stock_actual_unidades: form.stock_actual_unidades,
            stock_minimo_unidades: form.stock_minimo_unidades,
            fecha_vencimiento: form.fecha_vencimiento || null,
            imagen_url: imagenUrl
          })
          .eq('id_producto', editando)

        if (error) throw error

        if (form.precio_venta && form.id_unidad) {
          const { data: precioExistente } = await supabase
            .from('Productos_Precios')
            .select('id_producto_precio')
            .eq('id_producto', editando)
            .maybeSingle()

          if (precioExistente) {
            await supabase
              .from('Productos_Precios')
              .update({
                precio_venta: form.precio_venta,
                id_unidad: form.id_unidad,
                id_moneda: form.id_moneda
              })
              .eq('id_producto_precio', precioExistente.id_producto_precio)
          } else {
            await supabase
              .from('Productos_Precios')
              .insert({
                id_producto: editando,
                id_unidad: form.id_unidad,
                cantidad_equivalente: 1,
                precio_venta: form.precio_venta,
                id_moneda: form.id_moneda
              })
          }
        }

        setNotificacion({ tipo: 'success', mensaje: '✅ Producto actualizado correctamente' })
      } else {
        const { data: producto, error } = await supabase
          .from('Productos')
          .insert({
            nombre_comercial: form.nombre_comercial,
            principio_activo: form.principio_activo,
            id_laboratorio: form.id_laboratorio,
            id_categoria: form.id_categoria,
            id_presentacion: form.id_presentacion,
            stock_actual_unidades: form.stock_actual_unidades,
            stock_minimo_unidades: form.stock_minimo_unidades,
            fecha_vencimiento: form.fecha_vencimiento || null,
            imagen_url: imagenUrl
          })
          .select('id_producto')
          .single()

        if (error) throw error

        if (form.precio_venta && form.id_unidad) {
          await supabase
            .from('Productos_Precios')
            .insert({
              id_producto: producto.id_producto,
              id_unidad: form.id_unidad,
              cantidad_equivalente: 1,
              precio_venta: form.precio_venta,
              id_moneda: form.id_moneda
            })
        }

        setNotificacion({ tipo: 'success', mensaje: '✅ Producto creado correctamente' })
      }

      setMostrarForm(false)
      setEditando(null)
      setImagenFile(null)
      setImagenPreview(null)
      setForm({
        nombre_comercial: '',
        principio_activo: '',
        id_laboratorio: '',
        id_categoria: '',
        id_presentacion: '',
        stock_actual_unidades: 0,
        stock_minimo_unidades: 20,
        fecha_vencimiento: '',
        precio_venta: '',
        id_unidad: '',
        id_moneda: '1',
        imagen_url: ''
      })
      cargarDatos()
    } catch (error) {
      setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + error.message })
    }
  }

  const handleEditar = (p) => {
    setEditando(p.id_producto)
    const precio = p.Productos_Precios?.[0]
    setForm({
      nombre_comercial: p.nombre_comercial,
      principio_activo: p.principio_activo || '',
      id_laboratorio: p.id_laboratorio,
      id_categoria: p.id_categoria,
      id_presentacion: p.id_presentacion,
      stock_actual_unidades: p.stock_actual_unidades,
      stock_minimo_unidades: p.stock_minimo_unidades,
      fecha_vencimiento: p.fecha_vencimiento || '',
      precio_venta: precio?.precio_venta || '',
      id_unidad: precio?.id_unidad || '',
      id_moneda: precio?.id_moneda || '1',
      imagen_url: p.imagen_url || ''
    })
    setImagenPreview(p.imagen_url || null)
    setImagenFile(null)
    setMostrarForm(true)
  }

  const handleEliminar = (id) => {
    setConfirmDelete(id)
  }

  const confirmarEliminar = async () => {
    if (!confirmDelete) return

    const { error } = await supabase
      .from('Productos')
      .update({ estado: false })
      .eq('id_producto', confirmDelete)

    if (error) {
      setNotificacion({ tipo: 'error', mensaje: '❌ Error: ' + error.message })
    } else {
      setNotificacion({ tipo: 'success', mensaje: '🗑️ Producto eliminado correctamente' })
    }
    
    setConfirmDelete(null)
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

  if (loading) return <div style={{ padding: 30 }}>Cargando productos...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <input
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="Buscar medicamento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: 180 }}
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        >
          {categoriasUnicas.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => { setEditando(null); setImagenPreview(null); setImagenFile(null); setMostrarForm(true) }}>
          <i className="ti ti-plus" />
          Nuevo producto
        </button>
      </div>

      {/* Formulario Modal */}
      {mostrarForm && (
        <div className="modal-overlay" onClick={() => setMostrarForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>{editando ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="form-control" placeholder="Nombre comercial" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} required />
              <input className="form-control" placeholder="Principio activo" value={form.principio_activo} onChange={e => setForm({ ...form, principio_activo: e.target.value })} />

              <select className="form-control" value={form.id_laboratorio} onChange={e => setForm({ ...form, id_laboratorio: e.target.value })} required>
                <option value="">Seleccionar laboratorio</option>
                {laboratorios.map(l => <option key={l.id_laboratorio} value={l.id_laboratorio}>{l.nombre_laboratorio}</option>)}
              </select>

              <select className="form-control" value={form.id_categoria} onChange={e => setForm({ ...form, id_categoria: e.target.value })} required>
                <option value="">Seleccionar categoría</option>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>

              <select className="form-control" value={form.id_presentacion} onChange={e => setForm({ ...form, id_presentacion: e.target.value })} required>
                <option value="">Seleccionar presentación</option>
                {presentaciones.map(p => <option key={p.id_presentacion} value={p.id_presentacion}>{p.nombre_presentacion}</option>)}
              </select>

              {/* 📷 SECCIÓN DE IMAGEN */}
              <hr />
              <p style={{ fontWeight: 600, margin: 0 }}>📷 Imagen del producto</p>
              
              {imagenPreview && (
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <img 
                    src={imagenPreview} 
                    alt="Vista previa" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 200, 
                      borderRadius: 8, 
                      border: '1px solid #ddd',
                      objectFit: 'cover'
                    }} 
                  />
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImagenChange}
                style={{ fontSize: 14 }}
              />
              {uploading && <small style={{ color: '#235ebd' }}>Subiendo imagen...</small>}

              <hr />
              <p style={{ fontWeight: 600, margin: 0 }}>Precio de venta</p>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio de venta"
                  value={form.precio_venta}
                  onChange={e => setForm({ ...form, precio_venta: e.target.value })}
                  style={{ flex: 2 }}
                />
                <select className="form-control" value={form.id_unidad} onChange={e => setForm({ ...form, id_unidad: e.target.value })} style={{ flex: 1 }}>
                  <option value="">Seleccionar unidad</option>
                  {unidades.map(u => <option key={u.id_unidad} value={u.id_unidad}>{u.nombre_unidad}</option>)}
                </select>
                <select className="form-control" value={form.id_moneda} onChange={e => setForm({ ...form, id_moneda: e.target.value })} style={{ flex: 1 }}>
                  {monedas.map(m => <option key={m.id_moneda} value={m.id_moneda}>{m.codigo_moneda}</option>)}
                </select>
              </div>

              <hr />
              <p style={{ fontWeight: 600, margin: 0 }}>Inventario</p>

              <input className="form-control" type="number" placeholder="Stock actual" value={form.stock_actual_unidades} onChange={e => setForm({ ...form, stock_actual_unidades: parseInt(e.target.value) })} required />
              <input className="form-control" type="number" placeholder="Stock mínimo" value={form.stock_minimo_unidades} onChange={e => setForm({ ...form, stock_minimo_unidades: parseInt(e.target.value) })} />
              <input className="form-control" type="date" placeholder="Fecha vencimiento" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {editando ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {confirmDelete && (
        <div 
          onClick={() => setConfirmDelete(null)}
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
              maxWidth: 420,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 36
            }}>
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#333' }}>
              ¿Eliminar este producto?
            </h3>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
              Esta acción desactivará el producto del catálogo.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '10px 24px', fontSize: 15 }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminar}
                style={{ 
                  padding: '10px 24px', 
                  fontSize: 15,
                  background: '#e53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificación */}
      {notificacion && (
        <div 
          onClick={() => setNotificacion(null)}
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
              maxWidth: 420,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: notificacion.tipo === 'success' ? '#e8f5e9' : '#fce4ec',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 36
            }}>
              {notificacion.tipo === 'success' ? '✅' : '❌'}
            </div>

            <p style={{ 
              fontSize: 17, 
              color: '#333', 
              margin: '0 0 20px',
              fontWeight: 500
            }}>
              {notificacion.mensaje}
            </p>

            <button 
              className="btn btn-primary"
              onClick={() => setNotificacion(null)}
              style={{
                padding: '10px 32px',
                fontSize: 15
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre comercial</th>
              <th>Laboratorio</th>
              <th>Categoría</th>
              <th>Presentación</th>
              <th>Precio</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No hay productos</td></tr>
            ) : (
              filtrados.map(p => {
                const precio = p.Productos_Precios?.[0]
                return (
                  <tr key={p.id_producto}>
                    <td>
                      {p.imagen_url ? (
                        <img 
                          src={p.imagen_url} 
                          alt={p.nombre_comercial}
                          style={{ 
                            width: 50, 
                            height: 50, 
                            borderRadius: 6, 
                            objectFit: 'cover',
                            border: '1px solid #eee'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: 6, 
                          background: '#f0f4ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#235ebd',
                          fontSize: 20
                        }}>
                          💊
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.nombre_comercial}</td>
                    <td>{p.Laboratorios?.nombre_laboratorio}</td>
                    <td><span className="badge badge-info">{p.Categorias?.nombre_categoria}</span></td>
                    <td>{p.Presentaciones?.nombre_presentacion}</td>
                    <td style={{ fontWeight: 600 }}>
                      {precio ? `${precio.Monedas?.simbolo || 'S/'} ${precio.precio_venta?.toFixed(2)} / ${precio.Unidades_Medida?.nombre_unidad || 'Unidad'}` : 'Sin precio'}
                    </td>
                    <td>{stockBadge(p.stock_actual_unidades)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" title="Editar" onClick={() => handleEditar(p)}>
                          <i className="ti ti-edit" />
                        </button>
                        <button className="icon-btn danger" title="Eliminar" onClick={() => handleEliminar(p.id_producto)}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}