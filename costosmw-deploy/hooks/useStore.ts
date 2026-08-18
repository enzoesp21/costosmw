'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Ingrediente, Plato, Proveedor, SalsaComponentes } from '../types'
import { calcularCosto } from '../utils/format'
import {
  seedIfEmpty,
  getProveedores,
  getIngredientes,
  getPlatos,
  getSalsaComponentes,
  upsertProveedor,
  upsertIngrediente,
  updateItemPrecio,
  deleteIngrediente as dbDeleteIngrediente,
  upsertPlato,
  upsertItemPlato,
  deleteItemPlato,
  updatePlatoCampos,
  setPlatoVerificado,
  deletePlato as dbDeletePlato,
} from '../lib/db'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function changed(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

// Los errores de Supabase (PostgrestError) son objetos planos, no Error
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    const parts = [e.message, e.details, e.hint, e.code].filter(Boolean)
    if (parts.length) return parts.join(' · ')
    try { return JSON.stringify(err) } catch { /* circular */ }
  }
  return String(err)
}

export function useStore() {
  const [proveedores, setProveedoresState] = useState<Proveedor[]>([])
  const [ingredientes, setIngredientesState] = useState<Ingrediente[]>([])
  const [platos, setPlatosState] = useState<Plato[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [salsaComponentes, setSalsaComponentes] = useState<SalsaComponentes>({})

  const ingredientesRef = useRef<Ingrediente[]>([])
  const platosRef = useRef<Plato[]>([])
  const proveedoresRef = useRef<Proveedor[]>([])
  const pendingRef = useRef(0)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Candado de seguridad: solo se permite escribir si la carga inicial trajo datos.
  // Evita que una carga vacía (por error de red) borre las recetas al guardar.
  const canWriteRef = useRef(false)

  useEffect(() => {
    async function init() {
      try {
        await seedIfEmpty()
        const [provs, ings, plts, salsas] = await Promise.all([
          getProveedores(),
          getIngredientes(),
          getPlatos(),
          getSalsaComponentes(),
        ])
        setProveedoresState(provs)
        proveedoresRef.current = provs
        setIngredientesState(ings)
        ingredientesRef.current = ings
        setPlatosState(plts)
        platosRef.current = plts
        setSalsaComponentes(salsas)
        if (provs.length === 0 && ings.length === 0 && plts.length === 0) {
          setLoadError('Conectó a Supabase pero no encontró datos. Revisá que las tablas tengan filas y que RLS no esté bloqueando la lectura.')
        } else if (plts.length > 0) {
          // Carga válida con platos: recién ahora habilitamos guardar
          canWriteRef.current = true
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
        let msg = errorMessage(err)
        // Diagnóstico: petición cruda para ver el status HTTP y el cuerpo real
        try {
          const { SUPABASE_URL, SUPABASE_KEY } = await import('../lib/supabase')
          const res = await fetch(`${SUPABASE_URL}/rest/v1/proveedores?select=id&limit=1`, {
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          })
          const body = (await res.text()).slice(0, 300)
          msg += ` — Diagnóstico: HTTP ${res.status} → ${body || '(respuesta vacía)'}`
        } catch (e2) {
          msg += ` — Diagnóstico: no se pudo conectar a Supabase (${e2 instanceof Error ? e2.message : String(e2)}). ¿Proyecto pausado o URL incorrecta?`
        }
        setLoadError(msg)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const track = useCallback((ops: Promise<unknown>[]) => {
    if (ops.length === 0) return
    // Candado: si la app no cargó datos reales, no escribimos (previene borrados)
    if (!canWriteRef.current) {
      console.warn('Escritura bloqueada: la app no cargó datos correctamente. Recargá la página.')
      setSaveStatus('error')
      return
    }
    pendingRef.current += 1
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    Promise.all(ops)
      .then(() => {
        pendingRef.current -= 1
        if (pendingRef.current === 0) {
          setSaveStatus('saved')
          savedTimerRef.current = setTimeout(() => {
            setSaveStatus(s => (s === 'saved' ? 'idle' : s))
          }, 2500)
        }
      })
      .catch(err => {
        pendingRef.current -= 1
        console.error('Error guardando en Supabase:', err)
        setSaveStatus('error')
      })
  }, [])

  const setProveedores = useCallback((v: Proveedor[]) => {
    const prev = proveedoresRef.current
    setProveedoresState(v)
    proveedoresRef.current = v
    const prevById = new Map(prev.map(p => [p.id, p]))
    track(v.filter(p => changed(prevById.get(p.id), p)).map(p => upsertProveedor(p)))
  }, [track])

  const setIngredientes = useCallback((v: Ingrediente[]) => {
    const prev = ingredientesRef.current
    setIngredientesState(v)
    ingredientesRef.current = v
    const prevById = new Map(prev.map(i => [i.id, i]))
    const newIds = new Set(v.map(i => i.id))
    const ops: Promise<unknown>[] = []
    for (const i of prev) {
      if (!newIds.has(i.id)) ops.push(dbDeleteIngrediente(i.id))
    }
    for (const i of v) {
      if (changed(prevById.get(i.id), i)) ops.push(upsertIngrediente(i))
    }
    track(ops)
  }, [track])

  const setPlatos = useCallback((v: Plato[]) => {
    const prev = platosRef.current
    setPlatosState(v)
    platosRef.current = v
    const prevById = new Map(prev.map(p => [p.id, p]))
    const newIds = new Set(v.map(p => p.id))
    const ops: Promise<unknown>[] = []
    for (const p of prev) {
      if (!newIds.has(p.id)) ops.push(dbDeletePlato(p.id))
    }
    for (const p of v) {
      const prev = prevById.get(p.id)
      if (!changed(prev, p)) continue
      const prevItems = prev?.items ?? []
      const prevItemsById = new Map(prevItems.map(i => [i.id, i]))
      const idsActuales = new Set(p.items.map(i => i.id))
      for (const item of p.items) {
        if (changed(prevItemsById.get(item.id), item)) ops.push(upsertItemPlato(p.id, item))
      }
      for (const item of prevItems) {
        if (!idsActuales.has(item.id)) ops.push(deleteItemPlato(item.id))
      }
      if (!prev || prev.nombre !== p.nombre || prev.precioVenta !== p.precioVenta || prev.seccion !== p.seccion) {
        ops.push(updatePlatoCampos(p))
      }
    }
    track(ops)
  }, [track])

  /** Marca/desmarca "verificado" sin reescribir la receta del plato */
  const toggleVerificado = useCallback((platoId: string, verificado: boolean) => {
    const updated = platosRef.current.map(p =>
      p.id === platoId ? { ...p, verificado } : p
    )
    setPlatosState(updated)
    platosRef.current = updated
    track([setPlatoVerificado(platoId, verificado)])
  }, [track])

  /**
   * Guarda SOLO lo que cambió respecto al estado en memoria: ítems nuevos,
   * ítems modificados y los que el usuario borró explícitamente.
   * Nunca borra ítems que la app no conoce (p. ej. cargados por SQL).
   */
  const updatePlato = useCallback((plato: Plato) => {
    const anterior = platosRef.current.find(p => p.id === plato.id)
    const updated = platosRef.current.map(p => (p.id === plato.id ? plato : p))
    setPlatosState(updated)
    platosRef.current = updated

    const ops: Promise<unknown>[] = []
    const prevItems = anterior?.items ?? []
    const prevById = new Map(prevItems.map(i => [i.id, i]))
    const nuevosIds = new Set(plato.items.map(i => i.id))

    for (const item of plato.items) {
      if (changed(prevById.get(item.id), item)) ops.push(upsertItemPlato(plato.id, item))
    }
    for (const item of prevItems) {
      if (!nuevosIds.has(item.id)) ops.push(deleteItemPlato(item.id))
    }
    if (!anterior ||
        anterior.nombre !== plato.nombre ||
        anterior.precioVenta !== plato.precioVenta ||
        anterior.seccion !== plato.seccion) {
      ops.push(updatePlatoCampos(plato))
    }
    track(ops)
  }, [track])

  const actualizarPrecioIngrediente = useCallback((ingredienteId: string, nuevoPrecio: number) => {
    const ings = ingredientesRef.current.map(ing =>
      ing.id === ingredienteId
        ? { ...ing, precio: nuevoPrecio, updatedAt: new Date().toISOString() }
        : ing
    )
    setIngredientesState(ings)
    ingredientesRef.current = ings
    const updatedIng = ings.find(i => i.id === ingredienteId)

    // Actualizamos SOLO los ítems afectados, en su lugar (sin borrar/reescribir recetas)
    const ops: Promise<unknown>[] = []
    const platosNuevos = platosRef.current.map(plato => {
      if (!plato.items.some(i => i.ingredienteId === ingredienteId)) return plato
      return {
        ...plato,
        items: plato.items.map(item => {
          if (item.ingredienteId !== ingredienteId) return item
          const costo = calcularCosto(nuevoPrecio, item.cantidad, item.unidad, item.merma)
          ops.push(updateItemPrecio(item.id, nuevoPrecio, costo))
          return { ...item, precioBase: nuevoPrecio, costoCalculado: costo }
        }),
      }
    })
    setPlatosState(platosNuevos)
    platosRef.current = platosNuevos

    if (updatedIng) ops.push(upsertIngrediente(updatedIng))
    track(ops)
  }, [track])

  return {
    loading,
    loadError,
    saveStatus,
    salsaComponentes,
    proveedores, setProveedores,
    ingredientes, setIngredientes,
    platos, setPlatos, updatePlato, toggleVerificado,
    actualizarPrecioIngrediente,
  }
}
