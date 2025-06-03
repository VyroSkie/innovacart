"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  CreditCard,
  User,
  MapPin,
  Phone,
  Hash,
  Truck,
  Check,
  Shield,
  Gift,
  ChevronRight,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/hooks/use-cart"
import {
  addOrder,
  getSiteSettings,
  BANGLADESH_DISTRICTS,
  calculateDeliveryCharge,
  getCouponByCode,
} from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
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
  const [currentStep, setCurrentStep] = useState(1)
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

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items, router])

  useEffect(() => {
    const fetchPaymentNumbers = async () => {
      try {
        const settings = await getSiteSettings()
        setPaymentNumbers(
          settings?.paymentNumbers || {
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
        title: "Coupon Applied! 🎉",
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

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    setCouponCode("")
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderItems = items.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.selectedVariant ? item.selectedVariant.price || item.product.price : item.product.price,
          image: item.product.image,
          category: item.product.category,
          variant: item.selectedVariant
            ? {
                id: item.selectedVariant.id,
                name: item.selectedVariant.name,
                price: item.selectedVariant.price || item.product.price,
              }
            : null,
        },
        quantity: item.quantity,
      }))

      const orderData = {
        userId: user?.uid || null,
        items: orderItems,
        total,
        deliveryCharge,
        discount,
        couponCode: appliedCoupon?.code || null,
        grandTotal: total + deliveryCharge - discount,
        status: "pending" as const,
        createdAt: new Date(),
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          district,
          address: formData.address,
        },
        paymentInfo: {
          method: paymentMethod,
          transactionId: formData.transactionId,
          lastThreeDigits: formData.lastThreeDigits,
          paymentNumber: getCurrentPaymentNumber(),
        },
      }

      await addOrder(orderData)

      toast({
        title: "Order Placed Successfully! 🎉",
        description: "Your order has been placed. You will receive a confirmation shortly.",
      })

      clearCart()
      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
      if (!district || !formData.address) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    }

    setCurrentStep(currentStep + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const finalTotal = total + deliveryCharge - discount

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen premium-bg">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-5xl font-bold premium-text mb-4">
              Secure <span className="premium-glow-text">Checkout</span>
            </h1>
            <p className="premium-text-muted text-lg">Complete your order in just a few steps</p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <div className="flex items-center space-x-4 md:space-x-8">
              {[
                { step: 1, title: "Customer Info", icon: User },
                { step: 2, title: "Shipping", icon: Truck },
                { step: 3, title: "Payment", icon: CreditCard },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "border-purple-500/30 premium-text"
                    }`}
                  >
                    {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="ml-2 premium-text font-medium hidden md:inline">{title}</span>
                  {step < 3 && <ChevronRight className="w-4 h-4 premium-text-muted ml-4 hidden md:inline-block" />}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Order Summary - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:col-span-1"
            >
              <Card className="premium-card sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="premium-text flex items-center text-xl">
                    <ShoppingCart className="w-6 h-6 mr-3 premium-text-accent" />
                    Order Summary
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">Secure Checkout</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Items */}
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-purple-500/5 rounded-lg">
                        <img
                          src={item.product.image || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="premium-text font-medium text-sm">{item.product.name}</h4>
                          {item.selectedVariant && (
                            <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs mt-1">
                              {item.selectedVariant.name}
                            </Badge>
                          )}
                          <div className="flex justify-between items-center mt-1">
                            <span className="premium-text-muted text-xs">Qty: {item.quantity}</span>
                            <span className="premium-text-accent font-semibold text-sm">
                              ৳
                              {(
                                (item.selectedVariant
                                  ? item.selectedVariant.price || item.product.price
                                  : item.product.price) * item.quantity
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Section - Enhanced */}
                  <div className="space-y-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center">
                      <Gift className="w-5 h-5 mr-2 premium-text-accent" />
                      <Label className="premium-text font-medium">Have a Coupon?</Label>
                    </div>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="bg-black/50 border-purple-500/20 premium-text"
                          placeholder="Enter coupon code"
                        />
                        <Button
                          type="button"
                          onClick={applyCoupon}
                          disabled={couponLoading}
                          className="premium-button whitespace-nowrap"
                        >
                          {couponLoading ? "Checking..." : "Apply"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-medium">{appliedCoupon.code}</span>
                          <span className="premium-text-muted text-sm ml-2">(-৳{discount.toFixed(2)})</span>
                        </div>
                        <Button
                          type="button"
                          onClick={removeCoupon}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-purple-500/20" />

                  {/* Pricing Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="premium-text">Subtotal:</span>
                      <span className="premium-text-accent font-semibold">৳{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-1 premium-text-accent" />
                        <span className="premium-text">Delivery:</span>
                      </div>
                      <span className="premium-text-accent font-semibold">৳{deliveryCharge.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="premium-text">Discount:</span>
                        <span className="text-green-400 font-semibold">-৳{discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="flex justify-between items-center text-xl font-bold p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                    <span className="premium-text">Total:</span>
                    <span className="premium-glow-text">৳{finalTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Checkout Form - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="xl:col-span-2"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Customer Information */}
                {currentStep === 1 && (
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle className="premium-text flex items-center text-xl">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          1
                        </div>
                        Customer Information
                      </CardTitle>
                      <CardDescription className="premium-text-muted">
                        Please provide your contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="premium-text font-medium">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/50 border-purple-500/20 premium-text h-12"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="premium-text font-medium">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-black/50 border-purple-500/20 premium-text h-12"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="premium-text font-medium flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="bg-black/50 border-purple-500/20 premium-text h-12"
                          placeholder="+880XXXXXXXXX"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                        >
                          Continue to Shipping
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Shipping Information */}
                {currentStep === 2 && (
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle className="premium-text flex items-center text-xl">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          2
                        </div>
                        Shipping Information
                      </CardTitle>
                      <CardDescription className="premium-text-muted">
                        Where should we deliver your order?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="district" className="premium-text font-medium flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          District *
                        </Label>
                        <Select value={district} onValueChange={setDistrict}>
                          <SelectTrigger className="bg-black/50 border-purple-500/20 premium-text h-12">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {BANGLADESH_DISTRICTS.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs premium-text-muted">
                          Delivery charge: ৳{deliveryCharge} ({district === "Dhaka" ? "Inside" : "Outside"} Dhaka)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="premium-text font-medium flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Delivery Address *
                        </Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="bg-black/50 border-purple-500/20 premium-text min-h-[100px]"
                          placeholder="Enter your complete delivery address"
                          required
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-purple-500/20 text-white"
                        >
                          <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                        >
                          Continue to Payment
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Payment Information */}
                {currentStep === 3 && (
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle className="premium-text flex items-center text-xl">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          3
                        </div>
                        Payment Information
                      </CardTitle>
                      <CardDescription className="premium-text-muted">
                        Complete your payment to place the order
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="premium-text font-medium">
                          Payment Method *
                        </Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(value: "bKash" | "Nagad" | "Rocket") => setPaymentMethod(value)}
                        >
                          <SelectTrigger className="bg-black/50 border-purple-500/20 premium-text h-12">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bKash">bKash</SelectItem>
                            <SelectItem value="Nagad">Nagad</SelectItem>
                            <SelectItem value="Rocket">Rocket</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CreditCard className="w-8 h-8 premium-text-accent" />
                          </div>
                          <div>
                            <p className="premium-text font-medium mb-2">Payment Instructions:</p>
                            <p className="premium-text-muted text-sm mb-4">
                              Please send ৳{finalTotal.toFixed(2)} to the following {paymentMethod} number:
                            </p>
                            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                              <p className="premium-glow-text font-bold text-2xl">{getCurrentPaymentNumber()}</p>
                            </div>
                            <p className="premium-text-muted text-sm mt-4">
                              After payment, enter the transaction details below.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="transactionId" className="premium-text font-medium flex items-center">
                            <Hash className="w-4 h-4 mr-2" />
                            Transaction ID *
                          </Label>
                          <Input
                            id="transactionId"
                            value={formData.transactionId}
                            onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                            className="bg-black/50 border-purple-500/20 premium-text h-12"
                            placeholder="Enter transaction ID from payment"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastThreeDigits" className="premium-text font-medium">
                            Last 3 Digits of Your Phone Number *
                          </Label>
                          <Input
                            id="lastThreeDigits"
                            value={formData.lastThreeDigits}
                            onChange={(e) => setFormData({ ...formData, lastThreeDigits: e.target.value })}
                            className="bg-black/50 border-purple-500/20 premium-text h-12"
                            placeholder="XXX"
                            maxLength={3}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="border-purple-500/20 text-white"
                        >
                          <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                              Placing Order...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Shield className="w-5 h-5 mr-3" />
                              Place Order
                            </div>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
