'use client'

import { useState, useEffect } from 'react'

export interface FavouriteItem {
  menuId: string
  name: string
  description?: string
  price: number
  category: string
  cafeteriaId: string
  cafeteriaName: string
}

const STORAGE_KEY = 'yoters_favourites'

export function useFavourites() {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavourites(JSON.parse(stored))
    } catch {}
    setIsLoaded(true)
  }, [])

  const save = (items: FavouriteItem[]) => {
    setFavourites(items)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }

  const isFavourite = (menuId: string) => favourites.some(f => f.menuId === menuId)

  const toggleFavourite = (item: FavouriteItem) => {
    if (isFavourite(item.menuId)) {
      save(favourites.filter(f => f.menuId !== item.menuId))
    } else {
      save([...favourites, item])
    }
  }

  const removeFavourite = (menuId: string) => save(favourites.filter(f => f.menuId !== menuId))

  return { favourites, isFavourite, toggleFavourite, removeFavourite, isLoaded }
}
