'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FormEvent, useEffect, useRef, useState } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

type Venue = {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
  count: number;
  total: number;
  image: string;
  icon: string;
  isActive: boolean;
};

const SAMPLE_VENUES: Venue[] = [
  {
    id: '1',
    name: 'หาตี้เล่นบาส 5v5 ครับ',
    nameEn: 'Urupong Basketball Court',
    lat: 13.7563,
    lon: 100.5018,
    count: 1,
    total: 10,
    image: 'location/urupong.jpg',
    icon: '🏀',
    isActive: true,
  },
  {
    id: '2',
    name: 'หาคนแทงสนุ๊กเดือดๆคับ',
    nameEn: 'Playbox',
    lat: 13.76,
    lon: 100.53,
    count: 4,
    total: 8,
    image: 'location/snooker.jpg',
    icon: '🎱',
    isActive: true,
  },
];

function formatLocation(address: Record<string, string> | undefined, displayName: string) {
  if (!address) return displayName;
  const city = address.city || address.town || address.village || address.hamlet || address.county;
  const country = address.country;
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return displayName;
}

function createCustomMarker(venue: Venue, opacity: number = 1, isSelected: boolean = false) {
  const gradientColor = isSelected ? '#fff3e0, #ffe0b2' : '#ffffff, #ffffff';
  const pulseColor = 'rgba(76, 175, 80, 0.7)';
  const pulseColorTransparent = 'rgba(76, 175, 80, 0)';
  const animationName = `pulse-marker-${venue.id}-${Date.now()}`;

  {/* Marker & Animation*/}
  const html = `
    <style>
      @keyframes ${animationName} {
        0%   { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 0 ${pulseColor}; }
        50%  { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 10px ${pulseColorTransparent}; }
        100% { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 0 ${pulseColor}; }
      }
      .marker-circle { animation: ${animationName} 2s infinite; }
    </style>
    <div style="width:80px; text-align:center; cursor:pointer; opacity:${opacity}; transition:opacity 0.3s ease;">
      <div class="marker-circle" style="
        width:60px; height:60px; margin:0 auto 4px;
        background:linear-gradient(135deg,${gradientColor});
        border-radius:50%; display:flex; align-items:center; justify-content:center;
        border:1px solid black; position:relative;">
        <div style="font-size:28px;">${venue.icon}</div>
      </div>
      <div style="
        background:#fff; color:black; padding:4px 8px;
        border-radius:100px; border:1px solid #000;
        font-size:12px; font-weight:600;
        display:flex; align-items:center; justify-content:center;
        gap:3px; white-space:nowrap;">
        👤 ${venue.count}/${venue.total}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    iconSize: [80, 90],
    iconAnchor: [40, 90],
    popupAnchor: [0, -90],
    className: 'custom-marker',
  });
}

export default function MapClient() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [query, setQuery] = useState('Bangkok');
  const [locationLabel, setLocationLabel] = useState('Thailand, Bangkok');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(13);

  const calculateOpacity = (zoom: number) => {
    const minFadeZoom = 8;
    const maxZoom = 13;
    if (zoom >= maxZoom) return 1;
    if (zoom <= minFadeZoom) return 0;
    return (zoom - minFadeZoom) / (maxZoom - minFadeZoom);
  };

  const markerOpacity = calculateOpacity(zoomLevel);

  const updatePopupPosition = () => {
    if (!selectedVenue || !map.current) return;
    const point = map.current.latLngToContainerPoint([selectedVenue.lat, selectedVenue.lon]);
    setPopupPos({ x: point.x, y: point.y });
  };

  useEffect(() => {
    updatePopupPosition();
    const interval = setInterval(updatePopupPosition, 100);
    return () => clearInterval(interval);
  }, [selectedVenue]);

  useEffect(() => {
    markersRef.current.forEach((marker, idx) => {
      const venue = SAMPLE_VENUES[idx];
      const isSelected = selectedVenue?.id === venue.id;
      marker.setIcon(createCustomMarker(venue, markerOpacity, isSelected));
    });
  }, [selectedVenue, markerOpacity]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([13.7563, 100.5018], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© CartoDB',
    }).addTo(map.current);

    map.current.invalidateSize();

    SAMPLE_VENUES.forEach((venue) => {
      const marker = L.marker([venue.lat, venue.lon], {
        icon: createCustomMarker(venue, 1),
      }).addTo(map.current!);

      marker.on('click', () => {
        setSelectedVenue(venue);
        const point = map.current!.latLngToContainerPoint([venue.lat, venue.lon]);
        setPopupPos({ x: point.x, y: point.y });
      });

      markersRef.current.push(marker);
    });

    map.current.on('move', updatePopupPosition);
    map.current.on('zoom', updatePopupPosition);
    map.current.on('zoom', () => {
      const zoom = map.current?.getZoom() || 13;
      setZoomLevel(zoom);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimQuery = query.trim();
    if (!trimQuery || !map.current) return;

    setError('');
    setIsSearching(true);

    try {
      const response = await fetch(
        `${NOMINATIM_URL}?q=${encodeURIComponent(trimQuery)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setError('No location found.');
        return;
      }

      const location = results[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);
      const label = formatLocation(location.address, location.display_name);

      setLocationLabel(label);
      map.current.setView([lat, lon], 13);
      setShowInput(false);
    } catch (err) {
      setError('Search failed, please try again.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <>
      <div className="relative w-full h-screen">
        <div ref={mapContainer} className="h-screen w-full" />

        {/* Search Bar ติดด้านบน */}
        <form
          onSubmit={handleSearch}
          className="absolute top-0 left-0 right-0 z-[9999]"
        >
          <div className="bg-[#F3F2EB] px-4 py-3 flex items-center gap-5 border-b border-gray-950">

            {/* Profile Image */}
            <img
              src="/profile_placeholder.avif"
              alt="profile"
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-400"
            />

            {/* Location Info หรือ Input */}
            <div className="flex-1 min-w-0">
              {showInput ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full text-sm outline-none border-b border-gray-400 pb-0.5 text-black"
                  placeholder="ค้นหาสถานที่..."
                />
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#e53935">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span className="text-sm font-bold text-black">Your Location</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{locationLabel}</p>
                </>
              )}
              {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
            </div>

            {/* Search Button */}
            <button
              type={showInput ? 'submit' : 'button'}
              onClick={() => { if (!showInput) setShowInput(true) }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors border border-gray-950 p-2"
            >
              {isSearching ? (
                <span className="text-xs text-gray-500">...</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#333" strokeWidth="1.5"/>
                  <line x1="11" y1="11" x2="15" y2="15" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>

          </div>
        </form>
      </div>

      {/* Popup Card */}
      {selectedVenue && (
        <div
          className="fixed w-80 z-[99999] pointer-events-auto transition-opacity duration-300"
          style={{
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
            transform: 'translate(16px, -50%)',
            opacity: markerOpacity,
          }}
        >
          <div className="bg-white rounded-xl overflow-hidden shadow-xl">
            <div className="relative h-32">
              <img
                src={selectedVenue.image}
                alt={selectedVenue.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedVenue(null)}
                className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md text-sm text-black font-bold"
              >
                ✕
              </button>
              {selectedVenue.isActive && (
                <div className="absolute top-2 left-2 bg-green-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  ACTIVE NOW
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm mb-1 text-slate-900">{selectedVenue.name}</h3>
              <p className="text-xs text-gray-600 mb-2.5">{selectedVenue.nameEn}</p>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900">
                <span>👤</span>
                <span>{selectedVenue.count}/{selectedVenue.total}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 border border-slate-900 text-slate-900 py-1.5 px-2 rounded-full font-semibold text-xs hover:bg-slate-50">
                  DETAILS
                </button>
                <button className="flex-1 bg-green-400 text-white py-1.5 px-2 rounded-full font-semibold text-xs hover:bg-green-500">
                  JOIN NOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#F3F2EB] border-t border-gray-950 p-2 flex justify-center items-center">
          <button title ="Create New Event"
          className='bg-[#F8B347] rounded-full w-12 h-12 flex items-center justify-center text-gray-950 border border-gray-950 p-3'>
            <span 
            className="text-sm font-bold text-gray-950 text-[30px]">+</span>
          </button>
      </div>
    </>
  );
}