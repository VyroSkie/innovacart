"use client"

import { useState, useEffect } from "react"
import type { CartItem } from "@/types"
import { getSiteSettings, calculateDeliveryCharge, getCouponByCode } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface FruitCheckoutProps {
  items: CartItem[]
  total: number
  onSuccess: () => void
}

export function FruitCheckout({ items, total, onSuccess }: FruitCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [paymentNumbers, setPaymentNumbers] = useState({
    bkash: "",
    nagad: "",
    rocket: "",
  })
  const [district, setDistrict] = useState("Dhaka")
  const [deliveryCharge, setDeliveryCharge] = useState(80)
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad" | "Rocket">("bKash")
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discount, setDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    transactionId: "",
    lastThreeDigits: "",
  })
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(1)

  useEffect(() => {
    const fetchPaymentNumbers = async () => {
      try {
        const settings = await getSiteSettings()
        setPaymentNumbers(
          settings.paymentNumbers || {
            bkash: "+88019191191919",
            nagad: "+88019191191919",
            rocket: "+88019191191919",
          },
        )
      } catch (error) {
        console.error("Error fetching payment numbers:", error)
        setPaymentNumbers({
          bkash: "+88019191191919",
          nagad: "+88019191191919",
          rocket: "+88019191191919",
        })
      }
    }
    fetchPaymentNumbers()
  }, [])

  useEffect(() => {
    setDeliveryCharge(calculateDeliveryCharge(district))
  }, [district])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
      }))
    }
  }, [user])

  const getCurrentPaymentNumber = () => {
    switch (paymentMethod) {
      case "bKash":
        return paymentNumbers.bkash
      case "Nagad":
        return paymentNumbers.nagad
      case "Rocket":
        return paymentNumbers.rocket
      default:
        return paymentNumbers.bkash
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      })
      return
    }

    setCouponLoading(true)
    try {
      const coupon = await getCouponByCode(couponCode.trim())

      if (!coupon) {
        toast({
          title: "Invalid Coupon",
          description: "Coupon code not found",
          variant: "destructive",
        })
        return
      }

      if (!coupon.isActive) {
        toast({
          title: "Invalid Coupon",
          description: "This coupon is no longer active",
          variant: "destructive",
        })
        return
      }

      if (new Date(coupon.expiryDate) < new Date()) {
        toast({
          title: "Expired Coupon",
          description: "This coupon has expired",
          variant: "destructive",
        })
        return
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        toast({
          title: "Coupon Used Up",
          description: "This coupon has reached its usage limit",
          variant: "destructive",
        })
        return
      }

      let discountAmount = 0
      if (coupon.discountType === "percentage") {
        discountAmount = (total * coupon.discount) / 100
      } else {
        discountAmount = coupon.discount
      }

      discountAmount = Math.min(discountAmount, total)

      setAppliedCoupon(coupon)
      setDiscount(discountAmount)

      toast({
        title: "Coupon Applied!",
        description: `You saved ৳${discountAmount.toFixed(2)}`,
      })
    } catch (error) {
      console.error("Error applying coupon:", error)
      toast({
        title: "Error",
        description: "Failed to apply coupon",
        variant: "destructive",
      })
    } finally {
      setCouponLoading(false)
    }
  }

  const\
