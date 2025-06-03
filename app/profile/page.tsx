"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Calendar, Package, Settings, LogOut, Shield, Edit, Save, FileText, Truck } from "lucide-react"
import { getOrders, isAdmin } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { format } from "date-fns"

interface Order {
  id: string
  items: any[]
  total: number
  grandTotal?: number
  deliveryCharge?: number
  discount?: number
  couponCode?: string
  status: string
  createdAt: any
  trackingId?: string
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    district?: string
  }
  paymentInfo?: {
    method: string
    transactionId: string
    paymentNumber: string
    lastThreeDigits: string
  }
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    setDisplayName(user.displayName || "")
    fetchUserOrders()
  }, [user, router])

  const fetchUserOrders = async () => {
    if (!user?.email) return

    try {
      const allOrders = await getOrders()
      const userOrders = allOrders.filter((order) => order.customerInfo?.email === user.email)
      setOrders(userOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load your orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Success",
        description: "Signed out successfully",
      })
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const handleSaveProfile = () => {
    setEditMode(false)
    toast({
      title: "Success",
      description: "Profile updated successfully",
    })
  }

  const printUserInvoice = (order: Order) => {
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
                <p><strong>Date:</strong> ${format(new Date(order.createdAt.toDate ? order.createdAt.toDate() : order.createdAt), "MMM dd, yyyy")}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                ${order.trackingId ? `<p><strong>Tracking ID:</strong> ${order.trackingId}</p>` : ""}
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

  if (!user) {
    return (
      <div className="min-h-screen premium-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="premium-text">Loading...</p>
        </div>
      </div>
    )
  }

  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || "U"
  const userIsAdmin = isAdmin(user.email)

  return (
    <div className="min-h-screen premium-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 bg-purple-600">
                <AvatarFallback className="bg-purple-600 text-white text-xl font-bold">
                  {userInitial.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold premium-text">My Profile</h1>
                <p className="premium-text-muted">Manage your account and view your orders</p>
              </div>
            </div>
            {userIsAdmin && (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-purple-500/20">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white premium-text"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white premium-text"
              >
                <Package className="w-4 h-4 mr-2" />
                Orders ({orders.length})
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white premium-text"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="premium-text">Personal Information</CardTitle>
                      <CardDescription className="premium-text-muted">
                        Your account details and information
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (editMode ? handleSaveProfile() : setEditMode(true))}
                      className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                    >
                      {editMode ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="premium-text">Display Name</Label>
                      {editMode ? (
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="premium-input"
                          placeholder="Enter your display name"
                        />
                      ) : (
                        <p className="premium-text font-medium">{user.displayName || "Not set"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="premium-text">Email Address</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 premium-text-muted" />
                        <p className="premium-text font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="premium-text">Account Type</Label>
                      <div className="flex items-center space-x-2">
                        {userIsAdmin ? (
                          <Badge className="bg-purple-600 text-white">
                            <Shield className="w-3 h-3 mr-1" />
                            Administrator
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-purple-500/20 text-purple-400">
                            <User className="w-3 h-3 mr-1" />
                            Customer
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="premium-text">Member Since</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 premium-text-muted" />
                        <p className="premium-text font-medium">
                          {user.metadata?.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="premium-text">Order History</CardTitle>
                  <CardDescription className="premium-text-muted">
                    View all your past orders and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="premium-text-muted">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 premium-text-muted mx-auto mb-4" />
                      <p className="premium-text-muted">No orders found</p>
                      <Button
                        onClick={() => router.push("/store")}
                        className="mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-purple-500/20 rounded-lg p-6 bg-black/20">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="premium-text font-medium text-lg">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="premium-text-muted text-sm">
                                {order.createdAt?.toDate?.()?.toLocaleDateString() ||
                                  (order.createdAt ? format(new Date(order.createdAt), "PPP") : "Unknown date")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="premium-text font-bold text-xl">
                                ৳{(order.grandTotal || order.total || 0).toFixed(0)}
                              </p>
                              <Badge variant="outline" className="border-purple-500/20 text-purple-400">
                                {order.status || "Pending"}
                              </Badge>
                            </div>
                          </div>

                          {/* Tracking ID */}
                          {order.trackingId && (
                            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-purple-400" />
                                <span className="premium-text font-medium">Tracking ID:</span>
                                <span className="premium-text text-purple-400 font-mono">{order.trackingId}</span>
                              </div>
                            </div>
                          )}

                          <div className="mb-4">
                            <h4 className="premium-text font-medium mb-2">Items Ordered</h4>
                            <div className="space-y-2">
                              {order.items?.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="premium-text">
                                    {item.product.name} x {item.quantity}
                                  </span>
                                  <span className="text-purple-400">
                                    ৳{(item.product.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm premium-text-muted">
                              {order.items?.length || 0} item(s) • {order.status || "Pending"}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => printUserInvoice(order)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Print Invoice
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="premium-text">Account Settings</CardTitle>
                  <CardDescription className="premium-text-muted">
                    Manage your account preferences and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-purple-500/20 rounded-lg">
                      <div>
                        <h3 className="premium-text font-medium">Email Notifications</h3>
                        <p className="premium-text-muted text-sm">Receive updates about your orders</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-purple-500/20 text-purple-400">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-purple-500/20 rounded-lg">
                      <div>
                        <h3 className="premium-text font-medium">Privacy Settings</h3>
                        <p className="premium-text-muted text-sm">Control your data and privacy</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-purple-500/20 text-purple-400">
                        Manage
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="space-y-4">
                    <h3 className="premium-text font-medium text-lg">Danger Zone</h3>
                    <div className="p-4 border border-purple-500/20 rounded-lg bg-purple-500/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="premium-text font-medium">Sign Out</h4>
                          <p className="premium-text-muted text-sm">Sign out of your account</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSignOut}
                          className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
