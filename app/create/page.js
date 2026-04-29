'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LocationPicker from '@/components/Map/LocationPicker'

// แก้รายการ sport ได้ที่นี่
const SPORTS = [
  { id: 'polo', label: 'Polo', icon: '🏑' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'snooker', label: 'Snooker', icon: '🎱' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { id: 'baseball', label: 'Baseball', icon: '⚾' },
]

export default function CreatePage() {
  const router = useRouter()
  const [eventName, setEventName] = useState('')
  const [sportSearch, setSportSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
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
      dateTime: [date, time].filter(Boolean).join(' '),
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
                <span className="text-[9px] text-black font-semibold">{sport.label}</span>
              </button>
            )
          })}
          {filteredSports.length === 0 && (
            <span className="text-sm text-black/60 px-2 self-center">No sport found</span>
          )}
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm font-bold text-black mb-1 block">Date</label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full bg-[#F3F2EB] border border-black px-3 py-3 text-sm text-black placeholder:text-gray-400 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-black mb-1 block">Time</label>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="0.00 - 0.00"
              className="w-full bg-[#F3F2EB] border border-black px-3 py-3 text-sm text-black placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Number of players */}
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
