'use client'

import { useEffect, useState } from 'react'
import ProveedoresModule from '../components/proveedores/ProveedoresModule'
import PlatosAccordion from '../components/platos/PlatosAccordion'
import ResumenModule from '../components/resumen/ResumenModule'
import { useStore } from '../hooks/useStore'
import { Ingrediente } from '../types'

type Tab = 'platos' | 'precios' | 'resumen'

const PIN = '4275'

export default function Home() {
  const [tab, setTab] = useState<Tab>('platos')
  const [entered, setEntered] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const {
    loading, loadError, saveStatus,
    proveedores, setProveedores,
    ingredientes, setIngredientes,
    platos, setPlatos, updatePlato, toggleVerificado,
    actualizarPrecioIngrediente,
    salsaComponentes,
  } = useStore()

  useEffect(() => {
    if (sessionStorage.getItem('costosmw-edit') === '1') setEditMode(true)
  }, [])

  function handlePinSubmit() {
    if (pinInput === PIN) {
      setEditMode(true)
      sessionStorage.setItem('costosmw-edit', '1')
      setShowPinModal(false)
      setPinInput('')
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  function handleLock() {
    setEditMode(false)
    sessionStorage.removeItem('costosmw-edit')
  }

  function handleAddProveedor(nombre: string) {
    const id = nombre.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    setProveedores([...proveedores, { id, nombre }])
  }

  function handleAddIngrediente(ing: Omit<Ingrediente, 'id' | 'precio' | 'updatedAt'>) {
    setIngredientes([...ingredientes, { ...ing, id: 'custom-' + Date.now(), precio: null, updatedAt: null }])
  }

  function handleDeleteIngrediente(id: string) {
    setIngredientes(ingredientes.filter(i => i.id !== id))
    setPlatos(platos.map(p => ({ ...p, items: p.items.filter(item => item.ingredienteId !== id) })))
  }

  if (!entered) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-8 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Mirador Waikiki" className="w-60 max-w-[70vw] h-auto" />
        <div className="text-center">
          <div className="text-brand-sage text-lg font-semibold">App de Costos</div>
          <div className="text-brand-muted text-xs tracking-[0.35em] uppercase mt-1.5">· 2026 ·</div>
        </div>
        <button
          onClick={() => setEntered(true)}
          disabled={loading}
          className="bg-brand-sage hover:bg-brand-sage-dark text-white rounded-xl px-12 py-3 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-wait shadow-lg shadow-brand-sage/20"
        >
          {loading ? 'Cargando…' : 'Entrar'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="border-b border-brand-border px-3 sm:px-6 py-1.5 flex items-center gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-start gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Mirador Waikiki" className="h-6 w-auto" />
          <span className="text-brand-muted text-xs hidden sm:inline">Costos</span>
        </div>
        <nav className="flex gap-1">
          {([['platos', 'Platos'], ['precios', 'Precios'], ['resumen', 'Resumen']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-brand-card text-brand-text' : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="text-brand-sage text-sm font-semibold">Enzo</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4 text-xs">
          {editMode && saveStatus === 'saving' && <span className="text-brand-muted animate-pulse">Guardando…</span>}
          {editMode && saveStatus === 'saved' && <span className="text-brand-success">✓ Guardado</span>}
          {editMode && saveStatus === 'error' && <span className="text-brand-error">⚠ Error al guardar</span>}
          {editMode ? (
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 font-medium transition-colors"
              title="Bloquear edición"
            >
              🔓<span className="hidden sm:inline"> Edición activa</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-brand-card text-brand-muted hover:text-brand-text border border-brand-border font-medium transition-colors"
              title="Ingresar clave para editar"
            >
              🔒<span className="hidden sm:inline"> Solo lectura</span>
            </button>
          )}
        </div>
      </header>

      {loadError && (
        <div className="max-w-3xl mx-auto mt-4 px-4">
          <div className="bg-brand-error/10 border border-brand-error/30 text-brand-error rounded-xl px-4 py-3 text-sm">
            <span className="font-semibold">No se pudieron cargar los datos.</span> {loadError}
          </div>
        </div>
      )}

      {tab === 'platos' && (
        <PlatosAccordion
          platos={platos}
          ingredientes={ingredientes}
          onUpdatePlato={updatePlato}
          onToggleVerificado={toggleVerificado}
          readOnly={!editMode}
          salsaComponentes={salsaComponentes}
        />
      )}

      {tab === 'precios' && (
        <ProveedoresModule
          proveedores={proveedores}
          ingredientes={ingredientes}
          onAddProveedor={handleAddProveedor}
          onUpdatePrecio={actualizarPrecioIngrediente}
          onAddIngrediente={handleAddIngrediente}
          onDeleteIngrediente={handleDeleteIngrediente}
          readOnly={!editMode}
        />
      )}

      {tab === 'resumen' && <ResumenModule platos={platos} />}

      {/* PIN modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
          onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(false) }}
        >
          <div
            className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-brand-text mb-1">Modo edición</div>
            <div className="text-xs text-brand-muted mb-4">Ingresá la clave para editar precios y platos.</div>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text text-center tracking-widest placeholder-brand-muted focus:border-brand-accent focus:outline-none transition-colors"
              placeholder="••••"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit() }}
            />
            {pinError && <div className="text-xs text-brand-error mt-2 text-center">Clave incorrecta</div>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handlePinSubmit}
                className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(false) }}
                className="flex-1 bg-brand-dark hover:bg-brand-card-hover text-brand-muted hover:text-brand-text border border-brand-border rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
