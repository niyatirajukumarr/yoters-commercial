'use client'

import { useState, useEffect } from 'react'

export interface CartItem {
  menuId: string
  name: string
  price: number
  quantity: number
}

export interface MobileCart {
  cafeteriaId: string
  items: CartItem[]
  createdAt: string
}

const CART_KEY = 'yoters-cart'

export function useCart() {
  const [cart, setCart] = useState<MobileCart | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(CART_KEY)
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch {
        setCart(null)
      }
    }
    setIsLoaded(true)
  }, [])

  const addItem = (cafeteriaId: string, item: CartItem) => {
    setCart(prev => {
      const newCart = prev?.cafeteriaId === cafeteriaId ? prev : {
        cafeteriaId,
        items: [],
        createdAt: new Date().toISOString()
      }

      const existing = newCart.items.find(i => i.menuId === item.menuId)
      const items = existing
        ? newCart.items.map(i => i.menuId === item.menuId ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...newCart.items, item]

      const updated = { ...newCart, items }
      sessionStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const updateQuantity = (menuId: string, quantity: number) => {
    setCart(prev => {
      if (!prev) return null
      const items = quantity <= 0
        ? prev.items.filter(i => i.menuId !== menuId)
        : prev.items.map(i => i.menuId === menuId ? { ...i, quantity } : i)

      const updated = items.length === 0 ? null : { ...prev, items }
      if (updated) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(updated))
      } else {
        sessionStorage.removeItem(CART_KEY)
      }
      return updated
    })
  }

  const removeItem = (menuId: string) => {
    setCart(prev => {
      if (!prev) return null
      const items = prev.items.filter(i => i.menuId !== menuId)
      const updated = items.length === 0 ? null : { ...prev, items }
      if (updated) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(updated))
      } else {
        sessionStorage.removeItem(CART_KEY)
      }
      return updated
    })
  }

  const clear = () => {
    setCart(null)
    sessionStorage.removeItem(CART_KEY)
  }

  const total = cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) ?? 0

  return {
    cart,
    isLoaded,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    total,
    itemCount: cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0
  }
}
