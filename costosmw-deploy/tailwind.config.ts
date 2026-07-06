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
          dark: '#dbd2b5',
          card: '#ffffff',
          border: '#cab892',
          accent: '#6e8f7a',
          text: '#1f2d27',
        },
      },
    },
  },
  plugins: [],
}
export default config
