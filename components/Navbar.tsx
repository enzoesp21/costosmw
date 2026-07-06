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
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-emerald-700">Oliovita</span>
        <span className="text-xs text-gray-400 font-medium">· Costos</span>
      </div>
      <div className="flex gap-1 ml-4">
        {(['proveedores', 'platos', 'resumen'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-emerald-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </nav>
  )
}
