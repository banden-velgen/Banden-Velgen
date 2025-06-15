"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import type { Product, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Home } from "lucide-react"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      setUser(session.user)

      // Check if user is admin by checking their profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        router.push("/")
        return
      }

      if (!profileData || profileData.role !== "admin") {
        router.push("/")
        return
      }

      setProfile(profileData)
      await fetchProducts()
      await fetchProfiles()
      setLoading(false)
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/login")
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const fetchProfiles = async () => {
    try {
      // Only fetch profiles if current user is admin
      if (profile?.role === "admin") {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setProfiles(data || [])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
      await fetchProducts()
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const updateUserRole = async (userId: string, newRole: "admin" | "buyer") => {
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error
      await fetchProfiles()
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="Autobanden en Velgen" className="h-14 w-18" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-600">Autobanden en Velgen</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Terug naar Home
                </Button>
              </Link>
              <span className="text-sm text-gray-600">Welkom, {user?.email}</span>
              <Button onClick={handleSignOut} variant="outline">
                Uitloggen
              </Button>
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
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList>
              <TabsTrigger value="products">Product Beheer</TabsTrigger>
              <TabsTrigger value="users">Gebruiker Beheer</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Product Beheer</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setEditingProduct(null)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nieuw Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingProduct ? "Product Bewerken" : "Nieuw Product"}</DialogTitle>
                        </DialogHeader>
                        <ProductForm
                          product={editingProduct}
                          onSave={() => {
                            setIsDialogOpen(false)
                            fetchProducts()
                          }}
                          onCancel={() => setIsDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afbeelding</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Merk</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Prijs per stuk</TableHead>
                        <TableHead>Voorraad</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={`${product.brand} ${product.model}`}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Geen foto</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.id}</TableCell>
                          <TableCell className="capitalize">{product.type === "tire" ? "Band" : "Velg"}</TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>{product.model}</TableCell>
                          <TableCell>€{product.price.toFixed(2)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            {product.status === 'Nieuw' ? (
                              <span className="px-2 py-1 rounded text-white" style={{background:'#166534'}}>Nieuw</span>
                            ) : (
                              <span className="px-2 py-1 rounded text-white" style={{background:'#b45309'}}>2e hands</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(product)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setProductToDelete(product)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gebruiker Beheer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Aangemaakt</TableHead>
                        <TableHead>Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                              {profile.role === "admin" ? "Admin" : "Koper"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(profile.created_at).toLocaleDateString("nl-NL")}</TableCell>
                          <TableCell>
                            <Select
                              value={profile.role}
                              onValueChange={(value: "admin" | "buyer") => updateUserRole(profile.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buyer">Koper</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Product Verwijderen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Weet u zeker dat u het product <span className="font-semibold">{productToDelete?.brand} {productToDelete?.model}</span> wilt verwijderen?
            </p>
            <p className="text-sm text-red-600 mt-2">Deze actie kan niet ongedaan worden gemaakt.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false)
              setProductToDelete(null)
            }}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}
            >
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: Product | null
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    id: product?.id || "",
    type: product?.type || ("tire" as "tire" | "rim"),
    brand: product?.brand || "",
    model: product?.model || "",
    specifications: product?.specifications || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    image_url: product?.image_url || "",
    status: product?.status || "2e hands",
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = formData.image_url

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
      }

      if (product) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert([productData])
        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error("Error saving product:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="image">Product Afbeelding</Label>
        <div className="space-y-2">
          {formData.image_url && (
            <img
              src={formData.image_url || "/placeholder.svg"}
              alt="Product preview"
              className="w-32 h-32 object-cover rounded-md"
            />
          )}
          <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="id">Product ID</Label>
        <Input
          id="id"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          required
          disabled={!!product}
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: "tire" | "rim") => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tire">Band</SelectItem>
            <SelectItem value="rim">Velg</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="brand">Merk</Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="specifications">Specificaties</Label>
        <Input
          id="specifications"
          value={formData.specifications}
          onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="price">Prijs per stuk</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label htmlFor="stock">Voorraad</Label>
        <Input
          id="stock"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status || '2e hands'}
          onValueChange={(value: string) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Nieuw">Nieuw</SelectItem>
            <SelectItem value="2e hands">2e hands</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "Opslaan..." : "Opslaan"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
      </div>
    </form>
  )
}
