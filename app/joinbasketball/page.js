'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Minigame: swipe up → ลูกบาสพุ่งเข้าห่วง → join สำเร็จ
export default function JoinBasketballPage() {
  const router = useRouter()
  const [phase, setPhase] = useState('idle') // 'idle' | 'shooting' | 'success'
  const [venue, setVenue] = useState(null)
  const startY = useRef(null)

  useEffect(() => {
    // อ่าน venue ที่กำลังจะ join (set จากหน้า home ก่อน navigate มา)
    let v = null
    try {
      const raw = localStorage.getItem('pendingJoinVenue')
      if (raw) v = JSON.parse(raw)
    } catch {}
    if (!v) {
      router.replace('/home')
      return
    }
    setVenue(v)
  }, [router])

  function handleStart(clientY) {
    if (phase !== 'idle') return
    startY.current = clientY
  }

  function handleEnd(clientY) {
    if (phase !== 'idle' || startY.current === null) return
    const delta = startY.current - clientY // > 0 = swipe up
    startY.current = null
    if (delta > 30) shoot()
  }

  function shoot() {
    setPhase('shooting')
    // หลัง animation จบ → success
    setTimeout(() => setPhase('success'), 900)
    // หลัง success → save + กลับ home
    setTimeout(() => {
      if (venue) {
        try {
          localStorage.setItem('activeJoinedVenue', JSON.stringify(venue))
          localStorage.removeItem('pendingJoinVenue')
        } catch {}
      }
      router.push('/home')
    }, 2200)
  }

  return (
    <main
      className="min-h-screen w-full flex justify-center overflow-hidden touch-none select-none"
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientY)}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseUp={(e) => handleEnd(e.clientY)}
      style={{
        // รูปสนามบาสขนาด "เท่าหน้ามือถือ" (cap ที่ 450px) + gradient เติมรอบๆ
        background:
          'url(/join/basketballcourt.png) center center / min(100%, 450px) auto no-repeat, linear-gradient(180deg, #E8856E 0%, #F0A574 35%, #F5C396 60%, #FCE7C9 100%)',
      }}
    >
      {/* Inner container — จำกัดความกว้างขนาด mobile (max-w-md) สำหรับ ball + texts */}
      <div className="relative w-full max-w-md min-h-screen overflow-hidden">
      {/* Hoop overlay — รูปห่วงบาส อยู่ตรงกลางส่วนบน (ตามตำแหน่งกรอบแดงที่วาดไว้) */}
      <img
        src="/join/hoop.png"
        alt=""
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          maxWidth: '300px',
        }}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
      {/* Idle hint */}
      {phase === 'idle' && (
        <p className="absolute left-0 right-0 text-center text-black font-extrabold tracking-wider text-base"
           style={{ bottom: '38%' }}>
          SWIPE UP TO JOIN
        </p>
      )}

      {/* Success message */}
      {phase === 'success' && (
        <p className="absolute left-0 right-0 text-center text-black font-extrabold tracking-wider text-base"
           style={{ top: '42%' }}>
          YOU JOINED NOW!
        </p>
      )}

      {/* Basketball — กลางจอ → swipe ขึ้น → พุ่งไปข้างบนพร้อมหดเล็กลง (perspective) */}
      {/* ใช้ % ของ container (max-w-md) ไม่ใช้ vw เพื่อไม่ให้ใหญ่เกินบน desktop */}
      <div
        className="absolute transition-all ease-out pointer-events-none"
        style={{
          width: phase === 'idle' ? '60%' : '18%',
          left: '50%',
          bottom: phase === 'idle' ? '0' : 'auto',
          top: phase === 'idle' ? 'auto' : '5%',
          transform: phase === 'idle'
            ? 'translate(-50%, 50%) rotate(0deg)' // ดันลงครึ่งลูก → เห็นแค่ครึ่งบน
            : 'translateX(-50%) rotate(720deg)',
          transitionDuration: phase === 'shooting' ? '900ms' : '500ms',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.4, 1)',
        }}
      >
        <img
          src="/join/basketball.png"
          alt="basketball"
          className="w-full h-auto"
          draggable="false"
          onError={(e) => {
            // Fallback ถ้าไม่มีรูป — แสดง emoji ขนาดเต็มกล่อง
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement.innerHTML =
              '<div style="font-size:100%; aspect-ratio:1/1; display:flex; align-items:center; justify-content:center;"><span style="font-size:5em;">🏀</span></div>'
          }}
        />
      </div>

      {/* Cancel link เผื่ออยากกลับ */}
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="absolute top-4 right-4 bg-white text-black text-xs font-bold border border-black px-3 py-1.5 rounded-full pointer-events-auto hover:bg-neutral-200 hover:text-black transition-colors shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]"
      >
        CANCEL
      </button>
      </div>
    </main>
  )
}
