"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-purple-500 text-sm font-medium">Welcome to InnovaCart</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Premium Digital
            <br />
            <span className="text-purple-500">Solutions</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            Transform your business with cutting-edge technology, premium products, and exceptional service
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link href="/store">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg group">
              Explore Store
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/it-solutions">
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10 px-8 py-4 text-lg"
            >
              IT Solutions
            </Button>
          </Link>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center space-x-3 p-6 bg-gray-900/30 border border-purple-500/20 rounded-lg backdrop-blur-sm">
            <Zap className="w-6 h-6 text-purple-500" />
            <span className="text-white font-medium">Fast Delivery</span>
          </div>

          <div className="flex items-center justify-center space-x-3 p-6 bg-gray-900/30 border border-purple-500/20 rounded-lg backdrop-blur-sm">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className="text-white font-medium">Quality Assured</span>
          </div>

          <div className="flex items-center justify-center space-x-3 p-6 bg-gray-900/30 border border-purple-500/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="text-white font-medium">Premium Support</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
