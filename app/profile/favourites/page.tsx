'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Trash2, ShoppingCart } from 'lucide-react'
import { useFavourites } from '@/lib/hooks/useFavourites'
import { stagger, staggerItem, hoverLift, hoverScale } from '@/lib/motion'

export default function FavouritesPage() {
  const router = useRouter()
  const { favourites, removeFavourite, isLoaded } = useFavourites()

  const handleReorder = (fav: typeof favourites[0]) => {
    sessionStorage.setItem('yoters_reorder', JSON.stringify({
      menuId: fav.menuId, name: fav.name, price: fav.price, quantity: 1
    }))
    router.push(`/mobile/order/${fav.cafeteriaId}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f5' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0e8e8', position: 'sticky', top: 0, zIndex: 10 }}>
        <motion.button {...hoverScale} onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} color="#333" />
        </motion.button>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a1a' }}>Favourites</div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
        {!isLoaded ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>Loading...</div>
        ) : favourites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Heart size={48} color="#ddd" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>No favourites yet</div>
            <div style={{ fontSize: 13, color: '#aaa' }}>Tap the ♡ on any menu item to save it here</div>
          </div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {favourites.map(fav => (
              <motion.div key={fav.menuId} variants={staggerItem} {...hoverLift} style={{ background: 'white', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', marginBottom: 3 }}>{fav.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{fav.cafeteriaName} · {fav.category}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#E8334A', marginTop: 4 }}>₹{fav.price}</div>
                  </div>
                  <motion.button {...hoverScale} onClick={() => removeFavourite(fav.menuId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={18} color="#ccc" />
                  </motion.button>
                </div>
                <motion.button
                  {...hoverScale}
                  onClick={() => handleReorder(fav)}
                  style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#E8334A', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                >
                  <ShoppingCart size={15} />
                  Reorder · ₹{fav.price}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
