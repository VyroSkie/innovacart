"use client"

import { useState } from "react"
import { useCoupon as useCouponDb } from "@/lib/db"

export function useCoupon() {
  const [couponData, setCouponData] = useState(null)

  const useCouponMutation = () => {
    const mutate = async (couponId: string) => {
      try {
        const data = await useCouponDb(couponId)
        setCouponData(data)
        return data
      } catch (error) {
        console.error("Error using coupon:", error)
        throw error
      }
    }
    return {
      mutate,
    }
  }

  return { useCouponMutation, couponData }
}
