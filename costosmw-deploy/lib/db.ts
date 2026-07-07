import { supabase } from './supabase'
import { Ingrediente, ItemPlato, Plato, Proveedor, SalsaComponentes, Unidad, UnidadPlato } from '../types'
import { initialProveedores, initialIngredientes, initialPlatos } from '../data/initialData'

// Desglose de las salsas madre. Si la tabla no existe todavía, devuelve {}.
export async function getSalsaComponentes(): Promise<SalsaComponentes> {
  try {
    const { data, error } = await supabase.from('salsa_componentes').select('*')
    if (error) return {}
    const map: SalsaComponentes = {}
    for (const row of data ?? []) {
      const salsaId = row.salsa_id as string
      if (!map[salsaId]) map[salsaId] = []
      map[salsaId].push({
        salsaId,
        nombre: row.nombre as string,
        unidad: row.unidad as string,
        cantidadPorKg: Number(row.cantidad_por_kg),
        costoPorKg: Number(row.costo_por_kg),
      })
    }
    return map
  } catch {
    return {}
  }
}

export async function getProveedores(): Promise<Proveedor[]> {
  const { data, error } = await supabase.from('proveedores').select('*')
  if (error) throw error
  return (data ?? []) as Proveedor[]
}

export async function upsertProveedor(p: Proveedor): Promise<void> {
  const { error } = await supabase.from('proveedores').upsert({ id: p.id, nombre: p.nombre })
  if (error) throw error
}

function rowToIngrediente(row: Record<string, unknown>): Ingrediente {
  return {
    id: row.id as string,
    proveedorId: row.proveedor_id as string,
    categoria: row.categoria as string,
    nombre: row.nombre as string,
    unidad: row.unidad as Unidad,
    precio: row.precio as number | null,
    updatedAt: row.updated_at as string | null,
    mermaPorDefecto: (row.merma_por_defecto as number) ?? 0,
  }
}

function ingredienteToRow(i: Ingrediente): Record<string, unknown> {
  return {
    id: i.id,
    proveedor_id: i.proveedorId,
    categoria: i.categoria,
    nombre: i.nombre,
    unidad: i.unidad,
    precio: i.precio,
    updated_at: i.updatedAt,
    merma_por_defecto: i.mermaPorDefecto,
  }
}

export async function getIngredientes(): Promise<Ingrediente[]> {
  const { data, error } = await supabase.from('ingredientes').select('*')
  if (error) throw error
  return (data ?? []).map(rowToIngrediente)
}

export async function upsertIngrediente(i: Ingrediente): Promise<void> {
  const { error } = await supabase.from('ingredientes').upsert(ingredienteToRow(i))
  if (error) throw error
}

export async function deleteIngrediente(id: string): Promise<void> {
  const { error } = await supabase.from('ingredientes').delete().eq('id', id)
  if (error) throw error
}

function itemRowToItemPlato(row: Record<string, unknown>): ItemPlato {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    ingredienteId: row.ingrediente_id as string | null,
    cantidad: row.cantidad as number,
    unidad: row.unidad as UnidadPlato,
    precioBase: row.precio_base as number,
    merma: row.merma as number,
    costoCalculado: row.costo_calculado as number,
  }
}

export async function getPlatos(): Promise<Plato[]> {
  const [platosRes, itemsRes] = await Promise.all([
    supabase.from('platos').select('*'),
    supabase.from('items_plato').select('*'),
  ])
  if (platosRes.error) throw platosRes.error
  if (itemsRes.error) throw itemsRes.error

  const itemsByPlatoId: Record<string, ItemPlato[]> = {}
  for (const row of itemsRes.data ?? []) {
    const platoId = row.plato_id as string
    if (!itemsByPlatoId[platoId]) itemsByPlatoId[platoId] = []
    itemsByPlatoId[platoId].push(itemRowToItemPlato(row as Record<string, unknown>))
  }

  return (platosRes.data ?? []).map((row) => ({
    id: row.id as string,
    nombre: row.nombre as string,
    seccion: row.seccion as string,
    precioVenta: row.precio_venta as number,
    items: itemsByPlatoId[row.id as string] ?? [],
  }))
}

export async function upsertPlato(p: Plato): Promise<void> {
  const { error: delError } = await supabase.from('items_plato').delete().eq('plato_id', p.id)
  if (delError) throw delError

  if (p.items.length > 0) {
    const itemRows = p.items.map((item) => ({
      id: item.id,
      plato_id: p.id,
      nombre: item.nombre,
      ingrediente_id: item.ingredienteId,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precio_base: item.precioBase,
      merma: item.merma,
      costo_calculado: item.costoCalculado,
    }))
    const { error: insertError } = await supabase.from('items_plato').insert(itemRows)
    if (insertError) throw insertError
  }

  const { error } = await supabase.from('platos').upsert({
    id: p.id,
    nombre: p.nombre,
    seccion: p.seccion,
    precio_venta: p.precioVenta,
  })
  if (error) throw error
}

export async function deletePlato(id: string): Promise<void> {
  const { error: delItemsError } = await supabase.from('items_plato').delete().eq('plato_id', id)
  if (delItemsError) throw delItemsError
  const { error } = await supabase.from('platos').delete().eq('id', id)
  if (error) throw error
}

export async function seedIfEmpty(): Promise<void> {
  const { count, error } = await supabase
    .from('proveedores')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  if ((count ?? 0) > 0) return

  for (const p of initialProveedores) {
    await upsertProveedor(p)
  }
  for (const i of initialIngredientes) {
    await upsertIngrediente(i)
  }
  for (const p of initialPlatos) {
    await upsertPlato(p)
  }
}
