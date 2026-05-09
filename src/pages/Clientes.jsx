import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── CONFIG ──────────────────────────────────────────────────────
const DOC_META = {
  RUC: { color: '#0EA5E9', label: 'RUC' },
  DNI: { color: '#16A34A', label: 'DNI' },
  CE:  { color: '#7C3AED', label: 'CE'  },
}

const AVATAR_GRADIENTS = [
  ['#34D399','#059669'],
  ['#22C55E','#0EA5E9'],
  ['#10B981','#14B8A6'],
  ['#60A5FA','#6366F1'],
  ['#A78BFA','#7C3AED'],
  ['#F59E0B','#F97316'],
]

// ── ESTILOS GLOBALES ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg:      #FFFFFF;
  --surface: #FFFFFF;
  --surf2:   #F8FAFC;
  --border:  #E2E8F0;
  --border2: #CBD5E1;
  --text:    #0F172A;
  --muted:   #94A3B8;
  --muted2:  #64748B;
  --accent:  #16A34A;
  --accent2: #0EA5E9;
  --danger:  #DC2626;
}

.cc * { box-sizing:border-box; margin:0; padding:0; }
.cc { font-family:'Bricolage Grotesque',system-ui,sans-serif; background:#FFFFFF; color:var(--text); min-height:calc(100vh - 56px); position:relative; overflow-x:hidden; border-radius:20px; }

.cc-glow,
.cc-glow2 { display:none; }

.cc-inner { position:relative; z-index:1; padding:4px 4px 28px; }

/* HEADER */
.cc-header { display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:22px; border:1px solid var(--border); border-radius:20px; background:#FFFFFF; padding:24px; box-shadow:0 16px 36px rgba(15,23,42,.07); }
.cc-header-main { display:flex; align-items:center; gap:16px; min-width:0; }
.cc-heading-icon { width:58px; height:58px; border-radius:18px; display:grid; place-items:center; color:#FFFFFF; background:linear-gradient(135deg,#16A34A,#059669); box-shadow:0 16px 28px rgba(22,163,74,.24); flex-shrink:0; }
.cc-heading-icon i { font-size:30px; }
.cc-title { font-family:'Bricolage Grotesque',system-ui,sans-serif; font-size:42px; line-height:.95; letter-spacing:-.04em; color:var(--accent); font-weight:900; }
.cc-title-sub { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted2); letter-spacing:.12em; text-transform:uppercase; margin-top:10px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.cc-header-tools { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.cc-count-pill { display:inline-flex; align-items:center; gap:8px; border:1px solid #BBF7D0; background:#F0FDF4; color:#15803D; border-radius:14px; padding:11px 14px; font-size:12px; font-weight:800; }
.cc-count-pill i { font-size:18px; }

/* BUTTONS */
.cc-btn { font-family:'Bricolage Grotesque',system-ui,sans-serif; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:9px; border:none; border-radius:13px; transition:all .2s ease; white-space:nowrap; }
.cc-btn i { font-size:18px; }
.cc-btn-accent  { background:var(--accent); color:#fff; padding:13px 22px; box-shadow:0 12px 24px rgba(22,163,74,.22); }
.cc-btn-accent:hover  { transform:translateY(-2px); box-shadow:0 14px 28px rgba(22,163,74,.25); }
.cc-btn-ghost   { background:#FFFFFF; color:var(--muted2); padding:11px 20px; border:1px solid var(--border); }
.cc-btn-ghost:hover   { background:#F8FAFC; color:var(--text); }
.cc-btn-danger  { background:var(--danger); color:#fff; padding:11px 20px; box-shadow:0 8px 18px rgba(220,38,38,.18); }
.cc-btn-danger:hover  { transform:translateY(-1px); box-shadow:0 12px 24px rgba(220,38,38,.25); }

/* SEARCH */
.cc-search-wrap { margin-bottom:18px; border:1px solid var(--border); border-radius:18px; background:#FFFFFF; padding:16px 18px; box-shadow:0 10px 24px rgba(15,23,42,.05); }
.cc-search-label { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:.12em; text-transform:uppercase; margin-bottom:8px; display:block; }
.cc-search-row { display:flex; align-items:center; gap:12px; }
.cc-search-icon { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; background:#F0FDF4; color:var(--accent); border:1px solid #BBF7D0; flex-shrink:0; }
.cc-search-icon i { font-size:21px; }
.cc-search { width:100%; max-width:620px; background:#F8FAFC; border:1px solid var(--border); border-radius:13px; color:var(--text); font-family:'Bricolage Grotesque',system-ui,sans-serif; font-size:15px; font-weight:600; padding:12px 14px; outline:none; transition:border-color .25s,box-shadow .25s,background .25s; }
.cc-search::placeholder { color:var(--muted); font-weight:400; }
.cc-search:focus { background:#FFFFFF; border-color:var(--accent); box-shadow:0 0 0 3px rgba(22,163,74,.12); }

/* LIST ROWS */
.cc-list { display:flex; flex-direction:column; gap:12px; }
.cc-row { display:grid; grid-template-columns:54px 50px 1fr auto; align-items:center; gap:18px; padding:17px 18px; border:1px solid var(--border); border-radius:18px; background:#FFFFFF; position:relative; transition:all .25s cubic-bezier(.16,1,.3,1); cursor:default; box-shadow:0 4px 16px rgba(15,23,42,.045); }
.cc-row::before { content:''; position:absolute; left:-1px; top:16px; bottom:16px; width:5px; background:var(--accent); opacity:.8; transition:opacity .25s; border-radius:999px; }
.cc-row:hover { transform:translateY(-3px); border-color:#86EFAC; box-shadow:0 18px 34px rgba(15,23,42,.09); }
.cc-row:hover::before { opacity:1; }

.cc-row-num { font-family:'Bebas Neue',system-ui,sans-serif; font-size:22px; color:var(--muted); transition:color .2s,font-size .2s; user-select:none; line-height:1; }
.cc-row:hover .cc-row-num { color:var(--accent); font-size:26px; }

.cc-avatar { width:46px; height:46px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',system-ui,sans-serif; font-weight:900; font-size:15px; color:#fff; flex-shrink:0; transition:transform .25s,box-shadow .25s; letter-spacing:.02em; }
.cc-row:hover .cc-avatar { transform:scale(1.08); }

.cc-name { font-size:15px; font-weight:700; color:var(--text); letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; transition:color .2s; }
.cc-row:hover .cc-name { color:#0F172A; }

.cc-meta { display:flex; gap:16px; flex-wrap:wrap; margin-top:5px; align-items:center; }
.cc-meta-item { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--muted2); display:flex; align-items:center; gap:6px; }
.cc-meta-item i { width:22px; height:22px; display:grid; place-items:center; border-radius:8px; background:#F0FDF4; color:#16A34A; border:1px solid #DCFCE7; font-size:13px; flex-shrink:0; }

.cc-doc-badge { font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; padding:3px 10px; border-radius:6px; border:1px solid currentColor; letter-spacing:.08em; flex-shrink:0; }

.cc-actions { display:flex; gap:8px; opacity:1; transform:none; transition:all .22s ease; flex-shrink:0; }

.cc-icon-btn { width:38px; height:38px; border-radius:12px; border:1px solid var(--border); background:#FFFFFF; color:var(--muted2); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .18s ease; font-size:17px; box-shadow:0 6px 16px rgba(15,23,42,.05); }
.cc-icon-btn.edit { color:#16A34A; background:#F0FDF4; border-color:#BBF7D0; }
.cc-icon-btn.del { color:#DC2626; background:#FEF2F2; border-color:#FECACA; }
.cc-icon-btn.edit:hover  { transform:translateY(-2px); border-color:#16A34A; color:#FFFFFF; background:#16A34A; }
.cc-icon-btn.del:hover   { transform:translateY(-2px); border-color:var(--danger); color:#FFFFFF; background:var(--danger); }

/* EMPTY */
.cc-empty { padding:70px 20px; text-align:center; border:1px dashed var(--border2); border-radius:20px; background:#F8FAFC; }
.cc-empty-title { font-family:'Bebas Neue',system-ui,sans-serif; font-size:28px; color:var(--muted2); letter-spacing:.04em; margin:16px 0 8px; }

/* OVERLAY / MODAL */
.cc-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:999; padding:20px; animation:cc-fade .2s ease; }
.cc-modal { background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:36px; width:100%; max-width:500px; box-shadow:0 30px 70px rgba(15,23,42,.18); animation:cc-scale .3s cubic-bezier(.16,1,.3,1); }
.cc-modal-icon { width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:20px; }
.cc-modal-title { font-family:'Bricolage Grotesque',system-ui,sans-serif; font-size:24px; letter-spacing:-.02em; color:var(--text); font-weight:800; margin-bottom:4px; }
.cc-modal-sub { font-size:13px; color:var(--muted2); margin-bottom:28px; }
.cc-divider { height:1px; background:var(--border); margin:24px 0; }

.cc-label { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--muted); letter-spacing:.12em; text-transform:uppercase; margin-bottom:7px; display:block; }
.cc-field { margin-bottom:18px; }
.cc-input { width:100%; background:var(--surf2); border:1px solid var(--border); border-radius:11px; padding:12px 16px; color:var(--text); font-family:'Bricolage Grotesque',system-ui,sans-serif; font-size:14px; outline:none; transition:border-color .2s,box-shadow .2s,background .2s; }
.cc-input::placeholder { color:var(--muted); }
.cc-input:focus { background:#FFFFFF; border-color:var(--accent); box-shadow:0 0 0 3px rgba(22,163,74,.12); }
.cc-select { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2316A34A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:38px; }
.cc-input option { background:#FFFFFF; }
.cc-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.cc-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:28px; }

/* TOAST */
.cc-toast { position:fixed; bottom:32px; left:40px; background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent); border-radius:14px; padding:14px 18px; display:flex; align-items:center; gap:14px; box-shadow:0 18px 42px rgba(15,23,42,.14); z-index:1001; max-width:340px; animation:cc-slide .32s cubic-bezier(.16,1,.3,1); cursor:pointer; }
.cc-toast.err { border-left-color:var(--danger); }

/* SKELETON */
.cc-skel { background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; border-radius:8px; animation:cc-shimmer 1.6s infinite; }

/* KEYFRAMES */
@keyframes cc-fade    { from{opacity:0} to{opacity:1} }
@keyframes cc-scale   { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes cc-slide   { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
@keyframes cc-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes cc-up      { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes cc-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

.cc-anim-up { animation:cc-up .4s ease both; }
.cc-pulse-dot { width:7px;height:7px;border-radius:50%;background:var(--accent);animation:cc-pulse 2s infinite;display:inline-block; box-shadow:0 0 0 4px rgba(22,163,74,.12); }
@media (max-width: 760px) {
  .cc-header { align-items:flex-start; flex-direction:column; }
  .cc-header-tools { width:100%; justify-content:space-between; }
  .cc-title { font-size:34px; }
  .cc-row { grid-template-columns:42px 1fr auto; gap:12px; }
  .cc-avatar { display:none; }
  .cc-meta { gap:8px; }
  .cc-grid2 { grid-template-columns:1fr; gap:0; }
}
`

function InjectCSS() {
  useEffect(() => {
    let el = document.getElementById('cc-css')
    if (!el) {
      el = document.createElement('style')
      el.id = 'cc-css'
      document.head.appendChild(el)
    }
    el.textContent = CSS
  }, [])
  return null
}

function Skel({ w, h, r = 8 }) {
  return <div className="cc-skel" style={{ width: w || '100%', height: h || 18, borderRadius: r }} />
}

function Toast({ data, onClose }) {
  const t = useRef()
  useEffect(() => { t.current = setTimeout(onClose, 3800); return () => clearTimeout(t.current) }, [onClose])
  const ok = data.tipo === 'success'
  return (
    <div className={`cc-toast${ok ? '' : ' err'}`} onClick={onClose}>
      <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: ok ? '#F0FDF4' : '#FEF2F2', color: ok ? '#16A34A' : '#DC2626' }}>
        <i className={`ti ${ok ? 'ti-check' : 'ti-alert-circle'}`} style={{ fontSize: 20 }} />
      </span>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{ok ? 'Listo' : 'Error'}</p>
        <p style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{data.mensaje}</p>
      </div>
    </div>
  )
}

function Modal({ onClose, children }) {
  return (
    <div className="cc-overlay" onClick={onClose}>
      <div className="cc-modal" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [busqueda, setBusqueda]           = useState('')
  const [mostrarForm, setMostrarForm]     = useState(false)
  const [editando, setEditando]           = useState(null)
  const [notificacion, setNotificacion]   = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving]               = useState(false)

  const emptyForm = { tipo_documento: 'DNI', numero_documento: '', nombres_razon_social: '', direccion: '', telefono: '', email: '' }
  const [form, setForm] = useState(emptyForm)
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { cargarClientes() }, [])

  const cargarClientes = async () => {
    setLoading(true)
    const { data } = await supabase.from('Clientes').select('*').eq('estado', true).order('nombres_razon_social')
    setClientes(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.numero_documento || !form.nombres_razon_social) {
      setNotificacion({ tipo: 'error', mensaje: 'Completa los campos obligatorios' }); return
    }
    setSaving(true)
    try {
      if (editando) {
        await supabase.from('Clientes').update(form).eq('id_cliente', editando)
        setNotificacion({ tipo: 'success', mensaje: 'Cliente actualizado' })
      } else {
        await supabase.from('Clientes').insert(form)
        setNotificacion({ tipo: 'success', mensaje: 'Cliente registrado' })
      }
      setMostrarForm(false); setEditando(null); setForm(emptyForm)
      cargarClientes()
    } catch (err) {
      setNotificacion({ tipo: 'error', mensaje: err.message })
    } finally { setSaving(false) }
  }

  const handleEditar = (c) => {
    setEditando(c.id_cliente)
    setForm({ tipo_documento: c.tipo_documento || 'DNI', numero_documento: c.numero_documento, nombres_razon_social: c.nombres_razon_social, direccion: c.direccion || '', telefono: c.telefono || '', email: c.email || '' })
    setMostrarForm(true)
  }

  const confirmarEliminar = async () => {
    if (!confirmDelete) return
    await supabase.from('Clientes').update({ estado: false }).eq('id_cliente', confirmDelete)
    setNotificacion({ tipo: 'success', mensaje: 'Cliente eliminado' })
    setConfirmDelete(null); cargarClientes()
  }

  const filtrados = clientes.filter(c =>
    !busqueda ||
    c.nombres_razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numero_documento?.includes(busqueda)
  )

  if (loading) return (
    <div className="cc">
      <InjectCSS />
      <div className="cc-glow" /><div className="cc-glow2" />
      <div className="cc-inner">
        <div className="cc-header">
          <div><Skel w={260} h={72} r={6} /><div style={{marginTop:14}}><Skel w={180} h={13} /></div></div>
          <Skel w={160} h={48} r={12} />
        </div>
        <Skel w={380} h={32} r={4} />
        <div style={{marginTop:40}}>
          {[1,2,3,4,5].map(i=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'52px 48px 1fr auto',gap:20,padding:'18px 0',borderBottom:'1px solid #E2E8F0'}}>
              <Skel w={34} h={28} r={4} />
              <Skel w={44} h={44} r={12} />
              <div><Skel w="55%" h={17} /><div style={{marginTop:9}}><Skel w="38%" h={12} /></div></div>
              <div style={{display:'flex',gap:8}}><Skel w={34} h={34} r={9}/><Skel w={34} h={34} r={9}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="cc">
      <InjectCSS />
      <div className="cc-glow" /><div className="cc-glow2" />

      <div className="cc-inner">
        {/* HEADER */}
        <div className="cc-header cc-anim-up">
          <div className="cc-header-main">
            <div className="cc-heading-icon">
              <i className="ti ti-users" />
            </div>
            <div>
              <h1 className="cc-title">Clientes</h1>
              <div className="cc-title-sub">
                <span className="cc-pulse-dot" />
                <span style={{fontFamily:"'JetBrains Mono',monospace"}}>
                  Gestion de clientes activos
                  {busqueda && filtrados.length !== clientes.length && (
                    <span style={{color:'var(--accent)',marginLeft:14}}>/ {filtrados.length} filtrados</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="cc-header-tools">
            <div className="cc-count-pill">
              <i className="ti ti-address-book" />
              {String(clientes.length).padStart(2,'0')} registros
            </div>
            <button className="cc-btn cc-btn-accent" onClick={() => { setEditando(null); setMostrarForm(true) }}>
              <i className="ti ti-user-plus" /> Nuevo cliente
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="cc-search-wrap cc-anim-up" style={{animationDelay:'.06s'}}>
          <span className="cc-search-label">Busqueda</span>
          <div className="cc-search-row">
            <span className="cc-search-icon">
              <i className="ti ti-search" />
            </span>
            <input className="cc-search" placeholder="Nombre o numero de documento" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>

        {/* LIST */}
        <div className="cc-list">
          {filtrados.length === 0 ? (
            <div className="cc-empty cc-anim-up">
              <i className="ti ti-users" style={{fontSize:40,color:'var(--muted)',display:'block',marginBottom:0}} />
              <div className="cc-empty-title">{busqueda ? 'SIN RESULTADOS' : 'SIN CLIENTES'}</div>
              <p style={{color:'var(--muted)',fontSize:13}}>{busqueda ? `No hay coincidencias para "${busqueda}"` : 'Agrega tu primer cliente arriba'}</p>
            </div>
          ) : filtrados.map((c, i) => {
            const pal  = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
            const doc  = DOC_META[c.tipo_documento] || DOC_META.DNI
            const init = (c.nombres_razon_social || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

            return (
              <div key={c.id_cliente} className="cc-row cc-anim-up" style={{animationDelay:`${0.04+i*0.035}s`}}>
                <div className="cc-row-num">{String(i+1).padStart(2,'0')}</div>

                <div className="cc-avatar" style={{background:`linear-gradient(135deg,${pal[0]},${pal[1]})`,boxShadow:`0 4px 20px ${pal[0]}44`}}>
                  {init}
                </div>

                <div style={{minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:1,flexWrap:'wrap'}}>
                    <span className="cc-name">{c.nombres_razon_social}</span>
                    <span className="cc-doc-badge" style={{color:doc.color,borderColor:`${doc.color}55`}}>{doc.label}</span>
                  </div>
                  <div className="cc-meta">
                    <span className="cc-meta-item"><i className="ti ti-hash" />{c.numero_documento}</span>
                    {c.telefono  && <span className="cc-meta-item"><i className="ti ti-phone" />{c.telefono}</span>}
                    {c.email     && <span className="cc-meta-item"><i className="ti ti-at"    />{c.email}</span>}
                    {c.direccion && <span className="cc-meta-item" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><i className="ti ti-map-pin" style={{flexShrink:0}} />{c.direccion}</span>}
                  </div>
                </div>

                <div className="cc-actions">
                  <button className="cc-icon-btn edit" title="Editar" onClick={() => handleEditar(c)}><i className="ti ti-edit" /></button>
                  <button className="cc-icon-btn del" title="Eliminar" onClick={() => setConfirmDelete(c.id_cliente)}><i className="ti ti-trash" /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL FORM */}
      {mostrarForm && (
        <Modal onClose={() => setMostrarForm(false)}>
          <div className="cc-modal-icon" style={{background:'#F0FDF4'}}>
            <i className="ti ti-user-plus" style={{color:'var(--accent)',fontSize:22}} />
          </div>
          <div className="cc-modal-title">{editando ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}</div>
          <div className="cc-modal-sub">{editando ? 'Actualiza los datos del registro' : 'Completa la información del cliente'}</div>
          <form onSubmit={handleSubmit}>
            <div className="cc-field">
              <label className="cc-label">Tipo de documento</label>
              <select className="cc-input cc-select" value={form.tipo_documento} onChange={e => sf('tipo_documento', e.target.value)}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="cc-grid2">
              <div className="cc-field">
                <label className="cc-label">N° Documento *</label>
                <input className="cc-input" placeholder="00000000" value={form.numero_documento} onChange={e => sf('numero_documento', e.target.value)} required />
              </div>
              <div className="cc-field">
                <label className="cc-label">Teléfono</label>
                <input className="cc-input" placeholder="9XX XXX XXX" value={form.telefono} onChange={e => sf('telefono', e.target.value)} />
              </div>
            </div>
            <div className="cc-field">
              <label className="cc-label">Nombre / Razón social *</label>
              <input className="cc-input" placeholder="Nombre completo o razón social" value={form.nombres_razon_social} onChange={e => sf('nombres_razon_social', e.target.value)} required />
            </div>
            <div className="cc-field">
              <label className="cc-label">Email</label>
              <input className="cc-input" type="email" placeholder="correo@dominio.com" value={form.email} onChange={e => sf('email', e.target.value)} />
            </div>
            <div className="cc-field">
              <label className="cc-label">Dirección</label>
              <input className="cc-input" placeholder="Av. Principal 123, Lima" value={form.direccion} onChange={e => sf('direccion', e.target.value)} />
            </div>
            <div className="cc-divider" />
            <div className="cc-modal-actions">
              <button type="button" className="cc-btn cc-btn-ghost" onClick={() => setMostrarForm(false)}>Cancelar</button>
              <button type="submit" className="cc-btn cc-btn-accent" disabled={saving} style={{opacity:saving?.7:1}}>
                {saving ? <><i className="ti ti-loader-2" style={{fontSize:15}} /> Guardando…</> : editando ? 'Guardar cambios' : 'Crear cliente'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL CONFIRMAR */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div className="cc-modal-icon" style={{background:'rgba(255,61,61,.12)',margin:'0 auto 20px'}}>
              <i className="ti ti-alert-triangle" style={{color:'var(--danger)',fontSize:22}} />
            </div>
            <div className="cc-modal-title" style={{fontSize:26}}>¿ELIMINAR CLIENTE?</div>
            <p style={{color:'var(--muted2)',fontSize:13.5,margin:'10px 0 32px',lineHeight:1.6}}>El cliente será desactivado del sistema.<br/>Esta acción es reversible.</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="cc-btn cc-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="cc-btn cc-btn-danger" onClick={confirmarEliminar}>Sí, eliminar</button>
            </div>
          </div>
        </Modal>
      )}

      {notificacion && <Toast data={notificacion} onClose={() => setNotificacion(null)} />}
    </div>
  )
}
