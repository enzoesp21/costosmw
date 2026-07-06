'use client'

import { useEffect, useState } from 'react'
import { Ingrediente, ItemPlato, Plato, UnidadPlato } from '../../types'
import { formatPeso, calcularCosto } from '../../utils/format'

interface Props {
  platos: Plato[]
  ingredientes: Ingrediente[]
  onUpdatePlato: (plato: Plato) => void
  readOnly?: boolean
}

type Filtro = 'todos' | 'con' | 'sin'

const SECCIONES = ['Entradas', 'Ensaladas', 'Arroces', 'Pescados', 'Carnes', 'Pastas', 'Fast food', 'Menú infantil']

const inputClass = 'bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-accent focus:outline-none transition-colors'

function getFoodCostColor(fc: number) {
  if (fc <= 30) return 'text-brand-success'
  if (fc <= 40) return 'text-amber-600'
  return 'text-brand-error'
}

function parsePrecio(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.'))
}

function unidadLabel(u: UnidadPlato) {
  return u === 'gramos' ? 'g' : u === 'ml' ? 'ml' : 'u'
}

function ItemRow({ item, onChange, onDelete, readOnly }: { item: ItemPlato; onChange: (item: ItemPlato) => void; onDelete: () => void; readOnly?: boolean }) {
  const [cantidad, setCantidad] = useState(String(item.cantidad))
  const [merma, setMerma] = useState(String(item.merma))

  useEffect(() => {
    setCantidad(String(item.cantidad))
    setMerma(String(item.merma))
  }, [item.cantidad, item.merma])

  function commit() {
    const c = parseFloat(cantidad)
    const m = Math.min(99, Math.max(0, parseFloat(merma) || 0))
    if (isNaN(c) || c <= 0) {
      setCantidad(String(item.cantidad))
      setMerma(String(item.merma))
      return
    }
    if (c === item.cantidad && m === item.merma) return
    onChange({ ...item, cantidad: c, merma: m, costoCalculado: calcularCosto(item.precioBase, c, item.unidad, m) })
  }

  const editClass = 'bg-transparent border border-transparent hover:border-brand-border/60 focus:border-brand-accent focus:bg-brand-dark rounded px-1 py-0.5 text-xs text-right focus:outline-none transition-colors'

  if (readOnly) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20 last:border-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-text/90">{item.nombre}</span>
          {item.ingredienteId && <span className="text-xs text-brand-accent/60">●</span>}
          <span className="text-xs text-brand-muted/60">
            {item.cantidad}{unidadLabel(item.unidad)}
            {item.merma > 0 && ` · ${item.merma}% merma`}
          </span>
        </div>
        <span className="text-sm text-brand-text/80">
          {item.costoCalculado > 0 ? formatPeso(item.costoCalculado) : <span className="text-brand-muted/40 text-xs">sin precio</span>}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20 last:border-0 group/item">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm text-brand-text/90">{item.nombre}</span>
        {item.ingredienteId && <span className="text-xs text-brand-accent/60">●</span>}
        <span className="flex items-center text-xs text-brand-muted/70">
          <input
            type="number"
            className={`${editClass} w-16 text-brand-muted`}
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
          {unidadLabel(item.unidad)}
        </span>
        <span className="flex items-center gap-1 text-xs text-brand-muted/70">
          ·
          <input
            type="number"
            min={0}
            max={99}
            className={`${editClass} w-12 text-brand-muted`}
            value={merma}
            onChange={e => setMerma(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          />
          % merma
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-text/80">
          {item.costoCalculado > 0 ? formatPeso(item.costoCalculado) : <span className="text-brand-muted/40 text-xs">sin precio</span>}
        </span>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover/item:opacity-100 text-brand-border hover:text-brand-error text-base leading-none transition-all"
        >×</button>
      </div>
    </div>
  )
}

function PrecioVentaInput({ plato, onUpdatePlato }: { plato: Plato; onUpdatePlato: (p: Plato) => void }) {
  const [val, setVal] = useState(Math.round(plato.precioVenta).toLocaleString('es-AR'))

  useEffect(() => {
    setVal(Math.round(plato.precioVenta).toLocaleString('es-AR'))
  }, [plato.precioVenta])

  function commit() {
    const num = parsePrecio(val)
    if (isNaN(num) || num <= 0) {
      setVal(Math.round(plato.precioVenta).toLocaleString('es-AR'))
      return
    }
    if (num === plato.precioVenta) return
    onUpdatePlato({ ...plato, precioVenta: num })
  }

  return (
    <span className="flex items-center gap-1 text-sm text-brand-text/80">
      $
      <input
        type="text"
        inputMode="numeric"
        className="w-24 bg-transparent border border-brand-border/40 hover:border-brand-border focus:border-brand-accent focus:bg-brand-dark rounded px-1.5 py-0.5 text-sm text-right focus:outline-none transition-colors"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      />
    </span>
  )
}

function PlatoRow({ plato, ingredientes, onUpdatePlato, forceOpen, readOnly }: { plato: Plato; ingredientes: Ingrediente[]; onUpdatePlato: (p: Plato) => void; forceOpen?: boolean; readOnly?: boolean }) {
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '', ingredienteId: null as string | null, cantidad: '', unidad: 'gramos' as UnidadPlato, precioBase: '', merma: '0' })
  const [autocompleteResults, setAutocompleteResults] = useState<Ingrediente[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const isOpen = open || !!forceOpen
  const totalCosto = plato.items.reduce((s, i) => s + i.costoCalculado, 0)
  const foodCost = plato.precioVenta > 0 ? (totalCosto / plato.precioVenta) * 100 : 0

  const nuevoValido =
    newItem.nombre.trim().length > 0 &&
    !isNaN(parseFloat(newItem.cantidad)) && parseFloat(newItem.cantidad) > 0 &&
    !isNaN(parsePrecio(newItem.precioBase)) && parsePrecio(newItem.precioBase) > 0

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
    if (!nuevoValido) return
    const cantidad = parseFloat(newItem.cantidad)
    const precioBase = parsePrecio(newItem.precioBase)
    const merma = Math.min(99, Math.max(0, parseFloat(newItem.merma) || 0))
    const item: ItemPlato = {
      id: crypto.randomUUID(),
      nombre: newItem.nombre.trim(),
      ingredienteId: newItem.ingredienteId,
      cantidad,
      unidad: newItem.unidad,
      precioBase,
      merma,
      costoCalculado: calcularCosto(precioBase, cantidad, newItem.unidad, merma),
    }
    onUpdatePlato({ ...plato, items: [...plato.items, item] })
    setNewItem({ nombre: '', ingredienteId: null, cantidad: '', unidad: 'gramos', precioBase: '', merma: '0' })
    setShowAddForm(false)
  }

  function handleChangeItem(updated: ItemPlato) {
    onUpdatePlato({ ...plato, items: plato.items.map(i => i.id === updated.id ? updated : i) })
  }

  function handleDeleteItem(itemId: string) {
    onUpdatePlato({ ...plato, items: plato.items.filter(i => i.id !== itemId) })
  }

  return (
    <div className="border-b border-brand-border/50 last:border-0">
      {/* Plato header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-card/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs transition-transform duration-200 text-brand-muted ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-sm font-medium text-brand-text text-left">{plato.nombre}</span>
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
      {isOpen && (
        <div className="bg-brand-card/20 border-t border-brand-border/30 px-5 pb-4 pt-3">
          {plato.items.length > 0 ? (
            <div className="mb-3">
              {plato.items.map(item => (
                <ItemRow key={item.id} item={item} onChange={handleChangeItem} onDelete={() => handleDeleteItem(item.id)} readOnly={readOnly} />
              ))}
              {/* Totals */}
              <div className="flex items-center justify-between pt-2 mt-1">
                <span className="text-xs text-brand-muted uppercase tracking-wide">Costo total</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-brand-text">{formatPeso(totalCosto)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                    foodCost <= 30 ? 'bg-brand-success/10 text-brand-success' :
                    foodCost <= 40 ? 'bg-amber-500/10 text-amber-600' :
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

          {/* Precio venta */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-brand-muted uppercase tracking-wide">Precio venta</span>
            {readOnly ? (
              <span className="text-sm text-brand-text/80">{formatPeso(plato.precioVenta)}</span>
            ) : (
              <PrecioVentaInput plato={plato} onUpdatePlato={onUpdatePlato} />
            )}
          </div>

          {/* Add item */}
          {readOnly ? null : showAddForm ? (
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
                <input type="number" min="0" className={`${inputClass} w-20`} placeholder="Cant." value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: e.target.value }))} />
                <select className={`${inputClass} w-24`} value={newItem.unidad} onChange={e => setNewItem(p => ({ ...p, unidad: e.target.value as UnidadPlato }))}>
                  <option value="gramos">g</option>
                  <option value="ml">ml</option>
                  <option value="unidad">u</option>
                </select>
                <input type="text" inputMode="numeric" className={`${inputClass} w-28 ${newItem.ingredienteId ? 'border-brand-accent/50' : ''}`} placeholder="$/kg" value={newItem.precioBase} onChange={e => setNewItem(p => ({ ...p, precioBase: e.target.value, ingredienteId: null }))} />
                <input type="number" min="0" max="99" className={`${inputClass} w-16`} placeholder="Merma%" value={newItem.merma} onChange={e => setNewItem(p => ({ ...p, merma: e.target.value }))} />
                <button
                  onClick={handleAddItem}
                  disabled={!nuevoValido}
                  className="bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >+</button>
                <button onClick={() => setShowAddForm(false)} className="text-brand-muted hover:text-brand-text text-sm px-2 py-1.5 transition-colors">✕</button>
              </div>
              {!nuevoValido && newItem.nombre.length > 0 && (
                <div className="text-xs text-brand-muted/50 mt-2">Completá nombre, cantidad y precio para agregar.</div>
              )}
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

export default function PlatosAccordion({ platos, ingredientes, onUpdatePlato, readOnly }: Props) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Set<string>>(new Set(['Entradas']))
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  function toggleSeccion(sec: string) {
    setSeccionesAbiertas(prev => {
      const next = new Set(prev)
      next.has(sec) ? next.delete(sec) : next.add(sec)
      return next
    })
  }

  const q = busqueda.trim().toLowerCase()
  const filtrando = q.length > 0 || filtro !== 'todos'

  const visibles = platos.filter(p => {
    if (q && !p.nombre.toLowerCase().includes(q)) return false
    if (filtro === 'sin' && p.items.length > 0) return false
    if (filtro === 'con' && p.items.length === 0) return false
    return true
  })

  const totalPlatos = platos.length
  const platosConItems = platos.filter(p => p.items.length > 0).length

  const filtros: [Filtro, string][] = [['todos', 'Todos'], ['con', 'Con receta'], ['sin', 'Sin receta']]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Search + filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar plato..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className={`${inputClass} flex-1 min-w-48`}
        />
        <div className="flex gap-1">
          {filtros.map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f ? 'bg-brand-card text-brand-text border border-brand-border' : 'text-brand-muted hover:text-brand-text border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-xs text-brand-muted">
        {filtrando ? (
          <span>{visibles.length} resultado{visibles.length !== 1 ? 's' : ''}</span>
        ) : (
          <>
            <span>{totalPlatos} platos</span>
            <span className="text-brand-border">·</span>
            <span className="text-brand-success">{platosConItems} con receta</span>
            <span className="text-brand-border">·</span>
            <span className="text-brand-accent">{totalPlatos - platosConItems} sin receta</span>
          </>
        )}
      </div>

      {visibles.length === 0 && (
        <div className="text-center text-brand-muted/60 text-sm py-16">
          No se encontraron platos{q ? ` para "${busqueda.trim()}"` : ''}.
        </div>
      )}

      {SECCIONES.map(sec => {
        const secPlatos = visibles.filter(p => p.seccion === sec)
        if (!secPlatos.length) return null
        const isOpen = filtrando || seccionesAbiertas.has(sec)

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
                  <PlatoRow key={plato.id} plato={plato} ingredientes={ingredientes} onUpdatePlato={onUpdatePlato} forceOpen={q.length > 0 && visibles.length <= 3} readOnly={readOnly} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
