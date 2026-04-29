{/* Import Map Component from MapWrapper */}

import MapWrapper from '@/components/Map/MapWrapper'

export default function Home() {

{/* Use Function MapWrapper */}
  return (
    <main className="relative w-full h-screen">
      <MapWrapper />
    </main>
  )
}
