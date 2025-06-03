"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AdminDashboard } from "@/components/admin-dashboard"
import { isAdmin } from "@/lib/firebase"
import { Loader2, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check if user is admin
  if (!isAdmin(user.email)) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <Card className="bg-black/50 border-red-500/20 text-center max-w-md">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-white text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              You don't have permission to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">This area is restricted to authorized administrators only.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              Return to Home
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminDashboard />
}
