'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']

const MAP_CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '12px' }
const DEFAULT_CENTER = { lat: 17.385, lng: 78.4867 } // Hyderabad default

interface Props {
  onConfirm: (address: string, lat: number, lng: number) => void
  onClose: () => void
}

export default function DeliveryMapModal({ onConfirm, onClose }: Props) {
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [markerPos, setMarkerPos] = useState(DEFAULT_CENTER)
  const [address, setAddress] = useState('')
  const [loadError, setLoadError] = useState(false)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Try to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(loc)
        setMarkerPos(loc)
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: loc }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setAddress(results[0].formatted_address)
            if (inputRef.current) inputRef.current.value = results[0].formatted_address
          }
        })
      }, () => {}) // silently fail if denied
    }
  }, [])

  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return
    const place = autocompleteRef.current.getPlace()
    if (!place.geometry?.location) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setCenter({ lat, lng })
    setMarkerPos({ lat, lng })
    setAddress(place.formatted_address ?? place.name ?? '')
  }, [])

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setMarkerPos({ lat, lng })
    // Reverse geocode
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        setAddress(results[0].formatted_address)
        if (inputRef.current) inputRef.current.value = results[0].formatted_address
      }
    })
  }, [])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)' }}>📍 Select Delivery Location</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>

        {!apiKey || loadError ? (
          // Fallback: plain text input if no API key
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              {!apiKey ? '⚠️ Google Maps API key not configured. Enter address manually:' : '⚠️ Map failed to load. Enter address manually:'}
            </p>
            <textarea
              placeholder="Enter your full delivery address..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', border: '2px solid var(--accent)', borderRadius: 12, fontSize: 14, minHeight: 80, resize: 'none', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
        ) : (
          <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES} onError={() => setLoadError(true)}>
            {/* Search box */}
            <Autocomplete onLoad={ac => { autocompleteRef.current = ac }} onPlaceChanged={onPlaceChanged}>
              <input
                ref={inputRef}
                type="text"
                placeholder="🔍 Search for your address..."
                style={{ width: '100%', padding: '13px 16px', border: '2px solid var(--accent)', borderRadius: 12, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </Autocomplete>

            {/* Map */}
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={center}
              zoom={15}
              onClick={onMapClick}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
            >
              <Marker
                position={markerPos}
                draggable
                onDragEnd={e => {
                  if (!e.latLng) return
                  const lat = e.latLng.lat()
                  const lng = e.latLng.lng()
                  setMarkerPos({ lat, lng })
                  const geocoder = new google.maps.Geocoder()
                  geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results?.[0]) {
                      setAddress(results[0].formatted_address)
                      if (inputRef.current) inputRef.current.value = results[0].formatted_address
                    }
                  })
                }}
              />
            </GoogleMap>

            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
              Tap on map or drag the pin to adjust your location
            </p>

            {address && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f5f5f7', borderRadius: 10, fontSize: 13, color: 'var(--navy)' }}>
                📍 {address}
              </div>
            )}
          </LoadScript>
        )}

        <button
          onClick={() => { if (address.trim()) onConfirm(address, markerPos.lat, markerPos.lng) }}
          disabled={!address.trim()}
          style={{ width: '100%', marginTop: 16, padding: 15, background: address.trim() ? 'var(--accent)' : '#ccc', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: address.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
        >
          Confirm Delivery Location →
        </button>
      </div>
    </div>
  )
}
