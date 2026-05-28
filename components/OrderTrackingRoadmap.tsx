'use client'

import { useEffect, useState } from 'react'
import { Order } from '@/lib/types'
import { supabase } from '@/lib/supabase'

interface OrderTrackingRoadmapProps {
  order: Order
  cafeteriaName?: string
}

export function OrderTrackingRoadmap({ order: initialOrder, cafeteriaName }: OrderTrackingRoadmapProps) {
  const [order, setOrder] = useState<Order>(initialOrder)

  // Real-time subscription to order updates
  useEffect(() => {
    const channel = supabase.channel('order-track-' + initialOrder.id)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${initialOrder.id}`
      }, (payload) => {
        setOrder(payload.new as Order)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialOrder.id])

  // Determine which stages are completed
  const stages = [
    { id: 'placed', label: 'Order Placed', key: 'created_at' as const },
    { id: 'paid', label: 'Payment Confirmed', key: 'payment_status' as const },
    { id: 'approved', label: 'Approved by Vendor', key: 'approved_at' as const },
    { id: 'preparing', label: 'Being Prepared', key: 'status' as const },
    { id: 'ready', label: 'Ready for Pickup', key: 'ready_at' as const },
    { id: 'collected', label: 'Collected', key: 'collected_at' as const },
  ]

  const isStageComplete = (stage: typeof stages[0]): boolean => {
    if (stage.id === 'placed') return !!order.created_at
    if (stage.id === 'paid') return order.payment_status === 'paid'
    if (stage.id === 'approved') return !!order.approved_at
    if (stage.id === 'preparing') return order.status === 'preparing'
    if (stage.id === 'ready') return !!order.ready_at
    if (stage.id === 'collected') return !!order.collected_at
    return false
  }

  return (
    <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
      <style>{`
        .roadmap-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .roadmap-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 15px;
          color: var(--text);
        }
        .roadmap-stages {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .roadmap-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .roadmap-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
          border: 2px solid;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .roadmap-circle.completed {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        .roadmap-circle.pending {
          background: var(--surface2);
          color: var(--muted);
          border-color: var(--border);
        }
        .roadmap-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text);
          line-height: 1.3;
        }
        .roadmap-label.pending {
          color: var(--muted);
        }
        @media (max-width: 768px) {
          .roadmap-stages {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .roadmap-circle {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
          .roadmap-label {
            font-size: 11px;
          }
        }
        @media (max-width: 480px) {
          .roadmap-stages {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .roadmap-stage {
            flex-direction: row;
            align-items: center;
            text-align: left;
            gap: 12px;
          }
          .roadmap-circle {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
        }
      `}</style>

      <div className="roadmap-container">
        <div className="roadmap-title">Order Progress</div>
        <div className="roadmap-stages">
          {stages.map((stage, index) => {
            const isComplete = isStageComplete(stage)
            return (
              <div key={stage.id} className="roadmap-stage">
                <div className={`roadmap-circle ${isComplete ? 'completed' : 'pending'}`}>
                  {isComplete ? '✓' : index + 1}
                </div>
                <div className={`roadmap-label ${!isComplete ? 'pending' : ''}`}>
                  {stage.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
