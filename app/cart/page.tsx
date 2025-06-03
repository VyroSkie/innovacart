"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash, ShoppingBag } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart()
  const { toast } = useToast()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      })
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = (itemId: string, productName: string) => {
    removeFromCart(itemId)
    toast({
      title: "Item removed",
      description: `${productName} has been removed from your cart`,
    })
  }

  const handleClearCart = () => {
    clearCart()
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen premium-bg">
        <Navbar />
        <div className="pt-20 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 premium-text-accent" />
              </div>
              <h1 className="text-3xl font-bold premium-text mb-4">Your cart is empty</h1>
              <p className="premium-text-muted mb-8">Add some products to get started</p>
              <Link href="/store">
                <Button className="premium-button">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen premium-bg">
      <Navbar />
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold premium-text mb-4">
              Shopping <span className="premium-glow-text">Cart</span>
            </h1>
            <p className="premium-text-muted">Review your items before checkout</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="premium-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="premium-text font-semibold text-lg">{item.product.name}</h3>
                        {item.selectedVariant && (
                          <div className="premium-text-accent text-sm mb-1">
                            {item.product.category === "fruits" ? "Weight" : "Size"}: {item.selectedVariant.name}
                          </div>
                        )}
                        <p className="premium-text-muted text-sm mb-2">{item.product.description}</p>
                        <p className="premium-text-accent font-bold text-xl">
                          ৳{item.selectedVariant ? item.selectedVariant.price : item.product.price}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="border-purple-500/30 premium-text hover:bg-purple-500/10"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="premium-text font-semibold w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="border-purple-500/30 premium-text hover:bg-purple-500/10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.product.name)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
                <Link href="/store">
                  <Button variant="outline" className="border-purple-500/30 premium-text hover:bg-purple-500/10">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="premium-card sticky top-24">
                <CardHeader>
                  <CardTitle className="premium-text">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="premium-text-muted">
                          {item.product.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ""} ×{" "}
                          {item.quantity}
                        </span>
                        <span className="premium-text">
                          ৳
                          {(
                            (item.selectedVariant ? item.selectedVariant.price : item.product.price) * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-purple-500/20 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="premium-text">Total:</span>
                      <span className="premium-text-accent">৳{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link href="/checkout">
                    <Button className="w-full premium-button">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
