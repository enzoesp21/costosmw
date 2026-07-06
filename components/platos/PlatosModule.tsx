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
  if (fc <= 30) return 'text-emerald-600 bg-emerald-50'
  if (fc <= 40) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
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
      const results = ingredientes.filter(i =>
        i.nombre.toLowerCase().includes(value.toLowerCase()) && i.precio !== null
      )
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
    const costo = calcularCosto(precioBase, cantidad, newItem.unidad, mermaVal)
    const item: ItemPlato = {
      id: crypto.randomUUID(),
      nombre: newItem.nombre,
      ingredienteId: newItem.ingredienteId,
      cantidad,
      unidad: newItem.unidad,
      precioBase,
      merma: mermaVal,
      costoCalculado: costo,
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

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Platos</div>
          <div className="text-xs text-gray-500">{platosConItems} de {platos.length} cargados</div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${platos.length > 0 ? (platosConItems / platos.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {SECCIONES.map(sec => {
            const secPlatos = bySeccion[sec] ?? []
            if (!secPlatos.length) return null
            return (
              <div key={sec}>
                <div className="px-4 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide sticky top-0">
                  {sec}
                </div>
                {secPlatos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatoId(p.id)}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-100 hover:bg-white transition-colors flex items-center justify-between ${
                      selectedPlatoId === p.id ? 'bg-white border-l-2 border-l-emerald-600' : ''
                    }`}
                  >
                    <span className="text-sm text-gray-800 leading-tight">{p.nombre}</span>
                    {p.items.length > 0 && (
                      <span className="text-emerald-500 text-base ml-1 shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {plato ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{plato.nombre}</h2>
                <div className="text-sm text-gray-500 mt-0.5">
                  {plato.seccion} · Precio de venta: <span className="font-medium text-gray-700">{formatPeso(plato.precioVenta)}</span>
                </div>
              </div>
              {plato.items.length > 0 && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{formatPeso(totalCosto)}</div>
                    <div className="text-xs text-gray-500">Costo total</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold px-2 py-0.5 rounded ${getFoodCostColor(foodCost)}`}>
                      {foodCost.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Food cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700">{margen.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Margen bruto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">{formatPeso(gananciaPorPlato)}</div>
                    <div className="text-xs text-gray-500">Ganancia</div>
                  </div>
                </div>
              )}
            </div>

            {plato.items.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-2 font-medium">Ingrediente</th>
                      <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                      <th className="text-right px-4 py-2 font-medium">Precio/kg (u)</th>
                      <th className="text-right px-4 py-2 font-medium">Merma %</th>
                      <th className="text-right px-4 py-2 font-medium">Costo</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plato.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {item.nombre}
                          {item.ingredienteId && <span className="ml-1 text-xs text-emerald-600">●</span>}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">
                          {item.cantidad} {item.unidad === 'gramos' ? 'g' : item.unidad === 'ml' ? 'ml' : 'u'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">{formatPeso(item.precioBase)}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">{item.merma}%</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-800">{formatPeso(item.costoCalculado)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors"
                          >×</button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={4} className="px-4 py-2 text-sm font-semibold text-gray-700 text-right">Total costo real</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-800 text-right">{formatPeso(totalCosto)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar ingrediente</h3>
              <div className="flex gap-3 flex-wrap items-end">
                <div className="relative flex-1 min-w-40">
                  <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nombre del ingrediente"
                    value={newItem.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    onFocus={() => newItem.nombre.length >= 2 && setShowAutocomplete(autocompleteResults.length > 0)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                  />
                  {showAutocomplete && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {autocompleteResults.map(ing => (
                        <button
                          key={ing.id}
                          onMouseDown={() => handleSelectIngrediente(ing)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm flex items-center justify-between"
                        >
                          <span>{ing.nombre}</span>
                          <span className="text-xs text-emerald-600 ml-2">{formatPeso(ing.precio!)}/kg</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                    value={newItem.cantidad}
                    onChange={e => setNewItem(p => ({ ...p, cantidad: e.target.value }))}
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newItem.unidad}
                    onChange={e => setNewItem(p => ({ ...p, unidad: e.target.value as UnidadPlato }))}
                  >
                    <option value="gramos">Gramos</option>
                    <option value="ml">Mililitros</option>
                    <option value="unidad">Unidad</option>
                  </select>
                </div>
                <div className="w-36">
                  <label className="block text-xs text-gray-500 mb-1">Precio/kg (o unidad)</label>
                  <input
                    type="text"
                    className={`w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      newItem.ingredienteId ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'
                    }`}
                    placeholder="$ precio"
                    value={newItem.precioBase}
                    onChange={e => setNewItem(p => ({ ...p, precioBase: e.target.value, ingredienteId: null }))}
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Merma %</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newItem.merma}
                    onChange={e => setNewItem(p => ({ ...p, merma: e.target.value }))}
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  className="bg-emerald-700 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-800 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-center mt-20">Seleccioná un plato</div>
        )}
      </main>
    </div>
  )
}
