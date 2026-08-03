'use client'

import { useState } from 'react'
import { Ingrediente, SalsaComponentes } from '../../types'
import { formatPeso } from '../../utils/format'

interface Props {
  ingredientes: Ingrediente[]
  salsaComponentes: SalsaComponentes
}

function SalsaCard({ salsa, componentes }: { salsa: Ingrediente; componentes: { nombre: string; unidad: string; cantidadPorKg: number; costoPorKg: number }[] }) {
  const [open, setOpen] = useState(false)
  const sinPrecio = componentes.filter(c => c.costoPorKg <= 0)

  return (
    <div className="mb-3 bg-brand-card border border-brand-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 hover:bg-brand-card-hover transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className={`text-xs text-brand-sage transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="text-sm font-semibold text-brand-text text-left">{salsa.nombre}</span>
          {componentes.length > 0 && (
            <span className="text-xs text-brand-muted/60 whitespace-nowrap">{componentes.length} ingredientes</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {sinPrecio.length > 0 && (
            <span className="text-xs text-amber-600 hidden sm:inline">{sinPrecio.length} sin precio</span>
          )}
          <span className="text-sm text-brand-text/80">
            {salsa.precio ? `${formatPeso(salsa.precio)}/kg` : <span className="text-brand-muted/40 text-xs">sin costo</span>}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-brand-border/50 px-4 sm:px-5 py-3 bg-brand-dark/40">
          {componentes.length === 0 ? (
            <div className="text-xs text-brand-muted/60 py-2">
              Todavía no cargaste la receta de esta salsa.
            </div>
          ) : (
            <>
              <div className="text-xs text-brand-muted uppercase tracking-wide mb-2">Por kilo de salsa</div>
              {componentes.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-brand-border/20 last:border-0">
                  <span className="text-sm text-brand-text/90">
                    {c.nombre}{' '}
                    <span className="text-xs text-brand-muted/60">
                      {c.unidad === 'unidad'
                        ? `${c.cantidadPorKg.toFixed(2)} u`
                        : `${c.cantidadPorKg < 10 ? c.cantidadPorKg.toFixed(1) : Math.round(c.cantidadPorKg)} g`}
                    </span>
                  </span>
                  <span className="text-sm text-brand-text/80">
                    {c.costoPorKg > 0 ? formatPeso(c.costoPorKg) : <span className="text-amber-600 text-xs">sin precio</span>}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-1">
                <span className="text-xs text-brand-muted uppercase tracking-wide">Costo por kg</span>
                <span className="text-sm font-semibold text-brand-sage">
                  {salsa.precio ? formatPeso(salsa.precio) : '—'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function SalsasModule({ ingredientes, salsaComponentes }: Props) {
  const salsas = ingredientes
    .filter(i => i.categoria === 'Salsas' || i.proveedorId === 'produccion')
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const conReceta = salsas.filter(s => (salsaComponentes[s.id]?.length ?? 0) > 0).length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-brand-text">Salsas base</h2>
        <p className="text-xs text-brand-muted mt-1">
          Elaboración propia · {salsas.length} salsas · {conReceta} con receta cargada
        </p>
      </div>

      {salsas.length === 0 && (
        <div className="text-center text-brand-muted/60 text-sm py-16">
          No hay salsas de elaboración propia cargadas.
        </div>
      )}

      {salsas.map(s => (
        <SalsaCard key={s.id} salsa={s} componentes={salsaComponentes[s.id] ?? []} />
      ))}
    </div>
  )
}
