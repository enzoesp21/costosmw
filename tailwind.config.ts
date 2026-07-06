import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Tema claro cremita (los nombres se mantienen por compatibilidad:
          // "dark" es el fondo de página, "card" las tarjetas)
          dark: '#f2ede3',
          card: '#fdfbf6',
          'card-hover': '#f5efe3',
          border: '#ddd3bf',
          accent: '#d97757',
          'accent-hover': '#c86644',
          text: '#3d3929',
          muted: '#8a8371',
          success: '#4e8a5f',
          error: '#c94f4f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
