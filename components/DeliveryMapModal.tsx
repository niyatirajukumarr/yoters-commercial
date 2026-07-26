'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onConfirm: (address: string) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [address, setAddress] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const [locating, setLocating] = useState(true)
  const markerRef = useRef<any>(null)
  const mapRef2 = useRef<any>(null) // leaflet instance
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reverseGeocode = async (lat: number, lng: number) => {
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
  }

  useEffect(() => {
    if (!mapRef.current) return
    let map: any

    const init = async () => {
      const L = (await import('leaflet')).default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false })
      mapRef2.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const marker = L.marker([20.5937, 78.9629], { draggable: true }).addTo(map)
      markerRef.current = marker
      map.setView([20.5937, 78.9629], 5)

      // Get GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const { latitude: lat, longitude: lng } = pos.coords
            marker.setLatLng([lat, lng])
            map.setView([lat, lng], 17)
            const addr = await reverseGeocode(lat, lng)
            setAddress(addr)
            setSearchInput(addr)
            setLocating(false)
          },
          () => setLocating(false),
          { timeout: 8000 }
        )
      } else {
        setLocating(false)
      }

      // Click map to move pin
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        map.panTo([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSearchInput(addr)
        setSuggestions([])
      })

      // Drag marker
      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSearchInput(addr)
      })
    }

    init()
    return () => { if (map) map.remove() }
  }, [])

  // Invalidate map size when enlarged changes
  useEffect(() => {
    setTimeout(() => {
      if (mapRef2.current) mapRef2.current.invalidateSize()
    }, 320)
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
    if (mapRef2.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef2.current.setView([lat, lng], 17)
    }
  }

  const useGPS = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (markerRef.current && mapRef2.current) {
          markerRef.current.setLatLng([lat, lng])
          mapRef2.current.setView([lat, lng], 17)
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

  const mapHeight = enlarged ? 'calc(100vh - 220px)' : 260

  return (
    <>
      <style>{`@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 501,
        background: 'white',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: enlarged ? '100vh' : '85vh',
        transition: 'max-height 0.3s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1f2e' }}>📍 Select Delivery Location</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Tap on map or search below to pin your location</div>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Map */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            ref={mapRef}
            style={{ width: '100%', height: mapHeight, transition: 'height 0.3s ease' }}
          />

          {/* GPS button on map */}
          <button
            onClick={useGPS}
            style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#2e9e6b', boxShadow: '0 2px 10px rgba(0,0,0,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🎯 {locating ? 'Locating...' : 'My Location'}
          </button>

          {/* Enlarge toggle */}
          <button
            onClick={() => setEnlarged(v => !v)}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, background: 'white', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={enlarged ? 'Shrink map' : 'Enlarge map'}
          >
            {enlarged ? '⊡' : '⤢'}
          </button>
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '14px 20px 32px', flexShrink: 0, overflowY: 'auto' }}>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Type your delivery address..."
              style={{ width: '100%', padding: '13px 44px 13px 16px', border: '2px solid #2e9e6b', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#1a1f2e' }}
            />
            {searching
              ? <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#aaa' }}>...</span>
              : <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            }

            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e8e8e8', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 600, overflow: 'hidden', marginTop: 4 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => pickSuggestion(parseFloat(s.lat), parseFloat(s.lon), s.display_name)}
                    style={{ width: '100%', textAlign: 'left', padding: '11px 14px', background: 'none', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13, cursor: 'pointer', color: '#1a1f2e', lineHeight: 1.5 }}
                  >
                    📍 {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 14 }}>
            Or tap directly on the map to drop a pin
          </div>

          <button
            onClick={() => { if (address) onConfirm(address) }}
            disabled={!address}
            style={{ width: '100%', padding: 15, background: address ? '#2e9e6b' : '#ccc', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: address ? 'pointer' : 'not-allowed' }}
          >
            {address ? 'Confirm Location →' : 'Pin a location on the map'}
          </button>
        </div>
      </div>
    </>
  )
}
