'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, CafeteriaQueue, formatWait, getWaitLevel } from '@/lib/types'
import { RefreshCw, Clock, Users } from 'lucide-react'

interface CafeteriaWithQueue extends Cafeteria {
  queue: CafeteriaQueue
}

export default function MobileHome() {
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'wait' | 'name'>('wait')

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching cafeterias...')

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout after 10s')), 10000)
      )

      const result = await Promise.race([
        supabase
          .from('cafeterias')
          .select('*, queue:cafeteria_queues(*)')
          .eq('is_open', true)
          .order('name'),
        timeoutPromise
      ]) as any

      console.log('Cafeterias fetched:', result)

      if (result.error) {
        console.error('Supabase error:', result.error)
      } else if (result.data) {
        setCafeterias(result.data as CafeteriaWithQueue[])
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

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'wait') {
      const waitA = a.queue?.avg_wait_mins ?? 0
      const waitB = b.queue?.avg_wait_mins ?? 0
      return waitA - waitB
    }
    return a.name.localeCompare(b.name)
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const avgWait = cafeterias.length > 0
    ? Math.round(cafeterias.reduce((sum, c) => sum + (c.queue?.avg_wait_mins ?? 0), 0) / cafeterias.length)
    : 0
  const totalWaiting = cafeterias.reduce((sum, c) => sum + (c.queue?.queue_count ?? 0), 0)

  const getQueueColor = (wait: number) => {
    if (wait <= 10) return { bg: '#edfaf3', color: '#2e9e6b', bar: '#2e9e6b' }
    if (wait <= 20) return { bg: '#fff8ec', color: '#d4821a', bar: '#d4821a' }
    return { bg: '#fff0f2', color: '#e8334a', bar: '#e8334a' }
  }

  return (
    <div style={{ paddingBottom: 100 }} className="mobile-page-enter">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .stat-card { padding: 16px; border-radius: 12px; background: white; border: 1px solid rgba(26,31,46,0.07); transition: all 0.2s ease; }
        .stat-card:active { transform: scale(0.98); }
        .queue-bar { height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin: 8px 0; }
        .queue-fill { height: 100%; border-radius: 2px; transition: width 0.3s ease; }
        .cafe-card { border-radius: 14px; overflow: hidden; border: 1px solid rgba(26,31,46,0.08); transition: all 0.2s ease; }
        .cafe-card:active { transform: scale(0.98); }
        .cafe-image { height: 120px; display: flex; align-items: center; justify-content: center; font-size: 52px; position: relative; }
      `}</style>

      {/* Go to Home Button */}
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '8px 16px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            ← Go to Home
          </button>
        </Link>
      </div>

      {/* Header with Refresh */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'slideUpMobile 0.5s ease' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, color: '#1a1f2e' }}>
            Order Now
          </div>
          <div style={{ fontSize: 13, color: '#8a90a8', marginTop: 2 }}>
            Live queue status
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            border: '1px solid rgba(232,51,74,0.2)',
            background: '#fff0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={20} color="#E8334A" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px', paddingTop: 20 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: '#8a90a8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} /> Avg Wait
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1f2e' }}>
            {avgWait} <span style={{ fontSize: 14, color: '#8a90a8' }}>min</span>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: '#8a90a8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={14} /> In Queue
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1f2e' }}>
            {totalWaiting}
          </div>
        </div>
      </div>

      {/* Search & Sort */}
      <div style={{ padding: '0 16px' }}>
        <input
          type="text"
          placeholder="Search cafeteria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: 12,
            background: 'white',
            border: '1px solid rgba(26,31,46,0.1)',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['wait', 'name'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s as any)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: 8,
                background: sortBy === s ? '#E8334A' : '#f5f5f5',
                color: sortBy === s ? 'white' : '#666',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s === 'wait' ? '⏱️ Fastest' : '📝 A-Z'}
            </button>
          ))}
        </div>
      </div>

      {/* Cafeteria List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8a90a8' }}>
          ⏳ Loading cafeterias...
        </div>
      ) : (
        <div style={{ padding: '0 16px', paddingBottom: 20 }}>
          {sorted.map((c) => {
            const wait = c.queue?.avg_wait_mins ?? 0
            const queueCount = c.queue?.queue_count ?? 0
            const level = getWaitLevel(wait)
            const colors = getQueueColor(wait)
            const maxWait = 30

            return (
              <Link key={c.id} href={`/mobile/order/${c.id}`}>
                <div className="cafe-card" style={{ marginBottom: 12, background: colors.bg, cursor: 'pointer' }}>
                  {/* Image Section */}
                  <div className="cafe-image" style={{ background: level === 'low' ? '#d4f5e8' : level === 'mid' ? '#fef3dc' : '#f5d4da' }}>
                    {c.image_emoji}
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: colors.color,
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {formatWait(wait)}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: '#1a1f2e', marginBottom: 3 }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#8a90a8', marginBottom: 8 }}>
                      {c.location}
                    </div>

                    {/* Queue Visual */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: colors.color, fontWeight: 600 }}>
                          {queueCount} {queueCount === 1 ? 'person' : 'people'} waiting
                        </span>
                      </div>
                      <div className="queue-bar">
                        <div
                          className="queue-fill"
                          style={{
                            width: `${Math.min((wait / maxWait) * 100, 100)}%`,
                            background: colors.bar,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {!loading && sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8a90a8' }}>
              🔍 No cafeterias found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
