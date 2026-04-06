'use client'

import dynamic from 'next/dynamic'

const MapClient = dynamic(
  () => import('@/components/Map/MapClient'),
  { ssr: false }
)

export default function MapWrapper() {
  return <MapClient />
}