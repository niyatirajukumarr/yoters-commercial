'use client'

import { useEffect, useState } from 'react'
import { Order } from '@/lib/types'
import { Clock } from 'lucide-react'

interface PrepTimeCountdownProps {
  order: Order
}

export function PrepTimeCountdown({ order }: PrepTimeCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!order.prep_time_minutes || !order.approved_at) {
      setTimeRemaining(null)
      return
    }

    // Calculate time remaining
    const approvedTime = new Date(order.approved_at).getTime()
    const prepEndTime = approvedTime + order.prep_time_minutes * 60 * 1000

    const updateCountdown = () => {
      const now = new Date().getTime()
      const remaining = Math.max(0, prepEndTime - now)

      if (remaining === 0) {
        setIsExpired(true)
        setTimeRemaining(0)
      } else {
        setIsExpired(false)
        setTimeRemaining(remaining)
      }
    }

    // Update immediately
    updateCountdown()

    // Then update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [order.prep_time_minutes, order.approved_at])

  if (timeRemaining === null) {
    return null
  }

  // Convert milliseconds to minutes and seconds
  const totalSeconds = Math.floor(timeRemaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const formatTime = (mins: number, secs: number) => {
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  // Determine color based on time remaining
  let statusColor = 'var(--green)'
  let bgColor = 'rgba(46,158,107,0.1)'
  let statusLabel = '⏱️ Ready soon!'

  if (minutes === 0 && seconds <= 30) {
    statusColor = 'var(--green)'
    bgColor = 'rgba(46,158,107,0.15)'
    statusLabel = '✅ Almost ready!'
  } else if (minutes === 0) {
    statusColor = '#d4821a'
    bgColor = 'rgba(212,130,26,0.1)'
    statusLabel = '⏱️ Final minutes'
  } else if (minutes > 15) {
    statusColor = '#2563eb'
    bgColor = 'rgba(37,99,235,0.1)'
    statusLabel = '📦 Preparing'
  }

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${statusColor}`,
      borderRadius: 'var(--mobile-radius)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    }}>
      <Clock size={16} color={statusColor} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: statusColor, marginTop: 2 }}>
          {isExpired ? 'Ready!' : `${formatTime(minutes, seconds)} remaining`}
        </div>
      </div>
    </div>
  )
}
