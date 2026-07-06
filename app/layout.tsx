import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mirador Waikiki · Costos',
  description: 'Sistema de costeo gastronómico',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
