"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, CreditCard, User, MapPin, Phone, Hash } from "lucide-react"
import type { CartItem } from "@/types"
import { addOrder, getSiteSettings } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"

interface MangoCheckoutProps {
  items: CartItem[]
  total: number
  onSuccess: () => void
}

export function MangoCheckout({ items, total, onSuccess }: MangoCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [paymentNumber, setPaymentNumber] = useState("")
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
    const fetchPaymentNumber = async () => {
      try {
        const settings = await getSiteSettings()
        setPaymentNumber(settings.paymentNumber)
      } catch (error) {
        console.error("Error fetching payment number:", error)
      }
    }
    fetchPaymentNumber()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        userId: user?.uid,
        items,
        total,
        status: "pending" as const,
        createdAt: new Date(),
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        },
        paymentInfo: {
          transactionId: formData.transactionId,
          lastThreeDigits: formData.lastThreeDigits,
          paymentNumber,
        },
      }

      await addOrder(orderData)

      toast({
        title: "Order Placed Successfully!",
        description: "Your mango order has been placed. You will receive a confirmation email shortly.",
      })

      onSuccess()
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <Card className="bg-black/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img
                    src={item.product.image || "/placeholder.svg"}
                    alt={item.product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <p className="text-white font-medium">{item.product.name}</p>
                    <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-red-500 font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <Separator className="bg-red-500/20" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-white">Total:</span>
              <span className="text-red-500">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <Card className="bg-black/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white">Checkout Information</CardTitle>
            <CardDescription className="text-gray-400">
              Please fill in your details and payment information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/50 border-red-500/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-black/50 border-red-500/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-black/50 border-red-500/20 text-white"
                    placeholder="+880XXXXXXXXX"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-white flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Delivery Address *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-black/50 border-red-500/20 text-white"
                    placeholder="Enter your complete delivery address"
                    required
                  />
                </div>
              </div>

              <Separator className="bg-red-500/20" />

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Information
                </h3>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">Payment Instructions:</p>
                  <p className="text-gray-300 text-sm mb-2">Please send the payment to the following number:</p>
                  <p className="text-red-500 font-bold text-lg">{paymentNumber}</p>
                  <p className="text-gray-400 text-sm mt-2">
                    After payment, enter the transaction ID and last 3 digits of your phone number below.
                  </p>
                </div>

                <div>
                  <Label htmlFor="transactionId" className="text-white flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    Transaction ID *
                  </Label>
                  <Input
                    id="transactionId"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="bg-black/50 border-red-500/20 text-white"
                    placeholder="Enter transaction ID from payment"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastThreeDigits" className="text-white">
                    Last 3 Digits of Your Phone Number *
                  </Label>
                  <Input
                    id="lastThreeDigits"
                    value={formData.lastThreeDigits}
                    onChange={(e) => setFormData({ ...formData, lastThreeDigits: e.target.value })}
                    className="bg-black/50 border-red-500/20 text-white"
                    placeholder="XXX"
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 neon-glow"
              >
                {loading ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
