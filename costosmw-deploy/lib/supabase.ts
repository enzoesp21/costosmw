import { createClient } from '@supabase/supabase-js'

// Fallbacks por si las env vars no están configuradas en Vercel.
// La anon key es pública por diseño (viaja en el bundle del navegador).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fifetjnemsfifgedcsur.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmV0am5lbXNmaWZnZWRjc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDI3MzMsImV4cCI6MjA5ODkxODczM30.xr_P0wPrXJZj2sMQ3g7DLc8ceZTz0MkWwiqNnjAGppQ'

export const supabase = createClient(url, key)
