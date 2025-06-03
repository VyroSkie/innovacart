import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="glass-footer py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 glass-strong rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg blur-lg"></div>
              </div>
              <h3 className="text-2xl font-bold glass-glow-text">InnovaCart</h3>
            </div>
            <p className="glass-text-muted">Premium digital solutions and exclusive products for the modern world.</p>
            <div className="flex space-x-4">
              <div className="glass-button p-2 cursor-pointer hover:scale-110 transition-transform duration-300">
                <Facebook className="w-5 h-5 text-purple-400" />
              </div>
              <div className="glass-button p-2 cursor-pointer hover:scale-110 transition-transform duration-300">
                <Twitter className="w-5 h-5 text-purple-400" />
              </div>
              <div className="glass-button p-2 cursor-pointer hover:scale-110 transition-transform duration-300">
                <Instagram className="w-5 h-5 text-purple-400" />
              </div>
              <div className="glass-button p-2 cursor-pointer hover:scale-110 transition-transform duration-300">
                <Linkedin className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="glass-text font-semibold mb-4 text-lg">IT Solutions</h4>
            <ul className="space-y-3 glass-text-muted">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  Graphics Design
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  UI/UX Design
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  App Development
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="glass-text font-semibold mb-4 text-lg">Store</h4>
            <ul className="space-y-3 glass-text-muted">
              <li>
                <Link href="/shop/t-shirts" className="hover:text-purple-400 transition-colors duration-300">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop/fruits" className="hover:text-purple-400 transition-colors duration-300">
                  Fruits
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="glass-text font-semibold mb-4 text-lg">Support</h4>
            <ul className="space-y-3 glass-text-muted">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors duration-300">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center glass-text-muted">
          <p>&copy; 2024 InnovaCart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
