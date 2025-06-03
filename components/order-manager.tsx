"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getOrders, updateOrderStatus, updateOrderTrackingId, deleteOrder } from "@/lib/firebase"
import type { Order } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Package, Clock, Truck, CheckCircle, FileText, Download, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface OrderManagerProps {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
}

export function OrderManager({
  totalOrders,
  pendingOrders,
  processingOrders,
  shippedOrders,
  deliveredOrders,
}: OrderManagerProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
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

  const handleDeleteOrder = async (orderId: string) => {
    console.log("🚀 handleDeleteOrder called with ID:", orderId)

    if (!orderId) {
      console.error("❌ No order ID provided")
      toast({
        title: "Error",
        description: "Invalid order ID",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("🔄 Attempting to delete order from Firebase...")

      // Show loading state
      toast({
        title: "Deleting...",
        description: "Please wait while we delete the order",
      })

      await deleteOrder(orderId)
      console.log("✅ Order deleted from Firebase successfully")

      // Update local state
      const updatedOrders = orders.filter((order) => order.id !== orderId)
      setOrders(updatedOrders)
      console.log("✅ Order removed from local state. Remaining orders:", updatedOrders.length)

      toast({
        title: "Success",
        description: `Order #${orderId.slice(-8).toUpperCase()} deleted successfully`,
      })

      // Add this line to trigger stats refresh in parent component
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("orderDeleted", { detail: { orderId } }))
      }

      // Refresh orders from server to ensure consistency
      setTimeout(() => {
        fetchOrders()
      }, 1000)
    } catch (error) {
      console.error("❌ Error deleting order:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "Delete Failed",
        description: `Failed to delete order: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const generateProfessionalInvoice = (order: Order) => {
    const invoiceWindow = window.open("", "_blank")
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', 'Segoe UI', sans-serif; 
              line-height: 1.6;
              color: #1a1a1a;
              background: #ffffff;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #8B5CF6;
            }
            .company-info h1 {
              font-size: 32px;
              font-weight: 800;
              color: #8B5CF6;
              margin-bottom: 8px;
            }
            .company-info p {
              color: #6B7280;
              font-size: 14px;
            }
            .invoice-info {
              text-align: right;
            }
            .invoice-info h2 {
              font-size: 24px;
              color: #1F2937;
              margin-bottom: 8px;
            }
            .invoice-info p {
              color: #6B7280;
              font-size: 14px;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .detail-section {
              background: #F9FAFB;
              padding: 24px;
              border-radius: 12px;
              border-left: 4px solid #8B5CF6;
            }
            .detail-section h3 {
              color: #8B5CF6;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .detail-section p {
              margin-bottom: 8px;
              color: #374151;
            }
            .detail-section strong {
              color: #1F2937;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .items-table th {
              background: linear-gradient(135deg, #8B5CF6, #7C3AED);
              color: white;
              padding: 16px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .items-table td {
              padding: 16px;
              border-bottom: 1px solid #E5E7EB;
              color: #374151;
            }
            .items-table tr:last-child td {
              border-bottom: none;
            }
            .items-table tr:nth-child(even) {
              background: #F9FAFB;
            }
            .total-section {
              background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
              padding: 24px;
              border-radius: 12px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              color: #374151;
            }
            .total-row.grand {
              font-size: 20px;
              font-weight: 700;
              color: #8B5CF6;
              border-top: 2px solid #8B5CF6;
              padding-top: 16px;
              margin-top: 16px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-pending { background: #FEF3C7; color: #92400E; }
            .status-processing { background: #DBEAFE; color: #1E40AF; }
            .status-shipped { background: #D1FAE5; color: #065F46; }
            .status-delivered { background: #DCFCE7; color: #166534; }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              color: #6B7280;
              font-size: 14px;
            }
            .footer strong {
              color: #8B5CF6;
            }
            @media print {
              .invoice-container { padding: 20px; }
              .header { margin-bottom: 30px; }
              .details-grid { gap: 20px; margin-bottom: 30px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <h1>InnovaCart</h1>
                <p>Premium IT Solutions & E-commerce</p>
                <p>Digital Excellence Redefined</p>
              </div>
              <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Order ID:</strong> ${order.id.slice(-8).toUpperCase()}</p>
                <p><strong>Date:</strong> ${format(new Date(order.createdAt), "MMM dd, yyyy")}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.customerInfo.name}</p>
                <p><strong>Email:</strong> ${order.customerInfo.email}</p>
                <p><strong>Phone:</strong> ${order.customerInfo.phone}</p>
                <p><strong>District:</strong> ${order.customerInfo.district || "N/A"}</p>
                <p><strong>Address:</strong> ${order.customerInfo.address}</p>
              </div>

              ${
                order.paymentInfo
                  ? `
              <div class="detail-section">
                <h3>Payment Information</h3>
                <p><strong>Method:</strong> ${order.paymentInfo.method?.toUpperCase() || "N/A"}</p>
                <p><strong>Payment Number:</strong> ${order.paymentInfo.paymentNumber}</p>
                <p><strong>Transaction ID:</strong> ${order.paymentInfo.transactionId}</p>
                <p><strong>Last 3 Digits:</strong> ${order.paymentInfo.lastThreeDigits}</p>
              </div>
              `
                  : `
              <div class="detail-section">
                <h3>Payment Information</h3>
                <p>Payment details not available</p>
              </div>
              `
              }
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td><strong>${item.product.name}</strong></td>
                    <td>${item.quantity}</td>
                    <td>৳${item.product.price.toFixed(2)}</td>
                    <td>৳${(item.product.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>৳${order.total ? order.total.toFixed(2) : "0.00"}</span>
              </div>
              <div class="total-row">
                <span>Delivery Charge:</span>
                <span>৳${order.deliveryCharge ? order.deliveryCharge.toFixed(2) : "0.00"}</span>
              </div>
              ${
                order.discount && order.discount > 0
                  ? `
              <div class="total-row" style="color: #059669;">
                <span>Discount ${order.couponCode ? `(${order.couponCode})` : ""}:</span>
                <span>-৳${order.discount.toFixed(2)}</span>
              </div>
              `
                  : ""
              }
              <div class="total-row grand">
                <span>Grand Total:</span>
                <span>৳${order.grandTotal ? order.grandTotal.toFixed(2) : order.total ? order.total.toFixed(2) : "0.00"}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing <strong>InnovaCart</strong></p>
              <p>For support and inquiries: support@innovacart.com</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `)
      invoiceWindow.document.close()
    }
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
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "shipped":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "delivered":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
  }

  if (loading) {
    return (
      <Card className="bg-black/50 border-purple-500/20">
        <CardContent className="flex justify-center items-center py-8">
          <div className="w-8 h-8 rounded-full bg-purple-500 animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-400" />
          Order Management
        </CardTitle>
        <CardDescription className="text-gray-400">Manage customer orders and track payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-black/30 border-purple-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-yellow-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-blue-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{processingOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-green-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Shipped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{shippedOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 border-emerald-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{deliveredOrders}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="bg-black/30 border-purple-500/10 hover:border-purple-500/30 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg">Order #{order.id.slice(-8).toUpperCase()}</h3>
                      <p className="text-gray-400 text-sm">{format(new Date(order.createdAt), "PPP p")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(order.status)} border`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 font-semibold">{order.status.toUpperCase()}</span>
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log("Delete button clicked for order:", order.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-black border-purple-500/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Order</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to delete order #{order.id.slice(-8).toUpperCase()}? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-black/50 border-purple-500/20 text-white hover:bg-purple-500/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async (e) => {
                                e.preventDefault()
                                console.log("Confirming delete for order:", order.id)
                                try {
                                  await handleDeleteOrder(order.id)
                                } catch (error) {
                                  console.error("Delete failed:", error)
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                      <h4 className="text-purple-400 font-medium mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Customer Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-white font-medium">{order.customerInfo.name}</p>
                        <p className="text-gray-300">{order.customerInfo.email}</p>
                        <p className="text-gray-300">{order.customerInfo.phone}</p>
                        <p className="text-gray-400">
                          {order.customerInfo.district || "N/A"}, {order.customerInfo.address}
                        </p>
                      </div>
                    </div>

                    {order.paymentInfo && (
                      <div className="bg-black/20 p-4 rounded-lg border border-purple-500/10">
                        <h4 className="text-purple-400 font-medium mb-3 flex items-center">
                          <Download className="w-4 h-4 mr-2" />
                          Payment Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-white">
                            <span className="text-gray-400">Method:</span>{" "}
                            {order.paymentInfo.method?.toUpperCase() || "N/A"}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Transaction:</span> {order.paymentInfo.transactionId}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Last 3 digits:</span> {order.paymentInfo.lastThreeDigits}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-400">Payment Number:</span> {order.paymentInfo.paymentNumber}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h4 className="text-purple-400 font-medium mb-3">Order Items</h4>
                    <div className="bg-black/20 rounded-lg border border-purple-500/10 overflow-hidden">
                      {order.items.map((item, index) => (
                        <div
                          key={item.product.id}
                          className={`flex justify-between items-center p-3 ${index !== order.items.length - 1 ? "border-b border-purple-500/10" : ""}`}
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

                      <div className="bg-purple-500/5 p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Subtotal:</span>
                          <span className="text-purple-400">৳{order.total ? order.total.toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Delivery Charge:</span>
                          <span className="text-purple-400">
                            ৳{order.deliveryCharge ? order.deliveryCharge.toFixed(2) : "0.00"}
                          </span>
                        </div>
                        {order.discount && order.discount > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300">Discount:</span>
                              <span className="text-green-400">-৳{order.discount.toFixed(2)}</span>
                            </div>
                            {order.couponCode && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Coupon:</span>
                                <span className="text-purple-400">{order.couponCode}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between font-semibold text-lg border-t border-purple-500/20 pt-2">
                          <span className="text-white">Grand Total:</span>
                          <span className="text-purple-400">
                            ৳
                            {order.grandTotal
                              ? order.grandTotal.toFixed(2)
                              : order.total
                                ? order.total.toFixed(2)
                                : "0.00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Select
                      value={order.status}
                      onValueChange={(value: Order["status"]) => handleStatusUpdate(order.id, value)}
                    >
                      <SelectTrigger className="w-40 bg-black/50 border-purple-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-purple-500/20">
                        <SelectItem value="pending" className="text-white hover:bg-purple-500/20">
                          Pending
                        </SelectItem>
                        <SelectItem value="processing" className="text-white hover:bg-purple-500/20">
                          Processing
                        </SelectItem>
                        <SelectItem value="shipped" className="text-white hover:bg-purple-500/20">
                          Shipped
                        </SelectItem>
                        <SelectItem value="delivered" className="text-white hover:bg-purple-500/20">
                          Delivered
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => generateProfessionalInvoice(order)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>

                    <Input
                      placeholder="Add tracking ID"
                      value={order.trackingId || ""}
                      onChange={(e) => {
                        setOrders(orders.map((o) => (o.id === order.id ? { ...o, trackingId: e.target.value } : o)))
                      }}
                      className="w-40 bg-black/50 border-purple-500/20 text-white text-sm"
                    />

                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await updateOrderTrackingId(order.id, order.trackingId || "")
                          toast({
                            title: "Success",
                            description: "Tracking ID updated successfully",
                          })
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update tracking ID",
                            variant: "destructive",
                          })
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Set Tracking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
