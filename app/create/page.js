'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationPicker from '@/components/Map/LocationPicker'

// Format YYYY-MM-DD + HH:MM range → "30 MAR 16:00 - 18:00"
function formatDateTime(date, startTime, endTime) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  let datePart = ''
  if (date) {
    const d = new Date(date + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      datePart = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`
    }
  }
  const timePart = [startTime, endTime].filter(Boolean).join(' - ')
  return [datePart, timePart].filter(Boolean).join(' ')
}

// แก้รายการ sport ได้ที่นี่
const SPORTS = [
  { id: 'polo', label: 'polo', icon: '🏑' },
  { id: 'basketball', label: 'basketball', icon: '🏀' },
  { id: 'tennis', label: 'tennis', icon: '🎾' },
  { id: 'football', label: 'football', icon: '⚽' },
  { id: 'golf', label: 'golf', icon: '⛳' },
  { id: 'badminton', label: 'badminton', icon: '🏸' },
  { id: 'snooker', label: 'snooker', icon: '🎱' },
  { id: 'volleyball', label: 'volleyball', icon: '🏐' },
  { id: 'baseball', label: 'baseball', icon: '⚾' },
]

export default function CreatePage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [sportSearch, setSportSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState(null)
  const [date, setDate] = useState('')          // YYYY-MM-DD จาก native picker
  const [startTime, setStartTime] = useState('') // HH:MM
  const [endTime, setEndTime] = useState('')     // HH:MM
  const [maxPlayers, setMaxPlayers] = useState('')
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  const filteredSports = SPORTS.filter((s) =>
    s.label.toLowerCase().includes(sportSearch.toLowerCase())
  )

  function handleCreate() {
    setError('')
    // ห้ามสร้างซ้ำถ้ามี event อยู่แล้ว
    if (localStorage.getItem('activeUserVenue')) {
      return setError('You already have an active event. End it first.')
    }
    if (!eventName.trim()) return setError('Please enter an event name')
    if (!selectedSport) return setError('Please select a sport')
    if (!location?.lat) return setError('Please tap the map to select a location')

    const newVenue = {
      id: `user-${Date.now()}`,
      name: eventName.trim(),
      nameEn: selectedSport.label,
      location: location.name || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
      category: selectedSport.label.toUpperCase(),
      dateTime: formatDateTime(date, startTime, endTime),
      lat: location.lat,
      lon: location.lon,
      count: 0,
      total: parseInt(maxPlayers, 10) || 10,
      image: '',
      icon: selectedSport.icon,
      isActive: true,
      isUserCreated: true,
    }

    // เก็บแบบ single — หน้า /home อ่านมาวาด marker + แสดง card
    localStorage.setItem('activeUserVenue', JSON.stringify(newVenue))

    router.push('/home')
  }

  return (
    <main className="min-h-screen w-full bg-[#F8B347]">
      <div className="max-w-md mx-auto px-5 pt-6 pb-10">
        <h1 className="text-2xl font-extrabold text-black mb-5">Create your own match</h1>

        {/* Event Name */}
        <label className="text-sm font-bold text-black mb-1 block">Event Name</label>
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="TYPE HERE"
          className="w-full bg-[#F3F2EB] border border-black px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none mb-4"
        />

        {/* Sport */}
        <label className="text-sm font-bold text-black mb-1 block">Select Your Sport</label>
        <input
          value={sportSearch}
          onChange={(e) => setSportSearch(e.target.value)}
          placeholder="SEARCH YOUR SPORT"
          className="w-full bg-[#F3F2EB] border border-black px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none mb-1"
        />
        <div className="flex justify-end pr-1 mb-1 text-black/70 text-base">›</div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-thin">
          {filteredSports.map((sport) => {
            const active = selectedSport?.id === sport.id
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`flex-shrink-0 w-[68px] h-[68px] bg-[#F3F2EB] rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                  active ? 'border-2 border-black shadow-[0px_3px_0px_0px_rgba(0,0,0,1)]' : 'border border-black'
                }`}
              >
                <span className="text-2xl leading-none">{sport.icon}</span>
                <span className="text-[9px] text-black font-medium">{sport.label}</span>
              </button>
            )
          })}
          {filteredSports.length === 0 && (
            <span className="text-sm text-black/60 px-2 self-center">No sport found</span>
          )}
        </div>

        {/* Date + Time — ใช้ native picker (popup ขึ้นเอง) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm font-bold text-black mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#F3F2EB] border border-black px-3 py-3 text-sm text-black outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black mb-1 block">Time</label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-label="Start time"
                className="flex-1 min-w-0 bg-[#F3F2EB] border border-black px-2 py-3 text-sm text-black outline-none"
              />
              <span className="text-black font-bold">-</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-label="End time"
                className="flex-1 min-w-0 bg-[#F3F2EB] border border-black px-2 py-3 text-sm text-black outline-none"
              />
            </div>
          </div>
        </div>

        {/* Number of players */}
        <div className="flex justify-end pr-1 mb-1 text-black/70 text-base">›</div>
        <label className="text-sm font-bold text-black mb-1 block">Number of Players</label>
        <input
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          placeholder="Max 50"
          type="number"
          min="1"
          max="50"
          className="w-full bg-[#F3F2EB] border border-black px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none mb-4"
        />

        {/* Location */}
        <label className="text-sm font-bold text-black mb-2 block">Select Your Location</label>
        <LocationPicker onChange={setLocation} />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-700 mt-3 text-center font-bold">{error}</p>
        )}

        {/* Create */}
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={handleCreate}
            className="bg-black text-white font-extrabold text-base py-3 px-14 hover:opacity-90 active:translate-y-[1px] transition-transform"
          >
            CREATE
          </button>
        </div>
      </div>
    </main>
  )
}
