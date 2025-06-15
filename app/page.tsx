"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Product, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Eye, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"tire" | "rim">("tire")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderFormProduct, setOrderFormProduct] = useState<Product | null>(null)
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchProducts()
    checkUser()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, activeTab, sortField, sortDirection])

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

    // Apply sorting
    filtered = sortProducts(filtered)
    setFilteredProducts(filtered)
  }

  const sortProducts = (products: Product[]) => {
    if (!sortField) return products

    return [...products].sort((a, b) => {
      let aValue = a[sortField as keyof Product]
      let bValue = b[sortField as keyof Product]

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue === undefined || bValue === undefined) return 0
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
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

  const ProductDetailsPopup = ({
    product,
    onClose,
    onOrder,
  }: { product: Product; onClose: () => void; onOrder: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Product Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {product.image_url && (
          <img
            src={product.image_url}
            alt={`${product.brand} ${product.model}`}
            className="w-64 h-64 object-cover rounded-md mb-4 mx-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.jpg";
            }}
          />
        )}

        <div className="space-y-2 mb-6">
          <p>
            <strong>ID:</strong> {product.id}
          </p>
          <p>
            <strong>Type:</strong> {product.type === "tire" ? "Band" : "Velg"}
          </p>
          <p>
            <strong>Merk:</strong> {product.brand}
          </p>
          <p>
            <strong>Model:</strong> {product.model}
          </p>
          <p>
            <strong>Specificaties:</strong> {product.specifications}
          </p>
          <p>
            <strong>Prijs:</strong> €{product.price.toFixed(2)}
          </p>
          <p>
            <strong>Voorraad:</strong>{" "}
            {product.stock === 0 ? (
              <span className="text-red-600 font-semibold">Uitverkocht</span>
            ) : (
              product.stock
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {product.stock > 0 ? (
            <Button onClick={onOrder} className="flex-1">
              Bestellen
            </Button>
          ) : (
            <div className="flex-1 text-center py-2 px-4 bg-gray-100 rounded-md">
              <span className="text-red-600 font-semibold">Uitverkocht</span>
            </div>
          )}
          <Button variant="outline" onClick={onClose}>
            Sluiten
          </Button>
        </div>
      </div>
    </div>
  )

  const OrderFormPopup = ({ product, onClose }: { product: Product; onClose: () => void }) => {
    const [orderData, setOrderData] = useState({
      name: "",
      email: "",
      phone: "",
      quantity: 1,
      message: "",
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitting(true)

      // Simulate order submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert(`Bestelling verzonden voor ${product.brand} ${product.model}!`)
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Bestelling Plaatsen</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="font-semibold">
              {product.brand} {product.model}
            </p>
            <p className="text-sm text-gray-600">{product.specifications}</p>
            <p className="text-sm">€{product.price.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={orderData.name}
                onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={orderData.email}
                onChange={(e) => setOrderData({ ...orderData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                value={orderData.phone}
                onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Aantal *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={product.stock}
                value={orderData.quantity}
                onChange={(e) => setOrderData({ ...orderData, quantity: Number.parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Bericht</Label>
              <Input
                id="message"
                value={orderData.message}
                onChange={(e) => setOrderData({ ...orderData, message: e.target.value })}
                placeholder="Extra informatie of vragen..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Verzenden..." : "Bestelling Verzenden"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="Autobanden en Velgen" className="h-14 w-18" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Autobanden en Velgen</h1>
                  <p className="text-sm text-gray-600">Nieuw of 2e hands</p>
                </div>
              </Link>
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

      {/* Background Image */}
      <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none">
        <img
          src="/banner.webp"
          alt="Background"
          className="w-full h-full object-cover blur-[2px]"
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative">
        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Producten</h2>
            <div className="w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>

          <Tabs defaultValue="tire" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="tire" onClick={() => setActiveTab("tire")}>
                Banden
              </TabsTrigger>
              <TabsTrigger value="rim" onClick={() => setActiveTab("rim")}>
                Velgen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tire">
              <ProductTable
                products={filteredProducts}
                loading={loading}
                setSelectedProduct={setSelectedProduct}
                setShowProductDetails={setShowProductDetails}
                setOrderFormProduct={setOrderFormProduct}
                setShowOrderForm={setShowOrderForm}
                handleSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
              />
            </TabsContent>

            <TabsContent value="rim">
              <ProductTable
                products={filteredProducts}
                loading={loading}
                setSelectedProduct={setSelectedProduct}
                setShowProductDetails={setShowProductDetails}
                setOrderFormProduct={setOrderFormProduct}
                setShowOrderForm={setShowOrderForm}
                handleSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Popups */}
      {showProductDetails && selectedProduct && (
        <ProductDetailsPopup
          product={selectedProduct}
          onClose={() => {
            setShowProductDetails(false)
            setSelectedProduct(null)
          }}
          onOrder={() => {
            setShowProductDetails(false)
            setOrderFormProduct(selectedProduct)
            setShowOrderForm(true)
          }}
        />
      )}

      {showOrderForm && orderFormProduct && (
        <OrderFormPopup
          product={orderFormProduct}
          onClose={() => {
            setShowOrderForm(false)
            setOrderFormProduct(null)
            setSelectedProduct(null)
          }}
        />
      )}
    </div>
  )
}

const ProductTable = ({
  products,
  loading,
  setSelectedProduct,
  setShowProductDetails,
  setOrderFormProduct,
  setShowOrderForm,
  handleSort,
  sortField,
  sortDirection,
}: {
  products: Product[]
  loading: boolean
  setSelectedProduct: any
  setShowProductDetails: any
  setOrderFormProduct: any
  setShowOrderForm: any
  handleSort: (field: string) => void
  sortField: string
  sortDirection: "asc" | "desc"
}) => {
  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (products.length === 0) {
    return <div className="text-center py-8">Geen producten gevonden</div>
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[80px]">Afbeelding</TableHead>
            <TableHead className="min-w-[100px]">Merk</TableHead>
            <TableHead className="min-w-[100px]">Model</TableHead>
            <TableHead className="min-w-[150px]">Specificaties</TableHead>
            <TableHead 
              onClick={() => handleSort("price")} 
              className="cursor-pointer min-w-[120px]"
            >
              Prijs per stuk (€)
              {sortField === "price" && (sortDirection === "asc" ? " ↑" : " ↓")}
            </TableHead>
            <TableHead 
              onClick={() => handleSort("stock")} 
              className="cursor-pointer min-w-[100px]"
            >
              Voorraad
              {sortField === "stock" && (sortDirection === "asc" ? " ↑" : " ↓")}
            </TableHead>
            <TableHead className="min-w-[100px]">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="min-w-[80px]">
                {product.image_url ? (
                  <div 
                    className="w-16 h-16 cursor-pointer"
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowProductDetails(true)
                    }}
                  >
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={`${product.brand} ${product.model}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Geen foto</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="min-w-[100px]">{product.brand}</TableCell>
              <TableCell className="min-w-[100px]">{product.model}</TableCell>
              <TableCell className="min-w-[150px]">{product.specifications}</TableCell>
              <TableCell className="min-w-[120px]">€{product.price.toFixed(2)}</TableCell>
              <TableCell className="min-w-[100px]">
                {product.stock === 0 ? (
                  <span className="text-red-600 font-semibold">Uitverkocht</span>
                ) : (
                  product.stock
                )}
              </TableCell>
              <TableCell className="min-w-[100px]">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowProductDetails(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {product.stock > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrderFormProduct(product)
                        setShowOrderForm(true)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
