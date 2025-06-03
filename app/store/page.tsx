"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Truck, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { getSiteSettings } from "@/lib/firebase"
import type { SiteSettings } from "@/types"

export default function StorePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const siteSettings = await getSiteSettings()
        setSettings(siteSettings)
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen dark-theme">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse" />
        </div>
        <Footer />
      </div>
    )
  }

  const categories = []

  // Only show T-Shirts if enabled
  if (settings?.tshirtPageAvailable) {
    categories.push({
      id: "t-shirts",
      title: "Premium T-Shirts",
      description: "High-quality cotton t-shirts with modern designs",
      image: settings.categoryThumbnails?.tshirts || "/placeholder.svg?height=300&width=400",
      href: "/shop/t-shirts",
      badge: "Popular",
      features: ["100% Cotton", "Premium Quality", "Modern Designs"],
    })
  }

  // Fruits are always available
  categories.push({
    id: "fruits",
    title: "Fresh Fruits",
    description: "Farm-fresh fruits delivered to your doorstep",
    image: settings?.categoryThumbnails?.fruits || "/placeholder.svg?height=300&width=400",
    href: "/shop/fruits",
    badge: "Fresh",
    features: ["Farm Fresh", "Daily Delivery", "Organic Options"],
  })

  return (
    <div className="min-h-screen dark-theme">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Our <span className="text-purple-500">Store</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover premium products with cutting-edge technology and exceptional quality
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="premium-card p-6 text-center">
              <Truck className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-400 text-sm">Quick and reliable delivery to your doorstep</p>
            </div>
            <div className="premium-card p-6 text-center">
              <Shield className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Quality Assured</h3>
              <p className="text-gray-400 text-sm">Premium quality products with warranty</p>
            </div>
            <div className="premium-card p-6 text-center">
              <Zap className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Instant Support</h3>
              <p className="text-gray-400 text-sm">24/7 customer support for all your needs</p>
            </div>
          </div>

          {/* Categories */}
          <div
            className={`grid grid-cols-1 ${categories.length > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"} gap-8`}
          >
            {categories.map((category) => (
              <div key={category.id} className="premium-card overflow-hidden group">
                <div className="relative overflow-hidden">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-purple-500 text-white">{category.badge}</Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-white text-xl font-bold mb-2">{category.title}</h3>
                    <p className="text-gray-400">{category.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {category.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="border-purple-500/30 text-white text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <Link href={category.href}>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Browse {category.title}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="premium-card p-8 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">
                Need Something <span className="text-purple-500">Specific?</span>
              </h2>
              <p className="text-gray-400 mb-6">
                Can't find what you're looking for? Contact our team for custom solutions and bulk orders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Contact Sales Team</Button>
                <Button variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10">
                  View All Categories
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
