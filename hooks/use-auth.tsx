"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { auth } from "@/lib/firebase"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email address")
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again")
      } else if (error.code === "auth/invalid-credential") {
        throw new Error("Invalid email or password. Please try again")
      } else {
        throw new Error(error.message || "An error occurred during sign in")
      }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name })
      }
    } catch (error: any) {
      if (error.code === "auth/weak-password") {
        throw new Error("Your password should be at least 6 characters long")
      } else if (error.code === "auth/email-already-in-use") {
        throw new Error("An account with this email already exists")
      } else {
        throw new Error(error.message || "An error occurred during registration")
      }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
