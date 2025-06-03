"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { CartItem, Product, ProductVariant } from "@/types"

interface CartContextType {
  items: CartItem[]
  total: number
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("premium-cart")
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart)
        }
      }
    } catch (error) {
      console.error("Error parsing cart from localStorage:", error)
      localStorage.removeItem("premium-cart")
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save cart to localStorage whenever items change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("premium-cart", JSON.stringify(items))
      } catch (error) {
        console.error("Error saving cart to localStorage:", error)
      }
    }
  }, [items, isLoaded])

  const total = items.reduce((sum, item) => {
    const price = item.selectedVariant?.price || item.product.price
    return sum + price * item.quantity
  }, 0)

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    console.log("Adding to cart:", { product: product.name, quantity, variant: variant?.name })

    setItems((currentItems) => {
      // Create unique ID for cart item based on product and variant
      const itemId = variant ? `${product.id}-${variant.id}` : product.id

      // Check if this exact product+variant combination already exists
      const existingItemIndex = currentItems.findIndex((item) => item.id === itemId)

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = currentItems.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + quantity } : item,
        )
        console.log("Updated existing item, new cart:", updatedItems)
        return updatedItems
      } else {
        // Add new item
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity,
          selectedVariant: variant,
        }
        const updatedItems = [...currentItems, newItem]
        console.log("Added new item, new cart:", updatedItems)
        return updatedItems
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem("premium-cart")
  }

  const value = {
    items,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
