'use client'

type Tab = 'proveedores' | 'platos' | 'resumen'

interface Props {
  activeTab: Tab
  onTabChange: (t: Tab) => void
}

const TAB_LABELS: Record<Tab, string> = {
  proveedores: 'Proveedores',
  platos: 'Platos',
  resumen: 'Resumen',
}

export default function Navbar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="bg-brand-dark border-b border-brand-border px-6 py-3 flex items-center gap-8">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-brand-accent flex items-center justify-center">
          <span className="text-white text-xs font-semibold">O</span>
        </div>
        <span className="text-brand-text text-sm font-semibold tracking-tight">Oliovita</span>
        <span className="text-brand-muted text-xs">· Costos</span>
      </div>
      <div className="flex gap-1 ml-2">
        {(['proveedores', 'platos', 'resumen'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-card text-brand-text'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-card/50'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </nav>
  )
}
