'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onConfirm: (address: string) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [locating, setLocating] = useState(false)
  const markerRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      return (data.display_name as string) ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  const searchAddress = async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setLoadingSearch(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
    setLoadingSearch(false)
  }

  useEffect(() => {
    if (!mapRef.current) return
    let map: any
    let L: any

    const init = async () => {
      L = (await import('leaflet')).default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter: [number, number] = [13.0827, 80.2707] // Chennai default
      map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const marker = L.marker(defaultCenter, { draggable: true }).addTo(map)
      markerRef.current = marker
      map.setView(defaultCenter, 15)

      // Try to get real location
      if (navigator.geolocation) {
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const { latitude: lat, longitude: lng } = pos.coords
            marker.setLatLng([lat, lng])
            map.setView([lat, lng], 17)
            const addr = await reverseGeocode(lat, lng)
            setAddress(addr)
            setLocating(false)
          },
          () => setLocating(false),
          { timeout: 8000 }
        )
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
      })

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
      })
    }

    init()
    return () => { if (map) map.remove() }
  }, [])

  const flyTo = (lat: number, lng: number, displayName: string) => {
    setSuggestions([])
    setSearchQuery('')
    setAddress(displayName)
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17)
      markerRef.current.setLatLng([lat, lng])
    }
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(val), 500)
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng])
          mapInstanceRef.current.setView([lat, lng], 17)
        }
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  const final = manualAddress.trim() || address.trim()

  return (
    <>
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .delivery-map-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column; background: #fff; }
        .delivery-map-topbar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
        .delivery-map-search-row { display: flex; gap: 8px; align-items: center; }
        .delivery-map-search-wrap { flex: 1; position: relative; }
        .delivery-map-search-input { width: 100%; padding: 13px 16px 13px 42px; border: none; border-radius: 12px; font-size: 14px; outline: none; background: white; box-shadow: 0 2px 16px rgba(0,0,0,0.18); box-sizing: border-box; }
        .delivery-map-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
        .delivery-map-close-btn { width: 44px; height: 44px; border-radius: 50%; background: white; border: none; font-size: 18px; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .delivery-map-suggestions { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); overflow: hidden; max-height: 220px; overflow-y: auto; }
        .delivery-map-sugg-item { width: 100%; text-align: left; padding: 11px 14px; background: none; border: none; border-bottom: 1px solid #f0f0f0; font-size: 13px; cursor: pointer; color: #1a1f2e; line-height: 1.4; }
        .delivery-map-sugg-item:last-child { border-bottom: none; }
        .delivery-map-sugg-item:hover { background: #f8f9fa; }
        .delivery-map-fullmap { position: absolute; inset: 0; }
        .delivery-map-bottom { position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; background: white; border-radius: 20px 20px 0 0; padding: 16px 20px 36px; box-shadow: 0 -4px 24px rgba(0,0,0,0.12); }
        .delivery-map-handle { width: 36px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto 14px; }
        .delivery-map-addr-box { display: flex; align-items: flex-start; gap: 10px; background: #f0faf5; border: 1.5px solid #2e9e6b40; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
        .delivery-map-addr-text { font-size: 13px; color: #1a1f2e; line-height: 1.5; flex: 1; }
        .delivery-map-action-row { display: flex; gap: 10px; margin-bottom: 12px; }
        .delivery-map-loc-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; background: #f0faf5; border: 1.5px solid #2e9e6b60; border-radius: 10px; font-size: 13px; font-weight: 600; color: #2e9e6b; cursor: pointer; }
        .delivery-map-type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 11px; background: #f5f5f5; border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 13px; font-weight: 600; color: #555; cursor: pointer; }
        .delivery-map-manual-input { width: 100%; padding: 12px 14px; border: 2px solid #2e9e6b; border-radius: 10px; font-size: 14px; min-height: 70px; resize: none; box-sizing: border-box; outline: none; margin-bottom: 12px; }
        .delivery-map-confirm-btn { width: 100%; padding: 15px; background: #2e9e6b; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .delivery-map-confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
      `}</style>

      <div className="delivery-map-overlay">
        {/* Full-screen map */}
        <div ref={mapRef} className="delivery-map-fullmap" />

        {/* Top search bar */}
        <div className="delivery-map-topbar">
          <div className="delivery-map-search-row">
            <div className="delivery-map-search-wrap">
              <span className="delivery-map-search-icon">🔍</span>
              <input
                className="delivery-map-search-input"
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search for your address..."
              />
              {loadingSearch && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#aaa' }}>Searching...</span>
              )}
              {suggestions.length > 0 && (
                <div className="delivery-map-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} className="delivery-map-sugg-item" onClick={() => flyTo(parseFloat(s.lat), parseFloat(s.lon), s.display_name)}>
                      📍 {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="delivery-map-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Bottom panel */}
        <div className="delivery-map-bottom">
          <div className="delivery-map-handle" />

          {locating ? (
            <div style={{ textAlign: 'center', padding: '8px 0 12px', fontSize: 13, color: '#888' }}>📡 Getting your location...</div>
          ) : address ? (
            <div className="delivery-map-addr-box">
              <span style={{ fontSize: 18 }}>📍</span>
              <div className="delivery-map-addr-text">{address}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0 12px', fontSize: 13, color: '#888' }}>Tap anywhere on the map to set your delivery location</div>
          )}

          <div className="delivery-map-action-row">
            <button className="delivery-map-loc-btn" onClick={useCurrentLocation}>
              🎯 {locating ? 'Locating...' : 'Use My Location'}
            </button>
            <button className="delivery-map-type-btn" onClick={() => setShowManual(v => !v)}>
              ⌨️ Type Address
            </button>
          </div>

          {showManual && (
            <textarea
              className="delivery-map-manual-input"
              placeholder="Enter your full delivery address..."
              value={manualAddress}
              onChange={e => setManualAddress(e.target.value)}
            />
          )}

          <button
            className="delivery-map-confirm-btn"
            disabled={!final}
            onClick={() => { if (final) onConfirm(final) }}
          >
            Confirm Delivery Location →
          </button>
        </div>
      </div>
    </>
  )
}
