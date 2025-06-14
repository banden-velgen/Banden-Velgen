"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Product, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Eye, ShoppingCart } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"tire" | "rim">("tire")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    checkUser()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, activeTab])

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
        setProfile(profileData)
      }
    } catch (error) {
      console.error("Error checking user:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products.filter((product) => product.type === activeTab)

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.specifications.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredProducts(filtered)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Autobanden en Velgen" className="h-10 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Autobanden en Velgen</h1>
                <p className="text-sm text-gray-600">Nieuw of 2e hands</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {profile?.role === "admin" && (
                    <Link href="/admin">
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <span className="text-sm text-gray-600">Welkom, {user.email}</span>
                  <Button onClick={handleSignOut} variant="outline">
                    Uitloggen
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Inloggen</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Registreren</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tire" | "rim")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tire">Autobanden</TabsTrigger>
            <TabsTrigger value="rim">Velgen</TabsTrigger>
          </TabsList>

          <div className="mb-6">
            <Input
              placeholder="Zoeken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <TabsContent value="tire">
            <ProductTable products={filteredProducts} loading={loading} />
          </TabsContent>

          <TabsContent value="rim">
            <ProductTable products={filteredProducts} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ProductTable({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="border rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Merk</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Specificaties</TableHead>
            <TableHead>Prijs (€)</TableHead>
            <TableHead>Voorraad</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-sm">{product.id}</TableCell>
              <TableCell>{product.brand}</TableCell>
              <TableCell>{product.model}</TableCell>
              <TableCell>{product.specifications}</TableCell>
              <TableCell>€{product.price.toFixed(2)}</TableCell>
              <TableCell>
                <span className={product.stock < 10 ? "text-red-600 font-semibold" : ""}>{product.stock}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
