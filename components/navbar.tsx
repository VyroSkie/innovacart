"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Menu, X, User, Sparkles } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { items } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <nav className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 glass-strong rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
            </div>
            <span className="text-xl font-bold glass-glow-text">InnovaCart</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium">
              Home
            </Link>
            <Link href="/store" className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium">
              Store
            </Link>
            <Link
              href="/it-solutions"
              className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium"
            >
              IT Solutions
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              className="relative glass-button h-10 w-10 p-0"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs border-0">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {/* User Profile or Auth */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="glass-button h-10 w-10 p-0"
                onClick={() => router.push("/profile")}
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="glass-button" onClick={() => router.push("/login")}>
                  Login
                </Button>
                <Button size="sm" className="glass-button-primary" onClick={() => router.push("/register")}>
                  Register
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden glass-button h-10 w-10 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/store"
                className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Store
              </Link>
              <Link
                href="/it-solutions"
                className="glass-text hover:text-purple-400 transition-colors duration-300 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                IT Solutions
              </Link>
              {!user && (
                <div className="flex flex-col space-y-3 pt-4 border-t border-white/10">
                  <Button
                    variant="ghost"
                    className="justify-start glass-button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      router.push("/login")
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="justify-start glass-button-primary"
                    onClick={() => {
                      setIsMenuOpen(false)
                      router.push("/register")
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
