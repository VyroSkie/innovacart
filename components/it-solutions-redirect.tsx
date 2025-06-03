"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSiteSettings } from "@/lib/firebase"
import type { SiteSettings } from "@/types"

export function ITSolutionsRedirect() {
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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-red-500 animate-pulse" />
      </div>
    )
  }

  if (settings?.itSolutionsAvailable) {
    // If available, show the actual IT solutions content
    return (
      <div className="min-h-screen gradient-bg">
        {/* Add your IT solutions content here */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center py-20">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              IT <span className="neon-text">Solutions</span>
            </h1>
            <p className="text-xl text-gray-400">Our IT solutions are now available!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
        <Card className="bg-black/50 border-red-500/20 text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-white text-2xl">Service Unavailable</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Our IT Solutions service is currently not available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              We're working hard to bring you the best IT solutions. This service will be available soon.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Settings className="w-4 h-4" />
              <span>Managed by administrators</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
