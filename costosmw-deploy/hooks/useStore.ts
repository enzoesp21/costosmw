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

export function useStore() {
  const [proveedores, setProveedoresState] = useState<Proveedor[]>([])
  const [ingredientes, setIngredientesState] = useState<Ingrediente[]>([])
  const [platos, setPlatosState] = useState<Plato[]>([])
  const [loading, setLoading] = useState(true)

  const ingredientesRef = useRef<Ingrediente[]>([])
  const platosRef = useRef<Plato[]>([])
  const proveedoresRef = useRef<Proveedor[]>([])

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
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const setProveedores = useCallback(async (v: Proveedor[]) => {
    setProveedoresState(v)
    proveedoresRef.current = v
    for (const p of v) {
      await upsertProveedor(p)
    }
  }, [])

  const setIngredientes = useCallback(async (v: Ingrediente[]) => {
    setIngredientesState(v)
    const prev = ingredientesRef.current
    ingredientesRef.current = v
    const prevIds = new Set(prev.map(i => i.id))
    const newIds = new Set(v.map(i => i.id))
    for (const i of prev) {
      if (!newIds.has(i.id)) await dbDeleteIngrediente(i.id)
    }
    for (const i of v) {
      if (!prevIds.has(i.id)) await upsertIngrediente(i)
    }
  }, [])

  const setPlatos = useCallback(async (v: Plato[]) => {
    setPlatosState(v)
    const prev = platosRef.current
    platosRef.current = v
    const prevIds = new Set(prev.map(p => p.id))
    const newIds = new Set(v.map(p => p.id))
    for (const p of prev) {
      if (!newIds.has(p.id)) await dbDeletePlato(p.id)
    }
    for (const p of v) {
      if (!prevIds.has(p.id) || true) await upsertPlato(p)
    }
  }, [])

  const actualizarPrecioIngrediente = useCallback(async (ingredienteId: string, nuevoPrecio: number) => {
    let updatedIng: Ingrediente | undefined

    setIngredientesState(prev => {
      const updated = prev.map(ing =>
        ing.id === ingredienteId
          ? { ...ing, precio: nuevoPrecio, updatedAt: new Date().toISOString() }
          : ing
      )
      updatedIng = updated.find(i => i.id === ingredienteId)
      ingredientesRef.current = updated
      return updated
    })

    setPlatosState(prev => {
      const updated = prev.map(plato => ({
        ...plato,
        items: plato.items.map(item => {
          if (item.ingredienteId !== ingredienteId) return item
          return {
            ...item,
            precioBase: nuevoPrecio,
            costoCalculado: calcularCosto(nuevoPrecio, item.cantidad, item.unidad, item.merma),
          }
        }),
      }))
      platosRef.current = updated
      Promise.all(updated.map(p => upsertPlato(p))).catch(console.error)
      return updated
    })

    if (updatedIng) {
      await upsertIngrediente(updatedIng)
    }
  }, [])

  return {
    loading,
    proveedores, setProveedores,
    ingredientes, setIngredientes,
    platos, setPlatos,
    actualizarPrecioIngrediente,
  }
}
