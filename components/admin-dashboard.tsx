"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  updateOrderStatus,
  deleteOrder,
  getSiteSettings,
  updateSiteSettings,
  getCoupons,
  addCoupon,
  deleteCoupon,
  updateOrderTrackingId,
  getProducts,
  getOrders,
} from "@/lib/firebase"
import type { Product, Order, SiteSettings, Coupon } from "@/types"
import {
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Trash,
  Clock,
  Truck,
  CheckCircle,
  FileText,
  LogOut,
  Shield,
  Settings,
  Ticket,
  Loader2,
  Upload,
  Zap,
  ShieldCheck,
  Headphones,
  Star,
  Heart,
  Award,
  Users,
  Globe,
  Smartphone,
} from "lucide-react"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { ProductManager } from "@/components/product-manager"

const iconOptions = [
  { value: "truck", label: "Truck", icon: Truck },
  { value: "shield-check", label: "Shield Check", icon: ShieldCheck },
  { value: "zap", label: "Zap", icon: Zap },
  { value: "headphones", label: "Headphones", icon: Headphones },
  { value: "star", label: "Star", icon: Star },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "award", label: "Award", icon: Award },
  { value: "users", label: "Users", icon: Users },
  { value: "globe", label: "Globe", icon: Globe },
  { value: "smartphone", label: "Smartphone", icon: Smartphone },
]

export function AdminDashboard() {
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const { toast } = useToast()
  const { user, signOut } = useAuth()

  // Calculate stats from current data
  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    activeCoupons: coupons.filter((c) => c.isActive && new Date(c.expiryDate) > new Date()).length,
    revenue: orders.reduce((total, order) => total + (order.grandTotal || order.total || 0), 0),
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => o.status === "processing").length,
    shippedOrders: orders.filter((o) => o.status === "shipped").length,
    deliveredOrders: orders.filter((o) => o.status === "delivered").length,
  }

  // Real-time data subscription
  useEffect(() => {
    fetchInitialData()

    // Use regular polling instead of real-time for now
    const interval = setInterval(() => {
      fetchAllData()
      setLastUpdated(new Date())
    }, 3000) // 3 second refresh

    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    try {
      const [productsData, ordersData, couponsData, settingsData] = await Promise.all([
        getProducts(),
        getOrders(),
        getCoupons(),
        getSiteSettings(),
      ])

      setProducts(productsData)
      setOrders(ordersData)
      setCoupons(couponsData)
      setSiteSettings(settingsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [couponsData, settingsData] = await Promise.all([getCoupons(), getSiteSettings()])

      setCoupons(couponsData)
      setSiteSettings(settingsData)
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Order Management
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId)
      console.log("🗑️ Deleting order:", orderId)

      // Immediately update local state to give immediate feedback
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId))

      // Actually delete from Firebase
      await deleteOrder(orderId)

      toast({
        title: "Success",
        description: `Order deleted successfully`,
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order: " + (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setDeletingOrderId(null)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTrackingId = async (orderId: string, trackingId: string) => {
    try {
      await updateOrderTrackingId(orderId, trackingId)
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, trackingId } : order)))
      toast({
        title: "Success",
        description: "Tracking ID updated successfully",
      })
    } catch (error) {
      console.error("Error updating tracking ID:", error)
      toast({
        title: "Error",
        description: "Failed to update tracking ID",
        variant: "destructive",
      })
    }
  }

  // Coupon Management
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    discountType: "percentage" as "percentage" | "fixed",
    maxUsage: "",
    expiryDate: "",
  })

  const handleAddCoupon = async () => {
    try {
      if (!newCoupon.code || !newCoupon.discount || !newCoupon.expiryDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      await addCoupon({
        code: newCoupon.code.toUpperCase(),
        discount: Number.parseFloat(newCoupon.discount),
        discountType: newCoupon.discountType,
        maxUsage: Number.parseInt(newCoupon.maxUsage) || 100,
        usedCount: 0,
        isActive: true,
        expiryDate: new Date(newCoupon.expiryDate),
        createdAt: new Date(),
        minPurchase: 0,
      })

      setNewCoupon({
        code: "",
        discount: "",
        discountType: "percentage",
        maxUsage: "",
        expiryDate: "",
      })

      // Refresh coupons
      const updatedCoupons = await getCoupons()
      setCoupons(updatedCoupons)

      toast({
        title: "Success",
        description: "Coupon created successfully",
      })
    } catch (error) {
      console.error("Error adding coupon:", error)
      toast({
        title: "Error",
        description: "Failed to create coupon",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await deleteCoupon(couponId)
      const updatedCoupons = await getCoupons()
      setCoupons(updatedCoupons)
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting coupon:", error)
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      })
    }
  }

  // Settings Management with Image Upload
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null)

  const handleImageUpload = async (file: File, category: "tshirts" | "fruits") => {
    try {
      setUploadingThumbnail(category)

      // Convert to base64 for immediate preview
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        // Update settings with base64 image
        const updatedSettings = {
          ...siteSettings,
          categoryThumbnails: {
            ...siteSettings?.categoryThumbnails,
            [category]: base64,
          },
        }

        await updateSiteSettings(updatedSettings)
        setSiteSettings(updatedSettings as SiteSettings)

        toast({
          title: "Success",
          description: `${category} thumbnail updated successfully`,
        })
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading thumbnail:", error)
      toast({
        title: "Error",
        description: "Failed to upload thumbnail",
        variant: "destructive",
      })
    } finally {
      setUploadingThumbnail(null)
    }
  }

  const handleUpdateSiteSettings = async (settings: Partial<SiteSettings>) => {
    try {
      await updateSiteSettings(settings)
      setSiteSettings((prev) => ({ ...prev!, ...settings }))
      toast({
        title: "Success",
        description: "Settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    }
  }

  // Utility functions
  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "processing":
        return <Package className="w-4 h-4" />
      case "shipped":
        return <Truck className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "shipped":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "delivered":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
  }

  const generateInvoice = (order: Order) => {
    const invoiceWindow = window.open("", "_blank")
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { color: #8B5CF6; font-size: 24px; font-weight: bold; }
            .invoice-details { margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">InnovaCart</div>
            <h2>Invoice</h2>
          </div>
          
          <div class="invoice-details">
            <p><strong>Order ID:</strong> ${order.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${format(new Date(order.createdAt), "PPP")}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          </div>

          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customerInfo.name}</p>
            <p><strong>Email:</strong> ${order.customerInfo.email}</p>
            <p><strong>Phone:</strong> ${order.customerInfo.phone}</p>
            <p><strong>Address:</strong> ${order.customerInfo.address}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>৳${item.product.price.toFixed(2)}</td>
                  <td>৳${(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="total">
            <p>Grand Total: ৳${(order.grandTotal || order.total || 0).toFixed(2)}</p>
          </div>

          <script>
            window.print();
          </script>
        </body>
        </html>
      `)
      invoiceWindow.document.close()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen dark-theme flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen dark-theme">
      {/* Header */}
      <div className="border-b border-purple-500/20 premium-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Welcome back, {user?.email} • Last updated: {format(lastUpdated, "HH:mm:ss")} • Real-time updates
                </p>
              </div>
            </div>
            <Button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Coupons</p>
                  <p className="text-2xl font-bold text-white">{stats.activeCoupons}</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-white">৳{stats.revenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-black/50 border border-purple-500/20 p-1 h-14">
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 font-medium h-10"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 font-medium h-10"
            >
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="coupons"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 font-medium h-10"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Coupons
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-300 font-medium h-10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-purple-400" />
                  Order Management
                </CardTitle>
                <CardDescription className="text-gray-400">Manage customer orders and track payments</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Order Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-black/30 border-yellow-500/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-yellow-400 text-2xl font-bold">{stats.pendingOrders}</p>
                        <p className="text-gray-400 text-sm">Pending</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/30 border-blue-500/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-blue-400 text-2xl font-bold">{stats.processingOrders}</p>
                        <p className="text-gray-400 text-sm">Processing</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/30 border-green-500/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-green-400 text-2xl font-bold">{stats.shippedOrders}</p>
                        <p className="text-gray-400 text-sm">Shipped</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/30 border-emerald-500/10">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-emerald-400 text-2xl font-bold">{stats.deliveredOrders}</p>
                        <p className="text-gray-400 text-sm">Delivered</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-400">No orders found</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="bg-black/30 border-purple-500/10">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-semibold text-lg">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </h3>
                              <p className="text-gray-400 text-sm">{format(new Date(order.createdAt), "PPP p")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(order.status)} border`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 font-semibold">{order.status.toUpperCase()}</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={deletingOrderId === order.id}
                              >
                                {deletingOrderId === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                              <h4 className="text-purple-400 font-medium mb-3">Customer Information</h4>
                              <div className="space-y-1 text-sm">
                                <p className="text-white font-medium">{order.customerInfo.name}</p>
                                <p className="text-gray-300">{order.customerInfo.email}</p>
                                <p className="text-gray-300">{order.customerInfo.phone}</p>
                                <p className="text-gray-400">{order.customerInfo.address}</p>
                              </div>
                            </div>

                            {order.paymentInfo && (
                              <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                                <h4 className="text-purple-400 font-medium mb-3">Payment Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p className="text-white">
                                    Method: {order.paymentInfo.method?.toUpperCase() || "N/A"}
                                  </p>
                                  <p className="text-gray-300">Transaction: {order.paymentInfo.transactionId}</p>
                                  <p className="text-gray-300">Last 3 digits: {order.paymentInfo.lastThreeDigits}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Order Items */}
                          <div className="mb-6">
                            <h4 className="text-purple-400 font-medium mb-3">Order Items</h4>
                            <div className="bg-black/20 rounded-lg border border-purple-500/10 overflow-hidden">
                              {order.items.map((item, index) => (
                                <div
                                  key={item.product.id}
                                  className={`flex justify-between items-center p-3 ${
                                    index !== order.items.length - 1 ? "border-b border-purple-500/10" : ""
                                  }`}
                                >
                                  <div>
                                    <span className="text-white font-medium">{item.product.name}</span>
                                    <span className="text-gray-400 ml-2">x {item.quantity}</span>
                                  </div>
                                  <span className="text-purple-400 font-semibold">
                                    ৳{(item.product.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}

                              <div className="bg-purple-500/5 p-3">
                                <div className="flex justify-between font-semibold text-lg">
                                  <span className="text-white">Grand Total:</span>
                                  <span className="text-purple-400">
                                    ৳{(order.grandTotal || order.total || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 flex-wrap">
                            <Select
                              value={order.status}
                              onValueChange={(value: Order["status"]) => handleUpdateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-40 bg-black/50 border-purple-500/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-purple-500/20">
                                <SelectItem value="pending" className="text-white">
                                  Pending
                                </SelectItem>
                                <SelectItem value="processing" className="text-white">
                                  Processing
                                </SelectItem>
                                <SelectItem value="shipped" className="text-white">
                                  Shipped
                                </SelectItem>
                                <SelectItem value="delivered" className="text-white">
                                  Delivered
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              size="sm"
                              onClick={() => generateInvoice(order)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Invoice
                            </Button>

                            <Input
                              placeholder="Tracking ID"
                              value={order.trackingId || ""}
                              onChange={(e) => {
                                const updatedOrders = orders.map((o) =>
                                  o.id === order.id ? { ...o, trackingId: e.target.value } : o,
                                )
                                setOrders(updatedOrders)
                              }}
                              className="w-32 bg-black/50 border-purple-500/20 text-white text-sm"
                            />

                            <Button
                              size="sm"
                              onClick={() => handleUpdateTrackingId(order.id, order.trackingId || "")}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  Coupon Management
                </CardTitle>
                <CardDescription className="text-gray-400">Create and manage discount coupons</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add Coupon Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold text-lg">Create New Coupon</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Coupon Code</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newCoupon.code}
                            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="SAVE20"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                              let result = ""
                              for (let i = 0; i < 8; i++) {
                                result += chars.charAt(Math.floor(Math.random() * chars.length))
                              }
                              setNewCoupon({ ...newCoupon, code: result })
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Discount Value</Label>
                          <Input
                            type="number"
                            value={newCoupon.discount}
                            onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Type</Label>
                          <Select
                            value={newCoupon.discountType}
                            onValueChange={(value: "percentage" | "fixed") =>
                              setNewCoupon({ ...newCoupon, discountType: value })
                            }
                          >
                            <SelectTrigger className="bg-black/50 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              <SelectItem value="percentage" className="text-white">
                                Percentage (%)
                              </SelectItem>
                              <SelectItem value="fixed" className="text-white">
                                Fixed Amount (৳)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Max Usage</Label>
                          <Input
                            type="number"
                            value={newCoupon.maxUsage}
                            onChange={(e) => setNewCoupon({ ...newCoupon, maxUsage: e.target.value })}
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Expiry Date</Label>
                          <Input
                            type="date"
                            value={newCoupon.expiryDate}
                            onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                            className="bg-black/50 border-purple-500/20 text-white"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddCoupon} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Coupons List */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">Active Coupons</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((coupon) => (
                      <Card key={coupon.id} className="bg-black/30 border-purple-500/10">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium text-lg">{coupon.code}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteCoupon(coupon.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-purple-400 font-semibold text-xl">
                              {coupon.discount}
                              {coupon.discountType === "percentage" ? "%" : "৳"} OFF
                            </p>
                            <p className="text-gray-400 text-sm">
                              Expires: {format(new Date(coupon.expiryDate), "PPP")}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Used: {coupon.usedCount || 0} / {coupon.maxUsage || "∞"}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                coupon.isActive && new Date(coupon.expiryDate) > new Date()
                                  ? "border-green-500/50 text-green-400"
                                  : "border-red-500/50 text-red-400"
                              }
                            >
                              {coupon.isActive && new Date(coupon.expiryDate) > new Date() ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Site Settings
                </CardTitle>
                <CardDescription className="text-gray-400">Configure your website settings</CardDescription>
              </CardHeader>
              <CardContent>
                {siteSettings && (
                  <div className="space-y-8">
                    {/* Page Settings */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">Page Availability</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white text-base">IT Solutions Page</Label>
                            <p className="text-gray-400 text-sm">Enable or disable the IT Solutions page</p>
                          </div>
                          <Switch
                            checked={siteSettings.itSolutionsAvailable}
                            onCheckedChange={(checked) => handleUpdateSiteSettings({ itSolutionsAvailable: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white text-base">T-Shirts Page</Label>
                            <p className="text-gray-400 text-sm">Enable or disable the T-Shirts shop page</p>
                          </div>
                          <Switch
                            checked={siteSettings.tshirtPageAvailable}
                            onCheckedChange={(checked) => handleUpdateSiteSettings({ tshirtPageAvailable: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feature Icons */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">Feature Icons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white">Delivery Icon</Label>
                          <Select
                            value={siteSettings.featureIcons?.delivery || "truck"}
                            onValueChange={(value) =>
                              handleUpdateSiteSettings({
                                featureIcons: {
                                  ...siteSettings.featureIcons,
                                  delivery: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger className="bg-black/50 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-white">
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Quality Icon</Label>
                          <Select
                            value={siteSettings.featureIcons?.quality || "shield-check"}
                            onValueChange={(value) =>
                              handleUpdateSiteSettings({
                                featureIcons: {
                                  ...siteSettings.featureIcons,
                                  quality: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger className="bg-black/50 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-white">
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Support Icon</Label>
                          <Select
                            value={siteSettings.featureIcons?.support || "zap"}
                            onValueChange={(value) =>
                              handleUpdateSiteSettings({
                                featureIcons: {
                                  ...siteSettings.featureIcons,
                                  support: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger className="bg-black/50 border-purple-500/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-500/20">
                              {iconOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-white">
                                  <div className="flex items-center gap-2">
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Payment Settings */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">Payment Numbers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-white">bKash Number</Label>
                          <Input
                            value={siteSettings.paymentNumbers?.bkash || ""}
                            onChange={(e) =>
                              handleUpdateSiteSettings({
                                paymentNumbers: {
                                  ...siteSettings.paymentNumbers,
                                  bkash: e.target.value,
                                },
                              })
                            }
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="+8801XXXXXXXXX"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Nagad Number</Label>
                          <Input
                            value={siteSettings.paymentNumbers?.nagad || ""}
                            onChange={(e) =>
                              handleUpdateSiteSettings({
                                paymentNumbers: {
                                  ...siteSettings.paymentNumbers,
                                  nagad: e.target.value,
                                },
                              })
                            }
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="+8801XXXXXXXXX"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Rocket Number</Label>
                          <Input
                            value={siteSettings.paymentNumbers?.rocket || ""}
                            onChange={(e) =>
                              handleUpdateSiteSettings({
                                paymentNumbers: {
                                  ...siteSettings.paymentNumbers,
                                  rocket: e.target.value,
                                },
                              })
                            }
                            className="bg-black/50 border-purple-500/20 text-white"
                            placeholder="+8801XXXXXXXXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category Thumbnails */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">Category Thumbnails</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* T-Shirts Thumbnail */}
                        <div className="space-y-4">
                          <Label className="text-white text-lg">T-Shirts Category</Label>
                          <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                            {siteSettings.categoryThumbnails?.tshirts && (
                              <div className="mb-4">
                                <img
                                  src={siteSettings.categoryThumbnails.tshirts || "/placeholder.svg"}
                                  alt="T-Shirts thumbnail"
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="space-y-3">
                              <Input
                                value={siteSettings.categoryThumbnails?.tshirts || ""}
                                onChange={(e) =>
                                  handleUpdateSiteSettings({
                                    categoryThumbnails: {
                                      ...siteSettings.categoryThumbnails,
                                      tshirts: e.target.value,
                                    },
                                  })
                                }
                                className="bg-black/50 border-purple-500/20 text-white"
                                placeholder="Enter image URL"
                              />
                              <div className="file-upload-area">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, "tshirts")
                                    }
                                  }}
                                  className="hidden"
                                  id="tshirts-upload"
                                />
                                <label
                                  htmlFor="tshirts-upload"
                                  className="cursor-pointer flex flex-col items-center justify-center py-4"
                                >
                                  {uploadingThumbnail === "tshirts" ? (
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                                  ) : (
                                    <Upload className="w-8 h-8 text-purple-400 mb-2" />
                                  )}
                                  <p className="text-white font-medium">Upload T-Shirts Thumbnail</p>
                                  <p className="text-gray-400 text-sm">Click to browse or drag & drop</p>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fruits Thumbnail */}
                        <div className="space-y-4">
                          <Label className="text-white text-lg">Fruits Category</Label>
                          <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                            {siteSettings.categoryThumbnails?.fruits && (
                              <div className="mb-4">
                                <img
                                  src={siteSettings.categoryThumbnails.fruits || "/placeholder.svg"}
                                  alt="Fruits thumbnail"
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="space-y-3">
                              <Input
                                value={siteSettings.categoryThumbnails?.fruits || ""}
                                onChange={(e) =>
                                  handleUpdateSiteSettings({
                                    categoryThumbnails: {
                                      ...siteSettings.categoryThumbnails,
                                      fruits: e.target.value,
                                    },
                                  })
                                }
                                className="bg-black/50 border-purple-500/20 text-white"
                                placeholder="Enter image URL"
                              />
                              <div className="file-upload-area">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, "fruits")
                                    }
                                  }}
                                  className="hidden"
                                  id="fruits-upload"
                                />
                                <label
                                  htmlFor="fruits-upload"
                                  className="cursor-pointer flex flex-col items-center justify-center py-4"
                                >
                                  {uploadingThumbnail === "fruits" ? (
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                                  ) : (
                                    <Upload className="w-8 h-8 text-purple-400 mb-2" />
                                  )}
                                  <p className="text-white font-medium">Upload Fruits Thumbnail</p>
                                  <p className="text-gray-400 text-sm">Click to browse or drag & drop</p>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
