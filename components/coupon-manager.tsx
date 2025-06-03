"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Ticket, Calendar, Users, Percent, Sparkles } from "lucide-react"
import { addCoupon, getCoupons, deleteCoupon } from "@/lib/firebase"
import type { Coupon } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { motion } from "framer-motion"

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    discountType: "percentage" as "percentage" | "fixed",
    maxUsage: "",
    expiryDate: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const fetchedCoupons = await getCoupons()
      setCoupons(fetchedCoupons)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    }
  }

  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code: result })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount: Number.parseFloat(formData.discount),
        discountType: formData.discountType,
        maxUsage: Number.parseInt(formData.maxUsage),
        usedCount: 0,
        isActive: true,
        expiryDate: new Date(formData.expiryDate),
        createdAt: new Date(),
      }

      await addCoupon(couponData)
      toast({
        title: "Success",
        description: "Coupon created successfully",
      })

      setFormData({
        code: "",
        discount: "",
        discountType: "percentage",
        maxUsage: "",
        expiryDate: "",
      })
      fetchCoupons()
    } catch (error) {
      console.error("Error creating coupon:", error)
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (couponId: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteCoupon(couponId)
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        fetchCoupons()
      } catch (error) {
        console.error("Error deleting coupon:", error)
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        })
      }
    }
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const expiry = new Date(coupon.expiryDate)

    if (!coupon.isActive) return { status: "Inactive", color: "bg-gray-500/20 text-gray-500" }
    if (expiry < now) return { status: "Expired", color: "bg-red-500/20 text-red-500" }
    if (coupon.usedCount >= coupon.maxUsage) return { status: "Used Up", color: "bg-orange-500/20 text-orange-500" }
    return { status: "Active", color: "bg-green-500/20 text-green-500" }
  }

  return (
    <div className="space-y-8">
      {/* Create Coupon Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="elegant-text flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-red-500" />
              Create New Coupon
            </CardTitle>
            <CardDescription className="elegant-text-muted">
              Generate discount coupons for your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code" className="elegant-text">
                    Coupon Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="elegant-input"
                      placeholder="SAVE20"
                      required
                    />
                    <Button type="button" onClick={generateCouponCode} className="elegant-button">
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="discountType" className="elegant-text">
                    Discount Type
                  </Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger className="elegant-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount" className="elegant-text">
                    Discount Value
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="elegant-input"
                    placeholder={formData.discountType === "percentage" ? "20" : "100"}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="maxUsage" className="elegant-text">
                    Max Usage Count
                  </Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                    className="elegant-input"
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate" className="elegant-text">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="elegant-input"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="elegant-button w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Creating..." : "Create Coupon"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coupons List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="elegant-text flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-red-500" />
              Active Coupons
            </CardTitle>
            <CardDescription className="elegant-text-muted">Manage your existing discount coupons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon, index) => {
                const status = getCouponStatus(coupon)
                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="elegant-product-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="elegant-text font-bold text-lg neon-red">{coupon.code}</h3>
                            <Badge className={`${status.color} border-0 mt-1`}>{status.status}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(coupon.id)}
                            className="elegant-border-red text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="elegant-text-muted flex items-center">
                              <Percent className="w-4 h-4 mr-1" />
                              Discount:
                            </span>
                            <span className="elegant-text font-semibold">
                              {coupon.discountType === "percentage" ? `${coupon.discount}%` : `৳${coupon.discount}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="elegant-text-muted flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              Usage:
                            </span>
                            <span className="elegant-text">
                              {coupon.usedCount} / {coupon.maxUsage}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="elegant-text-muted flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Expires:
                            </span>
                            <span className="elegant-text text-sm">
                              {format(new Date(coupon.expiryDate), "MMM dd, yyyy")}
                            </span>
                          </div>

                          {/* Usage Progress Bar */}
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((coupon.usedCount / coupon.maxUsage) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {coupons.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="elegant-text text-lg font-semibold mb-2">No coupons created yet</h3>
                <p className="elegant-text-muted">Create your first coupon to start offering discounts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
