'use client'

import { useEffect, useState, useRef, type CSSProperties } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useCart, cartLineKey } from '@/lib/hooks/useCart'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { isValidEmail, isValidPhone } from '@/lib/validation'
import { TokenTicket } from '@/components/TokenTicket'
import { generateSlug } from '@/lib/utils/slug'
import { withTimeout } from '@/lib/utils/withTimeout'
import {
  ChevronLeft, Plus, Minus, QrCode, Heart, Home, Search, ShoppingBag, User, SlidersHorizontal,
  MoreHorizontal,
  Citrus, Martini, Coffee, Milk, IceCreamCone, CupSoda, Hamburger, Sandwich, Utensils,
  Egg, Drumstick, Croissant, Soup, Sparkles, Zap, UtensilsCrossed, Gift, Flame,
} from 'lucide-react'
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu'
import { WrapIcon } from '@/components/icons/WrapIcon'
import { FlipButton } from '@/components/ui/flip-button'
import { focusPageSearch } from '@/lib/utils/focusPageSearch'
import { useFavourites } from '@/lib/hooks/useFavourites'
import DeliveryMapModal from '@/components/DeliveryMapModal'
import { stagger, staggerItem, viewportOnce, hoverScale } from '@/lib/motion'
import { CAFETERIA_LOGOS } from '@/lib/cafeteriaLogos'
import { calculateDeliveryChargeInfo } from '@/lib/utils/deliveryChargeCalculator'
import { calculateParcelCharge, isParcelCategory, PARCEL_CHARGE_PER_ITEM } from '@/lib/utils/parcelCharge'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  is_veg?: boolean
  image_url?: string
  stock_quantity?: number | null
  variants?: Array<{ name: string; price: number }>
}

interface Cafeteria {
  id: string
  name: string
  image_emoji: string
  location: string
  latitude?: number
  longitude?: number
  delivery_available?: boolean
}

interface Order {
  id: string
  student_name: string
  student_phone: string
  items: Array<{ name: string; price: number; quantity: number }>
  total_amount: number
  status: string
  is_shared: boolean
  created_at: string
  payment_reminder_sent_at?: string | null
  denial_reason?: string
}

type Step = 'menu' | 'details' | 'payment' | 'confirmation'
type Tab = 'home' | 'orders' | 'profile'

/**
 * Categories that collapse behind one pill, revealing their members as a
 * second row when picked.
 *
 * Started as a single hardcoded drinks group — there were enough drink
 * categories to push everything else off the end of the scroll row. It is a
 * list now because a restaurant can have more than one such group, and the
 * members carry their own order: the sub-row reads in the order written here,
 * not alphabetically, so it can follow the printed menu.
 *
 * A group only appears when at least one of its members is actually on the
 * menu, so this stays inert for restaurants that use none of these names.
 */
interface CategoryGroup {
  label: string
  members: string[]
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'Beverages and Delights',
    members: [
      'Coffee Shake', 'Delights', 'Fresh Juices', 'Fruit Milkshakes', 'Hot Beverages',
      'Ice Cream Shakes', 'Lassi', 'Mojitos', 'Sodas', 'Special Shakes', 'Thick Shake',
    ],
  },
  {
    // The Punjabi House prints its starters as sections on one page — four on
    // the veg card, six on the non-veg one. Both live in this single group:
    // members are filtered by what is actually on the menu being viewed, and
    // the veg/non-veg toggle decides which of the two sets that is, so each
    // side only ever sees its own. Order matches the printed cards.
    label: 'Starters',
    members: [
      'Veg Tandoor Starters', 'Paneer Starters', 'Appetizers & Soups', 'Veg Chinese Starters',
      'Chicken Tandoori Starters', 'Chicken Chinese Starters', 'Chicken Soups', 'Egg Delights',
      'Tandoori Chicken', 'Grill | Alfham',
    ],
  },
]

const GROUP_LABEL_BY_MEMBER = new Map<string, string>()
for (const group of CATEGORY_GROUPS) {
  for (const member of group.members) GROUP_LABEL_BY_MEMBER.set(member.toLowerCase(), group.label)
}

/** The group a category belongs to, or null when it stands on its own. */
const groupLabelFor = (cat: string): string | null =>
  GROUP_LABEL_BY_MEMBER.get(cat.toLowerCase()) ?? null

const isGroupedCategory = (cat: string) => groupLabelFor(cat) !== null

/**
 * Footnotes printed under a section on the menu card — the surcharges that
 * belong to a whole section rather than to any one dish. Keyed lowercase so a
 * capitalisation difference in the vendor's category cannot silently drop one.
 */
const CATEGORY_NOTES: { [key: string]: string } = {
  'paneer starters': 'For gravy — extra ₹20',
  'appetizers & soups': 'For 1 by 2 soup — extra ₹20',
  'veg chinese starters': 'For gravy — extra ₹20',
  'chicken chinese starters': 'For gravy — extra ₹20',
  'chicken soups': 'For 1 by 2 soup — extra ₹20',
  'tandoori chicken': 'Add-ons — extra mayonnaise ₹18 / ₹35 · Kuboos ₹18',
  'grill | alfham': 'Add-ons — extra mayonnaise ₹18 / ₹35 · Kuboos ₹18',
}

const categoryNoteFor = (cat: string): string | null => CATEGORY_NOTES[cat.toLowerCase()] ?? null

// The FSSAI veg/non-veg mark — square outline with a dot for veg, a triangle
// for non-veg. Same shape and colours the dish cards use, at a size that suits
// sitting inline next to a label.
function VegMark({ veg = false }: { veg?: boolean }) {
  const colour = veg ? '#2e9e6b' : '#b8321f'
  return (
    <span
      aria-hidden="true"
      style={{
        width: 13, height: 13, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${colour}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {veg
        ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: colour }} />
        : <span style={{ width: 0, height: 0, borderLeft: '3.5px solid transparent', borderRight: '3.5px solid transparent', borderBottom: `6px solid ${colour}` }} />}
    </span>
  )
}

// Black-and-white line icons instead of colored emoji, to match a
// sketched/outline look rather than a full-color glyph set.
function categoryIcon(cat: string) {
  const c = cat.toLowerCase()
  if (c === 'beverages and delights') return CupSoda
  // Starter sections, before the looser matches below — 'appetizers & soups'
  // would otherwise fall through to the generic plate, and the four sub-pills
  // would be indistinguishable from each other.
  if (c.includes('egg')) return Egg
  if (c.includes('tandoor') || c.includes('grill') || c.includes('alfham')) return Flame
  if (c.includes('paneer')) return Utensils
  if (c.includes('appetizer') || c.includes('soup')) return Soup
  if (c.includes('chinese')) return UtensilsCrossed
  if (c === 'starters') return Flame
  if (c.includes('juice') || c.includes('fresh')) return Citrus
  if (c.includes('mojito')) return Martini
  if (c.includes('hot') || c.includes('coffee') || c.includes('tea')) return Coffee
  if (c.includes('milkshake') || c.includes('thick shake') || c.includes('ice cream shake') || c.includes('lassi')) return Milk
  if (c.includes('shake')) return IceCreamCone
  if (c.includes('soda') || c.includes('drink')) return CupSoda
  if (c.includes('burger')) return Hamburger
  // Rolls/wraps before sandwiches — they used to fall into the same branch
  // and share the sandwich icon. Lucide has no roll/wrap glyph, hence the
  // hand-drawn one; the two categories share it since they're the same shape
  // of food.
  if (c.includes('roll') || c.includes('wrap')) return WrapIcon
  if (c.includes('sandwich') || c.includes('club')) return Sandwich
  if (c.includes('egg')) return Egg
  if (c.includes('strip')) return Drumstick
  if (c.includes('bun')) return Croissant
  if (c.includes('maggi')) return Soup
  if (c.includes('delight')) return Sparkles
  if (c.includes('quick') || c.includes('snack') || c.includes('bite')) return Zap
  if (c.includes('biryani') || c.includes('momos')) return UtensilsCrossed
  if (c.includes('combo')) return Gift
  return Utensils
}

const CATEGORY_EMOJI: { [key: string]: string } = {
  'Main': '🍽️', 'Fresh Juices': '🍹', 'Mojitos': '🍸', 'Hot Beverages': '☕', 'Fruit Milkshakes': '🥤',
  'Thick Shake': '🧋', 'Sodas': '🫧', 'Coffee Shake': '☕', 'Special Shakes': '🧋',
  'Ice Cream Shakes': '🍦', 'Lassi': '🥛', 'Delights': '🍮', 'Club Sandwich': '🥪',
  'Strips': '🍗', 'Sandwiches': '🥪', 'Egg Bites': '🍳', 'Loaded Fries': '🍟',
  'Rolls': '🌯', 'Burgers': '🍔', 'Buns': '🍞', 'Wraps': '🌯',
  'Quick Bites': '🍟', 'Maggies': '🍜',
}

const ITEM_IMAGES: { [key: string]: string } = {
  // Fresh Juices
  'Lemon':                        'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
  'Lemon Mint':                   'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
  'Moroccan Lime':                'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
  'Grape Lemon':                  'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200&h=200&fit=crop',
  'Musambi':                      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop',
  'Orange':                       'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&h=200&fit=crop',
  'Watermelon':                   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop',
  'Muskmelon':                    'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=200&h=200&fit=crop',
  'Pappaya':                      'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=200&h=200&fit=crop',
  'Pineapple':                    'https://images.unsplash.com/photo-1478145787956-e5c2d2a2b4c8?w=200&h=200&fit=crop',
  'Grape':                        'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200&h=200&fit=crop',
  'Kokum':                        'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=200&h=200&fit=crop',
  'Mango':                        'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  'Pomegranate':                  'https://images.unsplash.com/photo-1615485020830-4a9df27b5f7a?w=200&h=200&fit=crop',
  // Mojitos
  'Virgin Mojito':                'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=200&h=200&fit=crop',
  'Blue Ocean':                   'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  'Kiwi Cooler':                  'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=200&h=200&fit=crop',
  'Greenade':                     'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
  'Black Current Night':          'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  'Melody Melon':                 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200&h=200&fit=crop',
  'Blueberry Martini':            'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  // Hot Beverages
  'Coffee':                       'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop',
  'Boost':                        'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=200&h=200&fit=crop',
  'Horlicks':                     'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=200&h=200&fit=crop',
  // Fruit Milkshakes
  'Apple Milkshake':              'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=200&h=200&fit=crop',
  'Muskmelon Milkshake':          'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=200&h=200&fit=crop',
  'Pappaya Milkshake':            'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=200&h=200&fit=crop',
  'Banana Milkshake':             'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&h=200&fit=crop',
  'Mango Milkshake':              'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  'Pomegranate Milkshake':        'https://images.unsplash.com/photo-1615485020830-4a9df27b5f7a?w=200&h=200&fit=crop',
  'Avocado Milkshake':            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  'Cocktail Milkshake':           'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  // Thick Shakes
  'Horlicks Thick Shake':         'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Boost Thick Shake':            'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Badam Thick Shake':            'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Black Current Thick Shake':    'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  'Green Apple Thick Shake':      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Pista Thick Shake':            'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Litchi Thick Shake':           'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Oreo Thick Shake':             'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Crunchy Oreo Thick Shake':     'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Rose Milk Thick Shake':        'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Dates Thick Shake':            'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Blueberry Thick Shake':        'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  'Fig Thick Shake':              'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Sharjah Thick Shake':          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Tender Coconut Thick Shake':   'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Snickers Thick Shake':         'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Kitkat Thick Shake':           'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Jack Fruit Thick Shake':       'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Cashew Thick Shake':           'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Chocolate Sharjah Thick Shake':'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Dry Fruit Mix Thick Shake':    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Biscoff Thick Shake':          'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  // Sodas
  'Lemon Soda':                   'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
  'Masala Soda':                  'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
  'Mint Soda':                    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop',
  'Blue Lemonade':                'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=200&h=200&fit=crop',
  'Ginger Lemonade':              'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
  'Peach Ice':                    'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=200&h=200&fit=crop',
  'Jeera Masala':                 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop',
  'Hannari':                      'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=200&h=200&fit=crop',
  // Coffee Shake
  'Frappuccino':                  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
  'Cold Coffee':                  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
  'Chocolate Coffee':             'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop',
  // Special Shakes
  'Abood':                        'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Sharjah Special':              'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Mango Choco Chip':             'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  'Cocktail Ajel':                'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Alphonsa Smoothie':            'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  'LETHAFI Madness':              'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Tender Mango':                 'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  'Tender Chikoo':                'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=200&h=200&fit=crop',
  'Chocolate Sharjah Special':    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
  'Tender Avocado':               'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  // Ice Cream Shakes
  'Vanilla Ice Cream Shake':      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=200&h=200&fit=crop',
  'Chocolate Ice Cream Shake':    'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=200&h=200&fit=crop',
  'Butterscotch Ice Cream Shake': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=200&h=200&fit=crop',
  'Strawberry Ice Cream Shake':   'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=200&h=200&fit=crop',
  'Pistachios Ice Cream Shake':   'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=200&h=200&fit=crop',
  'Mango Ice Cream Shake':        'https://images.unsplash.com/photo-1605027990121-cbae9e0642b8?w=200&h=200&fit=crop',
  // Lassi
  'Sweet Lassi':                  'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  'Chocolate Lassi':              'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  'Strawberry Lassi':             'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  'Fruit Lassi':                  'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  'Mango Lassi':                  'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  'Dry Fruit Lassi':              'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&h=200&fit=crop',
  // Delights
  'Fruit Salad':                  'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200&h=200&fit=crop',
  'Gud Bud':                      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop',
  'Royal Falooda':                'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop',
  'Dry Fruit Queen':              'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop',
  'Death By Chocolate':           'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop',
  // Club Sandwich
  'Veg Club Sandwich':            'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=200&h=200&fit=crop',
  'Egg Club Sandwich':            'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=200&h=200&fit=crop',
  'Chicken Club Sandwich':        'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=200&h=200&fit=crop',
  'Fillet Club Sandwich':         'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=200&h=200&fit=crop',
  // Strips
  'Chicken Strips':               'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
  'Creamy Strips':                'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
  // Sandwiches
  'Classic Veg Sandwich':         'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Grilled Mayo Cheese Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Egg Sandwich':                 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Sweet Corn Cheese Sandwich':   'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Lays Cheese Sandwich':         'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Chocolate Cheese Sandwich':    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Paneer Sandwich':              'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Chicken Fillet Sandwich':      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  'Chicken Sandwich':             'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=200&fit=crop',
  // Egg Bites
  'Bun Omlet':                    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
  'Bread Omlet':                  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
  'Egg Bites':                    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
  // Loaded Fries
  'Classic Loaded Fries':         'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
  'Cheesy Loaded Fries':          'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
  // Rolls
  'Egg Roll':                     'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Veg Roll':                     'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Paneer Roll':                  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Egg with Chicken Roll':        'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  // Burgers
  'Classic Veg Burger':           'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
  'Egg Burger':                   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Paneer Burger':                'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
  'Veg Nuggets Burger':           'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
  'Classic Chicken Burger':       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Crunchy Chicken Burger':       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Chicken Cheese Burger':        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Chicken with Egg Burger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Zinger Chicken Burger':        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'Zinger Stacker':               'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&h=200&fit=crop',
  // Buns
  'Mayo Bun':                     'https://images.unsplash.com/photo-1550317138-10000687a72b?w=200&h=200&fit=crop',
  'Lays Bun':                     'https://images.unsplash.com/photo-1550317138-10000687a72b?w=200&h=200&fit=crop',
  // Wraps
  'Veggies Wrap':                 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Crispy Chicken Wrap':          'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Green Grill Wrap':             'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Fillet Wrap':                  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Tandoori Wrap':                'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  'Lethafi Wrap':                 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
  // Quick Bites
  'French Fries':                 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
  'Peri Peri Fries':              'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop',
  'Veg Nuggets':                  'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
  'Chicken Nuggets':              'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
  'Finger Chicken':               'https://images.unsplash.com/photo-1562967914-608f82629710?w=200&h=200&fit=crop',
  'Onion Rings':                  'https://images.unsplash.com/photo-1639024471283-03518883512d?w=200&h=200&fit=crop',
  // Maggies
  'Masala Maggie':                'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
  'Sweet Corn Maggie':            'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
  'Egg Maggie':                   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
  'Chicken Maggie':               'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop',
}

const CATEGORY_IMAGES: { [key: string]: string } = {
  'Biryani': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/biryani.jpg',
  'Mandhi': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/mandhi.jpg',
  'Combo': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/combo.jpg',
  'Burger': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/burger.jpg',
  'Roll': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/roll.jpg',
  'Alfaham': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop',
  'Fries': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/fries.jpg',
  'Drinks': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/drinks.jpg',
  'Momos': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/momos.jpg',
  'Coffee': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/coffee.cms',
  'Shakes @99': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/shakes%20@99.jpg',
  'Shakes @79': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/shakes%20@79.jpeg',
  'Juice @59': 'https://qbvwcpjjattwebdzexni.supabase.co/storage/v1/object/public/menu-images/lit%20bites%20cafe/juice%20@59.webp',

  // LETHAFI categories
  'Fresh Juices': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop',
  'Mojitos': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
  'Hot Beverages': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  'Fruit Milkshakes': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/fruit%20milkshake.jpg',
  'Thick Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop',
  'Sodas': 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600&h=400&fit=crop',
  'Coffee Shake': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop',
  'Special Shakes': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/special%20shakes.png',
  'Ice Cream Shakes': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/ice%20cream%20shake.jpg',
  'Lassi': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/lassi.jpg',
  'Delights': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop',
  'Club Sandwich': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Strips': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop',
  'Sandwiches': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Egg Bites': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
  'Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Rolls': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'Burgers': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
  'Buns': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/buns.webp',
  'Wraps': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/wraps.jpg',
  'Quick Bites': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Maggies': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/maggie.jpg',
}

// Banners used only while the non-veg toggle is on. Categories missing here
// fall back to CATEGORY_IMAGES above; several appear in both, which is the
// whole point — a Wraps banner full of salad over a chicken-only list reads
// as the wrong menu.
const CATEGORY_IMAGES_NONVEG: { [key: string]: string } = {
  'Burgers': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/burgers.jpg',
  'Club Sandwich': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/club%20sandwich.jpg',
  'Quick Bites': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/quick%20bites.jpg',
  'Rolls': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/rolls.webp',
  'Sandwiches': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/sandwiches.jpg',
  'Wraps': 'https://kohhtpksodebzglofckn.supabase.co/storage/v1/object/public/lethafi/hero-section/non%20veg/wraps.jpg',
}

export default function CafeteriaPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugOrId = params.cafeteriaId as string

  // State for slug-to-ID conversion
  const [cafeteriaId, setCafeteriaId] = useState<string>('')
  const [resolving, setResolving] = useState(true)

  // Core state
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  // Whether the non-beverage pills are showing while the group is open.
  const [othersOpen, setOthersOpen] = useState(false)
  const [showVegFront, setShowVegFront] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'cost_low' | 'cost_high'>('relevance')
  const [priceRange, setPriceRange] = useState<'all' | 'under200' | 'mid' | 'above400'>('all')
  const [collection, setCollection] = useState<'all' | 'previous' | 'new'>('all')
  const [menuSearch, setMenuSearch] = useState('')
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  // Categories whose hero image failed to load, tracked in state rather than
  // by hiding the node — see the hero render for why.
  const [heroImgErrors, setHeroImgErrors] = useState<Set<string>>(new Set())
  const [expandedDesc, setExpandedDesc] = useState<Set<string>>(new Set())
  const [popularity, setPopularity] = useState<{ byName: Record<string, number>; byId: Record<string, number>; max: number }>({ byName: {}, byId: {}, max: 0 })
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery' | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'menu')
  const [orderId, setOrderId] = useState<string>('')

  // Convert slug to ID if needed
  useEffect(() => {
    const convertSlugToId = async () => {
      setResolving(true)
      try {
        // Check if it's already a UUID
        if (slugOrId.includes('-') && slugOrId.length === 36) {
          setCafeteriaId(slugOrId)
          return
        }

        // Check sessionStorage cache first — instant, no network call
        const cached = sessionStorage.getItem(`slug-id:${slugOrId}`)
        if (cached) { setCafeteriaId(cached); return }

        const { data, error } = await supabase.from('cafeterias').select('id, name')
        if (error || !data) throw new Error('fetch failed')

        const matching = data.find(c => generateSlug(c.name) === slugOrId)
        if (matching) {
          sessionStorage.setItem(`slug-id:${slugOrId}`, matching.id)
          setCafeteriaId(matching.id)
        } else {
          router.push('/browse')
        }
      } catch {
        // On any error, retry once by reloading the page
        window.location.reload()
      } finally {
        setResolving(false)
      }
    }

    convertSlugToId()
  }, [slugOrId, router])

  // Tab navigation
  const [activeTab, setActiveTab] = useState<Tab>('home')
  // Search isn't a tab of its own here — it focuses the menu search box — so
  // track it separately to keep the nav highlighted while searching.
  const [navSearchActive, setNavSearchActive] = useState(false)

  // Orders
  const [cafeOrders, setCafeOrders] = useState<Order[]>([])
  const [loadingCafeOrders, setLoadingCafeOrders] = useState(true)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)

  // Payment & UI

  const { cart, addItem, updateQuantity, removeItem, clear: clearCart, total, itemCount } = useCart()
  const { isFavourite, toggleFavourite } = useFavourites()
  const { user, updateUser } = useUserInfo()
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' })


  const [paymentState, setPaymentState] = useState<'idle' | 'waiting' | 'confirmed' | 'failed'>('idle')
  const pollRef = useRef<NodeJS.Timeout>(undefined)
  const [confirmedTotal, setConfirmedTotal] = useState(0)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showCartSheet, setShowCartSheet] = useState(false)

  const [showTicket, setShowTicket] = useState(false)
  const [tokenData, setTokenData] = useState<{ token: number; items: Array<{ name: string; quantity: number }>; total: number; id: string } | null>(null)

  // Delivery charge tracking
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [deliveryDistance, setDeliveryDistance] = useState(0)
  const [deliveryChargeError, setDeliveryChargeError] = useState<string | null>(null)

  // Fetch cafeteria & menu — loads from cache instantly, fetches fresh in background
  useEffect(() => {
    if (!cafeteriaId) return

    // Show cached data immediately if available
    const cacheKey = `menu-cache:${cafeteriaId}`
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { cafeteria: cachedCaf, menuItems: cachedMenu } = JSON.parse(cached)
        setCafeteria(cachedCaf)
        setMenuItems(cachedMenu)
        const cats = [...new Set((cachedMenu as MenuItem[]).map((m: MenuItem) => m.category))]
        if (cats.length > 0) setSelectedCategory(cats[0])
        setLoading(false)
      }
    } catch {}

    // Always fetch fresh data in background
    const doFetch = async () => {
      try {
        const [cafRes, menuRes] = await Promise.all([
          supabase.from('cafeterias').select('*').eq('id', cafeteriaId).single(),
          supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteriaId).eq('is_available', true),
        ])
        if (cafRes.data) {
          setCafeteria(cafRes.data as Cafeteria)
          const menu = (menuRes.data ?? []) as MenuItem[]
          setMenuItems(menu)
          const cats = [...new Set(menu.map(m => m.category))]
          if (cats.length > 0) setSelectedCategory(cats[0])
          sessionStorage.setItem(cacheKey, JSON.stringify({ cafeteria: cafRes.data, menuItems: menu }))
        }
      } catch {}
      setLoading(false)
    }
    doFetch()
  }, [cafeteriaId])

  // Fetch user's orders from this cafe with real-time subscription
  useEffect(() => {
    const fetch = async () => {
      if (!user?.phone) {
        // user isn't loaded yet (this effect re-runs once it is, via the
        // user?.phone dependency below) — don't flash "No orders yet" for a
        // still-loading user.
        return
      }
      setLoadingCafeOrders(true)
      try {
        const { data } = await withTimeout(
          supabase
            .from('orders')
            .select('*')
            .eq('cafeteria_id', cafeteriaId)
            .eq('student_phone', user.phone)
            .order('created_at', { ascending: false }),
          8000,
          'Cafe orders fetch timed out'
        ) as any
        if (data) setCafeOrders(data as Order[])
      } catch (error) {
        // Error fetching orders - will retry
      } finally {
        setLoadingCafeOrders(false)
      }
    }
    fetch()

    // Filtered to this customer's own orders, which is all this screen shows.
    // Subscribing to the whole cafeteria meant every stranger's order woke
    // every open menu and triggered a refetch — at 300 customers and 300
    // orders over a lunch rush that is ~90,000 needless queries.
    if (!user?.phone) return

    const channel = supabase.channel(`cafe-orders-${cafeteriaId}-${user.phone}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `student_phone=eq.${user.phone}` }, () => {
        fetch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafeteriaId, user?.phone])

  // Real-time "highly ordered" popularity for this cafeteria
  useEffect(() => {
    if (!cafeteriaId) return
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/menu-popularity?cafeteriaId=${cafeteriaId}`)
        const data = await res.json()
        if (active && res.ok) {
          setPopularity({ byName: data.byName || {}, byId: data.byId || {}, max: data.max || 0 })
        }
      } catch (e) {
        // Popularity fetch failed - using defaults
      }
    }
    load()
    // Polled rather than subscribed. "Highly ordered" is a soft signal that
    // nobody notices going stale for a minute, but as a realtime subscription
    // it was the worst kind of load: every order at the cafeteria pushed every
    // open menu to refetch an endpoint that scans the whole order history.
    // A poll also lets the response be CDN-cached, so a restaurant's viewers
    // share one origin query per minute instead of one each per order.
    const timer = setInterval(load, 60_000)
    return () => { active = false; clearInterval(timer) }
  }, [cafeteriaId])

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setFormData(f => ({ ...f, name: user.name || '', phone: user.phone || '', email: user.email || '' }))
    }
  }, [user])

  // Clear cart if it belongs to a different cafeteria (user switched cafeteria)
  useEffect(() => {
    if (cafeteriaId && cart && cart.cafeteriaId !== cafeteriaId) {
      clearCart()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeteriaId])

  // Auto-add reorder item from favourites
  useEffect(() => {
    if (!cafeteriaId || menuItems.length === 0) return
    const raw = sessionStorage.getItem('yoters_reorder')
    if (!raw) return
    try {
      const reorder = JSON.parse(raw)
      sessionStorage.removeItem('yoters_reorder')
      addItem(cafeteriaId, { menuId: reorder.menuId, name: reorder.name, price: reorder.price, quantity: reorder.quantity ?? 1 })
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeteriaId, menuItems.length])

  // Calculate delivery charge based on distance
  useEffect(() => {
    if (orderType !== 'delivery' || !deliveryCoords || !cafeteria?.latitude || !cafeteria?.longitude) {
      setDeliveryCharge(0)
      setDeliveryDistance(0)
      setDeliveryChargeError(null)
      return
    }

    try {
      const chargeInfo = calculateDeliveryChargeInfo(
        cafeteria.latitude,
        cafeteria.longitude,
        deliveryCoords.lat,
        deliveryCoords.lng
      )
      setDeliveryDistance(chargeInfo.distance)
      setDeliveryCharge(chargeInfo.charge)
      setDeliveryChargeError(chargeInfo.message || null)
    } catch (err) {
      // Error calculating delivery charge - using default
      setDeliveryChargeError('Error calculating delivery charge')
    }
  }, [orderType, deliveryCoords, cafeteria?.latitude, cafeteria?.longitude])

  // The same two conditions handlePlaceOrder refuses on, hoisted so the details
  // screen can say so up front instead of letting the customer fill everything
  // in and discover it at the payment button.
  const deliveryBlocked =
    orderType === 'delivery' &&
    (!!deliveryChargeError || !deliveryCoords || !cafeteria?.latitude || !cafeteria?.longitude)

  // Auto-focus search input when search bar opens
  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchBar])

  // Treat items with no flag as veg by default
  const itemIsVeg = (m: MenuItem) => m.is_veg !== false
  const visibleItems = menuItems.filter(m => (showVegFront && itemIsVeg(m)) || (!showVegFront && !itemIsVeg(m)))
  // Alphabetical so the pill row has a predictable order, rather than
  // whatever order the rows happen to come back from the DB in.
  const categories = [...new Set(visibleItems.map(m => m.category))]
    .sort((a, b) => a.localeCompare(b))

  // Each group present on this menu becomes one pill standing in for its
  // members; picking it reveals them as a second row. Members keep the order
  // they were written in CATEGORY_GROUPS so the sub-row can follow the printed
  // menu, and are matched case-insensitively against what the vendor actually
  // typed — the stored spelling is what gets selected.
  const groupMembersPresent = new Map<string, string[]>()
  for (const group of CATEGORY_GROUPS) {
    const present = group.members
      .map(member => categories.find(c => c.toLowerCase() === member.toLowerCase()))
      .filter((c): c is string => !!c)
    if (present.length) groupMembersPresent.set(group.label, present)
  }

  const topLevelCategories = [
    ...categories.filter(c => !isGroupedCategory(c)),
    ...groupMembersPresent.keys(),
  ].sort((a, b) => a.localeCompare(b))

  // Derived rather than its own state, so the sub-row can never disagree with
  // which category is actually selected.
  const openGroupLabel = groupLabelFor(selectedCategory)
  const groupOpen = openGroupLabel !== null
  const openGroupMembers = openGroupLabel ? groupMembersPresent.get(openGroupLabel) ?? [] : []
  // With a group open the top row is mostly noise — the sub-row is what the
  // user is reading — so the other categories fold behind one button until
  // they ask for them back.
  const visibleTopCategories = groupOpen && !othersOpen
    ? topLevelCategories.filter(c => c === openGroupLabel)
    : topLevelCategories

  const cartItem = cart?.cafeteriaId === cafeteriaId ? cart.items : []
  // A dish with Half/Full sits in the cart as one line per size, so the card's
  // stepper has to follow whichever size is currently selected — otherwise
  // adding Full leaves no way to also add Half (the ADD button never returns).
  const itemInCart = (item: MenuItem) => {
    const key = cartLineKey({ menuId: item.id, variant: selectedVariants[item.id] })
    return cartItem.find(i => cartLineKey(i) === key)
  }

  // Same module the payment route prices against, so the screen and the
  // server-side check cannot drift apart.
  const categoryByMenuId = new Map<string, string | null>(
    menuItems.map(m => [m.id, m.category ?? null])
  )
  const parcelChargeUnits = cartItem.reduce(
    (n, item) => (isParcelCategory(categoryByMenuId.get(item.menuId)) ? n + item.quantity : n),
    0
  )
  const dynamicParcelCharge = calculateParcelCharge(
    cartItem,
    categoryByMenuId,
    orderType ?? 'takeaway'
  )

  // Keep the selected category valid when switching veg / non-veg
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory) && selectedCategory !== 'Combos') {
      setSelectedCategory(categories[0])
    }
  }, [categories.join('|'), selectedCategory])

  // Leaving the group puts every pill back on screen, so the row can't come
  // back collapsed the next time the group is opened.
  useEffect(() => {
    if (!groupOpen) setOthersOpen(false)
  }, [groupOpen])

  // Switching category should start you at the top of that category, not at
  // whatever depth you'd scrolled to in the previous one. Instant rather than
  // smooth — from deep in a long list a smooth scroll is a long slow ride.
  const didMountCategory = useRef(false)
  useEffect(() => {
    if (!didMountCategory.current) { didMountCategory.current = true; return }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [selectedCategory])

  // ----- Dish filters (sort / price / collections) -----
  const prevOrderedIds = new Set<string>()
  const prevOrderedNames = new Set<string>()
  cafeOrders.forEach(o => (o.items || []).forEach((it: any) => {
    if (it?.menu_item_id) prevOrderedIds.add(it.menu_item_id)
    if (it?.name) prevOrderedNames.add(String(it.name).toLowerCase())
  }))
  const isPreviouslyOrdered = (m: MenuItem) => prevOrderedIds.has(m.id) || prevOrderedNames.has(m.name.toLowerCase())
  const filtersActive = sortBy !== 'relevance' || priceRange !== 'all' || collection !== 'all'
  const applyDishFilters = (items: MenuItem[]) => {
    let out = items
    if (priceRange === 'under200') out = out.filter(m => m.price < 200)
    else if (priceRange === 'mid') out = out.filter(m => m.price >= 200 && m.price <= 400)
    else if (priceRange === 'above400') out = out.filter(m => m.price > 400)
    if (collection === 'previous') out = out.filter(isPreviouslyOrdered)
    else if (collection === 'new') out = out.filter(m => !isPreviouslyOrdered(m))
    if (sortBy === 'cost_low') out = [...out].sort((a, b) => a.price - b.price)
    else if (sortBy === 'cost_high') out = [...out].sort((a, b) => b.price - a.price)
    return out
  }
  const pillStyle = (active: boolean): CSSProperties => ({
    padding: '9px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? '#fff0f2' : 'white',
    color: active ? 'var(--accent)' : 'var(--text2)',
  })

  const categoryDisplayMap: { [key: string]: string } = { 'Juice': 'Juice @59' }
  const displayCategory = (cat: string) => categoryDisplayMap[cat] || cat

  // Browsing this menu is open to anyone; the first add-to-cart is where we ask
  // who you are. `next` is this exact restaurant's URL, so signing in returns
  // you to the menu you were reading rather than to /browse.
  //
  // The session is read at click time rather than held in state: getSession()
  // reads local storage and doesn't go to the network, and checking here means
  // there is no window early in the page's life where isAuthed is still null
  // and a guest could slip an item in.
  //
  // The tapped item is deliberately not carried across. The cart is cleared
  // when this page unmounts, so it could not survive the trip anyway, and
  // re-tapping ADD on return is one action rather than a cart that silently
  // filled itself.
  const handleAddItem = async (item: MenuItem) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/auth?mode=login&next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // Check if item has variants and if one is selected
    let finalPrice = item.price
    let itemName = item.name
    let variantName: string | undefined

    if (item.variants && item.variants.length > 0) {
      const selectedVariant = selectedVariants[item.id]
      if (!selectedVariant) {
        // Names the actual options rather than assuming Half/Full — portions
        // are sold by the piece too, and "select a size (Half/Full)" in front
        // of 4pc/6pc/8pc buttons reads like a bug.
        alert(`Please select an option: ${item.variants.map(v => v.name).join(' / ')}`)
        return
      }
      const variant = item.variants.find(v => v.name === selectedVariant)
      if (variant) {
        finalPrice = variant.price
        itemName = `${item.name} (${selectedVariant})`
        variantName = selectedVariant
      }
    }

    addItem(cafeteriaId, { menuId: item.id, name: itemName, price: finalPrice, quantity: 1, variant: variantName })
  }

  // Liking a food item also requires auth, same as add-to-cart. Send them to
  // sign in with a redirect back to this menu.
  const handleToggleFavourite = async (item: MenuItem) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/auth?mode=login&next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    toggleFavourite({ menuId: item.id, name: item.name, description: item.description, price: item.price, category: item.category, cafeteriaId, cafeteriaName: cafeteria?.name ?? '' })
  }

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !cartItem.length) {
      alert('Please fill in name and phone, and add items to cart')
      return
    }
    // Validate delivery if order type is delivery
    if (orderType === 'delivery') {
      if (deliveryChargeError) {
        alert(deliveryChargeError)
        return
      }
      if (!deliveryCoords || !cafeteria?.latitude || !cafeteria?.longitude) {
        alert('Please select a delivery location')
        return
      }
    }
    // Contact details must be valid — Razorpay records, refunds and SMS depend
    // on a real phone/email (no placeholders reach the payment gateway).
    if (!isValidPhone(formData.phone)) {
      alert('Please enter a valid phone number (e.g. +91 98765 43210).')
      return
    }
    if (!isValidEmail(formData.email)) {
      alert('Please enter a valid email address so we can send your receipt and process refunds.')
      return
    }
    setIsPlacingOrder(true)
    try {
      // Get next token number: count today's orders for this cafeteria + 1
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', todayStart.toISOString())
      const tokenNumber = (count ?? 0) + 1

      const parcelChargeAmount = orderType !== 'dine_in' ? dynamicParcelCharge : 0
      const orderTotal = orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total

      // Add 10-second timeout to prevent infinite loading
      const orderPromise = supabase
        .from('orders')
        .insert([{
          cafeteria_id: cafeteriaId, student_name: formData.name, student_phone: formData.phone, student_email: formData.email,
          items: cartItem, total_amount: orderTotal, queue_position: tokenNumber, status: 'pending_payment', payment_status: 'unpaid', notes: formData.notes,
          order_type: orderType ?? 'takeaway',
          delivery_address: orderType === 'delivery' ? deliveryAddress : null,
          delivery_latitude: orderType === 'delivery' ? deliveryCoords?.lat ?? null : null,
          delivery_longitude: orderType === 'delivery' ? deliveryCoords?.lng ?? null : null,
          delivery_charge: orderType === 'delivery' ? deliveryCharge : 0,
          parcel_charge: orderType !== 'dine_in' ? dynamicParcelCharge : 0,
        }])
        .select()
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Order creation timeout')), 10000)
      )

      const { data, error } = await Promise.race([orderPromise, timeoutPromise]) as any

      if (error) {
        // Order creation failed - error handled
        alert('Failed to create order: ' + (error.message || 'Unknown error'))
        setIsPlacingOrder(false)
        return
      }

      if (data) {
        // Order created successfully
        setOrderId(data.id)
        updateUser({ name: formData.name, phone: formData.phone, email: formData.email })
        setIsPlacingOrder(false)
        setStep('payment')
      } else {
        alert('Failed to create order')
        setIsPlacingOrder(false)
      }
    } catch (error) {
      // Order creation failed
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to create order'))
      setIsPlacingOrder(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    // Find the order to check its status
    const order = cafeOrders.find(o => o.id === orderId)

    // Only allow deletion for pending_payment, payment_pending, and cancelled orders
    if (order && order.status !== 'pending_payment' && order.status !== 'payment_pending' && order.status !== 'cancelled') {
      alert(`Cannot delete ${order.status} orders. Vendor has already ${order.status === 'approved' ? 'accepted' : 'started preparing'} your order.`)
      return
    }

    if (!confirm('Delete this order?')) return
    try {
      const res = await fetch('/api/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, studentPhone: user?.phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Delete failed - error handled
        alert('Failed to delete order: ' + data.error)
      } else {
        // Server confirmed deletion — update UI
        setCafeOrders(prev => prev.filter(o => o.id !== orderId))
        alert('Order deleted successfully')
      }
    } catch (error) {
      // Delete failed
      alert('Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Lets the customer cancel an order they never paid for (mistake, or
  // changed their mind) — the vendor sees why on their end and can delete
  // it from there, rather than it silently vanishing.
  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setCancellingOrderId(orderId)
    try {
      const { error } = await supabase.rpc('cancel_order_by_customer', { p_order_id: orderId })
      if (!error) {
        setCafeOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled', denial_reason: 'Customer cancelled before payment' } : o))
      } else {
        alert('Could not cancel this order. Please try again.')
      }
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Payment modal handler
  function handleOpenUPI() {
    const parcelChargeAmount = orderType !== 'dine_in' ? dynamicParcelCharge : 0
    const paymentAmount = orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total
    const paymentUrl = `/payment?orderId=${orderId}&amount=${paymentAmount}&name=${encodeURIComponent(formData.name)}`
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      return mobileRegex.test(userAgent) || window.innerWidth < 768
    }
    if (isMobile()) {
      clearCart()
      router.push(paymentUrl)
      return
    }
    window.open(paymentUrl, 'payment_window', 'width=500,height=600')
    setConfirmedTotal(paymentAmount)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status, payment_status, token_number, items, total_amount').eq('id', orderId).single()
      if (data?.status === 'pending_approval' || data?.payment_status === 'paid') {
        clearInterval(pollRef.current)
        setConfirmedTotal(data.total_amount)
        setPaymentState('confirmed')
        clearCart()
        setTimeout(() => {
          fetchTokenData()
        }, 2000)
      }
    }, 2000)
  }

  // token_number is only assigned once the vendor marks the order ready for
  // pickup (DB trigger, supabase/migrations/20260726_token_on_order_ready.sql)
  // — food prep realistically takes longer than this screen should keep
  // someone waiting, so this poll gives up after 2 minutes and hands off to
  // the tracking page, which shows the same ticket the moment it appears
  // (see app/mobile/track/[orderId]/page.tsx) — this early poll is just for
  // the (less common) case where the food's already ready by the time
  // payment finishes.
  const fetchTokenData = async (attempt = 0) => {
    if (!orderId) return
    const { data } = await supabase.from('orders').select('token_number, items, total_amount').eq('id', orderId).single()
    if (data?.token_number != null) {
      setTokenData({ token: data.token_number, items: data.items as Array<{ name: string; quantity: number }>, total: data.total_amount, id: orderId })
      setShowTicket(true)
      // Navigate to tracking page a couple seconds after showing the ticket.
      setTimeout(() => router.push(`/mobile/track/${orderId}`), 2000)
      return
    }
    // Not ready yet — keep checking for up to 2 minutes, then move on to
    // tracking anyway rather than stranding the customer on this screen.
    if (attempt < 60) {
      setTimeout(() => fetchTokenData(attempt + 1), 2000)
    } else {
      router.push(`/mobile/track/${orderId}`)
    }
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PAYMENT_SUCCESS') {
        clearInterval(pollRef.current)
        setPaymentState('confirmed')
        clearCart()
        setTimeout(() => fetchTokenData(), 2000)
      } else if (e.data?.type === 'PAYMENT_FAILED') {
        clearInterval(pollRef.current)
        setPaymentState('failed')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [orderId])

  useEffect(() => () => clearInterval(pollRef.current), [])

  // Clear cart when user leaves this page
  useEffect(() => {
    return () => { clearCart() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper to render a single menu item card (inlined, not a component)
  const renderMenuCard = (item: MenuItem) => {
    const inCart = itemInCart(item)
    const fav = isFavourite(item.id)
    const isVeg = itemIsVeg(item)
    const catImg = item.image_url || ITEM_IMAGES[item.name] || CATEGORY_IMAGES[item.category] || null
    const showImg = catImg && !imgErrors.has(item.id)

    // Real-time "highly ordered" indicator
    const count = popularity.byId[item.id] ?? popularity.byName[item.name.toLowerCase()] ?? 0
    const ratio = popularity.max > 0 ? count / popularity.max : 0
    const popLabel = ratio >= 0.5 ? 'Highly ordered' : ratio > 0 ? 'Popular' : ''

    const descExpanded = expandedDesc.has(item.id)
    const toggleDesc = () => setExpandedDesc(prev => {
      const next = new Set(prev)
      next.has(item.id) ? next.delete(item.id) : next.add(item.id)
      return next
    })

    return (
      <motion.div
        key={item.id}
        className="dish-card"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.35 }}
        whileHover={{ y: -2 }}
      >
        <div className="dish-main">
          {/* Veg / Non-veg badge */}
          <span className="veg-badge" style={{ border: `1.5px solid ${isVeg ? '#2e9e6b' : '#b8321f'}` }}>
            {isVeg
              ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2e9e6b' }} />
              : <span style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '8px solid #b8321f' }} />}
          </span>

          <div className="dish-title2">{item.name}</div>

          {popLabel && (
            <div className="pop-row">
              <div className="pop-bar"><div className="pop-bar-fill" style={{ width: `${Math.max(ratio * 100, 18)}%` }} /></div>
              <span className="pop-text">{popLabel}</span>
            </div>
          )}

          <div className="dish-price2">
            {item.variants && item.variants.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {item.variants.map((v, idx) => {
                  const selected = selectedVariants[item.id] === v.name
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [item.id]: v.name }))}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1.5px solid ${selected ? '#E8334A' : '#ddd'}`,
                        background: selected ? '#E8334A' : 'white',
                        color: selected ? 'white' : '#333',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Some dishes are printed as bare prices with no size
                          against them — "79/159" — so the option is named by
                          its own price. Showing name and price would read
                          "₹79 ₹79". The name still has to be distinct, or two
                          choices of one dish collapse into a single cart line. */}
                      {v.name.includes('₹') ? v.name : `${v.name} ₹${v.price}`}
                    </button>
                  )
                })}
              </div>
            ) : (
              `₹${item.price}`
            )}
          </div>

          {item.description && (
            <div className={`dish-desc2 ${descExpanded ? '' : 'clamped'}`} onClick={toggleDesc}>
              {item.description}
            </div>
          )}
          {item.description && item.description.length > 60 && (
            <span className="dish-more" onClick={toggleDesc}>{descExpanded ? 'less' : 'more'}</span>
          )}

          <div className="dish-actions2" style={{ marginTop: 10 }}>
            <button
              className="dish-icon-btn"
              onClick={() => handleToggleFavourite(item)}
            >
              <Heart size={16} fill={fav ? '#E8334A' : 'transparent'} color={fav ? '#E8334A' : '#999'} />
            </button>
          </div>
        </div>

        {/* Big visible image on the right with ADD overlapping */}
        <div className="dish-right">
          {showImg
            ? <img src={catImg!} alt={item.name} className="dish-img2" onError={() => setImgErrors(prev => new Set(prev).add(item.id))} />
            : <div className="dish-img2-emoji">{CATEGORY_EMOJI[item.category] ?? '🍽️'}</div>}
          <div className="dish-add-float">
            {inCart ? (
              <div className="qty-box2">
                <motion.button {...hoverScale} onClick={() => updateQuantity(cartLineKey(inCart), inCart.quantity - 1)}>−</motion.button>
                <span>{inCart.quantity}</span>
                <motion.button {...hoverScale} onClick={() => updateQuantity(cartLineKey(inCart), inCart.quantity + 1)}>+</motion.button>
              </div>
            ) : (
              <motion.button {...hoverScale} className="add-btn2" onClick={() => handleAddItem(item)}>ADD +</motion.button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--bg)' }}>
        <style>{`
          @keyframes skeleton { 0% { background-color: #f0f0f0; } 50% { background-color: #e0e0e0; } 100% { background-color: #f0f0f0; } }
          .skeleton-box { animation: skeleton 1.5s infinite; border-radius: 8px; }
        `}</style>

        {/* Header Skeleton */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton-box" style={{ width: 24, height: 24 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton-box" style={{ height: 20, marginBottom: 8, width: '60%' }}></div>
            <div className="skeleton-box" style={{ height: 14, width: '40%' }}></div>
          </div>
          <div className="skeleton-box" style={{ width: 28, height: 28 }}></div>
        </div>

        {/* Category Image Skeleton */}
        <div style={{ padding: '16px', marginBottom: 16 }}>
          <div className="skeleton-box" style={{ width: '100%', height: 180, marginBottom: 16 }}></div>

          {/* Menu Items Skeleton */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="skeleton-box" style={{ height: 16, width: '50%' }}></div>
                <div className="skeleton-box" style={{ height: 16, width: '20%' }}></div>
              </div>
              <div className="skeleton-box" style={{ height: 12, width: '80%' }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (resolving || loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: 36, height: 36, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Loading menu...</div>
    </div>
  )

  if (!cafeteria) {
    return <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: '40px' }}>Restaurant not found</div>
  }

  // RENDER BY TAB
  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: 80,
      background: !showVegFront ? 'linear-gradient(135deg, rgba(255,200,200,0.08) 0%, rgba(255,150,150,0.05) 100%)' : 'transparent',
    }}>
      {/* HOME TAB - MENU */}
      {activeTab === 'home' && step === 'menu' && (
        <div>
          <style>{`
            .menu-sticky-top { position: sticky; top: 0; z-index: 50; background: white; }
            .menu-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(180deg, #fff8f5, #ffffff); box-shadow: 0 2px 10px rgba(26,31,46,0.06); position: relative; z-index: 1; }
            .menu-back-btn { width: 36px; height: 36px; border-radius: 50%; background: #f5f5f7; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .menu-cafe-avatar { width: 42px; height: 42px; border-radius: 14px; background: #fffdf7; border: 1px solid var(--accent-light2); display: flex; align-items: center; justify-content: center; font-size: 21px; flex-shrink: 0; overflow: hidden; padding: 4px; box-sizing: border-box; }
            .menu-search-bar { display: flex; align-items: center; gap: 10px; background: #f5f5f7; border-radius: 12px; padding: 10px 14px; margin: 10px 16px 0; }
            .menu-search-bar input { background: none; border: none; outline: none; font-size: 14px; color: var(--text); flex: 1; }
            .cat-pills { display: flex; align-items: flex-start; gap: 8px; overflow-x: auto; padding: 10px 16px 12px; scrollbar-width: none; }
            .cat-pills::-webkit-scrollbar { display: none; }
            .cat-pill { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; flex-shrink: 0; }
            .cat-pill-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 2px solid transparent; transition: all 0.18s; }
            .cat-pill-icon.active { border-color: var(--accent); background: #fff0f2; }
            .cat-pill-icon.inactive { background: #f5f5f7; }
            /* Reserve two lines for every label so a long one ("Beverages and
               Delights") can't make its pill taller than the rest and spill
               into the sub-row below. */
            .cat-pill-label { font-size: 11px; font-weight: 600; color: var(--text2); width: 68px; min-height: 27px; text-align: center; line-height: 1.2; }
            .cat-pill-label.active { color: var(--accent); }
            .cat-subpills { display: flex; gap: 8px; overflow-x: auto; padding: 2px 16px 12px; scrollbar-width: none; }
            .cat-subpills::-webkit-scrollbar { display: none; }
            .cat-subpill {
              display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0;
              padding: 9px 16px; border-radius: 999px; cursor: pointer;
              border: 1px solid rgba(26,31,46,0.12); background: #f5f5f7;
              color: var(--text2); font-size: 13.5px; font-weight: 600;
              font-family: var(--font-body); white-space: nowrap;
              transition: background 0.18s, color 0.18s, border-color 0.18s;
            }
            .cat-subpill.active { background: #fff0f2; border-color: var(--accent); color: var(--accent); }
            .menu-section-title { font-size: 18px; font-weight: 800; color: var(--navy); padding: 20px 16px 8px; }
            .menu-item-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #f0f0f2; background: white; }
            .menu-item-thumb { width: 72px; height: 72px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: #f5f5f7; }
            .menu-item-thumb-emoji { width: 72px; height: 72px; border-radius: 12px; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
            .menu-item-info { flex: 1; min-width: 0; }
            .menu-item-name-sw { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .menu-item-desc { font-size: 12px; color: var(--muted); margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .menu-item-price-sw { font-size: 14px; font-weight: 700; color: var(--text); }
            .menu-item-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
            .qty-box { display: flex; align-items: center; gap: 4px; border: 1.5px solid var(--accent); border-radius: 8px; overflow: hidden; }
            .qty-btn { width: 28px; height: 28px; background: none; border: none; color: var(--accent); font-weight: 800; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .qty-num { font-size: 14px; font-weight: 700; color: var(--text); min-width: 18px; text-align: center; }
            .add-btn-sw { width: 72px; height: 32px; background: white; border: 1.5px solid var(--accent); color: var(--accent); border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; }

            /* Swiggy-style dish card */
            .dish-card { display: flex; justify-content: space-between; gap: 14px; padding: 20px 16px; border-bottom: 1px solid #eee; }
            .dish-main { flex: 1; min-width: 0; }
            .veg-badge { width: 16px; height: 16px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px; }
            .dish-title2 { font-size: 16px; font-weight: 700; color: var(--navy); line-height: 1.25; margin-bottom: 8px; }
            .pop-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .pop-bar { width: 54px; height: 6px; border-radius: 3px; background: #e6e6e6; overflow: hidden; }
            .pop-bar-fill { height: 100%; background: #2e9e6b; border-radius: 3px; }
            .pop-text { font-size: 12px; color: #555; font-weight: 500; }
            .dish-price2 { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
            .dish-desc2 { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 10px; }
            .dish-desc2.clamped { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .dish-more { color: var(--navy); font-weight: 700; cursor: pointer; }
            .dish-actions2 { display: flex; gap: 12px; }
            .dish-icon-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #eee; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
            .dish-right { width: 132px; flex-shrink: 0; position: relative; }
            .dish-img2 { width: 132px; height: 132px; border-radius: 16px; object-fit: cover; background: #f5f5f7; }
            .dish-img2-emoji { width: 132px; height: 132px; border-radius: 16px; background: linear-gradient(135deg, #ffecd2, #fcb69f); display: flex; align-items: center; justify-content: center; font-size: 52px; }
            .dish-add-float { position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%); width: 112px; }
            .add-btn2 { width: 112px; height: 38px; background: white; border: 1px solid #ddd; color: var(--accent); border-radius: 10px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
            .qty-box2 { width: 112px; height: 38px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #ddd; border-radius: 10px; background: white; box-shadow: 0 6px 16px rgba(0,0,0,0.12); overflow: hidden; }
            .qty-box2 button { width: 38px; height: 100%; background: white; border: none; color: var(--accent); font-size: 18px; font-weight: 800; cursor: pointer; }
            .qty-box2 span { font-weight: 800; font-size: 15px; color: var(--navy); }
          `}</style>

          {/* Sticky top: header + search + category pills */}
          <div className="menu-sticky-top">
            <div className="menu-header">
              <motion.button {...hoverScale} className="menu-back-btn" onClick={() => { window.location.href = '/browse' }} style={{ border: 'none', cursor: 'pointer' }}>
                <ChevronLeft size={22} color='var(--text)' />
              </motion.button>
              <div className="menu-cafe-avatar" aria-hidden="true">
                {CAFETERIA_LOGOS[cafeteria.name] ? (
                  <img
                    src={CAFETERIA_LOGOS[cafeteria.name]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (cafeteria.image_emoji || '🍽️')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 19, fontWeight: 800, letterSpacing: -0.3, color: 'var(--navy)' }}>{cafeteria.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>📍 {cafeteria.location}</div>
              </div>
              {/* Glass effect search icon button */}
              <motion.button
                {...hoverScale}
                onClick={() => setShowSearchBar(!showSearchBar)}
                aria-label="Search"
                style={{
                  marginLeft: 'auto', width: 44, height: 36, flexShrink: 0, borderRadius: 10, cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  background: 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </motion.button>
            </div>

            {/* Expanding search bar */}
            <AnimatePresence>
              {showSearchBar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  style={{ overflow: 'hidden', margin: '8px 16px 0' }}
                >
                  <div className="menu-search-bar" style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 50,
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                      ref={searchInputRef}
                      placeholder="Search food or drink..."
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                      style={{ border: 'none', background: 'none', outline: 'none', flex: 1, padding: 0, fontSize: 16, fontFamily: 'inherit' }}
                    />
                    {menuSearch && (
                      <motion.button {...hoverScale} onClick={() => setMenuSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, padding: 0, flexShrink: 0 }}>✕</motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter + Veg/Non-veg toggle */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 16px 0' }}>
              <motion.button
                {...hoverScale}
                onClick={() => setShowFilter(true)}
                aria-label="Filters"
                style={{
                  position: 'relative', width: 44, height: 42, flexShrink: 0, borderRadius: 12, cursor: 'pointer',
                  border: `1px solid ${filtersActive ? 'var(--accent)' : 'rgba(26,31,46,0.12)'}`,
                  background: filtersActive ? '#fff0f2' : '#f5f5f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <SlidersHorizontal size={18} color={filtersActive ? '#E8334A' : 'var(--text2)'} />
                {filtersActive && <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: '#E8334A' }} />}
              </motion.button>

              {/* Veg button */}
              <motion.button
                {...hoverScale}
                onClick={() => setShowVegFront(true)}
                style={{
                  padding: '6px 12px', height: 42, flexShrink: 0, borderRadius: 12, cursor: 'pointer',
                  border: 'none',
                  background: showVegFront ? '#22c55e' : '#f5f5f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: showVegFront ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
                  fontSize: 13, fontWeight: 600, color: showVegFront ? '#fff' : '#666',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: showVegFront ? '#fff' : '#22c55e', flexShrink: 0 }} />
                Veg
              </motion.button>

              {/* Non-veg button */}
              <motion.button
                {...hoverScale}
                onClick={() => setShowVegFront(false)}
                style={{
                  padding: '6px 12px', height: 42, flexShrink: 0, borderRadius: 12, cursor: 'pointer',
                  border: 'none',
                  background: !showVegFront ? '#ef4444' : '#f5f5f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: !showVegFront ? '0 2px 8px rgba(239, 68, 68, 0.3)' : 'none',
                  fontSize: 13, fontWeight: 600, color: !showVegFront ? '#fff' : '#666',
                }}
              >
                <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid ' + (!showVegFront ? '#fff' : '#ef4444'), flexShrink: 0 }} />
                Non-Veg
              </motion.button>
            </div>

            {/* Category pills */}
            {!menuSearch && (
              <>
                <div className="cat-pills">
                  {visibleTopCategories.map(cat => {
                    const groupMembers = groupMembersPresent.get(cat)
                    const isGroup = !!groupMembers
                    const CategoryIcon = categoryIcon(cat)
                    const isActive = isGroup ? openGroupLabel === cat : selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        className="cat-pill"
                        // Opening the group jumps to its first category so the
                        // list below always has something in it.
                        onClick={() => setSelectedCategory(isGroup ? groupMembers[0] : cat)}
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        <div className={`cat-pill-icon ${isActive ? 'active' : 'inactive'}`}>
                          <CategoryIcon size={24} strokeWidth={1.6} color="#1a1a1a" />
                        </div>
                        <span className={`cat-pill-label ${isActive ? 'active' : ''}`}>{cat === 'Main' ? 'Combos' : cat}</span>
                      </button>
                    )
                  })}
                  {groupOpen && (
                    <button
                      className="cat-pill"
                      onClick={() => setOthersOpen(o => !o)}
                      aria-expanded={othersOpen}
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      <div className="cat-pill-icon inactive">
                        {othersOpen
                          ? <ChevronLeft size={24} strokeWidth={1.6} color="#1a1a1a" />
                          : <MoreHorizontal size={24} strokeWidth={1.6} color="#1a1a1a" />}
                      </div>
                      <span className="cat-pill-label">{othersOpen ? 'Show less' : 'View others'}</span>
                    </button>
                  )}
                </div>

                {/* Sub-row for whichever group is open */}
                {groupOpen && (
                  <div className="cat-subpills">
                    {openGroupMembers.map(cat => {
                      const CategoryIcon = categoryIcon(cat)
                      const isActive = selectedCategory === cat
                      return (
                        <button
                          key={cat}
                          className={`cat-subpill ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                        >
                          <CategoryIcon size={18} strokeWidth={1.8} />
                          <span>{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Items list */}
          <div style={{ paddingBottom: 180 }}>
            {menuSearch ? (
              // Search results across all categories
              (() => {
                const q = menuSearch.toLowerCase()
                const results = applyDishFilters(visibleItems.filter(m => m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q) || m.category.toLowerCase().includes(q)))
                return results.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No items found for &quot;{menuSearch}&quot;</div>
                ) : (
                  <>
                    <div className="menu-section-title">Results ({results.length})</div>
                    {results.map(item => renderMenuCard(item))}
                  </>
                )
              })()
            ) : (
              // Items for selected category
              (() => {
                if (visibleItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                      No items available with selected filters.
                    </div>
                  )
                }
                const catItems = applyDishFilters(visibleItems.filter(m => m.category === selectedCategory))
                // Non-veg gets its own banner where one exists, falling back to
                // the shared image otherwise — several categories carry both,
                // so a veg-looking banner over a non-veg list would be wrong.
                const heroSrc =
                  (!showVegFront ? CATEGORY_IMAGES_NONVEG[selectedCategory] : null)
                  || CATEGORY_IMAGES[selectedCategory]
                  || null
                // Failures are tracked by URL, not category — one category can
                // now have two banners, and a broken veg one must not blank the
                // non-veg one. (The original handler set display:none straight
                // on the parent node, which React reuses across categories, so
                // a single failure hid the hero everywhere after it.)
                const catImg = heroSrc && !heroImgErrors.has(heroSrc) ? heroSrc : null
                return (
                  <>
                    {/* Category hero image */}
                    {catImg && (
                      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                        <img key={catImg} src={catImg} alt={selectedCategory} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={() => setHeroImgErrors(prev => new Set(prev).add(catImg))} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                        <div style={{ position: 'absolute', bottom: 14, left: 16, color: 'white', fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{selectedCategory}</div>
                        <div style={{ position: 'absolute', bottom: 14, right: 16, color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{catItems.length} items</div>
                      </div>
                    )}
                    <div className="menu-section-title" style={{ paddingTop: catImg ? 12 : 20 }}>{catImg ? '' : selectedCategory} {!catImg && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>• {catItems.length} items</span>}</div>
                    {/* Section surcharge from the printed menu — "for gravy,
                        extra ₹20" and the like. It belongs to the whole section
                        rather than to any one dish, so it sits under the heading
                        where the card prints it, not on every item. */}
                    {categoryNoteFor(selectedCategory) && (
                      <div style={{ margin: '0 0 12px', padding: '9px 13px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>
                        {categoryNoteFor(selectedCategory)}
                      </div>
                    )}
                    {catItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>No dishes match your filters.</div>
                    ) : (
                      catItems.map(item => renderMenuCard(item))
                    )}
                  </>
                )
              })()
            )}
          </div>

          {/* Filter Sheet */}
          <AnimatePresence>
            {showFilter && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilter(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 299 }} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
                >
                <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 18px' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>Filters</div>
                  <motion.button {...hoverScale} onClick={() => { setSortBy('relevance'); setPriceRange('all'); setCollection('all') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Clear all</motion.button>
                </div>

                {/* Sort by */}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Sort by</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                  {([
                    { v: 'relevance', l: 'Relevance' },
                    { v: 'cost_low', l: 'Cost: Low to High' },
                    { v: 'cost_high', l: 'Cost: High to Low' },
                  ] as const).map(o => (
                    <motion.button {...hoverScale} key={o.v} onClick={() => setSortBy(o.v)} style={pillStyle(sortBy === o.v)}>{o.l}</motion.button>
                  ))}
                </div>

                {/* Dish price */}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Dish price</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                  {([
                    { v: 'all', l: 'All', sym: '' },
                    { v: 'under200', l: 'Under 200', sym: '₹' },
                    { v: 'mid', l: '200 – 400', sym: '₹₹' },
                    { v: 'above400', l: '400 & above', sym: '₹₹₹' },
                  ] as const).map(o => (
                    <motion.button {...hoverScale} key={o.v} onClick={() => setPriceRange(o.v)} style={pillStyle(priceRange === o.v)}>
                      {o.sym && <span style={{ fontWeight: 800, marginRight: 6 }}>{o.sym}</span>}{o.l}
                    </motion.button>
                  ))}
                </div>

                {/* Collections */}
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Collections</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {([
                    { v: 'all', l: 'All' },
                    { v: 'previous', l: 'Previously ordered' },
                    { v: 'new', l: 'New to you' },
                  ] as const).map(o => (
                    <motion.button {...hoverScale} key={o.v} onClick={() => setCollection(o.v)} style={pillStyle(collection === o.v)}>{o.l}</motion.button>
                  ))}
                </div>

                <motion.button {...hoverScale} onClick={() => setShowFilter(false)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Show results</motion.button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Cart Sheet */}
          <AnimatePresence>
            {showCartSheet && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCartSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 299 }} />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px 36px', maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
                >
                <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 18px' }} />
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Cart 🛒</div>
                {cartItem.map(item => (
                  <div key={cartLineKey(item)} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(26,31,46,0.06)' }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', minWidth: 42, textAlign: 'right' }}>₹{item.price * item.quantity}</span>
                      <motion.button {...hoverScale} onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 16, cursor: 'pointer' }}>−</motion.button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <motion.button {...hoverScale} onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, cursor: 'pointer' }}>+</motion.button>
                      <motion.button {...hoverScale} onClick={() => removeItem(cartLineKey(item))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '0 2px' }}>✕</motion.button>
                    </div>
                  </div>
                ))}
                {(orderType === 'delivery' || orderType === 'takeaway' || orderType !== null) && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                      <span>Subtotal</span><span>₹{total}</span>
                    </div>
                    {orderType !== 'dine_in' && dynamicParcelCharge > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, color: 'var(--muted)' }}>
                        <span>Parcel Charge ({parcelChargeUnits} × ₹{PARCEL_CHARGE_PER_ITEM})</span><span>₹{dynamicParcelCharge}</span>
                      </div>
                    )}
                    {orderType === 'delivery' && deliveryCharge > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13, color: 'var(--muted)' }}>
                        <span>Delivery ({deliveryDistance} km)</span><span>₹{deliveryCharge}</span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 16px', fontWeight: 700, fontSize: 17, borderTop: '1px solid var(--border)' }}>
                  <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total}</span>
                </div>
                <div style={{ padding: '14px', background: '#f0f4f8', border: '1px solid #d0dce6', borderRadius: 12, marginBottom: 16, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>📌 Important: Wait for Confirmation</div>
                  <div style={{ fontWeight: 500 }}>Complete payment from your desired app and return back to this page. Keep this tab open to receive your order token and track your order in real-time.</div>
                </div>
                <motion.button {...hoverScale} onClick={() => { setShowCartSheet(false); if (!orderType) { setShowOrderTypeModal(true) } else { setStep('details') } }} style={{ width: '100%', padding: 16, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Proceed to Checkout →
                </motion.button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Floating Cart FAB */}
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setShowCartSheet(true)}
                style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 200, background: 'linear-gradient(135deg,#E8334A,#c0202e)', color: 'white', border: 'none', borderRadius: 50, padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 6px 24px rgba(232,51,74,0.5)', fontFamily: 'var(--font-body)' }}
              >
                <div style={{ position: 'relative' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  <span style={{ position: 'absolute', top: -8, right: -8, background: 'white', color: '#E8334A', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{itemCount}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>₹{orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>View Cart →</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Your Orders from {cafeteria.name}</div>
          </div>
          <div style={{ padding: '16px' }}>
            {loadingCafeOrders ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading your orders…</div>
            ) : cafeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No orders yet. Start ordering! 🍱</div>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={stagger}>
                {cafeOrders.map(order => {
                  const readyLabel = (order as any).order_type === 'delivery' ? '🚚 Out for Delivery' : '🔔 Ready for Pickup!'
                  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                    pending_payment:   { label: '⏳ Awaiting Payment',    color: '#d4821a', bg: '#fff8ec' },
                    payment_pending:   { label: '⏳ Awaiting Payment',    color: '#d4821a', bg: '#fff8ec' },
                    pending_approval:  { label: '⏳ Awaiting Acceptance', color: '#2563eb', bg: '#eff6ff' },
                    pending:           { label: '⏳ Awaiting Payment',    color: '#d4821a', bg: '#fff8ec' },
                    paid:              { label: '⏳ Awaiting Acceptance', color: '#2563eb', bg: '#eff6ff' },
                    approved:          { label: '✓ Order Accepted',       color: '#2563eb', bg: '#eff6ff' },
                    preparing:         { label: '👨‍🍳 Being Prepared',     color: '#7c5cfc', bg: '#f3f0ff' },
                    ready:             { label: readyLabel, color: '#2e9e6b', bg: '#edfaf3' },
                    collected:         { label: '✅ Collected',            color: '#8a90a8', bg: '#f5f5f5' },
                    cancelled:         { label: '❌ Cancelled',            color: '#E8334A', bg: '#fff0f2' },
                  }
                  const cfg = statusConfig[order.status] ?? statusConfig.pending
                  const isPast = ['collected', 'cancelled'].includes(order.status)
                  const isPending = order.status === 'pending_payment' || order.status === 'payment_pending'

                  return (
                    <motion.div
                      key={order.id}
                      variants={staggerItem}
                      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(26,31,46,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { if (!isPending) window.location.href = `/mobile/track/${order.id}` }}
                      style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 12, cursor: isPending ? 'default' : 'pointer', borderLeft: `4px solid ${cfg.color}` }}
                    >
                      {/* Top row: token + time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          🕐 {new Date(order.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                        {(order as any).queue_position && (
                          <div style={{ fontSize: 16, fontWeight: 900, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}`, borderRadius: 8, padding: '1px 10px' }}>
                            #{(order as any).queue_position}
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, display: 'inline-block', padding: '3px 10px', borderRadius: 20, marginBottom: 10 }}>
                        {cfg.label}
                      </div>

                      {/* Vendor sent a payment reminder */}
                      {isPending && order.payment_reminder_sent_at && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#E8334A', background: '#fff0f2', border: '1px solid rgba(232,51,74,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                          ⚠️ Order won&apos;t be confirmed until paid
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', marginBottom: 8 }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity}× {item.name}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total + action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>₹{order.total_amount}</span>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button
                              {...hoverScale}
                              onClick={e => { e.stopPropagation(); window.location.href = `/payment?orderId=${order.id}&amount=${order.total_amount}&name=${encodeURIComponent(order.student_name)}` }}
                              style={{ fontSize: 12, color: 'white', background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Continue to Payment
                            </motion.button>
                            <motion.button
                              {...(cancellingOrderId === order.id ? {} : hoverScale)}
                              onClick={e => { e.stopPropagation(); cancelOrder(order.id) }}
                              disabled={cancellingOrderId === order.id}
                              style={{ fontSize: 12, color: '#dc2626', background: 'none', border: '1px solid #dc2626', borderRadius: 8, padding: '6px 12px', cursor: cancellingOrderId === order.id ? 'default' : 'pointer', fontWeight: 700, opacity: cancellingOrderId === order.id ? 0.6 : 1 }}
                            >
                              {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                            </motion.button>
                          </div>
                        ) : !isPast
                          ? <span style={{ fontSize: 12, color: '#E8334A', fontWeight: 700 }}>Track order →</span>
                          : <motion.button {...hoverScale} onClick={e => { e.stopPropagation(); handleDeleteOrder(order.id) }} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>🗑️ Delete</motion.button>
                        }
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Your Profile</div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Name</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{user?.name || 'Not set'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Phone</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{user?.phone || 'Not set'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Email</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.email || 'Not set'}</div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER STEPS - DETAILS, PAYMENT, CONFIRMATION */}
      {step === 'details' && (
        <div style={{ padding: 'var(--mobile-spacing)', paddingBottom: 100 }}>
          {/* Order Type Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent-light)', border: '1px solid var(--accent-light2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{orderType === 'dine_in' ? '🍽️' : orderType === 'delivery' ? '🛵' : '🥡'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{orderType === 'dine_in' ? 'Dine In' : orderType === 'delivery' ? 'Home Delivery' : 'Take Away'}</div>
                {orderType === 'delivery' && deliveryAddress && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{deliveryAddress}</div>}
              </div>
            </div>
            <motion.button {...hoverScale} onClick={() => setShowOrderTypeModal(true)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Change</motion.button>
          </div>
          {/* Order Details Form */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Details</h3>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="email"
            placeholder="Email (Optional)"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
          />
          <textarea
            placeholder="Special requests..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: 24, border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, minHeight: 80 }}
          />

          {/* Cart Preview with Images and Controls */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Your Order Preview</h3>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              {cartItem.map(item => {
                const menuItem = menuItems.find(m => m.id === item.menuId)
                return (
                  <motion.div key={cartLineKey(item)} variants={staggerItem} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      🍱
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>₹{item.price}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <motion.button
                          {...hoverScale}
                          onClick={() => updateQuantity(cartLineKey(item), item.quantity - 1)}
                          style={{ width: 24, height: 24, borderRadius: 4, background: '#ccc', color: '#333', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                        >
                          −
                        </motion.button>
                        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{item.quantity}</span>
                        <motion.button
                          {...hoverScale}
                          onClick={() => updateQuantity(cartLineKey(item), item.quantity + 1)}
                          style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{item.price * item.quantity}</div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {(orderType === 'delivery' || orderType === 'takeaway' || orderType !== null) && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                {/* Must be dynamicParcelCharge — the one the total actually adds.
                    This row used to print a flat ₹5 from a separate constant even
                    when nothing was charged, so the breakdown did not sum to the
                    total. The constant is gone; there is only one number now. */}
                {orderType !== 'dine_in' && dynamicParcelCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                    <span>Parcel Charge ({parcelChargeUnits} × ₹{PARCEL_CHARGE_PER_ITEM})</span>
                    <span>₹{dynamicParcelCharge}</span>
                  </div>
                )}
                {orderType === 'delivery' && deliveryCharge > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <span>Delivery ({deliveryDistance} km)</span>
                    <span>₹{deliveryCharge}</span>
                  </div>
                )}
                {orderType !== 'delivery' && orderType !== 'dine_in' && (
                  <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 12, paddingBottom: 12 }} />
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>₹{orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total}</span>
            </div>
          </div>

          {/* An out-of-range address used to be invisible here: the delivery
              row hides itself when the charge is ₹0, so the total looked
              ordinary and the refusal only arrived as an alert on tapping
              Proceed — quoting a reason last shown in the order-type sheet the
              customer had already dismissed. Say it where they are, next to
              the button it blocks, with the way to fix it. */}
          {orderType === 'delivery' && deliveryBlocked && (
            <div style={{ padding: '12px 14px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 12, lineHeight: 1.5 }}>
              ⚠️ {deliveryChargeError ?? 'We need a delivery location before you can pay.'}
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                style={{ display: 'block', marginTop: 8, background: 'none', border: 'none', padding: 0, color: '#92400e', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
              >
                Change delivery location
              </button>
            </div>
          )}

          <motion.button
            {...(!(!formData.name || !formData.phone || isPlacingOrder || deliveryBlocked) ? hoverScale : {})}
            onClick={handlePlaceOrder}
            disabled={!formData.name || !formData.phone || isPlacingOrder || deliveryBlocked}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: !formData.name || !formData.phone || isPlacingOrder || deliveryBlocked ? 'not-allowed' : 'pointer', opacity: !formData.name || !formData.phone || isPlacingOrder || deliveryBlocked ? 0.6 : 1 }}
          >
            {isPlacingOrder ? '⏳ Processing...' : 'Proceed to Payment'}
          </motion.button>
        </div>
      )}

      {step === 'payment' && paymentState === 'idle' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>💳</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Complete Payment</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>Amount: ₹{orderType === 'delivery' ? total + dynamicParcelCharge + deliveryCharge : orderType === 'takeaway' ? total + dynamicParcelCharge : total}</div>
          <motion.button
            {...hoverScale}
            onClick={handleOpenUPI}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Pay Now
          </motion.button>
        </motion.div>
      )}

      {step === 'payment' && paymentState === 'confirmed' && !showTicket && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Payment confirmed!</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{cafeteria.name} is on it — we'll show your token the moment it's ready.</div>
        </motion.div>
      )}

      {/* Not gated on step === 'confirmation': step is never actually set to
          that value, so the ticket renders purely off showTicket/tokenData. */}
      {showTicket && tokenData && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 20 }}>
          <TokenTicket token={tokenData.token} items={tokenData.items} total={tokenData.total} orderId={tokenData.id} cafeteriaName={cafeteria.name} onClose={() => setShowTicket(false)} />
          <motion.button
            {...hoverScale}
            onClick={() => router.push(`/mobile/track/${tokenData.id}`)}
            style={{ marginTop: 16, width: '100%', padding: 15, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            🛵 Track My Order →
          </motion.button>
        </motion.div>
      )}

      {/* ORDER TYPE MODAL */}
      <AnimatePresence>
        {showOrderTypeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setShowOrderTypeModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '28px 20px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--navy)' }}>How would you like your order?</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Choose your preferred order type</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'dine_in', label: 'Dine In', desc: 'Eat at the restaurant', charge: 0, emoji: '🍽️' },
                { key: 'takeaway', label: 'Take Away', desc: 'Pick up and go', charge: dynamicParcelCharge, emoji: '🥡' },
                { key: 'delivery', label: 'Home Delivery', desc: 'Deliver to my address', charge: dynamicParcelCharge, emoji: '🛵' },
              ].map(opt => {
                const isDeliveryUnavailable = opt.key === 'delivery' && cafeteria?.delivery_available === false
                return (
                  <motion.button
                    key={opt.key}
                    whileHover={!isDeliveryUnavailable ? { scale: 1.01 } : {}}
                    whileTap={!isDeliveryUnavailable ? { scale: 0.98 } : {}}
                    onClick={() => {
                      if (isDeliveryUnavailable) return
                      const t = opt.key as 'dine_in' | 'takeaway' | 'delivery'
                      setOrderType(t)
                      if (t === 'delivery') { setShowOrderTypeModal(false); setShowMapPicker(true) } else { setShowOrderTypeModal(false); setStep('details') }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 18px',
                      border: `2px solid ${isDeliveryUnavailable ? '#ddd' : orderType === opt.key ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 14,
                      background: isDeliveryUnavailable ? '#f9f9f9' : orderType === opt.key ? 'var(--accent-light)' : 'white',
                      cursor: isDeliveryUnavailable ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      opacity: isDeliveryUnavailable ? 0.5 : 1,
                    }}>
                    <span style={{ fontSize: 32 }}>{opt.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isDeliveryUnavailable ? '#ccc' : orderType === opt.key ? 'var(--accent)' : 'var(--navy)' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{isDeliveryUnavailable ? 'Not available now' : `${opt.desc}${opt.charge > 0 ? ` • +₹${opt.charge}` : ''}`}</div>
                    </div>
                    {orderType === opt.key && !isDeliveryUnavailable && <span style={{ color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                  </motion.button>
                )
              })}
            </div>
            {orderType === 'delivery' && (
              <div style={{ marginTop: 16 }}>
                {deliveryChargeError ? (
                  <div style={{ padding: '12px 14px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 12, fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                    ⚠️ {deliveryChargeError}
                  </div>
                ) : null}
                {deliveryAddress && !deliveryChargeError ? (
                  <div style={{ padding: '12px 14px', background: '#f0faf5', border: '2px solid var(--accent)', borderRadius: 12, fontSize: 13, color: 'var(--navy)', marginBottom: 12 }}>
                    <div>📍 {deliveryAddress}</div>
                    {deliveryDistance > 0 && (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                        Distance: {deliveryDistance} km | Delivery: ₹{deliveryCharge}
                      </div>
                    )}
                  </div>
                ) : deliveryAddress ? null : null}
                <motion.button
                  {...hoverScale}
                  onClick={() => setShowMapPicker(true)}
                  style={{ width: '100%', padding: 14, background: deliveryAddress ? 'white' : 'var(--accent)', color: deliveryAddress ? 'var(--accent)' : 'white', border: `2px solid var(--accent)`, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  {deliveryAddress ? '📍 Change Location' : '📍 Select on Map'}
                </motion.button>
                {deliveryAddress && (
                  <motion.button {...hoverScale} onClick={() => { setShowOrderTypeModal(false); setStep('details') }}
                    style={{ width: '100%', marginTop: 10, padding: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Confirm & Proceed →
                  </motion.button>
                )}
              </div>
            )}
            {orderType && orderType !== 'delivery' && (
              <motion.button {...hoverScale} onClick={() => { setShowOrderTypeModal(false); setStep('details') }} style={{ width: '100%', marginTop: 16, padding: 14, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Confirm & Proceed →
              </motion.button>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showMapPicker && (
        <DeliveryMapModal
          center={
            cafeteria?.latitude && cafeteria?.longitude
              ? { lat: cafeteria.latitude, lng: cafeteria.longitude }
              : undefined
          }
          onConfirm={(addr, coords) => {
            setDeliveryAddress(addr)
            setDeliveryCoords(coords ?? null)
            setShowMapPicker(false)
            setStep('details')
          }}
          onClose={() => {
            setShowMapPicker(false)
            // if closing without address, reopen order type modal so user can change
            if (!deliveryAddress) setShowOrderTypeModal(true)
          }}
        />
      )}

      {/* TAB NAVIGATION — same four tabs as the rest of the app, but scoped to
          this restaurant: its menu, its food search, its orders. */}
      <InteractiveMenu
        activeIndex={activeTab === 'orders' ? 2 : navSearchActive ? 1 : 0}
        items={[
          {
            label: 'home',
            icon: Home,
            onSelect: () => { setNavSearchActive(false); setActiveTab('home'); setStep('menu'); setMenuSearch('') },
          },
          {
            label: 'search',
            icon: Search,
            onSelect: () => {
              setNavSearchActive(true)
              setActiveTab('home')
              setStep('menu')
              setShowSearchBar(true)
            },
          },
          { label: 'orders', icon: ShoppingBag, onSelect: () => { setNavSearchActive(false); setActiveTab('orders') } },
          { label: 'profile', icon: User, onSelect: () => router.push('/profile') },
        ]}
      />
    </div>
  )
}
