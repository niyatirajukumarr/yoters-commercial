export interface Cafeteria {
  id: string
  name: string
  description?: string
  location: string
  image_emoji: string
  image_url?: string
  is_open: boolean
  vendor_email: string
  upi_id?: string
  created_at: string
  queue?: CafeteriaQueue
}

export interface CafeteriaQueue {
  id: string
  cafeteria_id: string
  queue_count: number
  avg_wait_mins: number
  updated_at: string
}

export interface MenuItem {
  id: string
  cafeteria_id: string
  name: string
  description?: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  stock_quantity?: number | null
  max_stock?: number
}

export interface OrderItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  cafeteria_id: string
  student_name: string
  student_phone: string
  student_email?: string
  items: OrderItem[]
  total_amount: number
  queue_position: number
  status: 'pending' | 'paid' | 'approved' | 'preparing' | 'ready' | 'collected' | 'cancelled'
  payment_status: 'unpaid' | 'paid'
  cashfree_order_id?: string
  approved_at?: string
  denied_at?: string
  denial_reason?: string
  notes?: string
  created_at: string
  ready_at?: string
  collected_at?: string
  prep_time_minutes?: number
}

export type WaitLevel = 'low' | 'mid' | 'high'

export function getWaitLevel(mins: number): WaitLevel {
  if (mins <= 10) return 'low'
  if (mins <= 20) return 'mid'
  return 'high'
}

export function formatWait(mins: number): string {
  if (mins === 0) return 'No wait'
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

export interface Notification {
  id: string
  recipient_type: 'student' | 'vendor' | 'manager'
  recipient_id: string
  order_id?: string
  notification_type: string
  message: string
  sms_sent: boolean
  sms_response?: string
  read: boolean
  created_at: string
}

export interface ManagerAuditLog {
  id: string
  manager_email: string
  action: string
  details?: Record<string, any>
  timestamp: string
}