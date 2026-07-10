'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/hooks/useCart'
import { useUserInfo } from '@/lib/hooks/useUserInfo'
import { TokenTicket } from '@/components/TokenTicket'
import { generateSlug } from '@/lib/utils/slug'
import { ChevronLeft, Plus, Minus, QrCode, Heart, Home, ShoppingBag, User } from 'lucide-react'
import { useFavourites } from '@/lib/hooks/useFavourites'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  stock_quantity?: number | null
}

interface Cafeteria {
  id: string
  name: string
  image_emoji: string
  location: string
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
}

type Step = 'menu' | 'details' | 'payment' | 'confirmation'
type Tab = 'home' | 'orders' | 'profile'

const CATEGORY_EMOJI: { [key: string]: string } = {
  'Fresh Juices': '🍹', 'Mojitos': '🍸', 'Hot Beverages': '☕', 'Fruit Milkshakes': '🥤',
  'Thick Shake': '🧋', 'Sodas': '🫧', 'Coffee Shake': '☕', 'Special Shakes': '🧋',
  'Ice Cream Shakes': '🍦', 'Lassi': '🥛', 'Delights': '🍮', 'Club Sandwich': '🥪',
  'Strips': '🍗', 'Sandwiches': '🥪', 'Egg Bites': '🍳', 'Loaded Fries': '🍟',
  'Rolls': '🌯', 'Burgers': '🍔', 'Buns': '🍞', 'Wraps': '🌯',
  'Quick Bites': '🍟', 'Maggies': '🍜',
}

const ITEM_IMAGES: { [key: string]: string } = {
  // Fresh Juices
  'Lemon':                        'https://loremflickr.com/200/200/lemon,juice?lock=1',
  'Lemon Mint':                   'https://loremflickr.com/200/200/lemon,mint,juice?lock=2',
  'Moroccan Lime':                'https://loremflickr.com/200/200/lime,juice,drink?lock=3',
  'Grape Lemon':                  'https://loremflickr.com/200/200/grape,juice?lock=4',
  'Musambi':                      'https://loremflickr.com/200/200/sweet,lime,juice?lock=5',
  'Orange':                       'https://loremflickr.com/200/200/orange,juice?lock=6',
  'Watermelon':                   'https://loremflickr.com/200/200/watermelon,juice?lock=7',
  'Muskmelon':                    'https://loremflickr.com/200/200/melon,juice?lock=8',
  'Pappaya':                      'https://loremflickr.com/200/200/papaya,juice?lock=9',
  'Pineapple':                    'https://loremflickr.com/200/200/pineapple,juice?lock=10',
  'Grape':                        'https://loremflickr.com/200/200/grape,juice,purple?lock=11',
  'Kokum':                        'https://loremflickr.com/200/200/kokum,drink?lock=12',
  'Mango':                        'https://loremflickr.com/200/200/mango,juice?lock=13',
  'Pomegranate':                  'https://loremflickr.com/200/200/pomegranate,juice?lock=14',
  // Mojitos
  'Virgin Mojito':                'https://loremflickr.com/200/200/mojito,drink?lock=15',
  'Blue Ocean':                   'https://loremflickr.com/200/200/blue,cocktail,drink?lock=16',
  'Kiwi Cooler':                  'https://loremflickr.com/200/200/kiwi,drink,green?lock=17',
  'Greenade':                     'https://loremflickr.com/200/200/green,lemonade,drink?lock=18',
  'Black Current Night':          'https://loremflickr.com/200/200/blackcurrant,drink?lock=19',
  'Melody Melon':                 'https://loremflickr.com/200/200/watermelon,mojito?lock=20',
  'Blueberry Martini':            'https://loremflickr.com/200/200/blueberry,drink?lock=21',
  // Hot Beverages
  'Coffee':                       'https://loremflickr.com/200/200/coffee,hot?lock=22',
  'Boost':                        'https://loremflickr.com/200/200/chocolate,milk,drink?lock=23',
  'Horlicks':                     'https://loremflickr.com/200/200/malt,milk,drink?lock=24',
  // Fruit Milkshakes
  'Apple Milkshake':              'https://loremflickr.com/200/200/apple,milkshake?lock=25',
  'Muskmelon Milkshake':          'https://loremflickr.com/200/200/melon,milkshake?lock=26',
  'Pappaya Milkshake':            'https://loremflickr.com/200/200/papaya,milkshake?lock=27',
  'Banana Milkshake':             'https://loremflickr.com/200/200/banana,milkshake?lock=28',
  'Mango Milkshake':              'https://loremflickr.com/200/200/mango,milkshake?lock=29',
  'Pomegranate Milkshake':        'https://loremflickr.com/200/200/pomegranate,milkshake?lock=30',
  'Avocado Milkshake':            'https://loremflickr.com/200/200/avocado,smoothie?lock=31',
  'Cocktail Milkshake':           'https://loremflickr.com/200/200/fruit,milkshake?lock=32',
  // Thick Shakes
  'Horlicks Thick Shake':         'https://loremflickr.com/200/200/thick,milkshake?lock=33',
  'Boost Thick Shake':            'https://loremflickr.com/200/200/chocolate,milkshake?lock=34',
  'Badam Thick Shake':            'https://loremflickr.com/200/200/almond,milkshake?lock=35',
  'Black Current Thick Shake':    'https://loremflickr.com/200/200/blackcurrant,milkshake?lock=36',
  'Green Apple Thick Shake':      'https://loremflickr.com/200/200/apple,green,milkshake?lock=37',
  'Pista Thick Shake':            'https://loremflickr.com/200/200/pistachio,milkshake?lock=38',
  'Litchi Thick Shake':           'https://loremflickr.com/200/200/lychee,milkshake?lock=39',
  'Oreo Thick Shake':             'https://loremflickr.com/200/200/oreo,milkshake?lock=40',
  'Crunchy Oreo Thick Shake':     'https://loremflickr.com/200/200/oreo,cookie,shake?lock=41',
  'Rose Milk Thick Shake':        'https://loremflickr.com/200/200/rose,milk,shake?lock=42',
  'Dates Thick Shake':            'https://loremflickr.com/200/200/dates,milkshake?lock=43',
  'Blueberry Thick Shake':        'https://loremflickr.com/200/200/blueberry,milkshake?lock=44',
  'Fig Thick Shake':              'https://loremflickr.com/200/200/fig,milkshake?lock=45',
  'Sharjah Thick Shake':          'https://loremflickr.com/200/200/thick,creamy,shake?lock=46',
  'Tender Coconut Thick Shake':   'https://loremflickr.com/200/200/coconut,milkshake?lock=47',
  'Snickers Thick Shake':         'https://loremflickr.com/200/200/snickers,milkshake?lock=48',
  'Kitkat Thick Shake':           'https://loremflickr.com/200/200/kitkat,chocolate,shake?lock=49',
  'Jack Fruit Thick Shake':       'https://loremflickr.com/200/200/jackfruit,milkshake?lock=50',
  'Cashew Thick Shake':           'https://loremflickr.com/200/200/cashew,milkshake?lock=51',
  'Chocolate Sharjah Thick Shake':'https://loremflickr.com/200/200/chocolate,thick,shake?lock=52',
  'Dry Fruit Mix Thick Shake':    'https://loremflickr.com/200/200/dryfruit,milkshake?lock=53',
  'Biscoff Thick Shake':          'https://loremflickr.com/200/200/biscuit,caramel,shake?lock=54',
  // Sodas
  'Lemon Soda':                   'https://loremflickr.com/200/200/lemon,soda?lock=55',
  'Masala Soda':                  'https://loremflickr.com/200/200/masala,soda,drink?lock=56',
  'Mint Soda':                    'https://loremflickr.com/200/200/mint,soda,drink?lock=57',
  'Blue Lemonade':                'https://loremflickr.com/200/200/blue,lemonade?lock=58',
  'Ginger Lemonade':              'https://loremflickr.com/200/200/ginger,lemonade?lock=59',
  'Peach Ice':                    'https://loremflickr.com/200/200/peach,iced,drink?lock=60',
  'Jeera Masala':                 'https://loremflickr.com/200/200/cumin,soda,drink?lock=61',
  'Hannari':                      'https://loremflickr.com/200/200/sparkling,drink?lock=62',
  // Coffee Shake
  'Frappuccino':                  'https://loremflickr.com/200/200/frappuccino,coffee?lock=63',
  'Cold Coffee':                  'https://loremflickr.com/200/200/cold,coffee,iced?lock=64',
  'Chocolate Coffee':             'https://loremflickr.com/200/200/mocha,chocolate,coffee?lock=65',
  // Special Shakes
  'Abood':                        'https://loremflickr.com/200/200/special,milkshake?lock=66',
  'Sharjah Special':              'https://loremflickr.com/200/200/special,cream,shake?lock=67',
  'Mango Choco Chip':             'https://loremflickr.com/200/200/mango,chocolate,shake?lock=68',
  'Cocktail Ajel':                'https://loremflickr.com/200/200/mixed,fruit,shake?lock=69',
  'Alphonsa Smoothie':            'https://loremflickr.com/200/200/alphonso,mango,smoothie?lock=70',
  'LETHAFI Madness':              'https://loremflickr.com/200/200/special,loaded,shake?lock=71',
  'Tender Mango':                 'https://loremflickr.com/200/200/tender,mango,drink?lock=72',
  'Tender Chikoo':                'https://loremflickr.com/200/200/sapota,chikoo,shake?lock=73',
  'Chocolate Sharjah Special':    'https://loremflickr.com/200/200/chocolate,special,shake?lock=74',
  'Tender Avocado':               'https://loremflickr.com/200/200/avocado,shake,green?lock=75',
  // Ice Cream Shakes
  'Vanilla Ice Cream Shake':      'https://loremflickr.com/200/200/vanilla,icecream,shake?lock=76',
  'Chocolate Ice Cream Shake':    'https://loremflickr.com/200/200/chocolate,icecream,shake?lock=77',
  'Butterscotch Ice Cream Shake': 'https://loremflickr.com/200/200/butterscotch,icecream?lock=78',
  'Strawberry Ice Cream Shake':   'https://loremflickr.com/200/200/strawberry,icecream,shake?lock=79',
  'Pistachios Ice Cream Shake':   'https://loremflickr.com/200/200/pistachio,icecream?lock=80',
  'Mango Ice Cream Shake':        'https://loremflickr.com/200/200/mango,icecream,shake?lock=81',
  // Lassi
  'Sweet Lassi':                  'https://loremflickr.com/200/200/lassi,yogurt,drink?lock=82',
  'Chocolate Lassi':              'https://loremflickr.com/200/200/chocolate,lassi?lock=83',
  'Strawberry Lassi':             'https://loremflickr.com/200/200/strawberry,lassi?lock=84',
  'Fruit Lassi':                  'https://loremflickr.com/200/200/fruit,lassi,yogurt?lock=85',
  'Mango Lassi':                  'https://loremflickr.com/200/200/mango,lassi?lock=86',
  'Dry Fruit Lassi':              'https://loremflickr.com/200/200/dryfruit,lassi?lock=87',
  // Delights
  'Fruit Salad':                  'https://loremflickr.com/200/200/fruit,salad?lock=88',
  'Gud Bud':                      'https://loremflickr.com/200/200/ice,cream,dessert?lock=89',
  'Royal Falooda':                'https://loremflickr.com/200/200/falooda,dessert?lock=90',
  'Dry Fruit Queen':              'https://loremflickr.com/200/200/dryfruit,dessert?lock=91',
  'Death By Chocolate':           'https://loremflickr.com/200/200/chocolate,cake,dessert?lock=92',
  // Club Sandwich
  'Veg Club Sandwich':            'https://loremflickr.com/200/200/club,sandwich,vegetable?lock=93',
  'Egg Club Sandwich':            'https://loremflickr.com/200/200/egg,sandwich?lock=94',
  'Chicken Club Sandwich':        'https://loremflickr.com/200/200/chicken,club,sandwich?lock=95',
  'Fillet Club Sandwich':         'https://loremflickr.com/200/200/fish,fillet,sandwich?lock=96',
  // Strips
  'Chicken Strips':               'https://loremflickr.com/200/200/chicken,strips,fried?lock=97',
  'Creamy Strips':                'https://loremflickr.com/200/200/chicken,creamy,strips?lock=98',
  // Sandwiches
  'Classic Veg Sandwich':         'https://loremflickr.com/200/200/vegetable,sandwich?lock=99',
  'Grilled Mayo Cheese Sandwich': 'https://loremflickr.com/200/200/grilled,cheese,sandwich?lock=100',
  'Egg Sandwich':                 'https://loremflickr.com/200/200/egg,sandwich?lock=101',
  'Sweet Corn Cheese Sandwich':   'https://loremflickr.com/200/200/corn,cheese,sandwich?lock=102',
  'Lays Cheese Sandwich':         'https://loremflickr.com/200/200/chips,cheese,sandwich?lock=103',
  'Chocolate Cheese Sandwich':    'https://loremflickr.com/200/200/chocolate,sandwich?lock=104',
  'Paneer Sandwich':              'https://loremflickr.com/200/200/paneer,sandwich?lock=105',
  'Chicken Fillet Sandwich':      'https://loremflickr.com/200/200/chicken,fillet,sandwich?lock=106',
  'Chicken Sandwich':             'https://loremflickr.com/200/200/chicken,sandwich?lock=107',
  // Egg Bites
  'Bun Omlet':                    'https://loremflickr.com/200/200/egg,bun,omelet?lock=108',
  'Bread Omlet':                  'https://loremflickr.com/200/200/bread,omelet,egg?lock=109',
  'Egg Bites':                    'https://loremflickr.com/200/200/egg,bites,snack?lock=110',
  // Loaded Fries
  'Classic Loaded Fries':         'https://loremflickr.com/200/200/loaded,fries?lock=111',
  'Cheesy Loaded Fries':          'https://loremflickr.com/200/200/cheese,fries,loaded?lock=112',
  // Rolls
  'Egg Roll':                     'https://loremflickr.com/200/200/egg,roll,wrap?lock=113',
  'Veg Roll':                     'https://loremflickr.com/200/200/vegetable,roll,wrap?lock=114',
  'Paneer Roll':                  'https://loremflickr.com/200/200/paneer,roll?lock=115',
  'Egg with Chicken Roll':        'https://loremflickr.com/200/200/chicken,egg,roll?lock=116',
  // Burgers
  'Classic Veg Burger':           'https://loremflickr.com/200/200/veggie,burger?lock=117',
  'Egg Burger':                   'https://loremflickr.com/200/200/egg,burger?lock=118',
  'Paneer Burger':                'https://loremflickr.com/200/200/paneer,burger?lock=119',
  'Veg Nuggets Burger':           'https://loremflickr.com/200/200/nuggets,burger?lock=120',
  'Classic Chicken Burger':       'https://loremflickr.com/200/200/chicken,burger?lock=121',
  'Crunchy Chicken Burger':       'https://loremflickr.com/200/200/crispy,chicken,burger?lock=122',
  'Chicken Cheese Burger':        'https://loremflickr.com/200/200/chicken,cheese,burger?lock=123',
  'Chicken with Egg Burger':      'https://loremflickr.com/200/200/chicken,egg,burger?lock=124',
  'Zinger Chicken Burger':        'https://loremflickr.com/200/200/zinger,burger?lock=125',
  'Zinger Stacker':               'https://loremflickr.com/200/200/double,burger,stacked?lock=126',
  // Buns
  'Mayo Bun':                     'https://loremflickr.com/200/200/bun,mayonnaise?lock=127',
  'Lays Bun':                     'https://loremflickr.com/200/200/chips,bun,snack?lock=128',
  // Wraps
  'Veggies Wrap':                 'https://loremflickr.com/200/200/vegetable,wrap?lock=129',
  'Crispy Chicken Wrap':          'https://loremflickr.com/200/200/crispy,chicken,wrap?lock=130',
  'Green Grill Wrap':             'https://loremflickr.com/200/200/grilled,wrap,green?lock=131',
  'Fillet Wrap':                  'https://loremflickr.com/200/200/fillet,wrap?lock=132',
  'Tandoori Wrap':                'https://loremflickr.com/200/200/tandoori,wrap?lock=133',
  'Lethafi Wrap':                 'https://loremflickr.com/200/200/special,wrap?lock=134',
  // Quick Bites
  'French Fries':                 'https://loremflickr.com/200/200/french,fries?lock=135',
  'Peri Peri Fries':              'https://loremflickr.com/200/200/peri,peri,fries?lock=136',
  'Veg Nuggets':                  'https://loremflickr.com/200/200/vegetable,nuggets?lock=137',
  'Chicken Nuggets':              'https://loremflickr.com/200/200/chicken,nuggets?lock=138',
  'Finger Chicken':               'https://loremflickr.com/200/200/chicken,fingers,fried?lock=139',
  'Onion Rings':                  'https://loremflickr.com/200/200/onion,rings?lock=140',
  // Maggies
  'Masala Maggie':                'https://loremflickr.com/200/200/masala,noodles?lock=141',
  'Sweet Corn Maggie':            'https://loremflickr.com/200/200/corn,noodles?lock=142',
  'Egg Maggie':                   'https://loremflickr.com/200/200/egg,noodles?lock=143',
  'Chicken Maggie':               'https://loremflickr.com/200/200/chicken,noodles?lock=144',
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
  'Fresh Juices': 'https://images.unsplash.com/photo-1622597468739-9b66fac1c1a2?w=600&h=400&fit=crop',
  'Mojitos': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=400&fit=crop',
  'Hot Beverages': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  'Fruit Milkshakes': 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&h=400&fit=crop',
  'Thick Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop',
  'Sodas': 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600&h=400&fit=crop',
  'Coffee Shake': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop',
  'Special Shakes': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  'Ice Cream Shakes': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68a?w=600&h=400&fit=crop',
  'Lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=600&h=400&fit=crop',
  'Delights': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop',
  'Club Sandwich': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Strips': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=400&fit=crop',
  'Sandwiches': 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&h=400&fit=crop',
  'Egg Bites': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
  'Loaded Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Rolls': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'Burgers': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
  'Buns': 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&h=400&fit=crop',
  'Wraps': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'Quick Bites': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=400&fit=crop',
  'Maggies': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
}

export default function CafeteriaPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slugOrId = params.cafeteriaId as string

  // State for slug-to-ID conversion
  const [cafeteriaId, setCafeteriaId] = useState<string>('')

  // Core state
  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'menu')
  const [orderId, setOrderId] = useState<string>('')

  // Convert slug to ID if needed
  useEffect(() => {
    const convertSlugToId = async () => {
      // Check if it's already a UUID (contains dashes and is 36 chars)
      if (slugOrId.includes('-') && slugOrId.length === 36) {
        setCafeteriaId(slugOrId)
        return
      }

      // It's a slug, fetch all cafeterias and find matching ID
      try {
        const { data } = await supabase.from('cafeterias').select('id, name')
        if (data) {
          const matching = data.find(c => generateSlug(c.name) === slugOrId)
          if (matching) {
            setCafeteriaId(matching.id)
          } else {
            console.error('Cafeteria not found for slug:', slugOrId)
            router.push('/mobile')
          }
        }
      } catch (error) {
        console.error('Error converting slug to ID:', error)
        router.push('/mobile')
      }
    }

    convertSlugToId()
  }, [slugOrId, router])

  // Tab navigation
  const [activeTab, setActiveTab] = useState<Tab>('home')

  // Orders
  const [cafeOrders, setCafeOrders] = useState<Order[]>([])

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

  // Fetch cafeteria & menu
  useEffect(() => {
    const fetch = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 60000)
        )
        const [cafRes, menuRes] = await Promise.race([
          Promise.all([
            supabase.from('cafeterias').select('*').eq('id', cafeteriaId).single(),
            supabase.from('cafeteria_menu').select('*').eq('cafeteria_id', cafeteriaId).eq('is_available', true),
          ]),
          timeoutPromise
        ]) as any
        if (cafRes.data) setCafeteria(cafRes.data as Cafeteria)
        if (menuRes.data) {
          setMenuItems(menuRes.data as MenuItem[])
          const cats = [...new Set((menuRes.data as MenuItem[]).map(m => m.category))]
          if (cats.length > 0) setSelectedCategory(cats[0])
        }
      } catch (error) {
        console.error('Cafeteria/menu fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [cafeteriaId])

  // Fetch user's orders from this cafe with real-time subscription
  useEffect(() => {
    const fetch = async () => {
      if (!user?.phone) return
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('cafeteria_id', cafeteriaId)
          .eq('student_phone', user.phone)
          .order('created_at', { ascending: false })
        if (data) setCafeOrders(data as Order[])
      } catch (error) {
        console.error('Cafe orders fetch error:', error)
      }
    }
    fetch()

    // Real-time subscription for cafe orders
    const channel = supabase.channel(`cafe-orders-${cafeteriaId}-${user?.phone}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafeteria_id=eq.${cafeteriaId}` }, (payload) => {
        console.log('Cafe order change detected:', payload)
        fetch() // Refetch orders on any change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [cafeteriaId, user?.phone])

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

  const categories = [...new Set(menuItems.map(m => m.category))]
  const cartItem = cart?.cafeteriaId === cafeteriaId ? cart.items : []
  const itemInCart = (menuId: string) => cartItem.find(i => i.menuId === menuId)

  const categoryDisplayMap: { [key: string]: string } = { 'Juice': 'Juice @59' }
  const displayCategory = (cat: string) => categoryDisplayMap[cat] || cat

  const handleAddItem = (item: MenuItem) => {
    addItem(cafeteriaId, { menuId: item.id, name: item.name, price: item.price, quantity: 1 })
  }

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !cartItem.length) {
      alert('Please fill in name and phone, and add items to cart')
      return
    }
    setIsPlacingOrder(true)
    try {
      // Add 10-second timeout to prevent infinite loading
      const orderPromise = supabase
        .from('orders')
        .insert([{ cafeteria_id: cafeteriaId, student_name: formData.name, student_phone: formData.phone, student_email: formData.email, items: cartItem, total_amount: total, queue_position: 0, status: 'pending', payment_status: 'unpaid', notes: formData.notes }])
        .select()
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Order creation timeout')), 10000)
      )

      const { data, error } = await Promise.race([orderPromise, timeoutPromise]) as any

      if (error) {
        console.error('Order creation error:', error)
        alert('Failed to create order: ' + (error.message || 'Unknown error'))
        setIsPlacingOrder(false)
        return
      }

      if (data) {
        console.log('Order created successfully:', data.id)
        setOrderId(data.id)
        updateUser({ name: formData.name, phone: formData.phone, email: formData.email })
        setIsPlacingOrder(false)
        setStep('payment')
      } else {
        alert('Failed to create order')
        setIsPlacingOrder(false)
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to create order'))
      setIsPlacingOrder(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    // Find the order to check its status
    const order = cafeOrders.find(o => o.id === orderId)

    // Only allow deletion for pending and cancelled orders
    if (order && order.status !== 'pending' && order.status !== 'cancelled') {
      alert(`Cannot delete ${order.status} orders. Vendor has already ${order.status === 'approved' ? 'accepted' : 'started preparing'} your order.`)
      return
    }

    if (!confirm('Delete this order?')) return
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId)
      if (error) {
        console.error('Delete error:', error)
        alert('Failed to delete order: ' + error.message)
      } else {
        // Immediately update UI
        setCafeOrders(prev => prev.filter(o => o.id !== orderId))
        alert('Order deleted successfully')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Payment modal handler
  function handleOpenUPI() {
    const paymentUrl = `/payment?orderId=${orderId}&amount=${total}&name=${encodeURIComponent(formData.name)}`
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
    setConfirmedTotal(total)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status, payment_status, token_number, items, total_amount').eq('id', orderId).single()
      if (data?.status === 'paid' || data?.payment_status === 'paid') {
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

  const fetchTokenData = async () => {
    const { data } = await supabase.from('orders').select('token_number, items, total_amount').eq('id', orderId).single()
    if (data) {
      setTokenData({ token: data.token_number ?? 0, items: data.items as Array<{ name: string; quantity: number }>, total: data.total_amount, id: orderId })
      setShowTicket(true)
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
    const inCart = itemInCart(item.id)
    const fav = isFavourite(item.id)
    const catImg = item.image_url || ITEM_IMAGES[item.name] || CATEGORY_IMAGES[item.category] || null
    return (
      <div key={item.id} className="menu-item-card">
        {catImg
          ? <img src={catImg} alt={item.name} className="menu-item-thumb" onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; const fb = document.createElement('div'); fb.className = 'menu-item-thumb-emoji'; fb.textContent = CATEGORY_EMOJI[item.category] ?? '🍽️'; el.parentNode?.insertBefore(fb, el); }} />
          : <div className="menu-item-thumb-emoji">{CATEGORY_EMOJI[item.category] ?? '🍽️'}</div>}
        <div className="menu-item-info">
          <div className="menu-item-name-sw">{item.name}</div>
          {item.description && <div className="menu-item-desc">{item.description}</div>}
          <div className="menu-item-price-sw">₹{item.price}</div>
        </div>
        <div className="menu-item-actions">
          {inCart ? (
            <div className="qty-box">
              <button className="qty-btn" onClick={() => updateQuantity(item.id, inCart.quantity - 1)}>−</button>
              <span className="qty-num">{inCart.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.id, inCart.quantity + 1)}>+</button>
            </div>
          ) : (
            <button className="add-btn-sw" onClick={() => handleAddItem(item)}>
              <Plus size={14} /> ADD
            </button>
          )}
          <button onClick={() => toggleFavourite({ menuId: item.id, name: item.name, description: item.description, price: item.price, category: item.category, cafeteriaId, cafeteriaName: cafeteria?.name ?? '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <Heart size={15} fill={fav ? '#E8334A' : 'transparent'} color={fav ? '#E8334A' : '#ccc'} />
          </button>
        </div>
      </div>
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

  if (!cafeteria) {
    return <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: '40px' }}>Restaurant not found</div>
  }

  // RENDER BY TAB
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* HOME TAB - MENU */}
      {activeTab === 'home' && step === 'menu' && (
        <div>
          <style>{`
            .menu-sticky-top { position: sticky; top: 0; z-index: 50; background: white; }
            .menu-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(26,31,46,0.07); }
            .menu-search-bar { display: flex; align-items: center; gap: 10px; background: #f5f5f7; border-radius: 12px; padding: 10px 14px; margin: 10px 16px 0; }
            .menu-search-bar input { background: none; border: none; outline: none; font-size: 14px; color: var(--text); flex: 1; }
            .cat-pills { display: flex; gap: 8px; overflow-x: auto; padding: 10px 16px 12px; scrollbar-width: none; }
            .cat-pills::-webkit-scrollbar { display: none; }
            .cat-pill { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; flex-shrink: 0; }
            .cat-pill-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 2px solid transparent; transition: all 0.18s; }
            .cat-pill-icon.active { border-color: var(--accent); background: #fff0f2; }
            .cat-pill-icon.inactive { background: #f5f5f7; }
            .cat-pill-label { font-size: 11px; font-weight: 600; color: var(--text2); max-width: 64px; text-align: center; line-height: 1.2; }
            .cat-pill-label.active { color: var(--accent); }
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
            @keyframes slideUpMobile { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          `}</style>

          {/* Sticky top: header + search + category pills */}
          <div className="menu-sticky-top">
            <div className="menu-header">
              <button onClick={() => { window.location.href = '/browse' }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <ChevronLeft size={24} color='var(--text)' />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>{cafeteria.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{cafeteria.location}</div>
              </div>
              <div style={{ fontSize: 26 }}>{cafeteria.image_emoji}</div>
            </div>

            {/* Search */}
            <div className="menu-search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                placeholder="Search food or drink..."
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
              />
              {menuSearch && (
                <button onClick={() => setMenuSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: 0 }}>✕</button>
              )}
            </div>

            {/* Category pills */}
            {!menuSearch && (
              <div className="cat-pills">
                {categories.map(cat => {
                  const emoji = (() => {
                    const c = cat.toLowerCase()
                    if (c.includes('juice') || c.includes('fresh')) return '🍹'
                    if (c.includes('mojito')) return '🍃'
                    if (c.includes('hot') || c.includes('coffee') || c.includes('tea')) return '☕'
                    if (c.includes('milkshake') || c.includes('thick shake') || c.includes('ice cream shake')) return '🥛'
                    if (c.includes('shake') || c.includes('special shake')) return '🧋'
                    if (c.includes('soda')) return '🥤'
                    if (c.includes('lassi')) return '🪣'
                    if (c.includes('burger')) return '🍔'
                    if (c.includes('roll') || c.includes('wrap')) return '🌯'
                    if (c.includes('sandwich') || c.includes('club')) return '🥪'
                    if (c.includes('fries') || c.includes('loaded')) return '🍟'
                    if (c.includes('egg')) return '🍳'
                    if (c.includes('strip')) return '🍗'
                    if (c.includes('bun')) return '🍞'
                    if (c.includes('maggi')) return '🍜'
                    if (c.includes('delight')) return '✨'
                    if (c.includes('quick') || c.includes('snack') || c.includes('bite')) return '⚡'
                    if (c.includes('biryani')) return '🍚'
                    if (c.includes('combo')) return '🎁'
                    if (c.includes('momos')) return '🥟'
                    if (c.includes('drink')) return '🧃'
                    return '🍽️'
                  })()
                  const isActive = selectedCategory === cat
                  return (
                    <button key={cat} className="cat-pill" onClick={() => setSelectedCategory(cat)} style={{ background: 'none', border: 'none', padding: 0 }}>
                      <div className={`cat-pill-icon ${isActive ? 'active' : 'inactive'}`}>{emoji}</div>
                      <span className={`cat-pill-label ${isActive ? 'active' : ''}`}>{cat}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Items list */}
          <div style={{ paddingBottom: 180 }}>
            {menuSearch ? (
              // Search results across all categories
              (() => {
                const q = menuSearch.toLowerCase()
                const results = menuItems.filter(m => m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
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
                const catItems = menuItems.filter(m => m.category === selectedCategory)
                const catImg = CATEGORY_IMAGES[selectedCategory] || null
                return (
                  <>
                    {/* Category hero image */}
                    {catImg && (
                      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                        <img src={catImg} alt={selectedCategory} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                        <div style={{ position: 'absolute', bottom: 14, left: 16, color: 'white', fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{selectedCategory}</div>
                        <div style={{ position: 'absolute', bottom: 14, right: 16, color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{catItems.length} items</div>
                      </div>
                    )}
                    <div className="menu-section-title" style={{ paddingTop: catImg ? 12 : 20 }}>{catImg ? '' : selectedCategory} {!catImg && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>• {catItems.length} items</span>}</div>
                    {catItems.map(item => renderMenuCard(item))}
                  </>
                )
              })()
            )}
          </div>

          {/* Cart Sheet */}
          {showCartSheet && (
            <>
              <div onClick={() => setShowCartSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 299 }} />
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px 36px', maxHeight: '72vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', animation: 'slideUpMobile 0.3s ease' }}>
                <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 18px' }} />
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Your Cart 🛒</div>
                {cartItem.map(item => (
                  <div key={item.menuId} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(26,31,46,0.06)' }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', minWidth: 42, textAlign: 'right' }}>₹{item.price * item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #ddd', background: '#f5f5f5', fontSize: 16, cursor: 'pointer' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 16, cursor: 'pointer' }}>+</button>
                      <button onClick={() => removeItem(item.menuId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '0 2px' }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 16px', fontWeight: 700, fontSize: 17 }}>
                  <span>Total</span><span style={{ color: 'var(--accent)' }}>₹{total}</span>
                </div>
                <button onClick={() => { setShowCartSheet(false); setStep('details') }} style={{ width: '100%', padding: 16, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Proceed to Checkout →
                </button>
              </div>
            </>
          )}

          {/* Floating Cart FAB */}
          {itemCount > 0 && (
            <button onClick={() => setShowCartSheet(true)} style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 200, background: 'linear-gradient(135deg,#E8334A,#c0202e)', color: 'white', border: 'none', borderRadius: 50, padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 6px 24px rgba(232,51,74,0.5)', fontFamily: 'var(--font-body)' }}>
              <div style={{ position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span style={{ position: 'absolute', top: -8, right: -8, background: 'white', color: '#E8334A', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{itemCount}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>₹{total}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>View Cart →</span>
            </button>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(26,31,46,0.08)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Your Orders from {cafeteria.name}</div>
          </div>
          <div style={{ padding: '16px' }}>
            {cafeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No orders yet. Start flexing! 💅</div>
            ) : (
              cafeOrders.map(order => (
                <div key={order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>₹{order.total_amount}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 11, background: order.status === 'collected' ? '#edfaf3' : '#fff8ec', color: order.status === 'collected' ? '#2e9e6b' : '#d4821a', padding: '4px 8px', borderRadius: 4 }}>
                        {order.status}
                      </div>
                      {(order.status === 'pending' || order.status === 'cancelled') && (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{ padding: '6px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
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
            {cartItem.map(item => {
              const menuItem = menuItems.find(m => m.id === item.menuId)
              return (
                <div key={item.menuId} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                    🍱
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>₹{item.price}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                        style={{ width: 24, height: 24, borderRadius: 4, background: '#ccc', color: '#333', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                      >
                        −
                      </button>
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 12 }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                        style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₹{item.price * item.quantity}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>₹{total}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!formData.name || !formData.phone || isPlacingOrder}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: !formData.name || !formData.phone || isPlacingOrder ? 'not-allowed' : 'pointer', opacity: !formData.name || !formData.phone || isPlacingOrder ? 0.6 : 1 }}
          >
            {isPlacingOrder ? '⏳ Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      )}

      {step === 'payment' && paymentState === 'idle' && (
        <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>💳</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Complete Payment</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>Amount: ₹{total}</div>
          <button
            onClick={handleOpenUPI}
            style={{ width: '100%', padding: '14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Pay Now
          </button>
        </div>
      )}

      {step === 'confirmation' && showTicket && tokenData && (
        <div style={{ padding: 'var(--mobile-spacing)', textAlign: 'center', paddingTop: 20 }}>
          <TokenTicket token={tokenData.token} items={tokenData.items} total={tokenData.total} orderId={tokenData.id} cafeteriaName={cafeteria.name} onClose={() => setShowTicket(false)} />
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 70, background: 'white', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
        <button
          onClick={() => { window.location.href = '/browse' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}
        >
          <Home size={22} /> Home
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'orders' ? 'var(--accent)' : 'var(--muted)', fontSize: 11, fontWeight: 600 }}
        >
          <ShoppingBag size={22} /> Orders
        </button>
      </div>
    </div>
  )
}
