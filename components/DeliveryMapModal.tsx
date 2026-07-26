'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { hoverScale } from '@/lib/motion'

interface Props {
  onConfirm: (address: string) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [locating, setLocating] = useState(false)
  const [enlarged, setEnlarged] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
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
  }, [])

  const searchAddress = async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    setLoadingSearch(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      setSuggestions(await res.json())
    } catch { setSuggestions([]) }
    setLoadingSearch(false)
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

      const defaultCenter: [number, number] = [17.385, 78.4867] // Hyderabad
      map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const marker = L.marker(defaultCenter, { draggable: true }).addTo(map)
      markerRef.current = marker
      map.setView(defaultCenter, 15)

      if (navigator.geolocation) {
        setLocating(true)
        navigator.geolocation.getCurrentPosition(async pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          marker.setLatLng([lat, lng])
          map.setView([lat, lng], 16)
          const addr = await reverseGeocode(lat, lng)
          setAddress(addr)
          setLocating(false)
        }, () => setLocating(false), { timeout: 8000 })
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setSuggestions([])
      })

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
      })
    }

    init()
    return () => { if (map) map.remove() }
  }, [reverseGeocode])

  // Fix tile seams after enlarge
  useEffect(() => {
    const t = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize()
    }, 50)
    return () => clearTimeout(t)
  }, [enlarged])

  const flyTo = (lat: number, lng: number, displayName: string) => {
    setSuggestions([])
    setSearchQuery(displayName)
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

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([lat, lng])
        mapInstanceRef.current.setView([lat, lng], 17)
      }
      const addr = await reverseGeocode(lat, lng)
      setAddress(addr)
      setLocating(false)
    }, () => setLocating(false), { timeout: 8000 })
  }

  const mapHeight = enlarged ? 480 : 280

  return (
    <>
      <style>{`@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');`}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 36px', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>📍 Select Delivery Location</h2>
            <motion.button {...hoverScale} onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</motion.button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="🔍 Type address — pin moves to it..."
              style={{ width: '100%', padding: '13px 16px', border: '2px solid var(--accent)', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
            {loadingSearch && (
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>Searching...</div>
            )}
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: 10, zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto' }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => flyTo(parseFloat(s.lat), parseFloat(s.lon), s.display_name)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', fontSize: 13, cursor: 'pointer', color: 'var(--navy)', lineHeight: 1.4 }}>
                    📍 {s.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div style={{ position: 'relative' }}>
            <div
              ref={mapRef}
              style={{ width: '100%', height: mapHeight, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}
            />

            {/* Enlarge button */}
            <button
              onClick={() => setEnlarged(v => !v)}
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', border: 'none', borderRadius: 8, width: 34, height: 34, fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer' }}
            >
              {enlarged ? '⊡' : '⤢'}
            </button>

            {/* My Location button */}
            <button
              onClick={useMyLocation}
              style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, background: 'white', border: 'none', borderRadius: 10, padding: '7px 13px', fontSize: 13, fontWeight: 600, color: '#2e9e6b', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer' }}
            >
              🎯 {locating ? 'Locating...' : 'My Location'}
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
            Tap on map or drag the pin to adjust your location
          </p>

          {/* Detected address */}
          {address && (
            <div style={{ padding: '10px 14px', background: '#f0faf5', border: '1px solid rgba(46,158,107,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--navy)' }}>
              📍 {address}
            </div>
          )}

          <motion.button
            {...(address ? hoverScale : {})}
            onClick={() => { if (address) onConfirm(address) }}
            disabled={!address}
            style={{ width: '100%', padding: 15, background: address ? 'var(--accent)' : '#ccc', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: address ? 'pointer' : 'not-allowed' }}
          >
            {address ? 'Confirm Delivery Location →' : 'Pin a location on the map'}
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  )
}
