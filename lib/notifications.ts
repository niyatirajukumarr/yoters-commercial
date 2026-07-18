import { supabase } from './supabase'
import { Notification } from './types'
import { logger } from './logger'
import { MANAGER_RECIPIENT_ID } from './config'
import { normalizePhone, isValidPhone } from './validation'

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
      logger.error('Error creating notification:', error)
      return null
    }

    return data as Notification
  } catch (err) {
    logger.error('Notification error:', err)
    return null
  }
}

/**
 * Send an SMS via Twilio. Runs server-side only (reads credentials from env).
 * Returns real success/failure so callers can react instead of silently
 * assuming delivery. If Twilio is not configured, returns false rather than a
 * misleading `true`.
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    logger.error('[SMS] Twilio not configured (missing TWILIO_* env vars); SMS not sent')
    return false
  }

  if (!isValidPhone(phoneNumber)) {
    logger.error('[SMS] Refusing to send to invalid phone number')
    return false
  }

  try {
    // Import lazily so the client bundle never pulls in the Twilio SDK.
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      to: normalizePhone(phoneNumber),
      from: fromNumber,
      body: message,
    })
    // Log only a non-PII identifier, never the number or message body.
    logger.debug('[SMS] Sent', { sid: result.sid })
    return true
  } catch (err) {
    logger.error('[SMS] Send failed:', err)
    return false
  }
}

// Persist the in-app notification and attempt an SMS, recording the real
// delivery outcome on the notification row so failures are visible instead of
// masked by an always-true return.
async function notifyStudent(
  studentPhone: string,
  orderId: string,
  type: string,
  message: string
): Promise<boolean> {
  const notif = await sendNotification('student', studentPhone, orderId, type, message)
  const smsOk = await sendSMS(studentPhone, message)
  if (notif && notif.id) {
    await supabase
      .from('notifications')
      .update({ sms_sent: smsOk })
      .eq('id', notif.id)
  }
  return smsOk
}

export async function notifyStudentOrderApproved(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string
): Promise<boolean> {
  const message = `✅ Your order at ${cafeteriaName} has been approved! We're preparing it now.`
  return notifyStudent(studentPhone, orderId, 'approved', message)
}

export async function notifyStudentOrderDenied(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string,
  denialReason: string
): Promise<boolean> {
  const message = `❌ Your order at ${cafeteriaName} has been denied. Reason: ${denialReason}`
  return notifyStudent(studentPhone, orderId, 'denied', message)
}

export async function notifyStudentOrderReady(
  studentPhone: string,
  orderId: string,
  cafeteriaName: string
): Promise<boolean> {
  const message = `🎉 Your order at ${cafeteriaName} is ready! Please come collect it.`
  return notifyStudent(studentPhone, orderId, 'ready', message)
}

export async function notifyManagerVendorDenied(
  orderId: string,
  vendorName: string,
  denialReason: string
): Promise<void> {
  const message = `⚠️ Vendor ${vendorName} denied order. Reason: ${denialReason}`

  await sendNotification('manager', MANAGER_RECIPIENT_ID, orderId, 'vendor_denied', message)
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  } catch (err) {
    logger.error('Error marking notification as read:', err)
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
      logger.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    logger.error('Error:', err)
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
      logger.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    logger.error('Error:', err)
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
      logger.error('Error fetching notifications:', error)
      return []
    }

    return data as Notification[]
  } catch (err) {
    logger.error('Error:', err)
    return []
  }
}
