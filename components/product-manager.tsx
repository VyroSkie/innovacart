"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, Edit, Trash, Weight, Ruler, Upload, Loader2 } from "lucide-react"
import { getProducts, addProduct, updateProduct, deleteProduct, fileToBase64 } from "@/lib/firebase"
import type { Product, ProductVariant } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    stock: "",
    hasVariants: false,
    variants: [] as ProductVariant[],
  })
  const [newVariant, setNewVariant] = useState({
    name: "",
    price: "",
    stock: "",
    default: false,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await getProducts()
      console.log("📦 Fetched products:", fetchedProducts)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, isEdit = false) => {
    try {
      setUploadingImage(true)
      const base64 = await fileToBase64(file)

      if (isEdit && editingProduct) {
        setEditingProduct({ ...editingProduct, image: base64 })
      } else {
        setNewProduct({ ...newProduct, image: base64 })
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.stock) {
      toast({
        title: "Error",
        description: `${newProduct.category === "fruits" ? "Amount" : "Size"} and stock are required`,
        variant: "destructive",
      })
      return
    }

    // For fruits, price is required. For t-shirts, it's optional
    if (newProduct.category === "fruits" && !newVariant.price) {
      toast({
        title: "Error",
        description: "Price is required for fruit variants",
        variant: "destructive",
      })
      return
    }

    const variant: ProductVariant = {
      id: Date.now().toString(),
      name: newVariant.name,
      price: newVariant.price ? Number(newVariant.price) : undefined,
      stock: Number(newVariant.stock),
      default: newVariant.default,
    }

    // If this is the first variant or marked as default, make it default
    if (newProduct.variants.length === 0 || newVariant.default) {
      // Remove default from other variants
      const updatedVariants = newProduct.variants.map((v) => ({ ...v, default: false }))
      variant.default = true
      setNewProduct({
        ...newProduct,
        variants: [...updatedVariants, variant],
      })
    } else {
      setNewProduct({
        ...newProduct,
        variants: [...newProduct.variants, variant],
      })
    }

    setNewVariant({
      name: "",
      price: "",
      stock: "",
      default: false,
    })

    toast({
      title: "Variant Added",
      description: `${variant.name} variant added successfully`,
    })
  }

  const handleRemoveVariant = (variantId: string) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((v) => v.id !== variantId),
    })
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (name, category, price)",
        variant: "destructive",
      })
      return
    }

    if (newProduct.hasVariants && newProduct.variants.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one variant or disable variants",
        variant: "destructive",
      })
      return
    }

    // Ensure at least one variant is marked as default if variants exist
    if (newProduct.hasVariants && newProduct.variants.length > 0) {
      const hasDefault = newProduct.variants.some((v) => v.default)
      if (!hasDefault) {
        // Mark the first variant as default
        newProduct.variants[0].default = true
      }
    }

    try {
      // Calculate total stock from variants if product has variants
      let totalStock = Number(newProduct.stock) || 0
      if (newProduct.hasVariants && newProduct.variants.length > 0) {
        totalStock = newProduct.variants.reduce((sum, variant) => sum + variant.stock, 0)
      }

      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        category: newProduct.category,
        image: newProduct.image || "/placeholder.svg?height=200&width=200",
        stock: totalStock,
        hasVariants: newProduct.hasVariants,
        variants: newProduct.hasVariants ? newProduct.variants : [],
        createdAt: new Date(),
      }

      console.log("Adding product:", productData)
      await addProduct(productData)

      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
        stock: "",
        hasVariants: false,
        variants: [],
      })

      await fetchProducts()

      toast({
        title: "Success",
        description: "Product added successfully",
      })
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    // Ensure at least one variant is marked as default if variants exist
    if (editingProduct.hasVariants && editingProduct.variants && editingProduct.variants.length > 0) {
      const hasDefault = editingProduct.variants.some((v) => v.default)
      if (!hasDefault) {
        // Mark the first variant as default
        editingProduct.variants[0].default = true
      }
    }

    try {
      console.log("Updating product:", editingProduct)
      await updateProduct(editingProduct.id, editingProduct)
      setEditingProduct(null)
      setEditDialogOpen(false)
      await fetchProducts()
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      await deleteProduct(productId)
      await fetchProducts()
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddEditVariant = () => {
    if (!editingProduct) return

    if (!editVariant?.name || !editVariant?.stock) {
      toast({
        title: "Error",
        description: `${editingProduct.category === "fruits" ? "Amount" : "Size"} and stock are required`,
        variant: "destructive",
      })
      return
    }

    // For fruits, price is required. For t-shirts, it's optional
    if (editingProduct.category === "fruits" && !editVariant.price) {
      toast({
        title: "Error",
        description: "Price is required for fruit variants",
        variant: "destructive",
      })
      return
    }

    const variant: ProductVariant = {
      id: editVariant.id || Date.now().toString(),
      name: editVariant.name,
      price: editVariant.price ? Number(editVariant.price) : undefined,
      stock: Number(editVariant.stock),
      default: editVariant.default,
    }

    let updatedVariants = [...(editingProduct.variants || [])]

    // If editing existing variant
    const existingIndex = updatedVariants.findIndex((v) => v.id === variant.id)
    if (existingIndex >= 0) {
      updatedVariants[existingIndex] = variant
    } else {
      // Adding new variant
      updatedVariants.push(variant)
    }

    // Handle default variant
    if (variant.default) {
      updatedVariants = updatedVariants.map((v) => ({
        ...v,
        default: v.id === variant.id,
      }))
    }

    setEditingProduct({
      ...editingProduct,
      variants: updatedVariants,
    })

    setEditVariant(null)

    toast({
      title: "Success",
      description: `Variant ${existingIndex >= 0 ? "updated" : "added"} successfully`,
    })
  }

  const handleRemoveEditVariant = (variantId: string) => {
    if (!editingProduct) return

    setEditingProduct({
      ...editingProduct,
      variants: (editingProduct.variants || []).filter((v) => v.id !== variantId),
    })
  }

  const getVariantIcon = (category: string) => {
    return category === "fruits" ? <Weight className="w-4 h-4 mr-1" /> : <Ruler className="w-4 h-4 mr-1" />
  }

  const getVariantLabel = (category: string) => {
    return category === "fruits" ? "Amount" : "Size"
  }

  const getVariantPlaceholder = (category: string) => {
    return category === "fruits" ? "e.g., 250g, 500g, 1kg" : "e.g., S, M, L, XL"
  }

  // Predefined image URLs for categories
  const getCategoryImages = (category: string) => {
    const images = {
      fruits: [
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&h=400&fit=crop",
      ],
      "t-shirts": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=400&fit=crop",
      ],
    }
    return images[category as keyof typeof images] || []
  }

  if (loading) {
    return (
      <Card className="admin-card">
        <CardContent className="flex justify-center items-center py-8">
          <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add New Product */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" />
            Add New Product
          </CardTitle>
          <CardDescription className="text-gray-400">Create a new product for your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Product Name*</Label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="premium-input"
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Category*</Label>
              <Select
                value={newProduct.category}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, category: value, hasVariants: false, variants: [] })
                }
              >
                <SelectTrigger className="premium-input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="fruits" className="text-white hover:bg-purple-500/20">
                    Fruits
                  </SelectItem>
                  <SelectItem value="t-shirts" className="text-white hover:bg-purple-500/20">
                    T-Shirts
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="premium-input"
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Product Image</Label>
            <div className="space-y-3">
              {/* Image Upload Area */}
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                  className="hidden"
                  id="product-image-upload"
                />
                <label
                  htmlFor="product-image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center py-6"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-8 h-8 text-purple-400 mb-2" />
                  )}
                  <p className="text-white font-medium">Upload Product Image</p>
                  <p className="text-gray-400 text-sm">Click to browse or drag & drop</p>
                </label>
              </div>

              {/* Current Image Preview */}
              {newProduct.image && (
                <div className="premium-card p-4">
                  <Label className="text-white text-sm mb-2 block">Current Image:</Label>
                  <img
                    src={newProduct.image || "/placeholder.svg"}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* URL Input */}
              <Input
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                className="premium-input"
                placeholder="Or enter image URL"
              />

              {/* Quick Select Thumbnails */}
              {newProduct.category && (
                <div className="space-y-2">
                  <Label className="text-white text-sm">Quick Select Thumbnails:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {getCategoryImages(newProduct.category).map((imageUrl, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, image: imageUrl })}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          newProduct.image === imageUrl
                            ? "border-purple-500"
                            : "border-purple-500/20 hover:border-purple-500/40"
                        }`}
                      >
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`${newProduct.category} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Base Price (৳)*</Label>
            <Input
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="premium-input"
              placeholder="0.00"
            />
            <p className="text-xs text-purple-400">
              {newProduct.category === "fruits"
                ? "This is the base price. Each amount will have its own price."
                : "This is the base price. Sizes can use this price or have custom prices."}
            </p>
          </div>

          {newProduct.category && (
            <div className="flex items-center space-x-2 p-4 premium-card">
              <Switch
                id="hasVariants"
                checked={newProduct.hasVariants}
                onCheckedChange={(checked) => setNewProduct({ ...newProduct, hasVariants: checked, variants: [] })}
              />
              <Label htmlFor="hasVariants" className="text-white font-medium">
                Add {newProduct.category === "fruits" ? "different amounts" : "different sizes"} for this product
              </Label>
            </div>
          )}

          {!newProduct.hasVariants ? (
            <div className="space-y-2">
              <Label className="text-white">Stock*</Label>
              <Input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="premium-input"
                placeholder="0"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-purple-500/20 rounded-lg p-4 space-y-4 premium-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium flex items-center">
                    {getVariantIcon(newProduct.category)}
                    Add {getVariantLabel(newProduct.category)} Variants
                  </h3>
                </div>

                {/* Add new variant form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-white text-sm">{getVariantLabel(newProduct.category)}*</Label>
                    <Input
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      className="premium-input"
                      placeholder={getVariantPlaceholder(newProduct.category)}
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm">
                      Price (৳) {newProduct.category === "t-shirts" ? "(Optional)" : "*"}
                    </Label>
                    <Input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                      className="premium-input"
                      placeholder={newProduct.category === "t-shirts" ? "Leave empty for base price" : "0.00"}
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm">Stock*</Label>
                    <Input
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                      className="premium-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddVariant} className="premium-button w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="defaultVariant"
                    checked={newVariant.default}
                    onCheckedChange={(checked) => setNewVariant({ ...newVariant, default: checked })}
                  />
                  <Label htmlFor="defaultVariant" className="text-white text-sm">
                    Set as default variant (will be pre-selected for customers)
                  </Label>
                </div>

                {/* Variants list */}
                {newProduct.variants.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Added Variants:</h4>
                    <div className="premium-card overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-purple-500/20">
                            <th className="text-left p-3 text-purple-300">{getVariantLabel(newProduct.category)}</th>
                            <th className="text-left p-3 text-purple-300">Price</th>
                            <th className="text-left p-3 text-purple-300">Stock</th>
                            <th className="text-left p-3 text-purple-300">Default</th>
                            <th className="text-right p-3 text-purple-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newProduct.variants.map((variant) => (
                            <tr key={variant.id} className="border-b border-purple-500/10">
                              <td className="p-3 text-white font-medium">{variant.name}</td>
                              <td className="p-3 text-white">
                                {variant.price ? `৳${variant.price}` : `৳${newProduct.price} (base)`}
                              </td>
                              <td className="p-3 text-white">{variant.stock}</td>
                              <td className="p-3 text-white">
                                {variant.default ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Default</Badge>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveVariant(variant.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-purple-500/20 rounded-lg">
                    No variants added yet. Add your first {getVariantLabel(newProduct.category).toLowerCase()} variant
                    above.
                  </div>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleAddProduct} className="premium-button w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Products ({products.length})
          </CardTitle>
          <CardDescription className="text-gray-400">Manage your existing products</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-400">No products found. Add your first product above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="premium-product-card">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-purple-500/10 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={product.image || "/placeholder.svg?height=200&width=200"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=200&width=200"
                        }}
                      />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{product.name}</h3>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{product.description}</p>

                    {product.hasVariants && product.variants && product.variants.length > 0 ? (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-400 font-bold">৳{product.price} (base)</span>
                          <Badge variant="outline" className="border-purple-500/20 text-purple-400 text-xs">
                            {product.variants.length} variants
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {product.variants.map((variant) => (
                            <Badge
                              key={variant.id}
                              className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs"
                            >
                              {variant.name}: ৳{variant.price || product.price}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-400 font-bold">৳{product.price}</span>
                        <Badge variant="outline" className="border-purple-500/20 text-purple-400 text-xs">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                        className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10 flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-purple-500/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-400" />
              Edit Product
            </DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Product Name*</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="premium-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Category*</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                  >
                    <SelectTrigger className="premium-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="fruits" className="text-white hover:bg-purple-500/20">
                        Fruits
                      </SelectItem>
                      <SelectItem value="t-shirts" className="text-white hover:bg-purple-500/20">
                        T-Shirts
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Description</Label>
                <Textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="premium-input"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Product Image</Label>
                <div className="space-y-3">
                  {/* Image Upload Area */}
                  <div className="file-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageUpload(file, true)
                        }
                      }}
                      className="hidden"
                      id="edit-product-image-upload"
                    />
                    <label
                      htmlFor="edit-product-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                      ) : (
                        <Upload className="w-6 h-6 text-purple-400 mb-2" />
                      )}
                      <p className="text-white font-medium text-sm">Upload New Image</p>
                      <p className="text-gray-400 text-xs">Click to browse</p>
                    </label>
                  </div>

                  {/* Current Image Preview */}
                  {editingProduct.image && (
                    <div className="premium-card p-3">
                      <Label className="text-white text-sm mb-2 block">Current Image:</Label>
                      <img
                        src={editingProduct.image || "/placeholder.svg"}
                        alt="Product preview"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* URL Input */}
                  <Input
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="premium-input"
                    placeholder="Or enter image URL"
                  />

                  {/* Quick Select Thumbnails */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Quick Select Thumbnails:</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {getCategoryImages(editingProduct.category).map((imageUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image: imageUrl })}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                            editingProduct.image === imageUrl
                              ? "border-purple-500"
                              : "border-purple-500/20 hover:border-purple-500/40"
                          }`}
                        >
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={`${editingProduct.category} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Base Price (৳)*</Label>
                <Input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  className="premium-input"
                />
              </div>

              <div className="flex items-center space-x-2 p-4 premium-card">
                <Switch
                  id="editHasVariants"
                  checked={editingProduct.hasVariants}
                  onCheckedChange={(checked) =>
                    setEditingProduct({
                      ...editingProduct,
                      hasVariants: checked,
                      variants: checked ? editingProduct.variants || [] : [],
                    })
                  }
                />
                <Label htmlFor="editHasVariants" className="text-white font-medium">
                  This product has {editingProduct.category === "fruits" ? "different amounts" : "different sizes"}
                </Label>
              </div>

              {!editingProduct.hasVariants ? (
                <div className="space-y-2">
                  <Label className="text-white">Stock*</Label>
                  <Input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="premium-input"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-purple-500/20 rounded-lg p-4 space-y-4 premium-card">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium flex items-center">
                        {getVariantIcon(editingProduct.category)}
                        Manage {getVariantLabel(editingProduct.category)} Variants
                      </h3>
                    </div>

                    {/* Add/Edit variant form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-white text-sm">{getVariantLabel(editingProduct.category)}*</Label>
                        <Input
                          value={editVariant?.name || ""}
                          onChange={(e) =>
                            setEditVariant({ ...(editVariant || { id: Date.now().toString() }), name: e.target.value })
                          }
                          className="premium-input"
                          placeholder={getVariantPlaceholder(editingProduct.category)}
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">
                          Price (৳) {editingProduct.category === "t-shirts" ? "(Optional)" : "*"}
                        </Label>
                        <Input
                          type="number"
                          value={editVariant?.price || ""}
                          onChange={(e) =>
                            setEditVariant({
                              ...(editVariant || { id: Date.now().toString() }),
                              price: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="premium-input"
                          placeholder={editingProduct.category === "t-shirts" ? "Leave empty for base price" : "0.00"}
                        />
                      </div>
                      <div>
                        <Label className="text-white text-sm">Stock*</Label>
                        <Input
                          type="number"
                          value={editVariant?.stock || ""}
                          onChange={(e) =>
                            setEditVariant({
                              ...(editVariant || { id: Date.now().toString() }),
                              stock: Number(e.target.value),
                            })
                          }
                          className="premium-input"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddEditVariant} className="premium-button w-full">
                          <Plus className="w-4 h-4 mr-1" />
                          {editVariant?.id && editingProduct.variants?.some((v) => v.id === editVariant.id)
                            ? "Update"
                            : "Add"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="editDefaultVariant"
                        checked={editVariant?.default || false}
                        onCheckedChange={(checked) =>
                          setEditVariant({ ...(editVariant || { id: Date.now().toString() }), default: checked })
                        }
                      />
                      <Label htmlFor="editDefaultVariant" className="text-white text-sm">
                        Set as default variant
                      </Label>
                    </div>

                    {/* Variants list */}
                    {editingProduct.variants && editingProduct.variants.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-white text-sm font-medium">Variants:</h4>
                        <div className="premium-card overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-purple-500/20">
                                <th className="text-left p-3 text-purple-300">
                                  {getVariantLabel(editingProduct.category)}
                                </th>
                                <th className="text-left p-3 text-purple-300">Price</th>
                                <th className="text-left p-3 text-purple-300">Stock</th>
                                <th className="text-left p-3 text-purple-300">Default</th>
                                <th className="text-right p-3 text-purple-300">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {editingProduct.variants.map((variant) => (
                                <tr key={variant.id} className="border-b border-purple-500/10">
                                  <td className="p-3 text-white font-medium">{variant.name}</td>
                                  <td className="p-3 text-white">
                                    {variant.price ? `৳${variant.price}` : `৳${editingProduct.price} (base)`}
                                  </td>
                                  <td className="p-3 text-white">{variant.stock}</td>
                                  <td className="p-3 text-white">
                                    {variant.default ? (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        Default
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditVariant({ ...variant })}
                                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 h-8 w-8 p-0"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveEditVariant(variant.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-purple-500/20 rounded-lg">
                        No variants added yet. Add your first {getVariantLabel(editingProduct.category).toLowerCase()}{" "}
                        variant above.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} className="premium-button">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
