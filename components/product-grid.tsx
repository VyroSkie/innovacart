"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye, Package } from "lucide-react"
import { getProductsByCategory } from "@/lib/firebase"
import type { Product } from "@/types"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ProductGridProps {
  category: string
  title: string
}

export function ProductGrid({ category, title }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProductsByCategory(category)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category, toast])

  const handleQuickAdd = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // If product has variants, redirect to product page
      return
    }

    // For products without variants, add directly to cart
    addToCart(product, 1)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="premium-card animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-purple-500/10 rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-purple-500/10 rounded" />
                <div className="h-3 bg-purple-500/10 rounded w-2/3" />
                <div className="h-6 bg-purple-500/10 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-12 h-12 premium-text-accent" />
        </div>
        <h3 className="text-2xl font-bold premium-text mb-4">No {title} Available</h3>
        <p className="premium-text-muted">Check back later for new products!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="premium-card group hover:scale-105 transition-all duration-300">
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              <img
                src={product.image || "/placeholder.svg?height=300&width=300"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=300&width=300"
                }}
              />
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <Badge className="absolute top-2 right-2 bg-purple-500/90 text-white border-0">
                  {product.variants.length} options
                </Badge>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="premium-text font-semibold text-lg line-clamp-2">{product.name}</h3>
              <p className="premium-text-muted text-sm line-clamp-2">{product.description}</p>

              <div className="flex items-center justify-between">
                <div>
                  {product.hasVariants && product.variants && product.variants.length > 0 ? (
                    <div>
                      <span className="premium-text-accent font-bold text-lg">
                        ৳{Math.min(...product.variants.map((v) => v.price || product.price))}
                      </span>
                      <span className="premium-text-muted text-sm ml-1">
                        - ৳{Math.max(...product.variants.map((v) => v.price || product.price))}
                      </span>
                    </div>
                  ) : (
                    <span className="premium-text-accent font-bold text-lg">৳{product.price}</span>
                  )}
                </div>
                <Badge variant="outline" className="border-purple-500/30 premium-text-accent">
                  Stock: {product.stock}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Link href={`/product/${product.id}`} className="flex-1">
                  <Button variant="outline" className="w-full border-purple-500/30 premium-text hover:bg-purple-500/10">
                    <Eye className="w-4 h-4 mr-2" />
                    {product.hasVariants && product.variants && product.variants.length > 0
                      ? "View Options"
                      : "View Details"}
                  </Button>
                </Link>

                {(!product.hasVariants || !product.variants || product.variants.length === 0) && (
                  <Button
                    onClick={() => handleQuickAdd(product)}
                    className="premium-button"
                    disabled={product.stock <= 0}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
