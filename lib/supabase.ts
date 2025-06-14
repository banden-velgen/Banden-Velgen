import { createClient } from "@supabase/supabase-js"

// Environment variables are automatically available in Vercel deployments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simplified types
export type Product = {
  id: string
  type: "tire" | "rim"
  brand: string
  model: string
  specifications: string
  price: number
  stock: number
  created_at: string
}

export type UserProfile = {
  id: string
  email: string
  role: "admin" | "buyer"
  created_at: string
}
