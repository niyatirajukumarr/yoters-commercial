'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  onConfirm: (address: string) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  const [address, setAddress] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const [locating, setLocating] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const d = await res.json()
      return (d.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      // Wait for DOM to paint
      await new Promise(r => setTimeout(r, 100))
      if (cancelled || !mapDivRef.current) return

      const L = (await import('leaflet')).default
      LRef.current = L

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapDivRef.current, { zoomControl: true, attributionControl: false })
      leafletMap.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const defaultLatLng: [number, number] = [20.5937, 78.9629]
      map.setView(defaultLatLng, 5)

      const marker = L.marker(defaultLatLng, { draggable: true }).addTo(map)
      markerRef.current = marker

      // Get GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            if (cancelled) return
            const { latitude: lat, longitude: lng } = pos.coords
            marker.setLatLng([lat, lng])
            map.setView([lat, lng], 17)
            const addr = await reverseGeocode(lat, lng)
            if (!cancelled) { setAddress(addr); setSearchInput(addr) }
            setLocating(false)
          },
          () => setLocating(false),
          { timeout: 8000 }
        )
      } else {
        setLocating(false)
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSearchInput(addr)
        setSuggestions([])
      })

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSearchInput(addr)
      })

      // Must invalidate after initial render
      setTimeout(() => map.invalidateSize(), 200)
    }

    init()
    return () => {
      cancelled = true
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }
    }
  }, [reverseGeocode])

  // When enlarged toggles, wait for CSS to finish then fix tile seams
  useEffect(() => {
    const t = setTimeout(() => {
      if (leafletMap.current) leafletMap.current.invalidateSize()
    }, 350)
    return () => clearTimeout(t)
  }, [enlarged])

  const searchPlace = async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      )
      setSuggestions(await res.json())
    } catch { setSuggestions([]) }
    setSearching(false)
  }

  const handleInputChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchPlace(val), 500)
  }

  const pickSuggestion = (lat: number, lng: number, name: string) => {
    setSuggestions([])
    setSearchInput(name)
    setAddress(name)
    if (leafletMap.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      leafletMap.current.setView([lat, lng], 17)
    }
  }

  const useGPS = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (markerRef.current && leafletMap.current) {
          markerRef.current.setLatLng([lat, lng])
          leafletMap.current.setView([lat, lng], 17)
        }
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSearchInput(addr)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <>
      <style>{`@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500 }}
      />

      {/* Sheet */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 501,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          height: enlarged ? '95vh' : '75vh',
          transition: 'height 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1f2e' }}>📍 Delivery Location</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Tap map • Drag pin • Or search below</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 15, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Map — flex: 1 fills all remaining space */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div
            ref={mapDivRef}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* GPS button overlay */}
          <button
            onClick={useGPS}
            style={{
              position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
              background: 'white', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 600,
              color: '#2e9e6b', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🎯 {locating ? 'Locating…' : 'My Location'}
          </button>

          {/* Enlarge toggle */}
          <button
            onClick={() => setEnlarged(v => !v)}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 1000,
              background: 'white', border: 'none', borderRadius: 8,
              width: 34, height: 34, fontSize: 17,
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)', cursor: 'pointer',
            }}
            title={enlarged ? 'Shrink' : 'Expand map'}
          >
            {enlarged ? '⊡' : '⤢'}
          </button>
        </div>

        {/* Bottom controls — fixed height so map gets the rest */}
        <div style={{ flexShrink: 0, padding: '14px 18px 28px', background: 'white', borderTop: '1px solid #f0f0f0' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Type address — pin will move to it…"
              style={{
                width: '100%', padding: '12px 42px 12px 14px',
                border: '2px solid #2e9e6b', borderRadius: 12,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1a1f2e',
              }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
              {searching ? '⏳' : '🔍'}
            </span>

            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                background: 'white', border: '1px solid #e8e8e8',
                borderRadius: 12, boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
                zIndex: 600, overflow: 'hidden', marginBottom: 4,
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => pickSuggestion(parseFloat(s.lat), parseFloat(s.lon), s.display_name)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '11px 14px',
                      background: 'none', border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontSize: 13, cursor: 'pointer', color: '#1a1f2e', lineHeight: 1.5,
                    }}
                  >
                    📍 {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { if (address) onConfirm(address) }}
            disabled={!address}
            style={{
              width: '100%', padding: 14,
              background: address ? '#2e9e6b' : '#d0d0d0',
              color: 'white', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: address ? 'pointer' : 'not-allowed',
            }}
          >
            {address ? 'Confirm This Location →' : 'Pin a location on the map'}
          </button>
        </div>
      </div>
    </>
  )
}
