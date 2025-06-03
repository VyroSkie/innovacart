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

export default function FruitsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("🍎 Fetching fruit products...")
        // Try both "fruits" and "fruit" categories
        let fruitProducts = await getProductsByCategory("fruits")

        if (fruitProducts.length === 0) {
          console.log("🍎 No products found with 'fruits', trying 'fruit'...")
          fruitProducts = await getProductsByCategory("fruit")
        }

        console.log("🍎 Found fruit products:", fruitProducts)
        setProducts(fruitProducts)
      } catch (error) {
        console.error("Error fetching fruit products:", error)
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Fresh <span className="text-purple-500">Fruits</span>
            </h1>
            <p className="text-xl text-gray-400">Premium quality fruits delivered fresh to your door</p>
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
              <h3 className="text-2xl font-bold text-white mb-4">No Fruits Available</h3>
              <p className="text-gray-400">Check back later for new products!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="bg-black/50 border-purple-500/20 hover:border-purple-500/40 transition-colors group"
                >
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
                      <h3 className="text-white font-semibold text-lg line-clamp-2">{product.name}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          {product.hasVariants && product.variants && product.variants.length > 0 ? (
                            <div>
                              <span className="text-purple-500 font-bold text-lg">
                                ৳{Math.min(...product.variants.map((v) => v.price || product.price))}
                              </span>
                              <span className="text-gray-400 text-sm ml-1">
                                - ৳{Math.max(...product.variants.map((v) => v.price || product.price))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-purple-500 font-bold text-lg">৳{product.price}</span>
                          )}
                        </div>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                          Stock: {product.stock}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full border-purple-500/30 text-white hover:bg-purple-500/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {product.hasVariants && product.variants && product.variants.length > 0
                              ? "View Options"
                              : "View Details"}
                          </Button>
                        </Link>

                        {(!product.hasVariants || !product.variants || product.variants.length === 0) && (
                          <Button
                            onClick={() => handleQuickAdd(product)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
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
