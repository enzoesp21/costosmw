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
}

const UNIDADES: Unidad[] = ['kg', 'unidad', 'litro', 'docena', 'cajón', 'bandeja', 'bolsa']

export default function ProveedoresModule({
  proveedores, ingredientes, onAddProveedor, onUpdatePrecio, onAddIngrediente, onDeleteIngrediente
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
    if (!isNaN(num) && num > 0) {
      onUpdatePrecio(ing.id, num)
    }
    setEditPrices(prev => { const n = { ...prev }; delete n[ing.id]; return n })
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedores</span>
            <button
              onClick={() => setShowAddProv(true)}
              className="text-emerald-700 hover:text-emerald-900 text-lg font-bold leading-none"
              title="Agregar proveedor"
            >+</button>
          </div>
          <div className="text-xs text-gray-500">{totalCargados} / {ingredientes.length} precios cargados</div>
        </div>

        {showAddProv && (
          <div className="p-3 border-b border-gray-200 bg-white">
            <input
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
              placeholder="Nombre del proveedor"
              value={newProvNombre}
              onChange={e => setNewProvNombre(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newProvNombre.trim()) {
                    onAddProveedor(newProvNombre.trim())
                    setNewProvNombre('')
                    setShowAddProv(false)
                  }
                }}
                className="flex-1 bg-emerald-700 text-white rounded px-2 py-1 text-xs"
              >Guardar</button>
              <button
                onClick={() => setShowAddProv(false)}
                className="flex-1 bg-gray-200 text-gray-700 rounded px-2 py-1 text-xs"
              >Cancelar</button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
          {proveedores.map(prov => {
            const ings = ingredientes.filter(i => i.proveedorId === prov.id)
            const cargados = ings.filter(i => i.precio !== null).length
            return (
              <button
                key={prov.id}
                onClick={() => { setSelectedId(prov.id); setBusqueda('') }}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${
                  selectedId === prov.id && !busqueda ? 'bg-white border-l-2 border-l-emerald-600' : ''
                }`}
              >
                <div className="font-medium text-sm text-gray-800">{prov.nombre}</div>
                <div className="text-xs text-gray-500 mt-0.5">{cargados}/{ings.length} precios</div>
              </button>
            )
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{ingredientes.length}</div>
            <div className="text-xs text-gray-500">Total ingredientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalCargados}</div>
            <div className="text-xs text-gray-500">Con precio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{ingredientes.length - totalCargados}</div>
            <div className="text-xs text-gray-500">Sin precio</div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {!busqueda && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{currentProveedor?.nombre}</h2>
            <button
              onClick={() => setShowAddIng(true)}
              className="bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              + Agregar ingrediente
            </button>
          </div>
        )}

        {busqueda && (
          <div className="mb-4 text-sm text-gray-500">
            {currentIngredientes.length} resultado{currentIngredientes.length !== 1 ? 's' : ''} para &ldquo;{busqueda}&rdquo;
          </div>
        )}

        {showAddIng && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Nuevo ingrediente</h3>
            <div className="flex gap-3 flex-wrap">
              <input
                className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-32"
                placeholder="Nombre"
                value={newIng.nombre}
                onChange={e => setNewIng(p => ({ ...p, nombre: e.target.value }))}
              />
              <input
                className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 min-w-32"
                placeholder="Categoría"
                value={newIng.categoria}
                onChange={e => setNewIng(p => ({ ...p, categoria: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={newIng.unidad}
                onChange={e => setNewIng(p => ({ ...p, unidad: e.target.value as Unidad }))}
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <button
                onClick={() => {
                  if (newIng.nombre.trim() && newIng.categoria.trim()) {
                    onAddIngrediente({ ...newIng, proveedorId: selectedId })
                    setNewIng({ nombre: '', categoria: '', unidad: 'kg', mermaPorDefecto: 0 })
                    setShowAddIng(false)
                  }
                }}
                className="bg-emerald-700 text-white px-4 py-1.5 rounded text-sm"
              >Guardar</button>
              <button
                onClick={() => setShowAddIng(false)}
                className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm"
              >Cancelar</button>
            </div>
          </div>
        )}

        {Object.entries(byCategory).map(([cat, ings]) => (
          <div key={cat} className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{cat}</span>
              {busqueda && <span className="text-xs text-gray-400">({proveedores.find(p => p.id === ings[0].proveedorId)?.nombre})</span>}
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-4 py-2 font-medium">Ingrediente</th>
                  <th className="text-left px-4 py-2 font-medium">Unidad</th>
                  <th className="text-right px-4 py-2 font-medium">Precio</th>
                  <th className="text-right px-4 py-2 font-medium">Actualizado</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {ings.map(ing => (
                  <tr key={ing.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-sm text-gray-800">{ing.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{ing.unidad}</td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`w-32 text-right border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          ing.precio !== null ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-gray-300'
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
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-400">
                      {ing.updatedAt ? formatDate(ing.updatedAt) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {confirmDelete === ing.id ? (
                        <span className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { onDeleteIngrediente(ing.id); setConfirmDelete(null) }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >Confirmar</button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >Cancelar</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(ing.id)}
                          className="text-gray-300 hover:text-red-500 text-lg leading-none transition-colors"
                          title="Eliminar"
                        >×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </main>
    </div>
  )
}
