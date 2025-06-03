"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getProductsByCategory } from "@/lib/firebase"
import type { Product } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Eye, Package, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function TShirtsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("👕 Fetching t-shirt products...")

        // Try multiple category variations
        const categoryVariations = ["t-shirts", "t-shirt", "tshirt", "tshirts"]
        let tshirtProducts: Product[] = []

        for (const category of categoryVariations) {
          console.log(`👕 Trying category: "${category}"`)
          const products = await getProductsByCategory(category)
          if (products.length > 0) {
            tshirtProducts = products
            console.log(`👕 Found ${products.length} products with category "${category}"`)
            break
          }
        }

        console.log("👕 Final t-shirt products:", tshirtProducts)
        setProducts(tshirtProducts)
      } catch (error) {
        console.error("Error fetching t-shirt products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

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

  return (
    <div className="min-h-screen premium-bg">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold premium-text mb-4">
              Premium <span className="premium-text-accent">T-Shirts</span>
            </h1>
            <p className="text-xl premium-text-muted">High-quality cotton t-shirts with modern designs</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold premium-text mb-4">No T-Shirts Available</h3>
              <p className="premium-text-muted">Check back later for new products!</p>
              <div className="mt-6 p-4 premium-card rounded-lg max-w-md mx-auto">
                <p className="text-sm premium-text-muted">
                  Debug: If you've added T-shirts in the admin dashboard, make sure the category is set to one of:
                </p>
                <ul className="text-xs premium-text-muted mt-2 space-y-1">
                  <li>• "t-shirts"</li>
                  <li>• "t-shirt"</li>
                  <li>• "tshirt"</li>
                  <li>• "tshirts"</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="premium-product-card">
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
                        <Badge className="absolute top-2 right-2 premium-badge">
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
                        <Badge variant="outline" className="premium-badge">
                          Stock: {product.stock}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <Button variant="outline" className="w-full premium-button">
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
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
