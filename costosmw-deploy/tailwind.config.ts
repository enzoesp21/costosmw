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
          dark: '#1a1916',
          card: '#2a2925',
          'card-hover': '#333330',
          border: '#3d3d38',
          accent: '#d97757',
          'accent-hover': '#c86644',
          text: '#ede8df',
          muted: '#8c877e',
          success: '#5a9e6f',
          error: '#e05c5c',
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
