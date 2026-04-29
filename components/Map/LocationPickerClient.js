'use client'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

// SVG pin icon — แก้สี/ขนาดได้ที่นี่
const PIN_ICON = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none" style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.3));">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#E53935" stroke="#000" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="7" fill="#FFFFFF" stroke="#000" stroke-width="1.5"/>
    </svg>
  `,
  iconSize: [20, 35],
  iconAnchor: [18, 48],   // ปลายแหลมพินอยู่ตรงตำแหน่งที่คลิก
  popupAnchor: [0, -48],
  className: 'location-picker-pin',
})

// แผนที่เล็กให้ผู้ใช้คลิกเลือกตำแหน่ง
// เรียก onChange({ lat, lon, name }) ทุกครั้งที่ผู้ใช้คลิกที่ map
export default function LocationPickerClient({ onChange }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markerRef = useRef(null)
  const [locationName, setLocationName] = useState('TAP MAP TO PICK')
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    map.current = L.map(mapContainer.current).setView([13.7563, 100.5018], 13)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© CartoDB',
    }).addTo(map.current)

    map.current.invalidateSize()

    const handleClick = async (e) => {
      const lat = e.latlng.lat
      const lon = e.latlng.lng

      // ปัก/ย้าย marker (SVG pin)
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon])
      } else {
        markerRef.current = L.marker([lat, lon], { icon: PIN_ICON }).addTo(map.current)
      }

      setCoords({ lat, lon })
      const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      setLocationName(fallback)
      onChange?.({ lat, lon, name: fallback })

      // Reverse geocode (best-effort) — ไม่บล็อก UI
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const addr = data?.address || {}
        const short =
          addr.amenity ||
          addr.building ||
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.city ||
          addr.town ||
          ''
        const city = addr.city || addr.town || addr.village || ''
        const display = [short, city].filter(Boolean).join(', ') || data?.display_name || fallback
        setLocationName(display)
        onChange?.({ lat, lon, name: display })
      } catch {
        // ignore — fallback already set
      }
    }

    map.current.on('click', handleClick)

    return () => {
      map.current?.remove()
      map.current = null
      markerRef.current = null
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-[220px] rounded-md overflow-hidden border border-black"
      />
      <div className="absolute left-0 right-0 bottom-0 bg-black text-white px-4 py-2.5 flex justify-between items-center text-xs font-bold rounded-b-md">
        <span className="truncate uppercase">{locationName}</span>
        {coords && (
          <span className="ml-2 flex-shrink-0 text-[10px] opacity-80">
            {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}
          </span>
        )}
      </div>
    </div>
  )
}
