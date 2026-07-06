'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Ingrediente, Plato, Proveedor } from '../types'
import { calcularCosto } from '../utils/format'
import {
  seedIfEmpty,
  getProveedores,
  getIngredientes,
  getPlatos,
  upsertProveedor,
  upsertIngrediente,
  deleteIngrediente as dbDeleteIngrediente,
  upsertPlato,
  deletePlato as dbDeletePlato,
} from '../lib/db'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function changed(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b)
}

export function useStore() {
  const [proveedores, setProveedoresState] = useState<Proveedor[]>([])
  const [ingredientes, setIngredientesState] = useState<Ingrediente[]>([])
  const [platos, setPlatosState] = useState<Plato[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const ingredientesRef = useRef<Ingrediente[]>([])
  const platosRef = useRef<Plato[]>([])
  const proveedoresRef = useRef<Proveedor[]>([])
  const pendingRef = useRef(0)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function init() {
      try {
        await seedIfEmpty()
        const [provs, ings, plts] = await Promise.all([
          getProveedores(),
          getIngredientes(),
          getPlatos(),
        ])
        setProveedoresState(provs)
        proveedoresRef.current = provs
        setIngredientesState(ings)
        ingredientesRef.current = ings
        setPlatosState(plts)
        platosRef.current = plts
        if (provs.length === 0 && ings.length === 0 && plts.length === 0) {
          setLoadError('Conectó a Supabase pero no encontró datos. Revisá que las tablas tengan filas y que RLS no esté bloqueando la lectura.')
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err)
        setLoadError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const track = useCallback((ops: Promise<unknown>[]) => {
    if (ops.length === 0) return
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
      if (changed(prevById.get(p.id), p)) ops.push(upsertPlato(p))
    }
    track(ops)
  }, [track])

  const updatePlato = useCallback((plato: Plato) => {
    const updated = platosRef.current.map(p => (p.id === plato.id ? plato : p))
    setPlatosState(updated)
    platosRef.current = updated
    track([upsertPlato(plato)])
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

    const afectados: Plato[] = []
    const platosNuevos = platosRef.current.map(plato => {
      if (!plato.items.some(i => i.ingredienteId === ingredienteId)) return plato
      const nuevo = {
        ...plato,
        items: plato.items.map(item =>
          item.ingredienteId !== ingredienteId
            ? item
            : {
                ...item,
                precioBase: nuevoPrecio,
                costoCalculado: calcularCosto(nuevoPrecio, item.cantidad, item.unidad, item.merma),
              }
        ),
      }
      afectados.push(nuevo)
      return nuevo
    })
    setPlatosState(platosNuevos)
    platosRef.current = platosNuevos

    const ops: Promise<unknown>[] = afectados.map(p => upsertPlato(p))
    if (updatedIng) ops.push(upsertIngrediente(updatedIng))
    track(ops)
  }, [track])

  return {
    loading,
    loadError,
    saveStatus,
    proveedores, setProveedores,
    ingredientes, setIngredientes,
    platos, setPlatos, updatePlato,
    actualizarPrecioIngrediente,
  }
}
