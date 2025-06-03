"use client"

import { useEffect, useState } from "react"
import { initializeAdmins } from "@/lib/firebase"

export function FirebaseInit() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const initFirebase = async () => {
      try {
        console.log("🔄 FirebaseInit: Starting initialization...")

        // Wait for Firebase to be ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Initialize admins
        await initializeAdmins()
        setInitialized(true)

        console.log("✅ FirebaseInit: Firebase initialized successfully")
      } catch (error) {
        console.error("❌ FirebaseInit: Error during initialization:", error)

        // Retry after delay
        setTimeout(initFirebase, 2000)
      }
    }

    // Start initialization process
    initFirebase()
  }, [])

  return null
}
