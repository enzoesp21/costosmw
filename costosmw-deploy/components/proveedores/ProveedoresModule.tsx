'use client'

import { useState } from 'react'
import { Ingrediente, Proveedor, Unidad } from '../../types'
import { formatDate } from '../../utils/format'

interface Props {
  proveedores: Proveedor[]
  ingredientes: Ingrediente[]
  onAddProveedor: (nombre: string) => void
  onUpdatePrecio: (id: string, precio: number) => void
  onAddIngrediente: (ing: Omit<Ingrediente, 'id' | 'precio' | 'updatedAt'>) => void
  onDeleteIngrediente: (id: string) => void
  readOnly?: boolean
}

const UNIDADES: Unidad[] = ['kg', 'unidad', 'litro', 'docena', 'cajón', 'bandeja', 'bolsa']

export default function ProveedoresModule({
  proveedores, ingredientes, onAddProveedor, onUpdatePrecio, onAddIngrediente, onDeleteIngrediente, readOnly
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(proveedores[0]?.id ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [showAddProv, setShowAddProv] = useState(false)
  const [newProvNombre, setNewProvNombre] = useState('')
  const [showAddIng, setShowAddIng] = useState(false)
  const [newIng, setNewIng] = useState({ nombre: '', categoria: '', unidad: 'kg' as Unidad, mermaPorDefecto: 0 })
  const [editPrices, setEditPrices] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const totalCargados = ingredientes.filter(i => i.precio !== null).length

  const filteredBySearch = busqueda
    ? ingredientes.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : null

  const currentProveedor = proveedores.find(p => p.id === selectedId)
  const currentIngredientes = filteredBySearch ?? ingredientes.filter(i => i.proveedorId === selectedId)

  const byCategory = currentIngredientes.reduce((acc, ing) => {
    if (!acc[ing.categoria]) acc[ing.categoria] = []
    acc[ing.categoria].push(ing)
    return acc
  }, {} as Record<string, Ingrediente[]>)

  function handlePrecioBlur(ing: Ingrediente) {
    const val = editPrices[ing.id]
    if (val === undefined) return
    const num = parseFloat(val.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(num) && num > 0) onUpdatePrecio(ing.id, num)
    setEditPrices(prev => { const n = { ...prev }; delete n[ing.id]; return n })
  }

  const inputClass = 'bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-accent focus:outline-none transition-colors'
  const btnPrimary = 'bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors'
  const btnSecondary = 'bg-brand-card hover:bg-brand-card-hover text-brand-muted hover:text-brand-text border border-brand-border rounded-lg px-4 py-1.5 text-sm font-medium transition-colors'

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-62px)]">
      {/* Mobile: proveedores como chips deslizables */}
      <div className="md:hidden border-b border-brand-border bg-brand-dark px-3 py-2.5">
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          {proveedores.map(prov => {
            const isActive = selectedId === prov.id && !busqueda
            return (
              <button
                key={prov.id}
                onClick={() => { setSelectedId(prov.id); setBusqueda('') }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive ? 'bg-brand-accent text-white border-brand-accent' : 'bg-brand-card text-brand-muted border-brand-border'
                }`}
              >
                {prov.nombre}
              </button>
            )
          })}
          {!readOnly && (
            <button
              onClick={() => setShowAddProv(true)}
              className="shrink-0 w-7 h-7 rounded-full bg-brand-card border border-brand-border text-brand-muted text-base leading-none"
              title="Agregar proveedor"
            >+</button>
          )}
        </div>
        {showAddProv && (
          <div className="mt-2 flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              placeholder="Nombre del proveedor"
              value={newProvNombre}
              onChange={e => setNewProvNombre(e.target.value)}
            />
            <button
              onClick={() => {
                if (newProvNombre.trim()) { onAddProveedor(newProvNombre.trim()); setNewProvNombre(''); setShowAddProv(false) }
              }}
              className={btnPrimary}
            >OK</button>
            <button onClick={() => setShowAddProv(false)} className={btnSecondary}>✕</button>
          </div>
        )}
      </div>

      {/* Sidebar (desktop) */}
      <aside className="w-60 bg-brand-dark border-r border-brand-border hidden md:flex flex-col shrink-0">
        <div className="p-4 border-b border-brand-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-widest">Proveedores</span>
            {!readOnly && (
              <button
                onClick={() => setShowAddProv(true)}
                className="w-6 h-6 rounded-md bg-brand-card hover:bg-brand-card-hover text-brand-muted hover:text-brand-text flex items-center justify-center transition-colors text-base leading-none"
                title="Agregar proveedor"
              >+</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all"
                style={{ width: ingredientes.length > 0 ? `${(totalCargados / ingredientes.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-brand-muted whitespace-nowrap">{totalCargados}/{ingredientes.length}</span>
          </div>
        </div>

        {showAddProv && (
          <div className="p-3 border-b border-brand-border bg-brand-card/50">
            <input
              className={`${inputClass} w-full mb-2`}
              placeholder="Nombre del proveedor"
              value={newProvNombre}
              onChange={e => setNewProvNombre(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newProvNombre.trim()) { onAddProveedor(newProvNombre.trim()); setNewProvNombre(''); setShowAddProv(false) }
                }}
                className={`flex-1 ${btnPrimary}`}
              >Guardar</button>
              <button onClick={() => setShowAddProv(false)} className={`flex-1 ${btnSecondary}`}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {proveedores.map(prov => {
            const ings = ingredientes.filter(i => i.proveedorId === prov.id)
            const cargados = ings.filter(i => i.precio !== null).length
            const isActive = selectedId === prov.id && !busqueda
            return (
              <button
                key={prov.id}
                onClick={() => { setSelectedId(prov.id); setBusqueda('') }}
                className={`w-full text-left px-4 py-3 border-b border-brand-border/50 transition-colors ${
                  isActive ? 'bg-brand-card border-l-2 border-l-brand-accent' : 'hover:bg-brand-card/50'
                }`}
              >
                <div className={`text-sm font-medium ${isActive ? 'text-brand-text' : 'text-brand-muted'}`}>{prov.nombre}</div>
                <div className="text-xs text-brand-muted/70 mt-0.5">{cargados}/{ings.length} precios</div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-brand-dark">
        {/* Stats bar */}
        <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-xl font-semibold text-brand-text">{ingredientes.length}</div>
              <div className="text-xs text-brand-muted">Total</div>
            </div>
            <div className="w-px h-8 bg-brand-border" />
            <div className="text-center">
              <div className="text-xl font-semibold text-brand-success">{totalCargados}</div>
              <div className="text-xs text-brand-muted">Con precio</div>
            </div>
            <div className="w-px h-8 bg-brand-border" />
            <div className="text-center">
              <div className="text-xl font-semibold text-brand-accent">{ingredientes.length - totalCargados}</div>
              <div className="text-xs text-brand-muted">Sin precio</div>
            </div>
          </div>
          <div className="flex-1 max-w-xs min-w-36">
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={`${inputClass} w-full`}
            />
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {!busqueda && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-brand-text">{currentProveedor?.nombre}</h2>
              {!readOnly && (
                <button onClick={() => setShowAddIng(true)} className={btnPrimary}>
                  + Agregar ingrediente
                </button>
              )}
            </div>
          )}

          {busqueda && (
            <div className="mb-4 text-sm text-brand-muted">
              {currentIngredientes.length} resultado{currentIngredientes.length !== 1 ? 's' : ''} para &ldquo;{busqueda}&rdquo;
            </div>
          )}

          {showAddIng && (
            <div className="mb-5 p-4 bg-brand-card border border-brand-border rounded-xl">
              <div className="text-sm font-medium text-brand-text mb-3">Nuevo ingrediente</div>
              <div className="flex gap-3 flex-wrap">
                <input className={`${inputClass} flex-1 min-w-32`} placeholder="Nombre" value={newIng.nombre} onChange={e => setNewIng(p => ({ ...p, nombre: e.target.value }))} />
                <input className={`${inputClass} flex-1 min-w-32`} placeholder="Categoría" value={newIng.categoria} onChange={e => setNewIng(p => ({ ...p, categoria: e.target.value }))} />
                <select className={`${inputClass}`} value={newIng.unidad} onChange={e => setNewIng(p => ({ ...p, unidad: e.target.value as Unidad }))}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={() => {
                  if (newIng.nombre.trim() && newIng.categoria.trim()) {
                    onAddIngrediente({ ...newIng, proveedorId: selectedId })
                    setNewIng({ nombre: '', categoria: '', unidad: 'kg', mermaPorDefecto: 0 })
                    setShowAddIng(false)
                  }
                }} className={btnPrimary}>Guardar</button>
                <button onClick={() => setShowAddIng(false)} className={btnSecondary}>Cancelar</button>
              </div>
            </div>
          )}

          {Object.entries(byCategory).map(([cat, ings]) => (
            <div key={cat} className="mb-5 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-brand-border/50 flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-muted uppercase tracking-widest">{cat}</span>
                {busqueda && <span className="text-xs text-brand-muted/60">· {proveedores.find(p => p.id === ings[0].proveedorId)?.nombre}</span>}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-brand-muted border-b border-brand-border/50">
                    <th className="text-left px-3 sm:px-4 py-2 font-medium">Ingrediente</th>
                    <th className="text-left px-3 sm:px-4 py-2 font-medium hidden sm:table-cell">Unidad</th>
                    <th className="text-right px-3 sm:px-4 py-2 font-medium">Precio</th>
                    <th className="text-right px-3 sm:px-4 py-2 font-medium hidden sm:table-cell">Actualizado</th>
                    <th className="px-4 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {ings.map(ing => (
                    <tr key={ing.id} className="border-b border-brand-border/30 hover:bg-brand-card-hover/50 transition-colors">
                      <td className="px-3 sm:px-4 py-2.5 text-sm text-brand-text">{ing.nombre}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-sm text-brand-muted hidden sm:table-cell">{ing.unidad}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right">
                        {readOnly ? (
                          <span className={`text-sm ${ing.precio !== null ? 'text-brand-success' : 'text-brand-muted/40'}`}>
                            {ing.precio !== null ? '$' + Math.round(ing.precio).toLocaleString('es-AR') : '—'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            inputMode="numeric"
                            className={`w-24 sm:w-32 text-right bg-brand-dark border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-brand-accent transition-colors ${
                              ing.precio !== null ? 'border-brand-success/50 text-brand-success' : 'border-brand-border text-brand-text'
                            }`}
                            placeholder="$ precio"
                            value={editPrices[ing.id] !== undefined
                              ? editPrices[ing.id]
                              : ing.precio !== null ? Math.round(ing.precio).toLocaleString('es-AR') : ''
                            }
                            onChange={e => setEditPrices(prev => ({ ...prev, [ing.id]: e.target.value }))}
                            onBlur={() => handlePrecioBlur(ing)}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          />
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-xs text-brand-muted/60 hidden sm:table-cell">
                        {ing.updatedAt ? formatDate(ing.updatedAt) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {readOnly ? null : confirmDelete === ing.id ? (
                          <span className="flex items-center gap-1 justify-end">
                            <button onClick={() => { onDeleteIngrediente(ing.id); setConfirmDelete(null) }} className="text-xs text-brand-error hover:text-red-400 font-medium">Sí</button>
                            <span className="text-brand-border">|</span>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-brand-muted hover:text-brand-text">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(ing.id)} className="text-brand-border hover:text-brand-error text-lg leading-none transition-colors">×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
