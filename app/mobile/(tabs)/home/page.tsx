'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, CafeteriaQueue } from '@/lib/types'
import { generateSlug } from '@/lib/utils/slug'
import { Clock, Users } from 'lucide-react'

interface CafeteriaWithQueue extends Cafeteria {
  queue: CafeteriaQueue
}

export default function MobileHome() {
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 10000)
      )

      const result = await Promise.race([
        supabase
          .from('cafeterias')
          .select('id, name, description, location, image_url, image_emoji, is_open, queue:cafeteria_queues(cafeteria_id, avg_wait_mins, queue_count)')
          .eq('is_open', true)
          .order('name'),
        timeoutPromise
      ]) as any

      if (result.error) {
        console.error('Supabase error:', result.error)
      } else if (result.data) {
        const dataWithQueues = result.data.map((cafe: any) => ({
          ...cafe,
          queue: cafe.queue && cafe.queue.length > 0 ? cafe.queue[0] : { cafeteria_id: cafe.id, avg_wait_mins: 0, queue_count: 0 }
        }))
        setCafeterias(dataWithQueues as CafeteriaWithQueue[])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    const ch = supabase.channel('mobile-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafeteria_queues' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [fetchData])

  const filtered = cafeterias.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  )

  const getQueueColor = (wait: number) => {
    if (wait <= 10) return { bg: '#edfaf3', color: '#2e9e6b' }
    if (wait <= 20) return { bg: '#fff8ec', color: '#d4821a' }
    return { bg: '#fff0f2', color: '#e8334a' }
  }

  return (
    <div style={{ paddingBottom: 100 }} className="mobile-page-enter">
      <style>{`
        .cafe-item { border-radius: 14px; overflow: hidden; border: 1px solid rgba(26,31,46,0.08); margin-bottom: 12px; text-decoration: none; color: inherit; display: block; transition: all 0.2s; }
        .cafe-item:active { transform: scale(0.98); }
        .cafe-image { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 64px; background: #f5f0eb; }
        .cafe-info { padding: 16px; background: white; }
        .cafe-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .cafe-location { font-size: 12px; color: #8a90a8; margin-bottom: 12px; }
        .cafe-queue { display: flex; gap: 16px; }
        .queue-stat { display: flex; align-items: center; gap: 6px; font-size: 13px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 16px 0', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: '#1a1f2e' }}>
          Browse Restaurants
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search restaurant..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'white',
            border: '1px solid rgba(26,31,46,0.1)',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>

      {/* Cafeterias List */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="cafe-item" style={{ overflow: 'hidden' }}>
              <div className="mobile-skeleton" style={{ height: 140, width: '100%' }} />
              <div style={{ padding: 16, background: 'white' }}>
                <div className="mobile-skeleton" style={{ height: 16, width: '60%', borderRadius: 6, marginBottom: 8 }} />
                <div className="mobile-skeleton" style={{ height: 12, width: '40%', borderRadius: 6, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="mobile-skeleton" style={{ height: 24, width: 80, borderRadius: 6 }} />
                  <div className="mobile-skeleton" style={{ height: 24, width: 80, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a90a8' }}>No restaurants found</div>
        ) : (
          filtered.map(cafe => {
            const qColor = getQueueColor(cafe.queue?.avg_wait_mins ?? 0)
            const slug = generateSlug(cafe.name)
            return (
              <Link key={cafe.id} href={`/mobile/order/${slug}`} style={{ textDecoration: 'none' }}>
                <div className="cafe-item">
                  <div className="cafe-image">{cafe.image_emoji}</div>
                  <div className="cafe-info">
                    <div className="cafe-name">{cafe.name}</div>
                    <div className="cafe-location">{cafe.location}</div>
                    <div className="cafe-queue">
                      <div className="queue-stat" style={{ background: qColor.bg, color: qColor.color, padding: '4px 8px', borderRadius: 6 }}>
                        <Clock size={12} /> {cafe.queue?.avg_wait_mins ?? 0} min
                      </div>
                      <div className="queue-stat" style={{ background: qColor.bg, color: qColor.color, padding: '4px 8px', borderRadius: 6 }}>
                        <Users size={12} /> {cafe.queue?.queue_count ?? 0} waiting
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
