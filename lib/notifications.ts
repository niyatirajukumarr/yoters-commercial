import { supabase } from './supabase'
import { Notification } from './types'

export async function sendNotification(
  recipientType: 'student' | 'vendor' | 'manager',
  recipientId: string,
  orderId: string | undefined,
  notificationType: string,
  message: string
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          recipient_type: recipientType,
          recipient_id: recipientId,
          order_id: orderId || null,
          notification_type: notificationType,
          message,
          sms_sent: false,
          read: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return data as Notification
  } catch (err) {
    console.error('Notification error:', err)
    return null
  }
}

export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // This will be implemented when SMS service is set up (Twilio, AWS SNS, etc.)
    // For now, just log it
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`)
    return true
  } catch (err) {
    console.error('SMS error:', err)
    return false
  }
}

export async function notifyStudentOrderApproved(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string
): Promise<void> {
  const message = `✅ Your order at ${cafeteriaName} has been approved! We're preparing it now.`

  await sendNotification('student', studentPhone, orderId, 'approved', message)
  await sendSMS(studentPhone, message)
}

export async function notifyStudentOrderDenied(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string,
  denialReason: string
): Promise<void> {
  const message = `❌ Your order at ${cafeteriaName} has been denied. Reason: ${denialReason}`

  await sendNotification('student', studentPhone, orderId, 'denied', message)
  await sendSMS(studentPhone, message)
}

export async function notifyStudentOrderReady(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string
): Promise<void> {
  const message = `🎉 Your order at ${cafeteriaName} is ready! Please come collect it.`

  await sendNotification('student', studentPhone, orderId, 'ready', message)
  await sendSMS(studentPhone, message)
}

export async function notifyManagerVendorDenied(
  orderId: string,
  vendorName: string,
  denialReason: string
): Promise<void> {
  const message = `⚠️ Vendor ${vendorName} denied order. Reason: ${denialReason}`

  await sendNotification('manager', 'manager', orderId, 'vendor_denied', message)
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  } catch (err) {
    console.error('Error marking notification as read:', err)
  }
}

export async function getStudentNotifications(studentPhone: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'student')
      .eq('recipient_id', studentPhone)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    console.error('Error:', err)
    return []
  }
}

export async function getVendorNotifications(vendorEmail: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'vendor')
      .eq('recipient_id', vendorEmail)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    console.error('Error:', err)
    return []
  }
}

export async function getManagerNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_type', 'manager')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    console.error('Error:', err)
    return []
  }
}
