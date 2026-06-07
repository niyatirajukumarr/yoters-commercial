'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cafeteria, CafeteriaQueue, formatWait, getWaitLevel } from '@/lib/types'
import { X } from 'lucide-react'

interface CafeteriaWithQueue extends Cafeteria {
  queue: CafeteriaQueue
}

export default function MobileSearch() {
  const [cafeterias, setCafeterias] = useState<CafeteriaWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(true)
  const [maxWait, setMaxWait] = useState(30)
  const [sortBy, setSortBy] = useState<'wait' | 'name'>('wait')

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout after 10s')), 10000)
      )
      const result = await Promise.race([
        supabase
          .from('cafeterias')
          .select('*, queue:cafeteria_queues(*)')
          .order('name'),
        timeoutPromise
      ]) as any
      if (result.error) {
        console.error('Cafeterias fetch error:', result.error)
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
  }, [fetchData])

  const filtered = cafeterias
    .filter(c => !openOnly || c.is_open)
    .filter(c => !maxWait || (c.queue?.avg_wait_mins ?? 0) <= maxWait)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'wait') {
        return (a.queue?.avg_wait_mins ?? 0) - (b.queue?.avg_wait_mins ?? 0)
      }
      return a.name.localeCompare(b.name)
    })

  const hasFilters = search || openOnly !== true || maxWait !== 30 || sortBy !== 'wait'

  const waitColor = (level: string) => ({
    low: 'mobile-badge-green',
    mid: 'mobile-badge-yellow',
    high: 'mobile-badge-red',
  }[level] ?? '')

  const clearFilters = () => {
    setSearch('')
    setOpenOnly(true)
    setMaxWait(30)
    setSortBy('wait')
  }

  return (
    <div style={{ padding: 'var(--mobile-spacing)' }}>
      {/* Go to Home Button */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          Search
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Cafeteria name or location..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mobile-input"
        style={{ marginBottom: 16 }}
      />

      {/* Filters */}
      <div style={{ marginBottom: 20 }}>
        {/* Open Only Toggle */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={openOnly}
              onChange={e => setOpenOnly(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: 'var(--text)' }}>Open Now</span>
          </label>
        </div>

        {/* Sort By */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Sort By</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSortBy('wait')}
              className={sortBy === 'wait' ? 'mobile-btn-primary' : 'mobile-btn-secondary'}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 13,
                borderRadius: 'var(--mobile-radius)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Shortest Wait
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={sortBy === 'name' ? 'mobile-btn-primary' : 'mobile-btn-secondary'}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 13,
                borderRadius: 'var(--mobile-radius)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              A-Z
            </button>
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            marginBottom: 20,
            fontSize: 12,
            color: 'var(--accent)',
            background: 'var(--accent-light)',
            border: '1px solid rgba(232,51,74,0.2)',
            borderRadius: 'var(--mobile-radius)',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
          Clear filters
        </button>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          Loading...
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>

          {filtered.map(c => {
            const wait = c.queue?.avg_wait_mins ?? 0
            const level = getWaitLevel(wait)
            return (
              <div key={c.id} className="mobile-card mobile-list-item" style={{ padding: 'var(--mobile-spacing)', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 32 }}>{c.image_emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                      {c.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span className={`mobile-badge ${waitColor(level)}`}>
                        {formatWait(wait)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {c.queue?.queue_count ?? 0} waiting
                      </span>
                    </div>
                    <Link href={`/mobile/order/${c.id}`}>
                      <button className="mobile-btn mobile-btn-primary" style={{ padding: '10px 14px', fontSize: 13 }}>
                        Order
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <div style={{ marginBottom: 8 }}>No cafeterias found</div>
              <button
                onClick={clearFilters}
                style={{
                  fontSize: 13,
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
