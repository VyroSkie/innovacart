"use client"

import { motion } from "framer-motion"
import { ShirtIcon, Apple } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const categories = [
  {
    icon: ShirtIcon,
    title: "T-Shirts",
    description: "Premium quality t-shirts with unique designs",
    href: "/shop/t-shirts",
    image: "/placeholder.svg?height=300&width=400",
  },
  {
    icon: Apple,
    title: "Fruits",
    description: "Fresh, organic fruits delivered to your door",
    href: "/shop/fruits",
    image: "/placeholder.svg?height=300&width=400",
  },
]

export function Shop() {
  return (
    <section id="shop" className="py-20 px-4 sm:px-6 lg:px-8 red-ambient-section">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our <span className="neon-text">Shop</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">Discover our curated collection of quality products</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-black/50 border-red-500/20 card-hover group overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 red-glow-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-colors">
                    <category.icon className="w-8 h-8 text-red-500" />
                  </div>
                  <CardTitle className="text-white text-2xl">{category.title}</CardTitle>
                  <CardDescription className="text-gray-400 text-lg">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link href={category.href}>
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 neon-glow">
                      Explore Collection
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
