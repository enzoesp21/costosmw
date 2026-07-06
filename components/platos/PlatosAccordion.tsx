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
  if (fc <= 30) return 'text-brand-success'
  if (fc <= 40) return 'text-yellow-400'
  return 'text-brand-error'
}

function PlatoRow({ plato, ingredientes, onUpdatePlato }: { plato: Plato; ingredientes: Ingrediente[]; onUpdatePlato: (p: Plato) => void }) {
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '', ingredienteId: null as string | null, cantidad: '', unidad: 'gramos' as UnidadPlato, precioBase: '', merma: '0' })
  const [autocompleteResults, setAutocompleteResults] = useState<Ingrediente[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const totalCosto = plato.items.reduce((s, i) => s + i.costoCalculado, 0)
  const foodCost = plato.precioVenta > 0 ? (totalCosto / plato.precioVenta) * 100 : 0

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
    setNewItem(p => ({ ...p, nombre: ing.nombre, ingredienteId: ing.id, precioBase: ing.precio !== null ? String(Math.round(ing.precio)) : '', merma: String(ing.mermaPorDefecto ?? 0) }))
    setShowAutocomplete(false)
  }

  function handleAddItem() {
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
    setShowAddForm(false)
  }

  function handleDeleteItem(itemId: string) {
    onUpdatePlato({ ...plato, items: plato.items.filter(i => i.id !== itemId) })
  }

  const inputClass = 'bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-accent focus:outline-none transition-colors'

  return (
    <div className="border-b border-brand-border/50 last:border-0">
      {/* Plato header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-card/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs transition-transform duration-200 text-brand-muted ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-sm font-medium text-brand-text group-hover:text-brand-text">{plato.nombre}</span>
          {plato.items.length > 0 && (
            <span className="text-xs text-brand-muted/60">{plato.items.length} ingredientes</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {plato.items.length > 0 && (
            <>
              <span className="text-sm text-brand-muted/70">{formatPeso(totalCosto)}</span>
              <span className={`text-xs font-medium ${getFoodCostColor(foodCost)}`}>{foodCost.toFixed(1)}%</span>
            </>
          )}
          <span className="text-sm text-brand-muted/50">{formatPeso(plato.precioVenta)}</span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="bg-brand-card/20 border-t border-brand-border/30 px-5 pb-4 pt-3">
          {plato.items.length > 0 ? (
            <div className="mb-3">
              {plato.items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-brand-border/20 last:border-0 group/item">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-brand-text/90">{item.nombre}</span>
                    {item.ingredienteId && <span className="text-xs text-brand-accent/60">●</span>}
                    <span className="text-xs text-brand-muted/60">
                      {item.cantidad}{item.unidad === 'gramos' ? 'g' : item.unidad === 'ml' ? 'ml' : ' u'}
                      {item.merma > 0 && ` · ${item.merma}% merma`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-brand-text/80">
                      {item.costoCalculado > 0 ? formatPeso(item.costoCalculado) : <span className="text-brand-muted/40 text-xs">sin precio</span>}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover/item:opacity-100 text-brand-border hover:text-brand-error text-base leading-none transition-all"
                    >×</button>
                  </div>
                </div>
              ))}
              {/* Total row */}
              <div className="flex items-center justify-between pt-2 mt-1">
                <span className="text-xs text-brand-muted uppercase tracking-wide">Costo total</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-brand-text">{formatPeso(totalCosto)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    foodCost <= 30 ? 'bg-brand-success/10 text-brand-success' :
                    foodCost <= 40 ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-brand-error/10 text-brand-error'
                  }`}>
                    FC {foodCost.toFixed(1)}%
                  </span>
                  <span className="text-xs text-brand-success">{formatPeso(plato.precioVenta - totalCosto)} ganancia</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-brand-muted/50 mb-3">Sin ingredientes cargados</div>
          )}

          {/* Add item */}
          {showAddForm ? (
            <div className="mt-2 p-3 bg-brand-card border border-brand-border rounded-xl">
              <div className="flex gap-2 flex-wrap items-end">
                <div className="relative flex-1 min-w-36">
                  <input
                    type="text"
                    className={`${inputClass} w-full`}
                    placeholder="Ingrediente..."
                    value={newItem.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    onFocus={() => newItem.nombre.length >= 2 && setShowAutocomplete(autocompleteResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                    autoFocus
                  />
                  {showAutocomplete && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-brand-card border border-brand-border rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {autocompleteResults.map(ing => (
                        <button key={ing.id} onMouseDown={() => handleSelectIngrediente(ing)} className="w-full text-left px-3 py-2 hover:bg-brand-card-hover text-sm flex items-center justify-between transition-colors">
                          <span className="text-brand-text">{ing.nombre}</span>
                          <span className="text-xs text-brand-accent">{formatPeso(ing.precio!)}/kg</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="number" className={`${inputClass} w-20`} placeholder="Cant." value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: e.target.value }))} />
                <select className={`${inputClass} w-24`} value={newItem.unidad} onChange={e => setNewItem(p => ({ ...p, unidad: e.target.value as UnidadPlato }))}>
                  <option value="gramos">g</option>
                  <option value="ml">ml</option>
                  <option value="unidad">u</option>
                </select>
                <input type="text" className={`${inputClass} w-28 ${newItem.ingredienteId ? 'border-brand-accent/50' : ''}`} placeholder="$/kg" value={newItem.precioBase} onChange={e => setNewItem(p => ({ ...p, precioBase: e.target.value, ingredienteId: null }))} />
                <input type="number" className={`${inputClass} w-16`} placeholder="Merma%" value={newItem.merma} onChange={e => setNewItem(p => ({ ...p, merma: e.target.value }))} />
                <button onClick={handleAddItem} className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors">+</button>
                <button onClick={() => setShowAddForm(false)} className="text-brand-muted hover:text-brand-text text-sm px-2 py-1.5 transition-colors">✕</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs text-brand-muted/60 hover:text-brand-accent transition-colors flex items-center gap-1.5 mt-1"
            >
              <span>+</span> Agregar ingrediente
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlatosAccordion({ platos, ingredientes, onUpdatePlato }: Props) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Set<string>>(new Set(['Entradas']))

  function toggleSeccion(sec: string) {
    setSeccionesAbiertas(prev => {
      const next = new Set(prev)
      next.has(sec) ? next.delete(sec) : next.add(sec)
      return next
    })
  }

  const totalPlatos = platos.length
  const platosConItems = platos.filter(p => p.items.length > 0).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-xs text-brand-muted">
        <span>{totalPlatos} platos</span>
        <span className="text-brand-border">·</span>
        <span className="text-brand-success">{platosConItems} con receta</span>
        <span className="text-brand-border">·</span>
        <span className="text-brand-accent">{totalPlatos - platosConItems} sin receta</span>
      </div>

      {SECCIONES.map(sec => {
        const secPlatos = platos.filter(p => p.seccion === sec)
        if (!secPlatos.length) return null
        const isOpen = seccionesAbiertas.has(sec)

        return (
          <div key={sec} className="mb-3 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => toggleSeccion(sec)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-brand-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs text-brand-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-sm font-semibold text-brand-text">{sec}</span>
                <span className="text-xs text-brand-muted/50">{secPlatos.length} platos</span>
              </div>
              <span className="text-xs text-brand-muted/40">{secPlatos.filter(p => p.items.length > 0).length}/{secPlatos.length} con receta</span>
            </button>

            {/* Platos */}
            {isOpen && (
              <div className="border-t border-brand-border/50">
                {secPlatos.map(plato => (
                  <PlatoRow key={plato.id} plato={plato} ingredientes={ingredientes} onUpdatePlato={onUpdatePlato} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
