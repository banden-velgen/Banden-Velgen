export type UserRole = "admin" | "buyer"
export type ProductType = "tire" | "rim"

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface Product {
  id: string
  type: ProductType
  brand: string
  model: string
  specifications: string
  price: number
  stock: number
  image_url?: string
  created_at: string
  status: string // 'Nieuw' or '2e hands'
}
