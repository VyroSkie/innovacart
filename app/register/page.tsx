"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, User, Mail, Phone, Lock } from "lucide-react"
import { getFirebaseAuth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Your password should be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const auth = getFirebaseAuth()
      if (!auth) {
        throw new Error("Authentication service not available")
      }

      // Create email/password account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

      // Update profile with name
      if (formData.name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        })
      }

      toast({
        title: "Account created successfully!",
        description: "Welcome to InnovaCart!",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Error creating account:", error)
      if (error.code === "auth/email-already-in-use") {
        toast({
          title: "Email already exists",
          description: "An account with this email already exists",
          variant: "destructive",
        })
      } else if (error.code === "auth/weak-password") {
        toast({
          title: "Weak password",
          description: "Please choose a stronger password",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create account",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen premium-bg flex items-center justify-center px-4">
      <Card className="w-full max-w-md premium-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold premium-glow-text">Join InnovaCart</CardTitle>
          <CardDescription className="premium-text-muted">Create your account to start shopping</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="premium-text flex items-center">
                <User className="w-4 h-4 mr-2" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="premium-input"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="premium-text flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="premium-input"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="premium-text flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="premium-input"
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="premium-text flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="premium-input"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="premium-text flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="premium-input"
                placeholder="Confirm your password"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full premium-button">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create Account
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="premium-text-muted">
              Already have an account?{" "}
              <Link href="/login" className="premium-text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
