"use client"

import { getFirebaseDatabase } from "./firebase"
import { ref, set, get, push, update, remove, query, orderByChild, equalTo } from "firebase/database"
import type { Product, Order, SiteSettings, Coupon } from "@/types"

// Helper function to ensure Firebase is ready
const ensureDatabase = () => {
  if (typeof window === "undefined") {
    throw new Error("Database operations can only be performed on the client side")
  }

  const db = getFirebaseDatabase()
  if (!db) {
    throw new Error("Firebase database not available")
  }

  return db
}

// Default site settings
const DEFAULT_SETTINGS: SiteSettings = {
  itSolutionsAvailable: false,
  tshirtPageAvailable: false,
  paymentNumber: "+88019191191919",
}

// Site Settings functions
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const db = ensureDatabase()
    const settingsRef = ref(db, "settings")
    const snapshot = await get(settingsRef)

    if (snapshot.exists()) {
      return snapshot.val() as SiteSettings
    } else {
      await set(settingsRef, DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    }
  } catch (error) {
    console.error("Error getting site settings:", error)
    return DEFAULT_SETTINGS
  }
}

export const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
  try {
    const db = ensureDatabase()
    const settingsRef = ref(db, "settings")
    await update(settingsRef, settings)
  } catch (error) {
    console.error("Error updating site settings:", error)
    throw error
  }
}

// Product functions
export const addProduct = async (product: Omit<Product, "id">) => {
  try {
    const db = ensureDatabase()
    const productsRef = ref(db, "products")
    const newProductRef = push(productsRef)
    const productWithId = {
      ...product,
      id: newProductRef.key,
      createdAt: Date.now(),
    }
    await set(newProductRef, productWithId)
    return newProductRef.key
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const db = ensureDatabase()
    const productsRef = ref(db, "products")
    const snapshot = await get(productsRef)

    if (snapshot.exists()) {
      const products = snapshot.val()
      return Object.values(products).map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt || Date.now()),
      }))
    }
    return []
  } catch (error) {
    console.error("Error getting products:", error)
    return []
  }
}

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const products = await getProducts()
    return products.filter((product) => product.category === category)
  } catch (error) {
    console.error("Error getting products by category:", error)
    return []
  }
}

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const db = ensureDatabase()
    const productRef = ref(db, `products/${id}`)
    await update(productRef, productData)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (id: string) => {
  try {
    const db = ensureDatabase()
    const productRef = ref(db, `products/${id}`)
    await remove(productRef)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Order functions
export const addOrder = async (order: Omit<Order, "id">) => {
  try {
    const db = ensureDatabase()
    const ordersRef = ref(db, "orders")
    const newOrderRef = push(ordersRef)
    const orderWithId = {
      ...order,
      id: newOrderRef.key,
      createdAt: Date.now(),
      couponCode: order.couponCode || null,
      discount: order.discount || 0,
      deliveryCharge: order.deliveryCharge || 0,
      grandTotal: order.grandTotal || order.total,
    }
    await set(newOrderRef, orderWithId)
    return newOrderRef.key
  } catch (error) {
    console.error("Error adding order:", error)
    throw error
  }
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    const db = ensureDatabase()
    const ordersRef = ref(db, "orders")
    const snapshot = await get(ordersRef)

    if (snapshot.exists()) {
      const orders = snapshot.val()
      return Object.values(orders)
        .map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt || Date.now()),
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return []
  } catch (error) {
    console.error("Error getting orders:", error)
    return []
  }
}

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  if (!userId) return []

  try {
    const db = ensureDatabase()
    const ordersRef = ref(db, "orders")
    const userOrdersQuery = query(ordersRef, orderByChild("userId"), equalTo(userId))
    const snapshot = await get(userOrdersQuery)

    if (snapshot.exists()) {
      const orders = snapshot.val()
      return Object.values(orders)
        .map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt || Date.now()),
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return []
  } catch (error) {
    console.error("Error getting user orders:", error)
    return []
  }
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
  try {
    const db = ensureDatabase()
    const orderRef = ref(db, `orders/${orderId}`)
    await update(orderRef, { status })
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// Coupon functions
export const addCoupon = async (coupon: Omit<Coupon, "id">) => {
  try {
    const db = ensureDatabase()
    const couponsRef = ref(db, "coupons")
    const newCouponRef = push(couponsRef)
    const couponWithId = {
      ...coupon,
      id: newCouponRef.key,
      createdAt: Date.now(),
      expiryDate: new Date(coupon.expiryDate).getTime(),
    }
    await set(newCouponRef, couponWithId)
    return newCouponRef.key
  } catch (error) {
    console.error("Error adding coupon:", error)
    throw error
  }
}

export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const db = ensureDatabase()
    const couponsRef = ref(db, "coupons")
    const snapshot = await get(couponsRef)

    if (snapshot.exists()) {
      const coupons = snapshot.val()
      return Object.values(coupons).map((coupon: any) => ({
        ...coupon,
        createdAt: new Date(coupon.createdAt || Date.now()),
        expiryDate: new Date(coupon.expiryDate || Date.now()),
      }))
    }
    return []
  } catch (error) {
    console.error("Error getting coupons:", error)
    return []
  }
}

export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const coupons = await getCoupons()
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase())
    return coupon || null
  } catch (error) {
    console.error("Error getting coupon by code:", error)
    return null
  }
}

export const useCoupon = async (couponId: string) => {
  try {
    const db = ensureDatabase()
    const couponRef = ref(db, `coupons/${couponId}`)
    const snapshot = await get(couponRef)

    if (snapshot.exists()) {
      const coupon = snapshot.val()
      await update(couponRef, { usedCount: (coupon.usedCount || 0) + 1 })
    }
  } catch (error) {
    console.error("Error using coupon:", error)
    throw error
  }
}

export const deleteCoupon = async (id: string) => {
  try {
    const db = ensureDatabase()
    const couponRef = ref(db, `coupons/${id}`)
    await remove(couponRef)
  } catch (error) {
    console.error("Error deleting coupon:", error)
    throw error
  }
}
