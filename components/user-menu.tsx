"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Package, LogOut, Shield } from "lucide-react"
import { getFirebaseAuth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { isAdmin } from "@/lib/firebase"

interface UserMenuProps {
  user: {
    email: string | null
    displayName?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth()
      await signOut(auth)
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

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || "U"
  const isUserAdmin = isAdmin(user.email)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 bg-purple-600 text-white">
            <AvatarFallback className="bg-purple-600 text-white font-semibold">
              {userInitial.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-black/95 border-purple-500/20" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{user.displayName || "User"}</p>
            <p className="text-xs leading-none text-gray-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-purple-500/20" />

        <DropdownMenuItem
          className="text-white hover:bg-purple-500/20 cursor-pointer"
          onClick={() => handleNavigation("/profile")}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-white hover:bg-purple-500/20 cursor-pointer"
          onClick={() => handleNavigation("/orders")}
        >
          <Package className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>

        {isUserAdmin && (
          <DropdownMenuItem
            className="text-white hover:bg-purple-500/20 cursor-pointer"
            onClick={() => handleNavigation("/dashboard")}
          >
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-purple-500/20" />

        <DropdownMenuItem className="text-white hover:bg-purple-500/20 cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
