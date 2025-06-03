"use client"

import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getDatabase, type Database, ref, get, set, update, push, remove, onValue } from "firebase/database"
import { firebaseConfig, ADMIN_EMAILS, BANGLADESH_DISTRICTS, calculateDeliveryCharge } from "./firebase-config"
import type { Product, Order, SiteSettings, Coupon, Review } from "@/types"

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let database: Database
let isInitialized = false

const initializeFirebase = () => {
  if (isInitialized) return { app, auth, database }

  try {
    console.log("🔥 Initializing Firebase with config:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      databaseURL: firebaseConfig.databaseURL,
    })

    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    database = getDatabase(app)

    // Set persistence to keep user logged in
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn("Could not set auth persistence:", error)
    })

    isInitialized = true
    console.log("✅ Firebase initialized successfully")

    return { app, auth, database }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error)
    throw error
  }
}

// Initialize Firebase immediately
try {
  const firebase = initializeFirebase()
  app = firebase.app
  auth = firebase.auth
  database = firebase.database
} catch (error) {
  console.error("Failed to initialize Firebase:", error)
}

// Export Firebase instances
export { app, auth, database }

// Export auth getter function for compatibility
export const getFirebaseAuth = () => {
  if (!auth) {
    const firebase = initializeFirebase()
    return firebase.auth
  }
  return auth
}

export const getFirebaseDatabase = () => {
  if (!database) {
    const firebase = initializeFirebase()
    return firebase.database
  }
  return database
}

export { BANGLADESH_DISTRICTS, calculateDeliveryCharge }

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Connection status checker
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const db = getFirebaseDatabase()
    const testRef = ref(db, ".info/connected")
    const snapshot = await get(testRef)
    return snapshot.val() === true
  } catch (error) {
    console.error("Firebase connection check failed:", error)
    return false
  }
}

// Initialize admin users in database
export const initializeAdmins = async (): Promise<void> => {
  try {
    const db = getFirebaseDatabase()
    const adminsRef = ref(db, "admins")

    try {
      const snapshot = await get(adminsRef)
      if (snapshot.exists()) {
        console.log("✅ Admin users already exist")
        return
      }
    } catch (readError) {
      console.log("ℹ️ Cannot read admins (this is normal on first setup)")
    }

    try {
      const adminData: { [key: string]: { email: string; role: string; createdAt: number } } = {}

      ADMIN_EMAILS.forEach((email, index) => {
        adminData[`admin_${index}`] = {
          email: email,
          role: "admin",
          createdAt: Date.now(),
        }
      })

      await set(adminsRef, adminData)
      console.log("✅ Admin users initialized successfully")
    } catch (writeError) {
      console.warn("⚠️ Could not initialize admins automatically:", writeError)
    }
  } catch (error) {
    console.error("❌ Error during admin initialization:", error)
  }
}

// Real-time listeners with error handling
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  try {
    const db = getFirebaseDatabase()
    const ordersRef = ref(db, "orders")

    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const orders = snapshot.val()
          const orderList = Object.values(orders)
            .map((order: any) => ({
              ...order,
              createdAt: new Date(order.createdAt || Date.now()),
            }))
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
          callback(orderList)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error("Error in orders subscription:", error)
        callback([])
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Failed to subscribe to orders:", error)
    return () => {}
  }
}

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  try {
    const db = getFirebaseDatabase()
    const productsRef = ref(db, "products")

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const products = snapshot.val()
          const productList = Object.values(products).map((product: any) => ({
            ...product,
            createdAt: new Date(product.createdAt || Date.now()),
            variants:
              product.variants?.map((variant: any) => ({
                ...variant,
                price: variant.price !== null ? variant.price : undefined,
              })) || [],
          }))
          callback(productList)
        } else {
          callback([])
        }
      },
      (error) => {
        console.error("Error in products subscription:", error)
        callback([])
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("Failed to subscribe to products:", error)
    return () => {}
  }
}

// Site Settings functions
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const defaultSettings: SiteSettings = {
    itSolutionsAvailable: true,
    tshirtPageAvailable: true,
    paymentNumbers: {
      bkash: "+88019191191919",
      nagad: "+88019191191919",
      rocket: "+88019191191919",
    },
    categoryThumbnails: {
      tshirts: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop",
    },
    featureIcons: {
      delivery: "truck",
      quality: "shield-check",
      support: "zap",
    },
  }

  try {
    const db = getFirebaseDatabase()
    const settingsRef = ref(db, "settings")
    const snapshot = await get(settingsRef)

    if (snapshot.exists()) {
      const settings = snapshot.val() as SiteSettings
      // Ensure all required fields exist
      if (!settings.categoryThumbnails) {
        settings.categoryThumbnails = defaultSettings.categoryThumbnails
        await set(settingsRef, settings)
      }
      if (!settings.featureIcons) {
        settings.featureIcons = defaultSettings.featureIcons
        await set(settingsRef, settings)
      }
      return settings
    } else {
      await set(settingsRef, defaultSettings)
      return defaultSettings
    }
  } catch (error) {
    console.error("Error getting site settings:", error)
    // Return default settings if there's an error
    return defaultSettings
  }
}

export const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
  try {
    const db = getFirebaseDatabase()
    const settingsRef = ref(db, "settings")
    await update(settingsRef, settings)
  } catch (error) {
    console.error("Error updating site settings:", error)
    throw error
  }
}

// Product functions with enhanced error handling
export const addProduct = async (product: Omit<Product, "id">) => {
  try {
    const db = getFirebaseDatabase()
    const productsRef = ref(db, "products")
    const newProductRef = push(productsRef)

    // Clean the product data to ensure no undefined values
    const cleanProduct = {
      ...product,
      id: newProductRef.key,
      createdAt: Date.now(),
      // Ensure variants don't have undefined prices
      variants:
        product.variants?.map((variant) => ({
          ...variant,
          price: variant.price !== undefined ? variant.price : null, // Convert undefined to null
        })) || [],
    }

    console.log("🔧 Cleaned product data:", cleanProduct)
    await set(newProductRef, cleanProduct)
    console.log("✅ Product added successfully:", cleanProduct)
    return newProductRef.key
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const db = getFirebaseDatabase()
    const productsRef = ref(db, "products")
    const snapshot = await get(productsRef)

    if (snapshot.exists()) {
      const products = snapshot.val()
      const productList = Object.values(products).map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt || Date.now()),
        // Convert null prices back to undefined for variants
        variants:
          product.variants?.map((variant: any) => ({
            ...variant,
            price: variant.price !== null ? variant.price : undefined,
          })) || [],
      }))
      console.log("📦 Retrieved products:", productList)
      return productList
    }
    console.log("📦 No products found in database")
    return []
  } catch (error) {
    console.error("Error getting products:", error)
    return []
  }
}

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const db = getFirebaseDatabase()
    const productRef = ref(db, `products/${id}`)
    const snapshot = await get(productRef)

    if (snapshot.exists()) {
      const product = snapshot.val()
      return {
        ...product,
        createdAt: new Date(product.createdAt || Date.now()),
        variants:
          product.variants?.map((variant: any) => ({
            ...variant,
            price: variant.price !== null ? variant.price : undefined,
          })) || [],
      }
    }
    return null
  } catch (error) {
    console.error("Error getting product by ID:", error)
    return null
  }
}

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    console.log(`🔍 Searching for products in category: "${category}"`)
    const products = await getProducts()
    console.log(`📦 Total products found: ${products.length}`)

    // Log all products for debugging
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}: "${product.name}" - Category: "${product.category}" - ID: ${product.id}`)
    })

    // Enhanced category matching - STRICT filtering
    const normalizedCategory = category.toLowerCase().trim()

    // Define exact category mappings
    const categoryMappings: { [key: string]: string[] } = {
      fruits: ["fruits", "fruit"],
      fruit: ["fruits", "fruit"],
      "t-shirts": ["t-shirts", "t-shirt", "tshirts", "tshirt"],
      "t-shirt": ["t-shirts", "t-shirt", "tshirts", "tshirt"],
      tshirts: ["t-shirts", "t-shirt", "tshirts", "tshirt"],
      tshirt: ["t-shirts", "t-shirt", "tshirts", "tshirt"],
    }

    const allowedCategories = categoryMappings[normalizedCategory] || [normalizedCategory]

    console.log("🔍 Allowed categories for matching:", allowedCategories)

    const filteredProducts = products.filter((product) => {
      const productCategory = product.category.toLowerCase().trim()
      const isMatch = allowedCategories.includes(productCategory)
      console.log(
        `📦 Product "${product.name}" category: "${product.category}" (normalized: "${productCategory}") - Match: ${isMatch}`,
      )
      return isMatch
    })

    console.log(`✅ Found ${filteredProducts.length} products in category "${category}"`)

    if (filteredProducts.length === 0) {
      console.log("⚠️ No products found. Available categories:")
      const uniqueCategories = [...new Set(products.map((p) => p.category))]
      uniqueCategories.forEach((cat) => console.log(`   - "${cat}"`))
    }

    return filteredProducts
  } catch (error) {
    console.error(`❌ Error getting products by category "${category}":`, error)
    return []
  }
}

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const db = getFirebaseDatabase()
    const productRef = ref(db, `products/${id}`)

    // Clean the product data
    const cleanData = {
      ...productData,
      variants: productData.variants?.map((variant) => ({
        ...variant,
        price: variant.price !== undefined ? variant.price : null,
      })),
    }

    await update(productRef, cleanData)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (id: string) => {
  try {
    const db = getFirebaseDatabase()
    const productRef = ref(db, `products/${id}`)
    await remove(productRef)
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Order functions - Allow guest orders
export const addOrder = async (order: Omit<Order, "id">) => {
  try {
    const db = getFirebaseDatabase()
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
      // Allow guest orders
      userId: order.userId || "guest",
      userEmail: order.userEmail || "guest@example.com",
      userName: order.userName || "Guest User",
    }

    await set(newOrderRef, orderWithId)

    return orderWithId.id
  } catch (error) {
    console.error("Error adding order:", error)
    throw error
  }
}

export const getOrders = async (): Promise<Order[]> => {
  try {
    const db = getFirebaseDatabase()
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
    const orders = await getOrders()
    return orders.filter((order) => order.userId === userId)
  } catch (error) {
    console.error("Error getting user orders:", error)
    return []
  }
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
  try {
    const db = getFirebaseDatabase()
    const orderRef = ref(db, `orders/${orderId}`)
    await update(orderRef, { status })
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export const updateOrderTrackingId = async (orderId: string, trackingId: string) => {
  try {
    const db = getFirebaseDatabase()
    const orderRef = ref(db, `orders/${orderId}`)
    await update(orderRef, {
      trackingId,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error("Error updating tracking ID:", error)
    throw error
  }
}

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const db = getFirebaseDatabase()
    const orderRef = ref(db, `orders/${orderId}`)
    await remove(orderRef)
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

// Coupon functions
export const addCoupon = async (coupon: Omit<Coupon, "id">) => {
  try {
    const db = getFirebaseDatabase()
    const couponsRef = ref(db, "coupons")
    const newCouponRef = push(couponsRef)
    const couponWithId = {
      ...coupon,
      id: newCouponRef.key,
      createdAt: Date.now(),
      expiryDate: new Date(coupon.expiryDate).getTime(),
      usedCount: 0, // Initialize usage count
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
    const db = getFirebaseDatabase()
    const couponsRef = ref(db, "coupons")
    const snapshot = await get(couponsRef)

    if (snapshot.exists()) {
      const coupons = snapshot.val()
      return Object.values(coupons).map((coupon: any) => ({
        ...coupon,
        createdAt: new Date(coupon.createdAt || Date.now()),
        expiryDate: new Date(coupon.expiryDate || Date.now()),
        usedCount: coupon.usedCount || 0, // Ensure usedCount exists
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

export const useCoupon = async (couponCode: string) => {
  try {
    console.log(`🎫 [COUPON] Starting usage tracking for: ${couponCode}`)

    // Find coupon by code
    const coupons = await getCoupons()
    console.log(`🎫 [COUPON] Found ${coupons.length} total coupons`)

    const coupon = coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase())

    if (!coupon) {
      console.error(`❌ [COUPON] Coupon not found: ${couponCode}`)
      console.log(
        `🎫 [COUPON] Available coupons:`,
        coupons.map((c) => c.code),
      )
      return
    }

    console.log(`🎫 [COUPON] Found coupon: ${coupon.code} (ID: ${coupon.id})`)
    console.log(`🎫 [COUPON] Current usage: ${coupon.usedCount || 0}/${coupon.usageLimit}`)

    const db = getFirebaseDatabase()
    const couponRef = ref(db, `coupons/${coupon.id}`)
    const snapshot = await get(couponRef)

    if (snapshot.exists()) {
      const couponData = snapshot.val()
      const currentUsedCount = couponData.usedCount || 0
      const newUsedCount = currentUsedCount + 1

      console.log(`🎫 [COUPON] Updating usage: ${currentUsedCount} -> ${newUsedCount}`)

      const updateData = {
        usedCount: newUsedCount,
        lastUsed: Date.now(),
      }

      await update(couponRef, updateData)
      console.log(`✅ [COUPON] Successfully updated ${couponCode} usage to ${newUsedCount}`)

      // Verify the update
      const verifySnapshot = await get(couponRef)
      if (verifySnapshot.exists()) {
        const verifyData = verifySnapshot.val()
        console.log(`🔍 [COUPON] Verification - New usage count: ${verifyData.usedCount}`)
      }
    } else {
      console.error(`❌ [COUPON] Coupon data not found for ID: ${coupon.id}`)
    }
  } catch (error) {
    console.error("❌ [COUPON] Error using coupon:", error)
    throw error
  }
}

export const deleteCoupon = async (id: string) => {
  try {
    const db = getFirebaseDatabase()
    const couponRef = ref(db, `coupons/${id}`)
    await remove(couponRef)
  } catch (error) {
    console.error("Error deleting coupon:", error)
    throw error
  }
}

// Review functions
export const addReview = async (review: Omit<Review, "id">) => {
  try {
    console.log(`📝 [REVIEW] Adding review for product: ${review.productId}`)
    const db = getFirebaseDatabase()
    const reviewsRef = ref(db, `reviews/${review.productId}`)
    const newReviewRef = push(reviewsRef)
    const reviewWithId = {
      ...review,
      id: newReviewRef.key,
      createdAt: Date.now(),
    }

    console.log(`📝 [REVIEW] Review data:`, reviewWithId)
    await set(newReviewRef, reviewWithId)
    console.log(`✅ [REVIEW] Review added successfully with ID: ${newReviewRef.key}`)
    return newReviewRef.key
  } catch (error) {
    console.error("❌ [REVIEW] Error adding review:", error)
    throw error
  }
}

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const db = getFirebaseDatabase()
    const reviewsRef = ref(db, `reviews/${productId}`)
    const snapshot = await get(reviewsRef)

    if (snapshot.exists()) {
      const reviews = snapshot.val()
      return Object.values(reviews)
        .map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt || Date.now()),
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    return []
  } catch (error) {
    console.error("Error getting product reviews:", error)
    return []
  }
}

export const getProductRating = async (productId: string): Promise<{ average: number; count: number }> => {
  try {
    const reviews = await getProductReviews(productId)
    if (reviews.length === 0) {
      return { average: 0, count: 0 }
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    const average = total / reviews.length

    return { average: Math.round(average * 10) / 10, count: reviews.length }
  } catch (error) {
    console.error("Error getting product rating:", error)
    return { average: 0, count: 0 }
  }
}

export const deleteReview = async (productId: string, reviewId: string) => {
  try {
    const db = getFirebaseDatabase()
    const reviewRef = ref(db, `reviews/${productId}/${reviewId}`)
    await remove(reviewRef)
  } catch (error) {
    console.error("Error deleting review:", error)
    throw error
  }
}

// Image upload helper function
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    console.log("🚀 Starting Cloudinary upload for:", file.name)

    // Validate file
    if (!file) {
      throw new Error("No file provided")
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB")
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPEG, PNG, WebP, and GIF files are allowed")
    }

    // Compress image if it's too large
    let processedFile = file
    if (file.size > 1024 * 1024) {
      // If file is larger than 1MB, compress it
      try {
        processedFile = await compressImage(file)
        console.log(
          `📦 Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(
            processedFile.size / 1024 / 1024
          ).toFixed(2)}MB`,
        )
      } catch (compressError) {
        console.warn("Could not compress image, using original:", compressError)
        processedFile = file
      }
    }

    const formData = new FormData()
    formData.append("file", processedFile)
    formData.append("upload_preset", "innovacart") // Your actual preset name
    formData.append("cloud_name", "dxlry29hz") // Your actual cloud name

    console.log("📤 Uploading to Cloudinary...")

    const response = await fetch("https://api.cloudinary.com/v1_1/dxlry29hz/image/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("❌ Cloudinary upload failed:", errorData)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✅ Cloudinary upload successful:", data.secure_url)

    return data.secure_url
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error)
    if (error instanceof Error) {
      throw new Error(`Image upload failed: ${error.message}`)
    }
    throw new Error("Image upload failed: Unknown error")
  }
}

// Convert file to base64 for local storage/display
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Utility function to compress images before upload
export const compressImage = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      const maxWidth = 1200

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error("Failed to compress image"))
          }
        },
        file.type,
        quality,
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}
