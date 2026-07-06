'use client'

import { Plato } from '../../types'
import { formatPeso } from '../../utils/format'

interface Props {
  platos: Plato[]
}

function getFoodCostClass(fc: number) {
  if (fc <= 30) return 'text-emerald-600 bg-emerald-50 font-medium'
  if (fc <= 40) return 'text-amber-600 bg-amber-50 font-medium'
  return 'text-red-600 bg-red-50 font-medium'
}

export default function ResumenModule({ platos }: Props) {
  const platosConItems = platos.filter(p => p.items.length > 0)

  const rows = platosConItems.map(p => {
    const costo = p.items.reduce((s, i) => s + i.costoCalculado, 0)
    const fc = p.precioVenta > 0 ? (costo / p.precioVenta) * 100 : 0
    const margen = 100 - fc
    const ganancia = p.precioVenta - costo
    return { plato: p, costo, fc, margen, ganancia }
  })

  async function exportarExcel() {
    const XLSX = await import('xlsx')
    const data = rows.map(r => ({
      'Plato': r.plato.nombre,
      'Sección': r.plato.seccion,
      'Costo': Math.round(r.costo),
      'Precio Venta': r.plato.precioVenta,
      'Food Cost %': parseFloat(r.fc.toFixed(1)),
      'Margen %': parseFloat(r.margen.toFixed(1)),
      'Ganancia': Math.round(r.ganancia),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen')
    XLSX.writeFile(wb, 'oliovita-costeo.xlsx')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Resumen general</h2>
          <p className="text-sm text-gray-500 mt-1">{platosConItems.length} platos con ingredientes cargados</p>
        </div>
        <button
          onClick={exportarExcel}
          disabled={rows.length === 0}
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Exportar a Excel
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <div className="text-4xl mb-3">🍽</div>
          <div>Todavía no hay platos con ingredientes cargados.</div>
          <div className="text-sm mt-1">Cargá ingredientes en la sección Platos para ver el resumen aquí.</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">Plato</th>
                <th className="text-left px-4 py-3 font-medium">Sección</th>
                <th className="text-right px-4 py-3 font-medium">Costo</th>
                <th className="text-right px-4 py-3 font-medium">Precio venta</th>
                <th className="text-right px-4 py-3 font-medium">Food cost</th>
                <th className="text-right px-4 py-3 font-medium">Margen</th>
                <th className="text-right px-4 py-3 font-medium">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ plato, costo, fc, margen, ganancia }) => (
                <tr key={plato.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">{plato.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{plato.seccion}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{formatPeso(costo)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{formatPeso(plato.precioVenta)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm px-2 py-0.5 rounded ${getFoodCostClass(fc)}`}>
                      {fc.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">{margen.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{formatPeso(ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
