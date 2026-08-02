export type Unidad = 'kg' | 'unidad' | 'litro' | 'docena' | 'cajón' | 'bandeja' | 'bolsa'

export interface Ingrediente {
  id: string
  proveedorId: string
  categoria: string
  nombre: string
  unidad: Unidad
  precio: number | null
  updatedAt: string | null
  mermaPorDefecto: number
}

export interface Proveedor {
  id: string
  nombre: string
}

export type UnidadPlato = 'gramos' | 'ml' | 'unidad'

export interface ItemPlato {
  id: string
  nombre: string
  ingredienteId: string | null
  cantidad: number
  unidad: UnidadPlato
  precioBase: number
  merma: number
  costoCalculado: number
}

export interface Plato {
  id: string
  nombre: string
  seccion: string
  precioVenta: number
  items: ItemPlato[]
  /** Marcado a mano cuando la receta está confirmada como completa */
  verificado?: boolean
}

/** Estado de carga de un plato, calculado a partir de sus ítems */
export type EstadoPlato = 'sin-receta' | 'falta-precio' | 'costeado' | 'verificado'

// Componente de una salsa madre (para desglosar el costo dentro de un plato)
export interface SalsaComponente {
  salsaId: string
  nombre: string
  unidad: string
  cantidadPorKg: number
  costoPorKg: number
}

export type SalsaComponentes = Record<string, SalsaComponente[]>
