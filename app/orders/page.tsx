"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { getUserOrders } from "@/lib/firebase"
import type { Order } from "@/types"
import { Loader2, Download, Package, Clock, Truck, CheckCircle } from "lucide-react"
import { format } from "date-fns"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/orders")
      return
    }

    const fetchOrders = async () => {
      try {
        const userOrders = await getUserOrders(user.uid)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, router])

  const downloadInvoice = (order: Order) => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { color: #ef4444; font-size: 24px; font-weight: bold; }
          .invoice-details { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total { font-size: 18px; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">InnovaCart</div>
          <p>Premium IT Solutions & Shop</p>
        </div>
        
        <div class="invoice-details">
          <h2>Invoice</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
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

        <table class="items-table">
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
                <td>$${item.product.price.toFixed(2)}</td>
                <td>$${(item.product.price * item.quantity).toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="total">
          <p>Total Amount: $${order.total.toFixed(2)}</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([invoiceContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${order.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
        return "bg-yellow-500/20 text-yellow-500"
      case "processing":
        return "bg-blue-500/20 text-blue-500"
      case "shipped":
        return "bg-green-500/20 text-green-500"
      case "delivered":
        return "bg-emerald-500/20 text-emerald-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="pt-20 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              My <span className="neon-text">Orders</span>
            </h1>
            <p className="text-xl text-gray-400">Track your order status and download invoices</p>
          </div>

          {orders.length === 0 ? (
            <Card className="bg-black/50 border-red-500/20 text-center max-w-md mx-auto">
              <CardContent className="p-8">
                <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-white text-2xl font-bold mb-2">No orders yet</h2>
                <p className="text-gray-400 mb-6">Start shopping to see your orders here!</p>
                <Button className="bg-red-500 hover:bg-red-600 neon-glow">Start Shopping</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="bg-black/50 border-red-500/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">Order #{order.id.slice(-8)}</CardTitle>
                        <CardDescription className="text-gray-400">
                          Placed on {format(new Date(order.createdAt), "PPP p")}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} border-0`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status.toUpperCase()}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-white font-medium mb-3">Items Ordered</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.product.id} className="flex items-center space-x-3">
                              <img
                                src={item.product.image || "/placeholder.svg"}
                                alt={item.product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{item.product.name}</p>
                                <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-red-500 font-semibold">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-3">Delivery Information</h4>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300">{order.customerInfo.name}</p>
                          <p className="text-gray-400">{order.customerInfo.email}</p>
                          <p className="text-gray-400">{order.customerInfo.phone}</p>
                          <p className="text-gray-400">{order.customerInfo.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-red-500/20">
                      <div className="text-lg font-bold">
                        <span className="text-white">Total: </span>
                        <span className="text-red-500">${order.total.toFixed(2)}</span>
                      </div>
                      <Button
                        onClick={() => downloadInvoice(order)}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
