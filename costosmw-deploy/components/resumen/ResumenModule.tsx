'use client'

import { Plato } from '../../types'
import { formatPeso } from '../../utils/format'

interface Props {
  platos: Plato[]
}

function getFoodCostClass(fc: number) {
  if (fc <= 30) return 'text-brand-success bg-brand-success/10'
  if (fc <= 40) return 'text-amber-600 bg-amber-500/10'
  return 'text-brand-error bg-brand-error/10'
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
    XLSX.writeFile(wb, 'waikiki-costeo.xlsx')
  }

  return (
    <div className="p-3 sm:p-6 bg-brand-dark min-h-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-brand-text">Resumen general</h2>
          <p className="text-sm text-brand-muted mt-0.5">{platosConItems.length} platos con ingredientes cargados</p>
        </div>
        <button
          onClick={exportarExcel}
          disabled={rows.length === 0}
          className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Exportar Excel
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-brand-muted py-24">
          <div className="text-4xl mb-4 opacity-30">🍽</div>
          <div className="text-sm">Todavía no hay platos con ingredientes cargados.</div>
          <div className="text-xs mt-1 text-brand-muted/60">Cargá ingredientes en la sección Platos para ver el resumen aquí.</div>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="text-xs text-brand-muted border-b border-brand-border/50">
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
                <tr key={plato.id} className="border-b border-brand-border/30 hover:bg-brand-card-hover/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-brand-text">{plato.nombre}</td>
                  <td className="px-4 py-3 text-sm text-brand-muted">{plato.seccion}</td>
                  <td className="px-4 py-3 text-sm text-right text-brand-text/80">{formatPeso(costo)}</td>
                  <td className="px-4 py-3 text-sm text-right text-brand-text/80">{formatPeso(plato.precioVenta)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${getFoodCostClass(fc)}`}>
                      {fc.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-brand-muted">{margen.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-brand-success">{formatPeso(ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
