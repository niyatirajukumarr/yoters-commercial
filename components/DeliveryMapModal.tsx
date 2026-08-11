'use client'

import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { hoverScale } from '@/lib/motion'

interface Props {
  // Always called with coordinates: a map point when one was picked, or the
  // result of geocoding the typed address. Checkout rejects a delivery order
  // without them, so confirming here without any was only ever a failure
  // deferred to the payment step.
  onConfirm: (address: string, coords?: { lat: number; lng: number }) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [locating, setLocating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  // The typed address is looked up as it is written and the marker moved to it,
  // so the customer sees where their words landed instead of trusting that the
  // text alone got through. Tracks which query the marker currently reflects.
  const [manualResolvedFor, setManualResolvedFor] = useState<string | null>(null)
  const [manualLocating, setManualLocating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The Leaflet handlers below are bound once, so they would otherwise close
  // over the empty first-render value of manualAddress forever.
  const manualAddressRef = useRef('')
  useEffect(() => { manualAddressRef.current = manualAddress }, [manualAddress])

  /** Resolve typed text to a point, so a manual address can still be delivered to. */
  const geocodeAddress = async (q: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const d = await res.json()
      if (typeof d?.lat === 'number' && typeof d?.lng === 'number') {
        return { lat: d.lat, lng: d.lng }
      }
    } catch {}
    return null
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
      const d = await res.json()
      if (d?.address) return d.address as string
    } catch {}
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }

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

      const defaultCenter: [number, number] = [17.385, 78.4867]
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

      // Moving the pin is the customer correcting what they typed, so the box
      // has to follow it. Otherwise the order records the words they wrote
      // while the driver is sent to the point they dragged to — and whichever
      // of the two is wrong, nobody finds out until the food is late.
      const syncManualBox = (addr: string) => {
        if (!manualAddressRef.current.trim()) return
        setManualAddress(addr)
        // Marks the box as already matching the pin, so the lookup below does
        // not fire and jump the pin back to the geocoder's guess.
        setManualResolvedFor(addr)
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setCoords({ lat, lng })
        setSuggestions([])
        syncManualBox(addr)
      })

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLatLng()
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setCoords({ lat, lng })
        syncManualBox(addr)
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

  // Show the typed address on the map as it is written. Confirming used to be
  // the first moment anything was resolved, so a customer could type a place
  // the geocoder had never heard of and only find out at the very end. Now the
  // marker moves to it — and they can drag it from there to correct it.
  useEffect(() => {
    const q = manualAddress.trim()
    if (manualDebounceRef.current) clearTimeout(manualDebounceRef.current)

    if (!q) {
      setManualResolvedFor(null)
      setConfirmError(null)
      return
    }
    // Below this a query is mostly noise, and Nominatim asks for at most one
    // request a second — the wait keeps a burst of keystrokes to one lookup.
    if (q.length < 4) return
    // Already matches where the pin is — either this text put it there, or the
    // customer dragged the pin and the box was updated to follow. Looking it up
    // again would drag the pin back off their correction.
    if (manualResolvedFor === q) return

    manualDebounceRef.current = setTimeout(async () => {
      setManualLocating(true)
      const hit = await geocodeAddress(q)
      setManualLocating(false)

      if (hit) {
        setManualResolvedFor(q)
        setConfirmError(null)
        flyTo(hit.lat, hit.lng, q, false)
      } else {
        setManualResolvedFor(null)
      }
    }, 800)

    return () => {
      if (manualDebounceRef.current) clearTimeout(manualDebounceRef.current)
    }
  }, [manualAddress])

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
                const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
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


        {/* Disclaimer */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '9px 13px', fontSize: 12, color: '#92400e' }}>
          ⚠️ For a more precise location, enter a nearby landmark or address manually below.
        </div>

        {/* OR manual address */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <input
          type="text"
          value={manualAddress}
          onChange={e => setManualAddress(e.target.value)}
          placeholder="Enter nearby landmark or full address..."
          style={{ width: '100%', padding: '13px 16px', border: '2px solid var(--border)', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Tells the customer their words were understood, and where they
            landed, while they can still do something about it. */}
        {manualAddress.trim().length >= 4 && (
          <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: -4 }}>
            {manualLocating ? (
              <span style={{ color: 'var(--muted)' }}>Finding this on the map…</span>
            ) : manualResolvedFor === manualAddress.trim() ? (
              <span style={{ color: 'var(--green, #2e9e6b)' }}>
                📍 Pinned on the map above — drag the pin if it is not quite right.
              </span>
            ) : (
              <span style={{ color: 'var(--muted)' }}>
                Not found yet — try adding the area, or tap your spot on the map above.
              </span>
            )}
          </div>
        )}

        {confirmError && (
          <div style={{ fontSize: 13, color: 'var(--red, #e8334a)', lineHeight: 1.5 }}>
            {confirmError}
          </div>
        )}

        <motion.button
          {...((address || manualAddress) && !confirming ? hoverScale : {})}
          onClick={async () => {
            const typed = manualAddress.trim()
            const final = typed || address.trim()
            if (!final || confirming) return

            // Picked on the map: the marker already carries the point.
            if (!typed) {
              onConfirm(final, coords ?? undefined)
              return
            }

            // Already pinned while they were typing. Use that point rather than
            // looking the text up again — they may have dragged the pin since,
            // and a fresh lookup would throw that correction away.
            if (coords && manualResolvedFor === typed) {
              onConfirm(final, coords)
              return
            }

            // Typed by hand. Resolve it to a point rather than handing back an
            // address with no coordinates, which checkout refuses.
            setConfirming(true)
            setConfirmError(null)
            const resolved = await geocodeAddress(typed)
            setConfirming(false)

            if (resolved) {
              onConfirm(final, resolved)
              return
            }
            setConfirmError(
              "We couldn't find that address on the map. Try adding the area or a nearby landmark, or tap your spot on the map above."
            )
          }}
          disabled={(!address.trim() && !manualAddress.trim()) || confirming}
          style={{ width: '100%', padding: 15, background: (address || manualAddress) && !confirming ? 'var(--accent)' : '#ccc', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (address || manualAddress) && !confirming ? 'pointer' : 'not-allowed' }}
        >
          {confirming ? 'Finding address…' : 'Confirm Delivery Location →'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
