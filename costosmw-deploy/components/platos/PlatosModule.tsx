'use client'

import { useState } from 'react'
import { Ingrediente, ItemPlato, Plato, UnidadPlato } from '../../types'
import { formatPeso, calcularCosto } from '../../utils/format'

interface Props {
  platos: Plato[]
  ingredientes: Ingrediente[]
  onUpdatePlato: (plato: Plato) => void
}

const SECCIONES = ['Entradas', 'Ensaladas', 'Arroces', 'Pescados', 'Carnes', 'Pastas', 'Fast food', 'Menú infantil']

function getFoodCostColor(fc: number) {
  if (fc <= 30) return 'text-brand-success bg-brand-success/10'
  if (fc <= 40) return 'text-yellow-400 bg-yellow-400/10'
  return 'text-brand-error bg-brand-error/10'
}

export default function PlatosModule({ platos, ingredientes, onUpdatePlato }: Props) {
  const [selectedPlatoId, setSelectedPlatoId] = useState<string>(platos[0]?.id ?? '')
  const [newItem, setNewItem] = useState({
    nombre: '',
    ingredienteId: null as string | null,
    cantidad: '',
    unidad: 'gramos' as UnidadPlato,
    precioBase: '',
    merma: '0',
  })
  const [autocompleteResults, setAutocompleteResults] = useState<Ingrediente[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const platosConItems = platos.filter(p => p.items.length > 0).length
  const plato = platos.find(p => p.id === selectedPlatoId)

  const totalCosto = plato?.items.reduce((s, i) => s + i.costoCalculado, 0) ?? 0
  const foodCost = plato && plato.precioVenta > 0 ? (totalCosto / plato.precioVenta) * 100 : 0
  const margen = 100 - foodCost
  const gananciaPorPlato = plato ? plato.precioVenta - totalCosto : 0

  function handleNombreChange(value: string) {
    setNewItem(p => ({ ...p, nombre: value, ingredienteId: null, precioBase: '' }))
    if (value.length >= 2) {
      const results = ingredientes.filter(i => i.nombre.toLowerCase().includes(value.toLowerCase()) && i.precio !== null)
      setAutocompleteResults(results)
      setShowAutocomplete(results.length > 0)
    } else {
      setShowAutocomplete(false)
    }
  }

  function handleSelectIngrediente(ing: Ingrediente) {
    setNewItem(p => ({
      ...p,
      nombre: ing.nombre,
      ingredienteId: ing.id,
      precioBase: ing.precio !== null ? String(Math.round(ing.precio)) : '',
      merma: String(ing.mermaPorDefecto ?? 0),
    }))
    setShowAutocomplete(false)
  }

  function handleAddItem() {
    if (!plato) return
    const cantidad = parseFloat(newItem.cantidad)
    const precioBase = parseFloat(newItem.precioBase.replace(/\./g, '').replace(',', '.'))
    const merma = parseFloat(newItem.merma)
    if (!newItem.nombre || isNaN(cantidad) || isNaN(precioBase)) return
    const mermaVal = isNaN(merma) ? 0 : merma
    const item: ItemPlato = {
      id: crypto.randomUUID(),
      nombre: newItem.nombre,
      ingredienteId: newItem.ingredienteId,
      cantidad,
      unidad: newItem.unidad,
      precioBase,
      merma: mermaVal,
      costoCalculado: calcularCosto(precioBase, cantidad, newItem.unidad, mermaVal),
    }
    onUpdatePlato({ ...plato, items: [...plato.items, item] })
    setNewItem({ nombre: '', ingredienteId: null, cantidad: '', unidad: 'gramos', precioBase: '', merma: '0' })
  }

  function handleDeleteItem(itemId: string) {
    if (!plato) return
    onUpdatePlato({ ...plato, items: plato.items.filter(i => i.id !== itemId) })
  }

  const bySeccion = SECCIONES.reduce((acc, sec) => {
    acc[sec] = platos.filter(p => p.seccion === sec)
    return acc
  }, {} as Record<string, Plato[]>)

  const inputClass = 'bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-accent focus:outline-none transition-colors'

  return (
    <div className="flex h-[calc(100vh-49px)]">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-dark border-r border-brand-border flex flex-col shrink-0">
        <div className="p-4 border-b border-brand-border">
          <div className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-2">Platos</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all"
                style={{ width: platos.length > 0 ? `${(platosConItems / platos.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-brand-muted whitespace-nowrap">{platosConItems}/{platos.length}</span>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {SECCIONES.map(sec => {
            const secPlatos = bySeccion[sec] ?? []
            if (!secPlatos.length) return null
            return (
              <div key={sec}>
                <div className="px-4 py-2 text-xs font-semibold text-brand-muted/60 uppercase tracking-widest bg-brand-dark sticky top-0">
                  {sec}
                </div>
                {secPlatos.map(p => {
                  const isActive = selectedPlatoId === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatoId(p.id)}
                      className={`w-full text-left px-4 py-2.5 border-b border-brand-border/30 transition-colors flex items-center justify-between gap-2 ${
                        isActive ? 'bg-brand-card border-l-2 border-l-brand-accent' : 'hover:bg-brand-card/50'
                      }`}
                    >
                      <span className={`text-sm leading-tight ${isActive ? 'text-brand-text' : 'text-brand-muted'}`}>{p.nombre}</span>
                      {p.items.length > 0 && <span className="text-brand-success text-xs shrink-0">✓</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-brand-dark p-6">
        {plato ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text">{plato.nombre}</h2>
                <div className="text-sm text-brand-muted mt-0.5">
                  {plato.seccion} · <span className="text-brand-text/80">{formatPeso(plato.precioVenta)}</span>
                </div>
              </div>
              {plato.items.length > 0 && (
                <div className="flex gap-5">
                  <div className="text-center">
                    <div className="text-base font-semibold text-brand-text">{formatPeso(totalCosto)}</div>
                    <div className="text-xs text-brand-muted">Costo</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-base font-semibold px-2 py-0.5 rounded-lg ${getFoodCostColor(foodCost)}`}>
                      {foodCost.toFixed(1)}%
                    </div>
                    <div className="text-xs text-brand-muted">Food cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold text-brand-muted">{margen.toFixed(1)}%</div>
                    <div className="text-xs text-brand-muted">Margen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold text-brand-success">{formatPeso(gananciaPorPlato)}</div>
                    <div className="text-xs text-brand-muted">Ganancia</div>
                  </div>
                </div>
              )}
            </div>

            {/* Items table */}
            {plato.items.length > 0 && (
              <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-brand-muted border-b border-brand-border/50">
                      <th className="text-left px-4 py-2.5 font-medium">Ingrediente</th>
                      <th className="text-right px-4 py-2.5 font-medium">Cantidad</th>
                      <th className="text-right px-4 py-2.5 font-medium">Precio/kg</th>
                      <th className="text-right px-4 py-2.5 font-medium">Merma</th>
                      <th className="text-right px-4 py-2.5 font-medium">Costo</th>
                      <th className="px-4 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plato.items.map(item => (
                      <tr key={item.id} className="border-b border-brand-border/30 hover:bg-brand-card-hover/50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-brand-text">
                          {item.nombre}
                          {item.ingredienteId && <span className="ml-1.5 text-xs text-brand-accent">●</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right text-brand-muted">
                          {item.cantidad} {item.unidad === 'gramos' ? 'g' : item.unidad === 'ml' ? 'ml' : 'u'}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-right text-brand-muted">{formatPeso(item.precioBase)}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-brand-muted">{item.merma}%</td>
                        <td className="px-4 py-2.5 text-sm text-right font-medium text-brand-text">{formatPeso(item.costoCalculado)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => handleDeleteItem(item.id)} className="text-brand-border hover:text-brand-error text-lg leading-none transition-colors">×</button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-brand-border/50 bg-brand-dark/50">
                      <td colSpan={4} className="px-4 py-2.5 text-sm font-medium text-brand-muted text-right">Total costo</td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-brand-text text-right">{formatPeso(totalCosto)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Add item form */}
            <div className="bg-brand-card border border-brand-border rounded-xl p-4">
              <div className="text-sm font-medium text-brand-text mb-3">Agregar ingrediente</div>
              <div className="flex gap-3 flex-wrap items-end">
                <div className="relative flex-1 min-w-40">
                  <label className="block text-xs text-brand-muted mb-1">Nombre</label>
                  <input
                    type="text"
                    className={`${inputClass} w-full`}
                    placeholder="Nombre del ingrediente"
                    value={newItem.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    onFocus={() => newItem.nombre.length >= 2 && setShowAutocomplete(autocompleteResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                  />
                  {showAutocomplete && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-brand-card border border-brand-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {autocompleteResults.map(ing => (
                        <button
                          key={ing.id}
                          onMouseDown={() => handleSelectIngrediente(ing)}
                          className="w-full text-left px-3 py-2.5 hover:bg-brand-card-hover text-sm flex items-center justify-between transition-colors"
                        >
                          <span className="text-brand-text">{ing.nombre}</span>
                          <span className="text-xs text-brand-accent ml-2">{formatPeso(ing.precio!)}/kg</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-xs text-brand-muted mb-1">Cantidad</label>
                  <input type="number" className={`${inputClass} w-full`} placeholder="0" value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: e.target.value }))} />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-brand-muted mb-1">Unidad</label>
                  <select className={`${inputClass} w-full`} value={newItem.unidad} onChange={e => setNewItem(p => ({ ...p, unidad: e.target.value as UnidadPlato }))}>
                    <option value="gramos">Gramos</option>
                    <option value="ml">Mililitros</option>
                    <option value="unidad">Unidad</option>
                  </select>
                </div>
                <div className="w-36">
                  <label className="block text-xs text-brand-muted mb-1">Precio/kg (u)</label>
                  <input
                    type="text"
                    className={`${inputClass} w-full ${newItem.ingredienteId ? 'border-brand-accent/50' : ''}`}
                    placeholder="$ precio"
                    value={newItem.precioBase}
                    onChange={e => setNewItem(p => ({ ...p, precioBase: e.target.value, ingredienteId: null }))}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-brand-muted mb-1">Merma %</label>
                  <input type="number" min="0" max="99" className={`${inputClass} w-full`} value={newItem.merma} onChange={e => setNewItem(p => ({ ...p, merma: e.target.value }))} />
                </div>
                <button
                  onClick={handleAddItem}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-brand-muted text-center mt-20 text-sm">Seleccioná un plato</div>
        )}
      </main>
    </div>
  )
}
