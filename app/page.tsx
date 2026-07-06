'use client'

import { useState } from 'react'
import ProveedoresModule from '../components/proveedores/ProveedoresModule'
import PlatosAccordion from '../components/platos/PlatosAccordion'
import ResumenModule from '../components/resumen/ResumenModule'
import { useStore } from '../hooks/useStore'
import { Ingrediente } from '../types'

type Tab = 'platos' | 'precios' | 'resumen'

export default function Home() {
  const [tab, setTab] = useState<Tab>('platos')
  const {
    loading, saveStatus,
    proveedores, setProveedores,
    ingredientes, setIngredientes,
    platos, setPlatos, updatePlato,
    actualizarPrecioIngrediente,
  } = useStore()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-brand-dark">
        <div className="text-brand-muted text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="border-b border-brand-border px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-brand-accent flex items-center justify-center">
            <span className="text-white text-xs font-semibold">O</span>
          </div>
          <span className="text-brand-text text-sm font-semibold">Oliovita</span>
          <span className="text-brand-muted text-xs">· Costos</span>
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
        <div className="ml-auto text-xs">
          {saveStatus === 'saving' && <span className="text-brand-muted animate-pulse">Guardando…</span>}
          {saveStatus === 'saved' && <span className="text-brand-success">✓ Guardado</span>}
          {saveStatus === 'error' && <span className="text-brand-error">⚠ Error al guardar — revisá tu conexión</span>}
        </div>
      </header>

      {tab === 'platos' && (
        <PlatosAccordion
          platos={platos}
          ingredientes={ingredientes}
          onUpdatePlato={updatePlato}
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
        />
      )}

      {tab === 'resumen' && <ResumenModule platos={platos} />}
    </div>
  )
}
