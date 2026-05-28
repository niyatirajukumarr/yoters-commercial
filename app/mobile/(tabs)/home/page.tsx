'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, CafeteriaQueue, formatWait, getWaitLevel } from '@/lib/types'
import { RefreshCw } from 'lucide-react'

interface CafeteriaWithQueue extends Cafeteria {
  queue: CafeteriaQueue
}

export default function MobileHome() {
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('cafeterias')
      .select('*, queue:cafeteria_queues(*)')
      .eq('is_open', true)
      .order('name')
    if (data) setCafeterias(data as CafeteriaWithQueue[])
    setLoading(false)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }
  const openNow = cafeterias.filter(c => c.is_open).length

  const waitColor = (level: string) => ({
    low: 'mobile-badge-green',
    mid: 'mobile-badge-yellow',
    high: 'mobile-badge-red',
  }[level] ?? '')

  return (
    <div style={{ padding: 'var(--mobile-spacing)' }} className="mobile-page-enter">
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'slideUpMobile 0.5s ease' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Available Now
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {openNow} cafeteria{openNow !== 1 ? 's' : ''} open
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            width: 48,
            height: 48,
            minHeight: '48px',
            borderRadius: 'var(--mobile-radius)',
            border: '1px solid rgba(26,31,46,0.15)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: refreshing ? 0.6 : 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transform: refreshing ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!refreshing) {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,51,74,0.15)'
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
            e.currentTarget.style.backgroundColor = 'white'
          }}
        >
          <RefreshCw size={20} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search cafeteria..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mobile-input mobile-slide-up-1"
        style={{ marginBottom: 20 }}
      />

      {/* Cafeteria List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          Loading cafeterias...
        </div>
      ) : (
        <div>
          {filtered.map((c, idx) => {
            const wait = c.queue?.avg_wait_mins ?? 0
            const level = getWaitLevel(wait)
            return (
              <div key={c.id} className={`mobile-card mobile-list-item`} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Emoji Header */}
                <div
                  style={{
                    height: 100,
                    background: 'var(--surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    position: 'relative',
                  }}
                >
                  {c.image_emoji}
                  <div
                    className={`mobile-badge ${waitColor(level)}`}
                    style={{ position: 'absolute', top: 12, right: 12 }}
                  >
                    {formatWait(wait)}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 'var(--mobile-spacing)' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    {c.location}
                  </div>
                  {c.description && (
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                      {c.description}
                    </div>
                  )}

                  {/* Queue & CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--surface2)', borderRadius: 8, padding: '4px 10px' }}>
                      {c.queue?.queue_count ?? 0} waiting
                    </span>
                    <Link href={`/mobile/order/${c.id}`}>
                      <button className="mobile-btn mobile-btn-primary" style={{ width: 'auto', padding: '10px 18px', marginBottom: 0 }}>
                        Pre-order
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              No cafeterias found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
