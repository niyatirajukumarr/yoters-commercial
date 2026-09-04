'use client'

import { apiFetch } from '@/lib/api'

import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { hoverScale } from '@/lib/motion'

interface Props {
  // Always called with coordinates: the map pin, or failing that the geocoded
  // landmark. Checkout rejects a delivery order without them, so confirming
  // here without any was only ever a failure deferred to the payment step.
  // `address` carries the landmark appended when one was given.
  onConfirm: (address: string, coords?: { lat: number; lng: number }) => void
  onClose: () => void
  // Where to open the map when the customer's own location is unavailable.
  // Deliveries are capped at 5km from the restaurant, so this has to be the
  // restaurant — the previous fixed default was Hyderabad, ~500km from both
  // of them, which put every tap out of range.
  center?: { lat: number; lng: number }
}

export default function DeliveryMapModal({ onConfirm, onClose, center }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [_searchQuery, setSearchQuery] = useState('')
  const [_suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [_loadingSearch, setLoadingSearch] = useState(false)
  const [landmark, setLandmark] = useState('')
  const [locating, setLocating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  // Which landmark text the pin currently reflects, for the case where the
  // landmark is what placed it.
  const [landmarkPinnedFor, setLandmarkPinnedFor] = useState<string | null>(null)
  const [landmarkLocating, setLandmarkLocating] = useState(false)
  const _debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const landmarkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Resolve typed text to a point, so a manual address can still be delivered to. */
  const geocodeAddress = async (q: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const d = await res.json()
      if (typeof d?.lat === 'number' && typeof d?.lng === 'number') {
        return { lat: d.lat, lng: d.lng }
      }
    } catch {}
    return null
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await apiFetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
      const d = await res.json()
      if (d?.address) return d.address as string
    } catch {}
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }

  const _searchAddress = async (q: string) => {
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
    let cancelled = false
    let map: any

    const init = async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter: [number, number] = center ? [center.lat, center.lng] : [17.385, 78.4867]
      map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const marker = L.marker(defaultCenter, { draggable: true }).addTo(map)
      markerRef.current = marker
      map.setView(defaultCenter, 15)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
          if (cancelled) return
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          marker.setLatLng([lat, lng])
          map.setView([lat, lng], 16)
          const addr = await reverseGeocode(lat, lng)
          if (!cancelled) { setAddress(addr); setCoords({ lat, lng }) }
        }, () => {})
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setCoords({ lat, lng })
        setSuggestions([])
      })

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setCoords({ lat, lng })
      })
    }

    init()
    return () => {
      cancelled = true
      if (map) map.remove()
    }
  }, [])

  const flyTo = (lat: number, lng: number, displayName: string, updateSearchBar = true) => {
    setSuggestions([])
    if (updateSearchBar) setSearchQuery(displayName)
    setAddress(displayName)
    setCoords({ lat, lng })
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17)
      markerRef.current.setLatLng([lat, lng])
    }
  }

  // A landmark is a note for the driver, not the delivery point — the pin is.
  // So this only places the pin when there is not one yet: someone who denied
  // location permission and never tapped the map can still be found by typing
  // "opposite Acharya College gate". Once a pin exists it is left alone, since
  // dragging it to your own gate and then adding a landmark should not throw
  // that away and send the driver to the landmark instead.
  useEffect(() => {
    const q = landmark.trim()
    if (landmarkDebounceRef.current) clearTimeout(landmarkDebounceRef.current)

    if (!q) {
      setLandmarkPinnedFor(null)
      setConfirmError(null)
      return
    }
    if (coords) return
    // Below this a query is mostly noise, and Nominatim asks for at most one
    // request a second — the wait keeps a burst of keystrokes to one lookup.
    if (q.length < 4) return
    if (landmarkPinnedFor === q) return

    landmarkDebounceRef.current = setTimeout(async () => {
      setLandmarkLocating(true)
      const hit = await geocodeAddress(q)
      setLandmarkLocating(false)

      if (hit) {
        setLandmarkPinnedFor(q)
        setConfirmError(null)
        flyTo(hit.lat, hit.lng, q, false)
      } else {
        setLandmarkPinnedFor(null)
      }
    }, 800)

    return () => {
      if (landmarkDebounceRef.current) clearTimeout(landmarkDebounceRef.current)
    }
  }, [landmark])

  return (
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
        <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>📍 Select Delivery Location</h2>
          <motion.button {...hoverScale} onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</motion.button>
        </div>


        {/* Map container — same pattern as RestaurantMap */}
        <div style={{ position: 'relative', width: '100%', height: 280, boxSizing: 'border-box' }}>
          <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}
          />
          {/* Pin current location button */}
          <button
            onClick={async () => {
              if (!navigator.geolocation) return
              setLocating(true)
              navigator.geolocation.getCurrentPosition(async pos => {
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude
                if (markerRef.current && mapInstanceRef.current) {
                  markerRef.current.setLatLng([lat, lng])
                  mapInstanceRef.current.setView([lat, lng], 17)
                }
                const res = await apiFetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
                const d = await res.json()
                if (d?.address) setAddress(d.address)
                setCoords({ lat, lng })
                setLocating(false)
              }, () => setLocating(false), { timeout: 8000 })
            }}
            style={{
              position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
              background: 'white', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 13, fontWeight: 700,
              color: 'var(--accent)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🎯 {locating ? 'Locating...' : 'Pin My Location'}
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
          Tap on map or drag the pin to set your location
        </p>

        {address && (
          <div style={{ padding: '10px 14px', background: '#f0faf5', border: '1px solid rgba(46,158,107,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--navy)' }}>
            📍 {address}
          </div>
        )}


        {/* Optional landmark. Not an alternative to the pin — an extra line for
            whoever is carrying the food, for the things a map cannot show: which
            gate, which floor, the shop to stop at. Nothing here blocks Confirm. */}
        <div>
          <label
            htmlFor="delivery-landmark"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}
          >
            Nearby landmark <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(optional)</span>
          </label>
          <input
            id="delivery-landmark"
            type="text"
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            placeholder="e.g. opposite Acharya College gate, 2nd floor"
            style={{ width: '100%', padding: '13px 16px', border: '2px solid var(--border)', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>
            {landmarkLocating ? (
              'Finding this on the map…'
            ) : !coords && landmarkPinnedFor === landmark.trim() && landmark.trim() ? (
              <span style={{ color: 'var(--green, #2e9e6b)' }}>
                📍 Pinned on the map above — drag the pin if it is not quite right.
              </span>
            ) : (
              'Helps the driver find you. Delivery still goes to the pin on the map.'
            )}
          </div>
        </div>

        {confirmError && (
          <div style={{ fontSize: 13, color: 'var(--red, #e8334a)', lineHeight: 1.5 }}>
            {confirmError}
          </div>
        )}

        <motion.button
          {...((address || landmark) && !confirming ? hoverScale : {})}
          onClick={async () => {
            const note = landmark.trim()
            const base = address.trim()
            if ((!base && !note) || confirming) return

            // The landmark rides along with the address rather than replacing
            // it, so the driver gets both the street and the "which gate".
            const describe = (addr: string) => (note ? `${addr} (near ${note})` : addr)

            // The pin is the delivery point whenever there is one.
            if (coords) {
              onConfirm(describe(base || note), coords)
              return
            }

            // No pin at all — permission denied and the map never touched. The
            // landmark is the only thing left to go on, so resolve it rather
            // than confirming a location checkout will refuse.
            setConfirming(true)
            setConfirmError(null)
            const resolved = await geocodeAddress(note)
            setConfirming(false)

            if (resolved) {
              onConfirm(describe(base || note), resolved)
              return
            }
            setConfirmError(
              "We couldn't place that on the map. Tap your spot on the map above, or add the area to the landmark."
            )
          }}
          disabled={(!address.trim() && !landmark.trim()) || confirming}
          style={{ width: '100%', padding: 15, background: (address || landmark) && !confirming ? 'var(--accent)' : '#ccc', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (address || landmark) && !confirming ? 'pointer' : 'not-allowed' }}
        >
          {confirming ? 'Finding address…' : 'Confirm Delivery Location →'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
