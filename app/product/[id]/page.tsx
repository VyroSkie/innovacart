"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ShoppingCart,
  ChevronLeft,
  Star,
  Shield,
  Truck,
  Package,
  Loader2,
  ChevronRight,
  MessageSquare,
  User,
} from "lucide-react"
import { getProductById, getProductReviews, addReview, getProductRating } from "@/lib/firebase"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import type { Product, ProductVariant, Review } from "@/types"

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const { addToCart } = useCart()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const fetchedProduct = await getProductById(productId)
        console.log("Fetched product:", fetchedProduct)
        setProduct(fetchedProduct)

        // Set default variant if product has variants
        if (fetchedProduct?.hasVariants && fetchedProduct.variants && fetchedProduct.variants.length > 0) {
          const defaultVariant = fetchedProduct.variants.find((v) => v.default) || fetchedProduct.variants[0]
          setSelectedVariant(defaultVariant)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchReviews = async () => {
      try {
        const productReviews = await getProductReviews(productId)
        const productRating = await getProductRating(productId)
        setReviews(productReviews)
        setRating(productRating)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }

    if (productId) {
      fetchProduct()
      fetchReviews()
    }
  }, [productId])

  const handleAddToCart = () => {
    if (!product) return

    addToCart(product, quantity, selectedVariant || undefined)

    toast({
      title: "Added to cart",
      description: `${product.name} ${selectedVariant ? `(${selectedVariant.name})` : ""} has been added to your cart`,
    })
  }

  const handleSubmitReview = async () => {
    if (!user || !product) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to leave a review",
        variant: "destructive",
      })
      return
    }

    if (!newReview.comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment for your review",
        variant: "destructive",
      })
      return
    }

    setSubmittingReview(true)
    try {
      await addReview({
        productId: product.id,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userEmail: user.email || "",
        rating: newReview.rating,
        comment: newReview.comment,
      })

      // Refresh reviews and rating
      const productReviews = await getProductReviews(productId)
      const productRating = await getProductRating(productId)
      setReviews(productReviews)
      setRating(productRating)

      setNewReview({ rating: 5, comment: "" })
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      })
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const incrementQuantity = () => {
    const maxStock = selectedVariant ? selectedVariant.stock : product?.stock || 0
    if (quantity < maxStock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const getAvailableStock = () => {
    if (selectedVariant) {
      return selectedVariant.stock
    }
    return product?.stock || 0
  }

  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price
    }
    return product?.price || 0
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
            disabled={!interactive}
          >
            <Star className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen premium-bg">
        <Navbar />
        <div className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-32">
              <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen premium-bg">
        <Navbar />
        <div className="pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-32">
              <Package className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h1 className="text-3xl font-bold premium-text mb-4">Product Not Found</h1>
              <p className="premium-text-muted mb-8">
                The product you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/shop/fruits">
                <Button className="premium-button">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Shop
                </Button>
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
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm premium-text-muted mb-8">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link
              href={`/shop/${product.category === "t-shirts" || product.category === "t-shirt" ? "t-shirts" : "fruits"}`}
              className="hover:text-purple-400 transition-colors"
            >
              {product.category === "t-shirts" || product.category === "t-shirt" ? "T-Shirts" : "Fruits"}
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-purple-400">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Product Image */}
            <div className="premium-card p-6 flex items-center justify-center">
              <img
                src={product.image || "/placeholder.svg?height=500&width=500"}
                alt={product.name}
                className="w-full max-h-[500px] object-contain rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=500&width=500"
                }}
              />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold premium-text mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  {renderStars(rating.average)}
                  <span className="premium-text-muted">({rating.count} reviews)</span>
                </div>
                <p className="premium-text-muted text-lg">{product.description}</p>
              </div>

              <div className="flex items-center">
                <span className="text-3xl font-bold premium-text-accent">৳{getCurrentPrice()}</span>
                {product.hasVariants && (
                  <Badge className="ml-3 premium-badge">{product.variants?.length} options available</Badge>
                )}
              </div>

              <Separator className="premium-separator" />

              {/* Variants Selection */}
              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium premium-text">
                    {product.category === "fruits" || product.category === "fruit" ? "Select Amount" : "Select Size"}
                  </h3>
                  <RadioGroup
                    value={selectedVariant?.id}
                    onValueChange={(value) => {
                      const variant = product.variants?.find((v) => v.id === value) || null
                      setSelectedVariant(variant)
                      setQuantity(1)
                    }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="relative">
                        <RadioGroupItem
                          value={variant.id}
                          id={variant.id}
                          className="peer sr-only"
                          disabled={variant.stock <= 0}
                        />
                        <Label
                          htmlFor={variant.id}
                          className="flex flex-col items-center justify-center rounded-xl premium-card p-4 hover:bg-purple-500/10 hover:border-purple-500/30 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/20 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer text-center transition-all"
                        >
                          <span className="premium-text font-medium">{variant.name}</span>
                          <span className="premium-text-accent text-sm mt-1">৳{variant.price || product.price}</span>
                          <span className="text-xs premium-text-muted mt-1">
                            {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium premium-text">Quantity</h3>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={decrementQuantity}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 premium-button"
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="text-xl font-medium premium-text w-10 text-center">{quantity}</span>
                  <Button
                    onClick={incrementQuantity}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 premium-button"
                    disabled={quantity >= getAvailableStock()}
                  >
                    +
                  </Button>
                  <span className="premium-text-muted ml-3">
                    {getAvailableStock()} {getAvailableStock() === 1 ? "item" : "items"} available
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                className="w-full premium-button h-14 text-lg"
                disabled={getAvailableStock() <= 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart - ৳{(getCurrentPrice() * quantity).toFixed(2)}
              </Button>

              {/* Product Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card className="premium-card">
                  <CardContent className="flex items-center p-4">
                    <Shield className="w-5 h-5 text-purple-400 mr-3" />
                    <div>
                      <p className="premium-text font-medium">Quality Guarantee</p>
                      <p className="text-xs premium-text-muted">Premium quality products</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="premium-card">
                  <CardContent className="flex items-center p-4">
                    <Truck className="w-5 h-5 text-purple-400 mr-3" />
                    <div>
                      <p className="premium-text font-medium">Fast Delivery</p>
                      <p className="text-xs premium-text-muted">Nationwide shipping</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="premium-card">
                  <CardContent className="flex items-center p-4">
                    <Package className="w-5 h-5 text-purple-400 mr-3" />
                    <div>
                      <p className="premium-text font-medium">Secure Packaging</p>
                      <p className="text-xs premium-text-muted">Safe handling guaranteed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-8">
            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold premium-text">Customer Reviews</h2>
                  <Badge className="premium-badge">{rating.count} reviews</Badge>
                </div>

                {/* Add Review Form */}
                {user ? (
                  <div className="premium-card p-6 mb-8">
                    <h3 className="text-lg font-semibold premium-text mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="premium-text mb-2 block">Rating</Label>
                        {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                      </div>
                      <div>
                        <Label className="premium-text mb-2 block">Comment</Label>
                        <Textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="Share your experience with this product..."
                          className="premium-input"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleSubmitReview} disabled={submittingReview} className="premium-button">
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="premium-card p-6 mb-8 text-center">
                    <p className="premium-text-muted mb-4">Please log in to leave a review</p>
                    <Link href="/login">
                      <Button className="premium-button">Log In</Button>
                    </Link>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="premium-text-muted">No reviews yet. Be the first to review this product!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="premium-card p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold premium-text">{review.userName}</h4>
                              {renderStars(review.rating)}
                              <span className="text-sm premium-text-muted">
                                {review.createdAt.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="premium-text-muted">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
