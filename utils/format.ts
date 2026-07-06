export function formatPeso(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function calcularCosto(
  precioBase: number,
  cantidad: number,
  unidad: 'gramos' | 'ml' | 'unidad',
  merma: number
): number {
  const factor = 1 - merma / 100
  if (factor <= 0) return 0
  if (unidad === 'unidad') {
    return (precioBase * cantidad) / factor
  }
  return (precioBase / 1000 * cantidad) / factor
}
