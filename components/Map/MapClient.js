'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const SAMPLE_VENUES = [
  {
    id: '1',
    name: 'หาตี้เล่นบาส 5v5 ครับ',
    nameEn: 'Urupong Basketball Court',
    location: 'Urupong, Bangkok',
    category: 'BASKETBALL',
    dateTime: '30 MAR 16:00 - 18:00',
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
    location: 'Siam, Bangkok',
    category: 'SNOOKER',
    dateTime: '30 MAR 19:00 - 22:00',
    lat: 13.76,
    lon: 100.53,
    count: 4,
    total: 8,
    image: 'location/snooker.jpg',
    icon: '🎱',
    isActive: true,
  },
];

function formatLocation(address, displayName) {
  if (!address) return displayName;
  const city = address.city || address.town || address.village || address.hamlet || address.county;
  const country = address.country;
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  return displayName;
}

// แยก opacity ออกมาเป็น style แทนการ recreate icon ใหม่ทุกครั้ง
function createCustomMarker(venue, isSelected = false) {
  const bgColor = isSelected ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)' : 'linear-gradient(135deg, #ffffff, #ffffff)';
  const pulseColor = 'rgba(76, 175, 80, 0.7)';
  const pulseColorTransparent = 'rgba(76, 175, 80, 0)';
  const animationName = `pulse-${venue.id}`;

// Animation Pulse Effect โดยการใช้ bow-shadow แล้วค่อยๆขยายตามเปอร์เซ็นต์
  const html = `
    <style>
      @keyframes ${animationName} {
        0%   { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 0 ${pulseColor}; }
        50%  { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 10px ${pulseColorTransparent}; }
        100% { box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 0 ${pulseColor}; }
      }
      .marker-circle-${venue.id} { animation: ${animationName} 2s infinite; }

// Marker Style 

    </style>
    <div style="width:80px; text-align:center; cursor:pointer;">
      <div class="marker-circle-${venue.id}" style="
        width:60px; height:60px; margin:0 auto 4px;
        background:${bgColor};
        border-radius:50%; display:flex; align-items:center; justify-content:center;
        border:1px solid black; position:relative;">
        <div style="font-size:28px;">${venue.icon}</div>
      </div>
      <div style="
        background:#fff; color:black; padding:0px 4px;
        border-radius:100px; border:1px solid #000;
        font-size:12px; font-weight:600;
        display:flex; align-items:center; justify-content:center;
        gap:4px; white-space:nowrap;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
        </svg>
        ${venue.count}/${venue.total}
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
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [query, setQuery] = useState('Bangkok');
  const [locationLabel, setLocationLabel] = useState('Thailand, Bangkok');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [detailVenue, setDetailVenue] = useState(null);
  // เก็บ venues ทั้งหมด (sample + user-created จาก localStorage)
  const [allVenues, setAllVenues] = useState(SAMPLE_VENUES);
  // event ที่ user สร้างไว้ (มีได้ครั้งละ 1) — null ถ้ายังไม่มี
  const [activeUserVenue, setActiveUserVenue] = useState(null);
  // event ที่ user เพิ่ง join (มีได้ครั้งละ 1) — null ถ้ายังไม่ได้ join
  const [activeJoinedVenue, setActiveJoinedVenue] = useState(null);

  function openDetail(venue) {
    setSelectedVenue(null); // ปิด popup เล็ก
    setDetailVenue(venue);  // เปิด bottom sheet
  }
  function closeDetail() {
    setDetailVenue(null);
  }

  // คลิกที่ active event card → pan ไปที่ตำแหน่ง + เปิด popup เล็ก
  function focusActiveVenue() {
    if (!activeUserVenue || !map.current) return;
    map.current.setView([activeUserVenue.lat, activeUserVenue.lon], 15);
    setSelectedVenue(activeUserVenue);
    const point = map.current.latLngToContainerPoint([activeUserVenue.lat, activeUserVenue.lon]);
    setPopupPos({ x: point.x, y: point.y }); 
  }
  
  // กด JOIN NOW — บาสไปเล่น minigame, กีฬาอื่น join ตรงๆ
  function handleJoinNow(venue) {
    if (!venue) return;
    if (activeJoinedVenue) return; // อยู่ใน event อื่นแล้ว — กันซ้อน
    const isBasketball =
      venue.category?.toUpperCase() === 'BASKETBALL' || venue.icon === '🏀';
    if (isBasketball) {
      try { localStorage.setItem('pendingJoinVenue', JSON.stringify(venue)); } catch {}
      setSelectedVenue(null);
      setDetailVenue(null);
      router.push('/joinbasketball');
    } else {
      try { localStorage.setItem('activeJoinedVenue', JSON.stringify(venue)); } catch {}
      setActiveJoinedVenue(venue);
      setSelectedVenue(null);
      setDetailVenue(null);
    }
  }

  // กด LEAVE — ออกจาก event ที่ join อยู่
  function handleLeave() {
    if (!activeJoinedVenue) return;
    if (selectedVenue?.id === activeJoinedVenue.id) setSelectedVenue(null);
    if (detailVenue?.id === activeJoinedVenue.id) setDetailVenue(null);
    setActiveJoinedVenue(null);
    try { localStorage.removeItem('activeJoinedVenue'); } catch {}
  }

  // ลบ event ที่ user สร้าง — เอา marker ออก, ล้าง localStorage, ล้าง state
  function removeActiveVenue() {
    if (!activeUserVenue) return;
    const idx = markersRef.current.findIndex((m) => m.venueId === activeUserVenue.id);
    if (idx >= 0) {
      markersRef.current[idx].remove();
      markersRef.current.splice(idx, 1);
    }
    setAllVenues((prev) => prev.filter((v) => v.id !== activeUserVenue.id));
    if (selectedVenue?.id === activeUserVenue.id) setSelectedVenue(null);
    if (detailVenue?.id === activeUserVenue.id) setDetailVenue(null);
    setActiveUserVenue(null);
    try { localStorage.removeItem('activeUserVenue'); } catch {}
  }

  const calculateOpacity = (zoom) => {
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

  // อัพเดท opacity โดยใช้ setOpacity แทนการ recreate icon
  useEffect(() => {
    markersRef.current.forEach((marker, idx) => {
      const venue = allVenues[idx];
      if (!venue) return;
      // setOpacity สำหรับ fade ตาม zoom
      marker.setOpacity(markerOpacity);
    });
  }, [markerOpacity]);

  // อัพเดท icon เฉพาะเมื่อ selectedVenue เปลี่ยน
  useEffect(() => {
    markersRef.current.forEach((marker, idx) => {
      const venue = allVenues[idx];
      if (!venue) return;
      const isSelected = selectedVenue?.id === venue.id;
      marker.setIcon(createCustomMarker(venue, isSelected));
    });
  }, [selectedVenue]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([13.7563, 100.5018], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© CartoDB',
    }).addTo(map.current);

    map.current.invalidateSize();

    // อ่าน active user venue + active joined venue จาก localStorage
    let userVenue = null;
    let joinedVenue = null;
    try {
      const raw = localStorage.getItem('activeUserVenue');
      if (raw) userVenue = JSON.parse(raw);
    } catch {}
    try {
      const raw = localStorage.getItem('activeJoinedVenue');
      if (raw) joinedVenue = JSON.parse(raw);
    } catch {}

    const venuesToRender = userVenue ? [...SAMPLE_VENUES, userVenue] : SAMPLE_VENUES;
    setAllVenues(venuesToRender);
    setActiveUserVenue(userVenue);
    setActiveJoinedVenue(joinedVenue);

    venuesToRender.forEach((venue) => {
      const marker = L.marker([venue.lat, venue.lon], {
        icon: createCustomMarker(venue, false),
      }).addTo(map.current);
      marker.venueId = venue.id; // ใช้หา marker เวลาลบ

      marker.on('click', () => {
        setSelectedVenue(venue);
        const point = map.current.latLngToContainerPoint([venue.lat, venue.lon]);
        setPopupPos({ x: point.x, y: point.y });
      });

      markersRef.current.push(marker);
    });

    const handleMove = () => {
      if (!selectedVenue) return;
      const point = map.current.latLngToContainerPoint([selectedVenue.lat, selectedVenue.lon]);
      setPopupPos({ x: point.x, y: point.y });
    };

    const handleZoom = () => {
      const zoom = map.current?.getZoom() || 13;
      setZoomLevel(zoom);
    };

    const handleMapClick = () => {
      // คลิกที่ map ว่างๆ (ไม่ใช่ marker) → ปิด popup
      setSelectedVenue(null);
    };

    map.current.on('move', handleMove);
    map.current.on('zoom', handleZoom);
    map.current.on('click', handleMapClick);

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  async function handleSearch(e) {
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
              onClick={() => { if (!showInput) setShowInput(true); }}
              className="flex-shrink-0 rounded-full hover:bg-gray-100 transition-colors border border-gray-950 p-2 bg-white"
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

      {/* Popup Card — ไม่มี overlay ทับ map แล้ว ลาก/zoom map ได้ตามปกติ */}
{selectedVenue && (
  <div
    className="fixed w-[420px] z-[99999] pointer-events-auto transition-opacity duration-300" // 1. เพิ่มความกว้างการ์ด (จาก w-80 เป็น 420px หรือตามต้องการ)
    style={{
      left: `${popupPos.x}px`,
      top: `${popupPos.y}px`,
      transform: 'translate(50px, -72%)', // Popup อยู่ตรงกลางของ marker แล้วขยับไป 50px
      opacity: markerOpacity,
    }}
  >
    {/* ปุ่มปิด popup */}
    <button
      type="button"
      onClick={() => setSelectedVenue(null)}
      aria-label="Close"
      className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white border border-black flex items-center justify-center shadow-md hover:bg-gray-100"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 2L10 10M10 2L2 10" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>

    <div className="bg-white rounded-xl overflow-hidden shadow-xl flex flex-row border border-black"> {/* 2. เพิ่มเส้นขอบดำรอบการ์ด */}

      {/* ฝั่งซ้าย: รูปภาพ */}
      <div className="relative w-1/2 h-44 flex flex-row"> {/* 3. กำหนดความกว้างรูปเป็น 50% และเพิ่มความสูง h-44 */}
        {selectedVenue.image ? (
          <img
            src={selectedVenue.image}
            alt={selectedVenue.name}
            className="w-full h-full object-cover border-r border-black"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F8B347] to-[#FFD180] border-r border-black flex items-center justify-center text-6xl">
            {selectedVenue.icon}
          </div>
        )}
      </div>

      {/* ฝั่งขวา: เนื้อหา */}
      <div className="w-1/2 p-2 flex flex-col justify-between relative bg-[#FDFCF7]"> {/* 4. ใส่สีพื้นหลังครีมอ่อนๆ และใช้ flex-col กระจายเนื้อหา */}

        {/* ส่วนหัว: Active Now */}
        <div>
          <div className="inline-block bg-[#98B661] text-white px-2 py-1 rounded-full text-[8px] font-bold border border-black mb-2">
            ACTIVE NOW!
          </div>
          <h3 className="font-bold text-[18px] text-slate-900 leading-tight">{selectedVenue.name}</h3>
          <p className="text-[12px] text-gray-500 font-bold">{selectedVenue.nameEn}</p>
        </div>

        {/* ส่วนล่าง: จำนวนคน และ ปุ่ม */}
        <div className="flex flex-col gap-3">
          <div className="bg-black flex items-center justify-center gap-2 text-[10px] font-bold text-white w-max px-4 py-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
            <span>{selectedVenue.count}/{selectedVenue.total}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openDetail(selectedVenue)}
              className="flex-1 bg-[#F3F1E5] border border-black text-black py-2 rounded-full font-bold text-[12px] hover:bg-white"
            >
              DETAILS
            </button>
            {!selectedVenue.isUserCreated && (
              activeJoinedVenue?.id === selectedVenue.id ? (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="flex-1 bg-[#98B661] border border-black text-white py-2 rounded-full font-bold text-[12px] hover:opacity-90"
                >
                  LEAVE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleJoinNow(selectedVenue)}
                  className="flex-1 bg-[#98B661] border border-black text-white py-2 rounded-full font-bold text-[12px] hover:opacity-90"
                >
                  JOIN NOW
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Bottom Sheet (Detail Panel) — slide up from bottom */}
      <div
        className={`fixed left-0 right-0 z-[9998] bg-white border border-black shadow-2xl pointer-events-${detailVenue ? 'auto' : 'none'} transition-transform duration-300 ease-out`}
        style={{
          bottom: '64px', // ให้อยู่เหนือปุ่ม Create New Event
          maxHeight: 'calc(100vh - 64px)',
          transform: detailVenue ? 'translateY(0)' : 'translateY(calc(100% + 80px))',
        }}
      >
        {detailVenue && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            {/* Drag handle */}
            <button
              type="button"
              onClick={closeDetail}
              aria-label="Close"
              className="w-full flex justify-center pt-2 pb-1"
            >
              <span className="block w-12 h-1.5 rounded-full bg-black" />
            </button>

            {/* Image */}
            <div className=" ">
              {detailVenue.image ? (
                <img
                  src={detailVenue.image}
                  alt={detailVenue.name}
                  className="w-full h-48 object-cover border border-black"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-[#F8B347] to-[#FFD180] border border-black flex items-center justify-center text-7xl">
                  {detailVenue.icon}
                </div>
              )}
            </div>

            {/* Title + count */}
            <div className="px-4 pt-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold text-black leading-tight break-words">
                  {detailVenue.name}
                </h2>
                <p className="text-sm text-gray-500 font-bold mt-0.5">
                  {detailVenue.location || detailVenue.nameEn}
                </p>
              </div>
              <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                </svg>
                <span>{detailVenue.count}/{detailVenue.total}</span>
              </div>
            </div>

            {/* SpTags */}
            <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
              <div className="bg-[#F8B347] text-black border border-black px-3 py-1.5 text-sm font-extrabold flex items-center gap-1.5 shadow-[0px_3px_0px_0px_rgba(0,0,0,0.25)]">
                <span>{detailVenue.icon}</span>
                <span>{detailVenue.category}</span>
              </div>
              {detailVenue.isActive && (
                <div className="bg-[#98B661] text-white border border-black px-3 py-1.5 rounded-full text-sm font-semibold shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]">
                  Active now
                </div>
              )}
            </div>

            {/* Date / time */}
            <div className="px-4 pt-3">
              <div className="border border-black px-4 py-2 text-xs font-bold text-black inline-block">
                {detailVenue.dateTime}
              </div>
            </div>

            {/* Action button — CANCEL EVENT (เจ้าของ) / LEAVE (กำลัง join) / JOIN NOW (อื่นๆ) */}
            <div className="px-4 pt-4 pb-5 flex justify-center">
              {detailVenue.isUserCreated ? (
                <button
                  type="button"
                  onClick={removeActiveVenue}
                  className="w-2/3 bg-[#EA4335] border border-black text-white font-extrabold text-base py-3 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)] hover:opacity-90 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  CANCEL EVENT
                </button>
              ) : activeJoinedVenue?.id === detailVenue.id ? (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="w-2/3 bg-[#EA4335] border border-black text-white font-extrabold text-base py-3 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)] hover:opacity-90 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  LEAVE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleJoinNow(detailVenue)}
                  className="w-2/3 bg-[#98B661] border border-black text-white font-extrabold text-base py-3 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)] hover:opacity-90 active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  JOIN NOW
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Joined Event Card — ถ้ามี active user venue อยู่ด้วย จะ stack ขึ้นไปด้านบน */}
      {activeJoinedVenue && (
        <div
          className="fixed left-3 right-3 z-[9000] flex justify-center pointer-events-none"
          style={{ bottom: activeUserVenue ? '170px' : '80px' }}
        >
          <div
            onClick={() => openDetail(activeJoinedVenue)}
            className="pointer-events-auto bg-white border border-black rounded-full shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center gap-3 pl-2 pr-2 py-1.5 max-w-[600px] w-full cursor-pointer hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.25)] transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFE0B2] to-[#FFCC80] border border-black flex items-center justify-center flex-shrink-0">
              <span className="text-3xl leading-none">{activeJoinedVenue.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-[#FFCC80] border border-black px-3 py-0.5 rounded-full inline-block text-[11px] font-semibold text-black mb-0.5 italic">
                Joined
              </div>
              <h3 className="text-base font-extrabold text-black truncate leading-tight">
                {activeJoinedVenue.name}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold truncate uppercase">
                {activeJoinedVenue.location || activeJoinedVenue.nameEn}
              </p>
            </div>
            <div className="bg-black text-white px-3 py-2 rounded-full flex items-center gap-1.5 text-sm font-bold flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
              <span>{activeJoinedVenue.count}/{activeJoinedVenue.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Event Card — z ต่ำกว่า details popup (z-9998) เพื่อให้ sheet ทับได้ */}
      {activeUserVenue && (
        <div className="fixed bottom-[80px] left-3 right-3 z-[9000] flex justify-center pointer-events-none">
          <div
            onClick={() => openDetail(activeUserVenue)}
            className="pointer-events-auto bg-white border border-black rounded-full shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center gap-3 pl-2 pr-2 py-1.5 max-w-[600px] w-full cursor-pointer hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.25)] transition-shadow"
          >
            {/* Sport icon circle */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFE0B2] to-[#FFCC80] border border-black flex items-center justify-center flex-shrink-0">
              <span className="text-3xl leading-none">{activeUserVenue.icon}</span>
            </div>

            {/* Middle: pill + name + location */}
            <div className="flex-1 min-w-0">
              <div className="bg-[#C5DC8E] border border-black px-3 py-0.5 rounded-full inline-block text-[11px] font-semibold text-black mb-0.5 italic">
                Active now
              </div>
              <h3 className="text-base font-extrabold text-black truncate leading-tight">
                {activeUserVenue.name}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold truncate uppercase">
                {activeUserVenue.location}
              </p>
            </div>

            {/* Right: count badge */}
            <div className="bg-black text-white px-3 py-2 rounded-full flex items-center gap-1.5 text-sm font-bold flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
              </svg>
              <span>{activeUserVenue.count}/{activeUserVenue.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#F3F2EB] border-t border-gray-950 p-2 flex justify-center items-center">
        {activeUserVenue ? (
          <button
            type="button"
            disabled
            title="You already have an active event"
            className="bg-[#F8B347]/40 rounded-full w-12 h-12 flex items-center justify-center text-gray-500 border border-gray-400 cursor-not-allowed"
          >
            <span className="font-bold text-[24px] leading-none">+</span>
          </button>
        ) : (
          <a
            href="/create"
            title="Create New Event"
            className="bg-[#F8B347] rounded-full w-12 h-12 flex items-center justify-center text-gray-950 border border-gray-950 hover:opacity-90"
          >
            <span className="font-bold text-[24px] leading-none">+</span>
          </a>
        )}
      </div>
    </>
  );
}
