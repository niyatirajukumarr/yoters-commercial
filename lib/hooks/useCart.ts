'use client'

import { useState, useEffect } from 'react'

export interface CartItem {
  menuId: string
  name: string
  price: number
  quantity: number
  /** Size/portion picked on the menu card, e.g. "Half" / "Full". */
  variant?: string
}

export interface MobileCart {
  cafeteriaId: string
  items: CartItem[]
  createdAt: string
}

const CART_KEY = 'yoters-cart'

/**
 * A cart line is identified by the menu item *and* the chosen variant — Half
 * and Full of the same dish are two separate lines at two different prices.
 * Items without variants key on menuId alone, so callers that only have an id
 * (favourites, reorder) keep working unchanged.
 */
export const cartLineKey = (i: { menuId: string; variant?: string }) =>
  i.variant ? `${i.menuId}::${i.variant}` : i.menuId

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

      const key = cartLineKey(item)
      const existing = newCart.items.find(i => cartLineKey(i) === key)
      const items = existing
        ? newCart.items.map(i => cartLineKey(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...newCart.items, item]

      const updated = { ...newCart, items }
      sessionStorage.setItem(CART_KEY, JSON.stringify(updated))
      return updated
    })
  }

  // `key` is a cartLineKey — a bare menuId for items without variants.
  const updateQuantity = (key: string, quantity: number) => {
    setCart(prev => {
      if (!prev) return null
      const items = quantity <= 0
        ? prev.items.filter(i => cartLineKey(i) !== key)
        : prev.items.map(i => cartLineKey(i) === key ? { ...i, quantity } : i)

      const updated = items.length === 0 ? null : { ...prev, items }
      if (updated) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(updated))
      } else {
        sessionStorage.removeItem(CART_KEY)
      }
      return updated
    })
  }

  const removeItem = (key: string) => {
    setCart(prev => {
      if (!prev) return null
      const items = prev.items.filter(i => cartLineKey(i) !== key)
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
